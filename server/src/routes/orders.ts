import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

export const orderRoutes = Router();

const addressSchema = z.object({
  line1: z.string().min(1),
  line2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  pincode: z.string().min(6).max(6),
});

const orderItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
  size: z.string().optional(),
  color: z.string().optional(),
});

const placeOrderSchema = z.object({
  customerName: z.string().min(1),
  customerPhone: z.string().min(10),
  customerEmail: z.string().email().optional(),
  address: addressSchema,
  items: z.array(orderItemSchema).min(1),
  paymentMethod: z.enum(['razorpay', 'cod', 'upi']),
  paymentId: z.string().optional(),
  couponCode: z.string().optional(),
  notes: z.string().optional(),
  sessionId: z.string().optional(),
});

async function generateOrderNumber(): Promise<string> {
  const count = await prisma.order.count();
  return `SB-${String(count + 1).padStart(4, '0')}`;
}

orderRoutes.post('/', async (req: Request, res: Response) => {
  const data = placeOrderSchema.parse(req.body);

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

  const shipping = subtotal >= 999 ? 0 : 99;
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
      status: 'placed',
      paymentStatus: data.paymentMethod === 'cod' ? 'pending' : 'paid',
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

  await Promise.all(
    data.items.map((item) =>
      prisma.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      })
    )
  );

  if (data.sessionId) {
    await prisma.cartItem.deleteMany({ where: { sessionId: data.sessionId } });
  }

  res.status(201).json(order);
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

  const order = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!order) throw new AppError(404, 'Order not found');

  const updated = await prisma.order.update({
    where: { id: req.params.id },
    data: { status, ...(trackingId ? { trackingId } : {}) },
  });

  res.json(updated);
});
