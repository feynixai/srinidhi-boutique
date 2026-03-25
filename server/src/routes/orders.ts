import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { calculateShipping } from './shipping';
import {
  sendOrderConfirmationWhatsApp,
  sendShippingUpdateWhatsApp,
  sendDeliveryWhatsApp,
  sendAdminOrderNotification,
  type OrderDetails,
} from '../lib/whatsapp';
import { sendOrderConfirmationEmail, sendShippingEmail, type OrderEmailData } from '../lib/email';

export const orderRoutes = Router();

const addressSchema = z.object({
  line1: z.string().min(1),
  line2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().optional(),
  pincode: z.string().min(3).max(10),
  country: z.string().optional(),
});

const orderItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
  size: z.string().optional(),
  color: z.string().optional(),
});

const placeOrderSchema = z.object({
  customerName: z.string().min(1),
  customerPhone: z.string().min(5),
  customerEmail: z.string().email().optional(),
  address: addressSchema,
  items: z.array(orderItemSchema).min(1),
  paymentMethod: z.enum(['razorpay', 'cod', 'upi', 'bank_transfer']),
  paymentId: z.string().optional(),
  couponCode: z.string().optional(),
  notes: z.string().optional(),
  sessionId: z.string().optional(),
  country: z.string().optional().default('IN'),
  userId: z.string().optional(),
});

async function generateOrderNumber(): Promise<string> {
  const count = await prisma.order.count();
  return `SB-${String(count + 1).padStart(4, '0')}`;
}

orderRoutes.post('/', async (req: Request, res: Response) => {
  const data = placeOrderSchema.parse(req.body);
  const country = data.country || 'IN';

  const products = await Promise.all(
    data.items.map((item) =>
      prisma.product.findUnique({ where: { id: item.productId, active: true } })
    )
  );

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    if (!product) throw new AppError(404, `Product not found: ${data.items[i].productId}`);
    if (product.stock < data.items[i].quantity)
      throw new AppError(400, `Insufficient stock for ${product.name}`);
  }

  let discount = 0;
  let couponCode: string | undefined;

  if (data.couponCode) {
    const coupon = await prisma.coupon.findUnique({
      where: { code: data.couponCode.toUpperCase(), active: true },
    });

    if (coupon) {
      const subtotalForCoupon = products.reduce(
        (sum, product, i) => sum + Number(product!.price) * data.items[i].quantity,
        0
      );

      const isExpired = coupon.expiresAt && coupon.expiresAt < new Date();
      const isMaxUsed = coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses;
      const meetsMinOrder = !coupon.minOrder || subtotalForCoupon >= Number(coupon.minOrder);

      if (!isExpired && !isMaxUsed && meetsMinOrder) {
        discount = (subtotalForCoupon * coupon.discount) / 100;
        couponCode = data.couponCode.toUpperCase();
        await prisma.coupon.update({
          where: { id: coupon.id },
          data: { usedCount: { increment: 1 } },
        });
      }
    }
  }

  const subtotal = products.reduce(
    (sum, product, i) => sum + Number(product!.price) * data.items[i].quantity,
    0
  );

  const shipping = calculateShipping(subtotal, country);
  const total = subtotal + shipping - discount;
  const orderNumber = await generateOrderNumber();

  const order = await prisma.order.create({
    data: {
      orderNumber,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerEmail: data.customerEmail,
      address: data.address,
      subtotal,
      shipping,
      discount,
      total,
      paymentMethod: data.paymentMethod,
      paymentId: data.paymentId,
      couponCode,
      notes: data.notes,
      country,
      status: 'placed',
      paymentStatus: data.paymentMethod === 'cod' ? 'pending' : 'paid',
      ...(data.userId ? { userId: data.userId } : {}),
      items: {
        create: data.items.map((item, i) => ({
          productId: item.productId,
          name: products[i]!.name,
          price: products[i]!.price,
          quantity: item.quantity,
          size: item.size,
          color: item.color,
          image: products[i]!.images[0] || null,
        })),
      },
    },
    include: { items: { include: { product: true } } },
  });

  // Decrement stock, auto-disable when stock hits 0, log movement
  await Promise.all(
    data.items.map(async (item, i) => {
      const newStock = products[i]!.stock - item.quantity;
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: newStock, ...(newStock === 0 ? { active: false } : {}) },
      });
      await prisma.stockMovement.create({
        data: {
          productId: item.productId,
          delta: -item.quantity,
          reason: 'sale',
          note: `Order ${order.orderNumber}`,
        },
      });
    })
  );

  if (data.sessionId) {
    await prisma.cartItem.deleteMany({ where: { sessionId: data.sessionId } });
  }

  // Fire notifications async (don't block response)
  const orderDetails: OrderDetails = {
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    total: Number(order.total),
    paymentMethod: order.paymentMethod,
    items: order.items.map((i) => ({ name: i.name, quantity: i.quantity, price: Number(i.price) })),
  };
  Promise.all([
    sendOrderConfirmationWhatsApp(orderDetails),
    sendAdminOrderNotification(orderDetails),
    ...(order.customerEmail
      ? [
          sendOrderConfirmationEmail(order.customerEmail, {
            orderNumber: order.orderNumber,
            customerName: order.customerName,
            items: order.items.map((i) => ({
              name: i.name,
              quantity: i.quantity,
              price: Number(i.price),
              size: i.size || undefined,
              color: i.color || undefined,
            })),
            subtotal: Number(order.subtotal),
            shipping: Number(order.shipping),
            discount: Number(order.discount),
            total: Number(order.total),
            paymentMethod: order.paymentMethod,
            address: order.address as OrderEmailData['address'],
          } satisfies OrderEmailData),
        ]
      : []),
  ]).catch(() => {});

  res.status(201).json(order);
});

