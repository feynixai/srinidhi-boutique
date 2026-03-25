import { Router, Request, Response } from 'express';
import { z } from 'zod';
import slugify from 'slugify';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

export const collectionRoutes = Router();

// GET /api/collections — list active collections
collectionRoutes.get('/', async (req: Request, res: Response) => {
  const { featured } = req.query;
  const where: Record<string, unknown> = { active: true };
  if (featured === 'true') where.featured = true;

  const collections = await prisma.collection.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
  res.json(collections);
});

// GET /api/collections/:slug — collection with products
collectionRoutes.get('/:slug', async (req: Request, res: Response) => {
  const collection = await prisma.collection.findUnique({
    where: { slug: req.params.slug },
  });
  if (!collection || !collection.active) throw new AppError(404, 'Collection not found');

  const products = await prisma.product.findMany({
    where: { id: { in: collection.productIds }, active: true },
    include: { category: true },
  });

  res.json({ ...collection, products });
});

// POST /api/collections — create (admin)
collectionRoutes.post('/', async (req: Request, res: Response) => {
  const data = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    image: z.string().optional(),
    productIds: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
  }).parse(req.body);

  const slug = slugify(data.name, { lower: true, strict: true });
  const existing = await prisma.collection.findUnique({ where: { slug } });
  if (existing) throw new AppError(409, 'Collection with this name already exists');

  const collection = await prisma.collection.create({ data: { ...data, slug } });
  res.status(201).json(collection);
});

// PATCH /api/collections/:id — update (admin)
collectionRoutes.patch('/:id', async (req: Request, res: Response) => {
  const data = z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    image: z.string().optional(),
    productIds: z.array(z.string()).optional(),
    featured: z.boolean().optional(),
    active: z.boolean().optional(),
  }).parse(req.body);

  const collection = await prisma.collection.findUnique({ where: { id: req.params.id } });
  if (!collection) throw new AppError(404, 'Collection not found');

  const updateData: Record<string, unknown> = { ...data };
  if (data.name) updateData.slug = slugify(data.name, { lower: true, strict: true });

  const updated = await prisma.collection.update({ where: { id: req.params.id }, data: updateData });
  res.json(updated);
});

// DELETE /api/collections/:id (admin)
collectionRoutes.delete('/:id', async (req: Request, res: Response) => {
  const collection = await prisma.collection.findUnique({ where: { id: req.params.id } });
  if (!collection) throw new AppError(404, 'Collection not found');

  await prisma.collection.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

// Tags

// GET /api/collections/tags/all
collectionRoutes.get('/tags/all', async (_req: Request, res: Response) => {
  const tags = await prisma.tag.findMany({ orderBy: { name: 'asc' } });
  res.json(tags);
});

// POST /api/collections/tags — create tag (admin)
collectionRoutes.post('/tags', async (req: Request, res: Response) => {
  const { name } = z.object({ name: z.string().min(1) }).parse(req.body);
  const slug = slugify(name, { lower: true, strict: true });

  const existing = await prisma.tag.findUnique({ where: { slug } });
  if (existing) throw new AppError(409, 'Tag already exists');

  const tag = await prisma.tag.create({ data: { name, slug } });
  res.status(201).json(tag);
});

// POST /api/collections/tags/product/:productId — add tags to product
collectionRoutes.post('/tags/product/:productId', async (req: Request, res: Response) => {
  const { productId } = req.params;
  const { tagIds } = z.object({ tagIds: z.array(z.string()) }).parse(req.body);

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new AppError(404, 'Product not found');

  // Upsert each tag link
  await prisma.$transaction(
    tagIds.map((tagId) =>
      prisma.productTag.upsert({
        where: { productId_tagId: { productId, tagId } },
        create: { productId, tagId },
        update: {},
      })
    )
  );

  const tags = await prisma.productTag.findMany({
    where: { productId },
    include: { tag: true },
  });
  res.json(tags.map((pt) => pt.tag));
});

// DELETE /api/collections/tags/product/:productId/:tagId
collectionRoutes.delete('/tags/product/:productId/:tagId', async (req: Request, res: Response) => {
  const { productId, tagId } = req.params;
  await prisma.productTag.deleteMany({ where: { productId, tagId } });
  res.json({ success: true });
});

// GET /api/collections/tags/product/:productId
collectionRoutes.get('/tags/product/:productId', async (req: Request, res: Response) => {
  const tags = await prisma.productTag.findMany({
    where: { productId: req.params.productId },
    include: { tag: true },
  });
  res.json(tags.map((pt) => pt.tag));
});
