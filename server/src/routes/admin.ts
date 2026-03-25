import { Router, Request, Response } from 'express';
import { z } from 'zod';
import slugify from 'slugify';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

export const adminRoutes = Router();

// Dashboard
adminRoutes.get('/dashboard', async (_req: Request, res: Response) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    todayOrders,
    totalOrders,
    pendingOrders,
    recentOrders,
    todayRevenue,
    totalRevenue,
    totalProducts,
    lowStockProducts,
  ] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: today } } }),
    prisma.order.count(),
    prisma.order.count({ where: { status: 'placed' } }),
    prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { items: true },
    }),
    prisma.order.aggregate({
      where: { createdAt: { gte: today }, paymentStatus: 'paid' },
      _sum: { total: true },
    }),
    prisma.order.aggregate({
      where: { paymentStatus: 'paid' },
      _sum: { total: true },
    }),
    prisma.product.count({ where: { active: true } }),
    prisma.product.count({ where: { stock: { lte: 5 }, active: true } }),
  ]);

  res.json({
    todayOrders,
    todayRevenue: todayRevenue._sum.total || 0,
    totalOrders,
    totalRevenue: totalRevenue._sum.total || 0,
    pendingOrders,
    recentOrders,
    totalProducts,
    lowStockProducts,
  });
});

// Products
adminRoutes.get('/products', async (req: Request, res: Response) => {
  const { page = '1', limit = '20', search } = req.query;
  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);

  const where: Record<string, unknown> = {};
  if (search) {
    where.name = { contains: search, mode: 'insensitive' };
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: { createdAt: 'desc' },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    }),
    prisma.product.count({ where }),
  ]);

  res.json({ products, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
});

const productSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().positive(),
  comparePrice: z.number().positive().optional(),
  images: z.array(z.string()).default([]),
  categoryId: z.string().optional(),
  sizes: z.array(z.string()).default([]),
  colors: z.array(z.string()).default([]),
  fabric: z.string().optional(),
  occasion: z.array(z.string()).default([]),
  stock: z.number().int().min(0).default(0),
  featured: z.boolean().default(false),
  bestSeller: z.boolean().default(false),
  onOffer: z.boolean().default(false),
  offerPercent: z.number().int().min(0).max(100).optional(),
  active: z.boolean().default(true),
});

adminRoutes.get('/products/:id', async (req: Request, res: Response) => {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: { category: true },
  });
  if (!product) throw new AppError(404, 'Product not found');
  res.json(product);
});

adminRoutes.post('/products', async (req: Request, res: Response) => {
  const data = productSchema.parse(req.body);
  const slug = slugify(data.name, { lower: true, strict: true });

  const existing = await prisma.product.findUnique({ where: { slug } });
  const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

  const product = await prisma.product.create({
    data: { ...data, slug: finalSlug },
    include: { category: true },
  });

  res.status(201).json(product);
});

adminRoutes.put('/products/:id', async (req: Request, res: Response) => {
  const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new AppError(404, 'Product not found');

  const data = productSchema.partial().parse(req.body);

  const product = await prisma.product.update({
    where: { id: req.params.id },
    data,
    include: { category: true },
  });

  res.json(product);
});

adminRoutes.delete('/products/:id', async (req: Request, res: Response) => {
  const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new AppError(404, 'Product not found');

  await prisma.product.update({
    where: { id: req.params.id },
    data: { active: false },
  });

  res.json({ success: true });
});

// Orders
adminRoutes.get('/orders', async (req: Request, res: Response) => {
  const { status, page = '1', limit = '20' } = req.query;
  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);

  const where: Record<string, unknown> = {};
  if (status && status !== 'all') where.status = status;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    }),
    prisma.order.count({ where }),
  ]);

  res.json({ orders, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
});

