import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

export const contactRoutes = Router();

const contactSchema = z.object({
  name: z.string().min(1).max(100),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional().or(z.literal('')),
  message: z.string().min(1).max(2000),
});

contactRoutes.post('/', async (req: Request, res: Response) => {
  const data = contactSchema.parse(req.body);

  const submission = await prisma.contactSubmission.create({
    data: {
      name: data.name,
      phone: data.phone || null,
      email: data.email || null,
      message: data.message,
    },
  });

  res.status(201).json({ success: true, id: submission.id });
});

contactRoutes.get('/', async (_req: Request, res: Response) => {
  const submissions = await prisma.contactSubmission.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  res.json(submissions);
});
