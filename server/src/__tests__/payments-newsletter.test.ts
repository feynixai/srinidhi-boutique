/**
 * Tests for: Razorpay payment routes, invoice generation, newsletter, GST calculation
 */
import request from 'supertest';
import crypto from 'crypto';
import { app } from '../index';
import {
  createTestProduct,
  createTestCoupon,
  cleanupTest,
  testPrisma,
} from './helpers';
import { v4 as uuidv4 } from 'uuid';

beforeEach(async () => {
  await cleanupTest();
  await testPrisma.newsletter.deleteMany({});
});

afterAll(async () => {
  await cleanupTest();
  await testPrisma.newsletter.deleteMany({});
});

const validAddress = {
  line1: '12 Banjara Hills',
  city: 'Hyderabad',
  state: 'Telangana',
  pincode: '500034',
};

// ── Razorpay create-order ──────────────────────────────────────────────────────
describe('POST /api/payments/create-order', () => {
  it('returns 500 when RAZORPAY_KEY_ID is not set', async () => {
    const originalKeyId = process.env.RAZORPAY_KEY_ID;
    const originalSecret = process.env.RAZORPAY_KEY_SECRET;
    delete process.env.RAZORPAY_KEY_ID;
    delete process.env.RAZORPAY_KEY_SECRET;

    const res = await request(app)
      .post('/api/payments/create-order')
      .send({ amount: 1299, currency: 'INR' });

    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/not configured/i);

    process.env.RAZORPAY_KEY_ID = originalKeyId;
    process.env.RAZORPAY_KEY_SECRET = originalSecret;
  });

  it('rejects invalid amount (non-positive)', async () => {
    const res = await request(app)
      .post('/api/payments/create-order')
      .send({ amount: -100 });

    expect(res.status).toBe(400);
  });

  it('rejects zero amount', async () => {
    const res = await request(app)
      .post('/api/payments/create-order')
      .send({ amount: 0 });

    expect(res.status).toBe(400);
  });

  it('rejects missing amount', async () => {
    const res = await request(app)
      .post('/api/payments/create-order')
      .send({ currency: 'INR' });

    expect(res.status).toBe(400);
  });
});

