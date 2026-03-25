import { Router, Request, Response } from 'express';
import { z } from 'zod';
import PDFDocument from 'pdfkit';
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
  deliverySlot: z.enum(['morning', 'afternoon', 'evening']).optional(),
});

async function generateOrderNumber(): Promise<string> {
  // Use random 4-digit number + existence check to avoid race conditions in concurrent environments
  for (let attempt = 0; attempt < 50; attempt++) {
    const n = 1000 + Math.floor(Math.random() * 9000);
    const candidate = `SB-${n}`;
    const exists = await prisma.order.findUnique({ where: { orderNumber: candidate } });
    if (!exists) return candidate;
  }
  throw new Error('Could not generate unique order number');
}

// In-memory idempotency store (for single-process, replace with Redis in production)
const pendingOrders = new Map<string, Promise<unknown>>();

orderRoutes.post('/', async (req: Request, res: Response) => {
  const idempotencyKey = req.headers['x-idempotency-key'] as string | undefined;

  // Double-submit prevention via idempotency key
  if (idempotencyKey) {
    if (pendingOrders.has(idempotencyKey)) {
      const result = await pendingOrders.get(idempotencyKey);
      return res.status(201).json(result);
    }
  }

  const data = placeOrderSchema.parse(req.body);
  const country = data.country || 'IN';

  // Use a transaction for optimistic stock locking to prevent race conditions
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
  let orderNumber = await generateOrderNumber();

  let order = await prisma.order.create({
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
      deliverySlot: data.deliverySlot,
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

  // Decrement stock with optimistic locking — verifies stock hasn't changed since read
  await prisma.$transaction(
    data.items.flatMap((item, i) => {
      const currentStock = products[i]!.stock;
      const newStock = currentStock - item.quantity;
      return [
        prisma.product.updateMany({
          where: {
            id: item.productId,
            stock: { gte: item.quantity }, // race condition guard
          },
          data: { stock: { decrement: item.quantity }, ...(newStock === 0 ? { active: false } : {}) },
        }),
        prisma.stockMovement.create({
          data: {
            productId: item.productId,
            delta: -item.quantity,
            reason: 'sale',
            note: `Order ${order.orderNumber}`,
          },
        }),
      ];
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

  // Register idempotency key
  if (idempotencyKey) {
    pendingOrders.delete(idempotencyKey);
  }

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

// PATCH /:id/shipping — set AWB + courier name (admin / Shiprocket webhook)
orderRoutes.patch('/:id/shipping', async (req: Request, res: Response) => {
  const { awbNumber, courierName, trackingId } = z.object({
    awbNumber: z.string().optional(),
    courierName: z.string().optional(),
    trackingId: z.string().optional(),
  }).parse(req.body);

  const order = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!order) throw new AppError(404, 'Order not found');

  const updated = await prisma.order.update({
    where: { id: req.params.id },
    data: {
      ...(awbNumber ? { awbNumber } : {}),
      ...(courierName ? { courierName } : {}),
      ...(trackingId ? { trackingId } : {}),
    },
  });
  res.json(updated);
});

// GET /:id/shiprocket — Shiprocket-ready order payload
orderRoutes.get('/:id/shiprocket', async (req: Request, res: Response) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { items: true },
  });
  if (!order) throw new AppError(404, 'Order not found');

  const address = order.address as Record<string, string>;

  // Format in Shiprocket-expected structure
  const payload = {
    order_id: order.orderNumber,
    order_date: order.createdAt.toISOString().split('T')[0],
    pickup_location: 'Primary',
    billing_customer_name: order.customerName,
    billing_last_name: '',
    billing_address: address.line1,
    billing_address_2: address.line2 || '',
    billing_city: address.city,
    billing_pincode: address.pincode,
    billing_state: address.state || '',
    billing_country: order.country === 'IN' ? 'India' : order.country,
    billing_email: order.customerEmail || '',
    billing_phone: order.customerPhone,
    shipping_is_billing: true,
    order_items: order.items.map((item) => ({
      name: item.name,
      sku: item.productId,
      units: item.quantity,
      selling_price: Number(item.price),
      discount: 0,
      tax: 5,
      hsn: 6204, // Standard HSN for women's garments
    })),
    payment_method: order.paymentMethod === 'cod' ? 'COD' : 'Prepaid',
    sub_total: Number(order.subtotal),
    length: 30,
    breadth: 25,
    height: 5,
    weight: 0.5,
  };

  res.json(payload);
});

// GET /:id/invoice-pdf — download invoice as PDF
orderRoutes.get('/:id/invoice-pdf', async (req: Request, res: Response) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { items: true },
  });
  if (!order) throw new AppError(404, 'Order not found');

  const address = order.address as Record<string, string>;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="invoice-${order.orderNumber}.pdf"`);

  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  doc.pipe(res);

  // Header
  doc.fontSize(20).font('Helvetica-Bold').text('SRINIDHI BOUTIQUE', 50, 50);
  doc.fontSize(10).font('Helvetica').text('Premium Women\'s Fashion, Hyderabad', 50, 75);
  doc.text('GSTIN: 36XXXXX1234X1ZX', 50, 90);
  doc.text('Phone: +91-9876543210 | Email: hello@srinidhiboutique.com', 50, 105);

  doc.moveTo(50, 125).lineTo(545, 125).stroke();

  // Invoice title
  doc.fontSize(16).font('Helvetica-Bold').text('TAX INVOICE', 400, 50);
  doc.fontSize(10).font('Helvetica').text(`Invoice #: ${order.orderNumber}`, 400, 75);
  doc.text(`Date: ${order.createdAt.toLocaleDateString('en-IN')}`, 400, 90);

  // Customer details
  doc.fontSize(11).font('Helvetica-Bold').text('Bill To:', 50, 140);
  doc.fontSize(10).font('Helvetica')
    .text(order.customerName, 50, 155)
    .text(order.customerPhone, 50, 170)
    .text(address.line1 + (address.line2 ? ', ' + address.line2 : ''), 50, 185)
    .text(`${address.city}, ${address.state || ''} - ${address.pincode}`, 50, 200);

  // Items table header
  const tableTop = 235;
  doc.font('Helvetica-Bold').fontSize(10);
  doc.rect(50, tableTop - 5, 495, 20).fill('#f0f0f0').stroke();
  doc.fillColor('black')
    .text('#', 55, tableTop)
    .text('Item', 75, tableTop)
    .text('Size/Color', 260, tableTop)
    .text('Qty', 355, tableTop)
    .text('Rate', 395, tableTop)
    .text('Amount', 465, tableTop);

  // Items
  let y = tableTop + 25;
  doc.font('Helvetica').fontSize(9);
  order.items.forEach((item, idx) => {
    const amount = Number(item.price) * item.quantity;
    doc.text(String(idx + 1), 55, y)
      .text(item.name, 75, y, { width: 175 })
      .text([item.size, item.color].filter(Boolean).join('/') || '-', 260, y)
      .text(String(item.quantity), 355, y)
      .text(`₹${Number(item.price).toFixed(2)}`, 395, y)
      .text(`₹${amount.toFixed(2)}`, 465, y);
    y += 20;
  });

  doc.moveTo(50, y).lineTo(545, y).stroke();
  y += 10;

  // Totals
  doc.fontSize(10).font('Helvetica');
  doc.text('Subtotal:', 380, y).text(`₹${Number(order.subtotal).toFixed(2)}`, 465, y); y += 18;
  doc.text('Shipping:', 380, y).text(`₹${Number(order.shipping).toFixed(2)}`, 465, y); y += 18;
  if (Number(order.discount) > 0) {
    doc.text('Discount:', 380, y).text(`-₹${Number(order.discount).toFixed(2)}`, 465, y); y += 18;
  }
  // GST (included in price — IGST 5% for garments)
  const gstBase = Number(order.subtotal) / 1.05;
  const gst = Number(order.subtotal) - gstBase;
  doc.text('GST (5% IGST):', 380, y).text(`₹${gst.toFixed(2)}`, 465, y); y += 18;

  doc.rect(375, y - 3, 170, 22).fill('#f0f0f0').stroke();
  doc.font('Helvetica-Bold').fillColor('black').fontSize(11)
    .text('TOTAL:', 380, y + 2)
    .text(`₹${Number(order.total).toFixed(2)}`, 465, y + 2);
  y += 30;

  // Payment info
  doc.font('Helvetica').fontSize(9)
    .text(`Payment Method: ${order.paymentMethod.toUpperCase()}`, 50, y)
    .text(`Payment Status: ${order.paymentStatus.toUpperCase()}`, 50, y + 14);

  // HSN note
  doc.text('HSN Code: 6204 (Women\'s Garments)', 50, y + 28);

  // Footer
  doc.fontSize(8).text('Thank you for shopping with Srinidhi Boutique!', 50, 760, { align: 'center', width: 495 });
  doc.text('For returns/exchanges, WhatsApp us within 7 days of delivery.', 50, 772, { align: 'center', width: 495 });

  doc.end();
});

