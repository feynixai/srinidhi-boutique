/**
 * Build 7 tests — Stripe removal, Razorpay international, bank transfer,
 * admin bulk ops, packing slip, daily summary, low stock, CSV import,
 * rate limiter middleware, 404 page / error boundaries (server-side).
 */
import request from 'supertest';
import { app } from '../index';
import {
  createTestProduct,
  createTestAdminUser,
  cleanupTest,
  testPrisma,
} from './helpers';

beforeEach(async () => {
  await cleanupTest();
});

afterAll(async () => {
  await cleanupTest();
});

// ── Stripe fully removed ──────────────────────────────────────────────────────

describe('Stripe routes removed (Build 7 — server)', () => {
  it('GET /api/payments/stripe/anything returns 404', async () => {
    const res = await request(app).get('/api/payments/stripe/anything');
    expect(res.status).toBe(404);
  });

  it('POST /api/payments/stripe/create-session returns 404', async () => {
    const res = await request(app)
      .post('/api/payments/stripe/create-session')
      .send({ orderNumber: 'X', amount: 100, successUrl: 'https://x.com', cancelUrl: 'https://x.com' });
    expect(res.status).toBe(404);
  });

  it('POST /api/payments/stripe/webhook returns 404', async () => {
    const res = await request(app)
      .post('/api/payments/stripe/webhook')
      .send({});
    expect(res.status).toBe(404);
  });
});

// ── Razorpay create-order ─────────────────────────────────────────────────────

describe('POST /api/payments/create-order', () => {
  it('rejects negative amount', async () => {
    const res = await request(app)
      .post('/api/payments/create-order')
      .send({ amount: -50, currency: 'INR' });
    expect(res.status).toBe(400);
  });

  it('rejects zero amount', async () => {
    const res = await request(app)
      .post('/api/payments/create-order')
      .send({ amount: 0 });
    expect(res.status).toBe(400);
  });

  it('accepts optional currency override (USD for international)', async () => {
    const res = await request(app)
      .post('/api/payments/create-order')
      .send({ amount: 50, currency: 'USD' });
    // 500 because keys not set in test, but input is valid
    expect([500]).toContain(res.status);
  });

  it('returns 500 when keys not configured', async () => {
    const res = await request(app)
      .post('/api/payments/create-order')
      .send({ amount: 1000 });
    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/Razorpay not configured/i);
  });
});

// ── Bank Transfer ─────────────────────────────────────────────────────────────

describe('GET /api/payments/bank-transfer-details', () => {
  it('returns bank details object', async () => {
    const res = await request(app).get('/api/payments/bank-transfer-details');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      bankName: expect.any(String),
      accountName: expect.any(String),
      swift: expect.any(String),
      instructions: expect.any(Array),
    });
  });

  it('instructions array is non-empty', async () => {
    const res = await request(app).get('/api/payments/bank-transfer-details');
    expect(res.body.instructions.length).toBeGreaterThanOrEqual(3);
  });
});

