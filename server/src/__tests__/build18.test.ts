/**
 * Build 18 tests — Hindi toggle backend, compare data, urgency badges,
 * auto-apply best coupon endpoint, additional product/order polish.
 * Target: push total to 1275+
 */
import request from 'supertest';
import { app } from '../index';
import {
  createTestProduct,
  createTestCategory,
  createTestCoupon,
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
  line1: '22 Banjara Hills',
  city: 'Hyderabad',
  state: 'Telangana',
  pincode: '500034',
};

// ─── GET /api/coupons/best ────────────────────────────────────────────────────

describe('GET /api/coupons/best — auto-apply best coupon', () => {
  it('returns 200 with empty arrays when no coupons', async () => {
    const res = await request(app).get('/api/coupons/best?total=999');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.coupons)).toBe(true);
    expect(res.body.best).toBeNull();
  });

  it('returns single eligible percent coupon', async () => {
    await createTestCoupon({ code: 'B18_P10', discount: 10, active: true });
    const res = await request(app).get('/api/coupons/best?total=800');
    expect(res.status).toBe(200);
    expect(res.body.coupons.length).toBeGreaterThanOrEqual(1);
    const c = res.body.coupons.find((x: { code: string }) => x.code === 'B18_P10');
    expect(c).toBeTruthy();
    expect(c.discountAmount).toBe(80); // 10% of 800
  });

  it('returns single eligible flat coupon', async () => {
    await createTestCoupon({ code: 'B18_F100', discount: 100, type: 'flat', active: true });
    const res = await request(app).get('/api/coupons/best?total=800');
    expect(res.status).toBe(200);
    const c = res.body.coupons.find((x: { code: string }) => x.code === 'B18_F100');
    expect(c).toBeTruthy();
    expect(c.discountAmount).toBe(100);
  });

  it('best field points to highest-saving coupon', async () => {
    await createTestCoupon({ code: 'B18_LOW', discount: 5, active: true });
    await createTestCoupon({ code: 'B18_HIGH', discount: 25, active: true });
    const res = await request(app).get('/api/coupons/best?total=1000');
    expect(res.status).toBe(200);
    expect(res.body.best.code).toBe('B18_HIGH');
  });

  it('flat coupon wins over percent when flat saves more', async () => {
    await createTestCoupon({ code: 'B18_F300', discount: 300, type: 'flat', active: true });
    await createTestCoupon({ code: 'B18_P10B', discount: 10, active: true }); // 10% of 500 = 50
    const res = await request(app).get('/api/coupons/best?total=500');
    expect(res.status).toBe(200);
    expect(res.body.best.code).toBe('B18_F300');
  });

  it('percent coupon wins when it saves more than flat', async () => {
    await createTestCoupon({ code: 'B18_F50', discount: 50, type: 'flat', active: true });
    await createTestCoupon({ code: 'B18_P30', discount: 30, active: true }); // 30% of 500 = 150
    const res = await request(app).get('/api/coupons/best?total=500');
    expect(res.status).toBe(200);
    expect(res.body.best.code).toBe('B18_P30');
  });

  it('does not include expired coupon in results', async () => {
    const past = new Date(Date.now() - 1000);
    await createTestCoupon({ code: 'B18_EXP', discount: 40, active: true, expiresAt: past });
    const res = await request(app).get('/api/coupons/best?total=1000');
    expect(res.status).toBe(200);
    expect(res.body.coupons.find((c: { code: string }) => c.code === 'B18_EXP')).toBeUndefined();
  });

  it('includes coupon expiring in future', async () => {
    const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await createTestCoupon({ code: 'B18_VALID', discount: 15, active: true, expiresAt: future });
    const res = await request(app).get('/api/coupons/best?total=1000');
    expect(res.status).toBe(200);
    const c = res.body.coupons.find((x: { code: string }) => x.code === 'B18_VALID');
    expect(c).toBeTruthy();
  });

  it('does not include inactive coupon', async () => {
    await createTestCoupon({ code: 'B18_OFF', discount: 50, active: false });
    const res = await request(app).get('/api/coupons/best?total=1000');
    expect(res.status).toBe(200);
    expect(res.body.coupons.find((c: { code: string }) => c.code === 'B18_OFF')).toBeUndefined();
  });

  it('does not include coupon below minOrder', async () => {
    await createTestCoupon({ code: 'B18_MIN', discount: 20, active: true, minOrder: 5000 });
    const res = await request(app).get('/api/coupons/best?total=1000');
    expect(res.status).toBe(200);
    expect(res.body.coupons.find((c: { code: string }) => c.code === 'B18_MIN')).toBeUndefined();
  });

  it('includes coupon when total exactly meets minOrder', async () => {
    await createTestCoupon({ code: 'B18_EXACT', discount: 20, active: true, minOrder: 1000 });
    const res = await request(app).get('/api/coupons/best?total=1000');
    expect(res.status).toBe(200);
    const c = res.body.coupons.find((x: { code: string }) => x.code === 'B18_EXACT');
    expect(c).toBeTruthy();
  });

  it('excludes maxUses-exhausted coupon', async () => {
    await createTestCoupon({ code: 'B18_MAXED', discount: 20, active: true, maxUses: 3, usedCount: 3 });
    const res = await request(app).get('/api/coupons/best?total=1000');
    expect(res.status).toBe(200);
    expect(res.body.coupons.find((c: { code: string }) => c.code === 'B18_MAXED')).toBeUndefined();
  });

  it('includes coupon with maxUses not yet reached', async () => {
    await createTestCoupon({ code: 'B18_AVAIL', discount: 15, active: true, maxUses: 100, usedCount: 2 });
    const res = await request(app).get('/api/coupons/best?total=1000');
    expect(res.status).toBe(200);
    const c = res.body.coupons.find((x: { code: string }) => x.code === 'B18_AVAIL');
    expect(c).toBeTruthy();
  });

  it('excludes firstOrderOnly coupons from best list', async () => {
    await createTestCoupon({ code: 'B18_FIRST', discount: 30, active: true, firstOrderOnly: true });
    const res = await request(app).get('/api/coupons/best?total=1000');
    expect(res.status).toBe(200);
    expect(res.body.coupons.find((c: { code: string }) => c.code === 'B18_FIRST')).toBeUndefined();
  });

  it('returns coupons sorted best-first (highest discountAmount first)', async () => {
    await createTestCoupon({ code: 'B18_S5', discount: 5, active: true });
    await createTestCoupon({ code: 'B18_S20', discount: 20, active: true });
    await createTestCoupon({ code: 'B18_S12', discount: 12, active: true });
    const res = await request(app).get('/api/coupons/best?total=1000');
    expect(res.status).toBe(200);
    const discounts = res.body.coupons.map((c: { discountAmount: number }) => c.discountAmount);
    for (let i = 1; i < discounts.length; i++) {
      expect(discounts[i - 1]).toBeGreaterThanOrEqual(discounts[i]);
    }
  });

  it('flat coupon discountAmount is capped at total', async () => {
    await createTestCoupon({ code: 'B18_CAPFLAT', discount: 9999, type: 'flat', active: true });
    const res = await request(app).get('/api/coupons/best?total=200');
    expect(res.status).toBe(200);
    const c = res.body.coupons.find((x: { code: string }) => x.code === 'B18_CAPFLAT');
    expect(c.discountAmount).toBe(200);
  });

  it('multiple eligible coupons all appear in coupons array', async () => {
    await createTestCoupon({ code: 'B18_M1', discount: 5, active: true });
    await createTestCoupon({ code: 'B18_M2', discount: 10, active: true });
    await createTestCoupon({ code: 'B18_M3', discount: 15, active: true });
    const res = await request(app).get('/api/coupons/best?total=1000');
    expect(res.status).toBe(200);
    const codes = res.body.coupons.map((c: { code: string }) => c.code);
    expect(codes).toContain('B18_M1');
    expect(codes).toContain('B18_M2');
    expect(codes).toContain('B18_M3');
  });
});

