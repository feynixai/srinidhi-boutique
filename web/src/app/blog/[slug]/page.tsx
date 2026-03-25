import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

const POSTS: Record<string, {
  title: string;
  category: string;
  date: string;
  readTime: string;
  image: string;
  content: string[];
}> = {
  'how-to-drape-a-saree': {
    title: 'How to Drape a Saree - 5 Elegant Styles',
    category: 'Style Guide',
    date: 'March 20, 2026',
    readTime: '8 min read',
    image: 'https://picsum.photos/seed/saree-drape/1200/600',
    content: [
      'The saree is one of the world\'s most elegant and versatile garments - six yards of fabric that has been draped a thousand different ways for centuries. Whether you\'re a first-timer or a seasoned saree wearer, knowing different draping styles can transform how you look and feel in a saree.',
      '**1. The Classic Nivi Drape (Most Common)**',
      'The Nivi style from Andhra Pradesh is the most widely worn drape across India. Start by tucking the plain end of the saree into your petticoat at the right side of your waist. Make 5–7 pleats (each about 5 inches wide) and tuck them into the waistband, letting them fall slightly to the left. Bring the remaining fabric around the back, across the chest, and drape the pallu over your left shoulder - letting it fall free or pinning it at the shoulder. Best for: All sarees, especially Kanjivaram, Banarasi, and chiffon sarees.',
      '**2. The Bengali Style**',
      'The Bengali drape creates a distinctive look with the pallu draped from the back, over the right shoulder, and across the chest. The pleats are draped at the front, creating a V-shape. This style is often worn without a blouse fastener. The pallu is allowed to flow freely. This style works beautifully with Tant cotton and Dhakai muslin sarees. Best for: Cotton sarees, festive occasions.',
      '**3. The Gujarati Style**',
      'In the Gujarati drape, the pallu comes from behind and falls over the right shoulder (opposite to the Nivi style). The front pleats are the same as Nivi, but the pallu is more structured and often decorated with jewellery or pins. This style is popular during Navratri and Garba. Best for: Bandhani sarees, heavy silk sarees for festivals.',
      '**4. The Maharashtrian Kashta Style**',
      'The Kashta or Nauvari style is a nine-yard saree worn in the style of a dhoti - bringing the fabric through the legs and tucking it at the back. It allows complete freedom of movement and is traditionally worn by Maharashtrian women for dance, festivals, and physical activities. Best for: Cotton sarees, Paithani sarees for festivals.',
      '**5. The Seedha Pallu (Tamilian / South Indian Style)**',
      'This style brings the pallu from the back, over the right shoulder, and across the front - the mirror image of the Nivi. It showcases the beautiful pallu border on the front of the saree. Traditionally worn in Tamil Nadu and Karnataka, particularly with rich Kanjivaram silk sarees. Best for: Heavy silk sarees, bridal occasions, temple visits.',
      '**Quick Tips for Beautiful Draping**',
      'Always wear a well-fitted petticoat that matches your saree colour. Use safety pins at the waist and on the shoulder for security. Press your saree before wearing to remove creases. For chiffon and georgette, use a slip to prevent the fabric from sticking to your petticoat.',
      'Visit our store or WhatsApp us if you need personalised saree draping assistance before a special occasion. Our team at Srinidhi Boutique is always happy to help!',
    ],
  },
  'top-10-kurti-styles': {
    title: 'Top 10 Kurti Styles for Every Occasion',
    category: 'Style Guide',
    date: 'March 15, 2026',
    readTime: '6 min read',
    image: 'https://picsum.photos/seed/kurti-style/1200/600',
    content: [
      'The humble kurti has evolved into one of the most versatile pieces in an Indian woman\'s wardrobe. From office boardrooms to festival celebrations, there\'s a kurti silhouette for every occasion. Here are the 10 styles you need to know:',
      '**1. Straight-Cut Kurti**',
      'The classic, clean silhouette that works for absolutely everything. Pair with leggings for office wear, jeans for casual outings, or palazzos for a semi-formal look. Our Straight Fit Kurti in lavender georgette is a bestseller for exactly this reason.',
      '**2. A-Line Kurti**',
      'Fitted at the top and flaring out gently below - universally flattering on all body types. Perfect for daily wear. Our Indigo Block Print A-Line is handcrafted in Jaipur and pairs beautifully with white palazzos.',
      '**3. Anarkali-Style Kurti**',
      'Long, flowy, and dramatic - the Anarkali kurti features a fitted bodice and a full, flared skirt. Ideal for festive occasions, sangeet functions, and Eid. Style with churidar and a heavy dupatta.',
      '**4. Asymmetric Hem Kurti**',
      'The kurta with a longer back or diagonal hemline. The asymmetric cut adds a modern, Indo-western touch. Works beautifully with narrow pants or leggings. Great for parties and casual evenings.',
      '**5. Peplum Kurti**',
      'A kurti with a peplum frill at the waist - adds volume to the hips and looks stunning on slim figures. The frill can be at the hem or just at the waist. Pair with straight or slim-fit pants.',
      '**6. Pathani / Long Kurta**',
      'Ankle or calf-length kurtas worn with leggings or salwars. Very comfortable for long days - festivals, travel, or casual family gatherings. Available in cotton, linen, and rayon.',
      '**7. Short Kurti**',
      'Above-knee length kurtis that can be paired with jeans, skirts, or even worn as a top. Perfect for college-going women, casual brunches, or everyday wear. Looks great with high-waist jeans.',
      '**8. Cape-Style Kurti**',
      'A modern innovation - a kurti with a flowing cape or jacket overlay. Gives a high-fashion look without effort. Ideal for evening parties, office farewell events, and festive gatherings.',
      '**9. Embroidered / Thread Work Kurti**',
      'Our Lucknowi Chikankari Kurti and Mirror Work Kurti fall in this category. Detailed hand-embroidery makes these kurtis the star of any outfit. Pair simply - let the embroidery speak. Best for festivals, functions, and evening wear.',
      '**10. Kurta Set with Dupatta**',
      'The complete three-piece set - kurta, bottom, and dupatta - takes all the guesswork out of dressing. Our Mustard Yellow Kurta Set with dupatta is a one-stop festive outfit. Ready to wear, always stunning.',
      'Browse our full kurti collection at Srinidhi Boutique for hand-picked styles from Jaipur, Lucknow, and Hyderabad - all at honest prices, with easy 7-day returns.',
    ],
  },
  'wedding-season-outfit-guide': {
    title: 'Wedding Season: Complete Outfit Guide',
    category: 'Lookbook',
    date: 'March 10, 2026',
    readTime: '9 min read',
    image: 'https://picsum.photos/seed/wedding-outfit/1200/600',
    content: [
      'Indian weddings are a magnificent tapestry of colour, music, and tradition - and they demand an equally magnificent wardrobe. Whether you\'re the bride, her best friend, a relative, or just a guest, here\'s your complete outfit guide for the wedding season.',
      '**For the Bride - Day One (Mehendi & Haldi)**',
      'Keep it light, comfortable, and cheerful. Yellow and green are traditional Haldi colours. Our Festive Lehenga in Powder Blue or a printed anarkali in marigold yellow works beautifully. Avoid heavy embroidery - this is a day of movement and joy. Keep jewelry minimal - floral or gold hoops.',
      '**For the Bride - Day Two (Sangeet)**',
      'This is your night to sparkle. Our Party Lehenga in Rose Gold with all-over sequin work was made for this moment. Alternatively, an embroidered net anarkali in mint green adds a fairy-tale charm. Go bold with statement earrings and a choker. Dance without inhibition!',
      '**For the Bride - Wedding Day**',
      'This is the main event. Our Bridal Lehenga in Scarlet Red with intricate gold zari and resham embroidery is the dream. The heavily embroidered set with padded blouse and scalloped net dupatta is built for this. Complete with a maang tikka, nath, and temple jewellery set.',
      '**For the Bride\'s Best Friend (Bridesmaid Look)**',
      'Coordinate but don\'t match the bride. Go for a saree or lehenga in a complementary colour - champagne, blush pink, or sage green. Our Indo-Western Lehenga in Sage Green is perfect for the modern bridesmaid. Keep accessories cohesive across the group.',
      '**For the Relative / Family Member**',
      'Rich and traditional. A Banarasi saree in jewel tones (royal blue, deep maroon, emerald green) never goes wrong. Our Kanjivaram Silk Saree in Deep Maroon is the epitome of elegant family dressing. Pair with temple jewellery and a classic bun.',
      '**For the Wedding Guest**',
      'Saree or lehenga, take your pick. A chiffon saree in emerald green or a simple anarkali in burgundy keeps you looking festive without overdressing. Follow the invite\'s dress code - some weddings specify colours for different functions.',
      '**For Destination Weddings**',
      'Pack light but smart. Georgette and chiffon sarees travel well and can be steamed into shape. A printed palazzo set works for day events. Reserve the heavy lehenga or silk saree for the actual wedding ceremony.',
      '**Key Accessories for Wedding Season**',
      'Invest in a versatile jewelry set you can mix across outfits. Our Temple Jewellery Set in Antique Gold pairs with everything from silk sarees to velvet lehengas. A Silk Potli Bag in Bottle Green or Maroon completes any festive look. Always carry a safety pin or two - for saree emergencies!',
      'Visit Srinidhi Boutique to try on our bridal and festive collection. WhatsApp us to book a personalised styling session - we\'re happy to help you find the perfect look for every wedding function.',
    ],
  },
  'caring-for-silk-sarees': {
    title: 'Caring for Your Silk Sarees',
    category: 'Care Tips',
    date: 'March 5, 2026',
    readTime: '5 min read',
    image: 'https://picsum.photos/seed/silk-care/1200/600',
    content: [
      'A silk saree is more than a piece of clothing - it\'s a work of art, an heirloom, a story woven in threads. With the right care, your silk sarees will remain vibrant and beautiful for generations. Here\'s everything you need to know:',
      '**Washing Silk Sarees**',
      'The golden rule: dry clean whenever possible. For light cleaning, hand wash in cold water using a mild silk-friendly detergent (like Genteel or a few drops of baby shampoo). Submerge gently and swish - never rub, scrub, or twist. Rinse thoroughly in cold water. Never use hot water - it weakens silk fibres and causes colours to bleed.',
      '**Drying Silk Sarees**',
      'Never wring a wet silk saree - it damages the weave. Instead, gently press the water out between two clean towels. Dry flat on a clean white sheet in a well-ventilated area, away from direct sunlight. Direct sun exposure will cause irreversible colour fading. Never machine dry or put silk in a tumble dryer.',
      '**Ironing Silk Sarees**',
      'Iron on the reverse side of the saree with a warm (not hot) iron while still slightly damp. Use a pressing cloth between the iron and the saree. Never iron directly on zari or embroidery - use a damp cloth as a barrier. Never use steam on heavy zari sarees - it can tarnish the gold threads.',
      '**Storing Silk Sarees**',
      'Always store clean, never damp. Wrap each saree in a fresh muslin cloth (not plastic bags - they trap moisture and cause mildew). Fold with acid-free tissue paper between folds to prevent creasing. Avoid wooden cupboards directly - use camphor balls to prevent insects but don\'t let camphor touch the fabric.',
      '**Special Care for Kanjivaram and Banarasi Sarees**',
      'Zari work sarees need extra attention. The gold or silver threads are delicate. Avoid spraying perfume or deodorant when wearing a zari saree - alcohol damages the metallic threads. Air your Kanjivaram saree after every wear before folding and storing. Refold along different lines each time to prevent permanent crease marks.',
      '**Long-Term Preservation**',
      'For a saree you won\'t wear for several months, unpack, air, and refold every 3–4 months. This prevents permanent creasing and allows the fabric to breathe. If you notice any tarnishing on the zari, take it to a professional dry cleaner who specialises in silk - don\'t attempt to clean it at home.',
      'Your silk saree is an investment. Treat it with love, store it with care, and it will remain your most treasured piece for decades - something to pass down to the next generation.',
    ],
  },
  'lehenga-vs-saree': {
    title: 'Lehenga vs Saree: Which One for Your Event?',
    category: 'Buying Guide',
    date: 'February 28, 2026',
    readTime: '7 min read',
    image: 'https://picsum.photos/seed/lehenga-guide/1200/600',
    content: [
      'The eternal question at every Indian wedding, festival, and family function: lehenga or saree? Both are stunning - but each has its strengths. Let\'s help you decide with a no-nonsense breakdown.',
      '**Comfort & Ease of Wearing**',
      'Winner: Lehenga. A lehenga is straightforward to wear - the skirt, blouse, and dupatta are separate pieces you simply put on. No draping expertise required. A saree, on the other hand, takes practice and confidence to drape correctly. If you\'re not comfortable draping a saree yourself, a lehenga is a safer choice for big events where you\'re already nervous.',
      '**Freedom of Movement**',
      'Winner: Depends on the style. A lehenga with a flared skirt allows free movement - great for dancing at sangeet. However, a pre-stitched or pre-draped saree can be equally comfortable. A traditionally draped saree may require you to re-tuck pleats during the day.',
      '**Occasion Suitability**',
      'For Bridal: Both work - but red bridal lehengas are more popular in North India while the Kanjivaram silk saree dominates South Indian weddings. For Sangeet: Lehenga is the clear winner - the full skirt is made for dancing. For Reception: A saree (Banarasi, Kanjivaram, or chiffon) looks sophisticated and elegant. For Mehendi/Haldi: A light lehenga or anarkali is more practical.',
      '**Body Type Consideration**',
      'Lehenga: The waist-cinching blouse and flared skirt create an hourglass silhouette. Great for those who want to define the waist. A-line lehengas are universally flattering. Saree: A well-draped saree can camouflage and accentuate in equal measure. The pre-stitched option makes it accessible to all. A structured petticoat gives a clean drape regardless of body type.',
      '**Budget**',
      'Generally, a beautifully embroidered lehenga at the bridal level will cost more than a comparable silk saree. However, both have options across all budgets. Our Festive Lehenga starts at ₹8,500 and our Party Lehenga at ₹5,500. Our Organza Saree starts at ₹5,800 and our Chiffon Party Saree at ₹3,500.',
      '**Styling Versatility**',
      'Winner: Saree. A saree can be draped in multiple styles (Nivi, Bengali, Gujarati) and can look completely different each time. A saree\'s pallu can be used as a dupatta for another outfit. A lehenga skirt can be worn with a plain kurti for a casual look, but sarees offer more transformation.',
      '**The Verdict**',
      'Choose a lehenga if: you\'re not confident draping a saree, you want to dance the night away, you\'re attending a North Indian wedding, or you want a modern silhouette. Choose a saree if: you\'re a confident draper, you\'re attending a South Indian or traditional wedding, you want timeless elegance, or you want a versatile piece you can style many ways.',
      'Can\'t decide? WhatsApp us at Srinidhi Boutique and tell us your occasion, body type, and budget - we\'ll help you find the perfect look.',
    ],
  },
  'accessorize-with-indian-wear': {
    title: 'Accessorize Right: Jewelry Guide for Indian Wear',
    category: 'Style Guide',
    date: 'February 20, 2026',
    readTime: '6 min read',
    image: 'https://picsum.photos/seed/jewel-guide/1200/600',
    content: [
      'The right jewelry doesn\'t just complement an outfit - it completes it. Indian ethnic wear offers a glorious canvas for jewelry of every kind, from delicate gold to bold oxidised silver. Here\'s your complete guide to accessorizing Indian wear:',
      '**For Silk Sarees (Kanjivaram, Banarasi)**',
      'Heavy silk sarees deserve equally grand jewelry. Temple jewelry sets in antique gold - long necklaces, jhumka earrings, and maang tikka - are the perfect match. South Indian silk sarees pair especially well with Kundan or Polki sets. Keep the neckline jewelry heavy and let the earrings be jhumkas or chandelier-style drops. Avoid delicate chains - they disappear against the rich fabric.',
      '**For Cotton and Linen Sarees**',
      'These everyday fabrics call for understated, artisanal jewelry. Oxidised silver sets, dhokra work bangles, terracotta jewelry, or simple wooden beads complement cotton beautifully. Our Oxidised Silver Jewellery Set (boho) is specifically designed for this pairing. Avoid heavy gold - it looks out of place against casual cotton.',
      '**For Kurtis and Salwar Suits**',
      'The jewelry depends on the occasion. For casual everyday kurtis, a simple pair of jhumkas, a delicate necklace, and glass bangles work perfectly. For festive kurtis, layer up - stacked bangles, a statement necklace, and chandelier earrings. For embroidered or mirror work kurtis, let the embroidery shine - wear minimal jewelry, just stud earrings and thin bangles.',
      '**For Lehengas**',
      'Bridal lehengas deserve the full jewelry treatment - maang tikka, nath (nose ring), necklace, earrings, bajuband, hand harness, and anklets. For party or festive lehengas, pick one statement piece - either a bold necklace OR statement earrings, not both. Our Temple Jewellery Set pairs beautifully with both red and blue lehengas.',
      '**For Georgette and Chiffon Sarees**',
      'These lightweight fabrics suit lightweight jewelry. A Polki or Kundan set, pearl drops, or simple gold chains and studs. For evening parties, crystal or CZ (cubic zirconia) jewelry works beautifully with chiffon and adds the right amount of sparkle.',
      '**Bangles - The Unsung Hero**',
      'Never underestimate bangles. A stack of glass bangles in coordinating colours elevates any Indian outfit. Mix metallic and coloured bangles for a festive look. Antique gold bangles work for all fabrics. Keep wrist jewelry proportional - fewer bangles for casual, full stack for festive.',
      '**Hair and Head Jewelry**',
      'A maang tikka, matha patti, or simple gajra (flower garland) can transform your look. For weddings, a maang tikka is essential. For casual occasions, a single flower in the hair adds elegance. Match your head jewelry metal to your main jewelry - don\'t mix gold and silver.',
      '**The Golden Rule**',
      'Balance is everything. If your outfit is heavily embroidered or embellished, keep jewelry minimal. If your outfit is simple and elegant (plain silk, solid cotton), go bold with jewelry. Let one element - either the outfit or the jewelry - be the star.',
      'Browse our jewelry collection at Srinidhi Boutique - from temple sets to oxidised silver, curated specifically to complement Indian ethnic wear.',
    ],
  },
};

