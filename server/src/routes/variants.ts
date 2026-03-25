import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

export const variantRoutes = Router();

const variantSchema = z.object({
  size: z.string().min(1),
  color: z.string().min(1),
  sku: z.string().optional(),
  stock: z.number().int().min(0).default(0),
  priceOverride: z.number().positive().optional(),
});

// GET /api/variants/:productId — list variants for a product
variantRoutes.get('/:productId', async (req: Request, res: Response) => {
  const { productId } = req.params;
  const variants = await prisma.productVariant.findMany({
    where: { productId },
    orderBy: [{ size: 'asc' }, { color: 'asc' }],
  });
  res.json(variants);
});

// POST /api/variants/:productId — add variant
variantRoutes.post('/:productId', async (req: Request, res: Response) => {
  const { productId } = req.params;
  const data = variantSchema.parse(req.body);

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new AppError(404, 'Product not found');

  const existing = await prisma.productVariant.findUnique({
    where: { productId_size_color: { productId, size: data.size, color: data.color } },
  });
  if (existing) throw new AppError(409, 'Variant with this size+color already exists');

  const variant = await prisma.productVariant.create({
    data: { productId, ...data },
  });
  res.status(201).json(variant);
});

// PATCH /api/variants/:productId/:variantId — update variant stock / price
variantRoutes.patch('/:productId/:variantId', async (req: Request, res: Response) => {
  const { productId, variantId } = req.params;
  const data = variantSchema.partial().parse(req.body);

  const variant = await prisma.productVariant.findFirst({
    where: { id: variantId, productId },
  });
  if (!variant) throw new AppError(404, 'Variant not found');

  const updated = await prisma.productVariant.update({
    where: { id: variantId },
    data,
  });
  res.json(updated);
});

// DELETE /api/variants/:productId/:variantId
variantRoutes.delete('/:productId/:variantId', async (req: Request, res: Response) => {
  const { productId, variantId } = req.params;
  const variant = await prisma.productVariant.findFirst({
    where: { id: variantId, productId },
  });
  if (!variant) throw new AppError(404, 'Variant not found');

  await prisma.productVariant.delete({ where: { id: variantId } });
  res.json({ success: true });
});

// POST /api/variants/:productId/:variantId/adjust-stock
variantRoutes.post('/:productId/:variantId/adjust-stock', async (req: Request, res: Response) => {
  const { productId, variantId } = req.params;
  const { delta } = z.object({ delta: z.number().int() }).parse(req.body);

  const variant = await prisma.productVariant.findFirst({
    where: { id: variantId, productId },
  });
  if (!variant) throw new AppError(404, 'Variant not found');

  const newStock = variant.stock + delta;
  if (newStock < 0) throw new AppError(400, 'Insufficient stock');

  const updated = await prisma.productVariant.update({
    where: { id: variantId },
    data: { stock: newStock },
  });
  res.json(updated);
});
