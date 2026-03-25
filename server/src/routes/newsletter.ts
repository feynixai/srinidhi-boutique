import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

export const newsletterRoutes = Router();

newsletterRoutes.post('/subscribe', async (req: Request, res: Response) => {
  const { email, name, source } = z
    .object({
      email: z.string().email(),
      name: z.string().optional(),
      source: z.string().optional(),
    })
    .parse(req.body);

  const existing = await prisma.newsletter.findUnique({ where: { email } });
  if (existing) {
    if (!existing.active) {
      await prisma.newsletter.update({ where: { email }, data: { active: true } });
      return res.json({ success: true, message: 'Welcome back! You are subscribed.' });
    }
    return res.json({ success: true, message: 'Already subscribed!' });
  }

  await prisma.newsletter.create({ data: { email, name, source } });
  res.status(201).json({ success: true, message: 'Subscribed successfully!' });
});

newsletterRoutes.post('/unsubscribe', async (req: Request, res: Response) => {
  const { email } = z.object({ email: z.string().email() }).parse(req.body);
  const existing = await prisma.newsletter.findUnique({ where: { email } });
  if (!existing) throw new AppError(404, 'Email not found');

  await prisma.newsletter.update({ where: { email }, data: { active: false } });
  res.json({ success: true });
});

// Admin: list subscribers
newsletterRoutes.get('/', async (req: Request, res: Response) => {
  const { page = '1', limit = '50' } = req.query;
  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);

  const [subscribers, total] = await Promise.all([
    prisma.newsletter.findMany({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    }),
    prisma.newsletter.count({ where: { active: true } }),
  ]);

  res.json({ subscribers, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
});
