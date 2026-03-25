import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

export const storeCreditRoutes = Router();

// Get balance for a user
storeCreditRoutes.get('/balance/:userId', async (req: Request, res: Response) => {
  const { userId } = req.params;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError(404, 'User not found');

  const credits = await prisma.storeCredit.findMany({
    where: {
      userId,
      used: false,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    orderBy: { createdAt: 'asc' },
  });

  const balance = credits.reduce((sum, c) => sum + Number(c.amount), 0);

  res.json({ userId, balance, credits });
});

// Issue store credit (admin or system)
storeCreditRoutes.post('/issue', async (req: Request, res: Response) => {
  const { userId, amount, source, note, orderId, expiresInDays } = z
    .object({
      userId: z.string(),
      amount: z.number().positive(),
      source: z.enum(['return', 'referral', 'loyalty', 'manual']),
      note: z.string().optional(),
      orderId: z.string().optional(),
      expiresInDays: z.number().int().positive().optional(),
    })
    .parse(req.body);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError(404, 'User not found');

  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 86400000)
    : null;

  const credit = await prisma.storeCredit.create({
    data: { userId, amount, source, note, orderId, expiresAt },
  });

  res.status(201).json(credit);
});

// Apply store credits at checkout
storeCreditRoutes.post('/apply', async (req: Request, res: Response) => {
  const { userId, amount, orderId } = z
    .object({
      userId: z.string(),
      amount: z.number().positive(),
      orderId: z.string(),
    })
    .parse(req.body);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError(404, 'User not found');

  // Get valid credits (not used, not expired)
  const credits = await prisma.storeCredit.findMany({
    where: {
      userId,
      used: false,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    orderBy: { createdAt: 'asc' },
  });

  const balance = credits.reduce((sum, c) => sum + Number(c.amount), 0);
  if (balance < amount) {
    throw new AppError(400, `Insufficient store credit. Available: ₹${balance}`);
  }

  // Mark credits as used (oldest first, FIFO)
  let remaining = amount;
  for (const credit of credits) {
    if (remaining <= 0) break;
    const creditAmount = Number(credit.amount);
    if (creditAmount <= remaining) {
      await prisma.storeCredit.update({
        where: { id: credit.id },
        data: { used: true, usedAt: new Date(), usedInOrder: orderId },
      });
      remaining -= creditAmount;
    } else {
      // Split: mark this one used, create remainder credit
      await prisma.storeCredit.update({
        where: { id: credit.id },
        data: { used: true, usedAt: new Date(), usedInOrder: orderId },
      });
      // Create remainder
      await prisma.storeCredit.create({
        data: {
          userId,
          amount: creditAmount - remaining,
          source: credit.source,
          note: `Remainder from split credit ${credit.id}`,
          expiresAt: credit.expiresAt,
        },
      });
      remaining = 0;
    }
  }

  res.json({ applied: amount, orderId, remainingBalance: balance - amount });
});

// Get credit history for user
storeCreditRoutes.get('/history/:userId', async (req: Request, res: Response) => {
  const { userId } = req.params;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError(404, 'User not found');

  const credits = await prisma.storeCredit.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  res.json(credits);
});