adminRoutes.get('/orders/export', async (_req: Request, res: Response) => {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    include: { items: true },
  });

  const rows = [
    ['Order Number', 'Customer', 'Phone', 'Email', 'Status', 'Payment', 'Total', 'Shipping', 'Discount', 'Date', 'Items'].join(','),
    ...orders.map((o) => [
      o.orderNumber,
      `"${o.customerName}"`,
      o.customerPhone,
      o.customerEmail || '',
      o.status,
      o.paymentMethod,
      Number(o.total).toFixed(2),
      Number(o.shipping).toFixed(2),
      Number(o.discount).toFixed(2),
      new Date(o.createdAt).toLocaleDateString('en-IN'),
      o.items.length,
    ].join(',')),
  ].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="orders-${Date.now()}.csv"`);
  res.send(rows);
});

adminRoutes.patch('/products/:id/stock', async (req: Request, res: Response) => {
  const { stock } = z.object({ stock: z.number().int().min(0) }).parse(req.body);
  const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new AppError(404, 'Product not found');

  const updated = await prisma.product.update({
    where: { id: req.params.id },
    data: { stock },
  });
  res.json(updated);
});

adminRoutes.put('/orders/:id/status', async (req: Request, res: Response) => {
  const { status, trackingId } = z
    .object({
      status: z.enum(['placed', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled', 'returned']),
      trackingId: z.string().optional(),
    })
    .parse(req.body);

  const order = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!order) throw new AppError(404, 'Order not found');

  const updated = await prisma.order.update({
    where: { id: req.params.id },
    data: { status, ...(trackingId ? { trackingId } : {}) },
    include: { items: { include: { product: true } } },
  });

  res.json(updated);
});

// Coupons
adminRoutes.get('/coupons', async (_req: Request, res: Response) => {
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(coupons);
});

const couponSchema = z.object({
  code: z.string().min(1).toUpperCase(),
  discount: z.number().int().min(1).max(100),
  minOrder: z.number().positive().optional(),
  maxUses: z.number().int().positive().optional(),
  active: z.boolean().default(true),
  expiresAt: z.string().optional().transform((val) => (val ? new Date(val) : undefined)),
});

adminRoutes.post('/coupons', async (req: Request, res: Response) => {
  const data = couponSchema.parse(req.body);

  const existing = await prisma.coupon.findUnique({ where: { code: data.code } });
  if (existing) throw new AppError(400, 'Coupon code already exists');

  const coupon = await prisma.coupon.create({ data });
  res.status(201).json(coupon);
});

adminRoutes.put('/coupons/:id', async (req: Request, res: Response) => {
  const existing = await prisma.coupon.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new AppError(404, 'Coupon not found');

  const data = couponSchema.partial().parse(req.body);
  const updated = await prisma.coupon.update({ where: { id: req.params.id }, data });
  res.json(updated);
});

adminRoutes.delete('/coupons/:id', async (req: Request, res: Response) => {
  const existing = await prisma.coupon.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new AppError(404, 'Coupon not found');

  await prisma.coupon.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

// Order detail
adminRoutes.get('/orders/:id', async (req: Request, res: Response) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { items: { include: { product: { include: { category: true } } } } },
  });
  if (!order) throw new AppError(404, 'Order not found');
  res.json(order);
});

// Customers
adminRoutes.get('/customers', async (req: Request, res: Response) => {
  const { page = '1', limit = '20', search } = req.query;
  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { customerName: { contains: search, mode: 'insensitive' } },
      { customerPhone: { contains: search as string } },
      { customerEmail: { contains: search, mode: 'insensitive' } },
    ];
  }

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, customerName: true, customerPhone: true, customerEmail: true,
      total: true, status: true, createdAt: true, orderNumber: true,
    },
  });

  // Group by phone to get unique customers
  const customerMap = new Map<string, {
    phone: string; name: string; email?: string | null;
    totalSpend: number; orderCount: number; lastOrder: Date; firstOrder: Date;
  }>();

  for (const o of orders) {
    const existing = customerMap.get(o.customerPhone);
    if (existing) {
      existing.totalSpend += Number(o.total);
      existing.orderCount += 1;
      if (new Date(o.createdAt) > existing.lastOrder) existing.lastOrder = new Date(o.createdAt);
      if (new Date(o.createdAt) < existing.firstOrder) existing.firstOrder = new Date(o.createdAt);
    } else {
      customerMap.set(o.customerPhone, {
        phone: o.customerPhone,
        name: o.customerName,
        email: o.customerEmail,
        totalSpend: Number(o.total),
        orderCount: 1,
        lastOrder: new Date(o.createdAt),
        firstOrder: new Date(o.createdAt),
      });
    }
  }

  const customers = Array.from(customerMap.values())
    .sort((a, b) => b.totalSpend - a.totalSpend);

  const total = customers.length;
  const paginated = customers.slice((pageNum - 1) * limitNum, pageNum * limitNum);

  res.json({ customers: paginated, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
});

adminRoutes.get('/customers/:phone', async (req: Request, res: Response) => {
  const phone = req.params.phone;
  const orders = await prisma.order.findMany({
    where: { customerPhone: phone },
    include: { items: { include: { product: true } } },
    orderBy: { createdAt: 'desc' },
  });
  if (orders.length === 0) throw new AppError(404, 'Customer not found');
  res.json({
    name: orders[0].customerName,
    phone: orders[0].customerPhone,
    email: orders[0].customerEmail,
    orders,
    totalSpend: orders.reduce((sum, o) => sum + Number(o.total), 0),
  });
});

// Analytics
adminRoutes.get('/analytics', async (req: Request, res: Response) => {
  const { period = '30' } = req.query;
  const days = parseInt(period as string, 10);
  const since = new Date();
  since.setDate(since.getDate() - days);

  const [orders, topProducts, revenueByPayment] = await Promise.all([
    prisma.order.findMany({
      where: { createdAt: { gte: since }, paymentStatus: 'paid' },
      select: { total: true, createdAt: true, paymentMethod: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.orderItem.groupBy({
      by: ['productId', 'name'],
      _sum: { quantity: true },
      _count: true,
      orderBy: { _sum: { quantity: 'desc' } },
      take: 10,
    }),
    prisma.order.groupBy({
      by: ['paymentMethod'],
      where: { paymentStatus: 'paid' },
      _sum: { total: true },
      _count: true,
    }),
  ]);

  // Daily revenue chart
  const dailyMap = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dailyMap.set(d.toISOString().slice(0, 10), 0);
  }
  for (const o of orders) {
    const key = new Date(o.createdAt).toISOString().slice(0, 10);
    dailyMap.set(key, (dailyMap.get(key) || 0) + Number(o.total));
  }
  const dailyRevenue = Array.from(dailyMap.entries()).map(([date, revenue]) => ({ date, revenue }));

  res.json({
    totalRevenue: orders.reduce((sum, o) => sum + Number(o.total), 0),
    totalOrders: orders.length,
    avgOrderValue: orders.length > 0 ? orders.reduce((sum, o) => sum + Number(o.total), 0) / orders.length : 0,
    dailyRevenue,
    topProducts,
    revenueByPayment,
  });
});

// Categories
adminRoutes.post('/categories', async (req: Request, res: Response) => {
  const { name, image } = z.object({ name: z.string().min(1), image: z.string().optional() }).parse(req.body);
  const slug = slugify(name, { lower: true, strict: true });

  const category = await prisma.category.create({ data: { name, slug, image } });
  res.status(201).json(category);
});

adminRoutes.put('/categories/:id', async (req: Request, res: Response) => {
  const { name, image } = z.object({ name: z.string().optional(), image: z.string().optional() }).parse(req.body);
  const existing = await prisma.category.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new AppError(404, 'Category not found');

  const data: Record<string, unknown> = {};
  if (name) { data.name = name; data.slug = slugify(name, { lower: true, strict: true }); }
  if (image !== undefined) data.image = image;

  const updated = await prisma.category.update({ where: { id: req.params.id }, data });
  res.json(updated);
});
