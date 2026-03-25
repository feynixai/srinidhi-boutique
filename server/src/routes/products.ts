import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

export const productRoutes = Router();

productRoutes.get('/', async (req: Request, res: Response) => {
  const {
    category,
    occasion,
    minPrice,
    maxPrice,
    search,
    size,
    color,
    sort,
    page = '1',
    limit = '20',
  } = req.query;

  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const skip = (pageNum - 1) * limitNum;

  const where: Record<string, unknown> = { active: true };

  if (category) where.category = { slug: category };
  if (occasion) where.occasion = { has: occasion };
  if (minPrice || maxPrice) {
    where.price = {
      ...(minPrice ? { gte: parseFloat(minPrice as string) } : {}),
      ...(maxPrice ? { lte: parseFloat(maxPrice as string) } : {}),
    };
  }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (size) where.sizes = { has: size };
  if (color) where.colors = { has: color };

  type OrderBy = Record<string, 'asc' | 'desc'>;
  const orderBy: OrderBy =
    sort === 'price_asc' ? { price: 'asc' } :
    sort === 'price_desc' ? { price: 'desc' } :
    sort === 'popular' ? { bestSeller: 'desc' } :
    { createdAt: 'desc' };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true },
      orderBy,
      skip,
      take: limitNum,
    }),
    prisma.product.count({ where }),
  ]);

  res.json({
    products,
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum),
  });
});

productRoutes.get('/featured', async (_req: Request, res: Response) => {
  const products = await prisma.product.findMany({
    where: { featured: true, active: true },
    include: { category: true },
    orderBy: { createdAt: 'desc' },
    take: 12,
  });
  res.json(products);
});

productRoutes.get('/best-sellers', async (_req: Request, res: Response) => {
  const products = await prisma.product.findMany({
    where: { bestSeller: true, active: true },
    include: { category: true },
    orderBy: { createdAt: 'desc' },
    take: 12,
  });
  res.json(products);
});

productRoutes.get('/offers', async (_req: Request, res: Response) => {
  const products = await prisma.product.findMany({
    where: { onOffer: true, active: true },
    include: { category: true },
    orderBy: { offerPercent: 'desc' },
    take: 20,
  });
  res.json(products);
});

productRoutes.get('/:slug', async (req: Request, res: Response) => {
  const product = await prisma.product.findUnique({
    where: { slug: req.params.slug },
    include: { category: true },
  });

  if (!product || !product.active) {
    throw new AppError(404, 'Product not found');
  }

  res.json(product);
});