// Lookup orders by phone number
orderRoutes.get('/by-phone/:phone', async (req: Request, res: Response) => {
  const orders = await prisma.order.findMany({
    where: { customerPhone: req.params.phone },
    include: { items: { include: { product: { select: { name: true, images: true, slug: true } } } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(orders);
});

orderRoutes.get('/track', async (req: Request, res: Response) => {
  const { orderNumber, phone } = req.query as { orderNumber?: string; phone?: string };
  if (!orderNumber || !phone) throw new AppError(400, 'orderNumber and phone are required');

  const order = await prisma.order.findFirst({
    where: { orderNumber: orderNumber.toUpperCase(), customerPhone: phone },
    include: { items: true },
  });

  if (!order) throw new AppError(404, 'Order not found');

  res.json(order);
});

orderRoutes.get('/:id', async (req: Request, res: Response) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { items: { include: { product: true } } },
  });

  if (!order) throw new AppError(404, 'Order not found');

  res.json(order);
});

orderRoutes.get('/number/:orderNumber', async (req: Request, res: Response) => {
  const order = await prisma.order.findUnique({
    where: { orderNumber: req.params.orderNumber },
    include: { items: { include: { product: true } } },
  });

  if (!order) throw new AppError(404, 'Order not found');

  res.json(order);
});

orderRoutes.post('/:id/status', async (req: Request, res: Response) => {
  const { status, trackingId } = z
    .object({
      status: z.enum(['placed', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled', 'returned']),
      trackingId: z.string().optional(),
    })
    .parse(req.body);

  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { items: true },
  });
  if (!order) throw new AppError(404, 'Order not found');

  const updated = await prisma.order.update({
    where: { id: req.params.id },
    data: { status, ...(trackingId ? { trackingId } : {}) },
  });

  // Fire status-based notifications async
  const details: OrderDetails = {
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    total: Number(order.total),
    paymentMethod: order.paymentMethod,
    trackingId: trackingId || order.trackingId || undefined,
    items: order.items.map((i) => ({ name: i.name, quantity: i.quantity, price: Number(i.price) })),
  };
  if (status === 'shipped') {
    Promise.all([
      sendShippingUpdateWhatsApp(details),
      ...(order.customerEmail
        ? [sendShippingEmail(order.customerEmail, { customerName: order.customerName, orderNumber: order.orderNumber, trackingId: trackingId || order.trackingId || undefined })]
        : []),
    ]).catch(() => {});
  } else if (status === 'delivered') {
    sendDeliveryWhatsApp(details).catch(() => {});
  }

  res.json(updated);
});
