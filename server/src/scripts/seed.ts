import { PrismaClient } from '@prisma/client';
import slugify from 'slugify';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // ── Categories ──────────────────────────────────────────────────────────────
  const [sarees, kurtis, lehengas, blouses, dupattas, accessories, palazzos, anarkalis, salwars] =
    await Promise.all([
      prisma.category.upsert({
        where: { slug: 'sarees' },
        update: {},
        create: {
          name: 'Sarees',
          slug: 'sarees',
          image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&h=400&fit=crop',
        },
      }),
      prisma.category.upsert({
        where: { slug: 'kurtis' },
        update: {},
        create: {
          name: 'Kurtis',
          slug: 'kurtis',
          image: 'https://images.unsplash.com/photo-1594938298603-c8148c4b4357?w=400&h=400&fit=crop',
        },
      }),
      prisma.category.upsert({
        where: { slug: 'lehengas' },
        update: {},
        create: {
          name: 'Lehengas',
          slug: 'lehengas',
          image: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=400&h=400&fit=crop',
        },
      }),
      prisma.category.upsert({
        where: { slug: 'blouses' },
        update: {},
        create: {
          name: 'Blouses',
          slug: 'blouses',
          image: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=400&h=400&fit=crop',
        },
      }),
      prisma.category.upsert({
        where: { slug: 'dupattas' },
        update: {},
        create: {
          name: 'Dupattas',
          slug: 'dupattas',
          image: 'https://images.unsplash.com/photo-1606503825008-909a67e63c3d?w=400&h=400&fit=crop',
        },
      }),
      prisma.category.upsert({
        where: { slug: 'accessories' },
        update: {},
        create: {
          name: 'Accessories',
          slug: 'accessories',
          image: 'https://images.unsplash.com/photo-1573408301185-9519f94816b7?w=400&h=400&fit=crop',
        },
      }),
      prisma.category.upsert({
        where: { slug: 'palazzo-sets' },
        update: {},
        create: {
          name: 'Palazzo Sets',
          slug: 'palazzo-sets',
          image: 'https://images.unsplash.com/photo-1600950207944-0d63e8edbc3f?w=400&h=400&fit=crop',
        },
      }),
      prisma.category.upsert({
        where: { slug: 'anarkalis' },
        update: {},
        create: {
          name: 'Anarkalis',
          slug: 'anarkalis',
          image: 'https://images.unsplash.com/photo-1614886137799-73cba0c4dba6?w=400&h=400&fit=crop',
        },
      }),
      prisma.category.upsert({
        where: { slug: 'salwar-suits' },
        update: {},
        create: {
          name: 'Salwar Suits',
          slug: 'salwar-suits',
          image: 'https://images.unsplash.com/photo-1583623025817-d180a2221d0a?w=400&h=400&fit=crop',
        },
      }),
    ]);

  const products = [
    // ── Sarees (8) ──────────────────────────────────────────────────────────
    {
      name: 'Kanjivaram Silk Saree — Deep Maroon',
      description:
        'Pure Kanjivaram silk saree with intricate gold zari work. Each saree is handwoven by master weavers in Kanchipuram and takes up to 15 days to complete. Perfect for weddings and festive occasions. Comes with matching blouse piece.',
      price: 12500,
      comparePrice: 15000,
      images: [
        'https://picsum.photos/seed/sb-silk-saree/600/800',
        'https://picsum.photos/seed/sb-lehenga-bridal/600/800',
        'https://picsum.photos/seed/sb-saree-party/600/800',
      ],
      categoryId: sarees.id,
      sizes: ['Free Size'],
      colors: ['Maroon', 'Gold'],
      fabric: 'Pure Kanjivaram Silk',
      occasion: ['wedding', 'festival'],
      stock: 8,
      featured: true,
      bestSeller: true,
      onOffer: false,
    },
    {
      name: 'Banarasi Georgette Saree — Royal Blue',
      description:
        'Elegant Banarasi georgette saree with subtle silver border and floral motifs woven throughout. Lightweight and comfortable for all-day wear at festivals or family functions.',
      price: 4200,
      comparePrice: 5500,
      images: [
        'https://picsum.photos/seed/sb-saree-blue/600/800',
        'https://picsum.photos/seed/sb-silk-saree/600/800',
      ],
      categoryId: sarees.id,
      sizes: ['Free Size'],
      colors: ['Royal Blue', 'Silver'],
      fabric: 'Banarasi Georgette',
      occasion: ['festival', 'party'],
      stock: 15,
      featured: true,
      bestSeller: false,
      onOffer: true,
      offerPercent: 24,
    },
    {
      name: 'Cotton Handloom Saree — Pastel Pink',
      description:
        'Handwoven cotton saree in soft pastel pink, crafted by weavers in Andhra Pradesh. Breathable fabric ideal for daily wear, office, and casual events. Machine washable.',
      price: 1800,
      comparePrice: null,
      images: [
        'https://picsum.photos/seed/sb-kurti-cotton/600/800',
        'https://picsum.photos/seed/sb-salwar-print/600/800',
      ],
      categoryId: sarees.id,
      sizes: ['Free Size'],
      colors: ['Pastel Pink', 'White'],
      fabric: 'Handloom Cotton',
      occasion: ['casual'],
      stock: 25,
      featured: false,
      bestSeller: true,
      onOffer: false,
    },
    {
      name: 'Chiffon Party Saree — Emerald Green',
      description:
        'Shimmery chiffon saree with sequin border and pallu. A showstopper for evening parties, receptions, and cocktail dinners. Pre-stitched pallu option available on request.',
      price: 3500,
      comparePrice: 4200,
      images: [
        'https://picsum.photos/seed/sb-saree-party/600/800',
        'https://picsum.photos/seed/sb-anarkali-ethnic/600/800',
      ],
      categoryId: sarees.id,
      sizes: ['Free Size'],
      colors: ['Emerald Green', 'Gold'],
      fabric: 'Chiffon',
      occasion: ['party'],
      stock: 12,
      featured: true,
      bestSeller: false,
      onOffer: true,
      offerPercent: 17,
    },
    {
      name: 'Linen Saree — Earthy Tan',
      description:
        'Lightweight linen saree in warm earthy tones with a subtle checked texture. Perfect for office wear and casual outings. Pairs well with a simple cotton blouse.',
      price: 2200,
      comparePrice: null,
      images: [
        'https://picsum.photos/seed/sb-jewel-temple/600/800',
        'https://picsum.photos/seed/sb-linen-saree-2/600/800',
        'https://picsum.photos/seed/sb-linen-saree-3/600/800',
      ],
      categoryId: sarees.id,
      sizes: ['Free Size'],
      colors: ['Tan', 'Brown'],
      fabric: 'Linen',
      occasion: ['casual'],
      stock: 20,
      featured: false,
      bestSeller: true,
      onOffer: false,
    },
    {
      name: 'Organza Saree — Dusty Rose',
      description:
        'Dreamy organza saree in dusty rose with floral applique work on the border and pallu. Lightweight and semi-transparent — ideal for festive lunches and sangeet ceremonies.',
      price: 5800,
      comparePrice: 7000,
      images: [
        'https://picsum.photos/seed/sb-blouse-embroid/600/800',
        'https://picsum.photos/seed/sb-saree-blue/600/800',
      ],
      categoryId: sarees.id,
      sizes: ['Free Size'],
      colors: ['Dusty Rose', 'Gold'],
      fabric: 'Organza',
      occasion: ['wedding', 'festival', 'party'],
      stock: 10,
      featured: true,
      bestSeller: true,
      onOffer: true,
      offerPercent: 17,
    },
    {
      name: 'Patola Silk Saree — Geometric Multicolor',
      description:
        'Authentic double ikat Patola silk saree from Patan, Gujarat. The geometric pattern is woven using a 700-year-old technique where both warp and weft are tie-dyed before weaving. A collector\'s piece.',
      price: 18000,
      comparePrice: 22000,
      images: [
        'https://picsum.photos/seed/sb-kurti-cotton/600/800',
        'https://picsum.photos/seed/sb-silk-saree/600/800',
        'https://picsum.photos/seed/sb-lehenga-bridal/600/800',
      ],
      categoryId: sarees.id,
      sizes: ['Free Size'],
      colors: ['Red', 'Green', 'Gold', 'Black'],
      fabric: 'Patola Silk',
      occasion: ['wedding', 'festival'],
      stock: 4,
      featured: true,
      bestSeller: false,
      onOffer: true,
      offerPercent: 18,
    },
    {
      name: 'Sambalpuri Cotton Saree — Deep Violet',
      description:
        'Handwoven Sambalpuri cotton saree from Odisha with traditional bandha (ikat) patterns. The deep violet base with contrasting white motifs makes it a bold choice for festive occasions.',
      price: 3200,
      comparePrice: null,
      images: [
        'https://picsum.photos/seed/sb-saree-party/600/800',
      ],
      categoryId: sarees.id,
      sizes: ['Free Size'],
      colors: ['Violet', 'White'],
      fabric: 'Sambalpuri Cotton',
      occasion: ['festival', 'casual'],
      stock: 14,
      featured: false,
      bestSeller: true,
      onOffer: false,
    },
    // ── Kurtis (6) ──────────────────────────────────────────────────────────
    {
      name: 'A-Line Cotton Kurti — Indigo Block Print',
      description:
        'Hand block-printed A-line kurti in indigo and white, crafted by artisans in Jaipur. Jaipur craft at its finest. Pairs with white palazzos or blue jeans for a smart casual look.',
      price: 899,
      comparePrice: null,
      images: [
        'https://picsum.photos/seed/sb-kurti-cotton/600/800',
        'https://picsum.photos/seed/sb-salwar-print/600/800',
      ],
      categoryId: kurtis.id,
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['Indigo', 'White'],
      fabric: 'Cotton',
      occasion: ['casual'],
      stock: 40,
      featured: false,
      bestSeller: true,
      onOffer: false,
    },
    {
      name: 'Embroidered Silk Kurti — Crimson',
      description:
        'Rich art silk kurti with intricate thread embroidery at the neckline and sleeves. Pair with churidar and dupatta for a complete ethnic look for festivals and family gatherings.',
      price: 2299,
      comparePrice: 2800,
      images: [
        'https://picsum.photos/seed/sb-anarkali-ethnic/600/800',
        'https://picsum.photos/seed/sb-saree-party/600/800',
      ],
      categoryId: kurtis.id,
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      colors: ['Crimson', 'Gold'],
      fabric: 'Art Silk',
      occasion: ['festival', 'party'],
      stock: 18,
      featured: true,
      bestSeller: false,
      onOffer: true,
      offerPercent: 18,
    },
    {
      name: 'Straight Fit Kurti — Lavender',
      description:
        'Clean straight-cut kurti in soft lavender georgette. Easy to style with jeans, leggings, or palazzos. The subtle sheen makes it suitable for both casual outings and evening wear.',
      price: 699,
      comparePrice: null,
      images: [
        'https://picsum.photos/seed/sb-palazzo-set/600/800',
      ],
      categoryId: kurtis.id,
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      colors: ['Lavender'],
      fabric: 'Georgette',
      occasion: ['casual'],
      stock: 50,
      featured: false,
      bestSeller: false,
      onOffer: false,
    },
    {
      name: 'Mirror Work Kurti — Deep Teal',
      description:
        'Vibrant kurti with traditional mirror work embellishments inspired by Rajasthani craft. The tiny mirrors catch light beautifully. Pairs with wide-leg palazzos or straight pants.',
      price: 1299,
      comparePrice: 1600,
      images: [
        'https://picsum.photos/seed/sb-jewel-temple/600/800',
        'https://picsum.photos/seed/sb-blouse-embroid/600/800',
      ],
      categoryId: kurtis.id,
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['Teal', 'Multicolor'],
      fabric: 'Cotton',
      occasion: ['festival', 'casual'],
      stock: 22,
      featured: true,
      bestSeller: true,
      onOffer: true,
      offerPercent: 19,
    },
    {
      name: 'Kurta Set with Dupatta — Mustard Yellow',
      description:
        'Three-piece kurta set in mustard yellow cotton. Includes a straight-fit kurta, matching palazzo, and a complementary printed dupatta. Ready-to-wear festive look.',
      price: 1899,
      comparePrice: 2400,
      images: [
        'https://picsum.photos/seed/sb-salwar-print/600/800',
        'https://picsum.photos/seed/sb-palazzo-set/600/800',
      ],
      categoryId: kurtis.id,
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      colors: ['Mustard Yellow', 'Orange'],
      fabric: 'Cotton',
      occasion: ['festival', 'casual'],
      stock: 28,
      featured: true,
      bestSeller: true,
      onOffer: true,
      offerPercent: 21,
    },
    {
      name: 'Lucknowi Chikankari Kurti — Ivory',
      description:
        'Exquisite hand-embroidered Chikankari kurti from Lucknow in pure white cotton. Each piece is embroidered by skilled artisans using 36 types of Chikankari stitches. Timeless and elegant.',
      price: 3200,
      comparePrice: 4000,
      images: [
        'https://picsum.photos/seed/sb-saree-party/600/800',
        'https://picsum.photos/seed/sb-kurti-cotton/600/800',
      ],
      categoryId: kurtis.id,
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      colors: ['Ivory', 'White'],
      fabric: 'Cotton',
      occasion: ['casual', 'festival', 'party'],
      stock: 16,
      featured: true,
      bestSeller: true,
      onOffer: false,
    },
    // ── Lehengas (4) ────────────────────────────────────────────────────────
    {
      name: 'Bridal Lehenga — Scarlet Red',
      description:
        'Heavily embroidered bridal lehenga in scarlet red with intricate gold zari work and resham embroidery. Set includes a flared skirt, padded blouse, and matching net dupatta with scalloped border. A dream for the modern bride.',
      price: 28000,
      comparePrice: 35000,
      images: [
        'https://picsum.photos/seed/sb-lehenga-bridal/600/800',
        'https://picsum.photos/seed/sb-silk-saree/600/800',
        'https://picsum.photos/seed/sb-saree-party/600/800',
      ],
      categoryId: lehengas.id,
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['Scarlet Red', 'Gold'],
      fabric: 'Velvet & Silk',
      occasion: ['wedding'],
      stock: 5,
      featured: true,
      bestSeller: true,
      onOffer: true,
      offerPercent: 20,
    },
    {
      name: 'Festive Lehenga — Powder Blue',
      description:
        'Light-weight festive lehenga with delicate floral embroidery in powder blue. Perfect for mehendi and haldi ceremonies. The flowing net skirt adds a fairy-tale charm.',
      price: 8500,
      comparePrice: 10000,
      images: [
        'https://picsum.photos/seed/sb-anarkali-ethnic/600/800',
        'https://picsum.photos/seed/sb-saree-blue/600/800',
      ],
      categoryId: lehengas.id,
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      colors: ['Powder Blue', 'White'],
      fabric: 'Net & Satin',
      occasion: ['wedding', 'festival'],
      stock: 10,
      featured: true,
      bestSeller: false,
      onOffer: false,
    },
    {
      name: 'Party Lehenga — Rose Gold',
      description:
        'Shimmer party lehenga in rose gold with all-over sequin work. A head-turner at cocktail parties, receptions, and New Year bashes. The flared silhouette ensures maximum floor coverage.',
      price: 5500,
      comparePrice: 6500,
      images: [
        'https://picsum.photos/seed/sb-salwar-print/600/800',
        'https://picsum.photos/seed/sb-palazzo-set/600/800',
      ],
      categoryId: lehengas.id,
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['Rose Gold'],
      fabric: 'Sequin Georgette',
      occasion: ['party'],
      stock: 8,
      featured: true,
      bestSeller: true,
      onOffer: true,
      offerPercent: 15,
    },
    {
      name: 'Indo-Western Lehenga — Sage Green',
      description:
        'Contemporary indo-western lehenga in sage green with a crop top blouse and asymmetric hem. The modern silhouette meets traditional craftsmanship in this versatile piece for sangeet and pre-wedding functions.',
      price: 6800,
      comparePrice: 8500,
      images: [
        'https://picsum.photos/seed/sb-blouse-embroid/600/800',
        'https://picsum.photos/seed/sb-jewel-temple/600/800',
      ],
      categoryId: lehengas.id,
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['Sage Green', 'Gold'],
      fabric: 'Georgette & Net',
      occasion: ['wedding', 'party'],
      stock: 7,
      featured: true,
      bestSeller: false,
      onOffer: true,
      offerPercent: 20,
    },
    // ── Blouses (3) ─────────────────────────────────────────────────────────
    {
      name: 'Zardozi Blouse — Ivory',
      description:
        'Exquisite zardozi embroidery blouse in ivory silk. Each blouse is handcrafted and takes 3–4 days to embroider. Pairs beautifully with any silk or chiffon saree.',
      price: 1800,
      comparePrice: 2200,
      images: [
        'https://picsum.photos/seed/sb-blouse-embroid/600/800',
        'https://picsum.photos/seed/sb-jewel-temple/600/800',
      ],
      categoryId: blouses.id,
      sizes: ['XS', 'S', 'M', 'L', 'XL'],
      colors: ['Ivory', 'Gold'],
      fabric: 'Silk',
      occasion: ['wedding', 'festival'],
      stock: 15,
      featured: false,
      bestSeller: true,
      onOffer: true,
      offerPercent: 18,
    },
    {
      name: 'Backless Designer Blouse — Navy',
      description:
        'Trendy backless blouse in navy velvet with pearl button detailing at the back. Adds a contemporary touch to traditional silk sarees. Fully lined for comfort.',
      price: 1200,
      comparePrice: null,
      images: [
        'https://picsum.photos/seed/sb-palazzo-set/600/800',
      ],
      categoryId: blouses.id,
      sizes: ['XS', 'S', 'M', 'L', 'XL'],
      colors: ['Navy Blue'],
      fabric: 'Velvet',
      occasion: ['party'],
      stock: 20,
      featured: false,
      bestSeller: false,
      onOffer: false,
    },
    {
      name: 'Patchwork Cotton Blouse — Multicolor',
      description:
        'Vibrant patchwork blouse handcrafted from vintage cotton fabrics sourced across Rajasthan. Every piece is truly one-of-a-kind, making you stand out at casual meets and artistic events.',
      price: 950,
      comparePrice: 1200,
      images: [
        'https://picsum.photos/seed/sb-anarkali-ethnic/600/800',
      ],
      categoryId: blouses.id,
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['Multicolor'],
      fabric: 'Cotton',
      occasion: ['casual', 'festival'],
      stock: 12,
      featured: false,
      bestSeller: true,
      onOffer: true,
      offerPercent: 21,
    },
    // ── Dupattas (3) ────────────────────────────────────────────────────────
    {
      name: 'Chikankari Dupatta — Powder White',
      description:
        'Hand-embroidered chikankari dupatta in pristine white georgette from Lucknow. The delicate shadow work adds a timeless charm to any kurti or suit. Dry clean recommended.',
      price: 1200,
      comparePrice: 1500,
      images: [
        'https://picsum.photos/seed/sb-saree-blue/600/800',
        'https://picsum.photos/seed/sb-salwar-print/600/800',
      ],
      categoryId: dupattas.id,
      sizes: ['Free Size'],
      colors: ['White', 'Ivory'],
      fabric: 'Georgette',
      occasion: ['festival', 'wedding'],
      stock: 30,
      featured: true,
      bestSeller: true,
      onOffer: true,
      offerPercent: 20,
    },
    {
      name: 'Bandhani Dupatta — Sunset Orange',
      description:
        'Vibrant bandhani tie-dye dupatta in warm sunset orange from Kutch, Gujarat. The traditional resist-dye technique creates a distinctive spotted pattern. A burst of colour for any festive outfit.',
      price: 750,
      comparePrice: null,
      images: [
        'https://picsum.photos/seed/sb-saree-party/600/800',
      ],
      categoryId: dupattas.id,
      sizes: ['Free Size'],
      colors: ['Orange', 'Pink'],
      fabric: 'Cotton',
      occasion: ['festival', 'casual'],
      stock: 40,
      featured: false,
      bestSeller: false,
      onOffer: false,
    },
    {
      name: 'Phulkari Embroidered Dupatta — Royal Blue',
      description:
        'Traditional Phulkari dupatta from Punjab with vibrant floral embroidery in silk thread on a royal blue base. Phulkari literally means "flower work" and is one of India\'s most celebrated textile traditions.',
      price: 1500,
      comparePrice: 1800,
      images: [
        'https://picsum.photos/seed/sb-blouse-embroid/600/800',
        'https://picsum.photos/seed/sb-anarkali-ethnic/600/800',
      ],
      categoryId: dupattas.id,
      sizes: ['Free Size'],
      colors: ['Royal Blue', 'Multicolor'],
      fabric: 'Cotton with Silk Embroidery',
      occasion: ['festival', 'wedding', 'casual'],
      stock: 22,
      featured: true,
      bestSeller: true,
      onOffer: true,
      offerPercent: 17,
    },
    // ── Accessories (3) ─────────────────────────────────────────────────────
    {
      name: 'Temple Jewellery Set — Antique Gold',
      description:
        'Traditional South Indian temple jewellery set including necklace, jhumka earrings, and maang tikka. Made with gold-plated brass and embellished with ruby-red and emerald-green stones. Perfect for bridal and festive occasions.',
      price: 3200,
      comparePrice: 4000,
      images: [
        'https://picsum.photos/seed/sb-jewel-temple/600/800',
        'https://picsum.photos/seed/sb-palazzo-set/600/800',
      ],
      categoryId: accessories.id,
      sizes: ['Free Size'],
      colors: ['Antique Gold'],
      fabric: null,
      occasion: ['wedding', 'festival'],
      stock: 20,
      featured: true,
      bestSeller: true,
      onOffer: true,
      offerPercent: 20,
    },
    {
      name: 'Silk Potli Bag — Bottle Green',
      description:
        'Hand-embroidered silk potli bag with golden drawstring. The perfect ethnic accessory to complete your traditional outfit. Large enough to hold phone, cards, and essentials.',
      price: 599,
      comparePrice: 799,
      images: [
        'https://picsum.photos/seed/sb-lehenga-bridal/600/800',
      ],
      categoryId: accessories.id,
      sizes: ['Free Size'],
      colors: ['Bottle Green', 'Gold'],
      fabric: 'Silk',
      occasion: ['wedding', 'festival', 'party'],
      stock: 35,
      featured: false,
      bestSeller: false,
      onOffer: true,
      offerPercent: 25,
    },
    {
      name: 'Oxidised Silver Jewellery Set — Boho',
      description:
        'Statement oxidised silver jewellery set with jhumka earrings, layered necklace, and hand harness. The bohemian style complements printed kurtis, anarkalis, and cotton sarees beautifully.',
      price: 1800,
      comparePrice: 2200,
      images: [
        'https://picsum.photos/seed/sb-silk-saree/600/800',
        'https://picsum.photos/seed/sb-saree-blue/600/800',
      ],
      categoryId: accessories.id,
      sizes: ['Free Size'],
      colors: ['Oxidised Silver'],
      fabric: null,
      occasion: ['casual', 'festival'],
      stock: 25,
      featured: true,
      bestSeller: true,
      onOffer: false,
    },
    // ── Palazzo Sets (3) ────────────────────────────────────────────────────
    {
      name: 'Printed Palazzo Set — Coral Pink',
      description:
        'Breezy three-piece palazzo set in coral pink with an all-over floral print. Includes a short kurti, wide-leg palazzos, and matching dupatta. Ideal for summer festivals and family functions.',
      price: 1499,
      comparePrice: 1899,
      images: [
        'https://picsum.photos/seed/sb-palazzo-set/600/800',
        'https://picsum.photos/seed/sb-salwar-print/600/800',
      ],
      categoryId: palazzos.id,
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      colors: ['Coral Pink', 'White'],
      fabric: 'Rayon',
      occasion: ['festival', 'casual'],
      stock: 35,
      featured: true,
      bestSeller: true,
      onOffer: true,
      offerPercent: 21,
    },
    {
      name: 'Solid Crepe Palazzo Set — Midnight Navy',
      description:
        'Sophisticated solid crepe palazzo set in midnight navy. The straight-cut kurti and wide-leg palazzos create an elongated silhouette. Perfect for office wear and semi-formal occasions.',
      price: 1299,
      comparePrice: null,
      images: [
        'https://picsum.photos/seed/sb-anarkali-ethnic/600/800',
      ],
      categoryId: palazzos.id,
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      colors: ['Midnight Navy'],
      fabric: 'Crepe',
      occasion: ['casual'],
      stock: 30,
      featured: false,
      bestSeller: false,
      onOffer: false,
    },
    {
      name: 'Embroidered Palazzo Set — Peach',
      description:
        'Elegant palazzo set in soft peach with gota patti embroidery on the neckline and hem. The set includes a long kurta and matching palazzo. A perfect festive outfit that transitions from day to evening effortlessly.',
      price: 2200,
      comparePrice: 2800,
      images: [
        'https://picsum.photos/seed/sb-saree-party/600/800',
        'https://picsum.photos/seed/sb-blouse-embroid/600/800',
      ],
      categoryId: palazzos.id,
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      colors: ['Peach', 'Gold'],
      fabric: 'Georgette',
      occasion: ['festival', 'party'],
      stock: 20,
      featured: true,
      bestSeller: true,
      onOffer: true,
      offerPercent: 21,
    },
    // ── Anarkalis (3) ───────────────────────────────────────────────────────
    {
      name: 'Floor-Length Anarkali — Burgundy',
      description:
        'Regal floor-length anarkali suit in deep burgundy silk. The full circular flare creates a dramatic silhouette. Comes with matching churidar and a contrasting dupatta. A showstopper for festive occasions.',
      price: 4500,
      comparePrice: 5500,
      images: [
        'https://picsum.photos/seed/sb-lehenga-bridal/600/800',
        'https://picsum.photos/seed/sb-silk-saree/600/800',
      ],
      categoryId: anarkalis.id,
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      colors: ['Burgundy', 'Gold'],
      fabric: 'Art Silk',
      occasion: ['wedding', 'festival', 'party'],
      stock: 14,
      featured: true,
      bestSeller: true,
      onOffer: true,
      offerPercent: 18,
    },
    {
      name: 'Embroidered Net Anarkali — Mint Green',
      description:
        'Flowy net anarkali in refreshing mint green with floral embroidery and sequin accents. The light fabric makes it ideal for summer weddings and outdoor functions. Comes with a slip inner layer.',
      price: 3800,
      comparePrice: 4500,
      images: [
        'https://picsum.photos/seed/sb-saree-blue/600/800',
        'https://picsum.photos/seed/sb-kurti-cotton/600/800',
      ],
      categoryId: anarkalis.id,
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['Mint Green', 'Silver'],
      fabric: 'Net & Georgette',
      occasion: ['wedding', 'festival'],
      stock: 12,
      featured: true,
      bestSeller: false,
      onOffer: true,
      offerPercent: 16,
    },
    {
      name: 'Cotton Anarkali — Floral Peach',
      description:
        'Relaxed floor-length anarkali kurti in soft peach cotton with an all-over floral print. The comfortable fit and breathable fabric make it a festive favourite that you can wear all day.',
      price: 1599,
      comparePrice: 2000,
      images: [
        'https://picsum.photos/seed/sb-jewel-temple/600/800',
        'https://picsum.photos/seed/sb-salwar-print/600/800',
      ],
      categoryId: anarkalis.id,
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      colors: ['Peach', 'White'],
      fabric: 'Rayon',
      occasion: ['festival', 'casual'],
      stock: 30,
      featured: false,
      bestSeller: true,
      onOffer: true,
      offerPercent: 20,
    },
    // ── Salwar Suits (2) ────────────────────────────────────────────────────
    {
      name: 'Patiala Salwar Suit — Turquoise',
      description:
        'Traditional Patiala salwar suit in vibrant turquoise with intricate phulkari embroidery. The gathered salwar paired with a straight kurta creates a comfortable and stylish silhouette loved in North India.',
      price: 2800,
      comparePrice: 3500,
      images: [
        'https://picsum.photos/seed/sb-saree-party/600/800',
        'https://picsum.photos/seed/sb-palazzo-set/600/800',
      ],
      categoryId: salwars.id,
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      colors: ['Turquoise', 'Multicolor'],
      fabric: 'Cotton',
      occasion: ['festival', 'casual'],
      stock: 25,
      featured: false,
      bestSeller: true,
      onOffer: true,
      offerPercent: 20,
    },
    {
      name: 'Straight-Cut Salwar Suit — Ivory',
      description:
        'Elegant straight-cut salwar suit in ivory georgette with subtle gold embroidery at the neckline. The classic silhouette is perfect for office wear, lunch meetings, and casual social events.',
      price: 1900,
      comparePrice: 2400,
      images: [
        'https://picsum.photos/seed/sb-anarkali-ethnic/600/800',
        'https://picsum.photos/seed/sb-blouse-embroid/600/800',
      ],
      categoryId: salwars.id,
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      colors: ['Ivory', 'Gold'],
      fabric: 'Georgette',
      occasion: ['casual', 'festival'],
      stock: 20,
      featured: true,
      bestSeller: false,
      onOffer: true,
      offerPercent: 21,
    },
  ];

  const createdProducts: string[] = [];
  for (const product of products) {
    const slug = slugify(product.name, { lower: true, strict: true });
    const p = await prisma.product.upsert({
      where: { slug },
      update: {},
      create: { ...product, slug },
    });
    createdProducts.push(p.id);
  }

  // ── Coupons (10) ────────────────────────────────────────────────────────────
  const coupons = [
    { code: 'WELCOME10', discount: 10, minOrder: 500, maxUses: 1000, active: true },
    { code: 'SRINIDHI20', discount: 20, minOrder: 2000, maxUses: 500, active: true },
    { code: 'FESTIVE30', discount: 30, minOrder: 5000, maxUses: 200, active: true },
    { code: 'FLAT15', discount: 15, minOrder: 1000, maxUses: null, active: true },
    { code: 'SAREE15', discount: 15, minOrder: 1500, maxUses: 300, active: true },
    { code: 'WEDDING25', discount: 25, minOrder: 8000, maxUses: 100, active: true },
    { code: 'MONSOON10', discount: 10, minOrder: 0, maxUses: 500, active: true },
    { code: 'NEWLOOK20', discount: 20, minOrder: 1500, maxUses: 250, active: true },
    { code: 'HYDERABAD15', discount: 15, minOrder: 1000, maxUses: 400, active: true },
    { code: 'DIWALI30', discount: 30, minOrder: 3000, maxUses: 150, active: false },
  ];
  for (const coupon of coupons) {
    await prisma.coupon.upsert({
      where: { code: coupon.code },
      update: {},
      create: coupon,
    });
  }

  // ── Sample Reviews ──────────────────────────────────────────────────────────
  // Reviews for the first 5 products (sarees + first kurti)
  const reviewData = [
    {
      productIdx: 0,
      customerName: 'Priya Sharma',
      rating: 5,
      title: 'Absolutely stunning saree!',
      body: 'The quality of this Kanjivaram saree is exceptional. My mother wore it to my brother\'s wedding and received so many compliments. The zari work is intricate and the silk is genuinely pure. Worth every rupee.',
    },
    {
      productIdx: 0,
      customerName: 'Deepa Krishnamurthy',
      rating: 4,
      title: 'Beautiful but slightly heavy',
      body: 'The saree is gorgeous — the maroon colour is rich and the gold border is stunning. Slightly on the heavier side as expected with pure Kanjivaram. Delivered promptly and packaged beautifully.',
    },
    {
      productIdx: 1,
      customerName: 'Ananya Reddy',
      rating: 5,
      title: 'Perfect for Diwali!',
      body: 'Wore this for Diwali and I got so many compliments. The royal blue colour is exactly as shown in the photos. Lightweight and comfortable to wear all day. Will definitely buy again.',
    },
    {
      productIdx: 2,
      customerName: 'Meghna Iyer',
      rating: 5,
      title: 'My everyday go-to saree',
      body: 'Finally found the perfect cotton saree for daily wear. The pastel pink is soothing, the handloom texture is beautiful, and it drapes very well. Machine washable is a huge bonus!',
    },
    {
      productIdx: 5,
      customerName: 'Kavitha Nair',
      rating: 5,
      title: 'Dreamy for any occasion',
      body: 'The organza saree in dusty rose is like wearing a cloud. I wore it to a family function and the applique work on the border got everyone\'s attention. Packaging was premium — felt like a real luxury brand.',
    },
    {
      productIdx: 8,
      customerName: 'Rashmi Patel',
      rating: 4,
      title: 'Great block print quality',
      body: 'The indigo block print is crisp and even — you can tell it\'s genuinely hand-printed. I paired it with white palazzos and it looked super chic. Washed well without fading. Highly recommend for summer.',
    },
    {
      productIdx: 11,
      customerName: 'Shalini Verma',
      rating: 5,
      title: 'Mirror work is divine',
      body: 'This teal kurti is absolutely beautiful. The mirror work catches light wonderfully. Wore it for a mehendi ceremony and felt like a queen. The cotton is soft and breathable. Will buy more from Srinidhi Boutique.',
    },
    {
      productIdx: 16,
      customerName: 'Nandini Bose',
      rating: 5,
      title: 'Bridal dream come true',
      body: 'This is the most beautiful lehenga I\'ve ever worn. The embroidery detail is extraordinary — I could spend hours looking at the zari work. The fit is perfect and it photographs beautifully. Srinidhi Boutique made my wedding day extra special.',
    },
  ];

  for (const review of reviewData) {
    const productId = createdProducts[review.productIdx];
    if (productId) {
      await prisma.review.create({
        data: {
          productId,
          customerName: review.customerName,
          rating: review.rating,
          title: review.title,
          body: review.body,
          approved: true,
        },
      });
    }
  }

  // ── Lookbook Entries ────────────────────────────────────────────────────────
  const lookbookEntries = [
    {
      title: 'Bridal Trousseau Essentials 2026',
      description:
        'A curated selection of must-have pieces for the modern Indian bride. From the wedding day lehenga to the honeymoon saree, we have everything you need for your trousseau.',
      image: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=800&h=600&fit=crop',
      productIds: createdProducts.slice(0, 3),
      active: true,
    },
    {
      title: 'Festival Ready — Diwali 2026',
      description:
        'Light up your festive wardrobe with our handpicked Diwali collection. From silk sarees to embroidered kurtis, these pieces are made to make you shine.',
      image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&h=600&fit=crop',
      productIds: createdProducts.slice(1, 5),
      active: true,
    },
    {
      title: 'Office to Evening — Effortless Transitions',
      description:
        'Look polished at work and stunning at dinner with these versatile pieces. Cotton kurtis and linen sarees that carry you seamlessly from desk to dinner.',
      image: 'https://images.unsplash.com/photo-1594938298603-c8148c4b4357?w=800&h=600&fit=crop',
      productIds: createdProducts.slice(8, 12),
      active: true,
    },
    {
      title: 'Handloom Heritage — Weaves of India',
      description:
        'Celebrate India\'s rich textile heritage with our handloom edit. Kanjivaram, Patola, Sambalpuri, and Chikankari — each piece tells a story of skilled craftsmanship.',
      image: 'https://images.unsplash.com/photo-1615886815628-f99dd3a6c3c7?w=800&h=600&fit=crop',
      productIds: [createdProducts[0], createdProducts[6], createdProducts[7]].filter(Boolean),
      active: true,
    },
  ];

  for (const entry of lookbookEntries) {
    await prisma.lookbook.create({ data: entry });
  }

  // ── Collections ─────────────────────────────────────────────────────────────
  const collections = [
    {
      name: 'Wedding Season 2026',
      slug: 'wedding-season-2026',
      description: 'The finest ethnic wear for every wedding function — from mehendi to reception.',
      image: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=800&h=400&fit=crop',
      active: true,
      featured: true,
    },
    {
      name: 'Festival Favourites',
      slug: 'festival-favourites',
      description: 'Handpicked pieces to make you the best-dressed at every festival.',
      image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&h=400&fit=crop',
      active: true,
      featured: true,
    },
    {
      name: 'Daily Wear Elegance',
      slug: 'daily-wear-elegance',
      description: 'Comfortable, stylish ethnic wear for everyday life.',
      image: 'https://images.unsplash.com/photo-1594938298603-c8148c4b4357?w=800&h=400&fit=crop',
      active: true,
      featured: false,
    },
  ];

  for (const collection of collections) {
    await prisma.collection.upsert({
      where: { slug: collection.slug },
      update: {},
      create: collection,
    });
  }

  console.log(
    `Seeded: 9 categories, ${products.length} products, ${coupons.length} coupons, ${reviewData.length} reviews, ${lookbookEntries.length} lookbook entries, ${collections.length} collections`,
  );
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
