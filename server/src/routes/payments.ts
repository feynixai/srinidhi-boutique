import { Router, Request, Response } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { z } from 'zod';
import { AppError } from '../middleware/errorHandler';

export const paymentRoutes = Router();

function getRazorpay() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw new AppError(500, 'Razorpay not configured');
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

// Create a Razorpay order
paymentRoutes.post('/create-order', async (req: Request, res: Response) => {
  const { amount, currency = 'INR', receipt } = z
    .object({
      amount: z.number().positive(), // in rupees (will be converted to paise)
      currency: z.string().default('INR'),
      receipt: z.string().optional(),
    })
    .parse(req.body);

  const razorpay = getRazorpay();
  const order = await (razorpay.orders.create as Function)({
    amount: Math.round(amount * 100), // convert to paise
    currency,
    receipt: receipt || `rcpt_${Date.now()}`,
  });

  res.json({
    id: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
  });
});

// Verify Razorpay payment signature
paymentRoutes.post('/verify', async (req: Request, res: Response) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = z
    .object({
      razorpay_order_id: z.string(),
      razorpay_payment_id: z.string(),
      razorpay_signature: z.string(),
    })
    .parse(req.body);

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) throw new AppError(500, 'Razorpay not configured');

  const body = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expectedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(body)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    throw new AppError(400, 'Payment verification failed — signature mismatch');
  }

  res.json({ verified: true, paymentId: razorpay_payment_id });
});
