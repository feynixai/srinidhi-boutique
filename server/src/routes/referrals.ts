import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

export const referralRoutes = Router();

function generateReferralCode(userId: string): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const suffix = userId.slice(-4).toUpperCase();
  let prefix = '';
  for (let i = 0; i < 4; i++) {
    prefix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `REF${prefix}${suffix}`;
}

// Get or create referral code for user
referralRoutes.get('/code/:userId', async (req: Request, res: Response) => {
  const { userId } = req.params;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError(404, 'User not found');

  // Find existing pending/active referral by this user that has no referred user (their own code)
  let referral = await prisma.referral.findFirst({
    where: { referrerId: userId, referredId: null, status: 'pending' },
  });

  if (!referral) {
    let code = generateReferralCode(userId);
    // ensure uniqueness
    let attempts = 0;
    while (attempts < 10) {
      const existing = await prisma.referral.findUnique({ where: { code } });
      if (!existing) break;
      code = generateReferralCode(userId);
      attempts++;
    }
    referral = await prisma.referral.create({
      data: { referrerId: userId, code, status: 'pending' },
    });
  }

  // Stats: how many successful referrals
  const completedCount = await prisma.referral.count({
    where: { referrerId: userId, status: 'completed' },
  });

  const referralUrl = `${process.env.FRONTEND_URL || 'https://srinidhboutique.in'}?ref=${referral.code}`;

  res.json({
    code: referral.code,
    referralUrl,
    completedReferrals: completedCount,
    referrerReward: 200, // ₹200 store credit
    friendReward: 100,   // ₹100 off first order
  });
});

// Apply referral code at checkout (friend uses code)
referralRoutes.post('/apply', async (req: Request, res: Response) => {
  const { code, newUserId } = z
    .object({ code: z.string().min(1), newUserId: z.string() })
    .parse(req.body);

  const referral = await prisma.referral.findUnique({ where: { code: code.toUpperCase() } });

  if (!referral || referral.status !== 'pending' || referral.referredId !== null) {
    res.json({ valid: false, message: 'Invalid or already used referral code' });
    return;
  }

  if (referral.referrerId === newUserId) {
    res.json({ valid: false, message: 'Cannot use your own referral code' });
    return;
  }

  // Check this user hasn't been referred before
  const alreadyReferred = await prisma.referral.findFirst({
    where: { referredId: newUserId },
  });
  if (alreadyReferred) {
    res.json({ valid: false, message: 'Referral code already used' });
    return;
  }

  res.json({
    valid: true,
    referrerId: referral.referrerId,
    discount: 100, // ₹100 off for new user
    message: 'Referral code applied! You get ₹100 off your first order.',
  });
});

// Complete referral after first purchase
referralRoutes.post('/complete', async (req: Request, res: Response) => {
  const { code, newUserId } = z
    .object({ code: z.string().min(1), newUserId: z.string() })
    .parse(req.body);

  const referral = await prisma.referral.findUnique({ where: { code: code.toUpperCase() } });

  if (!referral || referral.referredId !== null) {
    res.json({ success: false, message: 'Referral not found or already completed' });
    return;
  }

  // Mark referral as completed and link the referred user
  await prisma.referral.update({
    where: { id: referral.id },
    data: { referredId: newUserId, status: 'completed' },
  });

  // Create a new pending referral code for the referrer (so they can still share)
  // Award ₹200 store credit to referrer via loyalty points (200 = 400 points worth)
  const referrerAccount = await prisma.loyaltyAccount.findUnique({
    where: { userId: referral.referrerId },
  });

  if (referrerAccount) {
    const pointsToAdd = 400; // equivalent to ₹200 store credit
    await prisma.$transaction([
      prisma.loyaltyAccount.update({
        where: { id: referrerAccount.id },
        data: {
          points: referrerAccount.points + pointsToAdd,
          totalEarned: referrerAccount.totalEarned + pointsToAdd,
        },
      }),
      prisma.loyaltyHistory.create({
        data: {
          loyaltyAccountId: referrerAccount.id,
          delta: pointsToAdd,
          reason: 'referral',
          description: 'Earned 400 points (₹200 value) for successful referral',
        },
      }),
    ]);
  }

  res.json({ success: true, referrerRewardPoints: 400, message: 'Referral completed! Referrer rewarded.' });
});

// List all referrals made by a user
referralRoutes.get('/stats/:userId', async (req: Request, res: Response) => {
  const { userId } = req.params;

  const referrals = await prisma.referral.findMany({
    where: { referrerId: userId },
    include: {
      referred: { select: { name: true, phone: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const completed = referrals.filter((r) => r.status === 'completed').length;

  res.json({ referrals, totalReferrals: referrals.length, completedReferrals: completed });
});
