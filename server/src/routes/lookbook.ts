import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

export const lookbookRoutes = Router();

// Get all active lookbook entries
lookbookRoutes.get('/', async (_req: Request, res: Response) => {
  const entries = await prisma.lookbook.findMany({
    where: { active: true },
    orderBy: { createdAt: 'desc' },
  });

  // Enrich with product data
  const enriched = await Promise.all(
    entries.map(async (entry) => {
      const products = await prisma.product.findMany({
        where: { id: { in: entry.productIds }, active: true },
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          comparePrice: true,
          images: true,
          category: { select: { name: true } },
        },
      });
      return { ...entry, products };
    })
  );

  res.json({ lookbook: enriched });
});

// Get single lookbook entry
lookbookRoutes.get('/:id', async (req: Request, res: Response) => {
  const entry = await prisma.lookbook.findUnique({ where: { id: req.params.id } });
  if (!entry) throw new AppError(404, 'Lookbook entry not found');

  const products = await prisma.product.findMany({
    where: { id: { in: entry.productIds }, active: true },
    include: { category: true },
  });

  res.json({ ...entry, products });
});

// Admin: create lookbook entry
lookbookRoutes.post('/admin', async (req: Request, res: Response) => {
  const { title, description, image, productIds } = z
    .object({
      title: z.string().min(1),
      description: z.string().optional(),
      image: z.string().url(),
      productIds: z.array(z.string()).min(1).max(10),
    })
    .parse(req.body);

  // Verify all products exist
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true },
  });
  if (products.length !== productIds.length) {
    throw new AppError(400, 'One or more products not found');
  }

  const entry = await prisma.lookbook.create({
    data: { title, description, image, productIds },
  });

  res.status(201).json(entry);
});

// Admin: update lookbook entry
lookbookRoutes.patch('/admin/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, description, image, productIds, active } = z
    .object({
      title: z.string().min(1).optional(),
      description: z.string().optional(),
      image: z.string().url().optional(),
      productIds: z.array(z.string()).min(1).max(10).optional(),
      active: z.boolean().optional(),
    })
    .parse(req.body);

  const entry = await prisma.lookbook.findUnique({ where: { id } });
  if (!entry) throw new AppError(404, 'Lookbook entry not found');

  const updated = await prisma.lookbook.update({
    where: { id },
    data: {
      ...(title && { title }),
      ...(description !== undefined && { description }),
      ...(image && { image }),
      ...(productIds && { productIds }),
      ...(active !== undefined && { active }),
    },
  });

  res.json(updated);
});

// Admin: delete lookbook entry
lookbookRoutes.delete('/admin/:id', async (req: Request, res: Response) => {
  const entry = await prisma.lookbook.findUnique({ where: { id: req.params.id } });
  if (!entry) throw new AppError(404, 'Lookbook entry not found');

  await prisma.lookbook.delete({ where: { id: req.params.id } });
  res.json({ message: 'Lookbook entry deleted' });
});

// Admin: list all lookbook entries
lookbookRoutes.get('/admin/all', async (_req: Request, res: Response) => {
  const entries = await prisma.lookbook.findMany({ orderBy: { createdAt: 'desc' } });
  res.json({ lookbook: entries });
});
