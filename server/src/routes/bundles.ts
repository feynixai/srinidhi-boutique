import { Router, Request, Response } from 'express';
import { z } from 'zod';
import slugify from 'slugify';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

export const bundleRoutes = Router();

// List active bundles
bundleRoutes.get('/', async (_req: Request, res: Response) => {
  const bundles = await prisma.bundle.findMany({
    where: { active: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(bundles);
});

// Get single bundle by slug
bundleRoutes.get('/:slug', async (req: Request, res: Response) => {
  const bundle = await prisma.bundle.findUnique({
    where: { slug: req.params.slug },
  });
  if (!bundle) throw new AppError(404, 'Bundle not found');

  // Fetch products in bundle
  const products = await prisma.product.findMany({
    where: { id: { in: bundle.productIds }, active: true },
    select: { id: true, name: true, slug: true, price: true, images: true },
  });

  res.json({ ...bundle, products });
});

// Get bundles for a specific product
bundleRoutes.get('/product/:productId', async (req: Request, res: Response) => {
  const { productId } = req.params;
  const bundles = await prisma.bundle.findMany({
    where: {
      active: true,
      productIds: { has: productId },
    },
  });
  res.json(bundles);
});

// ── Admin ──────────────────────────────────────────────────────────────────

const BundleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  productIds: z.array(z.string()).min(2),
  bundlePrice: z.number().positive(),
  originalPrice: z.number().positive(),
  image: z.string().optional(),
  active: z.boolean().optional(),
});

// Create bundle
bundleRoutes.post('/admin', async (req: Request, res: Response) => {
  const data = BundleSchema.parse(req.body);
  const slug = slugify(data.name, { lower: true, strict: true });
  const savings = data.originalPrice - data.bundlePrice;

  const bundle = await prisma.bundle.create({
    data: {
      ...data,
      slug,
      savings,
    },
  });

  res.status(201).json(bundle);
});

// List all bundles (admin)
bundleRoutes.get('/admin/list', async (_req: Request, res: Response) => {
  const bundles = await prisma.bundle.findMany({
    orderBy: { createdAt: 'desc' },
  });
  res.json(bundles);
});

// Update bundle
bundleRoutes.put('/admin/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const bundle = await prisma.bundle.findUnique({ where: { id } });
  if (!bundle) throw new AppError(404, 'Bundle not found');

  const data = BundleSchema.partial().parse(req.body);
  const savings =
    data.originalPrice !== undefined && data.bundlePrice !== undefined
      ? data.originalPrice - data.bundlePrice
      : undefined;

  const updated = await prisma.bundle.update({
    where: { id },
    data: { ...data, ...(savings !== undefined ? { savings } : {}) },
  });
  res.json(updated);
});

// Delete bundle
bundleRoutes.delete('/admin/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const bundle = await prisma.bundle.findUnique({ where: { id } });
  if (!bundle) throw new AppError(404, 'Bundle not found');
  await prisma.bundle.delete({ where: { id } });
  res.json({ message: 'Deleted' });
});
