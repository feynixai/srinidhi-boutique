import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

export const couponRoutes = Router();

couponRoutes.post('/validate', async (req: Request, res: Response) => {
  const { code, orderAmount } = z
    .object({
      code: z.string().min(1),
      orderAmount: z.number().positive(),
    })
    .parse(req.body);

  const coupon = await prisma.coupon.findUnique({
    where: { code: code.toUpperCase(), active: true },
  });

  if (!coupon) {
    res.json({ valid: false, message: 'Invalid coupon code' });
    return;
  }

  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    res.json({ valid: false, message: 'Coupon has expired' });
    return;
  }

  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    res.json({ valid: false, message: 'Coupon usage limit reached' });
    return;
  }

  if (coupon.minOrder && orderAmount < Number(coupon.minOrder)) {
    res.json({
      valid: false,
      message: `Minimum order amount of ₹${coupon.minOrder} required`,
    });
    return;
  }

  const discountAmount = (orderAmount * coupon.discount) / 100;

  res.json({
    valid: true,
    discount: coupon.discount,
    discountAmount,
    message: `${coupon.discount}% off applied!`,
  });
});

// GET /api/coupons/best?total=XXX — find the best valid coupon for an order total
couponRoutes.get('/best', async (req: Request, res: Response) => {
  const total = parseFloat((req.query.total as string) || '0');
  if (!total || total <= 0) {
    res.json({ coupons: [], best: null });
    return;
  }

  const now = new Date();

  const validCoupons = await prisma.coupon.findMany({
    where: {
      active: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
  });

  // Filter coupons that meet min order requirement and haven't hit max uses
  const eligible = validCoupons.filter((c) => {
    if (c.maxUses !== null && c.usedCount >= c.maxUses) return false;
    if (c.minOrder && total < Number(c.minOrder)) return false;
    return true;
  });

  const withSavings = eligible.map((c) => ({
    code: c.code,
    discount: c.discount,
    discountAmount: Math.round((total * c.discount) / 100),
    minOrder: c.minOrder ? Number(c.minOrder) : null,
    message: `${c.discount}% off — saves ₹${Math.round((total * c.discount) / 100)}`,
  }));

  withSavings.sort((a, b) => b.discountAmount - a.discountAmount);

  const best = withSavings[0] || null;
  if (best) {
    (best as Record<string, unknown>).isBestDeal = true;
  }

  res.json({ coupons: withSavings, best });
});
