/**
 * Admin extended tests — customers, analytics, order detail, settings
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
  line1: '1 Road',
  city: 'Hyderabad',
  state: 'Telangana',
  pincode: '500001',
};

async function placeTestOrder(customerPhone: string, customerName = 'Test Customer') {
  const product = await createTestProduct({ stock: 100 });
  const res = await request(app).post('/api/orders').send({
    customerName,
    customerPhone,
    address: validAddress,
    items: [{ productId: product.id, quantity: 1 }],
    paymentMethod: 'cod',
  });
  return { order: res.body, product };
}

// ── Admin Customers ──────────────────────────────────────────────────────────
describe('GET /api/admin/customers', () => {
  it('returns customer list derived from orders', async () => {
    await placeTestOrder('9876543210', 'Priya');
    await placeTestOrder('9876543210', 'Priya');
    await placeTestOrder('9999999999', 'Meera');

    const res = await request(app).get('/api/admin/customers');
    expect(res.status).toBe(200);
    expect(res.body.customers).toBeDefined();
    expect(res.body.total).toBeGreaterThanOrEqual(2);
    const phones = res.body.customers.map((c: { phone: string }) => c.phone);
    expect(phones).toContain('9876543210');
    expect(phones).toContain('9999999999');
  });

  it('aggregates multiple orders per customer', async () => {
    await placeTestOrder('8888888888', 'Anitha');
    await placeTestOrder('8888888888', 'Anitha');

    const res = await request(app).get('/api/admin/customers');
    expect(res.status).toBe(200);
    const customer = res.body.customers.find((c: { phone: string }) => c.phone === '8888888888');
    expect(customer?.orderCount).toBe(2);
  });

  it('returns paginated results', async () => {
    const res = await request(app).get('/api/admin/customers?page=1&limit=5');
    expect(res.status).toBe(200);
    expect(res.body.page).toBe(1);
    expect(res.body.totalPages).toBeDefined();
  });

  it('returns empty list when no orders', async () => {
    const res = await request(app).get('/api/admin/customers');
    expect(res.status).toBe(200);
    expect(res.body.customers).toEqual([]);
  });
});

describe('GET /api/admin/customers/:phone', () => {
  it('returns customer detail with order history', async () => {
    await placeTestOrder('7777777777', 'Kavitha');

    const res = await request(app).get('/api/admin/customers/7777777777');
    expect(res.status).toBe(200);
    expect(res.body.phone).toBe('7777777777');
    expect(res.body.name).toBe('Kavitha');
    expect(res.body.orders).toHaveLength(1);
    expect(res.body.totalSpend).toBeGreaterThan(0);
  });

  it('returns 404 for unknown phone', async () => {
    const res = await request(app).get('/api/admin/customers/0000000000');
    expect(res.status).toBe(404);
  });
});

// ── Admin Analytics ───────────────────────────────────────────────────────────
describe('GET /api/admin/analytics', () => {
  it('returns analytics structure', async () => {
    const res = await request(app).get('/api/admin/analytics');
    expect(res.status).toBe(200);
    expect(res.body.totalRevenue).toBeDefined();
    expect(res.body.totalOrders).toBeDefined();
    expect(res.body.avgOrderValue).toBeDefined();
    expect(res.body.dailyRevenue).toBeDefined();
    expect(res.body.topProducts).toBeDefined();
    expect(res.body.revenueByPayment).toBeDefined();
  });

  it('returns empty analytics for no orders', async () => {
    const res = await request(app).get('/api/admin/analytics');
    expect(res.status).toBe(200);
    expect(res.body.totalRevenue).toBe(0);
    expect(res.body.totalOrders).toBe(0);
  });

  it('returns daily revenue array matching period', async () => {
    const res = await request(app).get('/api/admin/analytics?period=7');
    expect(res.status).toBe(200);
    expect(res.body.dailyRevenue).toHaveLength(7);
  });

  it('accepts 30 day period', async () => {
    const res = await request(app).get('/api/admin/analytics?period=30');
    expect(res.status).toBe(200);
    expect(res.body.dailyRevenue).toHaveLength(30);
  });

  it('accepts 90 day period', async () => {
    const res = await request(app).get('/api/admin/analytics?period=90');
    expect(res.status).toBe(200);
    expect(res.body.dailyRevenue).toHaveLength(90);
  });
});

// ── Admin Order Detail ────────────────────────────────────────────────────────
describe('GET /api/admin/orders/:id', () => {
  it('returns full order detail with product info', async () => {
    const product = await createTestProduct({ stock: 50 });
    const orderRes = await request(app).post('/api/orders').send({
      customerName: 'Lakshmi',
      customerPhone: '9000000001',
      address: validAddress,
      items: [{ productId: product.id, quantity: 2 }],
      paymentMethod: 'upi',
    });

    const res = await request(app).get(`/api/admin/orders/${orderRes.body.id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(orderRes.body.id);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].product).toBeDefined();
  });

  it('returns 404 for non-existent order', async () => {
    const res = await request(app).get('/api/admin/orders/nonexistent-id');
    expect(res.status).toBe(404);
  });
});

// ── Admin Products GET by ID ──────────────────────────────────────────────────
describe('GET /api/admin/products/:id', () => {
  it('returns product by id', async () => {
    const product = await createTestProduct({ name: 'Admin Product Test' });
    const res = await request(app).get(`/api/admin/products/${product.id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(product.id);
    expect(res.body.name).toBe('Admin Product Test');
  });

  it('returns 404 for non-existent product', async () => {
    const res = await request(app).get('/api/admin/products/nonexistent');
    expect(res.status).toBe(404);
  });
});

// ── Orders by Phone ───────────────────────────────────────────────────────────
describe('GET /api/orders/by-phone/:phone', () => {
  it('returns orders for given phone number', async () => {
    const product = await createTestProduct({ stock: 50 });
    await request(app).post('/api/orders').send({
      customerName: 'Sunita',
      customerPhone: '9123456789',
      address: validAddress,
      items: [{ productId: product.id, quantity: 1 }],
      paymentMethod: 'cod',
    });

    const res = await request(app).get('/api/orders/by-phone/9123456789');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].customerPhone).toBe('9123456789');
  });

  it('returns empty array for unknown phone', async () => {
    const res = await request(app).get('/api/orders/by-phone/0000000000');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns multiple orders for same phone', async () => {
    const product = await createTestProduct({ stock: 100 });
    const orderData = {
      customerName: 'Repeated Customer',
      customerPhone: '9555555555',
      address: validAddress,
      items: [{ productId: product.id, quantity: 1 }],
      paymentMethod: 'cod',
    };
    await request(app).post('/api/orders').send(orderData);
    await request(app).post('/api/orders').send(orderData);

    const res = await request(app).get('/api/orders/by-phone/9555555555');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  it('includes order items with product info', async () => {
    const product = await createTestProduct({ stock: 50 });
    await request(app).post('/api/orders').send({
      customerName: 'Deepa',
      customerPhone: '9444444444',
      address: validAddress,
      items: [{ productId: product.id, quantity: 1 }],
      paymentMethod: 'upi',
    });

    const res = await request(app).get('/api/orders/by-phone/9444444444');
    expect(res.status).toBe(200);
    expect(res.body[0].items[0].product).toBeDefined();
    expect(res.body[0].items[0].product.name).toBeDefined();
  });
});

// ── Payment Methods ───────────────────────────────────────────────────────────
describe('Payment method handling', () => {
  it('sets paymentStatus pending for COD', async () => {
    const product = await createTestProduct({ stock: 20 });
    const res = await request(app).post('/api/orders').send({
      customerName: 'COD Test',
      customerPhone: '9000000002',
      address: validAddress,
      items: [{ productId: product.id, quantity: 1 }],
      paymentMethod: 'cod',
    });
    expect(res.status).toBe(201);
    expect(res.body.paymentStatus).toBe('pending');
    expect(res.body.paymentMethod).toBe('cod');
  });

  it('sets paymentStatus paid for UPI', async () => {
    const product = await createTestProduct({ stock: 20 });
    const res = await request(app).post('/api/orders').send({
      customerName: 'UPI Test',
      customerPhone: '9000000003',
      address: validAddress,
      items: [{ productId: product.id, quantity: 1 }],
      paymentMethod: 'upi',
    });
    expect(res.status).toBe(201);
    expect(res.body.paymentStatus).toBe('paid');
    expect(res.body.paymentMethod).toBe('upi');
  });

  it('sets paymentStatus paid for razorpay', async () => {
    const product = await createTestProduct({ stock: 20 });
    const res = await request(app).post('/api/orders').send({
      customerName: 'Razorpay Test',
      customerPhone: '9000000004',
      address: validAddress,
      items: [{ productId: product.id, quantity: 1 }],
      paymentMethod: 'razorpay',
      paymentId: 'rzp_test_123456',
    });
    expect(res.status).toBe(201);
    expect(res.body.paymentStatus).toBe('paid');
  });

  it('rejects invalid payment method', async () => {
    const product = await createTestProduct({ stock: 20 });
    const res = await request(app).post('/api/orders').send({
      customerName: 'Bad Payment',
      customerPhone: '9000000005',
      address: validAddress,
      items: [{ productId: product.id, quantity: 1 }],
      paymentMethod: 'bitcoin',
    });
    expect(res.status).toBe(400);
  });
});

// ── Admin Dashboard ──────────────────────────────────────────────────────────
describe('GET /api/admin/dashboard', () => {
  it('returns all dashboard fields', async () => {
    const res = await request(app).get('/api/admin/dashboard');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('todayOrders');
    expect(res.body).toHaveProperty('todayRevenue');
    expect(res.body).toHaveProperty('totalOrders');
    expect(res.body).toHaveProperty('totalRevenue');
    expect(res.body).toHaveProperty('pendingOrders');
    expect(res.body).toHaveProperty('recentOrders');
    expect(res.body).toHaveProperty('totalProducts');
    expect(res.body).toHaveProperty('lowStockProducts');
  });

  it('counts pending orders correctly', async () => {
    const product = await createTestProduct({ stock: 100 });
    await request(app).post('/api/orders').send({
      customerName: 'Pending Order',
      customerPhone: '9111111111',
      address: validAddress,
      items: [{ productId: product.id, quantity: 1 }],
      paymentMethod: 'cod',
    });

    const res = await request(app).get('/api/admin/dashboard');
    expect(res.status).toBe(200);
    expect(res.body.pendingOrders).toBeGreaterThanOrEqual(1);
  });

  it('counts low stock products correctly', async () => {
    await createTestProduct({ name: 'Low Stock Product', stock: 3 });
    await createTestProduct({ name: 'Normal Stock Product', stock: 50 });

    const res = await request(app).get('/api/admin/dashboard');
    expect(res.status).toBe(200);
    expect(res.body.lowStockProducts).toBeGreaterThanOrEqual(1);
  });
});

// ── Admin Coupon Edge Cases ───────────────────────────────────────────────────
describe('Admin coupon edge cases', () => {
  it('prevents duplicate coupon codes', async () => {
    await createTestCoupon({ code: 'DUPTEST' });
    const res = await request(app)
      .post('/api/admin/coupons')
      .send({ code: 'DUPTEST', discount: 20 });
    expect(res.status).toBe(400);
  });

  it('updates coupon active status', async () => {
    const coupon = await createTestCoupon({ code: 'TOGGLE1' });
    const res = await request(app)
      .put(`/api/admin/coupons/${coupon.id}`)
      .send({ active: false });
    expect(res.status).toBe(200);
    expect(res.body.active).toBe(false);
  });

  it('expired coupons are not applied to orders', async () => {
    const product = await createTestProduct({ stock: 10 });
    await createTestCoupon({
      code: 'EXPIRED10',
      discount: 20,
      expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // yesterday
    });

    const res = await request(app).post('/api/orders').send({
      customerName: 'Expired Coupon',
      customerPhone: '9222222222',
      address: validAddress,
      items: [{ productId: product.id, quantity: 1 }],
      paymentMethod: 'cod',
      couponCode: 'EXPIRED10',
    });
    expect(res.status).toBe(201);
    expect(Number(res.body.discount)).toBe(0);
  });

  it('max uses limit prevents coupon reuse', async () => {
    const product = await createTestProduct({ stock: 100 });
    await createTestCoupon({ code: 'ONETIME', discount: 10, maxUses: 1 });

    const orderData = {
      customerName: 'First Use',
      customerPhone: '9333333333',
      address: validAddress,
      items: [{ productId: product.id, quantity: 1 }],
      paymentMethod: 'cod',
      couponCode: 'ONETIME',
    };
    await request(app).post('/api/orders').send(orderData);

    const res2 = await request(app).post('/api/orders').send({
      ...orderData,
      customerName: 'Second Use',
      customerPhone: '9333333334',
    });
    expect(res2.status).toBe(201);
    expect(Number(res2.body.discount)).toBe(0);
  });

  it('minimum order coupon not applied below threshold', async () => {
    const product = await createTestProduct({ stock: 10, price: 500 });
    await createTestCoupon({ code: 'MIN999', discount: 15, minOrder: 999 });

    const res = await request(app).post('/api/orders').send({
      customerName: 'Below Min',
      customerPhone: '9444444441',
      address: validAddress,
      items: [{ productId: product.id, quantity: 1 }],
      paymentMethod: 'cod',
      couponCode: 'MIN999',
    });
    expect(res.status).toBe(201);
    expect(Number(res.body.discount)).toBe(0);
  });
});

// ── Category CRUD ─────────────────────────────────────────────────────────────
describe('Admin category management', () => {
  it('creates a new category', async () => {
    const res = await request(app)
      .post('/api/admin/categories')
      .send({ name: 'Test Sarees', image: 'https://example.com/saree.jpg' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Test Sarees');
    expect(res.body.slug).toBe('test-sarees');
  });

  it('updates a category', async () => {
    const cat = await createTestCategory('Original Category');
    const res = await request(app)
      .put(`/api/admin/categories/${cat.id}`)
      .send({ name: 'Updated Category' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Updated Category');
  });

  it('returns 404 for non-existent category update', async () => {
    const res = await request(app)
      .put('/api/admin/categories/nonexistent')
      .send({ name: 'X' });
    expect(res.status).toBe(404);
  });
});

// ── Order Status Lifecycle ────────────────────────────────────────────────────
describe('Order status lifecycle', () => {
  it('transitions through full order lifecycle', async () => {
    const product = await createTestProduct({ stock: 50 });
    const orderRes = await request(app).post('/api/orders').send({
      customerName: 'Lifecycle Test',
      customerPhone: '9600000000',
      address: validAddress,
      items: [{ productId: product.id, quantity: 1 }],
      paymentMethod: 'upi',
    });
    const orderId = orderRes.body.id;

    for (const status of ['confirmed', 'packed', 'shipped', 'delivered']) {
      const res = await request(app)
        .put(`/api/admin/orders/${orderId}/status`)
        .send({ status });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe(status);
    }
  });

  it('adds tracking ID when shipped', async () => {
    const product = await createTestProduct({ stock: 50 });
    const orderRes = await request(app).post('/api/orders').send({
      customerName: 'Tracking Test',
      customerPhone: '9700000000',
      address: validAddress,
      items: [{ productId: product.id, quantity: 1 }],
      paymentMethod: 'cod',
    });

    const res = await request(app)
      .put(`/api/admin/orders/${orderRes.body.id}/status`)
      .send({ status: 'shipped', trackingId: 'TRACK123456' });
    expect(res.status).toBe(200);
    expect(res.body.trackingId).toBe('TRACK123456');
  });
});
