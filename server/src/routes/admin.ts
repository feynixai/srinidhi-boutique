import { Router, Request, Response } from 'express';
import { z } from 'zod';
import slugify from 'slugify';
import multer from 'multer';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

export const adminRoutes = Router();

// Dashboard
adminRoutes.get('/dashboard', async (_req: Request, res: Response) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - 6); // last 7 days

  const monthStart = new Date(today);
  monthStart.setDate(1); // 1st of current month

  const [
    todayOrders,
    totalOrders,
    pendingOrders,
    recentOrders,
    todayRevenue,
    totalRevenue,
    totalProducts,
    lowStockProducts,
    weekOrdersAgg,
    weekRevenueAgg,
    monthOrdersAgg,
    monthRevenueAgg,
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
    prisma.order.count({ where: { createdAt: { gte: weekStart } } }),
    prisma.order.aggregate({
      where: { createdAt: { gte: weekStart }, paymentStatus: 'paid' },
      _sum: { total: true },
    }),
    prisma.order.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.order.aggregate({
      where: { createdAt: { gte: monthStart }, paymentStatus: 'paid' },
      _sum: { total: true },
    }),
  ]);

  res.json({
    todayOrders,
    todayRevenue: todayRevenue._sum.total || 0,
    weekOrders: weekOrdersAgg,
    weekRevenue: weekRevenueAgg._sum.total || 0,
    monthOrders: monthOrdersAgg,
    monthRevenue: monthRevenueAgg._sum.total || 0,
    totalOrders,
    totalRevenue: totalRevenue._sum.total || 0,
    pendingOrders,
    recentOrders,
    totalProducts,
    lowStockProducts,
  });
});

// ── Build 15: Dashboard Widgets ───────────────────────────────────────────────

adminRoutes.get('/dashboard/widgets', async (_req: Request, res: Response) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const week7Start = new Date(today);
  week7Start.setDate(today.getDate() - 6);
  const week30Start = new Date(today);
  week30Start.setDate(today.getDate() - 29);

  const [
    todayOrders,
    todayRevenueAgg,
    totalProducts,
    lowStockCount,
    pendingReturnsCount,
    unreadChatsCount,
    pendingReviewsCount,
    topSellingProductsRaw,
    recentOrders,
    weekRevenue7Agg,
    weekRevenue30Agg,
  ] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: today } } }),
    prisma.order.aggregate({ where: { createdAt: { gte: today } }, _sum: { total: true } }),
    prisma.product.count({ where: { active: true } }),
    prisma.product.count({ where: { stock: { lte: 5 }, active: true } }),
    prisma.returnRequest.count({ where: { status: 'pending' } }),
    prisma.chatMessage.count({ where: { status: 'open' } }),
    prisma.review.count({ where: { approved: false } }),
    prisma.orderItem.groupBy({
      by: ['productId', 'name'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    }),
    prisma.order.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }),
    prisma.order.aggregate({ where: { createdAt: { gte: week7Start } }, _sum: { total: true } }),
    prisma.order.aggregate({ where: { createdAt: { gte: week30Start } }, _sum: { total: true } }),
  ]);

  const topSellingProducts = topSellingProductsRaw.map((p) => ({
    productId: p.productId,
    name: p.name,
    totalSold: p._sum.quantity ?? 0,
  }));

  res.json({
    todayOrders,
    todayRevenue: Number(todayRevenueAgg._sum.total ?? 0),
    totalProducts,
    lowStockCount,
    pendingReturnsCount,
    unreadChatsCount,
    pendingReviewsCount,
    topSellingProducts,
    recentOrders,
    weekRevenue7: Number(weekRevenue7Agg._sum.total ?? 0),
    weekRevenue30: Number(weekRevenue30Agg._sum.total ?? 0),
  });
});

// ── Build 15: Revenue Chart ───────────────────────────────────────────────────

adminRoutes.get('/revenue-chart', async (req: Request, res: Response) => {
  const rawDays = parseInt((req.query.days as string) || '7', 10);
  const days = Math.min(isNaN(rawDays) ? 7 : rawDays, 90);
  const since = new Date();
  since.setDate(since.getDate() - (days - 1));
  since.setHours(0, 0, 0, 0);

  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: since } },
    select: { total: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  const dailyMap = new Map<string, { revenue: number; orders: number }>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dailyMap.set(d.toISOString().slice(0, 10), { revenue: 0, orders: 0 });
  }
  for (const o of orders) {
    const key = new Date(o.createdAt).toISOString().slice(0, 10);
    const entry = dailyMap.get(key);
    if (entry) {
      entry.revenue += Number(o.total);
      entry.orders += 1;
    }
  }

  const chart = Array.from(dailyMap.entries()).map(([date, v]) => ({
    date,
    revenue: v.revenue,
    orders: v.orders,
  }));

  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total), 0);
  res.json({ days, chart, totalRevenue });
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

// ── Build 15: Product Analytics ───────────────────────────────────────────────

