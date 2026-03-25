import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

export const giftCardRoutes = Router();

function generateGiftCardCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 16; i++) {
    if (i > 0 && i % 4 === 0) code += '-';
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// Purchase gift card
giftCardRoutes.post('/purchase', async (req: Request, res: Response) => {
  const { amount, purchasedById, recipientEmail, recipientPhone, recipientName, message } = z
    .object({
      amount: z.number().positive(),
      purchasedById: z.string().optional(),
      recipientEmail: z.string().email().optional(),
      recipientPhone: z.string().optional(),
      recipientName: z.string().optional(),
      message: z.string().optional(),
    })
    .parse(req.body);

  const validAmounts = [500, 1000, 2000, 5000];
  if (!validAmounts.includes(amount)) {
    throw new AppError(400, `Amount must be one of: ${validAmounts.join(', ')}`);
  }

  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  const giftCard = await prisma.giftCard.create({
    data: {
      code: generateGiftCardCode(),
      balance: amount,
      originalAmount: amount,
      purchasedById,
      recipientEmail,
      recipientPhone,
      recipientName,
      message,
      expiresAt,
    },
  });

  res.status(201).json(giftCard);
});

// Check gift card balance
giftCardRoutes.get('/:code/balance', async (req: Request, res: Response) => {
  const { code } = req.params;

  const giftCard = await prisma.giftCard.findUnique({ where: { code } });
  if (!giftCard) throw new AppError(404, 'Gift card not found');

  const expired = giftCard.expiresAt < new Date();

  res.json({
    code: giftCard.code,
    balance: giftCard.balance,
    originalAmount: giftCard.originalAmount,
    expired,
    expiresAt: giftCard.expiresAt,
  });
});

// Redeem gift card at checkout
giftCardRoutes.post('/redeem', async (req: Request, res: Response) => {
  const { code, amount, orderId } = z
    .object({
      code: z.string(),
      amount: z.number().positive(),
      orderId: z.string().optional(),
    })
    .parse(req.body);

  const giftCard = await prisma.giftCard.findUnique({ where: { code } });
  if (!giftCard) throw new AppError(404, 'Gift card not found');
  if (giftCard.expiresAt < new Date()) throw new AppError(400, 'Gift card has expired');

  const currentBalance = Number(giftCard.balance);
  if (currentBalance <= 0) throw new AppError(400, 'Gift card has no remaining balance');

  const deducted = Math.min(amount, currentBalance);
  const newBalance = currentBalance - deducted;

  await prisma.giftCard.update({
    where: { code },
    data: { balance: newBalance },
  });

  await prisma.giftCardTransaction.create({
    data: {
      giftCardId: giftCard.id,
      amount: deducted,
      orderId,
      note: `Redeemed ${deducted} at checkout`,
    },
  });

  res.json({
    deducted,
    remainingBalance: newBalance,
    code: giftCard.code,
  });
});

// Get gift card transactions
giftCardRoutes.get('/:code/transactions', async (req: Request, res: Response) => {
  const { code } = req.params;
  const giftCard = await prisma.giftCard.findUnique({
    where: { code },
    include: { transactions: { orderBy: { createdAt: 'desc' } } },
  });
  if (!giftCard) throw new AppError(404, 'Gift card not found');
  res.json(giftCard.transactions);
});

// ── Admin ──────────────────────────────────────────────────────────────────

giftCardRoutes.get('/admin/list', async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  const [cards, total] = await Promise.all([
    prisma.giftCard.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.giftCard.count(),
  ]);

  res.json({ cards, total, page, pages: Math.ceil(total / limit) });
});
