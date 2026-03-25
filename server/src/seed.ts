import { PrismaClient } from '@prisma/client';
import slugify from 'slugify';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'sarees' },
      update: {},
      create: {
        name: 'Sarees',
        slug: 'sarees',
        image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'kurtis' },
      update: {},
      create: {
        name: 'Kurtis',
        slug: 'kurtis',
        image: 'https://images.unsplash.com/photo-1583391733981-8498408ee4b6?w=400',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'lehengas' },
      update: {},
      create: {
        name: 'Lehengas',
        slug: 'lehengas',
        image: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=400',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'blouses' },
      update: {},
      create: {
        name: 'Blouses',
        slug: 'blouses',
        image: 'https://images.unsplash.com/photo-1564584217132-2271feaeb3c5?w=400',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'accessories' },
      update: {},
      create: {
        name: 'Accessories',
        slug: 'accessories',
        image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400',
      },
    }),
  ]);

  const [sarees, kurtis, lehengas, blouses, accessories] = categories;

  const products = [
    // ─── Sarees ───────────────────────────────────────────────────────────────
    {
      name: 'Banarasi Silk Saree — Rani Pink',
      description: 'Exquisite Banarasi pure silk saree featuring heavy gold zari weaving across the entire body and a rich ornate pallu. Crafted by master weavers in Varanasi using centuries-old pit-loom technique, this saree is the ultimate choice for weddings, receptions, and festive celebrations. The vibrant Rani Pink hue with gold accents exudes regal elegance. Comes with an unstitched blouse piece. Dry clean only; store in a muslin cloth to preserve the zari.',
      price: 8999,
      comparePrice: 11500,
      images: [
        'https://picsum.photos/seed/banarasi-silk-pink/600/800',
        'https://picsum.photos/seed/banarasi-silk-pink-2/600/800',
      ],
      categoryId: sarees.id,
      sizes: ['Free Size'],
      colors: ['Rani Pink', 'Gold'],
      fabric: 'Pure Banarasi Silk',
      occasion: ['wedding', 'festival'],
      stock: 10,
      featured: true,
      bestSeller: true,
      onOffer: true,
      offerPercent: 22,
    },
    {
      name: 'Kanjeevaram Pure Silk Saree — Royal Blue',
      description: 'Authentic Kanjeevaram pure silk saree handwoven in Kanchipuram with traditional temple border (Korvai technique) and contrast gold pallu. The rich Royal Blue with intricate peacock motifs and gold zari is a timeless heirloom piece worn by generations of South Indian brides. This saree features 2-ply pure mulberry silk making it heavy, lustrous, and incredibly durable. Comes with a matching blouse piece. Dry clean recommended; avoid direct sunlight.',
      price: 12500,
      comparePrice: 16000,
      images: [
        'https://picsum.photos/seed/kanjivaram-blue/600/800',
        'https://picsum.photos/seed/kanjivaram-blue-2/600/800',
      ],
      categoryId: sarees.id,
      sizes: ['Free Size'],
      colors: ['Royal Blue', 'Gold'],
      fabric: 'Pure Kanjeevaram Silk',
      occasion: ['wedding', 'festival'],
      stock: 6,
      featured: true,
      bestSeller: true,
      onOffer: false,
    },
    {
      name: 'Chanderi Cotton Saree — Ivory',
      description: 'Elegant handwoven Chanderi cotton saree from Madhya Pradesh featuring delicate silver zari border and subtle butis (motifs) woven throughout. Chanderi fabric is celebrated for its sheer, lightweight texture and natural sheen — it drapes beautifully and keeps you cool in summer. Ivory with silver is a classic combination perfect for office wear, casual outings, and day functions. Machine wash gentle; iron on low heat.',
      price: 3499,
      comparePrice: null,
      images: [
        'https://picsum.photos/seed/chanderi-ivory/600/800',
        'https://picsum.photos/seed/chanderi-ivory-2/600/800',
      ],
      categoryId: sarees.id,
      sizes: ['Free Size'],
      colors: ['Ivory', 'Silver'],
      fabric: 'Chanderi Cotton Silk',
      occasion: ['casual', 'office'],
      stock: 22,
      featured: false,
      bestSeller: true,
      onOffer: false,
    },
    {
      name: 'Organza Floral Saree — Dusty Rose',
      description: 'Trendy organza saree in a romantic Dusty Rose shade with delicate 3D floral appliqué work scattered across the body and a scalloped sequin border. Organza is the hottest fabric in ethnic fashion right now — it is lightweight, has a subtle sheen, and photographs beautifully. Perfect for cocktail parties, sangeet nights, and festive gatherings. Pair with a contrast deep wine or navy blouse for a show-stopping look. Dry clean only.',
      price: 4999,
      comparePrice: 6200,
      images: [
        'https://picsum.photos/seed/organza-rose/600/800',
        'https://picsum.photos/seed/organza-rose-2/600/800',
      ],
      categoryId: sarees.id,
      sizes: ['Free Size'],
      colors: ['Dusty Rose', 'Gold'],
      fabric: 'Pure Organza',
      occasion: ['party', 'festival'],
      stock: 14,
      featured: true,
      bestSeller: false,
      onOffer: true,
      offerPercent: 19,
    },
    {
      name: 'Patola Double Ikat Silk Saree — Vibrant Red',
      description: 'Rare and precious Patola saree from Patan, Gujarat — one of the most labour-intensive handlooms in the world where both the warp and weft threads are resist-dyed (double ikat) before weaving. The geometric patterns in vibrant red, green, and white are entirely woven, not printed. Each Patola saree takes skilled artisans several months to complete, making it a collector\'s heirloom. Perfect for weddings and cultural ceremonies where you want to make a statement. Store in silk pouch; dry clean only.',
      price: 15999,
      comparePrice: 20000,
      images: [
        'https://picsum.photos/seed/patola-red/600/800',
        'https://picsum.photos/seed/patola-red-2/600/800',
      ],
      categoryId: sarees.id,
      sizes: ['Free Size'],
      colors: ['Vibrant Red', 'Multicolor'],
      fabric: 'Pure Silk Double Ikat',
      occasion: ['wedding', 'festival'],
      stock: 4,
      featured: true,
      bestSeller: false,
      onOffer: true,
      offerPercent: 20,
    },

    // ─── Kurtis ───────────────────────────────────────────────────────────────
    {
      name: 'Chikankari Lucknowi Kurti — White',
      description: 'Authentic Lucknowi Chikankari kurti featuring delicate hand-embroidery by master artisans from Uttar Pradesh. Chikankari is a centuries-old craft characterised by fine shadow-work, phanda, and murri stitches in white thread on white fabric — creating a subtle and breathable elegance. Made from soft cotton fabric, this kurti is ideal for daily wear, office, and casual functions throughout the year. Pair with palazzos, cigarette pants, or churidars. Gentle machine wash; do not bleach.',
      price: 1899,
      comparePrice: 2400,
      images: [
        'https://picsum.photos/seed/chikankari-white/600/800',
        'https://picsum.photos/seed/chikankari-white-2/600/800',
      ],
      categoryId: kurtis.id,
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      colors: ['White', 'Off-White'],
      fabric: 'Cotton (Hand Embroidered Chikankari)',
      occasion: ['casual', 'office'],
      stock: 30,
      featured: true,
      bestSeller: true,
      onOffer: true,
      offerPercent: 21,
    },
    {
      name: 'Cotton Anarkali Kurti — Teal',
      description: 'Breezy floor-length Anarkali kurti in a refreshing teal with subtle block-printed floral motifs along the hem and yoke. Made from pure soft cotton, this kurti is incredibly comfortable and breathable — perfect for long days, outings, and casual festive gatherings. The flared Anarkali silhouette flatters all body types. Comes as a set with matching cotton printed leggings. Machine wash cold; iron on reverse side.',
      price: 1299,
      comparePrice: null,
      images: [
        'https://picsum.photos/seed/anarkali-teal/600/800',
        'https://picsum.photos/seed/anarkali-teal-2/600/800',
      ],
      categoryId: kurtis.id,
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      colors: ['Teal', 'Teal Green'],
      fabric: 'Pure Cotton',
      occasion: ['casual', 'festival'],
      stock: 40,
      featured: false,
      bestSeller: true,
      onOffer: false,
    },
    {
      name: 'Rayon Straight Kurti Set — Mustard',
      description: 'Smart and stylish straight-cut kurti in rich mustard yellow paired with a matching printed wide-leg palazzo — the perfect three-piece set when worn with the included dupatta. Crafted from premium soft rayon fabric with elegant printed borders and subtle embroidery at the neckline. This set is a complete ready-to-wear outfit, ideal for festivals, family gatherings, and office wear. Mustard is one of the top-selling colours this season. Gentle machine wash; tumble dry low.',
      price: 999,
      comparePrice: 1399,
      images: [
        'https://picsum.photos/seed/rayon-palazzo-mustard/600/800',
        'https://picsum.photos/seed/rayon-palazzo-mustard-2/600/800',
      ],
      categoryId: kurtis.id,
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      colors: ['Mustard', 'Golden Yellow'],
      fabric: 'Premium Rayon',
      occasion: ['casual', 'festival'],
      stock: 50,
      featured: false,
      bestSeller: false,
      onOffer: true,
      offerPercent: 29,
    },
    {
      name: 'Silk Blend A-Line Kurti — Maroon',
      description: 'Rich and festive silk blend A-line kurti in deep maroon with intricate thread and zardozi embroidery at the yoke, cuffs, and hemline. The A-line cut is flattering for all body types and creates an elegant silhouette. This kurti can be dressed up with heavy jewellery for weddings or styled simply with minimal accessories for evening events. Perfect for Diwali, Navratri, and family functions. Dry clean recommended to preserve the embroidery.',
      price: 2499,
      comparePrice: 3200,
      images: [
        'https://picsum.photos/seed/silk-aline-maroon/600/800',
        'https://picsum.photos/seed/silk-aline-maroon-2/600/800',
      ],
      categoryId: kurtis.id,
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      colors: ['Maroon', 'Deep Red'],
      fabric: 'Silk Blend with Thread Embroidery',
      occasion: ['festival', 'party'],
      stock: 20,
      featured: true,
      bestSeller: false,
      onOffer: true,
      offerPercent: 22,
    },

    // ─── Lehengas ─────────────────────────────────────────────────────────────
    {
      name: 'Bridal Lehenga Set — Scarlet Red',
      description: 'Breathtaking bridal lehenga set in regal scarlet red with heavy hand-done zardozi and resham embroidery covering the entire lehenga skirt. The three-piece set includes a heavily embroidered short blouse with back tie-up, a floor-length flared lehenga with can-can lining for volume, and a sheer dupatta with gold border. This is the dream lehenga for every Indian bride — designed to make you feel like royalty on your most special day. Custom sizing available; dry clean only.',
      price: 24999,
      comparePrice: 32000,
      images: [
        'https://picsum.photos/seed/bridal-lehenga-red/600/800',
        'https://picsum.photos/seed/bridal-lehenga-red-2/600/800',
      ],
      categoryId: lehengas.id,
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['Scarlet Red', 'Gold'],
      fabric: 'Velvet & Georgette with Zardozi Embroidery',
      occasion: ['wedding'],
      stock: 5,
      featured: true,
      bestSeller: true,
      onOffer: true,
      offerPercent: 22,
    },
    {
      name: 'Georgette Party Lehenga — Powder Blue',
      description: 'Graceful and lightweight georgette lehenga in a dreamy powder blue perfect for sangeet nights, mehendi functions, and reception parties. The skirt features elegant floral embroidery on the hemline while the short blouse has sequin detailing. The included dupatta is sheer organza with matching embroidered border. Georgette drapes beautifully and moves gracefully on the dance floor. This set is a popular choice for bridesmaids and wedding guests who want to look stunning without overshadowing the bride. Dry clean only.',
      price: 6999,
      comparePrice: 9000,
      images: [
        'https://picsum.photos/seed/georgette-lehenga-blue/600/800',
        'https://picsum.photos/seed/georgette-lehenga-blue-2/600/800',
      ],
      categoryId: lehengas.id,
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      colors: ['Powder Blue', 'White'],
      fabric: 'Premium Georgette with Embroidery',
      occasion: ['wedding', 'party'],
      stock: 12,
      featured: true,
      bestSeller: false,
      onOffer: true,
      offerPercent: 22,
    },
    {
      name: 'Cotton Chaniya Choli — Navratri Green',
      description: 'Vibrant and festive cotton Chaniya Choli set in a lively Navratri green with traditional Gujarati mirror work (abhla bharat) and colourful thread embroidery throughout the skirt. The three-piece set includes the flared chaniya (skirt), a matching short choli, and a vibrant dupatta with tassels. Designed specifically for Navratri Garba and Dandiya nights — the mirrors will catch the light as you dance! Cotton fabric ensures you stay comfortable through hours of festivities. Machine wash gentle.',
      price: 3999,
      comparePrice: 4999,
      images: [
        'https://picsum.photos/seed/chaniya-green/600/800',
        'https://picsum.photos/seed/chaniya-green-2/600/800',
      ],
      categoryId: lehengas.id,
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      colors: ['Navratri Green', 'Multicolor'],
      fabric: 'Pure Cotton with Mirror Work',
      occasion: ['festival'],
      stock: 18,
      featured: false,
      bestSeller: true,
      onOffer: true,
      offerPercent: 20,
    },

    // ─── Blouses ──────────────────────────────────────────────────────────────
    {
      name: 'Embroidered Silk Blouse — Ivory',
      description: 'Beautifully crafted pure silk blouse in warm ivory with intricate floral zardozi embroidery on the neckline, sleeves, and back. This blouse is a versatile piece that pairs elegantly with any saree — from silk to cotton to georgette. The three-quarter sleeves have delicate pearl button cuffs, and the back features a subtle low-cut with hook closure. An essential in every Indian woman\'s wardrobe. Sold as an unstitched piece with standard sizing guide included; tailoring service available. Dry clean only.',
      price: 1499,
      comparePrice: 1999,
      images: [
        'https://picsum.photos/seed/silk-blouse-ivory/600/800',
        'https://picsum.photos/seed/silk-blouse-ivory-2/600/800',
      ],
      categoryId: blouses.id,
      sizes: ['32', '34', '36', '38', '40', '42'],
      colors: ['Ivory', 'Cream'],
      fabric: 'Pure Silk with Zardozi Embroidery',
      occasion: ['wedding', 'festival'],
      stock: 20,
      featured: false,
      bestSeller: true,
      onOffer: true,
      offerPercent: 25,
    },
    {
      name: 'Ready-made Cotton Blouse — Maroon',
      description: 'Classic fully stitched ready-to-wear cotton blouse in deep maroon — no tailoring required, simply pick your size and wear. Features a traditional round neck, short sleeves, and hook-and-eye back closure. This is the perfect everyday blouse for cotton and linen sarees and is a bestseller for its simplicity, comfort, and value. The pre-shrunk cotton fabric is soft on skin and easy to maintain. Machine wash friendly; iron on medium heat. A must-have basic in every saree collection.',
      price: 699,
      comparePrice: null,
      images: [
        'https://picsum.photos/seed/cotton-blouse-maroon/600/800',
        'https://picsum.photos/seed/cotton-blouse-maroon-2/600/800',
      ],
      categoryId: blouses.id,
      sizes: ['32', '34', '36', '38', '40', '42'],
      colors: ['Maroon', 'Deep Red'],
      fabric: 'Pre-shrunk Cotton',
      occasion: ['casual', 'festival'],
      stock: 45,
      featured: false,
      bestSeller: false,
      onOffer: false,
    },
    {
      name: 'Designer Backless Blouse — Navy',
      description: 'Stunning contemporary designer blouse in deep navy velvet with a bold backless design featuring a decorative latkan (tassel) tie-up back. The front has a modest high neck with a small gold-button closure while the back creates a dramatic plunging open-back look. Perfect for modern saree lovers who want to blend tradition with fashion-forward styling. This blouse pairs beautifully with silk and georgette sarees in contrast colours. Sold stitched in standard sizes — a fashion-forward addition to your saree collection. Dry clean only.',
      price: 1999,
      comparePrice: 2600,
      images: [
        'https://picsum.photos/seed/backless-blouse-navy/600/800',
        'https://picsum.photos/seed/backless-blouse-navy-2/600/800',
      ],
      categoryId: blouses.id,
      sizes: ['32', '34', '36', '38', '40'],
      colors: ['Navy Blue', 'Midnight Blue'],
      fabric: 'Velvet',
      occasion: ['party', 'wedding'],
      stock: 15,
      featured: true,
      bestSeller: false,
      onOffer: true,
      offerPercent: 23,
    },
    {
      name: 'Sequin Work Party Blouse — Rose Gold',
      description: 'Glamorous fully stitched party blouse in rose gold with all-over sequin work that catches the light from every angle. Features a deep V-neck, sleeveless design with broad shoulder straps, and hook closure at the back. This blouse is the star of the show — pair it with a plain georgette or chiffon saree in deep wine, navy, or black and let the blouse do the talking. A favourite for cocktail parties, receptions, and New Year events. Dry clean only; store flat to avoid sequin damage.',
      price: 2499,
      comparePrice: 3200,
      images: [
        'https://picsum.photos/seed/sequin-blouse-rosegold/600/800',
        'https://picsum.photos/seed/sequin-blouse-rosegold-2/600/800',
      ],
      categoryId: blouses.id,
      sizes: ['32', '34', '36', '38', '40'],
      colors: ['Rose Gold', 'Gold'],
      fabric: 'Satin with All-Over Sequin Work',
      occasion: ['party', 'wedding'],
      stock: 12,
      featured: true,
      bestSeller: false,
      onOffer: true,
      offerPercent: 22,
    },

    // ─── Accessories ──────────────────────────────────────────────────────────
    {
      name: 'Kundan Necklace Set — Gold',
      description: 'Regal Kundan necklace set crafted using the traditional Rajasthani Kundan technique where 24-carat gold foil is set with glass gemstones to create stunning jewellery that rivals precious stones. The set includes a heavy statement necklace with five layers, matching long drop earrings, and a maang tikka. The stones are in rich red, green, and white — classic Kundan colours. Perfect for bridal wear, sangeet nights, and grand festive occasions. This is high-quality imitation jewellery finished to last years. Wipe clean with soft cloth; store in the box provided.',
      price: 2999,
      comparePrice: 3999,
      images: [
        'https://picsum.photos/seed/kundan-necklace/600/800',
        'https://picsum.photos/seed/kundan-necklace-2/600/800',
      ],
      categoryId: accessories.id,
      sizes: ['Free Size'],
      colors: ['Gold', 'Multicolor'],
      fabric: null,
      occasion: ['wedding', 'festival'],
      stock: 18,
      featured: true,
      bestSeller: true,
      onOffer: true,
      offerPercent: 25,
    },
    {
      name: 'Jhumka Earrings — Antique Gold',
      description: 'Classic and versatile antique gold jhumka earrings featuring a domed top with intricate filigree work and a swinging bell-shaped jhumki at the bottom with tiny hanging ghungroos. Jhumkas are a timeless Indian jewellery staple that complement every ethnic outfit — from simple cotton sarees to heavy bridal lehengas. The antique gold finish gives them a traditional, heritage look that is currently very on-trend. Nickel-free metal base; suitable for sensitive ears. Wipe with dry cloth after use.',
      price: 899,
      comparePrice: 1199,
      images: [
        'https://picsum.photos/seed/jhumka-gold/600/800',
        'https://picsum.photos/seed/jhumka-gold-2/600/800',
      ],
      categoryId: accessories.id,
      sizes: ['Free Size'],
      colors: ['Antique Gold'],
      fabric: null,
      occasion: ['wedding', 'festival', 'casual'],
      stock: 35,
      featured: false,
      bestSeller: true,
      onOffer: true,
      offerPercent: 25,
    },
    {
      name: 'Silk Dupatta — Rani Pink',
      description: 'Luxurious pure silk dupatta in vibrant Rani Pink with hand-woven gold zari border on all four sides and delicate fringe tassels. A well-chosen dupatta can transform any simple kurta or lehenga into a complete ethnic look. This dupatta is made from pure mulberry silk and has a beautiful natural sheen that catches the light. It can be draped over the shoulder, worn as a stole, or pinned as a traditional accessory. Versatile enough to be paired with multiple outfits. Dry clean only; store folded in muslin.',
      price: 1299,
      comparePrice: 1699,
      images: [
        'https://picsum.photos/seed/silk-dupatta-pink/600/800',
        'https://picsum.photos/seed/silk-dupatta-pink-2/600/800',
      ],
      categoryId: accessories.id,
      sizes: ['Free Size'],
      colors: ['Rani Pink', 'Gold'],
      fabric: 'Pure Silk with Zari Border',
      occasion: ['wedding', 'festival', 'party'],
      stock: 25,
      featured: false,
      bestSeller: false,
      onOffer: false,
    },
    {
      name: 'Kamarband Waist Chain — Gold',
      description: 'Stunning traditional kamarband (waist belt/chain) in antique gold finish with intricate floral meenakari work and dangling pearl-drop accents. The kamarband is an ancient Indian accessory traditionally worn with sarees and lehengas to define the waist and add an extra dimension of beauty to your look. This piece adjusts to fit all waist sizes from 26 to 38 inches using the hook-and-eye clasp. Worn by brides at weddings and dancers at classical performances — this is one accessory that makes an immediate impression. Wipe clean; store flat in the box.',
      price: 1499,
      comparePrice: 1999,
      images: [
        'https://picsum.photos/seed/kamarband-gold/600/800',
        'https://picsum.photos/seed/kamarband-gold-2/600/800',
      ],
      categoryId: accessories.id,
      sizes: ['Free Size'],
      colors: ['Antique Gold'],
      fabric: null,
      occasion: ['wedding', 'festival'],
      stock: 20,
      featured: true,
      bestSeller: false,
      onOffer: true,
      offerPercent: 25,
    },
  ];

  for (const product of products) {
    const slug = slugify(product.name, { lower: true, strict: true });
    await prisma.product.upsert({
      where: { slug },
      update: {},
      create: { ...product, slug },
    });
  }

  // Sample coupons
  await prisma.coupon.upsert({
    where: { code: 'WELCOME10' },
    update: {},
    create: {
      code: 'WELCOME10',
      discount: 10,
      minOrder: 500,
      maxUses: 1000,
      active: true,
    },
  });

  await prisma.coupon.upsert({
    where: { code: 'SRINIDHI20' },
    update: {},
    create: {
      code: 'SRINIDHI20',
      discount: 20,
      minOrder: 2000,
      maxUses: 500,
      active: true,
    },
  });

  await prisma.coupon.upsert({
    where: { code: 'FESTIVE20' },
    update: {},
    create: {
      code: 'FESTIVE20',
      discount: 20,
      minOrder: 2000,
      maxUses: 500,
      active: true,
    },
  });

  await prisma.coupon.upsert({
    where: { code: 'FLAT15' },
    update: {},
    create: {
      code: 'FLAT15',
      discount: 15,
      minOrder: 1000,
      active: true,
    },
  });

  console.log('Database seeded successfully!');
  console.log(`Created ${categories.length} categories and ${products.length} products`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