adminRoutes.get('/products/analytics', async (req: Request, res: Response) => {
  const { sort = 'revenue', limit } = req.query;
  const validSorts = ['revenue', 'orders', 'rating'];
  if (!validSorts.includes(sort as string)) throw new AppError(400, 'Invalid sort. Use: revenue, orders, rating');

  const limitNum = limit ? parseInt(limit as string, 10) : undefined;

  const products = await prisma.product.findMany({
    where: { active: true },
    select: {
      id: true,
      name: true,
      orderItems: { select: { price: true, quantity: true } },
      reviews: { where: { approved: true }, select: { rating: true } },
    },
  });

  let analytics = products.map((p) => {
    const orders = p.orderItems.length;
    const revenue = p.orderItems.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
    const avgRating =
      p.reviews.length > 0
        ? Math.round((p.reviews.reduce((sum, r) => sum + r.rating, 0) / p.reviews.length) * 10) / 10
        : 0;
    const underperforming = orders < 5 && revenue < 5000;
    return { productId: p.id, name: p.name, orders, revenue, avgRating, underperforming };
  });

  if (sort === 'revenue') analytics.sort((a, b) => b.revenue - a.revenue);
  else if (sort === 'orders') analytics.sort((a, b) => b.orders - a.orders);
  else if (sort === 'rating') analytics.sort((a, b) => b.avgRating - a.avgRating);

  if (limitNum) analytics = analytics.slice(0, limitNum);

  const underperformingCount = analytics.filter((a) => a.underperforming).length;
  res.json({ analytics, total: analytics.length, sort, underperformingCount });
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

// ── Build 15: Product Cross-sell / Complete-look / Details ───────────────────

adminRoutes.patch('/products/:id/cross-sell', async (req: Request, res: Response) => {
  const { productIds } = z.object({ productIds: z.array(z.string()) }).parse(req.body);
  const product = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!product) throw new AppError(404, 'Product not found');

  if (productIds.length > 0) {
    const found = await prisma.product.count({ where: { id: { in: productIds } } });
    if (found !== productIds.length) throw new AppError(404, 'One or more cross-sell products not found');
  }

  const updated = await prisma.product.update({
    where: { id: req.params.id },
    data: { crossSellIds: productIds },
  });
  res.json({ success: true, crossSellIds: updated.crossSellIds });
});

adminRoutes.patch('/products/:id/complete-look', async (req: Request, res: Response) => {
  const { productIds } = z.object({ productIds: z.array(z.string()) }).parse(req.body);
  const product = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!product) throw new AppError(404, 'Product not found');

  if (productIds.length > 0) {
    const found = await prisma.product.count({ where: { id: { in: productIds } } });
    if (found !== productIds.length) throw new AppError(404, 'One or more complete-look products not found');
  }

  const updated = await prisma.product.update({
    where: { id: req.params.id },
    data: { completeLookIds: productIds },
  });
  res.json({ success: true, completeLookIds: updated.completeLookIds });
});

