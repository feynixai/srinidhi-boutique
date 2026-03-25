import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice?: number;
  images: string[];
  category?: { name: string };
}

interface Collection {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  products: Product[];
}

async function getCollection(slug: string): Promise<Collection | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/collections/${slug}`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const collection = await getCollection(params.slug);
  if (!collection) return { title: 'Collection Not Found' };
  return {
    title: `${collection.name} | Srinidhi Boutique`,
    description: collection.description || `Shop ${collection.name} - curated collection at Srinidhi Boutique.`,
  };
}

export default async function CollectionPage({ params }: { params: { slug: string } }) {
  const collection = await getCollection(params.slug);
  if (!collection) notFound();

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="relative bg-charcoal py-20 px-4 text-center overflow-hidden">
        {collection.image && (
          <div className="absolute inset-0 opacity-20">
            <Image src={collection.image} alt="" fill className="object-cover" />
          </div>
        )}
        <div className="relative max-w-2xl mx-auto">
          <p className="text-gold uppercase tracking-[0.3em] text-xs mb-3 font-medium">Curated Collection</p>
          <h1 className="font-serif text-4xl md:text-5xl text-white mb-4">{collection.name}</h1>
          <div className="divider-gold" />
          {collection.description && (
            <p className="text-white/70 mt-4 text-base leading-relaxed">{collection.description}</p>
          )}
          <p className="text-white/50 text-sm mt-3">{collection.products.length} pieces</p>
        </div>
      </section>

      {/* Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        {collection.products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-charcoal/50">No products in this collection yet.</p>
            <Link href="/shop" className="btn-gold mt-6 inline-block px-8 py-3 text-sm tracking-widest">
              BROWSE ALL
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {collection.products.map((product) => {
              const discount = product.comparePrice
                ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
                : 0;
              return (
                <Link key={product.id} href={`/product/${product.slug}`} className="group">
                  <div className="relative aspect-[3/4] overflow-hidden bg-gray-100 rounded-sm">
                    {product.images[0] ? (
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 50vw, 25vw"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-600 text-sm">No image</span>
                      </div>
                    )}
                    {discount > 0 && (
                      <span className="absolute top-2 left-2 bg-rose-gold text-white text-xs px-2 py-0.5 font-medium">
                        -{discount}%
                      </span>
                    )}
                  </div>
                  <div className="mt-3 px-1">
                    {product.category && (
                      <p className="text-xs text-charcoal/50 uppercase tracking-wider mb-0.5">
                        {product.category.name}
                      </p>
                    )}
                    <h3 className="font-serif text-sm text-charcoal group-hover:text-rose-gold transition-colors leading-snug">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-charcoal font-semibold text-sm">
                        ₹{Number(product.price).toLocaleString('en-IN')}
                      </span>
                      {product.comparePrice && (
                        <span className="text-charcoal/40 text-xs line-through">
                          ₹{Number(product.comparePrice).toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