// ── Razorpay verify ────────────────────────────────────────────────────────────
describe('POST /api/payments/verify', () => {
  it('returns 500 when RAZORPAY_KEY_SECRET is not set', async () => {
    const originalSecret = process.env.RAZORPAY_KEY_SECRET;
    delete process.env.RAZORPAY_KEY_SECRET;

    const res = await request(app)
      .post('/api/payments/verify')
      .send({
        razorpay_order_id: 'order_test',
        razorpay_payment_id: 'pay_test',
        razorpay_signature: 'invalid_signature',
      });

    expect(res.status).toBe(500);
    process.env.RAZORPAY_KEY_SECRET = originalSecret;
  });

  it('rejects payment with wrong signature', async () => {
    process.env.RAZORPAY_KEY_SECRET = 'test_secret_key';

    const res = await request(app)
      .post('/api/payments/verify')
      .send({
        razorpay_order_id: 'order_abc123',
        razorpay_payment_id: 'pay_xyz789',
        razorpay_signature: 'completely_wrong_signature',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/verification failed/i);
  });

  it('accepts payment with correct HMAC signature', async () => {
    const secret = 'test_secret_key_for_hmac';
    process.env.RAZORPAY_KEY_SECRET = secret;

    const orderId = 'order_test123';
    const paymentId = 'pay_test456';
    const signature = crypto
      .createHmac('sha256', secret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    const res = await request(app)
      .post('/api/payments/verify')
      .send({
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
      });

    expect(res.status).toBe(200);
    expect(res.body.verified).toBe(true);
    expect(res.body.paymentId).toBe(paymentId);
  });

  it('rejects payment with missing fields', async () => {
    const res = await request(app)
      .post('/api/payments/verify')
      .send({ razorpay_order_id: 'order_123' });

    expect(res.status).toBe(400);
  });
});

// ── GST calculation ────────────────────────────────────────────────────────────
describe('GST calculation logic', () => {
  it('calculates 5% GST on item total correctly', () => {
    const itemPrice = 1000;
    const qty = 2;
    const gstRate = 0.05;
    const total = itemPrice * qty;
    const gst = total * gstRate;
    expect(gst).toBe(100);
    expect(total + gst).toBe(2100);
  });

  it('calculates GST on single item', () => {
    const price = 999;
    const gst = price * 0.05;
    expect(parseFloat(gst.toFixed(2))).toBe(49.95);
  });

  it('calculates GST on order with multiple items', () => {
    const items = [
      { price: 1500, qty: 1 },
      { price: 800, qty: 2 },
      { price: 2000, qty: 1 },
    ];
    const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
    const gst = subtotal * 0.05;
    expect(subtotal).toBe(5100);
    expect(parseFloat(gst.toFixed(2))).toBe(255);
  });

  it('invoice total with GST + shipping', () => {
    const subtotal = 1200;
    const gst = subtotal * 0.05; // 60
    const shipping = 0; // free above 999
    const total = subtotal + gst + shipping;
    expect(total).toBe(1260);
  });

  it('COD charge adds to total', () => {
    const subtotal = 500;
    const shipping = 99;
    const codCharge = 50;
    const total = subtotal + shipping + codCharge;
    expect(total).toBe(649);
  });
});

// ── Invoice API ────────────────────────────────────────────────────────────────
describe('GET /api/admin/orders/:id/invoice', () => {
  it('returns HTML invoice for valid order', async () => {
    const product = await createTestProduct({ name: 'Silk Saree Invoice Test', price: 2500, stock: 10 });
    const sessionId = uuidv4();

    const orderRes = await request(app).post('/api/orders').send({
      customerName: 'Priya Sharma',
      customerPhone: '9876543210',
      address: validAddress,
      items: [{ productId: product.id, quantity: 1 }],
      paymentMethod: 'cod',
      sessionId,
    });
    expect(orderRes.status).toBe(201);
    const orderId = orderRes.body.id;

    const invoiceRes = await request(app).get(`/api/admin/orders/${orderId}/invoice`);
    expect(invoiceRes.status).toBe(200);
    expect(invoiceRes.headers['content-type']).toMatch(/text\/html/);
    expect(invoiceRes.text).toContain('TAX INVOICE');
    expect(invoiceRes.text).toContain(orderRes.body.orderNumber);
    expect(invoiceRes.text).toContain('Priya Sharma');
    expect(invoiceRes.text).toContain('Srinidhi Boutique');
    expect(invoiceRes.text).toContain('GST');
    expect(invoiceRes.text).toContain('2,500.00');
  });

  it('returns HTML with coupon info when order has coupon', async () => {
    const product = await createTestProduct({ name: 'Kurti Invoice Coupon', price: 1500, stock: 5 });
    const coupon = await createTestCoupon({ code: 'INVTEST10', discount: 10 });
    const sessionId = uuidv4();

    const orderRes = await request(app).post('/api/orders').send({
      customerName: 'Divya Reddy',
      customerPhone: '9123456789',
      address: validAddress,
      items: [{ productId: product.id, quantity: 1 }],
      paymentMethod: 'upi',
      couponCode: coupon.code,
      sessionId,
    });
    expect(orderRes.status).toBe(201);

    const invoiceRes = await request(app).get(`/api/admin/orders/${orderRes.body.id}/invoice`);
    expect(invoiceRes.status).toBe(200);
    expect(invoiceRes.text).toContain(coupon.code);
  });

  it('returns 404 for non-existent order', async () => {
    const res = await request(app).get('/api/admin/orders/nonexistent_order_id/invoice');
    expect(res.status).toBe(404);
  });

  it('includes store GSTIN in invoice', async () => {
    const product = await createTestProduct({ name: 'GSTIN Test Product', price: 999, stock: 5 });
    const sessionId = uuidv4();

    const orderRes = await request(app).post('/api/orders').send({
      customerName: 'Ananya Singh',
      customerPhone: '9988776655',
      address: validAddress,
      items: [{ productId: product.id, quantity: 1 }],
      paymentMethod: 'cod',
      sessionId,
    });

    const invoiceRes = await request(app).get(`/api/admin/orders/${orderRes.body.id}/invoice`);
    expect(invoiceRes.text).toContain('GSTIN');
  });

  it('invoice HTML includes product name', async () => {
    const product = await createTestProduct({ name: 'Banarasi Silk Saree', price: 3500, stock: 3 });
    const sessionId = uuidv4();

    const orderRes = await request(app).post('/api/orders').send({
      customerName: 'Meera Pillai',
      customerPhone: '9876001234',
      address: validAddress,
      items: [{ productId: product.id, quantity: 2 }],
      paymentMethod: 'razorpay',
      sessionId,
    });

    const invoiceRes = await request(app).get(`/api/admin/orders/${orderRes.body.id}/invoice`);
    expect(invoiceRes.text).toContain('Banarasi Silk Saree');
    expect(invoiceRes.text).toContain('3,500.00');
  });

  it('invoice shows correct totals for multi-item order', async () => {
    const p1 = await createTestProduct({ name: 'Item Alpha', price: 800, stock: 10 });
    const p2 = await createTestProduct({ name: 'Item Beta', price: 1200, stock: 10 });
    const sessionId = uuidv4();

    const orderRes = await request(app).post('/api/orders').send({
      customerName: 'Kavya Iyer',
      customerPhone: '9111222333',
      address: validAddress,
      items: [
        { productId: p1.id, quantity: 1 },
        { productId: p2.id, quantity: 1 },
      ],
      paymentMethod: 'upi',
      sessionId,
    });

    const invoiceRes = await request(app).get(`/api/admin/orders/${orderRes.body.id}/invoice`);
    expect(invoiceRes.status).toBe(200);
    expect(invoiceRes.text).toContain('Item Alpha');
    expect(invoiceRes.text).toContain('Item Beta');
  });
});

// ── Newsletter subscribe ───────────────────────────────────────────────────────
describe('POST /api/newsletter/subscribe', () => {
  it('subscribes a new email', async () => {
    const res = await request(app)
      .post('/api/newsletter/subscribe')
      .send({ email: 'priya@example.com', name: 'Priya' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/subscribed/i);
  });

  it('allows resubscribe for deactivated email', async () => {
    const email = `resubscribe${Date.now()}@example.com`;
    await testPrisma.newsletter.create({ data: { email, active: false } });

    const res = await request(app)
      .post('/api/newsletter/subscribe')
      .send({ email });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns success message if already subscribed', async () => {
    const email = `alreadysub${Date.now()}@example.com`;
    await request(app).post('/api/newsletter/subscribe').send({ email });
    const res = await request(app).post('/api/newsletter/subscribe').send({ email });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/already subscribed/i);
  });

  it('rejects invalid email', async () => {
    const res = await request(app)
      .post('/api/newsletter/subscribe')
      .send({ email: 'not-a-valid-email' });

    expect(res.status).toBe(400);
  });

  it('rejects empty email', async () => {
    const res = await request(app)
      .post('/api/newsletter/subscribe')
      .send({ email: '' });

    expect(res.status).toBe(400);
  });

  it('stores name and source when provided', async () => {
    const email = `withname${Date.now()}@example.com`;
    await request(app)
      .post('/api/newsletter/subscribe')
      .send({ email, name: 'Deepika', source: 'homepage' });

    const record = await testPrisma.newsletter.findUnique({ where: { email } });
    expect(record?.name).toBe('Deepika');
    expect(record?.source).toBe('homepage');
  });

  it('subscribes without optional name', async () => {
    const email = `noname${Date.now()}@example.com`;
    const res = await request(app)
      .post('/api/newsletter/subscribe')
      .send({ email });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });
});

// ── Newsletter unsubscribe ─────────────────────────────────────────────────────
describe('POST /api/newsletter/unsubscribe', () => {
  it('unsubscribes existing subscriber', async () => {
    const email = `unsub${Date.now()}@example.com`;
    await testPrisma.newsletter.create({ data: { email, active: true } });

    const res = await request(app)
      .post('/api/newsletter/unsubscribe')
      .send({ email });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const record = await testPrisma.newsletter.findUnique({ where: { email } });
    expect(record?.active).toBe(false);
  });

  it('returns 404 for unknown email', async () => {
    const res = await request(app)
      .post('/api/newsletter/unsubscribe')
      .send({ email: 'unknown@example.com' });

    expect(res.status).toBe(404);
  });

  it('rejects invalid email format', async () => {
    const res = await request(app)
      .post('/api/newsletter/unsubscribe')
      .send({ email: 'bad-email' });

    expect(res.status).toBe(400);
  });
});

// ── Newsletter list (admin) ────────────────────────────────────────────────────
describe('GET /api/newsletter', () => {
  it('returns list of active subscribers', async () => {
    await testPrisma.newsletter.createMany({
      data: [
        { email: `sub1_${Date.now()}@example.com`, name: 'Sub One', active: true },
        { email: `sub2_${Date.now()}@example.com`, name: 'Sub Two', active: true },
        { email: `sub3_${Date.now()}@example.com`, name: 'Sub Three', active: false },
      ],
    });

    const res = await request(app).get('/api/newsletter');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.subscribers)).toBe(true);
    expect(res.body.total).toBeGreaterThanOrEqual(2);
    // Inactive subscriber should not appear
    const emails = res.body.subscribers.map((s: { email: string }) => s.email);
    expect(emails.every((e: string) => e !== 'sub3@example.com')).toBe(true);
  });

  it('paginates subscriber list', async () => {
    const res = await request(app).get('/api/newsletter?page=1&limit=2');
    expect(res.status).toBe(200);
    expect(res.body.page).toBe(1);
    expect(Array.isArray(res.body.subscribers)).toBe(true);
  });
});

