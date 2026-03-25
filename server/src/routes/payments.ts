import { Router, Request, Response } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';

export const paymentRoutes = Router();
const prisma = new PrismaClient();

function getRazorpay() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw new AppError(500, 'Razorpay not configured');
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

// Create a Razorpay order — works for INR (India) and international cards
// For international customers, currency can be passed as USD/GBP/AED etc.
// Razorpay supports Visa/Mastercard worldwide.
paymentRoutes.post('/create-order', async (req: Request, res: Response) => {
  const { amount, currency = 'INR', receipt } = z
    .object({
      amount: z.number().positive(),
      currency: z.string().default('INR'),
      receipt: z.string().optional(),
    })
    .parse(req.body);

  const razorpay = getRazorpay();
  const order = await (razorpay.orders.create as Function)({
    amount: Math.round(amount * 100),
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

// Bank transfer details for international customers
// Admin manually confirms after receiving the transfer.
paymentRoutes.get('/bank-transfer-details', async (_req: Request, res: Response) => {
  res.json({
    bankName: 'HDFC Bank',
    accountName: 'Srinidhi Boutique',
    accountNumber: process.env.BANK_ACCOUNT_NUMBER || 'XXXXXXXXXXXX',
    ifsc: process.env.BANK_IFSC || 'HDFC0000000',
    swift: process.env.BANK_SWIFT || 'HDFCINBB',
    instructions: [
      'Transfer the exact order amount to the account above.',
      'Use your order number as the payment reference.',
      'Send payment proof to srinidhiboutique@gmail.com.',
      'Orders are dispatched after payment confirmation (1–2 business days).',
    ],
  });
});

// Confirm a bank transfer (admin action) — marks order as paid
paymentRoutes.post('/bank-transfer/confirm', async (req: Request, res: Response) => {
  const { orderNumber, referenceNumber } = z
    .object({
      orderNumber: z.string(),
      referenceNumber: z.string().optional(),
    })
    .parse(req.body);

  const order = await prisma.order.findFirst({ where: { orderNumber } });
  if (!order) throw new AppError(404, 'Order not found');

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      paymentStatus: 'paid',
      paymentId: referenceNumber || `BANK-${Date.now()}`,
      status: 'confirmed',
    },
  });

  res.json({ success: true, order: updated });
});
