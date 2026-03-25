import Link from 'next/link';
import Image from 'next/image';

const POSTS = [
  {
    slug: 'how-to-drape-a-saree',
    title: 'How to Drape a Saree - 5 Elegant Styles',
    excerpt: 'From the classic Nivi drape worn across South India to the regal Gujarati style - learn five beautiful ways to drape your saree for any occasion.',
    image: 'https://picsum.photos/seed/saree-drape/800/500',
    category: 'Style Guide',
    date: 'March 20, 2026',
    readTime: '8 min read',
  },
  {
    slug: 'top-10-kurti-styles',
    title: 'Top 10 Kurti Styles for Every Occasion',
    excerpt: 'Straight-fit to A-line, chikankari to mirror work - discover the 10 kurti styles every Indian woman needs in her wardrobe and how to style each one.',
    image: 'https://picsum.photos/seed/kurti-style/800/500',
    category: 'Style Guide',
    date: 'March 15, 2026',
    readTime: '6 min read',
  },
  {
    slug: 'wedding-season-outfit-guide',
    title: 'Wedding Season: Complete Outfit Guide',
    excerpt: 'From the mehendi morning to the reception night - a complete outfit guide so you always look stunning at every wedding function, whatever your role.',
    image: 'https://picsum.photos/seed/wedding-outfit/800/500',
    category: 'Lookbook',
    date: 'March 10, 2026',
    readTime: '9 min read',
  },
  {
    slug: 'caring-for-silk-sarees',
    title: 'Caring for Your Silk Sarees',
    excerpt: 'A silk saree is an heirloom. Learn exactly how to wash, dry, store, and preserve your silk sarees so they remain beautiful for generations.',
    image: 'https://picsum.photos/seed/silk-care/800/500',
    category: 'Care Tips',
    date: 'March 5, 2026',
    readTime: '5 min read',
  },
  {
    slug: 'lehenga-vs-saree',
    title: 'Lehenga vs Saree: Which One for Your Event?',
    excerpt: 'Can\'t decide between a lehenga and a saree for the big day? We break down comfort, occasion suitability, styling ease, and budget to help you choose.',
    image: 'https://picsum.photos/seed/lehenga-guide/800/500',
    category: 'Buying Guide',
    date: 'February 28, 2026',
    readTime: '7 min read',
  },
  {
    slug: 'accessorize-with-indian-wear',
    title: 'Accessorize Right: Jewelry Guide for Indian Wear',
    excerpt: 'The right jewelry transforms an outfit. From temple gold for silk sarees to oxidised silver for printed kurtis - the complete guide to accessorizing Indian wear.',
    image: 'https://picsum.photos/seed/jewel-guide/800/500',
    category: 'Style Guide',
    date: 'February 20, 2026',
    readTime: '6 min read',
  },
];

export default function BlogPage() {
  const featured = POSTS[0];
  const rest = POSTS.slice(1);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <div className="text-center mb-12">
        <p className="text-rose-gold text-sm tracking-[0.2em] uppercase mb-2">Our Journal</p>
        <h1 className="font-serif text-4xl md:text-5xl mb-3">Style &amp; Care</h1>
        <p className="text-gray-500 max-w-xl mx-auto">Tips, lookbooks, and buying guides for the modern Indian woman.</p>
      </div>

      {/* Featured Post */}
      <div className="mb-12">
        <Link href={`/blog/${featured.slug}`} className="block relative rounded-sm overflow-hidden group cursor-pointer">
          <div className="relative h-[400px] md:h-[500px]">
            <Image src={featured.image} alt={featured.title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/30 to-transparent" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
            <span className="text-xs bg-rose-gold px-2.5 py-1 rounded font-medium uppercase tracking-wider">{featured.category}</span>
            <h2 className="font-serif text-2xl md:text-3xl mt-3 mb-2">{featured.title}</h2>
            <p className="text-white/75 text-sm mb-4 max-w-2xl">{featured.excerpt}</p>
            <div className="flex items-center gap-3 text-xs text-white/60">
              <span>{featured.date}</span>
              <span>·</span>
              <span>{featured.readTime}</span>
            </div>
          </div>
        </Link>
      </div>

      {/* Post Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {rest.map((post) => (
          <Link key={post.slug} href={`/blog/${post.slug}`}>
            <article className="bg-white border border-gray-100 rounded-sm overflow-hidden group hover:shadow-md transition-shadow h-full">
              <div className="relative h-52 overflow-hidden">
                <Image src={post.image} alt={post.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="p-5">
                <span className="text-xs text-rose-gold uppercase tracking-wider font-medium">{post.category}</span>
                <h3 className="font-serif text-lg mt-2 mb-2 line-clamp-2 leading-snug">{post.title}</h3>
                <p className="text-gray-500 text-sm line-clamp-2 mb-4">{post.excerpt}</p>
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>{post.date}</span>
                  <span>{post.readTime}</span>
                </div>
              </div>
            </article>
          </Link>
        ))}
      </div>

      {/* Newsletter */}
      <div className="mt-16 bg-warm-white rounded-sm p-8 text-center">
        <h2 className="font-serif text-2xl mb-2">Get Style Tips in Your Inbox</h2>
        <p className="text-gray-500 text-sm mb-6">Subscribe for new lookbooks, care guides &amp; exclusive offers.</p>
        <div className="flex max-w-sm mx-auto gap-3">
          <input
            type="email"
            placeholder="Your email address"
            className="flex-1 border border-gray-200 rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-rose-gold"
          />
          <button className="btn-primary px-5 py-2.5 text-sm whitespace-nowrap">Subscribe</button>
        </div>
        <p className="text-xs text-gray-600 mt-3">No spam. Unsubscribe anytime.</p>
      </div>

      <div className="mt-8 text-center">
        <Link href="/shop" className="btn-outline px-8 py-3 inline-block text-sm">
          SHOP THE COLLECTION
        </Link>
      </div>
    </div>
  );
}
