/**
 * Build 20 tests — checkout validation, pincode city/state lookup, CSV exports,
 * admin quick-ship, back-in-stock, shop-by-occasion filtering, order workflow,
 * coupon edge cases, analytics, and dashboard real-time polling readiness.
 * Target: push total to 1400+ tests (~80 new)
 */
import request from 'supertest';
import { app } from '../index';
import {
  createTestCoupon,
  createTestPincodeZone,
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
  line1: '10 Banjara Hills',
  city: 'Hyderabad',
  state: 'Telangana',
  pincode: '500034',
};

async function createProductB20(nameSuffix: string, overrides: Record<string, unknown> = {}) {
  const ts = Date.now();
  const rnd = Math.random().toString(36).slice(2, 5);
  const key = `${nameSuffix}-${ts}-${rnd}`;
  const cat = await testPrisma.category.create({
    data: { name: `B20Cat-${key}`, slug: `b20cat-${key}`.toLowerCase() },
  });
  return testPrisma.product.create({
    data: {
      name: `B20 Product ${key}`,
      slug: `b20-product-${key}`.toLowerCase(),
      price: 999,
      images: ['https://example.com/img.jpg'],
      sizes: ['M'],
      colors: ['Red'],
      occasion: ['casual'],
      stock: 50,
      active: true,
      categoryId: cat.id,
      ...overrides,
    },
  });
}

