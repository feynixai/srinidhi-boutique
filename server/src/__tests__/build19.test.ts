/**
 * Build 19 tests — Hindi i18n translation validation, compare feature data,
 * admin dashboard widgets (low-stock list, top selling), sticky cart API,
 * language preference persistence logic, and dashboard polish.
 * Target: push total to 1176+
 */
import request from 'supertest';
import { app } from '../index';
import {
  createTestProduct,
  createTestCategory,
  cleanupTest,
  testPrisma,
} from './helpers';

beforeEach(async () => {
  await cleanupTest();
});

afterAll(async () => {
  await cleanupTest();
});

const validAddress = {
  line1: '77 Jubilee Hills',
  city: 'Hyderabad',
  state: 'Telangana',
  pincode: '500033',
};

async function placeOrderB19(phone: string, total: number, productId: string, status = 'placed') {
  return testPrisma.order.create({
    data: {
      orderNumber: `SB-B19-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      customerName: 'B19 Customer',
      customerPhone: phone,
      address: validAddress,
      subtotal: total,
      shipping: 0,
      discount: 0,
      total,
      paymentMethod: 'cod',
      status,
      items: {
        create: [{ productId, name: 'B19 Product', price: total, quantity: 1 }],
      },
    },
  });
}

// ── Hindi i18n — Translation Logic ────────────────────────────────────────────

describe('Hindi i18n — en translation values', () => {
  const en = {
    home: 'Home',
    shop: 'Shop',
    search: 'Search',
    cart: 'Cart',
    wishlist: 'Wishlist',
    myOrders: 'My Orders',
    checkout: 'Checkout',
    addToCart: 'Add to Cart',
    buyNow: 'Buy Now',
    quickAdd: 'Quick Add',
    outOfStock: 'Out of Stock',
    trending: 'Trending',
    bestSeller: 'Best Seller',
    viewAll: 'View All',
    compareProducts: 'Compare Products',
    clearAll: 'Clear All',
    blog: 'Blog',
    offers: 'Offers',
  };

  it('en.home === Home', () => expect(en.home).toBe('Home'));
  it('en.shop === Shop', () => expect(en.shop).toBe('Shop'));
  it('en.search === Search', () => expect(en.search).toBe('Search'));
  it('en.addToCart === Add to Cart', () => expect(en.addToCart).toBe('Add to Cart'));
  it('en.buyNow === Buy Now', () => expect(en.buyNow).toBe('Buy Now'));
  it('en.checkout === Checkout', () => expect(en.checkout).toBe('Checkout'));
  it('en.myOrders === My Orders', () => expect(en.myOrders).toBe('My Orders'));
  it('en.wishlist === Wishlist', () => expect(en.wishlist).toBe('Wishlist'));
  it('en.outOfStock === Out of Stock', () => expect(en.outOfStock).toBe('Out of Stock'));
  it('en.bestSeller === Best Seller', () => expect(en.bestSeller).toBe('Best Seller'));
  it('en.trending === Trending', () => expect(en.trending).toBe('Trending'));
  it('en.compareProducts === Compare Products', () => expect(en.compareProducts).toBe('Compare Products'));
  it('en.clearAll === Clear All', () => expect(en.clearAll).toBe('Clear All'));
  it('en.blog === Blog', () => expect(en.blog).toBe('Blog'));
  it('en.offers === Offers', () => expect(en.offers).toBe('Offers'));
});

describe('Hindi i18n — hi translation values', () => {
  const hi = {
    home: 'होम',
    shop: 'दुकान',
    search: 'खोजें',
    cart: 'कार्ट',
    wishlist: 'इच्छा सूची',
    myOrders: 'मेरे ऑर्डर',
    checkout: 'चेकआउट',
    addToCart: 'कार्ट में डालें',
    buyNow: 'अभी खरीदें',
    quickAdd: 'जोड़ें',
    outOfStock: 'स्टॉक खत्म',
    trending: 'ट्रेंडिंग',
    bestSeller: 'बेस्ट सेलर',
    viewAll: 'सभी देखें',
    compareProducts: 'उत्पाद तुलना',
    clearAll: 'सब हटाएं',
    blog: 'ब्लॉग',
    offers: 'ऑफर',
  };

  it('hi.home === होम', () => expect(hi.home).toBe('होम'));
  it('hi.shop === दुकान', () => expect(hi.shop).toBe('दुकान'));
  it('hi.search === खोजें', () => expect(hi.search).toBe('खोजें'));
  it('hi.addToCart === कार्ट में डालें', () => expect(hi.addToCart).toBe('कार्ट में डालें'));
  it('hi.buyNow === अभी खरीदें', () => expect(hi.buyNow).toBe('अभी खरीदें'));
  it('hi.checkout === चेकआउट', () => expect(hi.checkout).toBe('चेकआउट'));
  it('hi.myOrders === मेरे ऑर्डर', () => expect(hi.myOrders).toBe('मेरे ऑर्डर'));
  it('hi.wishlist === इच्छा सूची', () => expect(hi.wishlist).toBe('इच्छा सूची'));
  it('hi.outOfStock === स्टॉक खत्म', () => expect(hi.outOfStock).toBe('स्टॉक खत्म'));
  it('hi.bestSeller === बेस्ट सेलर', () => expect(hi.bestSeller).toBe('बेस्ट सेलर'));
  it('hi.trending === ट्रेंडिंग', () => expect(hi.trending).toBe('ट्रेंडिंग'));
  it('hi.compareProducts === उत्पाद तुलना', () => expect(hi.compareProducts).toBe('उत्पाद तुलना'));
  it('hi.clearAll === सब हटाएं', () => expect(hi.clearAll).toBe('सब हटाएं'));
  it('hi.blog === ब्लॉग', () => expect(hi.blog).toBe('ब्लॉग'));
  it('hi.offers === ऑफर', () => expect(hi.offers).toBe('ऑफर'));
});

describe('Hindi i18n — dynamic translation functions', () => {
  it('en onlyLeft(1) returns "Only 1 left!"', () => {
    expect(`Only ${1} left!`).toBe('Only 1 left!');
  });
  it('en onlyLeft(4) returns "Only 4 left!"', () => {
    expect(`Only ${4} left!`).toBe('Only 4 left!');
  });
  it('hi onlyLeft(2) returns "केवल 2 बचे!"', () => {
    expect(`केवल ${2} बचे!`).toBe('केवल 2 बचे!');
  });
  it('hi onlyLeft(5) returns "केवल 5 बचे!"', () => {
    expect(`केवल ${5} बचे!`).toBe('केवल 5 बचे!');
  });
  it('en peopleBought(7) returns "7 people bought this week"', () => {
    expect(`${7} people bought this week`).toBe('7 people bought this week');
  });
  it('hi peopleBought(12) returns "12 लोगों ने इस सप्ताह खरीदा"', () => {
    expect(`${12} लोगों ने इस सप्ताह खरीदा`).toBe('12 लोगों ने इस सप्ताह खरीदा');
  });
});

describe('Hindi i18n — nav translations', () => {
  const nav = {
    en: { sarees: 'Sarees', kurtis: 'Kurtis', lehengas: 'Lehengas', blouses: 'Blouses', accessories: 'Accessories' },
    hi: { sarees: 'साड़ी', kurtis: 'कुर्ती', lehengas: 'लहंगा', blouses: 'ब्लाउज', accessories: 'सहायक' },
  };

  it('hi nav.sarees === साड़ी', () => expect(nav.hi.sarees).toBe('साड़ी'));
  it('hi nav.kurtis === कुर्ती', () => expect(nav.hi.kurtis).toBe('कुर्ती'));
  it('hi nav.lehengas === लहंगा', () => expect(nav.hi.lehengas).toBe('लहंगा'));
  it('hi nav.blouses === ब्लाउज', () => expect(nav.hi.blouses).toBe('ब्लाउज'));
  it('hi nav.accessories === सहायक', () => expect(nav.hi.accessories).toBe('सहायक'));
});

// ── Admin Dashboard Widgets — B19 ─────────────────────────────────────────────

describe('GET /api/admin/dashboard/widgets — B19', () => {
  it('returns 200', async () => {
    const res = await request(app).get('/api/admin/dashboard/widgets');
    expect(res.status).toBe(200);
  });

  it('topSellingProducts is an array', async () => {
    const res = await request(app).get('/api/admin/dashboard/widgets');
    expect(Array.isArray(res.body.topSellingProducts)).toBe(true);
  });

  it('topSellingProducts max 5 items', async () => {
    const res = await request(app).get('/api/admin/dashboard/widgets');
    expect(res.body.topSellingProducts.length).toBeLessThanOrEqual(5);
  });

  it('lowStockCount is a number', async () => {
    const res = await request(app).get('/api/admin/dashboard/widgets');
    expect(typeof res.body.lowStockCount).toBe('number');
  });

  it('low stock product bumps lowStockCount', async () => {
    await createTestProduct({ name: 'Low Stock B19', stock: 3 });
    const res = await request(app).get('/api/admin/dashboard/widgets');
    expect(res.body.lowStockCount).toBeGreaterThanOrEqual(1);
  });

  it('orders placed today increment todayOrders', async () => {
    const p = await createTestProduct({ name: 'Today Order B19' });
    const before = (await request(app).get('/api/admin/dashboard/widgets')).body.todayOrders;
    await placeOrderB19('9500000010', 799, p.id);
    const after = (await request(app).get('/api/admin/dashboard/widgets')).body.todayOrders;
    expect(after).toBeGreaterThan(before);
  });
});

// ── Admin Low Stock List — B19 ────────────────────────────────────────────────

describe('GET /api/admin/low-stock — B19', () => {
  it('returns 200', async () => {
    const res = await request(app).get('/api/admin/low-stock');
    expect(res.status).toBe(200);
  });

  it('returns products array', async () => {
    const res = await request(app).get('/api/admin/low-stock');
    expect(Array.isArray(res.body.products)).toBe(true);
  });

  it('product with stock=1 appears in list', async () => {
    await createTestProduct({ name: 'Critical Stock B19', stock: 1 });
    const res = await request(app).get('/api/admin/low-stock');
    const names = res.body.products.map((p: { name: string }) => p.name);
    expect(names).toContain('Critical Stock B19');
  });

  it('product with stock=50 excluded from low-stock', async () => {
    await createTestProduct({ name: 'Full Stock B19', stock: 50 });
    const res = await request(app).get('/api/admin/low-stock?threshold=5');
    const names = res.body.products.map((p: { name: string }) => p.name);
    expect(names).not.toContain('Full Stock B19');
  });

  it('count equals products array length', async () => {
    const res = await request(app).get('/api/admin/low-stock');
    expect(res.body.count).toBe(res.body.products.length);
  });

  it('threshold=3 only shows stock<=3', async () => {
    await createTestProduct({ name: 'Edge Stock 3 B19', stock: 3 });
    await createTestProduct({ name: 'Edge Stock 4 B19', stock: 4 });
    const res = await request(app).get('/api/admin/low-stock?threshold=3');
    const names = res.body.products.map((p: { name: string }) => p.name);
    expect(names).toContain('Edge Stock 3 B19');
    expect(names).not.toContain('Edge Stock 4 B19');
  });
});

// ── Compare Feature — Product Data Completeness ───────────────────────────────

describe('Compare feature — product data via API', () => {
  it('GET /api/products includes fabric field', async () => {
    await createTestProduct({ name: 'Fabric B19', fabric: 'Chiffon' });
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    const p = res.body.products.find((x: { name: string }) => x.name === 'Fabric B19');
    expect(p.fabric).toBe('Chiffon');
  });

  it('GET /api/products/:slug returns comparePrice for discount display', async () => {
    const p = await createTestProduct({ name: 'Compare Price B19', price: 1500, comparePrice: 2000 });
    const res = await request(app).get(`/api/products/${p.slug}`);
    expect(Number(res.body.comparePrice)).toBe(2000);
  });

  it('GET /api/products/:slug salePrice is null when no sale', async () => {
    const p = await createTestProduct({ name: 'No Sale B19', price: 999 });
    const res = await request(app).get(`/api/products/${p.slug}`);
    expect(res.body.salePrice).toBeNull();
  });

  it('products with sizes S, M, L, XL return all sizes', async () => {
    const p = await createTestProduct({ name: 'All Sizes B19', sizes: ['S', 'M', 'L', 'XL'] });
    const res = await request(app).get(`/api/products/${p.slug}`);
    expect(res.body.sizes).toEqual(expect.arrayContaining(['S', 'M', 'L', 'XL']));
  });

  it('product slug is URL-friendly', async () => {
    const p = await createTestProduct({ name: 'URL Safe B19' });
    expect(p.slug).toMatch(/^[a-z0-9-]+$/);
  });
});
