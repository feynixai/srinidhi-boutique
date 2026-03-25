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
