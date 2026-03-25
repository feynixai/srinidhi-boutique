import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

export const reviewRoutes = Router();

const reviewSchema = z.object({
  customerName: z.string().min(1).max(100),
  customerPhone: z.string().optional(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(200).optional(),
  body: z.string().max(2000).optional(),
  imageUrl: z.string().url().optional().or(z.literal('')).transform((v) => v || undefined),
});

reviewRoutes.get('/:productId', async (req: Request, res: Response) => {
  const { productId } = req.params;
  const product = await prisma.product.findFirst({
    where: { OR: [{ id: productId }, { slug: productId }], active: true },
  });
  if (!product) throw new AppError(404, 'Product not found');

  const reviews = await prisma.review.findMany({
    where: { productId: product.id, approved: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const avg = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  res.json({ reviews, total: reviews.length, avgRating: Math.round(avg * 10) / 10, distribution });
});

reviewRoutes.post('/:productId', async (req: Request, res: Response) => {
  const { productId } = req.params;
  const product = await prisma.product.findFirst({
    where: { OR: [{ id: productId }, { slug: productId }], active: true },
  });
  if (!product) throw new AppError(404, 'Product not found');

  const data = reviewSchema.parse(req.body);
  const review = await prisma.review.create({
    data: { ...data, productId: product.id },
  });
  res.status(201).json(review);
});

// Admin: get all reviews (including unapproved)
reviewRoutes.get('/', async (_req: Request, res: Response) => {
  const reviews = await prisma.review.findMany({
    include: { product: { select: { name: true, slug: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(reviews);
});

reviewRoutes.patch('/:id/approve', async (req: Request, res: Response) => {
  const review = await prisma.review.findUnique({ where: { id: req.params.id } });
  if (!review) throw new AppError(404, 'Review not found');
  const updated = await prisma.review.update({
    where: { id: req.params.id },
    data: { approved: !review.approved },
  });
  res.json(updated);
});

reviewRoutes.delete('/:id', async (req: Request, res: Response) => {
  const review = await prisma.review.findUnique({ where: { id: req.params.id } });
  if (!review) throw new AppError(404, 'Review not found');
  await prisma.review.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});
