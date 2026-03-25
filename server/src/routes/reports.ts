import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

export const reportRoutes = Router();

function toCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(','),
    ...rows.map((row) =>
      headers.map((h) => {
        const val = row[h];
        const s = val == null ? '' : String(val);
        return s.includes(',') || s.includes('"') || s.includes('\n')
          ? `"${s.replace(/"/g, '""')}"`
          : s;
      }).join(',')
    ),
  ];
  return lines.join('\n');
}

// GET /api/reports/sales?month=2026-03 — monthly sales CSV
reportRoutes.get('/sales', async (req: Request, res: Response) => {
  const { month, format = 'json' } = req.query;
  let startDate: Date;
  let endDate: Date;

  if (month) {
    const [year, mon] = (month as string).split('-').map(Number);
    startDate = new Date(year, mon - 1, 1);
    endDate = new Date(year, mon, 1);
  } else {
    const now = new Date();
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  }

  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: startDate, lt: endDate },
      paymentStatus: 'paid',
    },
    include: { items: true },
    orderBy: { createdAt: 'asc' },
  });

  const rows = orders.map((o) => ({
    orderNumber: o.orderNumber,
    date: o.createdAt.toISOString().split('T')[0],
    customerName: o.customerName,
    customerPhone: o.customerPhone,
    items: o.items.length,
    subtotal: Number(o.subtotal),
    shipping: Number(o.shipping),
    discount: Number(o.discount),
    total: Number(o.total),
    paymentMethod: o.paymentMethod,
    status: o.status,
  }));

  const totalRevenue = rows.reduce((sum, r) => sum + r.total, 0);
  const totalOrders = rows.length;

  if (format === 'csv') {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="sales-${month || 'current'}.csv"`);
    return res.send(toCSV(rows));
  }

  res.json({ orders: rows, summary: { totalOrders, totalRevenue, period: { startDate, endDate } } });
});

// GET /api/reports/customers — customer acquisition report
reportRoutes.get('/customers', async (req: Request, res: Response) => {
  const { format = 'json' } = req.query;

  const customers = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { orders: true } } },
  });

  const rows = customers.map((c) => ({
    id: c.id,
    name: c.name || '',
    email: c.email || '',
    phone: c.phone || '',
    orders: c._count.orders,
    joinedAt: c.createdAt.toISOString().split('T')[0],
  }));

  if (format === 'csv') {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="customers.csv"');
    return res.send(toCSV(rows));
  }

  res.json(rows);
});

// GET /api/reports/products — product performance
reportRoutes.get('/products', async (req: Request, res: Response) => {
  const { format = 'json' } = req.query;

  const products = await prisma.product.findMany({
    where: { active: true },
    include: {
      _count: { select: { orderItems: true } },
      orderItems: { select: { quantity: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const rows = products.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.categoryId || '',
    price: Number(p.price),
    stock: p.stock,
    totalOrders: p._count.orderItems,
    unitsSold: p.orderItems.reduce((sum, i) => sum + i.quantity, 0),
    featured: p.featured,
    bestSeller: p.bestSeller,
  }));

  if (format === 'csv') {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="product-performance.csv"');
    return res.send(toCSV(rows));
  }

  res.json(rows);
});

// GET /api/reports/returns — return rate report
reportRoutes.get('/returns', async (req: Request, res: Response) => {
  const { format = 'json' } = req.query;

  const returns = await prisma.returnRequest.findMany({
    orderBy: { createdAt: 'desc' },
  });

  const rows = returns.map((r) => ({
    id: r.id,
    orderNumber: r.orderNumber,
    customerName: r.customerName,
    customerPhone: r.customerPhone,
    reason: r.reason,
    status: r.status,
    createdAt: r.createdAt.toISOString().split('T')[0],
  }));

  if (format === 'csv') {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="returns.csv"');
    return res.send(toCSV(rows));
  }

  const totalOrders = await prisma.order.count();
  res.json({
    returns: rows,
    summary: {
      totalReturns: rows.length,
      totalOrders,
      returnRate: totalOrders > 0 ? ((rows.length / totalOrders) * 100).toFixed(2) + '%' : '0%',
    },
  });
});

// GET /api/reports/revenue-by-region — revenue by country/state
reportRoutes.get('/revenue-by-region', async (req: Request, res: Response) => {
  const { format = 'json' } = req.query;

  const orders = await prisma.order.findMany({
    where: { paymentStatus: 'paid' },
    select: { country: true, total: true, address: true },
  });

  const byCountry: Record<string, { orders: number; revenue: number }> = {};
  for (const order of orders) {
    const key = order.country || 'IN';
    if (!byCountry[key]) byCountry[key] = { orders: 0, revenue: 0 };
    byCountry[key].orders++;
    byCountry[key].revenue += Number(order.total);
  }

  const rows = Object.entries(byCountry).map(([country, data]) => ({
    country,
    orders: data.orders,
    revenue: data.revenue,
  }));

  if (format === 'csv') {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="revenue-by-region.csv"');
    return res.send(toCSV(rows));
  }

  res.json(rows);
});
