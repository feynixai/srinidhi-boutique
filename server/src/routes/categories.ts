import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const categoryRoutes = Router();

categoryRoutes.get('/', async (_req: Request, res: Response) => {
  const categories = await prisma.category.findMany({
    include: {
      _count: { select: { products: true } },
    },
    orderBy: { name: 'asc' },
  });
  res.json(categories);
});

categoryRoutes.get('/:slug', async (req: Request, res: Response) => {
  const category = await prisma.category.findUnique({
    where: { slug: req.params.slug },
    include: {
      products: {
        where: { active: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!category) {
    res.status(404).json({ error: 'Category not found' });
    return;
  }

  res.json(category);
});