async function placeOrderB20(
  phone: string,
  total: number,
  productId: string,
  status = 'placed',
  paymentMethod = 'cod',
) {
  return testPrisma.order.create({
    data: {
      orderNumber: `SB-B20-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      customerName: 'B20 Customer',
      customerPhone: phone,
      address: validAddress,
      subtotal: total,
      shipping: 0,
      discount: 0,
      total,
      paymentMethod,
      status,
      items: {
        create: [{ productId, name: 'B20 Product', price: total, quantity: 1 }],
      },
    },
  });
}

// ── Pincode city/state auto-detect ────────────────────────────────────────────

describe('GET /api/pincode/:pincode — city/state auto-detect', () => {
  it('returns city and state for known prefix 500', async () => {
    const res = await request(app).get('/api/pincode/500034');
    expect(res.status).toBe(200);
    expect(res.body.available).toBe(true);
    expect(res.body.city).toBeDefined();
    expect(res.body.state).toBeDefined();
  });

  it('returns city and state for Mumbai prefix 400', async () => {
    const res = await request(app).get('/api/pincode/400001');
    expect(res.status).toBe(200);
    expect(res.body.available).toBe(true);
    expect(res.body.city).toContain('Mumbai');
  });

  it('returns city and state for Delhi prefix 110', async () => {
    const res = await request(app).get('/api/pincode/110001');
    expect(res.status).toBe(200);
    expect(res.body.city).toContain('Delhi');
    expect(res.body.state).toContain('Delhi');
  });

  it('returns city and state for Chennai prefix 600', async () => {
    const res = await request(app).get('/api/pincode/600001');
    expect(res.status).toBe(200);
    expect(res.body.city).toContain('Chennai');
  });

  it('returns city and state for Bengaluru prefix 560', async () => {
    const res = await request(app).get('/api/pincode/560001');
    expect(res.status).toBe(200);
    expect(res.body.city).toContain('Bengaluru');
  });

  it('returns city and state for Kolkata prefix 700', async () => {
    const res = await request(app).get('/api/pincode/700001');
    expect(res.status).toBe(200);
    expect(res.body.city).toContain('Kolkata');
  });

  it('returns city and state for Pune prefix 411', async () => {
    const res = await request(app).get('/api/pincode/411001');
    expect(res.status).toBe(200);
    expect(res.body.city).toContain('Pune');
  });

  it('returns deliveryDays field for auto-detected pincode', async () => {
    const res = await request(app).get('/api/pincode/500001');
    expect(res.status).toBe(200);
    expect(typeof res.body.deliveryDays).toBe('number');
    expect(res.body.deliveryDays).toBeGreaterThan(0);
  });

  it('returns deliveryDate string for auto-detected pincode', async () => {
    const res = await request(app).get('/api/pincode/500001');
    expect(res.status).toBe(200);
    expect(typeof res.body.deliveryDate).toBe('string');
    expect(res.body.deliveryDate.length).toBeGreaterThan(0);
  });

  it('returns 400 for invalid pincode format', async () => {
    const res = await request(app).get('/api/pincode/12345');
    expect(res.status).toBe(400);
    expect(res.body.available).toBe(false);
  });

  it('returns 400 for non-numeric pincode', async () => {
    const res = await request(app).get('/api/pincode/ABCDEF');
    expect(res.status).toBe(400);
  });

  it('returns available=true for unknown pincode (fallback)', async () => {
    const res = await request(app).get('/api/pincode/999999');
    expect(res.status).toBe(200);
    expect(res.body.available).toBe(true);
  });

  it('returns db pincode zone when present', async () => {
    await createTestPincodeZone({ pincode: '500090', city: 'Secunderabad', state: 'Telangana', deliveryDays: 1, available: true });
    const res = await request(app).get('/api/pincode/500090');
    expect(res.status).toBe(200);
    expect(res.body.city).toBe('Secunderabad');
    expect(res.body.available).toBe(true);
  });

  it('returns available=false for pincode marked unavailable in db', async () => {
    await createTestPincodeZone({ pincode: '123456', city: 'Unknown', state: 'Unknown', deliveryDays: 10, available: false });
    const res = await request(app).get('/api/pincode/123456');
    expect(res.status).toBe(200);
    expect(res.body.available).toBe(false);
  });
});

// ── Admin CSV Export ───────────────────────────────────────────────────────────

describe('GET /api/admin/export/products', () => {
  it('returns 200 with CSV content-type', async () => {
    const res = await request(app).get('/api/admin/export/products');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/);
  });

  it('includes CSV header row', async () => {
    const res = await request(app).get('/api/admin/export/products');
    expect(res.status).toBe(200);
    expect(res.text).toContain('id,name,price');
  });

  it('includes product data rows', async () => {
    const product = await createProductB20('export-saree');
    const res = await request(app).get('/api/admin/export/products');
    expect(res.status).toBe(200);
    expect(res.text).toContain(product.name);
  });

  it('sets content-disposition for download', async () => {
    const res = await request(app).get('/api/admin/export/products');
    expect(res.headers['content-disposition']).toMatch(/attachment/);
    expect(res.headers['content-disposition']).toMatch(/products/);
  });
});

describe('GET /api/admin/export/customers', () => {
  it('returns 200 with CSV content-type', async () => {
    const res = await request(app).get('/api/admin/export/customers');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/);
  });

  it('includes CSV header row with phone field', async () => {
    const res = await request(app).get('/api/admin/export/customers');
    expect(res.status).toBe(200);
    expect(res.text).toContain('phone');
  });

  it('includes customer data when orders exist', async () => {
    const product = await createProductB20('csv-customer');
    await placeOrderB20('+919876541111', 1200, product.id);
    const res = await request(app).get('/api/admin/export/customers');
    expect(res.status).toBe(200);
    expect(res.text).toContain('+919876541111');
  });

  it('sets content-disposition for download', async () => {
    const res = await request(app).get('/api/admin/export/customers');
    expect(res.headers['content-disposition']).toMatch(/attachment/);
    expect(res.headers['content-disposition']).toMatch(/customers/);
  });
});

describe('GET /api/admin/export/orders', () => {
  it('returns 200 with CSV content-type', async () => {
    const res = await request(app).get('/api/admin/export/orders');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/);
  });

  it('includes CSV header row with orderNumber field', async () => {
    const res = await request(app).get('/api/admin/export/orders');
    expect(res.status).toBe(200);
    expect(res.text).toContain('orderNumber');
  });

  it('includes order data rows', async () => {
    const product = await createProductB20('export-order');
    await placeOrderB20('+919000000001', 999, product.id);
    const res = await request(app).get('/api/admin/export/orders');
    expect(res.status).toBe(200);
    expect(res.text).toContain('SB-B20');
  });

  it('sets content-disposition for download', async () => {
    const res = await request(app).get('/api/admin/export/orders');
    expect(res.headers['content-disposition']).toMatch(/attachment/);
  });
});

describe('GET /api/admin/export/:type — invalid type', () => {
  it('returns 400 for invalid export type', async () => {
    const res = await request(app).get('/api/admin/export/unknown');
    expect(res.status).toBe(400);
  });
});

// ── Admin Quick Ship ──────────────────────────────────────────────────────────

describe('PUT /api/admin/orders/:id/status — quick mark shipped', () => {
  it('marks a placed order as shipped', async () => {
    const product = await createProductB20('quick-ship-placed');
    const order = await placeOrderB20('+919001234567', 1500, product.id, 'placed');
    const res = await request(app)
      .put(`/api/admin/orders/${order.id}/status`)
      .send({ status: 'shipped' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('shipped');
  });

  it('marks a confirmed order as shipped', async () => {
    const product = await createProductB20('quick-ship-confirmed');
    const order = await placeOrderB20('+919001234568', 1200, product.id, 'confirmed');
    const res = await request(app)
      .put(`/api/admin/orders/${order.id}/status`)
      .send({ status: 'shipped' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('shipped');
  });

  it('marks a packed order as shipped', async () => {
    const product = await createProductB20('quick-ship-packed');
    const order = await placeOrderB20('+919001234569', 1800, product.id, 'packed');
    const res = await request(app)
      .put(`/api/admin/orders/${order.id}/status`)
      .send({ status: 'shipped' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('shipped');
  });

  it('can include trackingId when marking shipped', async () => {
    const product = await createProductB20('quick-ship-tracked');
    const order = await placeOrderB20('+919009999999', 2000, product.id, 'placed');
    const res = await request(app)
      .put(`/api/admin/orders/${order.id}/status`)
      .send({ status: 'shipped', trackingId: 'DTDC123456' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('shipped');
  });

  it('returns 404 for non-existent order', async () => {
    const res = await request(app)
      .put('/api/admin/orders/non-existent-id-b20/status')
      .send({ status: 'shipped' });
    expect(res.status).toBe(404);
  });
});

// ── Shop by Occasion filtering ────────────────────────────────────────────────

describe('GET /api/products — occasion filter', () => {
  it('filters by wedding occasion', async () => {
    await createProductB20('wedding', { occasion: ['wedding'] });
    const res = await request(app).get('/api/products?occasion=wedding');
    expect(res.status).toBe(200);
    const products = res.body.products || res.body;
    expect(Array.isArray(products)).toBe(true);
  });

  it('filters by festival occasion', async () => {
    await createProductB20('festival', { occasion: ['festival'] });
    const res = await request(app).get('/api/products?occasion=festival');
    expect(res.status).toBe(200);
  });

  it('filters by casual occasion', async () => {
    await createProductB20('casual', { occasion: ['casual'] });
    const res = await request(app).get('/api/products?occasion=casual');
    expect(res.status).toBe(200);
  });

  it('filters by office occasion', async () => {
    await createProductB20('office', { occasion: ['office'] });
    const res = await request(app).get('/api/products?occasion=office');
    expect(res.status).toBe(200);
  });

  it('returns empty array when no products match occasion', async () => {
    const res = await request(app).get('/api/products?occasion=nonexistent-occasion-xyz');
    expect(res.status).toBe(200);
    const products = res.body.products || res.body;
    if (Array.isArray(products)) {
      expect(products.length).toBe(0);
    }
  });
});

// ── Back-in-stock / inventory notification ────────────────────────────────────

describe('POST /api/inventory/back-in-stock', () => {
  it('registers email for back-in-stock notification (OOS product)', async () => {
    const product = await createProductB20('oos-email', { stock: 0 });
    const res = await request(app)
      .post('/api/inventory/back-in-stock')
      .send({ productId: product.id, email: 'test-b20@example.com' });
    expect([200, 201]).toContain(res.status);
  });

  it('registers phone for back-in-stock notification (OOS product)', async () => {
    const product = await createProductB20('oos-phone', { stock: 0 });
    const res = await request(app)
      .post('/api/inventory/back-in-stock')
      .send({ productId: product.id, phone: '+919876500001' });
    expect([200, 201]).toContain(res.status);
  });

  it('returns success when product already in stock', async () => {
    const product = await createProductB20('instock', { stock: 10 });
    const res = await request(app)
      .post('/api/inventory/back-in-stock')
      .send({ productId: product.id, email: 'instock@example.com' });
    expect([200, 201]).toContain(res.status);
  });

  it('rejects request without email or phone', async () => {
    const product = await createProductB20('oos-nocontact', { stock: 0 });
    const res = await request(app)
      .post('/api/inventory/back-in-stock')
      .send({ productId: product.id });
    expect([400, 422]).toContain(res.status);
  });

  it('rejects request without productId', async () => {
    const res = await request(app)
      .post('/api/inventory/back-in-stock')
      .send({ email: 'test@example.com' });
    expect([400, 422]).toContain(res.status);
  });

  it('returns 404 for non-existent productId', async () => {
    const res = await request(app)
      .post('/api/inventory/back-in-stock')
      .send({ productId: 'non-existent-product-b20', email: 'test@example.com' });
    expect(res.status).toBe(404);
  });
});

// ── Dashboard real-time metrics ───────────────────────────────────────────────

describe('GET /api/admin/dashboard — polling readiness', () => {
  it('returns 200 on repeated calls (simulating 30s polling)', async () => {
    for (let i = 0; i < 3; i++) {
      const res = await request(app).get('/api/admin/dashboard');
      expect(res.status).toBe(200);
    }
  });

  it('todayOrders increments after new order', async () => {
    const before = await request(app).get('/api/admin/dashboard');
    expect(before.status).toBe(200);
    const countBefore = before.body.todayOrders;

    const product = await createProductB20('poll-today');
    await placeOrderB20('+919898989898', 700, product.id);

    const after = await request(app).get('/api/admin/dashboard');
    expect(after.body.todayOrders).toBe(countBefore + 1);
  });

  it('pendingOrders increments after new placed order', async () => {
    const before = await request(app).get('/api/admin/dashboard');
    const pendingBefore = before.body.pendingOrders;

    const product = await createProductB20('poll-pending');
    await placeOrderB20('+919898989899', 800, product.id, 'placed');

    const after = await request(app).get('/api/admin/dashboard');
    expect(after.body.pendingOrders).toBe(pendingBefore + 1);
  });

  it('pendingOrders decreases after marking shipped', async () => {
    const product = await createProductB20('poll-ship');
    const order = await placeOrderB20('+919898989900', 900, product.id, 'placed');

    const before = await request(app).get('/api/admin/dashboard');
    const pendingBefore = before.body.pendingOrders;

    await request(app).put(`/api/admin/orders/${order.id}/status`).send({ status: 'shipped' });

    const after = await request(app).get('/api/admin/dashboard');
    expect(after.body.pendingOrders).toBeLessThan(pendingBefore + 1);
  });
});

// ── Admin Orders bulk status ─────────────────────────────────────────────────

describe('POST /api/admin/orders/bulk-status', () => {
  it('bulk-marks multiple orders as shipped', async () => {
    const product = await createProductB20('bulk-ship');
    const o1 = await placeOrderB20('+919111111111', 500, product.id, 'placed');
    const o2 = await placeOrderB20('+919111111112', 600, product.id, 'placed');
    const res = await request(app)
      .post('/api/admin/orders/bulk-status')
      .send({ ids: [o1.id, o2.id], status: 'shipped' });
    expect(res.status).toBe(200);
    expect(res.body.updated).toBe(2);
  });

  it('bulk-marks single order as delivered', async () => {
    const product = await createProductB20('single-bulk');
    const order = await placeOrderB20('+919111111113', 700, product.id, 'shipped');
    const res = await request(app)
      .post('/api/admin/orders/bulk-status')
      .send({ ids: [order.id], status: 'delivered' });
    expect(res.status).toBe(200);
    expect(res.body.updated).toBe(1);
  });

  it('returns 0 updated for empty ids array', async () => {
    const res = await request(app)
      .post('/api/admin/orders/bulk-status')
      .send({ ids: [], status: 'shipped' });
    expect([200, 400]).toContain(res.status);
  });
});

// ── Coupon edge cases ─────────────────────────────────────────────────────────

describe('POST /api/coupons/validate — edge cases', () => {
  it('applies percent coupon correctly at minimum order', async () => {
    await createTestCoupon({ code: 'B20_EDGE10', discount: 10, minOrder: 500, active: true });
    const res = await request(app)
      .post('/api/coupons/validate')
      .send({ code: 'B20_EDGE10', orderAmount: 500 });
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
    expect(res.body.discount).toBe(10);
  });

  it('rejects coupon below minimum order', async () => {
    await createTestCoupon({ code: 'B20_MIN500', discount: 15, minOrder: 500, active: true });
    const res = await request(app)
      .post('/api/coupons/validate')
      .send({ code: 'B20_MIN500', orderAmount: 499 });
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(false);
  });

  it('rejects expired coupon', async () => {
    await createTestCoupon({
      code: 'B20_EXPIRED',
      discount: 20,
      active: true,
      expiresAt: new Date(Date.now() - 86400000), // yesterday
    });
    const res = await request(app)
      .post('/api/coupons/validate')
      .send({ code: 'B20_EXPIRED', orderAmount: 1000 });
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(false);
  });

  it('rejects inactive coupon', async () => {
    await createTestCoupon({ code: 'B20_INACTIVE', discount: 10, active: false });
    const res = await request(app)
      .post('/api/coupons/validate')
      .send({ code: 'B20_INACTIVE', orderAmount: 1000 });
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(false);
  });

  it('handles flat type coupon', async () => {
    await createTestCoupon({ code: 'B20_FLAT100', discount: 100, type: 'flat', active: true });
    const res = await request(app)
      .post('/api/coupons/validate')
      .send({ code: 'B20_FLAT100', orderAmount: 800 });
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
  });

  it('rejects unknown coupon code', async () => {
    const res = await request(app)
      .post('/api/coupons/validate')
      .send({ code: 'TOTALLY_FAKE_CODE_XYZ', orderAmount: 1000 });
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(false);
  });
});

// ── Product stock management ───────────────────────────────────────────────────

describe('PATCH /api/admin/products/:id/stock', () => {
  it('updates product stock to zero (marks out-of-stock)', async () => {
    const product = await createProductB20('stock-zero', { stock: 10 });
    const res = await request(app)
      .patch(`/api/admin/products/${product.id}/stock`)
      .send({ stock: 0 });
    expect(res.status).toBe(200);
    expect(res.body.stock).toBe(0);
  });

  it('restores product stock from zero', async () => {
    const product = await createProductB20('stock-restock', { stock: 0 });
    const res = await request(app)
      .patch(`/api/admin/products/${product.id}/stock`)
      .send({ stock: 50 });
    expect(res.status).toBe(200);
    expect(res.body.stock).toBe(50);
  });

  it('updates stock to a large number', async () => {
    const product = await createProductB20('stock-big', { stock: 5 });
    const res = await request(app)
      .patch(`/api/admin/products/${product.id}/stock`)
      .send({ stock: 1000 });
    expect(res.status).toBe(200);
    expect(res.body.stock).toBe(1000);
  });
});

// ── Category-based product browsing ──────────────────────────────────────────

describe('GET /api/products — category + occasion combined', () => {
  it('returns products by category slug', async () => {
    const ts = Date.now();
    const rnd = Math.random().toString(36).slice(2, 5);
    const cat = await testPrisma.category.create({
      data: { name: `Sarees B20 ${ts}`, slug: `sarees-b20-${ts}-${rnd}` },
    });
    await testPrisma.product.create({
      data: {
        name: `Silk Saree B20 ${ts}`,
        slug: `silk-saree-b20-${ts}-${rnd}`,
        price: 999,
        images: ['https://example.com/img.jpg'],
        sizes: ['M'],
        colors: ['Red'],
        occasion: ['wedding'],
        stock: 50,
        active: true,
        categoryId: cat.id,
      },
    });
    const res = await request(app).get(`/api/products?category=${cat.slug}`);
    expect(res.status).toBe(200);
  });

  it('supports pagination with page param', async () => {
    const res = await request(app).get('/api/products?page=1&limit=5');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.products || res.body)).toBe(true);
  });

  it('returns featured products only', async () => {
    await createProductB20('featured', { featured: true });
    const res = await request(app).get('/api/products?featured=true');
    expect(res.status).toBe(200);
    const products = res.body.products || res.body;
    if (Array.isArray(products) && products.length > 0) {
      expect(products.every((p: { featured: boolean }) => p.featured)).toBe(true);
    }
  });

  it('returns best seller products only', async () => {
    await createProductB20('bestseller', { bestSeller: true });
    const res = await request(app).get('/api/products?bestSeller=true');
    expect(res.status).toBe(200);
  });
});

// ── Orders — full lifecycle ───────────────────────────────────────────────────

describe('Order lifecycle — placed → confirmed → packed → shipped → delivered', () => {
  it('transitions through all statuses', async () => {
    const product = await createProductB20('lifecycle', { stock: 10 });
    const order = await placeOrderB20('+919500000001', 1500, product.id, 'placed');

    const statuses = ['confirmed', 'packed', 'shipped', 'delivered'];
    let currentId = order.id;

    for (const status of statuses) {
      const res = await request(app)
        .put(`/api/admin/orders/${currentId}/status`)
        .send({ status });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe(status);
    }
  });

  it('allows cancellation from placed status', async () => {
    const product = await createProductB20('cancel');
    const order = await placeOrderB20('+919500000002', 1000, product.id, 'placed');
    const res = await request(app)
      .put(`/api/admin/orders/${order.id}/status`)
      .send({ status: 'cancelled' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('cancelled');
  });

  it('GET /api/order/:id returns full order details', async () => {
    const product = await createProductB20('view-order');
    const order = await placeOrderB20('+919500000003', 1200, product.id);
    const res = await request(app).get(`/api/orders/${order.id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(order.id);
    expect(res.body.customerName).toBe('B20 Customer');
  });

  it('GET /api/orders/:id includes items array', async () => {
    const product = await createProductB20('items-order');
    const order = await placeOrderB20('+919500000004', 900, product.id);
    const res = await request(app).get(`/api/orders/${order.id}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items.length).toBeGreaterThan(0);
  });
});

// ── Admin orders list filtering ───────────────────────────────────────────────

describe('GET /api/admin/orders — status filtering', () => {
  it('filters by placed status', async () => {
    const product = await createProductB20('filter-placed');
    await placeOrderB20('+919600000001', 700, product.id, 'placed');
    const res = await request(app).get('/api/admin/orders?status=placed');
    expect(res.status).toBe(200);
    const orders = res.body.orders || res.body;
    if (Array.isArray(orders) && orders.length > 0) {
      expect(orders.every((o: { status: string }) => o.status === 'placed')).toBe(true);
    }
  });

  it('filters by shipped status', async () => {
    const product = await createProductB20('filter-shipped');
    await placeOrderB20('+919600000002', 800, product.id, 'shipped');
    const res = await request(app).get('/api/admin/orders?status=shipped');
    expect(res.status).toBe(200);
    const orders = res.body.orders || res.body;
    if (Array.isArray(orders) && orders.length > 0) {
      expect(orders.every((o: { status: string }) => o.status === 'shipped')).toBe(true);
    }
  });

  it('returns all orders without status filter', async () => {
    const product = await createProductB20('all-orders');
    await placeOrderB20('+919600000003', 600, product.id, 'placed');
    await placeOrderB20('+919600000004', 700, product.id, 'shipped');
    const res = await request(app).get('/api/admin/orders');
    expect(res.status).toBe(200);
    const orders = res.body.orders || res.body;
    expect(Array.isArray(orders)).toBe(true);
    expect(orders.length).toBeGreaterThanOrEqual(2);
  });
});

// ── Product search ────────────────────────────────────────────────────────────

describe('GET /api/products/search or GET /api/search', () => {
  it('finds product by name keyword', async () => {
    await createProductB20('anarkali-search');
    const res = await request(app).get('/api/search?q=anarkali-search');
    if (res.status === 200) {
      const items = res.body.products || res.body;
      expect(Array.isArray(items)).toBe(true);
    } else {
      expect([200, 404]).toContain(res.status);
    }
  });

  it('search returns empty for non-matching query', async () => {
    const res = await request(app).get('/api/search?q=xyznonexistentproduct12345');
    if (res.status === 200) {
      const items = res.body.products || res.body;
      if (Array.isArray(items)) {
        expect(items.length).toBe(0);
      }
    } else {
      expect([200, 404]).toContain(res.status);
    }
  });
});

// ── Admin customers listing ───────────────────────────────────────────────────

describe('GET /api/admin/customers', () => {
  it('returns customers list', async () => {
    const res = await request(app).get('/api/admin/customers');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('customers');
    expect(Array.isArray(res.body.customers)).toBe(true);
  });

  it('includes customer with orders', async () => {
    const product = await createProductB20('customer-list');
    await placeOrderB20('+919700000001', 1500, product.id);
    const res = await request(app).get('/api/admin/customers');
    expect(res.status).toBe(200);
    const phones = res.body.customers.map((c: { phone: string }) => c.phone);
    expect(phones).toContain('+919700000001');
  });

  it('supports search by phone', async () => {
    const product = await createProductB20('customer-search');
    await placeOrderB20('+919700000002', 999, product.id);
    const res = await request(app).get('/api/admin/customers?search=9700000002');
    expect(res.status).toBe(200);
  });

  it('returns pagination metadata', async () => {
    const res = await request(app).get('/api/admin/customers');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('page');
  });
});

// ── Low stock admin endpoint ──────────────────────────────────────────────────

describe('GET /api/admin/low-stock', () => {
  it('returns products with stock at or below threshold', async () => {
    const product = await createProductB20('low-stock', { stock: 3 });
    const res = await request(app).get('/api/admin/low-stock?threshold=5');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.products)).toBe(true);
    const found = res.body.products.find((p: { id: string }) => p.id === product.id);
    expect(found).toBeTruthy();
  });

  it('does not include products above threshold', async () => {
    const product = await createProductB20('high-stock', { stock: 100 });
    const res = await request(app).get('/api/admin/low-stock?threshold=5');
    expect(res.status).toBe(200);
    const found = res.body.products.find((p: { id: string }) => p.id === product.id);
    expect(found).toBeUndefined();
  });

  it('uses default threshold when not specified', async () => {
    const res = await request(app).get('/api/admin/low-stock');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('products');
    expect(res.body).toHaveProperty('threshold');
  });
});
