import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

export const cartRoutes = Router();

const addToCartSchema = z.object({
  sessionId: z.string().min(1),
  productId: z.string().min(1),
  quantity: z.number().int().positive().default(1),
  size: z.string().optional(),
  color: z.string().optional(),
});

cartRoutes.post('/', async (req: Request, res: Response) => {
  const data = addToCartSchema.parse(req.body);

  const product = await prisma.product.findUnique({
    where: { id: data.productId, active: true },
  });

  if (!product) throw new AppError(404, 'Product not found');
  if (product.stock < (data.quantity ?? 1)) throw new AppError(400, 'Insufficient stock');

  const cartItem = await prisma.cartItem.upsert({
    where: {
      sessionId_productId_size_color: {
        sessionId: data.sessionId,
        productId: data.productId,
        size: data.size ?? '',
        color: data.color ?? '',
      },
    },
    update: {
      quantity: { increment: data.quantity ?? 1 },
    },
    create: {
      sessionId: data.sessionId,
      productId: data.productId,
      quantity: data.quantity ?? 1,
      size: data.size,
      color: data.color,
    },
    include: { product: true },
  });

  res.status(201).json(cartItem);
});

// GET /api/cart/abandoned — admin: carts older than 24h with items
cartRoutes.get('/abandoned', async (req: Request, res: Response) => {
  const hoursAgo = parseInt((req.query.hours as string) || '24', 10);
  const cutoff = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);

  const sessions = await prisma.cartItem.groupBy({
    by: ['sessionId'],
    where: { createdAt: { lt: cutoff } },
    _count: true,
    _sum: { quantity: true },
  });

  res.json({ count: sessions.length, sessions });
});

// GET /api/cart/reminder/:sessionId — check if session has an old cart (for reminder banner)
cartRoutes.get('/reminder/:sessionId', async (req: Request, res: Response) => {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const items = await prisma.cartItem.findMany({
    where: { sessionId: req.params.sessionId, createdAt: { lt: cutoff } },
    include: { product: { select: { name: true, images: true, slug: true } } },
    take: 5,
  });
  res.json({ hasAbandonedCart: items.length > 0, items });
});

cartRoutes.get('/:sessionId', async (req: Request, res: Response) => {
  const items = await prisma.cartItem.findMany({
    where: { sessionId: req.params.sessionId },
    include: { product: { include: { category: true } } },
    orderBy: { createdAt: 'asc' },
  });

  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0
  );

  res.json({ items, subtotal });
});

cartRoutes.put('/:id', async (req: Request, res: Response) => {
  const { quantity } = z.object({ quantity: z.number().int().positive() }).parse(req.body);

  const item = await prisma.cartItem.findUnique({ where: { id: req.params.id } });
  if (!item) throw new AppError(404, 'Cart item not found');

  const updated = await prisma.cartItem.update({
    where: { id: req.params.id },
    data: { quantity },
    include: { product: true },
  });

  res.json(updated);
});

cartRoutes.delete('/:id', async (req: Request, res: Response) => {
  const item = await prisma.cartItem.findUnique({ where: { id: req.params.id } });
  if (!item) throw new AppError(404, 'Cart item not found');

  await prisma.cartItem.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

cartRoutes.delete('/session/:sessionId', async (req: Request, res: Response) => {
  await prisma.cartItem.deleteMany({ where: { sessionId: req.params.sessionId } });
  res.json({ success: true });
});