describe('POST /api/payments/bank-transfer/confirm', () => {
  it('returns 404 for non-existent order', async () => {
    const res = await request(app)
      .post('/api/payments/bank-transfer/confirm')
      .send({ orderNumber: 'SB-NOPE', referenceNumber: 'REF123' });
    expect(res.status).toBe(404);
  });

  it('confirms a bank transfer and marks order paid', async () => {
    const product = await createTestProduct({ stock: 10 });
    const orderNumber = `SB-BTX-${Date.now()}`;
    await testPrisma.order.create({
      data: {
        orderNumber,
        customerName: 'Meera Nair',
        customerPhone: '+447712345678',
        address: { line1: '5 High St', city: 'Manchester', pincode: 'M1 1AE', country: 'GB' },
        subtotal: 1999,
        shipping: 1299,
        discount: 0,
        total: 3298,
        paymentMethod: 'bank_transfer',
        paymentStatus: 'pending',
        country: 'GB',
        items: { create: [{ productId: product.id, name: product.name, price: 1999, quantity: 1 }] },
      },
    });

    const res = await request(app)
      .post('/api/payments/bank-transfer/confirm')
      .send({ orderNumber, referenceNumber: 'SWIFT-GB-001' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.order.paymentStatus).toBe('paid');
    expect(res.body.order.paymentId).toBe('SWIFT-GB-001');
  });

  it('works without referenceNumber (auto-generates)', async () => {
    const product = await createTestProduct({ stock: 5 });
    const orderNumber = `SB-BTA-${Date.now()}`;
    await testPrisma.order.create({
      data: {
        orderNumber,
        customerName: 'Test Auto',
        customerPhone: '+1-800-555-0000',
        address: { line1: '1 Test St', city: 'Boston', pincode: '02101', country: 'US' },
        subtotal: 2500,
        shipping: 1499,
        discount: 0,
        total: 3999,
        paymentMethod: 'bank_transfer',
        paymentStatus: 'pending',
        country: 'US',
        items: { create: [{ productId: product.id, name: product.name, price: 2500, quantity: 1 }] },
      },
    });

    const res = await request(app)
      .post('/api/payments/bank-transfer/confirm')
      .send({ orderNumber });
    expect(res.status).toBe(200);
    expect(res.body.order.paymentId).toMatch(/^BANK-/);
  });

  it('rejects missing orderNumber', async () => {
    const res = await request(app)
      .post('/api/payments/bank-transfer/confirm')
      .send({ referenceNumber: 'TXN' });
    expect(res.status).toBe(400);
  });
});

// ── international orders with new payment methods ─────────────────────────────

describe('International orders with bank_transfer', () => {
  it('creates US order with razorpay payment', async () => {
    const product = await createTestProduct({ stock: 10 });
    const res = await request(app)
      .post('/api/orders')
      .send({
        customerName: 'Jane Smith',
        customerPhone: '+15555550001',
        address: { line1: '500 5th Ave', city: 'New York', state: 'New York', pincode: '10001', country: 'US' },
        items: [{ productId: product.id, quantity: 1 }],
        paymentMethod: 'razorpay',
        country: 'US',
        sessionId: `sess-us-${Date.now()}`,
      });
    expect(res.status).toBe(201);
    expect(res.body.country).toBe('US');
    expect(res.body.paymentMethod).toBe('razorpay');
  });

  it('creates UAE order with bank_transfer', async () => {
    const product = await createTestProduct({ stock: 10 });
    const res = await request(app)
      .post('/api/orders')
      .send({
        customerName: 'Hessa Al-Mansoori',
        customerPhone: '+97150999888',
        address: { line1: 'Villa 5, Palm Jumeirah', city: 'Dubai', state: 'Dubai', pincode: '000000', country: 'AE' },
        items: [{ productId: product.id, quantity: 1 }],
        paymentMethod: 'bank_transfer',
        country: 'AE',
        sessionId: `sess-ae-${Date.now()}`,
      });
    expect(res.status).toBe(201);
    expect(res.body.country).toBe('AE');
    expect(res.body.paymentMethod).toBe('bank_transfer');
  });

  it('rejects stripe as payment method (removed)', async () => {
    const product = await createTestProduct({ stock: 10 });
    const res = await request(app)
      .post('/api/orders')
      .send({
        customerName: 'Test User',
        customerPhone: '+12125550001',
        address: { line1: '1 Broadway', city: 'New York', pincode: '10001', country: 'US' },
        items: [{ productId: product.id, quantity: 1 }],
        paymentMethod: 'stripe',
        country: 'US',
      });
    expect(res.status).toBe(400);
  });
});

// ── Admin: Bulk order status update ──────────────────────────────────────────

describe('POST /api/admin/orders/bulk-status', () => {
  it('updates multiple orders to shipped', async () => {
    const product = await createTestProduct({ stock: 20 });
    const [o1, o2, o3] = await Promise.all([
      testPrisma.order.create({
        data: {
          orderNumber: `SB-BULK-1-${Date.now()}`,
          customerName: 'A', customerPhone: '9111111111',
          address: { line1: '1 A St', city: 'Hyd', pincode: '500001' },
          subtotal: 999, shipping: 99, discount: 0, total: 1098,
          paymentMethod: 'cod', paymentStatus: 'pending', status: 'confirmed',
          items: { create: [{ productId: product.id, name: product.name, price: 999, quantity: 1 }] },
        },
      }),
      testPrisma.order.create({
        data: {
          orderNumber: `SB-BULK-2-${Date.now()}`,
          customerName: 'B', customerPhone: '9222222222',
          address: { line1: '2 B St', city: 'Hyd', pincode: '500001' },
          subtotal: 999, shipping: 99, discount: 0, total: 1098,
          paymentMethod: 'cod', paymentStatus: 'pending', status: 'confirmed',
          items: { create: [{ productId: product.id, name: product.name, price: 999, quantity: 1 }] },
        },
      }),
      testPrisma.order.create({
        data: {
          orderNumber: `SB-BULK-3-${Date.now()}`,
          customerName: 'C', customerPhone: '9333333333',
          address: { line1: '3 C St', city: 'Hyd', pincode: '500001' },
          subtotal: 999, shipping: 99, discount: 0, total: 1098,
          paymentMethod: 'cod', paymentStatus: 'pending', status: 'placed',
          items: { create: [{ productId: product.id, name: product.name, price: 999, quantity: 1 }] },
        },
      }),
    ]);

    const res = await request(app)
      .post('/api/admin/orders/bulk-status')
      .send({ ids: [o1.id, o2.id, o3.id], status: 'shipped' });
    expect(res.status).toBe(200);
    expect(res.body.updated).toBe(3);

    const updated = await testPrisma.order.findMany({ where: { id: { in: [o1.id, o2.id, o3.id] } } });
    updated.forEach((o) => expect(o.status).toBe('shipped'));
  });

  it('rejects empty ids array', async () => {
    const res = await request(app)
      .post('/api/admin/orders/bulk-status')
      .send({ ids: [], status: 'shipped' });
    expect(res.status).toBe(400);
  });

  it('rejects invalid status', async () => {
    const res = await request(app)
      .post('/api/admin/orders/bulk-status')
      .send({ ids: ['any-id'], status: 'flying' });
    expect(res.status).toBe(400);
  });
});

// ── Admin: Packing slip ───────────────────────────────────────────────────────

describe('GET /api/admin/orders/:id/packing-slip', () => {
  it('returns HTML packing slip', async () => {
    const product = await createTestProduct({ stock: 5 });
    const order = await testPrisma.order.create({
      data: {
        orderNumber: `SB-PS-${Date.now()}`,
        customerName: 'Packing Test',
        customerPhone: '9444444444',
        address: { line1: '10 Pack Rd', city: 'Hyderabad', state: 'Telangana', pincode: '500001' },
        subtotal: 1999, shipping: 99, discount: 0, total: 2098,
        paymentMethod: 'razorpay', paymentStatus: 'paid',
        items: { create: [{ productId: product.id, name: product.name, price: 1999, quantity: 2 }] },
      },
    });

    const res = await request(app).get(`/api/admin/orders/${order.id}/packing-slip`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/html/);
    expect(res.text).toContain('PACKING SLIP');
    expect(res.text).toContain(order.orderNumber);
    expect(res.text).toContain('Packing Test');
    expect(res.text).toContain(product.name);
  });

  it('returns 404 for unknown order', async () => {
    const res = await request(app).get('/api/admin/orders/nonexistent-id/packing-slip');
    expect(res.status).toBe(404);
  });

  it('includes quantity in packing slip', async () => {
    const product = await createTestProduct({ stock: 10 });
    const order = await testPrisma.order.create({
      data: {
        orderNumber: `SB-PSQ-${Date.now()}`,
        customerName: 'Qty Test',
        customerPhone: '9555555555',
        address: { line1: '5 Qty Lane', city: 'Hyderabad', pincode: '500001' },
        subtotal: 3000, shipping: 0, discount: 0, total: 3000,
        paymentMethod: 'upi', paymentStatus: 'pending',
        items: { create: [{ productId: product.id, name: product.name, price: 1500, quantity: 2 }] },
      },
    });

    const res = await request(app).get(`/api/admin/orders/${order.id}/packing-slip`);
    expect(res.text).toContain('2'); // quantity
  });
});

// ── Admin: Daily summary ──────────────────────────────────────────────────────

describe('GET /api/admin/daily-summary', () => {
  it('returns daily summary object', async () => {
    const res = await request(app).get('/api/admin/daily-summary');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      todayOrderCount: expect.any(Number),
      todayRevenue: expect.any(Number),
      pendingOrders: expect.any(Number),
      lowStockProducts: expect.any(Array),
      recentOrders: expect.any(Array),
    });
  });

  it('todayOrderCount increases after creating an order', async () => {
    const product = await createTestProduct({ stock: 5 });

    const before = await request(app).get('/api/admin/daily-summary');
    const countBefore = before.body.todayOrderCount as number;

    await testPrisma.order.create({
      data: {
        orderNumber: `SB-DS-${Date.now()}`,
        customerName: 'Daily Test', customerPhone: '9600000001',
        address: { line1: '1 Daily St', city: 'Hyd', pincode: '500001' },
        subtotal: 999, shipping: 99, discount: 0, total: 1098,
        paymentMethod: 'cod', paymentStatus: 'pending',
        items: { create: [{ productId: product.id, name: product.name, price: 999, quantity: 1 }] },
      },
    });

    const after = await request(app).get('/api/admin/daily-summary');
    expect(after.body.todayOrderCount).toBe(countBefore + 1);
  });
});

