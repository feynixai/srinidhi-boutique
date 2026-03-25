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

// Invoice generation
adminRoutes.get('/orders/:id/invoice', async (req: Request, res: Response) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { items: { include: { product: { include: { category: true } } } } },
  });
  if (!order) throw new AppError(404, 'Order not found');

  const address = order.address as { line1: string; line2?: string; city: string; state: string; pincode: string };
  const subtotal = Number(order.subtotal);
  const gstRate = 0.05; // 5% GST on clothing
  const gstAmount = subtotal * gstRate;
  const formattedDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  const itemRows = order.items.map((item) => {
    const itemTotal = Number(item.price) * item.quantity;
    const itemGst = itemTotal * gstRate;
    return `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #f0e8e8;">${item.name}${item.size ? ` <span style="color:#999;font-size:12px;">(${item.size})</span>` : ''}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f0e8e8;text-align:center;">${item.quantity}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f0e8e8;text-align:right;">₹${Number(item.price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f0e8e8;text-align:right;">₹${itemGst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f0e8e8;text-align:right;font-weight:600;">₹${itemTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
      </tr>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Invoice ${order.orderNumber}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #333; background: #fff; }
  .invoice { max-width: 800px; margin: 0 auto; padding: 40px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 3px solid #B76E79; padding-bottom: 24px; }
  .brand h1 { font-family: Georgia, serif; font-size: 28px; color: #1a1a1a; }
  .brand p { color: #B76E79; font-size: 12px; letter-spacing: 1px; text-transform: uppercase; margin-top: 4px; }
  .brand .gstin { color: #666; font-size: 11px; margin-top: 6px; }
  .invoice-meta { text-align: right; }
  .invoice-meta h2 { font-size: 22px; color: #B76E79; font-weight: 700; letter-spacing: 1px; }
  .invoice-meta p { font-size: 12px; color: #666; margin-top: 4px; }
  .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 32px; }
  .party h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #B76E79; margin-bottom: 8px; font-weight: 600; }
  .party p { font-size: 13px; color: #333; line-height: 1.6; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  th { background: #1a1a1a; color: #fff; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
  th:not(:first-child) { text-align: center; }
  th:last-child, th:nth-child(3), th:nth-child(4) { text-align: right; }
  td { font-size: 13px; color: #333; }
  .totals { margin-left: auto; width: 280px; }
  .totals table { margin: 0; }
  .totals td { padding: 6px 12px; border: none !important; }
  .totals tr:last-child td { font-weight: 700; font-size: 16px; color: #1a1a1a; border-top: 2px solid #B76E79 !important; padding-top: 10px; }
  .footer { margin-top: 40px; border-top: 1px solid #f0e8e8; padding-top: 20px; text-align: center; color: #999; font-size: 12px; }
  .badge { display: inline-block; background: #f0e8e8; color: #B76E79; padding: 2px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
  @media print { .invoice { padding: 20px; } .no-print { display: none; } }
</style>
</head>
<body>
<div class="invoice">
  <div class="header">
    <div class="brand">
      <h1>Srinidhi Boutique</h1>
      <p>Premium Women's Ethnic Fashion</p>
      <p style="color:#666;font-size:12px;margin-top:6px;">Hyderabad, Telangana — 500001</p>
      <p class="gstin">GSTIN: 36XXXXX0000X1Z5</p>
    </div>
    <div class="invoice-meta">
      <h2>TAX INVOICE</h2>
      <p><strong>${order.orderNumber}</strong></p>
      <p>Date: ${formattedDate}</p>
      <p style="margin-top:8px;"><span class="badge">${order.status.toUpperCase()}</span></p>
    </div>
  </div>

  <div class="parties">
    <div class="party">
      <h3>Bill To</h3>
      <p><strong>${order.customerName}</strong></p>
      <p>${order.customerPhone}</p>
      ${order.customerEmail ? `<p>${order.customerEmail}</p>` : ''}
      <p style="margin-top:4px;">${address.line1}${address.line2 ? ', ' + address.line2 : ''}</p>
      <p>${address.city}, ${address.state} — ${address.pincode}</p>
    </div>
    <div class="party" style="text-align:right;">
      <h3>Payment</h3>
      <p><strong>Method:</strong> ${order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod === 'razorpay' ? 'Razorpay (Online)' : 'UPI'}</p>
      <p><strong>Status:</strong> ${order.paymentStatus}</p>
      ${order.paymentId ? `<p style="font-size:11px;color:#999;margin-top:4px;">Ref: ${order.paymentId}</p>` : ''}
      ${order.couponCode ? `<p style="margin-top:4px;"><strong>Coupon:</strong> ${order.couponCode}</p>` : ''}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:40%;">Item</th>
        <th style="width:10%;text-align:center;">Qty</th>
        <th style="width:15%;text-align:right;">Rate</th>
        <th style="width:15%;text-align:right;">GST (5%)</th>
        <th style="width:20%;text-align:right;">Amount</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>

  <div class="totals">
    <table>
      <tr><td>Subtotal</td><td style="text-align:right;">₹${subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>
      <tr><td>GST @ 5%</td><td style="text-align:right;">₹${gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>
      <tr><td>Shipping</td><td style="text-align:right;">${Number(order.shipping) === 0 ? '<span style="color:green;">FREE</span>' : '₹' + Number(order.shipping).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>
      ${Number(order.discount) > 0 ? `<tr><td>Discount</td><td style="text-align:right;color:green;">-₹${Number(order.discount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>` : ''}
      ${order.paymentMethod === 'cod' ? `<tr><td>COD Charge</td><td style="text-align:right;">₹50.00</td></tr>` : ''}
      <tr><td><strong>Total</strong></td><td style="text-align:right;"><strong>₹${Number(order.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></td></tr>
    </table>
  </div>

  <div class="footer">
    <p>Thank you for shopping with Srinidhi Boutique!</p>
    <p style="margin-top:4px;">For queries: +91-XXXXXXXXXX | srinidhiboutique@gmail.com</p>
    <p style="margin-top:8px;font-style:italic;">This is a computer-generated invoice and does not require a signature.</p>
  </div>
</div>
<script class="no-print">
  // Auto-print when opened directly
  if (window.location.search.includes('print=1')) window.print();
</script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  res.send(html);
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
