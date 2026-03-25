/**
 * Build 11 tests — abandoned cart, bundles, gift cards, pre-orders,
 * store credits, customer segments, webhooks, performance metrics.
 * Target: 825+ total tests (~100 new)
 */
import request from 'supertest';
import { app } from '../index';
import {
  createTestProduct,
  createTestUser,
  cleanupTest,
  testPrisma,
} from './helpers';

beforeEach(async () => {
  await cleanupTest();
  // Clean Build 11 tables
  await testPrisma.webhookDelivery.deleteMany({});
  await testPrisma.webhook.deleteMany({});
  await testPrisma.giftCardTransaction.deleteMany({});
  await testPrisma.giftCard.deleteMany({});
  await testPrisma.preOrderBooking.deleteMany({});
  await testPrisma.preOrder.deleteMany({});
  await testPrisma.storeCredit.deleteMany({});
  await testPrisma.bundle.deleteMany({});
  await testPrisma.abandonedCart.deleteMany({});
});

afterAll(async () => {
  await testPrisma.webhookDelivery.deleteMany({});
  await testPrisma.webhook.deleteMany({});
  await testPrisma.giftCardTransaction.deleteMany({});
  await testPrisma.giftCard.deleteMany({});
  await testPrisma.preOrderBooking.deleteMany({});
  await testPrisma.preOrder.deleteMany({});
  await testPrisma.storeCredit.deleteMany({});
  await testPrisma.bundle.deleteMany({});
  await testPrisma.abandonedCart.deleteMany({});
  await cleanupTest();
  await testPrisma.$disconnect();
});

// ── Abandoned Cart ─────────────────────────────────────────────────────────

describe('Abandoned Cart — track', () => {
  it('creates abandoned cart record', async () => {
    const res = await request(app)
      .post('/api/abandoned-carts/track')
      .send({
        sessionId: 'sess-abc',
        items: [{ productId: 'p1', name: 'Saree', quantity: 1, price: 2999 }],
      });
    expect(res.status).toBe(200);
    expect(res.body.sessionId).toBe('sess-abc');
    expect(res.body.recoveryToken).toBeDefined();
  });

  it('upserts existing abandoned cart', async () => {
    await request(app)
      .post('/api/abandoned-carts/track')
      .send({ sessionId: 'sess-upsert', items: [{ productId: 'p1' }] });
    const res = await request(app)
      .post('/api/abandoned-carts/track')
      .send({ sessionId: 'sess-upsert', items: [{ productId: 'p1' }, { productId: 'p2' }] });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
    expect((res.body.items as unknown[]).length).toBe(2);
  });

  it('stores userId when provided', async () => {
    const user = await createTestUser();
    const res = await request(app)
      .post('/api/abandoned-carts/track')
      .send({ sessionId: 'sess-user', userId: user.id, items: [] });
    expect(res.body.userId).toBe(user.id);
  });

  it('rejects missing sessionId', async () => {
    const res = await request(app)
      .post('/api/abandoned-carts/track')
      .send({ items: [] });
    expect(res.status).toBe(400);
  });
});

describe('Abandoned Cart — recovery', () => {
  it('returns cart items via recovery token', async () => {
    const track = await request(app)
      .post('/api/abandoned-carts/track')
      .send({ sessionId: 'sess-r1', items: [{ productId: 'x1' }] });
    const token = track.body.recoveryToken;

    const res = await request(app).get(`/api/abandoned-carts/recover/${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
  });

  it('marks cart as recovered', async () => {
    const track = await request(app)
      .post('/api/abandoned-carts/track')
      .send({ sessionId: 'sess-r2', items: [{ productId: 'x2' }] });
    const token = track.body.recoveryToken;

    const res = await request(app).post(`/api/abandoned-carts/recover/${token}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/recovered/i);
  });

  it('returns 404 for invalid token', async () => {
    const res = await request(app).get('/api/abandoned-carts/recover/bad-token-xyz');
    expect(res.status).toBe(404);
  });

  it('cannot recover the same cart twice', async () => {
    const track = await request(app)
      .post('/api/abandoned-carts/track')
      .send({ sessionId: 'sess-r3', items: [] });
    const token = track.body.recoveryToken;
    await request(app).post(`/api/abandoned-carts/recover/${token}`);
    const res = await request(app).post(`/api/abandoned-carts/recover/${token}`);
    expect(res.status).toBe(400);
  });
});

describe('Abandoned Cart — reminder', () => {
  it('sends reminder and marks reminderSent', async () => {
    await request(app)
      .post('/api/abandoned-carts/track')
      .send({ sessionId: 'sess-remind', items: [] });

    const res = await request(app).post('/api/abandoned-carts/send-reminder/sess-remind');
    expect(res.status).toBe(200);
    expect(res.body.recoveryToken).toBeDefined();
  });

  it('returns 404 for non-existent session', async () => {
    const res = await request(app).post('/api/abandoned-carts/send-reminder/no-such-session');
    expect(res.status).toBe(404);
  });
});

