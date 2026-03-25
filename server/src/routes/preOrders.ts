import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

export const preOrderRoutes = Router();

// Get pre-order info for a product
preOrderRoutes.get('/product/:productId', async (req: Request, res: Response) => {
  const { productId } = req.params;
  const preOrder = await prisma.preOrder.findUnique({ where: { productId } });
  if (!preOrder || !preOrder.active) {
    return res.json({ isPreOrder: false });
  }
  res.json({ isPreOrder: true, preOrder });
});

// Book a pre-order
preOrderRoutes.post('/book', async (req: Request, res: Response) => {
  const { productId, customerName, customerPhone, customerEmail, size, color, quantity, paymentId } = z
    .object({
      productId: z.string(),
      customerName: z.string().min(1),
      customerPhone: z.string().min(10),
      customerEmail: z.string().email().optional(),
      size: z.string().optional(),
      color: z.string().optional(),
      quantity: z.number().int().positive().default(1),
      paymentId: z.string().optional(),
    })
    .parse(req.body);

  const preOrder = await prisma.preOrder.findUnique({ where: { productId } });
  if (!preOrder || !preOrder.active) throw new AppError(404, 'Pre-order not available for this product');

  const amountPaid = preOrder.bookingAmount ? Number(preOrder.bookingAmount) : 0;

  const booking = await prisma.preOrderBooking.create({
    data: {
      preOrderId: preOrder.id,
      customerName,
      customerPhone,
      customerEmail,
      size,
      color,
      quantity,
      amountPaid,
      paymentId,
    },
    include: { preOrder: true },
  });

  res.status(201).json(booking);
});

// ── Admin ──────────────────────────────────────────────────────────────────

// Create / enable pre-order for a product
preOrderRoutes.post('/admin', async (req: Request, res: Response) => {
  const { productId, expectedShipDate, bookingAmount, note } = z
    .object({
      productId: z.string(),
      expectedShipDate: z.string().transform((s) => new Date(s)),
      bookingAmount: z.number().positive().optional(),
      note: z.string().optional(),
    })
    .parse(req.body);

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new AppError(404, 'Product not found');

  const preOrder = await prisma.preOrder.upsert({
    where: { productId },
    update: { expectedShipDate, bookingAmount, note, active: true },
    create: { productId, expectedShipDate, bookingAmount, note },
  });

  res.status(201).json(preOrder);
});

// List all pre-orders (admin)
preOrderRoutes.get('/admin/list', async (_req: Request, res: Response) => {
  const preOrders = await prisma.preOrder.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { bookings: true } } },
  });
  res.json(preOrders);
});

// Get bookings for a pre-order
preOrderRoutes.get('/admin/:id/bookings', async (req: Request, res: Response) => {
  const { id } = req.params;
  const preOrder = await prisma.preOrder.findUnique({
    where: { id },
    include: { bookings: { orderBy: { createdAt: 'desc' } } },
  });
  if (!preOrder) throw new AppError(404, 'Pre-order not found');
  res.json(preOrder);
});

// Notify customers that product has shipped
preOrderRoutes.post('/admin/:id/notify', async (req: Request, res: Response) => {
  const { id } = req.params;
  const preOrder = await prisma.preOrder.findUnique({
    where: { id },
    include: { bookings: { where: { notified: false } } },
  });
  if (!preOrder) throw new AppError(404, 'Pre-order not found');

  const count = preOrder.bookings.length;
  await prisma.preOrderBooking.updateMany({
    where: { preOrderId: id, notified: false },
    data: { notified: true },
  });

  res.json({ message: `Notified ${count} customers`, count });
});

// Cancel / deactivate pre-order
preOrderRoutes.put('/admin/:id/deactivate', async (req: Request, res: Response) => {
  const { id } = req.params;
  const preOrder = await prisma.preOrder.findUnique({ where: { id } });
  if (!preOrder) throw new AppError(404, 'Pre-order not found');
  await prisma.preOrder.update({ where: { id }, data: { active: false } });
  res.json({ message: 'Pre-order deactivated' });
});