adminRoutes.patch('/products/:id/details', async (req: Request, res: Response) => {
  const { fabricCare, videoUrl } = z
    .object({ fabricCare: z.string().optional(), videoUrl: z.string().optional() })
    .parse(req.body);
  const product = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!product) throw new AppError(404, 'Product not found');

  const updated = await prisma.product.update({
    where: { id: req.params.id },
    data: {
      ...(fabricCare !== undefined ? { fabricCare } : {}),
      ...(videoUrl !== undefined ? { videoUrl } : {}),
    },
  });
  res.json(updated);
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

adminRoutes.get('/orders/export', async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;

  const where: Record<string, unknown> = {};
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) (where.createdAt as Record<string, unknown>).gte = new Date(startDate as string);
    if (endDate) {
      const end = new Date(endDate as string);
      end.setHours(23, 59, 59, 999);
      (where.createdAt as Record<string, unknown>).lte = end;
    }
  }

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { items: { include: { product: true } } },
  });

  const rows = [
    ['Order Number', 'Customer', 'Phone', 'Email', 'Status', 'Payment', 'Total', 'Shipping', 'Discount', 'GST', 'Date', 'Items', 'Item Details'].join(','),
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
      Number((o as Record<string, unknown>).gstAmount ?? 0).toFixed(2),
      new Date(o.createdAt).toLocaleDateString('en-IN'),
      o.items.length,
      `"${o.items.map((i) => `${i.product?.name ?? 'Unknown'} x${i.quantity}`).join('; ')}"`,
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

// ── Build 15: Bulk Ship ───────────────────────────────────────────────────────

adminRoutes.post('/orders/bulk-ship', async (req: Request, res: Response) => {
  const { ids, trackingId } = z
    .object({
      ids: z.array(z.string()).min(1, 'At least one order ID required'),
      trackingId: z.string().min(1, 'trackingId is required'),
    })
    .parse(req.body);

  const result = await prisma.order.updateMany({
    where: { id: { in: ids } },
    data: { status: 'shipped', trackingId },
  });

  res.json({ updated: result.count, trackingId });
});

// Bulk status update — must be before /:id routes
adminRoutes.post('/orders/bulk-status', async (req: Request, res: Response) => {
  const { ids, status } = z
    .object({
      ids: z.array(z.string()).min(1),
      status: z.enum(['placed', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled', 'returned']),
    })
    .parse(req.body);

  const result = await prisma.order.updateMany({
    where: { id: { in: ids } },
    data: { status },
  });

  res.json({ updated: result.count });
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

// Coupon analytics
adminRoutes.get('/coupons/analytics', async (_req: Request, res: Response) => {
  const coupons = await prisma.coupon.findMany({ orderBy: { usedCount: 'desc' } });
  const totalOrders = await prisma.order.count();

  const analytics = coupons.map((c) => ({
    id: c.id,
    code: c.code,
    discount: c.discount,
    usedCount: c.usedCount,
    maxUses: c.maxUses,
    active: c.active,
    expiresAt: c.expiresAt,
    usageRate: c.maxUses ? Math.round((c.usedCount / c.maxUses) * 100) : null,
    orderUsageRate: totalOrders > 0 ? Math.round((c.usedCount / totalOrders) * 100) : 0,
  }));

  const totalCouponsUsed = coupons.reduce((sum, c) => sum + c.usedCount, 0);
  res.json({ analytics, totalCouponsUsed, totalCoupons: coupons.length });
});

// Store-wide sale
adminRoutes.get('/store-sale', async (_req: Request, res: Response) => {
  const sale = await prisma.storeSale.findFirst({ orderBy: { createdAt: 'desc' } });
  res.json(sale || null);
});

adminRoutes.post('/store-sale', async (req: Request, res: Response) => {
  const { discountPct, label, startAt, endAt } = z.object({
    discountPct: z.number().int().min(1).max(90),
    label: z.string().optional(),
    startAt: z.string().optional().transform((v) => v ? new Date(v) : undefined),
    endAt: z.string().optional().transform((v) => v ? new Date(v) : undefined),
  }).parse(req.body);

  // Deactivate any existing active sales
  await prisma.storeSale.updateMany({ where: { active: true }, data: { active: false } });

  const sale = await prisma.storeSale.create({
    data: { discountPct, label, startAt, endAt, active: true },
  });
  res.status(201).json(sale);
});

adminRoutes.patch('/store-sale/:id', async (req: Request, res: Response) => {
  const existing = await prisma.storeSale.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new AppError(404, 'Store sale not found');

  const data = z.object({
    active: z.boolean().optional(),
    discountPct: z.number().int().min(1).max(90).optional(),
    label: z.string().optional(),
    endAt: z.string().optional().transform((v) => v ? new Date(v) : undefined),
  }).parse(req.body);

  const updated = await prisma.storeSale.update({ where: { id: req.params.id }, data });
  res.json(updated);
});

adminRoutes.delete('/store-sale/:id', async (req: Request, res: Response) => {
  const existing = await prisma.storeSale.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new AppError(404, 'Store sale not found');
  await prisma.storeSale.delete({ where: { id: req.params.id } });
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

// ── Build 15: Order Timeline / Advance Status / Shipping Label ────────────────

const STATUS_FLOW = ['placed', 'confirmed', 'packed', 'shipped', 'delivered'] as const;
type OrderStatus = typeof STATUS_FLOW[number];

adminRoutes.get('/orders/:id/timeline', async (req: Request, res: Response) => {
  const order = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!order) throw new AppError(404, 'Order not found');

  const currentIdx = STATUS_FLOW.indexOf(order.status as OrderStatus);
  const safeIdx = currentIdx === -1 ? 0 : currentIdx;
  const nextStatus = safeIdx < STATUS_FLOW.length - 1 ? STATUS_FLOW[safeIdx + 1] : null;
  const canAdvance = nextStatus !== null;

  const timeline = STATUS_FLOW.map((status, idx) => ({
    status,
    completed: idx <= safeIdx,
    current: idx === safeIdx,
  }));

  res.json({ timeline, nextStatus, canAdvance });
});

adminRoutes.post('/orders/:id/advance-status', async (req: Request, res: Response) => {
  const order = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!order) throw new AppError(404, 'Order not found');

  const currentIdx = STATUS_FLOW.indexOf(order.status as OrderStatus);
  if (currentIdx === -1 || currentIdx >= STATUS_FLOW.length - 1) {
    throw new AppError(400, 'Order is already at final status or has an unknown status');
  }

  const nextStatus = STATUS_FLOW[currentIdx + 1];
  const { trackingId } = z.object({ trackingId: z.string().optional() }).parse(req.body);

  const updated = await prisma.order.update({
    where: { id: req.params.id },
    data: { status: nextStatus, ...(trackingId ? { trackingId } : {}) },
  });
  res.json({ advancedTo: nextStatus, order: updated });
});

adminRoutes.get('/orders/:id/shipping-label', async (req: Request, res: Response) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { items: true },
  });
  if (!order) throw new AppError(404, 'Order not found');

  const address = order.address as { line1: string; line2?: string; city: string; state?: string; pincode: string };
  const isCOD = order.paymentMethod === 'cod';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Shipping Label — ${order.orderNumber}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 14px; background: #fff; }
  .label { width: 100mm; border: 2px solid #000; padding: 16px; margin: 20px auto; }
  .brand { font-size: 15px; font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 8px; margin-bottom: 8px; }
  .section { margin-bottom: 10px; }
  .section h3 { font-size: 11px; text-transform: uppercase; color: #555; margin-bottom: 4px; }
  .order-num { font-size: 18px; font-weight: bold; text-align: center; border: 2px solid #000; padding: 6px; margin: 10px 0; }
  .cod-badge { background: #000; color: #fff; text-align: center; padding: 6px; font-weight: bold; font-size: 13px; margin-top: 10px; }
</style>
</head>
<body>
<div class="label">
  <div class="brand">Srinidhi Boutique — Hyderabad, Telangana</div>
  <div class="order-num">${order.orderNumber}</div>
  <div class="section">
    <h3>Ship To</h3>
    <p><strong>${order.customerName}</strong></p>
    <p>${order.customerPhone}</p>
    <p>${address.line1}${address.line2 ? ', ' + address.line2 : ''}</p>
    <p>${address.city}${address.state ? ', ' + address.state : ''} — ${address.pincode}</p>
  </div>
  ${order.trackingId ? `<div class="section"><h3>Tracking</h3><p>${order.trackingId}</p></div>` : ''}
  ${isCOD ? `<div class="cod-badge">COD — ₹${Number(order.total).toLocaleString('en-IN')}</div>` : ''}
</div>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  res.send(html);
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

  // Group by phone to get unique customers with CLV
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
    .map((c) => {
      const avgOrderValue = c.totalSpend / c.orderCount;
      let clv = avgOrderValue; // default: single order
      if (c.orderCount > 1) {
        const daySpan = (c.lastOrder.getTime() - c.firstOrder.getTime()) / (1000 * 60 * 60 * 24);
        const daysBetweenOrders = daySpan / (c.orderCount - 1);
        const annualOrders = daysBetweenOrders > 0 ? Math.min(365 / daysBetweenOrders, 52) : 1;
        clv = avgOrderValue * annualOrders * 2; // 2-year projected lifespan
      }
      return { ...c, clv: Math.round(clv) };
    })
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

// Analytics (pro)
adminRoutes.get('/analytics', async (req: Request, res: Response) => {
  const { period = '30' } = req.query;
  const days = parseInt(period as string, 10);
  const since = new Date();
  since.setDate(since.getDate() - days);

  const [
    orders,
    topProducts,
    revenueByPayment,
    revenueByCategory,
    allOrders,
    cartCount,
    checkoutCount,
    abandonedCarts,
  ] = await Promise.all([
    prisma.order.findMany({
      where: { createdAt: { gte: since }, paymentStatus: 'paid' },
      select: { total: true, createdAt: true, paymentMethod: true, userId: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.orderItem.groupBy({
      by: ['productId', 'name'],
      where: { order: { createdAt: { gte: since } } },
      _sum: { quantity: true, price: true },
      _count: true,
      orderBy: { _sum: { quantity: 'desc' } },
      take: 10,
    }),
    prisma.order.groupBy({
      by: ['paymentMethod'],
      where: { paymentStatus: 'paid', createdAt: { gte: since } },
      _sum: { total: true },
      _count: true,
    }),
    // Revenue by category — join via orderItems → product → category
    prisma.orderItem.findMany({
      where: { order: { createdAt: { gte: since }, paymentStatus: 'paid' } },
      select: {
        price: true,
        quantity: true,
        product: { select: { category: { select: { name: true } } } },
      },
    }),
    // All orders in period (for funnel placed count)
    prisma.order.count({ where: { createdAt: { gte: since } } }),
    // Cart items as proxy for "add to cart" activity
    prisma.cartItem.count(),
    // Checkout started = orders with any status in period
    prisma.order.count({ where: { createdAt: { gte: since } } }),
    // Abandoned carts: cart items older than 24h (started checkout but didn't complete)
    prisma.cartItem.count({
      where: { createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    }),
  ]);

  // Daily revenue chart
  const dailyMap = new Map<string, { revenue: number; orders: number }>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dailyMap.set(d.toISOString().slice(0, 10), { revenue: 0, orders: 0 });
  }
  for (const o of orders) {
    const key = new Date(o.createdAt).toISOString().slice(0, 10);
    const entry = dailyMap.get(key) || { revenue: 0, orders: 0 };
    entry.revenue += Number(o.total);
    entry.orders += 1;
    dailyMap.set(key, entry);
  }
  const dailyRevenue = Array.from(dailyMap.entries()).map(([date, v]) => ({ date, revenue: v.revenue, orders: v.orders }));

  // Revenue by category
  const catMap = new Map<string, number>();
  for (const item of revenueByCategory) {
    const cat = item.product?.category?.name || 'Uncategorised';
    catMap.set(cat, (catMap.get(cat) || 0) + Number(item.price) * item.quantity);
  }
  const revenueByCategory2 = Array.from(catMap.entries())
    .map(([category, revenue]) => ({ category, revenue }))
    .sort((a, b) => b.revenue - a.revenue);

  // Customer acquisition: new vs returning (users with > 1 order)
  const userIds = orders.filter((o) => o.userId).map((o) => o.userId as string);
  const returningUserIds = new Set<string>();
  if (userIds.length > 0) {
    const returning = await prisma.order.groupBy({
      by: ['userId'],
      where: { userId: { in: userIds }, paymentStatus: 'paid' },
      _count: true,
      having: { userId: { _count: { gt: 1 } } },
    });
    returning.forEach((r) => r.userId && returningUserIds.add(r.userId));
  }
  const returningCustomers = returningUserIds.size;
  const newCustomers = orders.filter((o) => !o.userId || !returningUserIds.has(o.userId)).length;

  // Conversion funnel (estimates)
  const paidOrders = orders.length;
  const conversionFunnel = {
    cartItems: cartCount,
    checkoutStarted: checkoutCount,
    paid: paidOrders,
    abandonedCarts,
  };

  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total), 0);

  res.json({
    totalRevenue,
    totalOrders: orders.length,
    allOrdersInPeriod: allOrders,
    avgOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
    dailyRevenue,
    topProducts,
    revenueByPayment,
    revenueByCategory: revenueByCategory2,
    conversionFunnel,
    customerAcquisition: { newCustomers, returningCustomers },
    abandonedCarts,
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
  // Use per-item GST rates from category
  let totalGst = 0;
  const itemGstRates: number[] = order.items.map((item) => {
    const rate = (item.product?.category?.gstRate ?? 5) / 100;
    totalGst += Number(item.price) * item.quantity * rate;
    return rate;
  });
  const gstAmount = totalGst;
  const shippingState = address.state || '';
  const isIntraState = shippingState.toLowerCase() === 'telangana';
  const cgst = isIntraState ? gstAmount / 2 : 0;
  const sgst = isIntraState ? gstAmount / 2 : 0;
  const igst = isIntraState ? 0 : gstAmount;
  const formattedDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  const itemRows = order.items.map((item, idx) => {
    const itemTotal = Number(item.price) * item.quantity;
    const rate = itemGstRates[idx];
    const itemGst = itemTotal * rate;
    const hsnCode = (item.product?.category as { hsnCode?: string } | null)?.hsnCode || '';
    return `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #f0e8e8;">${item.name}${item.size ? ` <span style="color:#999;font-size:12px;">(${item.size})</span>` : ''}${hsnCode ? `<br/><span style="color:#999;font-size:11px;">HSN: ${hsnCode}</span>` : ''}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f0e8e8;text-align:center;">${item.quantity}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f0e8e8;text-align:right;">₹${Number(item.price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f0e8e8;text-align:right;">${(rate * 100).toFixed(0)}% — ₹${itemGst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
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
      ${isIntraState
        ? `<tr><td>CGST</td><td style="text-align:right;">₹${cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>
           <tr><td>SGST</td><td style="text-align:right;">₹${sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>`
        : `<tr><td>IGST</td><td style="text-align:right;">₹${igst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>`
      }
      <tr><td>Shipping</td><td style="text-align:right;">${Number(order.shipping) === 0 ? '<span style="color:green;">FREE</span>' : '₹' + Number(order.shipping).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>
      ${Number(order.discount) > 0 ? `<tr><td>Discount</td><td style="text-align:right;color:green;">-₹${Number(order.discount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>` : ''}
      ${order.paymentMethod === 'cod' ? `<tr><td>COD Charge</td><td style="text-align:right;">₹50.00</td></tr>` : ''}
      <tr><td><strong>Total</strong></td><td style="text-align:right;"><strong>₹${Number(order.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></td></tr>
    </table>
  </div>

  <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:40px;border-top:1px solid #f0e8e8;padding-top:20px;">
    <div class="footer" style="border:none;padding:0;text-align:left;">
      <p>Thank you for shopping with Srinidhi Boutique!</p>
      <p style="margin-top:4px;">For queries: +91-XXXXXXXXXX | srinidhiboutique@gmail.com</p>
      <p style="margin-top:8px;font-style:italic;color:#999;font-size:12px;">This is a computer-generated invoice.</p>
    </div>
    <div style="text-align:right;">
      <p style="font-size:11px;color:#999;font-style:italic;">For and on behalf of</p>
      <p style="font-weight:600;margin-top:2px;">Srinidhi Boutique</p>
      <div style="margin-top:30px;border-top:1px solid #ccc;padding-top:6px;">
        <p style="font-size:12px;color:#666;">Authorised Signatory</p>
      </div>
    </div>
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

// Returns
adminRoutes.get('/returns', async (_req: Request, res: Response) => {
  const requests = await prisma.returnRequest.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(requests);
});

adminRoutes.patch('/returns/:id/status', async (req: Request, res: Response) => {
  const { status } = z.object({
    status: z.enum(['pending', 'approved', 'rejected', 'completed']),
  }).parse(req.body);
  const existing = await prisma.returnRequest.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new AppError(404, 'Return request not found');
  const updated = await prisma.returnRequest.update({ where: { id: req.params.id }, data: { status } });
  res.json(updated);
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

// Packing slip — simplified HTML for warehouse/warehouse printing
adminRoutes.get('/orders/:id/packing-slip', async (req: Request, res: Response) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { items: { include: { product: true } } },
  });
  if (!order) throw new AppError(404, 'Order not found');

  const address = order.address as { line1: string; line2?: string; city: string; state?: string; pincode: string; country?: string };

  const itemRows = order.items.map((item) => `
    <tr>
      <td style="padding:8px;border:1px solid #ddd;">${item.name}</td>
      <td style="padding:8px;border:1px solid #ddd;text-align:center;">${item.size || '—'}</td>
      <td style="padding:8px;border:1px solid #ddd;text-align:center;">${item.color || '—'}</td>
      <td style="padding:8px;border:1px solid #ddd;text-align:center;font-weight:bold;">${item.quantity}</td>
    </tr>`).join('');

  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Packing Slip ${order.orderNumber}</title>
<style>body{font-family:Arial,sans-serif;font-size:13px;margin:20px;}h1{font-size:18px;}table{width:100%;border-collapse:collapse;margin-top:12px;}.box{border:1px solid #ccc;padding:10px;margin:10px 0;border-radius:4px;}@media print{.no-print{display:none;}}</style>
</head><body>
<div style="display:flex;justify-content:space-between;align-items:center;">
  <div><h1>PACKING SLIP</h1><p style="color:#666;">Srinidhi Boutique · Hyderabad</p></div>
  <div style="text-align:right;"><strong>${order.orderNumber}</strong><br/>${new Date(order.createdAt).toLocaleDateString('en-IN')}</div>
</div>
<div class="box">
  <strong>Ship To:</strong><br/>
  ${order.customerName}<br/>
  ${order.customerPhone}<br/>
  ${address.line1}${address.line2 ? ', ' + address.line2 : ''}<br/>
  ${address.city}${address.state ? ', ' + address.state : ''} — ${address.pincode}
  ${address.country && address.country !== 'IN' ? '<br/>' + address.country : ''}
</div>
<div class="box"><strong>Payment:</strong> ${order.paymentMethod.toUpperCase()} · <strong>Status:</strong> ${order.paymentStatus}</div>
<table><thead><tr>
  <th style="padding:8px;border:1px solid #ddd;background:#f5f5f5;text-align:left;">Item</th>
  <th style="padding:8px;border:1px solid #ddd;background:#f5f5f5;">Size</th>
  <th style="padding:8px;border:1px solid #ddd;background:#f5f5f5;">Color</th>
  <th style="padding:8px;border:1px solid #ddd;background:#f5f5f5;">Qty</th>
</tr></thead><tbody>${itemRows}</tbody></table>
<p style="margin-top:16px;font-size:12px;color:#666;">Total items: ${order.items.reduce((s, i) => s + i.quantity, 0)} · Order total: ₹${Number(order.total).toLocaleString('en-IN')}</p>
<script class="no-print">if(window.location.search.includes('print=1'))window.print();</script>
</body></html>`;

  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

// Daily email summary template — actual email sending is wired up later
adminRoutes.get('/daily-summary', async (_req: Request, res: Response) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [todayOrders, todayRevenue, lowStockProducts, pendingOrders] = await Promise.all([
    prisma.order.findMany({
      where: { createdAt: { gte: today } },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.order.aggregate({
      where: { createdAt: { gte: today }, paymentStatus: 'paid' },
      _sum: { total: true },
    }),
    prisma.product.findMany({
      where: { stock: { lte: 5, gt: 0 }, active: true },
      select: { name: true, stock: true },
      orderBy: { stock: 'asc' },
    }),
    prisma.order.count({ where: { status: 'placed' } }),
  ]);

  res.json({
    date: today.toISOString().slice(0, 10),
    todayOrderCount: todayOrders.length,
    todayRevenue: todayRevenue._sum.total || 0,
    pendingOrders,
    lowStockProducts,
    recentOrders: todayOrders.map((o) => ({
      orderNumber: o.orderNumber,
      customerName: o.customerName,
      total: o.total,
      status: o.status,
      paymentMethod: o.paymentMethod,
    })),
  });
});

// Low stock alerts — products with stock <= threshold
adminRoutes.get('/low-stock', async (req: Request, res: Response) => {
  const threshold = parseInt((req.query.threshold as string) || '5', 10);
  const products = await prisma.product.findMany({
    where: { stock: { lte: threshold }, active: true },
    select: { id: true, name: true, stock: true, category: { select: { name: true } } },
    orderBy: { stock: 'asc' },
  });
  res.json({ threshold, count: products.length, products });
});

// CSV product import — parses uploaded CSV and bulk-creates products
adminRoutes.post('/products/import-csv', upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) throw new AppError(400, 'No file uploaded');
  if (!req.file.mimetype.includes('csv') && !req.file.originalname.endsWith('.csv')) {
    throw new AppError(400, 'File must be a CSV');
  }

  const text = req.file.buffer.toString('utf-8');
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) throw new AppError(400, 'CSV must have a header row and at least one data row');

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/"/g, ''));
  const required = ['name', 'price'];
  for (const r of required) {
    if (!headers.includes(r)) throw new AppError(400, `CSV missing required column: ${r}`);
  }

  const created: string[] = [];
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h] = values[idx] || ''; });

    try {
      const name = row['name'];
      const price = parseFloat(row['price']);
      if (!name || isNaN(price) || price <= 0) {
        errors.push(`Row ${i + 1}: invalid name or price`);
        continue;
      }

      const slug = slugify(name, { lower: true, strict: true });
      const existing = await prisma.product.findUnique({ where: { slug } });
      const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

      await prisma.product.create({
        data: {
          name,
          slug: finalSlug,
          price,
          comparePrice: row['compare_price'] ? parseFloat(row['compare_price']) : undefined,
          description: row['description'] || undefined,
          stock: row['stock'] ? parseInt(row['stock'], 10) : 0,
          fabric: row['fabric'] || undefined,
          images: row['image'] ? row['image'].split('|') : row['images'] ? row['images'].split('|') : [],
          sizes: row['sizes'] ? row['sizes'].split('|') : [],
          colors: row['colors'] ? row['colors'].split('|') : [],
          featured: row['featured'] === 'true',
          bestSeller: row['best_seller'] === 'true',
          active: row['active'] !== 'false',
        },
      });
      created.push(name);
    } catch {
      errors.push(`Row ${i + 1}: failed to create product`);
    }
  }

  res.json({ created: created.length, errors, createdNames: created });
});

// ── Build 12: Bulk Product Operations ───────────────────────────────────────

const bulkProductSchema = z.object({
  ids: z.array(z.string()).min(1),
  action: z.enum(['set_price', 'increase_price', 'decrease_price', 'set_category', 'toggle_active', 'apply_sale', 'set_stock']),
  value: z.union([z.string(), z.number(), z.boolean()]).optional(),
  isPercent: z.boolean().optional(),
});

adminRoutes.post('/products/bulk', async (req: Request, res: Response) => {
  const { ids, action, value, isPercent } = bulkProductSchema.parse(req.body);

  let updateData: Record<string, unknown> = {};
  let updatedCount = 0;

  if (action === 'toggle_active') {
    // toggle each product individually
    const products = await prisma.product.findMany({ where: { id: { in: ids } }, select: { id: true, active: true } });
    for (const p of products) {
      await prisma.product.update({ where: { id: p.id }, data: { active: !p.active } });
    }
    updatedCount = products.length;
  } else if (action === 'set_price' && value !== undefined) {
    updateData = { price: Number(value) };
    const result = await prisma.product.updateMany({ where: { id: { in: ids } }, data: updateData });
    updatedCount = result.count;
  } else if ((action === 'increase_price' || action === 'decrease_price') && value !== undefined) {
    const products = await prisma.product.findMany({ where: { id: { in: ids } }, select: { id: true, price: true } });
    for (const p of products) {
      const current = Number(p.price);
      const delta = isPercent ? current * (Number(value) / 100) : Number(value);
      const newPrice = action === 'increase_price' ? current + delta : Math.max(0, current - delta);
      await prisma.product.update({ where: { id: p.id }, data: { price: newPrice } });
    }
    updatedCount = products.length;
  } else if (action === 'set_category' && value !== undefined) {
    const category = await prisma.category.findUnique({ where: { id: String(value) } });
    if (!category) throw new AppError(404, 'Category not found');
    const result = await prisma.product.updateMany({ where: { id: { in: ids } }, data: { categoryId: String(value) } });
    updatedCount = result.count;
  } else if (action === 'apply_sale' && value !== undefined) {
    const percent = Number(value);
    if (percent < 0 || percent > 100) throw new AppError(400, 'Sale percent must be 0-100');
    const result = await prisma.product.updateMany({
      where: { id: { in: ids } },
      data: { onOffer: percent > 0, offerPercent: percent > 0 ? percent : null },
    });
    updatedCount = result.count;
  } else if (action === 'set_stock' && value !== undefined) {
    const result = await prisma.product.updateMany({ where: { id: { in: ids } }, data: { stock: Number(value) } });
    updatedCount = result.count;
  } else {
    throw new AppError(400, 'Invalid action or missing value');
  }

  res.json({ success: true, updatedCount, action });
});

// ── Build 15: Category HSN Code ───────────────────────────────────────────────

adminRoutes.patch('/categories/:id/hsn', async (req: Request, res: Response) => {
  const { hsnCode } = z.object({ hsnCode: z.string().min(1, 'hsnCode is required') }).parse(req.body);
  const category = await prisma.category.findUnique({ where: { id: req.params.id } });
  if (!category) throw new AppError(404, 'Category not found');
  const updated = await prisma.category.update({ where: { id: req.params.id }, data: { hsnCode } });
  res.json(updated);
});

// ── Build 12: GST Category Rates ────────────────────────────────────────────

adminRoutes.patch('/categories/:id/gst-rate', async (req: Request, res: Response) => {
  const { gstRate } = z.object({ gstRate: z.number().min(0).max(100) }).parse(req.body);
  const category = await prisma.category.findUnique({ where: { id: req.params.id } });
  if (!category) throw new AppError(404, 'Category not found');
  const updated = await prisma.category.update({ where: { id: req.params.id }, data: { gstRate } });
  res.json(updated);
});

// GST calculation helper — used by cart and checkout
// storeState = Telangana (36)
const STORE_STATE = 'Telangana';

export function calculateGST(subtotal: number, gstRate: number, shippingState: string) {
  const isIntraState = shippingState?.toLowerCase() === STORE_STATE.toLowerCase();
  const gstAmount = (subtotal * gstRate) / 100;
  if (isIntraState) {
    return { cgst: gstAmount / 2, sgst: gstAmount / 2, igst: 0, total: gstAmount, rate: gstRate, type: 'CGST+SGST' };
  }
  return { cgst: 0, sgst: 0, igst: gstAmount, total: gstAmount, rate: gstRate, type: 'IGST' };
}

// Cart GST breakdown — GET /api/admin/gst-preview?categoryId=xxx&subtotal=yyy&state=zzz
adminRoutes.get('/gst-preview', async (req: Request, res: Response) => {
  const { categoryId, subtotal, state } = req.query;
  if (!categoryId || !subtotal) throw new AppError(400, 'categoryId and subtotal required');

  const category = await prisma.category.findUnique({ where: { id: String(categoryId) } });
  if (!category) throw new AppError(404, 'Category not found');

  const gst = calculateGST(Number(subtotal), category.gstRate, String(state || ''));
  res.json({ category: category.name, gstRate: category.gstRate, subtotal: Number(subtotal), ...gst });
});

// ── Build 12: Enhanced Coupon Admin ─────────────────────────────────────────

const couponSchemaV2 = z.object({
  code: z.string().min(1).toUpperCase(),
  discount: z.number().int().min(1).max(100000), // flat discounts can exceed 100
  type: z.enum(['percentage', 'flat']).default('percentage'),
  minOrder: z.number().positive().optional(),
  maxUses: z.number().int().positive().optional(),
  active: z.boolean().default(true),
  expiresAt: z.string().optional().transform((val) => (val ? new Date(val) : undefined)),
  categoryId: z.string().optional(),
  firstOrderOnly: z.boolean().default(false),
  userId: z.string().optional(),
});

adminRoutes.post('/coupons/v2', async (req: Request, res: Response) => {
  const data = couponSchemaV2.parse(req.body);
  const existing = await prisma.coupon.findUnique({ where: { code: data.code } });
  if (existing) throw new AppError(400, 'Coupon code already exists');

  if (data.categoryId) {
    const cat = await prisma.category.findUnique({ where: { id: data.categoryId } });
    if (!cat) throw new AppError(404, 'Category not found');
  }
  if (data.userId) {
    const user = await prisma.user.findUnique({ where: { id: data.userId } });
    if (!user) throw new AppError(404, 'User not found');
  }

  const coupon = await prisma.coupon.create({ data });
  res.status(201).json(coupon);
});

// ── Build 12: Admin Order Notes (internal) ──────────────────────────────────

adminRoutes.patch('/orders/:id/admin-notes', async (req: Request, res: Response) => {
  const { adminNotes } = z.object({ adminNotes: z.string() }).parse(req.body);
  const order = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!order) throw new AppError(404, 'Order not found');

  const updated = await prisma.order.update({
    where: { id: req.params.id },
    data: { adminNotes },
  });
  res.json(updated);
});

// ── Build 12: Stock Notifications Admin View ─────────────────────────────────

adminRoutes.get('/stock-notifications', async (req: Request, res: Response) => {
  const { productId, notified } = req.query;
  const where: Record<string, unknown> = {};
  if (productId) where.productId = String(productId);
  if (notified !== undefined) where.notified = notified === 'true';

  const notifications = await prisma.backInStockNotification.findMany({
    where,
    include: { product: { select: { name: true, stock: true, images: true } } },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ count: notifications.length, notifications });
});

adminRoutes.post('/stock-notifications/notify/:productId', async (req: Request, res: Response) => {
  const { productId } = req.params;
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new AppError(404, 'Product not found');

  const result = await prisma.backInStockNotification.updateMany({
    where: { productId, notified: false },
    data: { notified: true },
  });

  res.json({ success: true, notified: result.count, product: product.name });
});

// ── Build 12: Data Export CSV ────────────────────────────────────────────────

adminRoutes.get('/export/:type', async (req: Request, res: Response) => {
  const { type } = req.params;
  const { from, to } = req.query;

  const dateFilter: Record<string, Date> = {};
  if (from) dateFilter.gte = new Date(String(from));
  if (to) { const toDate = new Date(String(to)); toDate.setHours(23, 59, 59, 999); dateFilter.lte = toDate; }

  const validTypes = ['products', 'orders', 'customers', 'reviews'];
  if (!validTypes.includes(type)) throw new AppError(400, `Invalid export type. Valid: ${validTypes.join(', ')}`);

  let csv = '';

  if (type === 'products') {
    const products = await prisma.product.findMany({
      where: Object.keys(dateFilter).length ? { createdAt: dateFilter } : {},
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });
    csv = 'id,name,price,comparePrice,category,stock,active,featured,bestSeller,onOffer,offerPercent,sizes,colors,createdAt\n';
    csv += products.map((p) => [
      p.id, `"${p.name.replace(/"/g, '""')}"`, p.price, p.comparePrice || '',
      `"${p.category?.name || ''}"`, p.stock, p.active, p.featured,
      p.bestSeller, p.onOffer, p.offerPercent || '',
      `"${p.sizes.join('|')}"`, `"${p.colors.join('|')}"`,
      p.createdAt.toISOString(),
    ].join(',')).join('\n');
    res.setHeader('Content-Disposition', `attachment; filename="products-${Date.now()}.csv"`);
  } else if (type === 'orders') {
    const orders = await prisma.order.findMany({
      where: Object.keys(dateFilter).length ? { createdAt: dateFilter } : {},
      orderBy: { createdAt: 'desc' },
    });
    csv = 'orderNumber,customerName,customerPhone,customerEmail,subtotal,shipping,discount,gstAmount,total,paymentMethod,paymentStatus,status,deliverySlot,couponCode,country,createdAt\n';
    csv += orders.map((o) => {
      const addr = o.address as { city?: string; state?: string; pincode?: string };
      return [
        o.orderNumber, `"${o.customerName.replace(/"/g, '""')}"`,
        o.customerPhone, o.customerEmail || '',
        o.subtotal, o.shipping, o.discount, o.gstAmount || '',
        o.total, o.paymentMethod, o.paymentStatus,
        o.status, o.deliverySlot || '', o.couponCode || '',
        o.country, o.createdAt.toISOString(),
        `"${addr.city || ''}, ${addr.state || ''} ${addr.pincode || ''}"`,
      ].join(',');
    }).join('\n');
    res.setHeader('Content-Disposition', `attachment; filename="orders-${Date.now()}.csv"`);
  } else if (type === 'customers') {
    const orders = await prisma.order.findMany({
      where: Object.keys(dateFilter).length ? { createdAt: dateFilter } : {},
      select: { customerName: true, customerPhone: true, customerEmail: true, total: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    const customerMap = new Map<string, { name: string; email?: string | null; total: number; count: number; first: Date; last: Date }>();
    for (const o of orders) {
      const ex = customerMap.get(o.customerPhone);
      if (ex) {
        ex.total += Number(o.total); ex.count += 1;
        if (new Date(o.createdAt) > ex.last) ex.last = new Date(o.createdAt);
        if (new Date(o.createdAt) < ex.first) ex.first = new Date(o.createdAt);
      } else {
        customerMap.set(o.customerPhone, { name: o.customerName, email: o.customerEmail, total: Number(o.total), count: 1, first: new Date(o.createdAt), last: new Date(o.createdAt) });
      }
    }
    csv = 'phone,name,email,orderCount,totalSpend,firstOrder,lastOrder\n';
    csv += Array.from(customerMap.entries()).map(([phone, c]) =>
      [phone, `"${c.name.replace(/"/g, '""')}"`, c.email || '', c.count, c.total.toFixed(2), c.first.toISOString(), c.last.toISOString()].join(',')
    ).join('\n');
    res.setHeader('Content-Disposition', `attachment; filename="customers-${Date.now()}.csv"`);
  } else if (type === 'reviews') {
    const reviews = await prisma.review.findMany({
      where: Object.keys(dateFilter).length ? { createdAt: dateFilter } : {},
      include: { product: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    csv = 'productName,customerName,rating,title,body,approved,createdAt\n';
    csv += reviews.map((r) => [
      `"${r.product.name.replace(/"/g, '""')}"`,
      `"${r.customerName.replace(/"/g, '""')}"`,
      r.rating,
      `"${(r.title || '').replace(/"/g, '""')}"`,
      `"${(r.body || '').replace(/"/g, '""')}"`,
      r.approved,
      r.createdAt.toISOString(),
    ].join(',')).join('\n');
    res.setHeader('Content-Disposition', `attachment; filename="reviews-${Date.now()}.csv"`);
  }

  res.setHeader('Content-Type', 'text/csv');
  res.send(csv);
});
