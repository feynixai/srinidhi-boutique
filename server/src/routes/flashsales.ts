import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

export const flashSaleRoutes = Router();

// Get active flash sales
flashSaleRoutes.get('/active', async (_req: Request, res: Response) => {
  const now = new Date();

  const sales = await prisma.flashSale.findMany({
    where: {
      active: true,
      startsAt: { lte: now },
      endsAt: { gt: now },
    },
    include: {
      products: {
        include: {
          product: { include: { category: true } },
        },
      },
    },
    orderBy: { endsAt: 'asc' },
  });

  const enriched = sales.map((sale) => ({
    ...sale,
    products: sale.products.map((sp) => ({
      ...sp.product,
      flashSalePrice: Math.round(Number(sp.product.price) * (1 - sale.discountPercent / 100)),
      flashSaleDiscount: sale.discountPercent,
    })),
    secondsRemaining: Math.max(0, Math.floor((sale.endsAt.getTime() - now.getTime()) / 1000)),
  }));

  res.json({ sales: enriched });
});

// Get all flash sales (active + upcoming)
flashSaleRoutes.get('/', async (_req: Request, res: Response) => {
  const now = new Date();

  const sales = await prisma.flashSale.findMany({
    where: { active: true },
    include: {
      products: {
        include: { product: { select: { id: true, name: true, price: true, images: true, slug: true } } },
      },
    },
    orderBy: { startsAt: 'asc' },
  });

  const withStatus = sales.map((sale) => ({
    ...sale,
    status: sale.startsAt > now ? 'upcoming' : sale.endsAt < now ? 'ended' : 'active',
    secondsRemaining: sale.endsAt > now ? Math.floor((sale.endsAt.getTime() - now.getTime()) / 1000) : 0,
  }));

  res.json({ sales: withStatus });
});

// Check if a product is in an active flash sale
flashSaleRoutes.get('/product/:productId', async (req: Request, res: Response) => {
  const { productId } = req.params;
  const now = new Date();

  const flashSaleProduct = await prisma.flashSaleProduct.findFirst({
    where: {
      productId,
      flashSale: {
        active: true,
        startsAt: { lte: now },
        endsAt: { gt: now },
      },
    },
    include: { flashSale: true },
  });

  if (!flashSaleProduct) {
    res.json({ inFlashSale: false });
    return;
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    res.json({ inFlashSale: false });
    return;
  }

  const flashSalePrice = Math.round(Number(product.price) * (1 - flashSaleProduct.flashSale.discountPercent / 100));

  res.json({
    inFlashSale: true,
    flashSaleId: flashSaleProduct.flashSaleId,
    title: flashSaleProduct.flashSale.title,
    discountPercent: flashSaleProduct.flashSale.discountPercent,
    flashSalePrice,
    originalPrice: product.price,
    endsAt: flashSaleProduct.flashSale.endsAt,
    secondsRemaining: Math.max(0, Math.floor((flashSaleProduct.flashSale.endsAt.getTime() - Date.now()) / 1000)),
  });
});

// Admin: create flash sale
flashSaleRoutes.post('/admin', async (req: Request, res: Response) => {
  const { title, discountPercent, startsAt, endsAt, productIds } = z
    .object({
      title: z.string().min(1),
      discountPercent: z.number().int().min(1).max(90),
      startsAt: z.string().datetime(),
      endsAt: z.string().datetime(),
      productIds: z.array(z.string()).min(1),
    })
    .parse(req.body);

  const start = new Date(startsAt);
  const end = new Date(endsAt);

  if (end <= start) throw new AppError(400, 'End time must be after start time');

  const flashSale = await prisma.flashSale.create({
    data: {
      title,
      discountPercent,
      startsAt: start,
      endsAt: end,
      products: {
        create: productIds.map((productId) => ({ productId })),
      },
    },
    include: { products: { include: { product: { select: { id: true, name: true, price: true } } } } },
  });

  res.status(201).json(flashSale);
});

// Admin: update flash sale
flashSaleRoutes.patch('/admin/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, discountPercent, startsAt, endsAt, active } = z
    .object({
      title: z.string().min(1).optional(),
      discountPercent: z.number().int().min(1).max(90).optional(),
      startsAt: z.string().datetime().optional(),
      endsAt: z.string().datetime().optional(),
      active: z.boolean().optional(),
    })
    .parse(req.body);

  const flashSale = await prisma.flashSale.findUnique({ where: { id } });
  if (!flashSale) throw new AppError(404, 'Flash sale not found');

  const updated = await prisma.flashSale.update({
    where: { id },
    data: {
      ...(title && { title }),
      ...(discountPercent !== undefined && { discountPercent }),
      ...(startsAt && { startsAt: new Date(startsAt) }),
      ...(endsAt && { endsAt: new Date(endsAt) }),
      ...(active !== undefined && { active }),
    },
    include: { products: { include: { product: { select: { id: true, name: true, price: true } } } } },
  });

  res.json(updated);
});

// Admin: delete flash sale
flashSaleRoutes.delete('/admin/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const sale = await prisma.flashSale.findUnique({ where: { id } });
  if (!sale) throw new AppError(404, 'Flash sale not found');

  await prisma.flashSale.delete({ where: { id } });
  res.json({ message: 'Flash sale deleted' });
});

// Admin: list all flash sales
flashSaleRoutes.get('/admin', async (_req: Request, res: Response) => {
  const sales = await prisma.flashSale.findMany({
    include: {
      products: {
        include: { product: { select: { id: true, name: true, price: true, images: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ sales });
});
