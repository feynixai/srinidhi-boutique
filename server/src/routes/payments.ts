import { Router, Request, Response } from 'express';
import Razorpay from 'razorpay';
import Stripe from 'stripe';
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

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new AppError(500, 'Stripe not configured');
  return new Stripe(key);
}

// Create a Razorpay order
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

// ── Stripe ───────────────────────────────────────────────────────────────────

// POST /api/payments/stripe/create-session
paymentRoutes.post('/stripe/create-session', async (req: Request, res: Response) => {
  const { orderNumber, amount, currency = 'inr', customerEmail, successUrl, cancelUrl } = z
    .object({
      orderNumber: z.string(),
      amount: z.number().positive(), // in INR
      currency: z.string().default('inr'),
      customerEmail: z.string().email().optional(),
      successUrl: z.string().url(),
      cancelUrl: z.string().url(),
    })
    .parse(req.body);

  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency,
          product_data: { name: `Srinidhi Boutique — Order ${orderNumber}` },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    customer_email: customerEmail,
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { orderNumber },
  });

  res.json({ sessionId: session.id, url: session.url });
});

// POST /api/payments/stripe/webhook
// NOTE: Must be raw body. In prod, configure express.raw() for this route.
paymentRoutes.post('/stripe/webhook', express_raw_placeholder, async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    // Dev mode — body may be a Buffer (raw) or already parsed JSON
    const raw = req.body;
    let event: Stripe.Event;
    if (Buffer.isBuffer(raw)) {
      event = JSON.parse(raw.toString()) as Stripe.Event;
    } else {
      event = raw as unknown as Stripe.Event;
    }
    await handleStripeEvent(event);
    return res.json({ received: true });
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(req.body as Buffer, sig, webhookSecret);
  } catch {
    throw new AppError(400, 'Webhook signature verification failed');
  }

  await handleStripeEvent(event);
  res.json({ received: true });
});

// Dummy middleware placeholder (express.raw is configured in index.ts for /stripe/webhook)
function express_raw_placeholder(_req: Request, _res: Response, next: () => void) {
  next();
}

async function handleStripeEvent(event: Stripe.Event) {
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderNumber = session.metadata?.orderNumber;
    if (orderNumber) {
      await prisma.order.updateMany({
        where: { orderNumber },
        data: { paymentStatus: 'paid', paymentId: session.payment_intent as string },
      });
    }
  }
}
