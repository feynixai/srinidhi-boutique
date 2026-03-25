import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

export const loyaltyRoutes = Router();

function getTier(points: number): string {
  if (points >= 2000) return 'Gold';
  if (points >= 500) return 'Silver';
  return 'Bronze';
}

function getTierBenefits(tier: string) {
  const benefits: Record<string, { earlyAccess: boolean; freeShipping: boolean; birthdayDiscount: number }> = {
    Bronze: { earlyAccess: false, freeShipping: false, birthdayDiscount: 5 },
    Silver: { earlyAccess: true, freeShipping: false, birthdayDiscount: 10 },
    Gold:   { earlyAccess: true, freeShipping: true, birthdayDiscount: 15 },
  };
  return benefits[tier] || benefits.Bronze;
}

// Get or create loyalty account for user
loyaltyRoutes.get('/account/:userId', async (req: Request, res: Response) => {
  const { userId } = req.params;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError(404, 'User not found');

  let account = await prisma.loyaltyAccount.findUnique({
    where: { userId },
    include: { history: { orderBy: { createdAt: 'desc' }, take: 20 } },
  });

  if (!account) {
    account = await prisma.loyaltyAccount.create({
      data: { userId, points: 0, tier: 'Bronze', totalEarned: 0 },
      include: { history: true },
    });
  }

  res.json({ ...account, tierBenefits: getTierBenefits(account.tier) });
});

// Earn points (called after order placed)
loyaltyRoutes.post('/earn', async (req: Request, res: Response) => {
  const { userId, orderId, orderTotal, reason } = z
    .object({
      userId: z.string(),
      orderId: z.string().optional(),
      orderTotal: z.number().positive().optional(),
      reason: z.enum(['purchase', 'review', 'referral', 'manual']),
    })
    .parse(req.body);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError(404, 'User not found');

  let pointsToAdd = 0;
  let description = '';

  if (reason === 'purchase' && orderTotal) {
    pointsToAdd = Math.floor(orderTotal / 10); // 1 point per ₹10
    description = `Earned ${pointsToAdd} points for order`;
  } else if (reason === 'review') {
    pointsToAdd = 10;
    description = 'Earned 10 points for writing a review';
  } else if (reason === 'referral') {
    pointsToAdd = 50;
    description = 'Earned 50 points for referring a friend';
  } else if (reason === 'manual') {
    pointsToAdd = 0; // will be overridden by admin
    description = 'Manual points adjustment';
  }

  let account = await prisma.loyaltyAccount.findUnique({ where: { userId } });

  if (!account) {
    account = await prisma.loyaltyAccount.create({
      data: { userId, points: 0, tier: 'Bronze', totalEarned: 0 },
    });
  }

  const newPoints = account.points + pointsToAdd;
  const newTotalEarned = account.totalEarned + pointsToAdd;
  const newTier = getTier(newTotalEarned);

  const [updatedAccount] = await prisma.$transaction([
    prisma.loyaltyAccount.update({
      where: { id: account.id },
      data: { points: newPoints, tier: newTier, totalEarned: newTotalEarned },
    }),
    prisma.loyaltyHistory.create({
      data: {
        loyaltyAccountId: account.id,
        delta: pointsToAdd,
        reason,
        description,
        orderId: orderId || null,
      },
    }),
  ]);

  res.json({ account: updatedAccount, pointsAdded: pointsToAdd, newTier });
});

// Redeem points at checkout
loyaltyRoutes.post('/redeem', async (req: Request, res: Response) => {
  const { userId, points } = z
    .object({ userId: z.string(), points: z.number().positive().int() })
    .parse(req.body);

  // 100 points = ₹50
  if (points % 100 !== 0) throw new AppError(400, 'Points must be in multiples of 100');

  const account = await prisma.loyaltyAccount.findUnique({ where: { userId } });
  if (!account) throw new AppError(404, 'Loyalty account not found');
  if (account.points < points) throw new AppError(400, 'Insufficient points');

  const discountAmount = (points / 100) * 50;
  const newPoints = account.points - points;
  const newTier = getTier(account.totalEarned);

  const [updatedAccount] = await prisma.$transaction([
    prisma.loyaltyAccount.update({
      where: { id: account.id },
      data: { points: newPoints, tier: newTier },
    }),
    prisma.loyaltyHistory.create({
      data: {
        loyaltyAccountId: account.id,
        delta: -points,
        reason: 'redeem',
        description: `Redeemed ${points} points for ₹${discountAmount} discount`,
      },
    }),
  ]);

  res.json({ account: updatedAccount, discountAmount, pointsRedeemed: points });
});

// Admin: view all loyalty accounts
loyaltyRoutes.get('/admin/accounts', async (req: Request, res: Response) => {
  const { tier, page = '1', limit = '20' } = req.query;
  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);

  const where: Record<string, unknown> = {};
  if (tier) where.tier = tier;

  const [accounts, total] = await Promise.all([
    prisma.loyaltyAccount.findMany({
      where,
      include: { user: { select: { id: true, name: true, phone: true, email: true } } },
      orderBy: { points: 'desc' },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    }),
    prisma.loyaltyAccount.count({ where }),
  ]);

  res.json({ accounts, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
});

// Admin: manually adjust points
loyaltyRoutes.post('/admin/adjust', async (req: Request, res: Response) => {
  const { userId, delta, description } = z
    .object({
      userId: z.string(),
      delta: z.number().int(),
      description: z.string().min(1),
    })
    .parse(req.body);

  let account = await prisma.loyaltyAccount.findUnique({ where: { userId } });

  if (!account) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError(404, 'User not found');
    account = await prisma.loyaltyAccount.create({
      data: { userId, points: 0, tier: 'Bronze', totalEarned: 0 },
    });
  }

  const newPoints = Math.max(0, account.points + delta);
  const newTotalEarned = delta > 0 ? account.totalEarned + delta : account.totalEarned;
  const newTier = getTier(newTotalEarned);

  const [updatedAccount] = await prisma.$transaction([
    prisma.loyaltyAccount.update({
      where: { id: account.id },
      data: { points: newPoints, tier: newTier, totalEarned: newTotalEarned },
    }),
    prisma.loyaltyHistory.create({
      data: {
        loyaltyAccountId: account.id,
        delta,
        reason: 'manual',
        description,
      },
    }),
  ]);

  res.json(updatedAccount);
});

// Admin: loyalty stats
loyaltyRoutes.get('/admin/stats', async (_req: Request, res: Response) => {
  const [totalAccounts, tierCounts, topEarners] = await Promise.all([
    prisma.loyaltyAccount.count(),
    prisma.loyaltyAccount.groupBy({
      by: ['tier'],
      _count: { tier: true },
    }),
    prisma.loyaltyAccount.findMany({
      orderBy: { totalEarned: 'desc' },
      take: 10,
      include: { user: { select: { name: true, phone: true } } },
    }),
  ]);

  res.json({ totalAccounts, tierCounts, topEarners });
});
