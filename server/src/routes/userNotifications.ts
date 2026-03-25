import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

export const userNotificationRoutes = Router();

// GET /api/user-notifications/:userId — list notifications
userNotificationRoutes.get('/:userId', async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { page = '1', limit = '20' } = req.query;
  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.userNotification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    }),
    prisma.userNotification.count({ where: { userId } }),
    prisma.userNotification.count({ where: { userId, read: false } }),
  ]);

  res.json({ notifications, total, unreadCount, page: pageNum, limit: limitNum });
});

// POST /api/user-notifications — create (internal / admin)
userNotificationRoutes.post('/', async (req: Request, res: Response) => {
  const data = z.object({
    userId: z.string(),
    type: z.enum(['order_update', 'price_drop', 'flash_sale', 'loyalty_reward']),
    title: z.string().min(1),
    message: z.string().min(1),
    link: z.string().optional(),
  }).parse(req.body);

  const user = await prisma.user.findUnique({ where: { id: data.userId } });
  if (!user) throw new AppError(404, 'User not found');

  const notification = await prisma.userNotification.create({ data });
  res.status(201).json(notification);
});

// PATCH /api/user-notifications/:userId/:id/read — mark one as read
userNotificationRoutes.patch('/:userId/:id/read', async (req: Request, res: Response) => {
  const { userId, id } = req.params;
  const n = await prisma.userNotification.findFirst({ where: { id, userId } });
  if (!n) throw new AppError(404, 'Notification not found');

  const updated = await prisma.userNotification.update({
    where: { id },
    data: { read: true },
  });
  res.json(updated);
});

// POST /api/user-notifications/:userId/read-all — mark all as read
userNotificationRoutes.post('/:userId/read-all', async (req: Request, res: Response) => {
  const { userId } = req.params;
  await prisma.userNotification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
  res.json({ success: true });
});

// DELETE /api/user-notifications/:userId/:id — delete one
userNotificationRoutes.delete('/:userId/:id', async (req: Request, res: Response) => {
  const { userId, id } = req.params;
  const n = await prisma.userNotification.findFirst({ where: { id, userId } });
  if (!n) throw new AppError(404, 'Notification not found');

  await prisma.userNotification.delete({ where: { id } });
  res.json({ success: true });
});

// GET /api/user-notifications/:userId/unread-count
userNotificationRoutes.get('/:userId/unread-count', async (req: Request, res: Response) => {
  const count = await prisma.userNotification.count({
    where: { userId: req.params.userId, read: false },
  });
  res.json({ count });
});
