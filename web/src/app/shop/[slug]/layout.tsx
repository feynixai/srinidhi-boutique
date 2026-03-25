import type { Metadata } from 'next';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface Props {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { slug } = await params;
    const res = await fetch(`${API_URL}/api/products/${slug}`, { next: { revalidate: 3600 } });
    if (!res.ok) return { title: 'Product - Srinidhi Boutique' };

    const product = await res.json();
    const price = Number(product.price).toLocaleString('en-IN');
    const image = product.images?.[0];
    const description = product.description
      ? `${product.description.slice(0, 150)}...`
      : `Shop ${product.name} at ₹${price}. Premium Indian ethnic wear from Srinidhi Boutique, Hyderabad.`;

    return {
      title: `${product.name} - ₹${price} | Srinidhi Boutique`,
      description,
      openGraph: {
        title: `${product.name} - ₹${price}`,
        description,
        images: image ? [{ url: image, width: 800, height: 1000, alt: product.name }] : [],
        type: 'website',
        siteName: 'Srinidhi Boutique',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${product.name} - ₹${price}`,
        description,
        images: image ? [image] : [],
      },
    };
  } catch {
    return { title: 'Product - Srinidhi Boutique' };
  }
}

export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
