import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

export const qaRoutes = Router();

// GET /api/qa/:productId — list approved Q&A for a product
qaRoutes.get('/:productId', async (req: Request, res: Response) => {
  const { productId } = req.params;
  const items = await prisma.productQA.findMany({
    where: { productId, approved: true },
    orderBy: { createdAt: 'asc' },
  });
  res.json(items);
});

// POST /api/qa/:productId — submit a question
qaRoutes.post('/:productId', async (req: Request, res: Response) => {
  const { productId } = req.params;
  const data = z.object({
    question: z.string().min(5).max(500),
    askedBy: z.string().optional(),
    askedByPhone: z.string().optional(),
  }).parse(req.body);

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new AppError(404, 'Product not found');

  const qa = await prisma.productQA.create({
    data: { productId, ...data, approved: true },
  });
  res.status(201).json(qa);
});

// PATCH /api/qa/:qaId/answer — admin answers a question
qaRoutes.patch('/:qaId/answer', async (req: Request, res: Response) => {
  const { qaId } = req.params;
  const { answer } = z.object({ answer: z.string().min(1) }).parse(req.body);

  const qa = await prisma.productQA.findUnique({ where: { id: qaId } });
  if (!qa) throw new AppError(404, 'Q&A not found');

  const updated = await prisma.productQA.update({
    where: { id: qaId },
    data: { answer, answeredAt: new Date() },
  });
  res.json(updated);
});

// PATCH /api/qa/:qaId/approve — admin approve/hide
qaRoutes.patch('/:qaId/approve', async (req: Request, res: Response) => {
  const { qaId } = req.params;
  const { approved } = z.object({ approved: z.boolean() }).parse(req.body);

  const qa = await prisma.productQA.findUnique({ where: { id: qaId } });
  if (!qa) throw new AppError(404, 'Q&A not found');

  const updated = await prisma.productQA.update({ where: { id: qaId }, data: { approved } });
  res.json(updated);
});

// DELETE /api/qa/:qaId — admin delete
qaRoutes.delete('/:qaId', async (req: Request, res: Response) => {
  const qa = await prisma.productQA.findUnique({ where: { id: req.params.qaId } });
  if (!qa) throw new AppError(404, 'Q&A not found');

  await prisma.productQA.delete({ where: { id: req.params.qaId } });
  res.json({ success: true });
});

// GET /api/qa/admin/all — admin: all questions
qaRoutes.get('/admin/all', async (req: Request, res: Response) => {
  const { productId, unanswered } = req.query;
  const where: Record<string, unknown> = {};
  if (productId) where.productId = productId;
  if (unanswered === 'true') where.answer = null;

  const items = await prisma.productQA.findMany({
    where,
    include: { product: { select: { name: true, slug: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(items);
});
