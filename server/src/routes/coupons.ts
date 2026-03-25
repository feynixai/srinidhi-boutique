import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

export const couponRoutes = Router();

couponRoutes.post('/validate', async (req: Request, res: Response) => {
  const { code, orderAmount, userId, categoryId } = z
    .object({
      code: z.string().min(1),
      orderAmount: z.number().positive(),
      userId: z.string().optional(),
      categoryId: z.string().optional(),
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
    // Compute time remaining even for expired coupons — return 0
    res.json({ valid: false, message: 'Coupon has expired', expiresAt: coupon.expiresAt });
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

  // Category-specific coupon check
  if (coupon.categoryId && categoryId && coupon.categoryId !== categoryId) {
    const cat = await prisma.category.findUnique({ where: { id: coupon.categoryId } });
    res.json({ valid: false, message: `This coupon is only valid for ${cat?.name || 'a specific category'}` });
    return;
  }

  // First-order only check
  if (coupon.firstOrderOnly && userId) {
    const priorOrders = await prisma.order.count({ where: { userId } });
    if (priorOrders > 0) {
      res.json({ valid: false, message: 'This coupon is valid for first orders only' });
      return;
    }
  }

  // User-specific coupon check
  if (coupon.userId && userId && coupon.userId !== userId) {
    res.json({ valid: false, message: 'This coupon is not valid for your account' });
    return;
  }

  const discountAmount = coupon.type === 'flat'
    ? Math.min(coupon.discount, orderAmount)
    : (orderAmount * coupon.discount) / 100;

  // Countdown info
  const expiresAt = coupon.expiresAt;
  const msLeft = expiresAt ? expiresAt.getTime() - Date.now() : null;
  const daysLeft = msLeft !== null ? Math.ceil(msLeft / (1000 * 60 * 60 * 24)) : null;
  const countdownText = daysLeft !== null
    ? daysLeft <= 0 ? 'Expires today!' : daysLeft === 1 ? 'Expires tomorrow!' : `Coupon expires in ${daysLeft} days`
    : null;

  res.json({
    valid: true,
    discount: coupon.discount,
    type: coupon.type,
    discountAmount,
    message: coupon.type === 'flat' ? `₹${coupon.discount} off applied!` : `${coupon.discount}% off applied!`,
    expiresAt,
    countdownText,
    categoryId: coupon.categoryId,
    firstOrderOnly: coupon.firstOrderOnly,
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
      firstOrderOnly: false,
      userId: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
  });

  // Filter coupons that meet min order requirement and haven't hit max uses
  const eligible = validCoupons.filter((c) => {
    if (c.maxUses !== null && c.usedCount >= c.maxUses) return false;
    if (c.minOrder && total < Number(c.minOrder)) return false;
    return true;
  });

  const withSavings = eligible.map((c) => {
    const discountAmount = c.type === 'flat'
      ? Math.min(c.discount, total)
      : Math.round((total * c.discount) / 100);
    const label = c.type === 'flat' ? `₹${c.discount} off` : `${c.discount}% off`;
    return {
      code: c.code,
      discount: c.discount,
      type: c.type,
      discountAmount,
      minOrder: c.minOrder ? Number(c.minOrder) : null,
      message: `${label} — saves ₹${discountAmount}`,
    };
  });

  withSavings.sort((a, b) => b.discountAmount - a.discountAmount);

  const best = withSavings[0] || null;
  if (best) {
    (best as Record<string, unknown>).isBestDeal = true;
  }

  res.json({ coupons: withSavings, best });
});
