import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { cache, TTL } from '../lib/cache';

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
    fabric,
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
  if (fabric) where.fabric = { contains: fabric as string, mode: 'insensitive' };

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
  const cacheKey = 'products:featured';
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  const products = await prisma.product.findMany({
    where: { featured: true, active: true },
    include: { category: true },
    orderBy: { createdAt: 'desc' },
    take: 12,
  });
  cache.set(cacheKey, products, TTL.FEATURED);
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

// GET /api/products/id/:id — lookup by ID (for recently viewed)
productRoutes.get('/id/:id', async (req: Request, res: Response) => {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: { category: true },
  });
  if (!product || !product.active) throw new AppError(404, 'Product not found');
  res.json(product);
});

// GET /api/products/:slug/recommendations — same category + price range
productRoutes.get('/:slug/recommendations', async (req: Request, res: Response) => {
  const product = await prisma.product.findUnique({ where: { slug: req.params.slug } });
  if (!product) throw new AppError(404, 'Product not found');

  const priceNum = Number(product.price);
  const priceRange = priceNum * 0.4; // ±40%

  const recommendations = await prisma.product.findMany({
    where: {
      active: true,
      id: { not: product.id },
      OR: [
        { categoryId: product.categoryId || undefined },
        {
          price: {
            gte: priceNum - priceRange,
            lte: priceNum + priceRange,
          },
        },
      ],
    },
    include: { category: true },
    orderBy: { bestSeller: 'desc' },
    take: 8,
  });

  res.json(recommendations);
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
