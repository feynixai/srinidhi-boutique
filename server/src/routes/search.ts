import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const searchRoutes = Router();

// Simple fuzzy/variant normalization for Indian clothing terms
const SYNONYMS: Record<string, string[]> = {
  saree:  ['saari', 'sari', 'saree'],
  salwar: ['salwar', 'shalwar', 'salvar'],
  kurta:  ['kurta', 'kurti', 'kurthi'],
  lehenga: ['lehenga', 'lehnga', 'lahenga'],
  anarkali: ['anarkali', 'anarkalli'],
  dupatta: ['dupatta', 'dupata', 'dopatta'],
  churidar: ['churidar', 'chudidar', 'chudidhar'],
};

function normalizeQuery(q: string): string {
  const lower = q.toLowerCase().trim();
  for (const [canonical, variants] of Object.entries(SYNONYMS)) {
    if (variants.includes(lower)) return canonical;
  }
  return lower;
}

// GET /api/search/suggest?q=xxx
searchRoutes.get('/suggest', async (req: Request, res: Response) => {
  const q = ((req.query.q as string) || '').trim();

  if (q.length < 2) {
    res.json({ suggestions: [], popular: await getPopularSearches() });
    return;
  }

  const normalized = normalizeQuery(q);

  const products = await prisma.product.findMany({
    where: {
      active: true,
      OR: [
        { name: { contains: normalized, mode: 'insensitive' } },
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: normalized, mode: 'insensitive' } },
        { fabric: { contains: normalized, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      comparePrice: true,
      images: true,
      category: { select: { name: true, slug: true } },
    },
    take: 8,
    orderBy: [{ bestSeller: 'desc' }, { createdAt: 'desc' }],
  });

  // Category suggestions
  const categories = await prisma.category.findMany({
    where: { name: { contains: q, mode: 'insensitive' } },
    take: 3,
  });

  const suggestions = products.map((p) => ({
    type: 'product' as const,
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.price,
    comparePrice: p.comparePrice,
    image: p.images[0] || null,
    category: p.category?.name || null,
  }));

  const categorySuggestions = categories.map((c) => ({
    type: 'category' as const,
    id: c.id,
    name: c.name,
    slug: c.slug,
  }));

  // Did you mean? — check if normalized differs from original query
  const didYouMean = normalized !== q.toLowerCase() ? normalized : null;

  res.json({
    suggestions: [...suggestions, ...categorySuggestions].slice(0, 8),
    didYouMean,
    popular: suggestions.length === 0 ? await getPopularSearches() : [],
  });
});

// GET /api/search/popular — top popular searches based on bestsellers
searchRoutes.get('/popular', async (_req: Request, res: Response) => {
  const popular = await getPopularSearches();
  res.json({ popular });
});

// Full search with pagination
searchRoutes.get('/', async (req: Request, res: Response) => {
  const q = ((req.query.q as string) || '').trim();
  const page = parseInt((req.query.page as string) || '1', 10);
  const limit = parseInt((req.query.limit as string) || '20', 10);

  if (!q) {
    res.json({ products: [], total: 0, page, totalPages: 0, didYouMean: null });
    return;
  }

  const normalized = normalizeQuery(q);

  const where = {
    active: true,
    OR: [
      { name: { contains: normalized, mode: 'insensitive' as const } },
      { name: { contains: q, mode: 'insensitive' as const } },
      { description: { contains: normalized, mode: 'insensitive' as const } },
      { description: { contains: q, mode: 'insensitive' as const } },
      { fabric: { contains: normalized, mode: 'insensitive' as const } },
    ],
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: [{ bestSeller: 'desc' }, { createdAt: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  const didYouMean = total === 0 && normalized !== q.toLowerCase() ? normalized : null;

  res.json({ products, total, page, totalPages: Math.ceil(total / limit), didYouMean });
});

async function getPopularSearches(): Promise<string[]> {
  // Return category names + common search terms as popular searches
  const categories = await prisma.category.findMany({ select: { name: true }, take: 8 });
  const fixed = ['Sarees', 'Kurtis', 'Lehengas', 'Anarkalis', 'Salwar Suits'];
  const catNames = categories.map((c) => c.name);
  const combined = [...new Set([...fixed, ...catNames])];
  return combined.slice(0, 8);
}
