import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/cart', '/checkout'],
    },
    sitemap: 'https://srinidhiboutique.com/sitemap.xml',
  };
}