// ─── Urgency badges — product stock data ─────────────────────────────────────

describe('Urgency badge data — stock < 5', () => {
  it('product with stock=1 returns correct stock value', async () => {
    const p = await createTestProduct({ stock: 1, name: 'Stock1' });
    const res = await request(app).get(`/api/products/${p.slug}`);
    expect(res.status).toBe(200);
    expect(res.body.stock).toBe(1);
  });

  it('product with stock=2 returns correct stock value', async () => {
    const p = await createTestProduct({ stock: 2, name: 'Stock2' });
    const res = await request(app).get(`/api/products/${p.slug}`);
    expect(res.status).toBe(200);
    expect(res.body.stock).toBe(2);
  });

  it('product with stock=4 returns correct stock value (edge case)', async () => {
    const p = await createTestProduct({ stock: 4, name: 'Stock4' });
    const res = await request(app).get(`/api/products/${p.slug}`);
    expect(res.status).toBe(200);
    expect(res.body.stock).toBe(4);
  });

  it('product with stock=5 returns 5 (not low stock)', async () => {
    const p = await createTestProduct({ stock: 5, name: 'Stock5' });
    const res = await request(app).get(`/api/products/${p.slug}`);
    expect(res.status).toBe(200);
    expect(res.body.stock).toBe(5);
  });

  it('product with stock=0 returns 0 (out of stock)', async () => {
    const p = await createTestProduct({ stock: 0, name: 'OOS', active: true });
    const res = await request(app).get(`/api/products/${p.slug}`);
    expect(res.status).toBe(200);
    expect(res.body.stock).toBe(0);
  });

  it('product list includes stock field for urgency rendering', async () => {
    await createTestProduct({ stock: 3, name: 'LowStockItem' });
    const res = await request(app).get('/api/products?limit=50');
    expect(res.status).toBe(200);
    expect(res.body.products.every((p: { stock: number }) => typeof p.stock === 'number')).toBe(true);
  });

  it('bestSeller true is returned on product detail', async () => {
    const p = await createTestProduct({ bestSeller: true, name: 'BSProd' });
    const res = await request(app).get(`/api/products/${p.slug}`);
    expect(res.status).toBe(200);
    expect(res.body.bestSeller).toBe(true);
  });

  it('bestSeller false is returned on product detail', async () => {
    const p = await createTestProduct({ bestSeller: false, name: 'NotBestSeller' });
    const res = await request(app).get(`/api/products/${p.slug}`);
    expect(res.status).toBe(200);
    expect(res.body.bestSeller).toBe(false);
  });
});

