import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { cache, TTL } from '../lib/cache';

export const productRoutes = Router();

async function getActiveSaleDiscount(): Promise<number> {
  const now = new Date();
  const sale = await prisma.storeSale.findFirst({
    where: {
      active: true,
      OR: [
        { startAt: null },
        { startAt: { lte: now } },
      ],
      AND: [
        { OR: [{ endAt: null }, { endAt: { gte: now } }] },
      ],
    },
    orderBy: { createdAt: 'desc' },
  });
  return sale ? sale.discountPct : 0;
}

function applySale<T extends { price: unknown; comparePrice?: unknown }>(
  product: T,
  discountPct: number
): T & { salePrice: number | null; salePct: number } {
  if (discountPct <= 0) return { ...product, salePrice: null, salePct: 0 };
  const originalPrice = Number(product.price);
  const salePrice = Math.round(originalPrice * (1 - discountPct / 100));
  return { ...product, salePrice, salePct: discountPct };
}

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

  const [[products, total], discountPct] = await Promise.all([
    Promise.all([
      prisma.product.findMany({
        where,
        include: { category: true },
        orderBy,
        skip,
        take: limitNum,
      }),
      prisma.product.count({ where }),
    ]),
    getActiveSaleDiscount(),
  ]);

  res.json({
    products: products.map((p) => applySale(p, discountPct)),
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum),
    activeSaleDiscountPct: discountPct || undefined,
  });
});

productRoutes.get('/featured', async (_req: Request, res: Response) => {
  const [products, discountPct] = await Promise.all([
    prisma.product.findMany({
      where: { featured: true, active: true },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
      take: 12,
    }),
    getActiveSaleDiscount(),
  ]);
  res.json(products.map((p) => applySale(p, discountPct)));
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

// GET /api/products/:slug/also-bought — co-occurrence recommendations
productRoutes.get('/:slug/also-bought', async (req: Request, res: Response) => {
  const product = await prisma.product.findUnique({ where: { slug: req.params.slug } });
  if (!product) throw new AppError(404, 'Product not found');

  // Find orders that contain this product
  const ordersWithProduct = await prisma.orderItem.findMany({
    where: { productId: product.id },
    select: { orderId: true },
    take: 200,
  });

  if (ordersWithProduct.length === 0) {
    res.json([]);
    return;
  }

  const orderIds = ordersWithProduct.map((o) => o.orderId);

  // Find other products in those orders
  const coItems = await prisma.orderItem.findMany({
    where: { orderId: { in: orderIds }, productId: { not: product.id } },
    select: { productId: true },
  });

  // Count co-occurrences
  const countMap = new Map<string, number>();
  for (const item of coItems) {
    countMap.set(item.productId, (countMap.get(item.productId) ?? 0) + 1);
  }

  if (countMap.size === 0) {
    res.json([]);
    return;
  }

  // Sort by frequency, take top 8
  const topIds = Array.from(countMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([id]) => id);

  const products = await prisma.product.findMany({
    where: { id: { in: topIds }, active: true },
    include: { category: true },
  });

  // Preserve order by frequency
  const sorted = topIds
    .map((id) => products.find((p) => p.id === id))
    .filter(Boolean);

  res.json(sorted);
});

// GET /api/products/:slug/related — same category, exclude self
productRoutes.get('/:slug/related', async (req: Request, res: Response) => {
  const product = await prisma.product.findUnique({ where: { slug: req.params.slug } });
  if (!product) throw new AppError(404, 'Product not found');

  const related = await prisma.product.findMany({
    where: {
      active: true,
      id: { not: product.id },
      categoryId: product.categoryId || undefined,
    },
    include: { category: true },
    orderBy: { bestSeller: 'desc' },
    take: 8,
  });

  res.json(related);
});

productRoutes.get('/:slug', async (req: Request, res: Response) => {
  const [product, discountPct] = await Promise.all([
    prisma.product.findUnique({
      where: { slug: req.params.slug },
      include: { category: true, reviews: { where: { approved: true } } },
    }),
    getActiveSaleDiscount(),
  ]);

  if (!product || !product.active) {
    throw new AppError(404, 'Product not found');
  }

  // Social proof / urgency signals
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentPurchases = await prisma.orderItem.count({
    where: { productId: product.id, order: { createdAt: { gte: sevenDaysAgo } } },
  });

  const reviews = product.reviews;
  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : null;

  const { reviews: _r, ...productData } = product;
  const withSale = applySale(productData, discountPct);

  res.json({
    ...withSale,
    trending: product.bestSeller,
    lowStock: product.stock > 0 && product.stock < 5,
    outOfStock: product.stock === 0,
    recentPurchases,
    reviewCount: reviews.length,
    avgRating: avgRating ? Math.round(avgRating * 10) / 10 : null,
  });
});

// GET /api/products/for-you/:userId — personalized recommendations
productRoutes.get('/for-you/:userId', async (req: Request, res: Response) => {
  const { userId } = req.params;

  // Get user's recently viewed categories
  const recentlyViewed = await prisma.recentlyViewed.findMany({
    where: { userId },
    include: { product: { select: { categoryId: true } } },
    orderBy: { viewedAt: 'desc' },
    take: 10,
  });

  const viewedCategoryIds = [
    ...new Set(recentlyViewed.map((rv) => rv.product.categoryId).filter(Boolean)),
  ] as string[];

  // Get purchased product IDs to exclude
  const purchasedItems = await prisma.orderItem.findMany({
    where: { order: { userId } },
    select: { productId: true },
  });
  const purchasedIds = purchasedItems.map((i) => i.productId);

  let products;

  if (viewedCategoryIds.length > 0) {
    products = await prisma.product.findMany({
      where: {
        active: true,
        categoryId: { in: viewedCategoryIds },
        id: { notIn: purchasedIds },
      },
      include: { category: true },
      orderBy: [{ bestSeller: 'desc' }, { createdAt: 'desc' }],
      take: 12,
    });
  } else {
    // Fallback: bestsellers
    products = await prisma.product.findMany({
      where: { active: true, bestSeller: true },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
      take: 12,
    });
  }

  res.json({ products, personalized: viewedCategoryIds.length > 0 });
});