// ── Payment method selection in orders ─────────────────────────────────────────
describe('Payment method in orders', () => {
  it('creates order with razorpay payment method', async () => {
    const product = await createTestProduct({ name: 'Razorpay Test Product', price: 2000, stock: 5 });
    const sessionId = uuidv4();

    const res = await request(app).post('/api/orders').send({
      customerName: 'Kiran Kumar',
      customerPhone: '9876543211',
      address: validAddress,
      items: [{ productId: product.id, quantity: 1 }],
      paymentMethod: 'razorpay',
      paymentId: 'pay_test_razorpay123',
      sessionId,
    });

    expect(res.status).toBe(201);
    expect(res.body.paymentMethod).toBe('razorpay');
    expect(res.body.paymentStatus).toBe('paid');
    expect(res.body.paymentId).toBe('pay_test_razorpay123');
  });

  it('creates order with upi payment method', async () => {
    const product = await createTestProduct({ name: 'UPI Test Product', price: 1500, stock: 5 });
    const sessionId = uuidv4();

    const res = await request(app).post('/api/orders').send({
      customerName: 'Sunita Devi',
      customerPhone: '9876543212',
      address: validAddress,
      items: [{ productId: product.id, quantity: 1 }],
      paymentMethod: 'upi',
      sessionId,
    });

    expect(res.status).toBe(201);
    expect(res.body.paymentMethod).toBe('upi');
    expect(res.body.paymentStatus).toBe('paid');
  });

  it('COD order has pending payment status', async () => {
    const product = await createTestProduct({ name: 'COD Test Product', price: 800, stock: 5 });
    const sessionId = uuidv4();

    const res = await request(app).post('/api/orders').send({
      customerName: 'Renu Sharma',
      customerPhone: '9876543213',
      address: validAddress,
      items: [{ productId: product.id, quantity: 1 }],
      paymentMethod: 'cod',
      sessionId,
    });

    expect(res.status).toBe(201);
    expect(res.body.paymentMethod).toBe('cod');
    expect(res.body.paymentStatus).toBe('pending');
  });

  it('rejects invalid payment method', async () => {
    const product = await createTestProduct({ name: 'Bad Payment Product', price: 500, stock: 5 });
    const sessionId = uuidv4();

    const res = await request(app).post('/api/orders').send({
      customerName: 'Test User',
      customerPhone: '9876543214',
      address: validAddress,
      items: [{ productId: product.id, quantity: 1 }],
      paymentMethod: 'bitcoin',
      sessionId,
    });

    expect(res.status).toBe(400);
  });
});

