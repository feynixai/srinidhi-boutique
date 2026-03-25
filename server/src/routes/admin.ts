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
