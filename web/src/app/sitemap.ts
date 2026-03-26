import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://srinidhiboutique.com';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [productsData, categoriesData] = await Promise.all([
    fetchJson<{ products: { slug: string; updatedAt?: string }[] }>(`${API_URL}/api/products?limit=500`),
    fetchJson<{ id: string; slug: string }[]>(`${API_URL}/api/categories`),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE_URL}/shop`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/offers`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/about`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/contact`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/shipping`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE_URL}/size-guide`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/faq`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE_URL}/blog`, changeFrequency: 'weekly', priority: 0.6 },
  ];

  const productRoutes: MetadataRoute.Sitemap = (productsData?.products || []).map((p) => ({
    url: `${BASE_URL}/shop/${p.slug}`,
    lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const categoryRoutes: MetadataRoute.Sitemap = (Array.isArray(categoriesData) ? categoriesData : []).map((c) => ({
    url: `${BASE_URL}/category/${c.slug}`,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...productRoutes, ...categoryRoutes];
}
