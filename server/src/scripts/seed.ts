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
        'Pure Kanjivaram silk saree with intricate gold zari work, handwoven by master weavers in Kanchipuram — each piece takes up to 15 days to complete. The rich deep maroon base with contrasting gold border and pallu is a timeless bridal choice. Fabric: 100% pure mulberry silk with genuine gold zari. Comes with an unstitched matching blouse piece (0.8m). Wash care: Dry clean only — never machine wash; store wrapped in muslin cloth. Occasions: Weddings, Upanayanam, Namakarana, Diwali. Styling tip: Pair with a boat-neck or high-neck blouse and a temple jewellery set for a regal look. Stack gold bangles and keep hair in a classic bun.',
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
        'Elegant Banarasi georgette saree in rich royal blue with a subtle silver border and delicate floral bootis (motifs) woven throughout in silver zari. Lightweight yet richly textured — comfortable enough for all-day wear at festivals or family functions. Fabric: Banarasi georgette with silver zari weave. Includes unstitched blouse piece. Wash care: Dry clean recommended; gentle hand wash in cold water with mild detergent if needed — never wring or tumble dry. Occasions: Navratri, Diwali, Eid, family weddings, office parties. Styling tip: Pair with a silver-sequence blouse and CZ drop earrings. Let the pallu flow freely to showcase the zari work.',
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
        'Handwoven cotton saree in soft pastel pink, crafted by master weavers in Andhra Pradesh on traditional pit looms. The slightly textured weave gives it a natural, organic feel that gets softer with every wash. Fabric: 100% handloom cotton, lightweight and breathable — ideal for Hyderabad\'s warm climate. Wash care: Machine washable on gentle cycle in cold water; wash dark colours separately first; dry flat in shade. Occasions: Daily office wear, casual outings, college, lunch dates. Styling tip: Pair with a solid colour cotton blouse in contrasting ivory or coral. Add simple silver bangles and flat kolhapuri sandals for a relaxed, put-together look.',
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
        'Shimmery chiffon saree in vibrant emerald green with an all-over subtle shimmer, a sequin-embellished border, and a heavily sequined pallu that catches every light. A guaranteed showstopper at evening parties, receptions, and cocktail dinners. Fabric: Premium chiffon with sequin embellishments; fully lined inner layer for modesty. Pre-stitched pallu option available on request — WhatsApp us to arrange. Wash care: Dry clean only; sequin and embellished garments must not be machine washed. Occasions: Cocktail parties, sangeet, reception, New Year celebrations, anniversary dinners. Styling tip: Pair with a deep-neck or halter-neck blouse in matching emerald or contrasting black. Keep accessories minimal — statement earrings only. Gold strappy heels complete the look.',
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
        'Lightweight linen saree in warm earthy tan with a subtle herringbone texture woven from natural linen fibres. The understated sophistication of linen makes this perfect for working women who want to look polished without effort. Fabric: Pure linen — breathable, moisture-wicking, gets softer with each wash. Wrinkles are part of its character. Wash care: Hand wash or machine gentle cycle in cold water; air dry flat; iron on medium heat while slightly damp. Occasions: Office wear, casual outings, brunches, art galleries, travel. Styling tip: Pair with a crisp white linen blouse for a minimalist look, or a terracotta-print blouse for an earthy palette. Wooden or seed bead accessories and flat sandals complete this effortless aesthetic.',
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
        'Dreamy organza saree in dusty rose with hand-applied 3D floral applique work along the border and a lush embellished pallu. The crisp organza fabric holds its drape beautifully — structured yet ethereal. Lightweight and semi-transparent with a natural shimmer. Fabric: Pure organza silk with thread-embroidered applique flowers; unstitched blouse piece included. Wash care: Dry clean only — organza is delicate and can tear or lose shape with hand/machine washing. Occasions: Festive lunches, sangeet, mehendi, Onam, Navratri, cocktail parties. Styling tip: Let the floral border be the star — wear with a simple solid blouse in blush or gold. Delicate pearl jewelry or Polki earrings pair beautifully. Stilettos in nude or rose gold.',
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
        'Authentic double ikat Patola silk saree from Patan, Gujarat — one of India\'s most prized textile traditions. The intricate geometric pattern is created using a 700-year-old technique where both the warp and weft threads are individually tie-dyed before weaving, producing a perfectly mirror-image pattern on both sides of the fabric. Each saree takes 6–12 months to weave. A true collector\'s piece and a generational investment. Fabric: Pure Rajkot or Patan Patola silk — vibrant, naturally dyed. Wash care: Dry clean exclusively; store in a cool, dry place away from light; wrap in muslin. Occasions: Weddings, Betrothals, Navaratri, prestigious family events, gifting. Styling tip: Let the saree speak for itself. Wear with a simple silk blouse in one of the saree colours. Traditional gold jewellery is the only accompaniment this masterpiece needs.',
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
        'Handwoven Sambalpuri cotton saree from Odisha, created using the ancient bandha (ikat) resist-dyeing technique. The deep violet base with contrasting ivory-white geometric motifs and a traditional shankha (conch), chakra, and phula (flower) border is bold, graphic, and deeply rooted in Indian textile heritage. GI-tagged craft. Fabric: 100% handloom cotton, medium weight, comfortable in all seasons. Wash care: Hand wash separately in cold water (the deep violet may bleed in first 2 washes — this is normal); dry flat in shade. Occasions: Festive occasions, Onam, Durga Puja, Makar Sankranti, cultural events, ethnic day at office. Styling tip: Pair with a solid white or ivory blouse — the contrast makes the violet pop. Simple silver oxidised jewellery enhances the artisanal character of this saree.',
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
        'Hand block-printed A-line kurti in indigo and white, crafted by artisans using traditional wooden blocks in Jaipur — each print is slightly unique, the hallmark of genuine hand-block craft. The A-line silhouette is flattering on all body types, nipping at the waist and flaring gently below. Fabric: 100% pure cotton, breathable and perfect for Hyderabad\'s warm weather. Wash care: Machine wash gentle in cold water; turn inside out; add a teaspoon of salt in first wash to set the indigo dye; dry flat in shade. Size guide: Knee-length (approx 42 inches); side slits for ease of movement. Occasions: Office casual, college, weekend errands, casual brunches, travel. Styling tip: Pair with white palazzos for a crisp look, or blue jeans for a casual Indo-western style. Simple silver jhumkas and kolhapuri sandals complete the look.',
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
        'Rich art silk kurti in deep crimson with intricate zardozi-inspired thread embroidery at the neckline, cuffs, and hem. The embroidery is done by hand in Lucknow, making each piece slightly unique. The kurti has a long straight silhouette that can be worn as a kurta or belted as a dress. Fabric: Art silk with thread embroidery; fully lined. Wash care: Dry clean strongly recommended to preserve embroidery; if hand washing, submerge gently in cold water — do not rub embellishments. Occasions: Festivals (Diwali, Navratri, Eid), family functions, sangeet as a guest, dinner parties. Styling tip: Pair with a churidar and a contrasting golden or ivory dupatta for a complete ethnic look. Heavy earrings but keep necklace subtle — the neckline embroidery is the star.',
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
        'Clean straight-cut kurti in soft lavender georgette with a subtle sheen that photographs beautifully. The minimal design makes it the most versatile piece in your ethnic wardrobe — dress it up or down in seconds. Fabric: Premium georgette, lightweight and slightly sheer with a silky drape; fully lined. Wash care: Hand wash in cold water with mild detergent; do not wring — press gently between towels; hang dry in shade; iron on low heat inside-out. Occasions: Office wear, casual outings, evening walk, family visits, low-key celebrations. Styling tip: Wear with white leggings and silver jhumkas for a fresh daytime look. Switch to wide-leg palazzos and a statement necklace for an evening out. Nude flats or heeled sandals both work beautifully.',
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
        'Vibrant kurti in deep teal cotton with traditional mirror work (shisha embroidery) embellishments across the yoke, sleeves, and hem — each tiny mirror is hand-stitched by artisans inspired by Rajasthani and Gujarati craft. The mirrors catch light beautifully and create a dazzling effect at any gathering. Fabric: 100% cotton with hand-stitched mirror work; comfortable and breathable. Wash care: Hand wash gently in cold water — do not scrub the mirror work; dry flat in shade; iron carefully on reverse side, avoiding the embellishments. Occasions: Navratri Garba, Dandiya, Diwali, festivals, college fests, casual parties. Styling tip: Let the mirror work shine — pair with wide-leg palazzos in ivory or mustard. Stack thin gold bangles and add simple gold studs. Juttis or mojri footwear complete the festive look.',
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
        'Complete three-piece kurta set in rich mustard yellow cotton — a ready-to-wear festive look with zero effort. Includes a straight-fit kurta with subtle gota patti detailing at the neck, matching wide-leg palazzo pants, and a complementary block-printed cotton dupatta in mustard-orange-ivory tones. Fabric: 100% cotton for all three pieces — breathable, comfortable, and easy to care for. Wash care: Machine wash gentle in cold water; wash separately first time; dry flat in shade; iron on medium heat. Occasions: Navratri, Diwali puja, Makar Sankranti, Ugadi, Ganesh Chaturthi, family functions, festive home gatherings. Styling tip: Wear the full set for a coordinated festive look. Or pair just the kurta with jeans for casual wear. Pair with jhumka earrings in gold and kolhapuri sandals in tan.',
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
        'Exquisite hand-embroidered Chikankari kurti from Lucknow in pure ivory cotton. Each piece is individually embroidered by skilled artisans using 32 types of traditional Chikankari stitches — including shadow work, tepchi, phanda, and murri — creating an intricate all-over floral pattern. GI-tagged Lucknow Chikankari craft. Fabric: 100% pure cotton cambric, lightweight and breathable — perfect for summer. Wash care: Hand wash gently in cold water with mild detergent; turn inside out; do not soak for more than 5 minutes; dry flat in shade — avoid direct sun which can yellow white cotton; iron inside out on low heat. Occasions: Eid, casual festive events, family puja, garden parties, lunch dates, travel. Styling tip: The ivory colour is a blank canvas — let the embroidery speak. Pair with white, ivory, or soft pastel leggings. Add pearl jewellery or delicate silver chains. Understated elegance at its finest.',
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
        'Heavily embroidered bridal lehenga in scarlet red — the colour of love, tradition, and new beginnings. The full flared skirt features wall-to-wall gold zari and resham embroidery with intricate floral and paisley motifs. Set includes: a heavily embroidered flared skirt (7-layer cancan lining for maximum volume), a padded and boned blouse with deep back neckline, and a matching scalloped-border net dupatta with zari detailing. Fabric: Velvet and raw silk with genuine gold zari; fully cancan-lined skirt. Wash care: Dry clean only — do not wash at home; air after wearing and store in the garment bag provided. Fitting: Blouse is made-to-measure (WhatsApp us your measurements at time of order). Occasions: Wedding day, engagement ceremony. Styling tip: Pair with a full temple or Kundan jewellery set — maang tikka, nath, necklace, earrings, and bangles. Red embroidered juttis. Bridal smoky eye and red lip.',
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
        'Light and dreamy festive lehenga in powder blue — the perfect choice for pre-wedding functions and festival celebrations. The delicate floral embroidery with silver threadwork and tiny mirror accents gives it a fairy-tale quality. Set includes: a flowy net skirt with 3-layer lining, a matching embroidered blouse, and a sheer organza dupatta with embroidered border. Fabric: Net skirt with satin lining; embroidered blouse in raw silk; organza dupatta. Wash care: Dry clean only; store on a hanger to preserve skirt volume. Occasions: Mehendi ceremony, Haldi function, Navratri, Eid, sister\'s wedding as bridesmaid, outdoor garden parties. Styling tip: Keep jewellery delicate — pearl drops, floral hair accessories, or a simple maang tikka. Strappy silver heels or embroidered flats. Go for dewy, glowy makeup for a fresh festive look.',
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
        'Shimmer party lehenga in rose gold with all-over sequin work — every step you take, every move you make, this lehenga catches the light and turns heads. The flared A-line silhouette ensures maximum floor coverage and a dramatic entrance. Set includes: a sequin-embellished flared skirt with satin lining, a matching sequin blouse with cold-shoulder cut, and a sheer dupatta. Fabric: Sequin georgette on satin base; fully lined for comfort. Wash care: Dry clean only; never machine wash sequin garments; store flat or loosely folded. Occasions: Cocktail parties, reception evenings, sangeet nights, New Year bashes, anniversary dinners, engagement party as a guest. Styling tip: Sequins are the statement — keep accessories minimal. Just studs or small hoops and a delicate bracelet. Nude or rose gold strappy heels. Nude or rose lip, dramatic eye.',
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
        'Contemporary indo-western lehenga in sage green — where modern design meets traditional craftsmanship. The asymmetric hem skirt (shorter at front, longer at back) creates a fashion-forward silhouette while the intricate thread embroidery anchors it firmly in Indian aesthetic. Set includes: asymmetric hem georgette skirt with embroidered border, a crop top blouse with off-shoulder neckline, and a plain organza dupatta. Fabric: Georgette skirt with thread embroidery; georgette blouse; organza dupatta. Wash care: Dry clean recommended; gentle hand wash permissible in cold water if needed — press gently, do not rub embroidery. Occasions: Sangeet, pre-wedding photoshoots, engagement ceremony, reception as a guest, festive parties. Styling tip: Tuck in the dupatta for an outfit photo, then drape it to dance. Gold hoop earrings, stacked metal bangles, and strappy block heels. The asymmetric hem looks stunning with block heels or ankle-strap shoes.',
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