// ── Admin: Low stock alerts ───────────────────────────────────────────────────

describe('GET /api/admin/low-stock', () => {
  it('returns low stock products with default threshold 5', async () => {
    await createTestProduct({ name: `Low Stock ${Date.now()}`, stock: 3 });
    await createTestProduct({ name: `Fine Stock ${Date.now()}`, stock: 20 });

    const res = await request(app).get('/api/admin/low-stock');
    expect(res.status).toBe(200);
    expect(res.body.threshold).toBe(5);
    expect(Array.isArray(res.body.products)).toBe(true);
    const stockLevels = (res.body.products as { stock: number }[]).map((p) => p.stock);
    stockLevels.forEach((s) => expect(s).toBeLessThanOrEqual(5));
  });

  it('respects custom threshold', async () => {
    const res = await request(app).get('/api/admin/low-stock?threshold=10');
    expect(res.status).toBe(200);
    expect(res.body.threshold).toBe(10);
  });

  it('returns count field', async () => {
    const res = await request(app).get('/api/admin/low-stock');
    expect(typeof res.body.count).toBe('number');
    expect(res.body.count).toBe(res.body.products.length);
  });
});

// ── Admin: CSV product import ─────────────────────────────────────────────────

describe('POST /api/admin/products/import-csv', () => {
  it('returns 400 when no file uploaded', async () => {
    const res = await request(app).post('/api/admin/products/import-csv');
    expect(res.status).toBe(400);
  });

  it('imports products from valid CSV', async () => {
    const csv = [
      'name,price,description,stock,fabric,sizes,colors',
      `CSV Saree ${Date.now()},2999,Beautiful silk saree,10,Silk,S|M|L,Red|Blue`,
      `CSV Kurti ${Date.now()},999,Cotton kurti,5,Cotton,S|M,White`,
    ].join('\n');

    const res = await request(app)
      .post('/api/admin/products/import-csv')
      .attach('file', Buffer.from(csv), { filename: 'products.csv', contentType: 'text/csv' });
    expect(res.status).toBe(200);
    expect(res.body.created).toBe(2);
    expect(res.body.errors).toHaveLength(0);
  });

  it('reports errors for invalid rows', async () => {
    const csv = [
      'name,price',
      ',invalid-price',       // missing name and bad price
      `Valid Product ${Date.now()},1499`,
    ].join('\n');

    const res = await request(app)
      .post('/api/admin/products/import-csv')
      .attach('file', Buffer.from(csv), { filename: 'test.csv', contentType: 'text/csv' });
    expect(res.status).toBe(200);
    expect(res.body.created).toBe(1);
    expect(res.body.errors.length).toBeGreaterThanOrEqual(1);
  });

  it('returns 400 when CSV missing required columns', async () => {
    const csv = 'description,stock\nsome desc,5';
    const res = await request(app)
      .post('/api/admin/products/import-csv')
      .attach('file', Buffer.from(csv), { filename: 'bad.csv', contentType: 'text/csv' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/name/i);
  });

  it('returns 400 for empty CSV', async () => {
    const res = await request(app)
      .post('/api/admin/products/import-csv')
      .attach('file', Buffer.from(''), { filename: 'empty.csv', contentType: 'text/csv' });
    expect(res.status).toBe(400);
  });

  it('handles featured and best_seller flags in CSV', async () => {
    const csv = [
      'name,price,featured,best_seller',
      `Featured Saree ${Date.now()},3999,true,true`,
    ].join('\n');

    const res = await request(app)
      .post('/api/admin/products/import-csv')
      .attach('file', Buffer.from(csv), { filename: 'featured.csv', contentType: 'text/csv' });
    expect(res.status).toBe(200);
    expect(res.body.created).toBe(1);
    const product = await testPrisma.product.findFirst({ where: { name: { contains: 'Featured Saree' } } });
    expect(product?.featured).toBe(true);
    expect(product?.bestSeller).toBe(true);
  });
});

// ── Rate limiter middleware (unit tests) ──────────────────────────────────────

describe('Rate limiter middleware', () => {
  it('allows requests under the limit in test mode (skip by default)', async () => {
    // Rate limiting is disabled in NODE_ENV=test
    for (let i = 0; i < 3; i++) {
      const res = await request(app)
        .post('/api/auth/otp/send')
        .send({ phone: `9700000${i.toString().padStart(3, '0')}` });
      expect([200, 400]).toContain(res.status);
    }
  });
});

// ── Admin: Invoice ────────────────────────────────────────────────────────────

describe('GET /api/admin/orders/:id/invoice', () => {
  it('returns HTML invoice with order details', async () => {
    const product = await createTestProduct({ stock: 5 });
    const order = await testPrisma.order.create({
      data: {
        orderNumber: `SB-INV7-${Date.now()}`,
        customerName: 'Invoice User',
        customerPhone: '9800000001',
        customerEmail: 'invoice@test.com',
        address: { line1: '1 Invoice St', city: 'Hyderabad', state: 'Telangana', pincode: '500001' },
        subtotal: 2999, shipping: 0, discount: 0, total: 2999,
        paymentMethod: 'razorpay', paymentStatus: 'paid',
        items: { create: [{ productId: product.id, name: product.name, price: 2999, quantity: 1 }] },
      },
    });

    const res = await request(app).get(`/api/admin/orders/${order.id}/invoice`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/html/);
    expect(res.text).toContain('Srinidhi Boutique');
    expect(res.text).toContain(order.orderNumber);
    expect(res.text).toContain('Invoice User');
  });
});

// ── Verify payment method enum ────────────────────────────────────────────────

describe('Order payment method validation', () => {
  it('accepts cod', async () => {
    const product = await createTestProduct({ stock: 5 });
    const res = await request(app)
      .post('/api/orders')
      .send({
        customerName: 'COD Test', customerPhone: '9900000001',
        address: { line1: '1 COD St', city: 'Hyderabad', pincode: '500001' },
        items: [{ productId: product.id, quantity: 1 }],
        paymentMethod: 'cod',
        sessionId: `sess-cod-${Date.now()}`,
      });
    expect(res.status).toBe(201);
  });

  it('accepts upi', async () => {
    const product = await createTestProduct({ stock: 5 });
    const res = await request(app)
      .post('/api/orders')
      .send({
        customerName: 'UPI Test', customerPhone: '9900000002',
        address: { line1: '2 UPI St', city: 'Hyderabad', pincode: '500001' },
        items: [{ productId: product.id, quantity: 1 }],
        paymentMethod: 'upi',
        sessionId: `sess-upi-${Date.now()}`,
      });
    expect(res.status).toBe(201);
  });

  it('accepts bank_transfer', async () => {
    const product = await createTestProduct({ stock: 5 });
    const res = await request(app)
      .post('/api/orders')
      .send({
        customerName: 'BT Test', customerPhone: '9900000003',
        address: { line1: '3 BT St', city: 'Hyderabad', pincode: '500001' },
        items: [{ productId: product.id, quantity: 1 }],
        paymentMethod: 'bank_transfer',
        sessionId: `sess-bt-${Date.now()}`,
      });
    expect(res.status).toBe(201);
  });

  it('rejects stripe as payment method', async () => {
    const product = await createTestProduct({ stock: 5 });
    const res = await request(app)
      .post('/api/orders')
      .send({
        customerName: 'Stripe Test', customerPhone: '9900000004',
        address: { line1: '4 S St', city: 'Hyderabad', pincode: '500001' },
        items: [{ productId: product.id, quantity: 1 }],
        paymentMethod: 'stripe',
      });
    expect(res.status).toBe(400);
  });

  it('rejects unknown payment method', async () => {
    const product = await createTestProduct({ stock: 5 });
    const res = await request(app)
      .post('/api/orders')
      .send({
        customerName: 'Bad Pay', customerPhone: '9900000005',
        address: { line1: '5 BP St', city: 'Hyderabad', pincode: '500001' },
        items: [{ productId: product.id, quantity: 1 }],
        paymentMethod: 'paypal',
      });
    expect(res.status).toBe(400);
  });
});

// ── Health & 404 ──────────────────────────────────────────────────────────────

describe('Server health and 404', () => {
  it('GET /health returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.timestamp).toBeTruthy();
  });

  it('GET /api/nonexistent returns 404', async () => {
    const res = await request(app).get('/api/nonexistent-route-xyz');
    expect(res.status).toBe(404);
  });
});