describe('Abandoned Cart — admin', () => {
  it('lists abandoned carts with stats', async () => {
    await request(app)
      .post('/api/abandoned-carts/track')
      .send({ sessionId: 'sess-admin1', items: [] });

    const res = await request(app).get('/api/abandoned-carts/admin/list');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.carts)).toBe(true);
    expect(res.body.stats).toBeDefined();
    expect(typeof res.body.stats.recoveryRate).toBe('number');
  });

  it('filters by recovered=false', async () => {
    await request(app)
      .post('/api/abandoned-carts/track')
      .send({ sessionId: 'sess-filter', items: [] });

    const res = await request(app).get('/api/abandoned-carts/admin/list?recovered=false');
    expect(res.status).toBe(200);
    res.body.carts.forEach((c: { recovered: boolean }) => expect(c.recovered).toBe(false));
  });

  it('deletes abandoned cart', async () => {
    const track = await request(app)
      .post('/api/abandoned-carts/track')
      .send({ sessionId: 'sess-del', items: [] });
    const id = track.body.id;

    const res = await request(app).delete(`/api/abandoned-carts/admin/${id}`);
    expect(res.status).toBe(200);
  });
});

// ── Product Bundles ────────────────────────────────────────────────────────

describe('Bundles — CRUD', () => {
  it('creates a bundle', async () => {
    const p1 = await createTestProduct({ name: 'Saree Bundle' });
    const p2 = await createTestProduct({ name: 'Blouse Bundle' });

    const res = await request(app)
      .post('/api/bundles/admin')
      .send({
        name: 'Saree + Blouse Combo',
        productIds: [p1.id, p2.id],
        bundlePrice: 2499,
        originalPrice: 2999,
      });
    expect(res.status).toBe(201);
    expect(res.body.savings).toBeCloseTo(500);
    expect(res.body.slug).toBeDefined();
  });

  it('lists active bundles', async () => {
    const p1 = await createTestProduct({ name: 'BL1' });
    const p2 = await createTestProduct({ name: 'BL2' });
    await request(app)
      .post('/api/bundles/admin')
      .send({ name: 'Bundle List Test', productIds: [p1.id, p2.id], bundlePrice: 1000, originalPrice: 1500 });

    const res = await request(app).get('/api/bundles');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('gets bundle by slug with products', async () => {
    const p1 = await createTestProduct({ name: 'SlugP1' });
    const p2 = await createTestProduct({ name: 'SlugP2' });
    const created = await request(app)
      .post('/api/bundles/admin')
      .send({ name: 'Slug Test Bundle', productIds: [p1.id, p2.id], bundlePrice: 800, originalPrice: 1200 });

    const res = await request(app).get(`/api/bundles/${created.body.slug}`);
    expect(res.status).toBe(200);
    expect(res.body.products).toBeDefined();
  });

  it('gets bundles for a specific product', async () => {
    const p1 = await createTestProduct({ name: 'ProductBundle1' });
    const p2 = await createTestProduct({ name: 'ProductBundle2' });
    await request(app)
      .post('/api/bundles/admin')
      .send({ name: 'Product Specific Bundle', productIds: [p1.id, p2.id], bundlePrice: 700, originalPrice: 1000 });

    const res = await request(app).get(`/api/bundles/product/${p1.id}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('updates a bundle', async () => {
    const p1 = await createTestProduct({ name: 'UpdP1' });
    const p2 = await createTestProduct({ name: 'UpdP2' });
    const created = await request(app)
      .post('/api/bundles/admin')
      .send({ name: 'Update Bundle', productIds: [p1.id, p2.id], bundlePrice: 1000, originalPrice: 1500 });

    const res = await request(app)
      .put(`/api/bundles/admin/${created.body.id}`)
      .send({ bundlePrice: 900, originalPrice: 1500 });
    expect(res.status).toBe(200);
    expect(Number(res.body.bundlePrice)).toBe(900);
  });

  it('deletes a bundle', async () => {
    const p1 = await createTestProduct({ name: 'DelP1' });
    const p2 = await createTestProduct({ name: 'DelP2' });
    const created = await request(app)
      .post('/api/bundles/admin')
      .send({ name: 'Delete Bundle', productIds: [p1.id, p2.id], bundlePrice: 500, originalPrice: 800 });

    const res = await request(app).delete(`/api/bundles/admin/${created.body.id}`);
    expect(res.status).toBe(200);
  });

  it('returns 404 for non-existent bundle slug', async () => {
    const res = await request(app).get('/api/bundles/nonexistent-bundle-slug');
    expect(res.status).toBe(404);
  });

  it('requires at least 2 products in bundle', async () => {
    const p1 = await createTestProduct({ name: 'OnlyOne' });
    const res = await request(app)
      .post('/api/bundles/admin')
      .send({ name: 'One Product Bundle', productIds: [p1.id], bundlePrice: 500, originalPrice: 600 });
    expect(res.status).toBe(400);
  });
});

// ── Gift Cards ─────────────────────────────────────────────────────────────

describe('Gift Cards — purchase', () => {
  it('purchases a gift card for valid amount', async () => {
    const res = await request(app)
      .post('/api/gift-cards/purchase')
      .send({ amount: 1000, recipientEmail: 'gift@example.com', recipientName: 'Friend' });
    expect(res.status).toBe(201);
    expect(res.body.code).toBeDefined();
    expect(Number(res.body.balance)).toBe(1000);
    expect(res.body.expiresAt).toBeDefined();
  });

  it('rejects invalid amount', async () => {
    const res = await request(app)
      .post('/api/gift-cards/purchase')
      .send({ amount: 750 });
    expect(res.status).toBe(400);
  });

  it('rejects zero amount', async () => {
    const res = await request(app)
      .post('/api/gift-cards/purchase')
      .send({ amount: 0 });
    expect(res.status).toBe(400);
  });

  it('allows all valid denominations', async () => {
    for (const amount of [500, 1000, 2000, 5000]) {
      const res = await request(app)
        .post('/api/gift-cards/purchase')
        .send({ amount });
      expect(res.status).toBe(201);
      expect(Number(res.body.balance)).toBe(amount);
    }
  });
});

describe('Gift Cards — balance check', () => {
  it('checks gift card balance', async () => {
    const purchase = await request(app)
      .post('/api/gift-cards/purchase')
      .send({ amount: 2000 });
    const code = purchase.body.code;

    const res = await request(app).get(`/api/gift-cards/${code}/balance`);
    expect(res.status).toBe(200);
    expect(Number(res.body.balance)).toBe(2000);
    expect(res.body.expired).toBe(false);
  });

  it('returns 404 for non-existent code', async () => {
    const res = await request(app).get('/api/gift-cards/XXXX-XXXX-XXXX-XXXX/balance');
    expect(res.status).toBe(404);
  });
});

describe('Gift Cards — redeem', () => {
  it('redeems full gift card amount', async () => {
    const purchase = await request(app)
      .post('/api/gift-cards/purchase')
      .send({ amount: 500 });
    const code = purchase.body.code;

    const res = await request(app)
      .post('/api/gift-cards/redeem')
      .send({ code, amount: 500, orderId: 'order-123' });
    expect(res.status).toBe(200);
    expect(Number(res.body.deducted)).toBe(500);
    expect(Number(res.body.remainingBalance)).toBe(0);
  });

  it('partially redeems gift card', async () => {
    const purchase = await request(app)
      .post('/api/gift-cards/purchase')
      .send({ amount: 1000 });
    const code = purchase.body.code;

    const res = await request(app)
      .post('/api/gift-cards/redeem')
      .send({ code, amount: 300 });
    expect(res.status).toBe(200);
    expect(Number(res.body.deducted)).toBe(300);
    expect(Number(res.body.remainingBalance)).toBe(700);
  });

  it('clamps deduction to available balance', async () => {
    const purchase = await request(app)
      .post('/api/gift-cards/purchase')
      .send({ amount: 500 });
    const code = purchase.body.code;
    // First redeem 400
    await request(app).post('/api/gift-cards/redeem').send({ code, amount: 400 });
    // Try to redeem 300 more (only 100 left)
    const res = await request(app)
      .post('/api/gift-cards/redeem')
      .send({ code, amount: 300 });
    expect(res.status).toBe(200);
    expect(Number(res.body.deducted)).toBe(100);
    expect(Number(res.body.remainingBalance)).toBe(0);
  });

  it('returns 404 for non-existent gift card code', async () => {
    const res = await request(app)
      .post('/api/gift-cards/redeem')
      .send({ code: 'FAKE-CODE-1234-5678', amount: 100 });
    expect(res.status).toBe(404);
  });

  it('returns transactions list', async () => {
    const purchase = await request(app)
      .post('/api/gift-cards/purchase')
      .send({ amount: 1000 });
    const code = purchase.body.code;
    await request(app).post('/api/gift-cards/redeem').send({ code, amount: 200 });

    const res = await request(app).get(`/api/gift-cards/${code}/transactions`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
  });
});

// ── Pre-Orders ─────────────────────────────────────────────────────────────

describe('Pre-Orders — admin setup', () => {
  it('creates pre-order for a product', async () => {
    const product = await createTestProduct({ name: 'PreOrder Product' });
    const res = await request(app)
      .post('/api/pre-orders/admin')
      .send({
        productId: product.id,
        expectedShipDate: '2026-06-01',
        bookingAmount: 500,
        note: 'Ships April batch',
      });
    expect(res.status).toBe(201);
    expect(res.body.productId).toBe(product.id);
    expect(res.body.active).toBe(true);
  });

  it('upserts pre-order if one already exists for product', async () => {
    const product = await createTestProduct({ name: 'Upsert PreOrder' });
    await request(app)
      .post('/api/pre-orders/admin')
      .send({ productId: product.id, expectedShipDate: '2026-05-01' });
    const res = await request(app)
      .post('/api/pre-orders/admin')
      .send({ productId: product.id, expectedShipDate: '2026-06-01' });
    expect(res.status).toBe(201);
    expect(new Date(res.body.expectedShipDate).getMonth()).toBe(5); // June
  });

  it('returns 404 for non-existent product', async () => {
    const res = await request(app)
      .post('/api/pre-orders/admin')
      .send({ productId: 'nonexistent', expectedShipDate: '2026-05-01' });
    expect(res.status).toBe(404);
  });

  it('lists all pre-orders', async () => {
    const product = await createTestProduct({ name: 'List PreOrder' });
    await request(app)
      .post('/api/pre-orders/admin')
      .send({ productId: product.id, expectedShipDate: '2026-07-01' });

    const res = await request(app).get('/api/pre-orders/admin/list');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('deactivates pre-order', async () => {
    const product = await createTestProduct({ name: 'Deactivate PreOrder' });
    const created = await request(app)
      .post('/api/pre-orders/admin')
      .send({ productId: product.id, expectedShipDate: '2026-07-01' });

    const res = await request(app).put(`/api/pre-orders/admin/${created.body.id}/deactivate`);
    expect(res.status).toBe(200);

    const check = await request(app).get(`/api/pre-orders/product/${product.id}`);
    expect(check.body.isPreOrder).toBe(false);
  });
});

describe('Pre-Orders — customer booking', () => {
  it('shows isPreOrder=false for normal product', async () => {
    const product = await createTestProduct({ name: 'Normal Product' });
    const res = await request(app).get(`/api/pre-orders/product/${product.id}`);
    expect(res.status).toBe(200);
    expect(res.body.isPreOrder).toBe(false);
  });

  it('shows isPreOrder=true for pre-order product', async () => {
    const product = await createTestProduct({ name: 'Active PreOrder Product' });
    await request(app)
      .post('/api/pre-orders/admin')
      .send({ productId: product.id, expectedShipDate: '2026-06-01' });

    const res = await request(app).get(`/api/pre-orders/product/${product.id}`);
    expect(res.status).toBe(200);
    expect(res.body.isPreOrder).toBe(true);
  });

  it('books a pre-order', async () => {
    const product = await createTestProduct({ name: 'Bookable PreOrder' });
    await request(app)
      .post('/api/pre-orders/admin')
      .send({ productId: product.id, expectedShipDate: '2026-06-01', bookingAmount: 300 });

    const res = await request(app)
      .post('/api/pre-orders/book')
      .send({
        productId: product.id,
        customerName: 'Priya',
        customerPhone: '9876543210',
        customerEmail: 'priya@example.com',
        size: 'M',
        quantity: 1,
      });
    expect(res.status).toBe(201);
    expect(res.body.customerName).toBe('Priya');
  });

  it('rejects booking for product without pre-order', async () => {
    const product = await createTestProduct({ name: 'No PreOrder Product' });
    const res = await request(app)
      .post('/api/pre-orders/book')
      .send({ productId: product.id, customerName: 'Test', customerPhone: '9000000000' });
    expect(res.status).toBe(404);
  });

  it('notifies customers when product ships', async () => {
    const product = await createTestProduct({ name: 'Notify PreOrder' });
    const po = await request(app)
      .post('/api/pre-orders/admin')
      .send({ productId: product.id, expectedShipDate: '2026-06-01' });
    await request(app)
      .post('/api/pre-orders/book')
      .send({ productId: product.id, customerName: 'A', customerPhone: '9111111111' });

    const res = await request(app).post(`/api/pre-orders/admin/${po.body.id}/notify`);
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
  });

  it('gets bookings for pre-order', async () => {
    const product = await createTestProduct({ name: 'Bookings List PreOrder' });
    const po = await request(app)
      .post('/api/pre-orders/admin')
      .send({ productId: product.id, expectedShipDate: '2026-06-01' });
    await request(app)
      .post('/api/pre-orders/book')
      .send({ productId: product.id, customerName: 'B', customerPhone: '9222222222' });

    const res = await request(app).get(`/api/pre-orders/admin/${po.body.id}/bookings`);
    expect(res.status).toBe(200);
    expect(res.body.bookings.length).toBe(1);
  });
});

// ── Store Credits ──────────────────────────────────────────────────────────

describe('Store Credits — issue & balance', () => {
  it('issues store credit to a user', async () => {
    const user = await createTestUser();
    const res = await request(app)
      .post('/api/store-credits/issue')
      .send({ userId: user.id, amount: 200, source: 'return', note: 'Refund as credit' });
    expect(res.status).toBe(201);
    expect(Number(res.body.amount)).toBe(200);
    expect(res.body.source).toBe('return');
  });

  it('returns balance for user with credits', async () => {
    const user = await createTestUser();
    await request(app)
      .post('/api/store-credits/issue')
      .send({ userId: user.id, amount: 300, source: 'manual' });
    await request(app)
      .post('/api/store-credits/issue')
      .send({ userId: user.id, amount: 150, source: 'referral' });

    const res = await request(app).get(`/api/store-credits/balance/${user.id}`);
    expect(res.status).toBe(200);
    expect(res.body.balance).toBe(450);
    expect(res.body.credits.length).toBe(2);
  });

  it('returns zero balance for new user', async () => {
    const user = await createTestUser();
    const res = await request(app).get(`/api/store-credits/balance/${user.id}`);
    expect(res.status).toBe(200);
    expect(res.body.balance).toBe(0);
  });

  it('returns 404 for non-existent user', async () => {
    const res = await request(app).get('/api/store-credits/balance/nonexistent');
    expect(res.status).toBe(404);
  });

  it('does not include expired credits in balance', async () => {
    const user = await createTestUser();
    // Issue expired credit
    await testPrisma.storeCredit.create({
      data: {
        userId: user.id,
        amount: 500,
        source: 'manual',
        expiresAt: new Date(Date.now() - 1000), // expired
      },
    });
    const res = await request(app).get(`/api/store-credits/balance/${user.id}`);
    expect(res.body.balance).toBe(0);
  });

  it('rejects invalid source', async () => {
    const user = await createTestUser();
    const res = await request(app)
      .post('/api/store-credits/issue')
      .send({ userId: user.id, amount: 100, source: 'invalid_source' });
    expect(res.status).toBe(400);
  });
});

describe('Store Credits — apply', () => {
  it('applies store credit at checkout', async () => {
    const user = await createTestUser();
    await request(app)
      .post('/api/store-credits/issue')
      .send({ userId: user.id, amount: 500, source: 'return' });

    const res = await request(app)
      .post('/api/store-credits/apply')
      .send({ userId: user.id, amount: 300, orderId: 'order-apply-1' });
    expect(res.status).toBe(200);
    expect(res.body.applied).toBe(300);
    expect(res.body.remainingBalance).toBe(200);
  });

  it('rejects if insufficient balance', async () => {
    const user = await createTestUser();
    await request(app)
      .post('/api/store-credits/issue')
      .send({ userId: user.id, amount: 100, source: 'manual' });

    const res = await request(app)
      .post('/api/store-credits/apply')
      .send({ userId: user.id, amount: 500, orderId: 'order-apply-2' });
    expect(res.status).toBe(400);
  });

  it('gets credit history for user', async () => {
    const user = await createTestUser();
    await request(app)
      .post('/api/store-credits/issue')
      .send({ userId: user.id, amount: 200, source: 'loyalty' });

    const res = await request(app).get(`/api/store-credits/history/${user.id}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });
});

// ── Customer Segments ──────────────────────────────────────────────────────

describe('Customer Segments — logic', () => {
  it('new user with no orders = New segment', async () => {
    const user = await createTestUser();
    const res = await request(app).get(`/api/customer-segments/${user.id}`);
    expect(res.status).toBe(200);
    expect(res.body.segment).toBe('New');
  });

  it('returns segment summary counts', async () => {
    const res = await request(app).get('/api/customer-segments/summary');
    expect(res.status).toBe(200);
    expect(res.body.segments).toBeDefined();
    expect(typeof res.body.segments.New).toBe('number');
    expect(typeof res.body.segments.VIP).toBe('number');
  });

  it('lists customers with pagination', async () => {
    await createTestUser();
    const res = await request(app).get('/api/customer-segments?page=1&limit=10');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.customers)).toBe(true);
    expect(res.body.page).toBe(1);
  });

  it('filters customers by segment', async () => {
    await createTestUser();
    const res = await request(app).get('/api/customer-segments?segment=New');
    expect(res.status).toBe(200);
    res.body.customers.forEach((c: { segment: string }) => {
      expect(c.segment).toBe('New');
    });
  });

  it('returns 404 for non-existent user', async () => {
    const res = await request(app).get('/api/customer-segments/nonexistent-user');
    expect(res.status).toBe(404);
  });
});

// ── Webhooks ───────────────────────────────────────────────────────────────

describe('Webhooks — CRUD', () => {
  it('creates a webhook', async () => {
    const res = await request(app)
      .post('/api/webhooks/admin')
      .send({
        url: 'https://example.com/webhook',
        events: ['order.created', 'payment.received'],
      });
    expect(res.status).toBe(201);
    expect(res.body.secret).toBeDefined();
    expect(res.body.active).toBe(true);
  });

  it('rejects invalid event names', async () => {
    const res = await request(app)
      .post('/api/webhooks/admin')
      .send({ url: 'https://example.com/webhook', events: ['invalid.event'] });
    expect(res.status).toBe(400);
  });

  it('rejects invalid URL', async () => {
    const res = await request(app)
      .post('/api/webhooks/admin')
      .send({ url: 'not-a-url', events: ['order.created'] });
    expect(res.status).toBe(400);
  });

  it('lists webhooks', async () => {
    await request(app)
      .post('/api/webhooks/admin')
      .send({ url: 'https://example.com/wh1', events: ['order.created'] });

    const res = await request(app).get('/api/webhooks/admin');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('gets single webhook by id', async () => {
    const created = await request(app)
      .post('/api/webhooks/admin')
      .send({ url: 'https://example.com/wh2', events: ['order.shipped'] });

    const res = await request(app).get(`/api/webhooks/admin/${created.body.id}`);
    expect(res.status).toBe(200);
    expect(res.body.url).toBe('https://example.com/wh2');
  });

  it('updates a webhook', async () => {
    const created = await request(app)
      .post('/api/webhooks/admin')
      .send({ url: 'https://example.com/wh3', events: ['order.created'] });

    const res = await request(app)
      .put(`/api/webhooks/admin/${created.body.id}`)
      .send({ active: false });
    expect(res.status).toBe(200);
    expect(res.body.active).toBe(false);
  });

  it('deletes a webhook', async () => {
    const created = await request(app)
      .post('/api/webhooks/admin')
      .send({ url: 'https://example.com/wh4', events: ['order.created'] });

    const res = await request(app).delete(`/api/webhooks/admin/${created.body.id}`);
    expect(res.status).toBe(200);

    const check = await request(app).get(`/api/webhooks/admin/${created.body.id}`);
    expect(check.status).toBe(404);
  });

  it('returns 404 for non-existent webhook', async () => {
    const res = await request(app).get('/api/webhooks/admin/nonexistent-id');
    expect(res.status).toBe(404);
  });
});

describe('Webhooks — event delivery', () => {
  it('triggers event with no matching webhooks returns empty results', async () => {
    const res = await request(app)
      .post('/api/webhooks/trigger')
      .send({ event: 'order.created', payload: { orderId: 'o1', total: 1500 } });
    expect(res.status).toBe(200);
    expect(res.body.deliveries).toBe(0);
  });

  it('rejects invalid event type in trigger', async () => {
    const res = await request(app)
      .post('/api/webhooks/trigger')
      .send({ event: 'unknown.event', payload: {} });
    expect(res.status).toBe(400);
  });

  it('delivers event to active webhook (delivery logged even on failure)', async () => {
    // Create webhook pointing to a URL that will fail (that's ok, delivery should be logged)
    const wh = await request(app)
      .post('/api/webhooks/admin')
      .send({ url: 'https://httpbin.org/status/200', events: ['payment.received'] });

    const res = await request(app)
      .post('/api/webhooks/trigger')
      .send({ event: 'payment.received', payload: { amount: 999 } });
    expect(res.status).toBe(200);
    expect(res.body.deliveries).toBe(1);

    // Check delivery was logged
    const deliveries = await request(app).get(`/api/webhooks/admin/${wh.body.id}/deliveries`);
    expect(deliveries.status).toBe(200);
    expect(Array.isArray(deliveries.body)).toBe(true);
  });

  it('does not deliver to inactive webhook', async () => {
    await request(app)
      .post('/api/webhooks/admin')
      .send({ url: 'https://httpbin.org/status/200', events: ['order.shipped'], active: false });

    const res = await request(app)
      .post('/api/webhooks/trigger')
      .send({ event: 'order.shipped', payload: {} });
    expect(res.status).toBe(200);
    expect(res.body.deliveries).toBe(0);
  });
});

// ── Performance Metrics ────────────────────────────────────────────────────

describe('Performance Metrics', () => {
  it('returns main metrics dashboard', async () => {
    const res = await request(app).get('/api/performance-metrics');
    expect(res.status).toBe(200);
    expect(res.body.conversionFunnel).toBeDefined();
    expect(typeof res.body.cartAbandonmentRate).toBe('number');
    expect(res.body.pageLoadTimes).toBeDefined();
    expect(res.body.deviceBreakdown).toBeDefined();
  });

  it('pageLoadTimes includes key pages', async () => {
    const res = await request(app).get('/api/performance-metrics');
    expect(res.body.pageLoadTimes.home).toBeDefined();
    expect(res.body.pageLoadTimes.checkout).toBeDefined();
    expect(res.body.pageLoadTimes.unit).toBe('seconds');
  });

  it('deviceBreakdown sums to 100', async () => {
    const res = await request(app).get('/api/performance-metrics');
    const { mobile, desktop, tablet } = res.body.deviceBreakdown;
    expect(mobile + desktop + tablet).toBe(100);
  });

  it('recoveryRate is between 0 and 100', async () => {
    const res = await request(app).get('/api/performance-metrics');
    expect(res.body.recoveryRate).toBeGreaterThanOrEqual(0);
    expect(res.body.recoveryRate).toBeLessThanOrEqual(100);
  });

  it('returns conversion funnel stats', async () => {
    const res = await request(app).get('/api/performance-metrics/conversion');
    expect(res.status).toBe(200);
    expect(res.body.conversionRate).toBeGreaterThanOrEqual(0);
    expect(typeof res.body.paid).toBe('number');
  });

  it('returns cart abandonment stats', async () => {
    const res = await request(app).get('/api/performance-metrics/abandonment');
    expect(res.status).toBe(200);
    expect(typeof res.body.abandonmentRate).toBe('number');
    expect(typeof res.body.recoveryRate).toBe('number');
  });

  it('conversionFunnel has all stages', async () => {
    const res = await request(app).get('/api/performance-metrics');
    const funnel = res.body.conversionFunnel;
    expect(funnel.visitors).toBeDefined();
    expect(funnel.addedToCart).toBeDefined();
    expect(funnel.reachedCheckout).toBeDefined();
    expect(funnel.paid).toBeDefined();
  });

  it('avgTimeToPurchaseHours is a positive number', async () => {
    const res = await request(app).get('/api/performance-metrics');
    expect(res.body.avgTimeToPurchaseHours).toBeGreaterThan(0);
  });
});

// ── Additional coverage ────────────────────────────────────────────────────

describe('Abandoned Cart — edge cases', () => {
  it('recovery token is unique per cart', async () => {
    const a = await request(app)
      .post('/api/abandoned-carts/track')
      .send({ sessionId: 'edge-a', items: [] });
    const b = await request(app)
      .post('/api/abandoned-carts/track')
      .send({ sessionId: 'edge-b', items: [] });
    expect(a.body.recoveryToken).not.toBe(b.body.recoveryToken);
  });

  it('recovered cart still readable via token', async () => {
    const track = await request(app)
      .post('/api/abandoned-carts/track')
      .send({ sessionId: 'read-after-recover', items: [{ id: 'p1' }] });
    const token = track.body.recoveryToken;
    await request(app).post(`/api/abandoned-carts/recover/${token}`);
    const res = await request(app).get(`/api/abandoned-carts/recover/${token}`);
    expect(res.status).toBe(200);
    expect(res.body.recovered).toBe(true);
  });

  it('stats show recovery rate 0 when none recovered', async () => {
    await request(app)
      .post('/api/abandoned-carts/track')
      .send({ sessionId: 'no-recover-cart', items: [] });
    const res = await request(app).get('/api/abandoned-carts/admin/list?recovered=false');
    expect(res.body.stats.recoveryRate).toBeGreaterThanOrEqual(0);
  });
});

describe('Bundles — admin list', () => {
  it('admin list includes inactive bundles', async () => {
    const p1 = await createTestProduct({ name: 'InactiveP1' });
    const p2 = await createTestProduct({ name: 'InactiveP2' });
    const created = await request(app)
      .post('/api/bundles/admin')
      .send({ name: 'Inactive Bundle', productIds: [p1.id, p2.id], bundlePrice: 500, originalPrice: 600 });
    await request(app).put(`/api/bundles/admin/${created.body.id}`).send({ active: false });

    const res = await request(app).get('/api/bundles/admin/list');
    expect(res.status).toBe(200);
    const inactive = res.body.filter((b: { active: boolean }) => !b.active);
    expect(inactive.length).toBeGreaterThan(0);
  });

  it('inactive bundle not returned in public list', async () => {
    const p1 = await createTestProduct({ name: 'PubInactiveP1' });
    const p2 = await createTestProduct({ name: 'PubInactiveP2' });
    const created = await request(app)
      .post('/api/bundles/admin')
      .send({ name: 'Hidden Bundle', productIds: [p1.id, p2.id], bundlePrice: 600, originalPrice: 800, active: false });

    const res = await request(app).get('/api/bundles');
    const found = (res.body as { id: string }[]).find((b) => b.id === created.body.id);
    expect(found).toBeUndefined();
  });
});

describe('Gift Cards — admin list', () => {
  it('lists gift cards with pagination', async () => {
    await request(app).post('/api/gift-cards/purchase').send({ amount: 500 });
    const res = await request(app).get('/api/gift-cards/admin/list?page=1&limit=10');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.cards)).toBe(true);
    expect(res.body.page).toBe(1);
  });

  it('gift card balance decreases after partial redeem', async () => {
    const purchase = await request(app).post('/api/gift-cards/purchase').send({ amount: 2000 });
    const code = purchase.body.code;
    await request(app).post('/api/gift-cards/redeem').send({ code, amount: 800 });

    const balance = await request(app).get(`/api/gift-cards/${code}/balance`);
    expect(Number(balance.body.balance)).toBe(1200);
  });

  it('multiple transactions recorded for multiple redeems', async () => {
    const purchase = await request(app).post('/api/gift-cards/purchase').send({ amount: 2000 });
    const code = purchase.body.code;
    await request(app).post('/api/gift-cards/redeem').send({ code, amount: 400 });
    await request(app).post('/api/gift-cards/redeem').send({ code, amount: 300 });

    const txns = await request(app).get(`/api/gift-cards/${code}/transactions`);
    expect(txns.body.length).toBe(2);
  });
});

describe('Store Credits — expiry & history', () => {
  it('issued credit with expiry shows in history', async () => {
    const user = await createTestUser();
    await request(app)
      .post('/api/store-credits/issue')
      .send({ userId: user.id, amount: 100, source: 'manual', expiresInDays: 30 });

    const res = await request(app).get(`/api/store-credits/history/${user.id}`);
    expect(res.status).toBe(200);
    expect(res.body[0].expiresAt).not.toBeNull();
  });

  it('history returns 404 for non-existent user', async () => {
    const res = await request(app).get('/api/store-credits/history/nonexistent');
    expect(res.status).toBe(404);
  });

  it('cannot apply credits for non-existent user', async () => {
    const res = await request(app)
      .post('/api/store-credits/apply')
      .send({ userId: 'nonexistent', amount: 100, orderId: 'o-x' });
    expect(res.status).toBe(404);
  });

  it('issued credit without expiry has null expiresAt', async () => {
    const user = await createTestUser();
    await request(app)
      .post('/api/store-credits/issue')
      .send({ userId: user.id, amount: 200, source: 'return' });

    const res = await request(app).get(`/api/store-credits/history/${user.id}`);
    expect(res.body[0].expiresAt).toBeNull();
  });
});

describe('Webhooks — update events', () => {
  it('updates webhook events list', async () => {
    const created = await request(app)
      .post('/api/webhooks/admin')
      .send({ url: 'https://example.com/wh-upd', events: ['order.created'] });

    const res = await request(app)
      .put(`/api/webhooks/admin/${created.body.id}`)
      .send({ events: ['order.created', 'order.shipped'] });
    expect(res.status).toBe(200);
    expect(res.body.events).toContain('order.shipped');
  });

  it('rejects update with invalid event names', async () => {
    const created = await request(app)
      .post('/api/webhooks/admin')
      .send({ url: 'https://example.com/wh-inv', events: ['order.created'] });

    const res = await request(app)
      .put(`/api/webhooks/admin/${created.body.id}`)
      .send({ events: ['bad.event'] });
    expect(res.status).toBe(400);
  });
});

describe('Pre-Orders — validation', () => {
  it('rejects booking without phone', async () => {
    const product = await createTestProduct({ name: 'No Phone PreOrder' });
    await request(app)
      .post('/api/pre-orders/admin')
      .send({ productId: product.id, expectedShipDate: '2026-06-01' });

    const res = await request(app)
      .post('/api/pre-orders/book')
      .send({ productId: product.id, customerName: 'Test' }); // missing phone
    expect(res.status).toBe(400);
  });

  it('notify returns 0 when all customers already notified', async () => {
    const product = await createTestProduct({ name: 'All Notified PreOrder' });
    const po = await request(app)
      .post('/api/pre-orders/admin')
      .send({ productId: product.id, expectedShipDate: '2026-06-01' });
    // No bookings
    const res = await request(app).post(`/api/pre-orders/admin/${po.body.id}/notify`);
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(0);
  });
});

describe('Bundle savings calculation', () => {
  it('savings = originalPrice - bundlePrice', async () => {
    const p1 = await createTestProduct({ name: 'SaveP1' });
    const p2 = await createTestProduct({ name: 'SaveP2' });
    const res = await request(app)
      .post('/api/bundles/admin')
      .send({ name: 'Savings Test Bundle', productIds: [p1.id, p2.id], bundlePrice: 1800, originalPrice: 2500 });
    expect(res.status).toBe(201);
    expect(Number(res.body.savings)).toBe(700);
  });

  it('returns 404 for deleting non-existent bundle', async () => {
    const res = await request(app).delete('/api/bundles/admin/nonexistent-bundle');
    expect(res.status).toBe(404);
  });

  it('returns 404 for updating non-existent bundle', async () => {
    const res = await request(app).put('/api/bundles/admin/nonexistent-bundle').send({ active: false });
    expect(res.status).toBe(404);
  });
});

describe('Customer Segments — VIP threshold', () => {
  it('summary has all four segment keys', async () => {
    const res = await request(app).get('/api/customer-segments/summary');
    expect(res.body.segments.New).toBeDefined();
    expect(res.body.segments.Returning).toBeDefined();
    expect(res.body.segments.VIP).toBeDefined();
    expect(res.body.segments.AtRisk).toBeDefined();
  });

  it('total equals sum of segment counts', async () => {
    await createTestUser();
    const res = await request(app).get('/api/customer-segments/summary');
    const { New, Returning, VIP, AtRisk } = res.body.segments;
    expect(New + Returning + VIP + AtRisk).toBe(res.body.total);
  });

  it('page 2 empty when fewer than limit customers', async () => {
    const res = await request(app).get('/api/customer-segments?page=999&limit=100');
    expect(res.status).toBe(200);
    expect(res.body.customers.length).toBe(0);
  });
});