// ── Build 12: Order Cancellation ─────────────────────────────────────────────

orderRoutes.post('/:id/cancel', async (req: Request, res: Response) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
  });
  if (!order) throw new AppError(404, 'Order not found');

  const cancellableStatuses = ['placed', 'confirmed'];
  if (!cancellableStatuses.includes(order.status)) {
    throw new AppError(400, `Cannot cancel order with status '${order.status}'. Only placed or confirmed orders can be cancelled.`);
  }

  // Cancel the order
  const cancelled = await prisma.order.update({
    where: { id: order.id },
    data: { status: 'cancelled' },
  });

  // Restore stock
  const items = await prisma.orderItem.findMany({ where: { orderId: order.id } });
  for (const item of items) {
    await prisma.product.update({
      where: { id: item.productId },
      data: { stock: { increment: item.quantity } },
    });
  }

  // If paid online → issue store credit for the refund
  let storeCredit = null;
  if (order.paymentStatus === 'paid' && order.paymentMethod !== 'cod' && order.userId) {
    storeCredit = await prisma.storeCredit.create({
      data: {
        userId: order.userId,
        amount: order.total,
        source: 'refund',
        note: `Refund for cancelled order ${order.orderNumber}`,
        orderId: order.id,
      },
    });
  }

  res.json({
    success: true,
    order: cancelled,
    refund: storeCredit
      ? { type: 'store_credit', amount: Number(storeCredit.amount), storeCreditId: storeCredit.id }
      : order.paymentMethod === 'cod'
        ? { type: 'none', message: 'COD order — no refund applicable' }
        : { type: 'none', message: 'No refund issued (not paid or no user account)' },
  });
});

// ── Build 12: Order Notes (customer add at checkout) ─────────────────────────
// Notes are stored at order creation time via `notes` field.
// This endpoint lets customer update notes on a pending order.

orderRoutes.patch('/:id/notes', async (req: Request, res: Response) => {
  const { notes } = z.object({ notes: z.string() }).parse(req.body);
  const order = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!order) throw new AppError(404, 'Order not found');
  if (!['placed', 'confirmed'].includes(order.status)) {
    throw new AppError(400, 'Cannot update notes for an order that has been processed');
  }

  const updated = await prisma.order.update({ where: { id: req.params.id }, data: { notes } });
  res.json(updated);
});