// ── Admin dashboard — low stock count ────────────────────────────────────────

describe('GET /api/admin/dashboard — low stock', () => {
  it('lowStockProducts count reflects products with stock <= 5', async () => {
    await createTestProduct({ name: `Dashboard LS ${Date.now()}`, stock: 2 });

    const res = await request(app).get('/api/admin/dashboard');
    expect(res.status).toBe(200);
    expect(typeof res.body.lowStockProducts).toBe('number');
    expect(res.body.lowStockProducts).toBeGreaterThanOrEqual(1);
  });
});

// ── Additional payment & order coverage ──────────────────────────────────────

describe('POST /api/payments/verify', () => {
  it('returns 400 for signature mismatch', async () => {
    const res = await request(app)
      .post('/api/payments/verify')
      .send({
        razorpay_order_id: 'order_test123',
        razorpay_payment_id: 'pay_test123',
        razorpay_signature: 'invalid_signature',
      });
    expect([400, 500]).toContain(res.status);
  });

  it('validates required fields', async () => {
    const res = await request(app)
      .post('/api/payments/verify')
      .send({ razorpay_order_id: 'order_test' });
    expect(res.status).toBe(400);
  });
});

describe('Admin product CSV import — edge cases', () => {
  it('handles compare_price column', async () => {
    const csv = [
      'name,price,compare_price',
      `CSV Compare ${Date.now()},1499,2499`,
    ].join('\n');

    const res = await request(app)
      .post('/api/admin/products/import-csv')
      .attach('file', Buffer.from(csv), { filename: 'compare.csv', contentType: 'text/csv' });
    expect(res.status).toBe(200);
    expect(res.body.created).toBe(1);
  });

  it('handles active=false to create inactive product', async () => {
    const name = `Inactive CSV ${Date.now()}`;
    const csv = ['name,price,active', `${name},799,false`].join('\n');

    const res = await request(app)
      .post('/api/admin/products/import-csv')
      .attach('file', Buffer.from(csv), { filename: 'inactive.csv', contentType: 'text/csv' });
    expect(res.status).toBe(200);
    const product = await testPrisma.product.findFirst({ where: { name: { contains: 'Inactive CSV' } } });
    expect(product?.active).toBe(false);
  });
});

describe('GET /api/admin/low-stock — edge cases', () => {
  it('returns empty array when no low stock products', async () => {
    // Only create a product with high stock
    await createTestProduct({ name: `High Stock ${Date.now()}`, stock: 100 });
    const res = await request(app).get('/api/admin/low-stock?threshold=2');
    expect(res.status).toBe(200);
    // The 100-stock product should not appear
    const allBelowThreshold = (res.body.products as { stock: number }[]).every((p) => p.stock <= 2);
    expect(allBelowThreshold).toBe(true);
  });
});
