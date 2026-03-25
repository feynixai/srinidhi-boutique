import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

export const chatRoutes = Router();

// Submit a customer message
chatRoutes.post('/messages', async (req: Request, res: Response) => {
  const { name, email, message } = z
    .object({
      name: z.string().min(1).max(100),
      email: z.string().email().optional(),
      message: z.string().min(1).max(2000),
    })
    .parse(req.body);

  const msg = await prisma.chatMessage.create({
    data: { name, email, message, status: 'open' },
  });

  res.status(201).json({
    id: msg.id,
    message: 'Your message has been received. We typically reply within 2 hours.',
  });
});

// Admin: list messages
chatRoutes.get('/admin/messages', async (req: Request, res: Response) => {
  const { status, page = '1', limit = '20' } = req.query;
  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);

  const where: Record<string, unknown> = {};
  if (status) where.status = status;

  const [messages, total] = await Promise.all([
    prisma.chatMessage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    }),
    prisma.chatMessage.count({ where }),
  ]);

  res.json({ messages, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
});

// Admin: reply to a message
chatRoutes.post('/admin/messages/:id/reply', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reply } = z.object({ reply: z.string().min(1) }).parse(req.body);

  const msg = await prisma.chatMessage.findUnique({ where: { id } });
  if (!msg) throw new AppError(404, 'Message not found');

  const updated = await prisma.chatMessage.update({
    where: { id },
    data: { reply, status: 'replied' },
  });

  res.json(updated);
});

// Admin: update message status
chatRoutes.patch('/admin/messages/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = z
    .object({ status: z.enum(['open', 'replied', 'closed']) })
    .parse(req.body);

  const msg = await prisma.chatMessage.findUnique({ where: { id } });
  if (!msg) throw new AppError(404, 'Message not found');

  const updated = await prisma.chatMessage.update({ where: { id }, data: { status } });
  res.json(updated);
});

// Admin: stats
chatRoutes.get('/admin/stats', async (_req: Request, res: Response) => {
  const [open, replied, closed, total] = await Promise.all([
    prisma.chatMessage.count({ where: { status: 'open' } }),
    prisma.chatMessage.count({ where: { status: 'replied' } }),
    prisma.chatMessage.count({ where: { status: 'closed' } }),
    prisma.chatMessage.count(),
  ]);

  res.json({ open, replied, closed, total });
});