export async function generateStaticParams() {
  return Object.keys(POSTS).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = POSTS[params.slug];
  if (!post) return { title: 'Post Not Found' };
  return {
    title: `${post.title} | Srinidhi Boutique Blog`,
    description: post.content[0].slice(0, 155),
  };
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = POSTS[params.slug];
  if (!post) notFound();

  return (
    <div className="bg-white">
      {/* Hero */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        <Image src={post.image} alt={post.title} fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-charcoal/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
          <span className="text-xs bg-rose-gold text-white px-2.5 py-1 rounded font-medium uppercase tracking-wider">
            {post.category}
          </span>
          <h1 className="font-serif text-2xl md:text-4xl text-white mt-3 max-w-3xl leading-snug">
            {post.title}
          </h1>
          <p className="text-white/60 text-xs mt-2">
            {post.date} · {post.readTime}
          </p>
        </div>
      </div>

      {/* Content */}
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div className="space-y-5 text-charcoal/80 leading-relaxed text-base">
          {post.content.map((para, i) => {
            if (para.startsWith('**') && para.endsWith('**')) {
              return (
                <h2 key={i} className="font-serif text-xl text-charcoal mt-8 mb-2">
                  {para.replace(/\*\*/g, '')}
                </h2>
              );
            }
            return <p key={i}>{para}</p>;
          })}
        </div>

        {/* CTA */}
        <div className="mt-12 bg-cream rounded-sm p-7 text-center border border-gold/20">
          <p className="font-serif text-xl text-charcoal mb-2">Ready to Shop?</p>
          <p className="text-charcoal/60 text-sm mb-5">
            Explore our curated collection of ethnic wear - handpicked by Srinidhi.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/shop" className="btn-gold px-8 py-3 text-sm tracking-widest inline-block">
              SHOP NOW
            </Link>
            <Link href="/blog" className="border border-charcoal text-charcoal px-8 py-3 text-sm tracking-widest hover:bg-charcoal hover:text-white transition-colors">
              MORE ARTICLES
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}