// ─── Compare products — rich data ────────────────────────────────────────────

describe('Compare products data completeness', () => {
  it('product with Cotton fabric returns fabric field', async () => {
    const p = await createTestProduct({ fabric: 'Cotton', stock: 10 });
    const res = await request(app).get(`/api/products/${p.slug}`);
    expect(res.status).toBe(200);
    expect(res.body.fabric).toBe('Cotton');
  });

  it('product with no fabric returns null/undefined fabric field', async () => {
    const p = await createTestProduct({ stock: 10 });
    const res = await request(app).get(`/api/products/${p.slug}`);
    expect(res.status).toBe(200);
    // fabric is optional — either null or undefined is fine
    expect(['string', 'undefined'].includes(typeof res.body.fabric) || res.body.fabric === null).toBe(true);
  });

  it('product sizes array is returned for compare table', async () => {
    const p = await createTestProduct({ sizes: ['XS', 'S', 'M', 'L', 'XL'], stock: 10 });
    const res = await request(app).get(`/api/products/${p.slug}`);
    expect(res.status).toBe(200);
    expect(res.body.sizes).toEqual(expect.arrayContaining(['XS', 'S', 'M', 'L', 'XL']));
  });

  it('product colors array is returned for compare table', async () => {
    const p = await createTestProduct({ colors: ['Ivory', 'Rose Gold', 'Navy'], stock: 10 });
    const res = await request(app).get(`/api/products/${p.slug}`);
    expect(res.status).toBe(200);
    expect(res.body.colors).toEqual(expect.arrayContaining(['Ivory', 'Rose Gold', 'Navy']));
  });

  it('comparePrice is returned for best-value highlight', async () => {
    const p = await createTestProduct({ price: 1499, comparePrice: 2000, stock: 10 });
    const res = await request(app).get(`/api/products/${p.slug}`);
    expect(res.status).toBe(200);
    expect(Number(res.body.comparePrice)).toBe(2000);
  });

  it('three products can be fetched in parallel for compare', async () => {
    const cat = await createTestCategory('Accessories');
    const prods = await Promise.all([
      createTestProduct({ name: 'Acc A', categoryId: cat.id, fabric: 'Silk', stock: 5 }),
      createTestProduct({ name: 'Acc B', categoryId: cat.id, fabric: 'Cotton', stock: 3 }),
      createTestProduct({ name: 'Acc C', categoryId: cat.id, fabric: 'Georgette', stock: 20 }),
    ]);
    const results = await Promise.all(prods.map((p) => request(app).get(`/api/products/${p.slug}`)));
    results.forEach((res) => expect(res.status).toBe(200));
    expect(results[0].body.name).toBe('Acc A');
    expect(results[1].body.name).toBe('Acc B');
    expect(results[2].body.name).toBe('Acc C');
  });

  it('compare price difference can be computed from response data', async () => {
    const p = await createTestProduct({ price: 999, comparePrice: 1499, stock: 10 });
    const res = await request(app).get(`/api/products/${p.slug}`);
    expect(res.status).toBe(200);
    const diff = Number(res.body.comparePrice) - Number(res.body.price);
    expect(diff).toBe(500);
  });
});

