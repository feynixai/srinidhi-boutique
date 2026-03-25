import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

export const returnRoutes = Router();

const returnSchema = z.object({
  orderNumber: z.string().min(1),
  customerName: z.string().min(1),
  customerPhone: z.string().min(10),
  reason: z.enum(['defective', 'wrong_item', 'size_issue', 'not_as_described', 'other']),
  description: z.string().optional(),
});

returnRoutes.post('/', async (req: Request, res: Response) => {
  const data = returnSchema.parse(req.body);

  // Verify order exists
  const order = await prisma.order.findFirst({
    where: { orderNumber: data.orderNumber.toUpperCase(), customerPhone: data.customerPhone },
  });

  if (!order) {
    throw new AppError(404, 'Order not found. Please check your order number and phone number.');
  }

  const returnRequest = await prisma.returnRequest.create({
    data: {
      orderNumber: data.orderNumber.toUpperCase(),
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      reason: data.reason,
      description: data.description,
    },
  });

  res.status(201).json({ success: true, id: returnRequest.id, message: 'Return request submitted successfully.' });
});

returnRoutes.get('/', async (_req: Request, res: Response) => {
  const requests = await prisma.returnRequest.findMany({
    orderBy: { createdAt: 'desc' },
  });
  res.json(requests);
});

returnRoutes.get('/:id', async (req: Request, res: Response) => {
  const req_ = await prisma.returnRequest.findUnique({ where: { id: req.params.id } });
  if (!req_) throw new AppError(404, 'Return request not found');
  res.json(req_);
});

returnRoutes.patch('/:id/status', async (req: Request, res: Response) => {
  const { status } = z.object({
    status: z.enum(['pending', 'approved', 'rejected', 'completed']),
  }).parse(req.body);

  const updated = await prisma.returnRequest.update({
    where: { id: req.params.id },
    data: { status },
  });
  res.json(updated);
});