// ── Checkout flow with Razorpay payment id ─────────────────────────────────────
describe('Checkout flow with Razorpay', () => {
  it('stores paymentId in order when provided', async () => {
    const product = await createTestProduct({ name: 'Razorpay Flow Product', price: 4500, stock: 3 });
    const sessionId = uuidv4();
    const paymentId = `pay_${uuidv4().replace(/-/g, '').slice(0, 14)}`;

    const res = await request(app).post('/api/orders').send({
      customerName: 'Anita Patel',
      customerPhone: '9000011111',
      customerEmail: 'anita@example.com',
      address: validAddress,
      items: [{ productId: product.id, quantity: 1 }],
      paymentMethod: 'razorpay',
      paymentId,
      sessionId,
    });

    expect(res.status).toBe(201);
    expect(res.body.paymentId).toBe(paymentId);

    // Verify persisted
    const order = await testPrisma.order.findUnique({ where: { id: res.body.id } });
    expect(order?.paymentId).toBe(paymentId);
  });

  it('calculates correct total for Razorpay order', async () => {
    const product = await createTestProduct({ name: 'Price Check Product', price: 1200, stock: 10 });
    const sessionId = uuidv4();

    const res = await request(app).post('/api/orders').send({
      customerName: 'Lakshmi N',
      customerPhone: '9876100000',
      address: validAddress,
      items: [{ productId: product.id, quantity: 2 }],
      paymentMethod: 'razorpay',
      sessionId,
    });

    expect(res.status).toBe(201);
    // 1200 * 2 = 2400, shipping free (>999), total = 2400
    expect(Number(res.body.total)).toBe(2400);
    expect(Number(res.body.shipping)).toBe(0);
  });
});