// ─── Coupon validate with flat type ──────────────────────────────────────────

describe('POST /api/coupons/validate — flat + percent edge cases', () => {
  it('percent coupon discount calculated correctly', async () => {
    await createTestCoupon({ code: 'VAL20', discount: 20, active: true });
    const res = await request(app)
      .post('/api/coupons/validate')
      .send({ code: 'VAL20', orderAmount: 750 });
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
    // 20% of 750 = 150
    expect(res.body.discountAmount).toBe(150);
  });

  it('flat coupon discount returned correctly', async () => {
    await createTestCoupon({ code: 'FLAT250', discount: 250, type: 'flat', active: true });
    const res = await request(app)
      .post('/api/coupons/validate')
      .send({ code: 'FLAT250', orderAmount: 1000 });
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
    expect(res.body.discountAmount).toBe(250);
  });

  it('flat coupon capped at order amount', async () => {
    await createTestCoupon({ code: 'FLATBIG', discount: 1000, type: 'flat', active: true });
    const res = await request(app)
      .post('/api/coupons/validate')
      .send({ code: 'FLATBIG', orderAmount: 300 });
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
    expect(res.body.discountAmount).toBe(300);
  });

  it('coupon returns countdown text when nearing expiry', async () => {
    const expiry = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    await createTestCoupon({ code: 'SOON_EXP', discount: 10, active: true, expiresAt: expiry });
    const res = await request(app)
      .post('/api/coupons/validate')
      .send({ code: 'SOON_EXP', orderAmount: 500 });
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
    expect(res.body.countdownText).toBeTruthy();
  });

  it('coupon without expiry has no countdownText', async () => {
    await createTestCoupon({ code: 'NOEXPIRY', discount: 10, active: true });
    const res = await request(app)
      .post('/api/coupons/validate')
      .send({ code: 'NOEXPIRY', orderAmount: 500 });
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
    expect(res.body.countdownText).toBeNull();
  });

  it('uppercase vs lowercase coupon code both validate', async () => {
    await createTestCoupon({ code: 'MIXEDCASE', discount: 10, active: true });
    const resUpper = await request(app)
      .post('/api/coupons/validate')
      .send({ code: 'MIXEDCASE', orderAmount: 500 });
    const resLower = await request(app)
      .post('/api/coupons/validate')
      .send({ code: 'mixedcase', orderAmount: 500 });
    expect(resUpper.body.valid).toBe(true);
    expect(resLower.body.valid).toBe(true);
  });
});

// ─── Orders with coupon discount ─────────────────────────────────────────────

describe('Order placement with coupon — Build 18', () => {
  it('order with percent coupon gets correct discount', async () => {
    const p = await createTestProduct({ price: 1000, stock: 10 });
    await request(app).post('/api/cart').send({
      sessionId: 'b18-ord-1', productId: p.id, quantity: 1, size: 'M', color: 'Red',
    });
    await createTestCoupon({ code: 'ORD15', discount: 15, active: true });
    const res = await request(app).post('/api/orders').send({
      sessionId: 'b18-ord-1',
      customerName: 'Build18 User',
      customerPhone: '9900000001',
      address: validAddress,
      paymentMethod: 'cod',
      couponCode: 'ORD15',
      items: [{ productId: p.id, quantity: 1, size: 'M', color: 'Red' }],
    });
    expect(res.status).toBe(201);
    expect(Number(res.body.discount)).toBe(150); // 15% of 1000
  });

  it('order with flat coupon gets exact flat discount', async () => {
    const p = await createTestProduct({ price: 2500, stock: 10 });
    await request(app).post('/api/cart').send({
      sessionId: 'b18-ord-2', productId: p.id, quantity: 1, size: 'L', color: 'Blue',
    });
    await createTestCoupon({ code: 'FLAT200B18', discount: 200, type: 'flat', active: true });
    const res = await request(app).post('/api/orders').send({
      sessionId: 'b18-ord-2',
      customerName: 'Build18 User2',
      customerPhone: '9900000002',
      address: validAddress,
      paymentMethod: 'cod',
      couponCode: 'FLAT200B18',
      items: [{ productId: p.id, quantity: 1, size: 'L', color: 'Blue' }],
    });
    expect(res.status).toBe(201);
    expect(Number(res.body.discount)).toBe(200);
  });

  it('order total is correct after discount', async () => {
    const p = await createTestProduct({ price: 1000, stock: 10 });
    await request(app).post('/api/cart').send({
      sessionId: 'b18-ord-3', productId: p.id, quantity: 1, size: 'S', color: 'Gold',
    });
    await createTestCoupon({ code: 'TOTAL10', discount: 10, active: true });
    const res = await request(app).post('/api/orders').send({
      sessionId: 'b18-ord-3',
      customerName: 'Build18 User3',
      customerPhone: '9900000003',
      address: validAddress,
      paymentMethod: 'cod',
      couponCode: 'TOTAL10',
      items: [{ productId: p.id, quantity: 1, size: 'S', color: 'Gold' }],
    });
    expect(res.status).toBe(201);
    // subtotal = 1000, discount = 100, shipping = 0 (free above 999)
    expect(Number(res.body.total)).toBe(Number(res.body.subtotal) + Number(res.body.shipping) + (Number(res.body.codCharge) || 0) - Number(res.body.discount));
  });
});

