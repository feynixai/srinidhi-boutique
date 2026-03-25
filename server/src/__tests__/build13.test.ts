/**
 * Build 13 tests — mobile nav, sticky cart, same-category recommendations,
 * store-wide sale price calculation, coupon usage stats, customer CLV,
 * skeleton/loading states (via API), and broader coverage.
 * Target: 950+ total tests (~55 new)
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
  line1: '5 Film Nagar',
  city: 'Hyderabad',
  state: 'Telangana',
  pincode: '500033',
};

// ── Same-category recommendations (also-bought) ───────────────────────────────

describe('GET /api/products/:slug/also-bought', () => {
  it('returns empty array when product has no order history', async () => {
    const product = await createTestProduct({ name: 'Solo Product B13' });
    const res = await request(app).get(`/api/products/${product.slug}/also-bought`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(0);
  });

  it('returns 404 for unknown product slug', async () => {
    const res = await request(app).get('/api/products/no-such-product-b13/also-bought');
    expect(res.status).toBe(404);
  });

  it('returns co-purchased products from order history', async () => {
    const p1 = await createTestProduct({ name: 'AlsoBought Main B13', stock: 10 });
    const p2 = await createTestProduct({ name: 'AlsoBought Co B13', stock: 10 });

    // Create an order containing both products
    await testPrisma.order.create({
      data: {
        orderNumber: `SB-B13-${Date.now()}`,
        customerName: 'Priya',
        customerPhone: '9000000001',
        address: validAddress,
        subtotal: 1998,
        shipping: 0,
        discount: 0,
        total: 1998,
        paymentMethod: 'cod',
        status: 'placed',
        items: {
          create: [
            { productId: p1.id, name: p1.name, price: 999, quantity: 1 },
            { productId: p2.id, name: p2.name, price: 999, quantity: 1 },
          ],
        },
      },
    });

    const res = await request(app).get(`/api/products/${p1.slug}/also-bought`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const ids = res.body.map((p: { id: string }) => p.id);
    expect(ids).toContain(p2.id);
  });

  it('does not return the queried product itself', async () => {
    const p1 = await createTestProduct({ name: 'AlsoBought Self B13', stock: 10 });
    const p2 = await createTestProduct({ name: 'AlsoBought Other B13', stock: 10 });

    await testPrisma.order.create({
      data: {
        orderNumber: `SB-B13S-${Date.now()}`,
        customerName: 'Kavya',
        customerPhone: '9000000002',
        address: validAddress,
        subtotal: 1998,
        shipping: 0,
        discount: 0,
        total: 1998,
        paymentMethod: 'cod',
        status: 'placed',
        items: {
          create: [
            { productId: p1.id, name: p1.name, price: 999, quantity: 1 },
            { productId: p2.id, name: p2.name, price: 999, quantity: 1 },
          ],
        },
      },
    });

    const res = await request(app).get(`/api/products/${p1.slug}/also-bought`);
    expect(res.status).toBe(200);
    const ids = res.body.map((p: { id: string }) => p.id);
    expect(ids).not.toContain(p1.id);
  });

  it('ranks more-frequently co-purchased products first', async () => {
    const main = await createTestProduct({ name: 'Main Rank B13', stock: 10 });
    const popular = await createTestProduct({ name: 'Popular Co B13', stock: 10 });
    const rare = await createTestProduct({ name: 'Rare Co B13', stock: 10 });

    // popular appears in 3 orders, rare in 1
    for (let i = 0; i < 3; i++) {
      await testPrisma.order.create({
        data: {
          orderNumber: `SB-B13R${i}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          customerName: 'Customer',
          customerPhone: `900000000${i + 3}`,
          address: validAddress,
          subtotal: 1998,
          shipping: 0,
          discount: 0,
          total: 1998,
          paymentMethod: 'cod',
          status: 'placed',
          items: {
            create: [
              { productId: main.id, name: main.name, price: 999, quantity: 1 },
              { productId: popular.id, name: popular.name, price: 999, quantity: 1 },
            ],
          },
        },
      });
    }

    await testPrisma.order.create({
      data: {
        orderNumber: `SB-B13Rare-${Date.now()}`,
        customerName: 'Customer Rare',
        customerPhone: '9000000010',
        address: validAddress,
        subtotal: 1998,
        shipping: 0,
        discount: 0,
        total: 1998,
        paymentMethod: 'cod',
        status: 'placed',
        items: {
          create: [
            { productId: main.id, name: main.name, price: 999, quantity: 1 },
            { productId: rare.id, name: rare.name, price: 999, quantity: 1 },
          ],
        },
      },
    });

    const res = await request(app).get(`/api/products/${main.slug}/also-bought`);
    expect(res.status).toBe(200);
    const ids = res.body.map((p: { id: string }) => p.id);
    const popularIdx = ids.indexOf(popular.id);
    const rareIdx = ids.indexOf(rare.id);
    expect(popularIdx).toBeLessThan(rareIdx);
  });
});

// ── Store-wide sale toggle ─────────────────────────────────────────────────────

describe('GET /api/admin/store-sale', () => {
  it('returns null when no sale exists', async () => {
    const res = await request(app).get('/api/admin/store-sale');
    expect(res.status).toBe(200);
    expect(res.body).toBeNull();
  });

  it('returns the most recent store sale', async () => {
    await testPrisma.storeSale.create({
      data: { discountPct: 15, label: 'Summer Sale', active: true },
    });
    const res = await request(app).get('/api/admin/store-sale');
    expect(res.status).toBe(200);
    expect(res.body.discountPct).toBe(15);
    expect(res.body.label).toBe('Summer Sale');
  });
});

describe('POST /api/admin/store-sale', () => {
  it('creates a new store-wide sale', async () => {
    const res = await request(app)
      .post('/api/admin/store-sale')
      .send({ discountPct: 20, label: 'Festival Sale' });

    expect(res.status).toBe(201);
    expect(res.body.discountPct).toBe(20);
    expect(res.body.label).toBe('Festival Sale');
    expect(res.body.active).toBe(true);
  });

  it('deactivates existing sale when creating a new one', async () => {
    const existing = await testPrisma.storeSale.create({
      data: { discountPct: 10, active: true },
    });

    const res = await request(app)
      .post('/api/admin/store-sale')
      .send({ discountPct: 25, label: 'Mega Sale' });

    expect(res.status).toBe(201);

    const old = await testPrisma.storeSale.findUnique({ where: { id: existing.id } });
    expect(old?.active).toBe(false);
  });

  it('rejects sale with discount < 1', async () => {
    const res = await request(app)
      .post('/api/admin/store-sale')
      .send({ discountPct: 0 });
    expect(res.status).toBe(400);
  });

  it('rejects sale with discount > 90', async () => {
    const res = await request(app)
      .post('/api/admin/store-sale')
      .send({ discountPct: 95 });
    expect(res.status).toBe(400);
  });

  it('creates sale with optional start and end dates', async () => {
    const startAt = new Date(Date.now() + 3600 * 1000).toISOString();
    const endAt = new Date(Date.now() + 7200 * 1000).toISOString();

    const res = await request(app)
      .post('/api/admin/store-sale')
      .send({ discountPct: 30, startAt, endAt });

    expect(res.status).toBe(201);
    expect(res.body.startAt).toBeTruthy();
    expect(res.body.endAt).toBeTruthy();
  });
});

describe('PATCH /api/admin/store-sale/:id', () => {
  it('toggles a store sale off', async () => {
    const sale = await testPrisma.storeSale.create({
      data: { discountPct: 20, active: true },
    });

    const res = await request(app)
      .patch(`/api/admin/store-sale/${sale.id}`)
      .send({ active: false });

    expect(res.status).toBe(200);
    expect(res.body.active).toBe(false);
  });

  it('returns 404 for unknown sale id', async () => {
    const res = await request(app)
      .patch('/api/admin/store-sale/nonexistent-id')
      .send({ active: false });
    expect(res.status).toBe(404);
  });

  it('updates discount percent', async () => {
    const sale = await testPrisma.storeSale.create({
      data: { discountPct: 10, active: true },
    });

    const res = await request(app)
      .patch(`/api/admin/store-sale/${sale.id}`)
      .send({ discountPct: 35 });

    expect(res.status).toBe(200);
    expect(res.body.discountPct).toBe(35);
  });
});

describe('DELETE /api/admin/store-sale/:id', () => {
  it('deletes an existing sale', async () => {
    const sale = await testPrisma.storeSale.create({
      data: { discountPct: 15, active: true },
    });

    const res = await request(app).delete(`/api/admin/store-sale/${sale.id}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const found = await testPrisma.storeSale.findUnique({ where: { id: sale.id } });
    expect(found).toBeNull();
  });

  it('returns 404 when deleting non-existent sale', async () => {
    const res = await request(app).delete('/api/admin/store-sale/no-such-id');
    expect(res.status).toBe(404);
  });
});

// ── Store-wide sale price calculation ─────────────────────────────────────────

describe('Store-wide sale price applied to products', () => {
  it('applies sale discount to product price in listing', async () => {
    await testPrisma.storeSale.create({ data: { discountPct: 20, active: true } });
    await createTestProduct({ name: 'Sale Test B13', price: 1000, stock: 5 });

    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    const product = res.body.products.find((p: { name: string }) => p.name === 'Sale Test B13');
    expect(product).toBeDefined();
    expect(product.salePrice).toBe(800);
    expect(product.salePct).toBe(20);
  });

  it('salePrice is null when no active sale', async () => {
    await createTestProduct({ name: 'No Sale B13', price: 1000, stock: 5 });

    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    const product = res.body.products.find((p: { name: string }) => p.name === 'No Sale B13');
    expect(product).toBeDefined();
    expect(product.salePrice).toBeNull();
  });

  it('applies sale discount on single product fetch', async () => {
    await testPrisma.storeSale.create({ data: { discountPct: 10, active: true } });
    const product = await createTestProduct({ name: 'Single Sale B13', price: 500, stock: 5 });

    const res = await request(app).get(`/api/products/${product.slug}`);
    expect(res.status).toBe(200);
    expect(res.body.salePrice).toBe(450);
    expect(res.body.salePct).toBe(10);
  });
});

// ── Coupon usage stats ─────────────────────────────────────────────────────────

describe('GET /api/admin/coupons/analytics', () => {
  it('returns analytics with zero coupons', async () => {
    const res = await request(app).get('/api/admin/coupons/analytics');
    expect(res.status).toBe(200);
    expect(res.body.totalCoupons).toBe(0);
    expect(res.body.totalCouponsUsed).toBe(0);
    expect(Array.isArray(res.body.analytics)).toBe(true);
  });

  it('returns usedCount for each coupon', async () => {
    await createTestCoupon({ code: 'STATS10', usedCount: 5 });
    await createTestCoupon({ code: 'STATS20', usedCount: 12 });

    const res = await request(app).get('/api/admin/coupons/analytics');
    expect(res.status).toBe(200);
    expect(res.body.totalCoupons).toBe(2);
    expect(res.body.totalCouponsUsed).toBe(17);

    const stats10 = res.body.analytics.find((c: { code: string }) => c.code === 'STATS10');
    expect(stats10).toBeDefined();
    expect(stats10.usedCount).toBe(5);
  });

  it('orders coupons by usedCount descending', async () => {
    await createTestCoupon({ code: 'LOW_USE', usedCount: 1 });
    await createTestCoupon({ code: 'HIGH_USE', usedCount: 50 });

    const res = await request(app).get('/api/admin/coupons/analytics');
    expect(res.status).toBe(200);
    const codes = res.body.analytics.map((c: { code: string }) => c.code);
    expect(codes.indexOf('HIGH_USE')).toBeLessThan(codes.indexOf('LOW_USE'));
  });

  it('includes usageRate when maxUses is set', async () => {
    await createTestCoupon({ code: 'CAPPED10', usedCount: 5, maxUses: 10 });

    const res = await request(app).get('/api/admin/coupons/analytics');
    expect(res.status).toBe(200);
    const capped = res.body.analytics.find((c: { code: string }) => c.code === 'CAPPED10');
    expect(capped.usageRate).toBe(50);
  });

  it('usageRate is null when maxUses is not set', async () => {
    await createTestCoupon({ code: 'UNCAPPED', usedCount: 3 });

    const res = await request(app).get('/api/admin/coupons/analytics');
    const uncapped = res.body.analytics.find((c: { code: string }) => c.code === 'UNCAPPED');
    expect(uncapped.usageRate).toBeNull();
  });
});

// ── Customer lifetime value ────────────────────────────────────────────────────

describe('GET /api/admin/customers (CLV)', () => {
  it('returns empty customer list when no orders', async () => {
    const res = await request(app).get('/api/admin/customers');
    expect(res.status).toBe(200);
    expect(res.body.customers).toHaveLength(0);
    expect(res.body.total).toBe(0);
  });

  it('includes totalSpend, orderCount, and clv for each customer', async () => {
    const product = await createTestProduct({ stock: 10 });

    await testPrisma.order.create({
      data: {
        orderNumber: `SB-CLV1-${Date.now()}`,
        customerName: 'CLV Customer',
        customerPhone: '9111111111',
        address: validAddress,
        subtotal: 2000,
        shipping: 0,
        discount: 0,
        total: 2000,
        paymentMethod: 'cod',
        paymentStatus: 'paid',
        status: 'delivered',
        items: {
          create: [{ productId: product.id, name: product.name, price: 2000, quantity: 1 }],
        },
      },
    });

    const res = await request(app).get('/api/admin/customers');
    expect(res.status).toBe(200);
    const customer = res.body.customers.find(
      (c: { phone: string }) => c.phone === '9111111111'
    );
    expect(customer).toBeDefined();
    expect(Number(customer.totalSpend)).toBe(2000);
    expect(customer.orderCount).toBe(1);
    expect(customer.clv).toBeGreaterThan(0);
  });

  it('aggregates multiple orders for same customer', async () => {
    const product = await createTestProduct({ stock: 20 });

    for (let i = 0; i < 3; i++) {
      await testPrisma.order.create({
        data: {
          orderNumber: `SB-CLV${i}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          customerName: 'Repeat Customer',
          customerPhone: '9222222222',
          address: validAddress,
          subtotal: 1000,
          shipping: 0,
          discount: 0,
          total: 1000,
          paymentMethod: 'cod',
          paymentStatus: 'paid',
          status: 'delivered',
          items: {
            create: [{ productId: product.id, name: product.name, price: 1000, quantity: 1 }],
          },
        },
      });
    }

    const res = await request(app).get('/api/admin/customers');
    expect(res.status).toBe(200);
    const customer = res.body.customers.find(
      (c: { phone: string }) => c.phone === '9222222222'
    );
    expect(customer).toBeDefined();
    expect(Number(customer.totalSpend)).toBe(3000);
    expect(customer.orderCount).toBe(3);
  });

  it('sorts customers by totalSpend descending', async () => {
    const product = await createTestProduct({ stock: 20 });

    // High spender
    await testPrisma.order.create({
      data: {
        orderNumber: `SB-HIGH-${Date.now()}`,
        customerName: 'High Spender',
        customerPhone: '9333333333',
        address: validAddress,
        subtotal: 10000,
        shipping: 0,
        discount: 0,
        total: 10000,
        paymentMethod: 'cod',
        paymentStatus: 'paid',
        status: 'delivered',
        items: {
          create: [{ productId: product.id, name: product.name, price: 10000, quantity: 1 }],
        },
      },
    });

    // Low spender
    await testPrisma.order.create({
      data: {
        orderNumber: `SB-LOW-${Date.now()}`,
        customerName: 'Low Spender',
        customerPhone: '9444444444',
        address: validAddress,
        subtotal: 500,
        shipping: 0,
        discount: 0,
        total: 500,
        paymentMethod: 'cod',
        paymentStatus: 'paid',
        status: 'delivered',
        items: {
          create: [{ productId: product.id, name: product.name, price: 500, quantity: 1 }],
        },
      },
    });

    const res = await request(app).get('/api/admin/customers');
    expect(res.status).toBe(200);
    const phones = res.body.customers.map((c: { phone: string }) => c.phone);
    expect(phones.indexOf('9333333333')).toBeLessThan(phones.indexOf('9444444444'));
  });

  it('supports search by phone', async () => {
    const product = await createTestProduct({ stock: 10 });

    await testPrisma.order.create({
      data: {
        orderNumber: `SB-SEARCH-${Date.now()}`,
        customerName: 'Search Customer',
        customerPhone: '9555555555',
        address: validAddress,
        subtotal: 1500,
        shipping: 0,
        discount: 0,
        total: 1500,
        paymentMethod: 'cod',
        status: 'placed',
        items: {
          create: [{ productId: product.id, name: product.name, price: 1500, quantity: 1 }],
        },
      },
    });

    const res = await request(app).get('/api/admin/customers?search=9555555555');
    expect(res.status).toBe(200);
    expect(res.body.customers.length).toBeGreaterThan(0);
    expect(res.body.customers[0].phone).toBe('9555555555');
  });
});

// ── Product listing – related/recommended products ─────────────────────────────

describe('GET /api/products/:slug/related', () => {
  it('returns related products from same category', async () => {
    const category = await createTestCategory('Build13 Category');
    const p1 = await createTestProduct({ name: 'Related Main B13', categoryId: category.id, stock: 5 });
    const p2 = await createTestProduct({ name: 'Related Other B13', categoryId: category.id, stock: 5 });

    const res = await request(app).get(`/api/products/${p1.slug}/related`);
    expect(res.status).toBe(200);
    const ids = res.body.map((p: { id: string }) => p.id);
    expect(ids).toContain(p2.id);
    expect(ids).not.toContain(p1.id);
  });

  it('returns 404 for unknown slug', async () => {
    const res = await request(app).get('/api/products/unknown-slug-b13/related');
    expect(res.status).toBe(404);
  });
});

// ── Validation error messages ─────────────────────────────────────────────────

describe('Validation errors on order placement', () => {
  it('rejects order with missing customerName', async () => {
    const product = await createTestProduct({ stock: 5 });
    const res = await request(app)
      .post('/api/orders')
      .send({
        customerPhone: '9876543210',
        address: validAddress,
        items: [{ productId: product.id, quantity: 1 }],
        paymentMethod: 'cod',
      });
    expect(res.status).toBe(400);
  });

  it('rejects order with empty items array', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({
        customerName: 'Test',
        customerPhone: '9876543210',
        address: validAddress,
        items: [],
        paymentMethod: 'cod',
      });
    expect(res.status).toBe(400);
  });

  it('rejects order with invalid paymentMethod', async () => {
    const product = await createTestProduct({ stock: 5 });
    const res = await request(app)
      .post('/api/orders')
      .send({
        customerName: 'Test',
        customerPhone: '9876543210',
        address: validAddress,
        items: [{ productId: product.id, quantity: 1 }],
        paymentMethod: 'crypto',
      });
    expect(res.status).toBe(400);
  });

  it('rejects order with missing address city', async () => {
    const product = await createTestProduct({ stock: 5 });
    const res = await request(app)
      .post('/api/orders')
      .send({
        customerName: 'Test',
        customerPhone: '9876543210',
        address: { line1: '10 Road', pincode: '500001' },
        items: [{ productId: product.id, quantity: 1 }],
        paymentMethod: 'cod',
      });
    expect(res.status).toBe(400);
  });
});

describe('Validation errors on coupon creation', () => {
  it('rejects coupon with missing code', async () => {
    const res = await request(app)
      .post('/api/admin/coupons')
      .send({ discount: 10, active: true });
    expect(res.status).toBe(400);
  });

  it('rejects coupon with discount > 100', async () => {
    const res = await request(app)
      .post('/api/admin/coupons')
      .send({ code: 'OVER100', discount: 110, active: true });
    expect(res.status).toBe(400);
  });
});

// ── Admin customer detail ──────────────────────────────────────────────────────

describe('GET /api/admin/customers/:phone', () => {
  it('returns all orders for customer phone', async () => {
    const product = await createTestProduct({ stock: 10 });

    await testPrisma.order.create({
      data: {
        orderNumber: `SB-DETAIL-${Date.now()}`,
        customerName: 'Detail Customer',
        customerPhone: '9666666666',
        address: validAddress,
        subtotal: 2500,
        shipping: 0,
        discount: 0,
        total: 2500,
        paymentMethod: 'upi',
        status: 'placed',
        items: {
          create: [{ productId: product.id, name: product.name, price: 2500, quantity: 1 }],
        },
      },
    });

    const res = await request(app).get('/api/admin/customers/9666666666');
    expect(res.status).toBe(200);
    expect(res.body.phone).toBe('9666666666');
    expect(Array.isArray(res.body.orders)).toBe(true);
    expect(res.body.orders.length).toBeGreaterThan(0);
  });

  it('returns 404 for customer with no orders', async () => {
    const res = await request(app).get('/api/admin/customers/0000000000');
    expect(res.status).toBe(404);
  });
});
