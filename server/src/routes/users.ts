import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';

export const userRoutes = Router();
const prisma = new PrismaClient();

// GET /api/users/:id/orders
userRoutes.get('/:id/orders', async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) throw new AppError(404, 'User not found');

  const orders = await prisma.order.findMany({
    where: { userId: req.params.id },
    include: { items: { include: { product: { select: { name: true, images: true } } } } },
    orderBy: { createdAt: 'desc' },
  });

  res.json(orders);
});

// GET /api/users/:id/wishlist
userRoutes.get('/:id/wishlist', async (req: Request, res: Response) => {
  const items = await prisma.wishlistItem.findMany({
    where: { userId: req.params.id },
    include: { product: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(items.map((i) => i.product));
});

// POST /api/users/:id/wishlist
userRoutes.post('/:id/wishlist', async (req: Request, res: Response) => {
  const { productId } = z.object({ productId: z.string() }).parse(req.body);

  const item = await prisma.wishlistItem.upsert({
    where: { userId_productId: { userId: req.params.id, productId } },
    update: {},
    create: { userId: req.params.id, productId },
    include: { product: true },
  });
  res.status(201).json(item.product);
});

// DELETE /api/users/:id/wishlist/:productId
userRoutes.delete('/:id/wishlist/:productId', async (req: Request, res: Response) => {
  await prisma.wishlistItem.deleteMany({
    where: { userId: req.params.id, productId: req.params.productId },
  });
  res.json({ success: true });
});

// GET /api/users/:id/recently-viewed
userRoutes.get('/:id/recently-viewed', async (req: Request, res: Response) => {
  const items = await prisma.recentlyViewed.findMany({
    where: { userId: req.params.id },
    include: { product: true },
    orderBy: { viewedAt: 'desc' },
    take: 10,
  });
  res.json(items.map((i) => i.product));
});

// POST /api/users/:id/recently-viewed
userRoutes.post('/:id/recently-viewed', async (req: Request, res: Response) => {
  const { productId } = z.object({ productId: z.string() }).parse(req.body);

  await prisma.recentlyViewed.upsert({
    where: { userId_productId: { userId: req.params.id, productId } },
    update: { viewedAt: new Date() },
    create: { userId: req.params.id, productId },
  });

  // Keep only last 10
  const all = await prisma.recentlyViewed.findMany({
    where: { userId: req.params.id },
    orderBy: { viewedAt: 'desc' },
  });
  if (all.length > 10) {
    const toDelete = all.slice(10).map((i) => i.id);
    await prisma.recentlyViewed.deleteMany({ where: { id: { in: toDelete } } });
  }

  res.json({ success: true });
});

// GET /api/users/:id/profile
userRoutes.get('/:id/profile', async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: { id: true, name: true, email: true, phone: true, avatar: true, addresses: true, createdAt: true },
  });
  if (!user) throw new AppError(404, 'User not found');
  res.json(user);
});

// PUT /api/users/:id/profile
userRoutes.put('/:id/profile', async (req: Request, res: Response) => {
  const data = z
    .object({
      name: z.string().optional(),
      email: z.string().email().optional(),
      avatar: z.string().optional(),
    })
    .parse(req.body);

  const user = await prisma.user.update({
    where: { id: req.params.id },
    data,
    select: { id: true, name: true, email: true, phone: true, avatar: true, addresses: true },
  });
  res.json(user);
});

// PUT /api/users/:id/addresses (legacy JSON field)
userRoutes.put('/:id/addresses', async (req: Request, res: Response) => {
  const { addresses } = z
    .object({ addresses: z.array(z.record(z.unknown())) })
    .parse(req.body);

  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { addresses: addresses as never },
    select: { id: true, addresses: true },
  });
  res.json({ addresses: user.addresses });
});

// ── Build 14: Multi-Address Management ───────────────────────────────────────

const addressSchema = z.object({
  label: z.enum(['Home', 'Office', 'Other']).default('Home'),
  line1: z.string().min(1),
  line2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  pincode: z.string().min(6).max(6),
  isDefault: z.boolean().default(false),
});

// GET /api/users/:id/saved-addresses
userRoutes.get('/:id/saved-addresses', async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) throw new AppError(404, 'User not found');

  const addresses = await prisma.customerAddress.findMany({
    where: { userId: req.params.id },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
  });
  res.json({ addresses, count: addresses.length });
});

// POST /api/users/:id/saved-addresses
userRoutes.post('/:id/saved-addresses', async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) throw new AppError(404, 'User not found');

  const data = addressSchema.parse(req.body);

  if (data.isDefault) {
    await prisma.customerAddress.updateMany({ where: { userId: req.params.id }, data: { isDefault: false } });
  }

  const existingCount = await prisma.customerAddress.count({ where: { userId: req.params.id } });
  const makeDefault = data.isDefault || existingCount === 0;

  const address = await prisma.customerAddress.create({
    data: { ...data, userId: req.params.id, isDefault: makeDefault },
  });
  res.status(201).json(address);
});

// PATCH /api/users/:id/saved-addresses/:addressId
userRoutes.patch('/:id/saved-addresses/:addressId', async (req: Request, res: Response) => {
  const existing = await prisma.customerAddress.findFirst({
    where: { id: req.params.addressId, userId: req.params.id },
  });
  if (!existing) throw new AppError(404, 'Address not found');

  const data = addressSchema.partial().parse(req.body);

  if (data.isDefault) {
    await prisma.customerAddress.updateMany({ where: { userId: req.params.id }, data: { isDefault: false } });
  }

  const updated = await prisma.customerAddress.update({ where: { id: req.params.addressId }, data });
  res.json(updated);
});

// DELETE /api/users/:id/saved-addresses/:addressId
userRoutes.delete('/:id/saved-addresses/:addressId', async (req: Request, res: Response) => {
  const existing = await prisma.customerAddress.findFirst({
    where: { id: req.params.addressId, userId: req.params.id },
  });
  if (!existing) throw new AppError(404, 'Address not found');

  await prisma.customerAddress.delete({ where: { id: req.params.addressId } });

  if (existing.isDefault) {
    const next = await prisma.customerAddress.findFirst({
      where: { userId: req.params.id },
      orderBy: { createdAt: 'asc' },
    });
    if (next) {
      await prisma.customerAddress.update({ where: { id: next.id }, data: { isDefault: true } });
    }
  }
  res.json({ success: true });
});

// PATCH /api/users/:id/saved-addresses/:addressId/set-default
userRoutes.patch('/:id/saved-addresses/:addressId/set-default', async (req: Request, res: Response) => {
  const existing = await prisma.customerAddress.findFirst({
    where: { id: req.params.addressId, userId: req.params.id },
  });
  if (!existing) throw new AppError(404, 'Address not found');

  await prisma.customerAddress.updateMany({ where: { userId: req.params.id }, data: { isDefault: false } });
  const updated = await prisma.customerAddress.update({
    where: { id: req.params.addressId },
    data: { isDefault: true },
  });
  res.json(updated);
});