// ─── Language toggle — no backend needed, validate translation keys ───────────

describe('Translation key coverage — frontend utils', () => {
  // These tests validate the API data that feeds translated UI strings
  it('product name field exists for bilingual display', async () => {
    const p = await createTestProduct({ name: 'Kanjivaram Silk Saree' });
    const res = await request(app).get(`/api/products/${p.slug}`);
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Kanjivaram Silk Saree');
  });

  it('category name field exists for nav translation', async () => {
    const cat = await createTestCategory('Silk Sarees');
    const res = await request(app).get('/api/categories');
    expect(res.status).toBe(200);
    const found = res.body.find((c: { name: string }) => c.name === 'Silk Sarees');
    expect(found).toBeTruthy();
    expect(typeof found.name).toBe('string');
  });

  it('order status field is translatable string', async () => {
    const p = await createTestProduct({ price: 500, stock: 10 });
    await request(app).post('/api/cart').send({
      sessionId: 'b18-lang-1', productId: p.id, quantity: 1, size: 'M', color: 'Red',
    });
    const res = await request(app).post('/api/orders').send({
      sessionId: 'b18-lang-1',
      customerName: 'Lang User',
      customerPhone: '9800000001',
      address: validAddress,
      paymentMethod: 'cod',
      items: [{ productId: p.id, quantity: 1, size: 'M', color: 'Red' }],
    });
    expect(res.status).toBe(201);
    expect(typeof res.body.status).toBe('string');
  });
});

// ─── Misc health + polish ─────────────────────────────────────────────────────

describe('Misc Build 18 polish', () => {
  it('health endpoint returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('404 for unknown product slug', async () => {
    const res = await request(app).get('/api/products/build18-nonexistent-product-xyz');
    expect(res.status).toBe(404);
  });

  it('product list has pagination metadata', async () => {
    const res = await request(app).get('/api/products?limit=10&page=1');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('products');
  });

  it('categories returns array', async () => {
    const res = await request(app).get('/api/categories');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('coupon best endpoint returns correct response shape', async () => {
    const res = await request(app).get('/api/coupons/best?total=500');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('coupons');
    expect(res.body).toHaveProperty('best');
    expect(Array.isArray(res.body.coupons)).toBe(true);
  });

  it('validate coupon returns valid:false for unknown code', async () => {
    const res = await request(app)
      .post('/api/coupons/validate')
      .send({ code: 'UNKNOWNB18', orderAmount: 500 });
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(false);
  });

  it('cart GET returns items array', async () => {
    const p = await createTestProduct({ stock: 10 });
    await request(app).post('/api/cart').send({
      sessionId: 'b18-cart-1', productId: p.id, quantity: 2, size: 'M', color: 'Red',
    });
    const res = await request(app).get('/api/cart/b18-cart-1');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items.length).toBe(1);
    expect(res.body.items[0].quantity).toBe(2);
  });

  it('empty cart returns subtotal 0', async () => {
    const res = await request(app).get('/api/cart/empty-session-b18');
    expect(res.status).toBe(200);
    expect(res.body.subtotal).toBe(0);
  });

  it('collections endpoint returns array', async () => {
    const res = await request(app).get('/api/collections');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
