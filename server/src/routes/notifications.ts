import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import {
  sendOrderConfirmationWhatsApp,
  sendShippingUpdateWhatsApp,
  sendDeliveryWhatsApp,
  buildClickToChatLink,
  type OrderDetails,
} from '../lib/whatsapp';
import {
  sendOrderConfirmationEmail,
  sendShippingEmail,
  type OrderEmailData,
} from '../lib/email';

export const notificationRoutes = Router();

function toOrderDetails(order: {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  total: unknown;
  paymentMethod: string;
  trackingId?: string | null;
  items: Array<{ name: string; quantity: number; price: unknown }>;
}): OrderDetails {
  return {
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    total: Number(order.total),
    paymentMethod: order.paymentMethod,
    trackingId: order.trackingId || undefined,
    items: order.items.map((i) => ({
      name: i.name,
      quantity: i.quantity,
      price: Number(i.price),
    })),
  };
}

// POST /api/notifications/send-order-confirmation
notificationRoutes.post('/send-order-confirmation', async (req: Request, res: Response) => {
  const { orderId } = z.object({ orderId: z.string() }).parse(req.body);

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) throw new AppError(404, 'Order not found');

  const details = toOrderDetails(order);
  const results: Record<string, unknown> = {};

  // WhatsApp
  const waResult = await sendOrderConfirmationWhatsApp(details);
  results.whatsapp = waResult;

  // Email
  if (order.customerEmail) {
    const emailData: OrderEmailData = {
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      items: order.items.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        price: Number(i.price),
        size: i.size || undefined,
        color: i.color || undefined,
        image: i.image || undefined,
      })),
      subtotal: Number(order.subtotal),
      shipping: Number(order.shipping),
      discount: Number(order.discount),
      total: Number(order.total),
      paymentMethod: order.paymentMethod,
      address: order.address as OrderEmailData['address'],
    };
    results.email = await sendOrderConfirmationEmail(order.customerEmail, emailData);
  }

  res.json({ success: true, results });
});

// POST /api/notifications/send-shipping-update
notificationRoutes.post('/send-shipping-update', async (req: Request, res: Response) => {
  const { orderId } = z.object({ orderId: z.string() }).parse(req.body);

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) throw new AppError(404, 'Order not found');

  const details = toOrderDetails(order);
  const results: Record<string, unknown> = {};

  results.whatsapp = await sendShippingUpdateWhatsApp(details);

  if (order.customerEmail) {
    results.email = await sendShippingEmail(order.customerEmail, {
      customerName: order.customerName,
      orderNumber: order.orderNumber,
      trackingId: order.trackingId || undefined,
    });
  }

  res.json({ success: true, results });
});

// POST /api/notifications/send-delivery-update
notificationRoutes.post('/send-delivery-update', async (req: Request, res: Response) => {
  const { orderId } = z.object({ orderId: z.string() }).parse(req.body);

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) throw new AppError(404, 'Order not found');

  const details = toOrderDetails(order);
  const waResult = await sendDeliveryWhatsApp(details);

  res.json({ success: true, results: { whatsapp: waResult } });
});

// GET /api/notifications/whatsapp-link — generate click-to-chat link
notificationRoutes.get('/whatsapp-link', (req: Request, res: Response) => {
  const { phone, message } = z
    .object({ phone: z.string(), message: z.string().max(1000) })
    .parse(req.query);

  const link = buildClickToChatLink(phone, message);
  res.json({ link });
});
