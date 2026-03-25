import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

export const abandonedCartRoutes = Router();

// Track / upsert abandoned cart
abandonedCartRoutes.post('/track', async (req: Request, res: Response) => {
  const { sessionId, userId, items } = z
    .object({
      sessionId: z.string(),
      userId: z.string().optional(),
      items: z.array(z.record(z.unknown())),
    })
    .parse(req.body);

  const itemsJson = items as unknown as import('@prisma/client').Prisma.InputJsonValue;

  const cart = await prisma.abandonedCart.upsert({
    where: { sessionId },
    update: { items: itemsJson, userId, updatedAt: new Date() },
    create: { sessionId, userId, items: itemsJson },
  });

  res.json(cart);
});

// Mark cart as recovered
abandonedCartRoutes.post('/recover/:token', async (req: Request, res: Response) => {
  const { token } = req.params;

  const cart = await prisma.abandonedCart.findUnique({
    where: { recoveryToken: token },
  });
  if (!cart) throw new AppError(404, 'Recovery link not found');
  if (cart.recovered) throw new AppError(400, 'Cart already recovered');

  const updated = await prisma.abandonedCart.update({
    where: { recoveryToken: token },
    data: { recovered: true },
  });

  res.json({ message: 'Cart recovered', items: updated.items });
});

// Get recovery cart items
abandonedCartRoutes.get('/recover/:token', async (req: Request, res: Response) => {
  const { token } = req.params;

  const cart = await prisma.abandonedCart.findUnique({
    where: { recoveryToken: token },
  });
  if (!cart) throw new AppError(404, 'Recovery link not found');

  res.json({ items: cart.items, recovered: cart.recovered, sessionId: cart.sessionId });
});

// Send reminder (mark reminderSent = true, in real app would call WhatsApp)
abandonedCartRoutes.post('/send-reminder/:sessionId', async (req: Request, res: Response) => {
  const { sessionId } = req.params;

  const cart = await prisma.abandonedCart.findUnique({ where: { sessionId } });
  if (!cart) throw new AppError(404, 'Abandoned cart not found');

  await prisma.abandonedCart.update({
    where: { sessionId },
    data: { reminderSent: true },
  });

  res.json({ message: 'Reminder sent', recoveryToken: cart.recoveryToken });
});

// ── Admin ──────────────────────────────────────────────────────────────────

// List abandoned carts
abandonedCartRoutes.get('/admin/list', async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const recovered = req.query.recovered === 'true' ? true : req.query.recovered === 'false' ? false : undefined;

  const where = recovered !== undefined ? { recovered } : {};

  const [carts, total] = await Promise.all([
    prisma.abandonedCart.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.abandonedCart.count({ where }),
  ]);

  const totalAbandoned = await prisma.abandonedCart.count({});
  const totalRecovered = await prisma.abandonedCart.count({ where: { recovered: true } });
  const recoveryRate = totalAbandoned > 0 ? Math.round((totalRecovered / totalAbandoned) * 100) : 0;

  res.json({
    carts,
    total,
    page,
    pages: Math.ceil(total / limit),
    stats: { totalAbandoned, totalRecovered, recoveryRate },
  });
});

// Delete abandoned cart
abandonedCartRoutes.delete('/admin/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const cart = await prisma.abandonedCart.findUnique({ where: { id } });
  if (!cart) throw new AppError(404, 'Abandoned cart not found');
  await prisma.abandonedCart.delete({ where: { id } });
  res.json({ message: 'Deleted' });
});
