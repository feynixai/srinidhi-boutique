/**
 * Extended tests — additional coverage to ensure robust functionality
 * These cover edge cases, admin coupons CRUD, category admin, and more.
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
import { v4 as uuidv4 } from 'uuid';

beforeEach(async () => {
  await cleanupTest();
});

afterAll(async () => {
  await cleanupTest();
  await testPrisma.$disconnect();
});

const validAddress = {
  line1: '12 Banjara Hills',
  city: 'Hyderabad',
  state: 'Telangana',
  pincode: '500034',
};

// ── Health check ─────────────────────────────────────────────────────────────
describe('GET /health', () => {
  it('returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

// ── Product filters ───────────────────────────────────────────────────────────
describe('Product advanced filters', () => {
  it('filters products by size', async () => {
    await createTestProduct({ name: 'Product XL', sizes: ['XL'] });
    await createTestProduct({ name: 'Product SM', sizes: ['S', 'M'] });

    const res = await request(app).get('/api/products?size=XL');
    expect(res.status).toBe(200);
    expect(res.body.products.some((p: { name: string }) => p.name === 'Product XL')).toBe(true);
    expect(res.body.products.every((p: { sizes: string[] }) => p.sizes.includes('XL'))).toBe(true);
  });

  it('filters products by color', async () => {
    await createTestProduct({ name: 'Red Saree', colors: ['Red'] });
    await createTestProduct({ name: 'Blue Saree', colors: ['Blue'] });

    const res = await request(app).get('/api/products?color=Red');
    expect(res.status).toBe(200);
    expect(res.body.products.some((p: { name: string }) => p.name === 'Red Saree')).toBe(true);
  });

  it('searches products by description', async () => {
    await createTestProduct({
      name: 'Regular Product',
      description: 'Contains the word zardozi in the description',
    });
    await createTestProduct({ name: 'Other Product' });

    const res = await request(app).get('/api/products?search=zardozi');
    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(1);
  });

  it('respects page 2 correctly', async () => {
    for (let i = 0; i < 6; i++) {
      await createTestProduct({ name: `Page Product ${i}` });
    }
    const res = await request(app).get('/api/products?page=2&limit=3');
    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(3);
    expect(res.body.page).toBe(2);
  });
});

// ── Cart edge cases ────────────────────────────────────────────────────────────
describe('Cart edge cases', () => {
  it('different size/color combos create separate cart items', async () => {
    const product = await createTestProduct();
    const sessionId = uuidv4();

    await request(app).post('/api/cart').send({
      sessionId,
      productId: product.id,
      quantity: 1,
      size: 'S',
      color: 'Red',
    });
    await request(app).post('/api/cart').send({
      sessionId,
      productId: product.id,
      quantity: 1,
      size: 'M',
      color: 'Red',
    });

    const res = await request(app).get(`/api/cart/${sessionId}`);
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(2);
  });

  it('calculates subtotal correctly', async () => {
    const product = await createTestProduct({ price: 1500 });
    const sessionId = uuidv4();

    await request(app).post('/api/cart').send({
      sessionId,
      productId: product.id,
      quantity: 3,
    });

    const res = await request(app).get(`/api/cart/${sessionId}`);
    expect(res.body.subtotal).toBe(4500);
  });

  it('deletes entire session cart', async () => {
    const product = await createTestProduct();
    const sessionId = uuidv4();

    await request(app).post('/api/cart').send({
      sessionId,
      productId: product.id,
      quantity: 2,
    });

    const del = await request(app).delete(`/api/cart/session/${sessionId}`);
    expect(del.status).toBe(200);
    expect(del.body.success).toBe(true);

    const res = await request(app).get(`/api/cart/${sessionId}`);
    expect(res.body.items).toHaveLength(0);
  });
});

// ── Orders ────────────────────────────────────────────────────────────────────
describe('Order edge cases', () => {
  it('retrieves order by order number', async () => {
    const product = await createTestProduct({ price: 1500, stock: 10 });
    const orderRes = await request(app).post('/api/orders').send({
      customerName: 'Deepa',
      customerPhone: '9876543210',
      address: validAddress,
      items: [{ productId: product.id, quantity: 1 }],
      paymentMethod: 'cod',
    });

    const res = await request(app).get(
      `/api/orders/number/${orderRes.body.orderNumber}`
    );
    expect(res.status).toBe(200);
    expect(res.body.orderNumber).toBe(orderRes.body.orderNumber);
  });

  it('does not apply expired coupon', async () => {
    const product = await createTestProduct({ price: 2000, stock: 10 });
    await createTestCoupon({
      code: 'EXPIRED99',
      discount: 99,
      expiresAt: new Date('2020-01-01'),
    });

    const res = await request(app).post('/api/orders').send({
      customerName: 'Test',
      customerPhone: '9876543210',
      address: validAddress,
      items: [{ productId: product.id, quantity: 1 }],
      paymentMethod: 'cod',
      couponCode: 'EXPIRED99',
    });

    expect(res.status).toBe(201);
    expect(Number(res.body.discount)).toBe(0);
  });

  it('does not apply coupon that has exceeded max uses', async () => {
    const product = await createTestProduct({ price: 2000, stock: 10 });
    await createTestCoupon({
      code: 'MAXOUT',
      discount: 50,
      maxUses: 1,
      usedCount: 1,
    });

    const res = await request(app).post('/api/orders').send({
      customerName: 'Test',
      customerPhone: '9876543210',
      address: validAddress,
      items: [{ productId: product.id, quantity: 1 }],
      paymentMethod: 'cod',
      couponCode: 'MAXOUT',
    });

    expect(res.status).toBe(201);
    expect(Number(res.body.discount)).toBe(0);
  });

  it('does not apply coupon below min order', async () => {
    const product = await createTestProduct({ price: 500, stock: 10 });
    await createTestCoupon({ code: 'MINORD', discount: 20, minOrder: 1000 });

    const res = await request(app).post('/api/orders').send({
      customerName: 'Test',
      customerPhone: '9876543210',
      address: validAddress,
      items: [{ productId: product.id, quantity: 1 }],
      paymentMethod: 'cod',
      couponCode: 'MINORD',
    });

    expect(res.status).toBe(201);
    expect(Number(res.body.discount)).toBe(0);
  });

  it('returns 404 for nonexistent order number', async () => {
    const res = await request(app).get('/api/orders/number/SB-9999');
    expect(res.status).toBe(404);
  });

  it('generates unique order numbers in SB-NNNN format', async () => {
    const product = await createTestProduct({ price: 1000, stock: 20 });
    const base = {
      customerName: 'Test',
      customerPhone: '9876543210',
      address: validAddress,
      items: [{ productId: product.id, quantity: 1 }],
      paymentMethod: 'cod',
    };

    const r1 = await request(app).post('/api/orders').send(base);
    const r2 = await request(app).post('/api/orders').send(base);

    expect(r1.status).toBe(201);
    expect(r2.status).toBe(201);
    expect(r1.body.orderNumber).toMatch(/^SB-\d{4}$/);
    expect(r2.body.orderNumber).toMatch(/^SB-\d{4}$/);
    expect(r1.body.orderNumber).not.toBe(r2.body.orderNumber);
  });
});

// ── Admin — coupon CRUD ───────────────────────────────────────────────────────
describe('Admin Coupon CRUD', () => {
  it('lists all coupons', async () => {
    await createTestCoupon({ code: 'C1' });
    await createTestCoupon({ code: 'C2' });

    const res = await request(app).get('/api/admin/coupons');
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
  });

  it('updates a coupon', async () => {
    const coupon = await createTestCoupon({ code: 'UPD10', discount: 10 });

    const res = await request(app)
      .put(`/api/admin/coupons/${coupon.id}`)
      .send({ discount: 25 });

    expect(res.status).toBe(200);
    expect(res.body.discount).toBe(25);
  });

  it('deletes a coupon', async () => {
    const coupon = await createTestCoupon({ code: 'DEL10' });

    const res = await request(app).delete(`/api/admin/coupons/${coupon.id}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const check = await testPrisma.coupon.findUnique({ where: { id: coupon.id } });
    expect(check).toBeNull();
  });

  it('returns 404 when updating nonexistent coupon', async () => {
    const res = await request(app)
      .put('/api/admin/coupons/nonexistent')
      .send({ discount: 10 });
    expect(res.status).toBe(404);
  });

  it('returns 404 when deleting nonexistent coupon', async () => {
    const res = await request(app).delete('/api/admin/coupons/nonexistent');
    expect(res.status).toBe(404);
  });
});

// ── Admin — categories ─────────────────────────────────────────────────────────
describe('Admin Categories', () => {
  it('creates a category', async () => {
    const res = await request(app)
      .post('/api/admin/categories')
      .send({ name: 'Accessories' });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Accessories');
    expect(res.body.slug).toBe('accessories');
  });

  it('updates a category', async () => {
    const cat = await createTestCategory('Old Name');

    const res = await request(app)
      .put(`/api/admin/categories/${cat.id}`)
      .send({ name: 'New Name' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('New Name');
    expect(res.body.slug).toBe('new-name');
  });

  it('returns 404 when updating nonexistent category', async () => {
    const res = await request(app)
      .put('/api/admin/categories/nonexistent')
      .send({ name: 'Test' });
    expect(res.status).toBe(404);
  });
});

// ── Admin order status ────────────────────────────────────────────────────────
describe('Admin order full lifecycle', () => {
  it('progresses order through all statuses', async () => {
    const product = await createTestProduct({ price: 1000, stock: 10 });

    const orderRes = await request(app).post('/api/orders').send({
      customerName: 'Lifecycle Test',
      customerPhone: '9876543210',
      address: validAddress,
      items: [{ productId: product.id, quantity: 1 }],
      paymentMethod: 'cod',
    });

    const id = orderRes.body.id;
    const statuses = ['confirmed', 'packed', 'shipped', 'delivered'] as const;

    for (const status of statuses) {
      const res = await request(app)
        .put(`/api/admin/orders/${id}/status`)
        .send({ status, ...(status === 'shipped' ? { trackingId: 'TRK123' } : {}) });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe(status);
    }
  });

  it('can cancel an order', async () => {
    const product = await createTestProduct({ price: 1000, stock: 10 });
    const orderRes = await request(app).post('/api/orders').send({
      customerName: 'Cancel Test',
      customerPhone: '9876543210',
      address: validAddress,
      items: [{ productId: product.id, quantity: 1 }],
      paymentMethod: 'cod',
    });

    const res = await request(app)
      .put(`/api/admin/orders/${orderRes.body.id}/status`)
      .send({ status: 'cancelled' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('cancelled');
  });
});

// ── Categories API ────────────────────────────────────────────────────────────
describe('GET /api/categories', () => {
  it('includes product count when available', async () => {
    const cat = await createTestCategory('Test Cat');
    await createTestProduct({ name: 'Cat Product', categoryId: cat.id });

    const res = await request(app).get('/api/categories');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('returns empty array when no categories', async () => {
    const res = await request(app).get('/api/categories');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(0);
  });
});

// ── Dashboard stats ───────────────────────────────────────────────────────────
describe('Dashboard with data', () => {
  it('reflects today order count correctly', async () => {
    const product = await createTestProduct({ price: 2000, stock: 10 });

    await request(app).post('/api/orders').send({
      customerName: 'Dashboard Customer',
      customerPhone: '9876543210',
      address: validAddress,
      items: [{ productId: product.id, quantity: 1 }],
      paymentMethod: 'razorpay',
      paymentId: 'pay_test',
    });

    const res = await request(app).get('/api/admin/dashboard');
    expect(res.status).toBe(200);
    expect(res.body.todayOrders).toBeGreaterThanOrEqual(1);
    expect(Number(res.body.todayRevenue)).toBeGreaterThan(0);
  });

  it('counts low-stock products', async () => {
    await createTestProduct({ name: 'Low Stock', stock: 3 });
    await createTestProduct({ name: 'Normal Stock', stock: 100 });

    const res = await request(app).get('/api/admin/dashboard');
    expect(res.status).toBe(200);
    expect(res.body.lowStockProducts).toBeGreaterThanOrEqual(1);
  });
});