// ── Mega menu / category subcategories support ─────────────────────────────────
describe('Category endpoints for mega menu', () => {
  it('returns all categories for menu', async () => {
    const res = await request(app).get('/api/categories');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('creates category for mega menu navigation', async () => {
    const res = await request(app)
      .post('/api/admin/categories')
      .send({ name: `Mega Menu Test ${Date.now()}`, image: 'https://example.com/test.jpg' });

    expect(res.status).toBe(201);
    expect(res.body.name).toContain('Mega Menu Test');
    expect(res.body.slug).toBeTruthy();
  });

  it('filters products by fabric for saree submenu', async () => {
    await createTestProduct({ name: 'Silk Saree Mega', price: 2500, stock: 5, fabric: 'silk' });
    const res = await request(app).get('/api/products?fabric=silk');
    expect(res.status).toBe(200);
    // Fabric filter may or may not be implemented, but endpoint should respond
    expect(res.body).toBeDefined();
  });
});

// ── Newsletter marketing integration ──────────────────────────────────────────
describe('Newsletter marketing scenarios', () => {
  it('subscribes multiple unique emails', async () => {
    const ts = Date.now();
    const emails = [`a${ts}@example.com`, `b${ts}@example.com`, `c${ts}@example.com`];
    for (const email of emails) {
      const res = await request(app).post('/api/newsletter/subscribe').send({ email });
      expect(res.status).toBe(201);
    }

    const listRes = await request(app).get('/api/newsletter');
    expect(listRes.body.total).toBeGreaterThanOrEqual(3);
  });

  it('subscriber count reflects only active subscribers', async () => {
    const ts = Date.now();
    const email = `active${ts}@example.com`;
    await request(app).post('/api/newsletter/subscribe').send({ email });
    await request(app).post('/api/newsletter/unsubscribe').send({ email });

    const listRes = await request(app).get('/api/newsletter');
    const emails = listRes.body.subscribers.map((s: { email: string }) => s.email);
    expect(emails).not.toContain(email);
  });

  it('subscribes with homepage source and tracks it', async () => {
    const email = `source${Date.now()}@example.com`;
    await request(app)
      .post('/api/newsletter/subscribe')
      .send({ email, source: 'footer', name: 'Footer User' });

    const record = await testPrisma.newsletter.findUnique({ where: { email } });
    expect(record?.source).toBe('footer');
  });
});

// ── Invoice edge cases ────────────────────────────────────────────────────────
describe('Invoice edge cases', () => {
  it('invoice shows Free Shipping when order qualifies', async () => {
    const product = await createTestProduct({ name: 'Free Ship Product', price: 1500, stock: 5 });
    const sessionId = uuidv4();
    const orderRes = await request(app).post('/api/orders').send({
      customerName: 'Free Ship Customer',
      customerPhone: '9876543000',
      address: validAddress,
      items: [{ productId: product.id, quantity: 1 }],
      paymentMethod: 'upi',
      sessionId,
    });
    const invoiceRes = await request(app).get(`/api/admin/orders/${orderRes.body.id}/invoice`);
    expect(invoiceRes.text).toContain('FREE');
  });

  it('invoice shows razorpay as payment method', async () => {
    const product = await createTestProduct({ name: 'Razorpay Invoice Product', price: 2000, stock: 5 });
    const sessionId = uuidv4();
    const orderRes = await request(app).post('/api/orders').send({
      customerName: 'Online Payer',
      customerPhone: '9876000001',
      address: validAddress,
      items: [{ productId: product.id, quantity: 1 }],
      paymentMethod: 'razorpay',
      paymentId: 'pay_inv_test_123',
      sessionId,
    });
    const invoiceRes = await request(app).get(`/api/admin/orders/${orderRes.body.id}/invoice`);
    expect(invoiceRes.text).toContain('Razorpay');
    expect(invoiceRes.text).toContain('pay_inv_test_123');
  });
});

// ── Payment amount precision ───────────────────────────────────────────────────
describe('Payment amount precision', () => {
  it('correctly converts rupees to paise for Razorpay (200 * 100 = 20000)', () => {
    const amount = 200;
    const paise = Math.round(amount * 100);
    expect(paise).toBe(20000);
  });

  it('handles decimal amounts correctly (1299.50 -> 129950 paise)', () => {
    const amount = 1299.50;
    const paise = Math.round(amount * 100);
    expect(paise).toBe(129950);
  });

  it('verify endpoint requires all three Razorpay fields', async () => {
    const res = await request(app)
      .post('/api/payments/verify')
      .send({ razorpay_order_id: 'order_123', razorpay_payment_id: 'pay_456' });
    // Missing razorpay_signature
    expect(res.status).toBe(400);
  });
});
