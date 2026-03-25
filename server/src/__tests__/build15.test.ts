/**
 * Build 15 tests — Admin power tools, cross-sell, multi-address, invoice,
 * order workflow, product analytics, store optimization.
 * Target: push total to 1100+
 */
import request from 'supertest';
import { app } from '../index';
import {
  createTestProduct,
  createTestCategory,
  createTestUser,
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
  line1: '12 Jubilee Hills',
  city: 'Hyderabad',
  state: 'Telangana',
  pincode: '500033',
};

async function placeOrder(phone: string, total: number, productId: string, status = 'placed') {
  return testPrisma.order.create({
    data: {
      orderNumber: `SB-B15-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      customerName: 'Test Customer',
      customerPhone: phone,
      address: validAddress,
      subtotal: total,
      shipping: 0,
      discount: 0,
      total,
      paymentMethod: 'cod',
      status,
      items: {
        create: [{ productId, name: 'Test Product', price: total, quantity: 1 }],
      },
    },
  });
}

// ── Admin Dashboard Widgets ────────────────────────────────────────────────────

describe('GET /api/admin/dashboard/widgets', () => {
  it('returns expected widget structure', async () => {
    const res = await request(app).get('/api/admin/dashboard/widgets');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('todayOrders');
    expect(res.body).toHaveProperty('todayRevenue');
    expect(res.body).toHaveProperty('totalProducts');
    expect(res.body).toHaveProperty('lowStockCount');
    expect(res.body).toHaveProperty('pendingReturnsCount');
    expect(res.body).toHaveProperty('unreadChatsCount');
    expect(res.body).toHaveProperty('topSellingProducts');
    expect(res.body).toHaveProperty('recentOrders');
    expect(res.body).toHaveProperty('weekRevenue7');
    expect(res.body).toHaveProperty('weekRevenue30');
  });

  it('topSellingProducts is an array', async () => {
    const res = await request(app).get('/api/admin/dashboard/widgets');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.topSellingProducts)).toBe(true);
  });

  it('recentOrders is an array', async () => {
    const res = await request(app).get('/api/admin/dashboard/widgets');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.recentOrders)).toBe(true);
  });

  it('counts pending returns correctly', async () => {
    await testPrisma.returnRequest.create({
      data: {
        orderNumber: 'SB-RET-B15',
        customerName: 'Widget Return Customer',
        customerPhone: '9800000001',
        reason: 'defective',
        description: 'broken',
        status: 'pending',
      },
    });
    const res = await request(app).get('/api/admin/dashboard/widgets');
    expect(res.status).toBe(200);
    expect(res.body.pendingReturnsCount).toBeGreaterThanOrEqual(1);
  });

  it('counts low stock products correctly', async () => {
    await createTestProduct({ name: 'Dashboard Low Stock B15', stock: 2, active: true });
    const res = await request(app).get('/api/admin/dashboard/widgets');
    expect(res.status).toBe(200);
    expect(res.body.lowStockCount).toBeGreaterThanOrEqual(1);
  });

  it('lowStockCount is numeric', async () => {
    const res = await request(app).get('/api/admin/dashboard/widgets');
    expect(typeof res.body.lowStockCount).toBe('number');
  });

  it('weekRevenue7 and weekRevenue30 are numbers', async () => {
    const res = await request(app).get('/api/admin/dashboard/widgets');
    expect(typeof res.body.weekRevenue7).toBe('number');
    expect(typeof res.body.weekRevenue30).toBe('number');
  });
});

// ── Revenue Chart ──────────────────────────────────────────────────────────────

describe('GET /api/admin/revenue-chart', () => {
  it('returns chart with default 7 days', async () => {
    const res = await request(app).get('/api/admin/revenue-chart');
    expect(res.status).toBe(200);
    expect(res.body.days).toBe(7);
    expect(Array.isArray(res.body.chart)).toBe(true);
    expect(res.body.chart).toHaveLength(7);
  });

  it('returns chart with 30 days', async () => {
    const res = await request(app).get('/api/admin/revenue-chart?days=30');
    expect(res.status).toBe(200);
    expect(res.body.days).toBe(30);
    expect(res.body.chart).toHaveLength(30);
  });

  it('each chart entry has date, revenue, orders', async () => {
    const res = await request(app).get('/api/admin/revenue-chart?days=7');
    expect(res.status).toBe(200);
    const entry = res.body.chart[0];
    expect(entry).toHaveProperty('date');
    expect(entry).toHaveProperty('revenue');
    expect(entry).toHaveProperty('orders');
  });

  it('dates are in YYYY-MM-DD format', async () => {
    const res = await request(app).get('/api/admin/revenue-chart?days=7');
    expect(res.status).toBe(200);
    for (const entry of res.body.chart) {
      expect(entry.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('totalRevenue is a number', async () => {
    const res = await request(app).get('/api/admin/revenue-chart');
    expect(res.status).toBe(200);
    expect(typeof res.body.totalRevenue).toBe('number');
  });

  it('caps days at 90', async () => {
    const res = await request(app).get('/api/admin/revenue-chart?days=200');
    expect(res.status).toBe(200);
    expect(res.body.days).toBe(90);
    expect(res.body.chart).toHaveLength(90);
  });
});

// ── Order Status Timeline ─────────────────────────────────────────────────────

describe('GET /api/admin/orders/:id/timeline', () => {
  it('returns timeline for a placed order', async () => {
    const product = await createTestProduct({ stock: 5 });
    const order = await placeOrder('9811000001', 1000, product.id, 'placed');

    const res = await request(app).get(`/api/admin/orders/${order.id}/timeline`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('timeline');
    expect(res.body).toHaveProperty('nextStatus');
    expect(res.body).toHaveProperty('canAdvance');
    expect(Array.isArray(res.body.timeline)).toBe(true);
  });

  it('timeline has 5 steps (placed → delivered)', async () => {
    const product = await createTestProduct({ stock: 5 });
    const order = await placeOrder('9811000002', 1000, product.id, 'placed');
    const res = await request(app).get(`/api/admin/orders/${order.id}/timeline`);
    expect(res.status).toBe(200);
    expect(res.body.timeline).toHaveLength(5);
  });

  it('first step is completed for a placed order', async () => {
    const product = await createTestProduct({ stock: 5 });
    const order = await placeOrder('9811000003', 1000, product.id, 'placed');
    const res = await request(app).get(`/api/admin/orders/${order.id}/timeline`);
    expect(res.status).toBe(200);
    expect(res.body.timeline[0].status).toBe('placed');
    expect(res.body.timeline[0].completed).toBe(true);
    expect(res.body.timeline[0].current).toBe(true);
  });

  it('nextStatus is confirmed for a placed order', async () => {
    const product = await createTestProduct({ stock: 5 });
    const order = await placeOrder('9811000004', 1000, product.id, 'placed');
    const res = await request(app).get(`/api/admin/orders/${order.id}/timeline`);
    expect(res.status).toBe(200);
    expect(res.body.nextStatus).toBe('confirmed');
    expect(res.body.canAdvance).toBe(true);
  });

  it('canAdvance is false for a delivered order', async () => {
    const product = await createTestProduct({ stock: 5 });
    const order = await placeOrder('9811000005', 1000, product.id, 'delivered');
    const res = await request(app).get(`/api/admin/orders/${order.id}/timeline`);
    expect(res.status).toBe(200);
    expect(res.body.canAdvance).toBe(false);
    expect(res.body.nextStatus).toBeNull();
  });

  it('returns 404 for unknown order', async () => {
    const res = await request(app).get('/api/admin/orders/nonexistent-b15/timeline');
    expect(res.status).toBe(404);
  });

  it('all steps before current are completed', async () => {
    const product = await createTestProduct({ stock: 5 });
    const order = await placeOrder('9811000006', 1000, product.id, 'packed');
    const res = await request(app).get(`/api/admin/orders/${order.id}/timeline`);
    expect(res.status).toBe(200);
    const packed = res.body.timeline.find((s: { status: string }) => s.status === 'packed');
    const placed = res.body.timeline.find((s: { status: string }) => s.status === 'placed');
    expect(packed.current).toBe(true);
    expect(placed.completed).toBe(true);
  });
});

// ── Advance Order Status ──────────────────────────────────────────────────────

describe('POST /api/admin/orders/:id/advance-status', () => {
  it('advances placed → confirmed', async () => {
    const product = await createTestProduct({ stock: 5 });
    const order = await placeOrder('9811000007', 1000, product.id, 'placed');
    const res = await request(app).post(`/api/admin/orders/${order.id}/advance-status`);
    expect(res.status).toBe(200);
    expect(res.body.advancedTo).toBe('confirmed');
    expect(res.body.order.status).toBe('confirmed');
  });

  it('advances confirmed → packed', async () => {
    const product = await createTestProduct({ stock: 5 });
    const order = await placeOrder('9811000008', 1000, product.id, 'confirmed');
    const res = await request(app).post(`/api/admin/orders/${order.id}/advance-status`);
    expect(res.status).toBe(200);
    expect(res.body.advancedTo).toBe('packed');
  });

  it('advances packed → shipped', async () => {
    const product = await createTestProduct({ stock: 5 });
    const order = await placeOrder('9811000009', 1000, product.id, 'packed');
    const res = await request(app).post(`/api/admin/orders/${order.id}/advance-status`);
    expect(res.status).toBe(200);
    expect(res.body.advancedTo).toBe('shipped');
  });

  it('advances shipped → delivered', async () => {
    const product = await createTestProduct({ stock: 5 });
    const order = await placeOrder('9811000010', 1000, product.id, 'shipped');
    const res = await request(app).post(`/api/admin/orders/${order.id}/advance-status`);
    expect(res.status).toBe(200);
    expect(res.body.advancedTo).toBe('delivered');
  });

  it('returns 400 when order is already delivered', async () => {
    const product = await createTestProduct({ stock: 5 });
    const order = await placeOrder('9811000011', 1000, product.id, 'delivered');
    const res = await request(app).post(`/api/admin/orders/${order.id}/advance-status`);
    expect(res.status).toBe(400);
  });

  it('accepts optional trackingId when advancing to shipped', async () => {
    const product = await createTestProduct({ stock: 5 });
    const order = await placeOrder('9811000012', 1000, product.id, 'packed');
    const res = await request(app)
      .post(`/api/admin/orders/${order.id}/advance-status`)
      .send({ trackingId: 'DELHIVERY123456' });
    expect(res.status).toBe(200);
    expect(res.body.order.trackingId).toBe('DELHIVERY123456');
  });

  it('returns 404 for unknown order', async () => {
    const res = await request(app).post('/api/admin/orders/nonexistent-b15-adv/advance-status');
    expect(res.status).toBe(404);
  });
});

// ── Shipping Label ─────────────────────────────────────────────────────────────

describe('GET /api/admin/orders/:id/shipping-label', () => {
  it('returns HTML shipping label', async () => {
    const product = await createTestProduct({ stock: 5 });
    const order = await placeOrder('9811000013', 1200, product.id);
    const res = await request(app).get(`/api/admin/orders/${order.id}/shipping-label`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');
  });

  it('label contains customer name', async () => {
    const product = await createTestProduct({ stock: 5 });
    const order = await placeOrder('9811000014', 1200, product.id);
    const res = await request(app).get(`/api/admin/orders/${order.id}/shipping-label`);
    expect(res.status).toBe(200);
    expect(res.text).toContain('Test Customer');
  });

  it('label contains order number', async () => {
    const product = await createTestProduct({ stock: 5 });
    const order = await placeOrder('9811000015', 1200, product.id);
    const res = await request(app).get(`/api/admin/orders/${order.id}/shipping-label`);
    expect(res.status).toBe(200);
    expect(res.text).toContain(order.orderNumber);
  });

  it('label contains FROM address (Srinidhi Boutique)', async () => {
    const product = await createTestProduct({ stock: 5 });
    const order = await placeOrder('9811000016', 1200, product.id);
    const res = await request(app).get(`/api/admin/orders/${order.id}/shipping-label`);
    expect(res.text).toContain('Srinidhi Boutique');
  });

  it('label mentions COD for cod orders', async () => {
    const product = await createTestProduct({ stock: 5 });
    const order = await placeOrder('9811000017', 1200, product.id);
    const res = await request(app).get(`/api/admin/orders/${order.id}/shipping-label`);
    expect(res.text).toContain('COD');
  });

  it('returns 404 for unknown order', async () => {
    const res = await request(app).get('/api/admin/orders/nonexistent-label-b15/shipping-label');
    expect(res.status).toBe(404);
  });
});

// ── Bulk Ship with Tracking ───────────────────────────────────────────────────

describe('POST /api/admin/orders/bulk-ship', () => {
  it('bulk ships orders and sets tracking ID', async () => {
    const product = await createTestProduct({ stock: 20 });
    const o1 = await placeOrder('9811000018', 1000, product.id, 'packed');
    const o2 = await placeOrder('9811000019', 1500, product.id, 'packed');

    const res = await request(app)
      .post('/api/admin/orders/bulk-ship')
      .send({ ids: [o1.id, o2.id], trackingId: 'BLUEDART789' });
    expect(res.status).toBe(200);
    expect(res.body.updated).toBe(2);
    expect(res.body.trackingId).toBe('BLUEDART789');

    const updated = await testPrisma.order.findUnique({ where: { id: o1.id } });
    expect(updated?.status).toBe('shipped');
    expect(updated?.trackingId).toBe('BLUEDART789');
  });

  it('returns 400 when trackingId is missing', async () => {
    const product = await createTestProduct({ stock: 5 });
    const order = await placeOrder('9811000020', 1000, product.id);
    const res = await request(app)
      .post('/api/admin/orders/bulk-ship')
      .send({ ids: [order.id] });
    expect(res.status).toBe(400);
  });

  it('returns 400 when ids is empty', async () => {
    const res = await request(app)
      .post('/api/admin/orders/bulk-ship')
      .send({ ids: [], trackingId: 'ABC123' });
    expect(res.status).toBe(400);
  });

  it('returns trackingId in response', async () => {
    const product = await createTestProduct({ stock: 5 });
    const order = await placeOrder('9811000021', 1000, product.id);
    const res = await request(app)
      .post('/api/admin/orders/bulk-ship')
      .send({ ids: [order.id], trackingId: 'EXPRESS001' });
    expect(res.status).toBe(200);
    expect(res.body.trackingId).toBe('EXPRESS001');
  });
});

// ── Admin Product Analytics ───────────────────────────────────────────────────

describe('GET /api/admin/products/analytics', () => {
  it('returns analytics structure', async () => {
    const res = await request(app).get('/api/admin/products/analytics');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('analytics');
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('sort');
    expect(res.body).toHaveProperty('underperformingCount');
  });

  it('analytics is an array', async () => {
    const res = await request(app).get('/api/admin/products/analytics');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.analytics)).toBe(true);
  });

  it('each analytics entry has required fields', async () => {
    const product = await createTestProduct({ stock: 10 });
    const order = await placeOrder('9811000022', 1000, product.id);
    void order;
    const res = await request(app).get('/api/admin/products/analytics');
    expect(res.status).toBe(200);
    if (res.body.analytics.length > 0) {
      const entry = res.body.analytics[0];
      expect(entry).toHaveProperty('productId');
      expect(entry).toHaveProperty('name');
      expect(entry).toHaveProperty('orders');
      expect(entry).toHaveProperty('revenue');
      expect(entry).toHaveProperty('avgRating');
      expect(entry).toHaveProperty('underperforming');
    }
  });

  it('sorts by revenue by default', async () => {
    const res = await request(app).get('/api/admin/products/analytics');
    expect(res.status).toBe(200);
    expect(res.body.sort).toBe('revenue');
  });

  it('sorts by orders when requested', async () => {
    const res = await request(app).get('/api/admin/products/analytics?sort=orders');
    expect(res.status).toBe(200);
    expect(res.body.sort).toBe('orders');
  });

  it('sorts by rating when requested', async () => {
    const res = await request(app).get('/api/admin/products/analytics?sort=rating');
    expect(res.status).toBe(200);
    expect(res.body.sort).toBe('rating');
  });

  it('returns 400 for invalid sort', async () => {
    const res = await request(app).get('/api/admin/products/analytics?sort=magic');
    expect(res.status).toBe(400);
  });

  it('respects limit parameter', async () => {
    const product = await createTestProduct({ stock: 10 });
    await placeOrder('9811000023', 1000, product.id);
    const res = await request(app).get('/api/admin/products/analytics?limit=1');
    expect(res.status).toBe(200);
    expect(res.body.analytics.length).toBeLessThanOrEqual(1);
  });

  it('underperformingCount is a number', async () => {
    const res = await request(app).get('/api/admin/products/analytics');
    expect(res.status).toBe(200);
    expect(typeof res.body.underperformingCount).toBe('number');
  });
});

// ── Cross-sell Admin Config ───────────────────────────────────────────────────

describe('PATCH /api/admin/products/:id/cross-sell', () => {
  it('sets cross-sell product IDs', async () => {
    const p1 = await createTestProduct({ name: 'Main B15 CrossSell' });
    const p2 = await createTestProduct({ name: 'CrossSell Item B15 A' });
    const p3 = await createTestProduct({ name: 'CrossSell Item B15 B' });

    const res = await request(app)
      .patch(`/api/admin/products/${p1.id}/cross-sell`)
      .send({ productIds: [p2.id, p3.id] });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.crossSellIds).toContain(p2.id);
    expect(res.body.crossSellIds).toContain(p3.id);
  });

  it('clears cross-sell IDs with empty array', async () => {
    const p = await createTestProduct({ name: 'Clear CrossSell B15' });
    await request(app).patch(`/api/admin/products/${p.id}/cross-sell`).send({ productIds: [] });
    const res = await request(app)
      .patch(`/api/admin/products/${p.id}/cross-sell`)
      .send({ productIds: [] });
    expect(res.status).toBe(200);
    expect(res.body.crossSellIds).toHaveLength(0);
  });

  it('returns 404 for unknown product', async () => {
    const res = await request(app)
      .patch('/api/admin/products/nonexistent-cs-b15/cross-sell')
      .send({ productIds: [] });
    expect(res.status).toBe(404);
  });

  it('returns 404 if a cross-sell product ID does not exist', async () => {
    const p = await createTestProduct({ name: 'CrossSell Bad IDs B15' });
    const res = await request(app)
      .patch(`/api/admin/products/${p.id}/cross-sell`)
      .send({ productIds: ['nonexistent-id-b15'] });
    expect(res.status).toBe(404);
  });
});

// ── Complete Look Admin Config ────────────────────────────────────────────────

describe('PATCH /api/admin/products/:id/complete-look', () => {
  it('sets complete-look product IDs', async () => {
    const main = await createTestProduct({ name: 'Main Look B15' });
    const match = await createTestProduct({ name: 'Matching Blouse B15' });

    const res = await request(app)
      .patch(`/api/admin/products/${main.id}/complete-look`)
      .send({ productIds: [match.id] });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.completeLookIds).toContain(match.id);
  });

  it('returns 404 for unknown product', async () => {
    const res = await request(app)
      .patch('/api/admin/products/nonexistent-look-b15/complete-look')
      .send({ productIds: [] });
    expect(res.status).toBe(404);
  });

  it('returns 404 when a look product ID does not exist', async () => {
    const p = await createTestProduct({ name: 'Look Bad IDs B15' });
    const res = await request(app)
      .patch(`/api/admin/products/${p.id}/complete-look`)
      .send({ productIds: ['fake-look-id-b15'] });
    expect(res.status).toBe(404);
  });

  it('clears complete-look IDs with empty array', async () => {
    const p = await createTestProduct({ name: 'Look Clear B15' });
    const res = await request(app)
      .patch(`/api/admin/products/${p.id}/complete-look`)
      .send({ productIds: [] });
    expect(res.status).toBe(200);
    expect(res.body.completeLookIds).toHaveLength(0);
  });
});

// ── Product Details (fabricCare, videoUrl) ────────────────────────────────────

describe('PATCH /api/admin/products/:id/details', () => {
  it('sets fabricCare instructions', async () => {
    const p = await createTestProduct({ name: 'Fabric Care B15' });
    const res = await request(app)
      .patch(`/api/admin/products/${p.id}/details`)
      .send({ fabricCare: 'Dry clean only. Do not bleach.' });
    expect(res.status).toBe(200);
    expect(res.body.fabricCare).toBe('Dry clean only. Do not bleach.');
  });

  it('sets videoUrl', async () => {
    const p = await createTestProduct({ name: 'Video URL B15' });
    const res = await request(app)
      .patch(`/api/admin/products/${p.id}/details`)
      .send({ videoUrl: 'https://youtube.com/embed/abc123' });
    expect(res.status).toBe(200);
    expect(res.body.videoUrl).toBe('https://youtube.com/embed/abc123');
  });

  it('sets both fabricCare and videoUrl together', async () => {
    const p = await createTestProduct({ name: 'Both Details B15' });
    const res = await request(app)
      .patch(`/api/admin/products/${p.id}/details`)
      .send({ fabricCare: 'Hand wash cold', videoUrl: 'https://youtube.com/embed/xyz' });
    expect(res.status).toBe(200);
    expect(res.body.fabricCare).toBe('Hand wash cold');
    expect(res.body.videoUrl).toBe('https://youtube.com/embed/xyz');
  });

  it('returns 404 for unknown product', async () => {
    const res = await request(app)
      .patch('/api/admin/products/nonexistent-details-b15/details')
      .send({ fabricCare: 'Test' });
    expect(res.status).toBe(404);
  });

  it('updates only fabricCare when videoUrl not provided', async () => {
    const p = await createTestProduct({ name: 'FabricOnly B15' });
    const res = await request(app)
      .patch(`/api/admin/products/${p.id}/details`)
      .send({ fabricCare: 'Machine wash cold' });
    expect(res.status).toBe(200);
    expect(res.body.fabricCare).toBe('Machine wash cold');
  });
});

// ── Category HSN Code ─────────────────────────────────────────────────────────

describe('PATCH /api/admin/categories/:id/hsn', () => {
  it('sets HSN code on a category', async () => {
    const cat = await createTestCategory('HSN Category B15');
    const res = await request(app)
      .patch(`/api/admin/categories/${cat.id}/hsn`)
      .send({ hsnCode: '6211' });
    expect(res.status).toBe(200);
    expect(res.body.hsnCode).toBe('6211');
  });

  it('returns 404 for unknown category', async () => {
    const res = await request(app)
      .patch('/api/admin/categories/nonexistent-hsn-b15/hsn')
      .send({ hsnCode: '6211' });
    expect(res.status).toBe(404);
  });

  it('returns 400 when hsnCode is empty', async () => {
    const cat = await createTestCategory('HSN Empty B15');
    const res = await request(app)
      .patch(`/api/admin/categories/${cat.id}/hsn`)
      .send({ hsnCode: '' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when hsnCode is missing', async () => {
    const cat = await createTestCategory('HSN Missing B15');
    const res = await request(app)
      .patch(`/api/admin/categories/${cat.id}/hsn`)
      .send({});
    expect(res.status).toBe(400);
  });

  it('can update HSN code multiple times', async () => {
    const cat = await createTestCategory('HSN Update B15');
    await request(app).patch(`/api/admin/categories/${cat.id}/hsn`).send({ hsnCode: '6211' });
    const res = await request(app)
      .patch(`/api/admin/categories/${cat.id}/hsn`)
      .send({ hsnCode: '6214' });
    expect(res.status).toBe(200);
    expect(res.body.hsnCode).toBe('6214');
  });
});

// ── Cross-sell Store Route ────────────────────────────────────────────────────

describe('GET /api/products/:slug/cross-sell', () => {
  it('returns products from same category when no curated cross-sells', async () => {
    const cat = await createTestCategory('CrossSell Store Cat B15');
    const p1 = await createTestProduct({ name: 'CS Main B15', categoryId: cat.id, stock: 5 });
    const p2 = await createTestProduct({ name: 'CS Sibling B15', categoryId: cat.id, stock: 5 });

    const res = await request(app).get(`/api/products/${p1.slug}/cross-sell`);
    expect(res.status).toBe(200);
    expect(res.body.curated).toBe(false);
    const ids = res.body.products.map((p: { id: string }) => p.id);
    expect(ids).toContain(p2.id);
  });

  it('excludes the queried product from fallback results', async () => {
    const cat = await createTestCategory('CS Excl Cat B15');
    const p1 = await createTestProduct({ name: 'CS Excl Main B15', categoryId: cat.id, stock: 5 });
    await createTestProduct({ name: 'CS Excl Sibling B15', categoryId: cat.id, stock: 5 });

    const res = await request(app).get(`/api/products/${p1.slug}/cross-sell`);
    expect(res.status).toBe(200);
    const ids = res.body.products.map((p: { id: string }) => p.id);
    expect(ids).not.toContain(p1.id);
  });

  it('returns curated cross-sells when configured', async () => {
    const p1 = await createTestProduct({ name: 'CS Curated Main B15', stock: 5 });
    const p2 = await createTestProduct({ name: 'CS Curated Item B15', stock: 5 });

    // Set cross-sell via admin
    await request(app)
      .patch(`/api/admin/products/${p1.id}/cross-sell`)
      .send({ productIds: [p2.id] });

    const res = await request(app).get(`/api/products/${p1.slug}/cross-sell`);
    expect(res.status).toBe(200);
    expect(res.body.curated).toBe(true);
    const ids = res.body.products.map((p: { id: string }) => p.id);
    expect(ids).toContain(p2.id);
  });

  it('returns 404 for unknown slug', async () => {
    const res = await request(app).get('/api/products/nonexistent-cs-slug-b15/cross-sell');
    expect(res.status).toBe(404);
  });

  it('returns empty fallback for product with no category siblings', async () => {
    const cat = await createTestCategory('CS Lone Cat B15');
    const p = await createTestProduct({ name: 'CS Lone B15', categoryId: cat.id, stock: 5 });
    const res = await request(app).get(`/api/products/${p.slug}/cross-sell`);
    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(0);
  });
});

// ── Upsell Route ──────────────────────────────────────────────────────────────

describe('GET /api/products/:slug/upsell', () => {
  it('returns a higher-priced product in the same category', async () => {
    const cat = await createTestCategory('Upsell Cat B15');
    const p1 = await createTestProduct({ name: 'Upsell Base B15', price: 500, categoryId: cat.id, stock: 5 });
    const p2 = await createTestProduct({ name: 'Upsell Premium B15', price: 900, categoryId: cat.id, stock: 5 });

    const res = await request(app).get(`/api/products/${p1.slug}/upsell`);
    expect(res.status).toBe(200);
    expect(res.body.upsell).toBeTruthy();
    expect(res.body.upsell.id).toBe(p2.id);
    expect(res.body.priceDiff).toBe(400);
  });

  it('includes upgrade message', async () => {
    const cat = await createTestCategory('Upsell Msg Cat B15');
    const p1 = await createTestProduct({ name: 'Upsell Msg Base B15', price: 500, categoryId: cat.id, stock: 5 });
    await createTestProduct({ name: 'Upsell Msg Premium B15', price: 800, categoryId: cat.id, stock: 5 });

    const res = await request(app).get(`/api/products/${p1.slug}/upsell`);
    expect(res.status).toBe(200);
    expect(res.body.message).toContain('₹');
  });

  it('returns null upsell when no higher-priced product exists', async () => {
    const cat = await createTestCategory('Upsell None Cat B15');
    const p = await createTestProduct({ name: 'Upsell Top B15', price: 9999, categoryId: cat.id, stock: 5 });
    const res = await request(app).get(`/api/products/${p.slug}/upsell`);
    expect(res.status).toBe(200);
    expect(res.body.upsell).toBeNull();
  });

  it('returns 404 for unknown slug', async () => {
    const res = await request(app).get('/api/products/nonexistent-upsell-b15/upsell');
    expect(res.status).toBe(404);
  });
});

// ── Complete Look Route ───────────────────────────────────────────────────────

describe('GET /api/products/:slug/complete-look', () => {
  it('returns empty when no complete-look is configured', async () => {
    const p = await createTestProduct({ name: 'No Look B15', stock: 5 });
    const res = await request(app).get(`/api/products/${p.slug}/complete-look`);
    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(0);
    expect(res.body.curated).toBe(false);
  });

  it('returns curated complete-look products', async () => {
    const main = await createTestProduct({ name: 'Look Main B15', stock: 5 });
    const blouse = await createTestProduct({ name: 'Matching Blouse B15 Store', stock: 5 });

    await request(app)
      .patch(`/api/admin/products/${main.id}/complete-look`)
      .send({ productIds: [blouse.id] });

    const res = await request(app).get(`/api/products/${main.slug}/complete-look`);
    expect(res.status).toBe(200);
    expect(res.body.curated).toBe(true);
    const ids = res.body.products.map((p: { id: string }) => p.id);
    expect(ids).toContain(blouse.id);
  });

  it('returns 404 for unknown slug', async () => {
    const res = await request(app).get('/api/products/nonexistent-look-b15/complete-look');
    expect(res.status).toBe(404);
  });
});

// ── Exit Intent Promotion ─────────────────────────────────────────────────────

describe('GET /api/products/promotions/exit-intent', () => {
  it('returns exit intent promotion data', async () => {
    const res = await request(app).get('/api/products/promotions/exit-intent');
    expect(res.status).toBe(200);
    expect(res.body.show).toBe(true);
    expect(res.body).toHaveProperty('headline');
    expect(res.body).toHaveProperty('message');
    expect(res.body).toHaveProperty('code');
    expect(res.body).toHaveProperty('discount');
  });

  it('returns STAY coupon code when one exists', async () => {
    await testPrisma.coupon.create({
      data: { code: 'STAY15', discount: 15, active: true },
    });
    const res = await request(app).get('/api/products/promotions/exit-intent');
    expect(res.status).toBe(200);
    expect(res.body.code).toBe('STAY15');
    expect(res.body.discount).toBe(15);
  });

  it('falls back to STAY10 when no STAY coupon exists', async () => {
    const res = await request(app).get('/api/products/promotions/exit-intent');
    expect(res.status).toBe(200);
    expect(res.body.code).toBe('STAY10');
  });

  it('includes activeSale info when a store sale is active', async () => {
    await testPrisma.storeSale.create({
      data: { discountPct: 20, active: true, label: 'Flash Sale' },
    });
    const res = await request(app).get('/api/products/promotions/exit-intent');
    expect(res.status).toBe(200);
    expect(res.body.activeSale).toBeTruthy();
    expect(res.body.activeSale.discountPct).toBe(20);
  });

  it('activeSale is null when no active sale', async () => {
    const res = await request(app).get('/api/products/promotions/exit-intent');
    expect(res.status).toBe(200);
    expect(res.body.activeSale).toBeNull();
  });
});

// ── Welcome Banner ────────────────────────────────────────────────────────────

describe('GET /api/products/promotions/welcome-banner', () => {
  it('returns welcome banner data', async () => {
    const res = await request(app).get('/api/products/promotions/welcome-banner');
    expect(res.status).toBe(200);
    expect(res.body.show).toBe(true);
    expect(res.body).toHaveProperty('headline');
    expect(res.body).toHaveProperty('message');
    expect(res.body).toHaveProperty('code');
    expect(res.body).toHaveProperty('discount');
  });

  it('returns WELCOME coupon when one exists', async () => {
    await testPrisma.coupon.create({
      data: { code: 'WELCOME20', discount: 20, active: true },
    });
    const res = await request(app).get('/api/products/promotions/welcome-banner');
    expect(res.status).toBe(200);
    expect(res.body.code).toBe('WELCOME20');
    expect(res.body.discount).toBe(20);
  });

  it('falls back to WELCOME10 when no WELCOME coupon exists', async () => {
    const res = await request(app).get('/api/products/promotions/welcome-banner');
    expect(res.status).toBe(200);
    expect(res.body.code).toBe('WELCOME10');
  });

  it('headline mentions welcome', async () => {
    const res = await request(app).get('/api/products/promotions/welcome-banner');
    expect(res.body.headline.toLowerCase()).toContain('welcome');
  });
});

// ── Multi-Address Management ──────────────────────────────────────────────────

describe('Multi-Address Management', () => {
  describe('GET /api/users/:id/saved-addresses', () => {
    it('returns empty list for new user', async () => {
      const user = await createTestUser();
      const res = await request(app).get(`/api/users/${user.id}/saved-addresses`);
      expect(res.status).toBe(200);
      expect(res.body.addresses).toHaveLength(0);
      expect(res.body.count).toBe(0);
    });

    it('returns 404 for unknown user', async () => {
      const res = await request(app).get('/api/users/nonexistent-addr-user-b15/saved-addresses');
      expect(res.status).toBe(404);
    });

    it('returns all saved addresses', async () => {
      const user = await createTestUser();
      await testPrisma.customerAddress.create({
        data: { userId: user.id, label: 'Home', line1: '5 MG Road', city: 'Bangalore', state: 'Karnataka', pincode: '560001' },
      });
      await testPrisma.customerAddress.create({
        data: { userId: user.id, label: 'Office', line1: '10 Park Ave', city: 'Hyderabad', state: 'Telangana', pincode: '500001' },
      });
      const res = await request(app).get(`/api/users/${user.id}/saved-addresses`);
      expect(res.status).toBe(200);
      expect(res.body.count).toBe(2);
    });

    it('default address appears first', async () => {
      const user = await createTestUser();
      await testPrisma.customerAddress.create({
        data: { userId: user.id, label: 'Office', line1: 'Office A', city: 'HYD', state: 'Telangana', pincode: '500001', isDefault: false },
      });
      await testPrisma.customerAddress.create({
        data: { userId: user.id, label: 'Home', line1: 'Home B', city: 'HYD', state: 'Telangana', pincode: '500002', isDefault: true },
      });
      const res = await request(app).get(`/api/users/${user.id}/saved-addresses`);
      expect(res.status).toBe(200);
      expect(res.body.addresses[0].isDefault).toBe(true);
    });
  });

  describe('POST /api/users/:id/saved-addresses', () => {
    it('creates a new address', async () => {
      const user = await createTestUser();
      const res = await request(app)
        .post(`/api/users/${user.id}/saved-addresses`)
        .send({ label: 'Home', line1: '15 Banjara Hills', city: 'Hyderabad', state: 'Telangana', pincode: '500034' });
      expect(res.status).toBe(201);
      expect(res.body.label).toBe('Home');
      expect(res.body.line1).toBe('15 Banjara Hills');
    });

    it('first address is automatically default', async () => {
      const user = await createTestUser();
      const res = await request(app)
        .post(`/api/users/${user.id}/saved-addresses`)
        .send({ label: 'Home', line1: '5 Ring Road', city: 'Delhi', state: 'Delhi', pincode: '110001' });
      expect(res.status).toBe(201);
      expect(res.body.isDefault).toBe(true);
    });

    it('creates address with Office label', async () => {
      const user = await createTestUser();
      const res = await request(app)
        .post(`/api/users/${user.id}/saved-addresses`)
        .send({ label: 'Office', line1: '88 Cyber Tower', city: 'Hyderabad', state: 'Telangana', pincode: '500081' });
      expect(res.status).toBe(201);
      expect(res.body.label).toBe('Office');
    });

    it('creates address with Other label', async () => {
      const user = await createTestUser();
      const res = await request(app)
        .post(`/api/users/${user.id}/saved-addresses`)
        .send({ label: 'Other', line1: '22 Beach Road', city: 'Chennai', state: 'Tamil Nadu', pincode: '600001' });
      expect(res.status).toBe(201);
      expect(res.body.label).toBe('Other');
    });

    it('returns 400 for invalid pincode (not 6 digits)', async () => {
      const user = await createTestUser();
      const res = await request(app)
        .post(`/api/users/${user.id}/saved-addresses`)
        .send({ label: 'Home', line1: '5 Street', city: 'City', state: 'State', pincode: '1234' });
      expect(res.status).toBe(400);
    });

    it('returns 400 when line1 is missing', async () => {
      const user = await createTestUser();
      const res = await request(app)
        .post(`/api/users/${user.id}/saved-addresses`)
        .send({ label: 'Home', city: 'City', state: 'State', pincode: '500001' });
      expect(res.status).toBe(400);
    });

    it('setting isDefault clears other defaults', async () => {
      const user = await createTestUser();
      // First address (auto-default)
      await request(app)
        .post(`/api/users/${user.id}/saved-addresses`)
        .send({ label: 'Home', line1: 'First', city: 'HYD', state: 'Telangana', pincode: '500001' });
      // Second address set as default
      await request(app)
        .post(`/api/users/${user.id}/saved-addresses`)
        .send({ label: 'Office', line1: 'Second', city: 'HYD', state: 'Telangana', pincode: '500002', isDefault: true });

      const list = await request(app).get(`/api/users/${user.id}/saved-addresses`);
      const defaults = list.body.addresses.filter((a: { isDefault: boolean }) => a.isDefault);
      expect(defaults).toHaveLength(1);
      expect(defaults[0].line1).toBe('Second');
    });

    it('returns 404 for unknown user', async () => {
      const res = await request(app)
        .post('/api/users/nonexistent-addr-b15/saved-addresses')
        .send({ label: 'Home', line1: 'Test', city: 'City', state: 'State', pincode: '500001' });
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/users/:id/saved-addresses/:addressId', () => {
    it('updates an existing address', async () => {
      const user = await createTestUser();
      const addr = await testPrisma.customerAddress.create({
        data: { userId: user.id, label: 'Home', line1: 'Old Line', city: 'HYD', state: 'Telangana', pincode: '500001' },
      });
      const res = await request(app)
        .patch(`/api/users/${user.id}/saved-addresses/${addr.id}`)
        .send({ line1: 'New Line 123' });
      expect(res.status).toBe(200);
      expect(res.body.line1).toBe('New Line 123');
    });

    it('can change label', async () => {
      const user = await createTestUser();
      const addr = await testPrisma.customerAddress.create({
        data: { userId: user.id, label: 'Home', line1: 'Test', city: 'HYD', state: 'Telangana', pincode: '500001' },
      });
      const res = await request(app)
        .patch(`/api/users/${user.id}/saved-addresses/${addr.id}`)
        .send({ label: 'Office' });
      expect(res.status).toBe(200);
      expect(res.body.label).toBe('Office');
    });

    it('returns 404 for unknown address', async () => {
      const user = await createTestUser();
      const res = await request(app)
        .patch(`/api/users/${user.id}/saved-addresses/nonexistent-addr-id-b15`)
        .send({ line1: 'New' });
      expect(res.status).toBe(404);
    });

    it('returns 404 when address belongs to different user', async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      const addr = await testPrisma.customerAddress.create({
        data: { userId: user1.id, label: 'Home', line1: 'Test', city: 'HYD', state: 'Telangana', pincode: '500001' },
      });
      const res = await request(app)
        .patch(`/api/users/${user2.id}/saved-addresses/${addr.id}`)
        .send({ line1: 'Hack' });
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/users/:id/saved-addresses/:addressId', () => {
    it('deletes an address', async () => {
      const user = await createTestUser();
      const addr = await testPrisma.customerAddress.create({
        data: { userId: user.id, label: 'Home', line1: 'Delete Me', city: 'HYD', state: 'Telangana', pincode: '500001' },
      });
      const res = await request(app).delete(`/api/users/${user.id}/saved-addresses/${addr.id}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const check = await testPrisma.customerAddress.findUnique({ where: { id: addr.id } });
      expect(check).toBeNull();
    });

    it('promotes next address to default when default is deleted', async () => {
      const user = await createTestUser();
      const defaultAddr = await testPrisma.customerAddress.create({
        data: { userId: user.id, label: 'Home', line1: 'Default', city: 'HYD', state: 'Telangana', pincode: '500001', isDefault: true },
      });
      const other = await testPrisma.customerAddress.create({
        data: { userId: user.id, label: 'Office', line1: 'Other', city: 'HYD', state: 'Telangana', pincode: '500002', isDefault: false },
      });

      await request(app).delete(`/api/users/${user.id}/saved-addresses/${defaultAddr.id}`);

      const updated = await testPrisma.customerAddress.findUnique({ where: { id: other.id } });
      expect(updated?.isDefault).toBe(true);
    });

    it('returns 404 for unknown address', async () => {
      const user = await createTestUser();
      const res = await request(app).delete(`/api/users/${user.id}/saved-addresses/nonexistent-del-b15`);
      expect(res.status).toBe(404);
    });

    it('returns 404 when address belongs to different user', async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      const addr = await testPrisma.customerAddress.create({
        data: { userId: user1.id, label: 'Home', line1: 'Owned', city: 'HYD', state: 'Telangana', pincode: '500001' },
      });
      const res = await request(app).delete(`/api/users/${user2.id}/saved-addresses/${addr.id}`);
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/users/:id/saved-addresses/:addressId/set-default', () => {
    it('sets an address as default', async () => {
      const user = await createTestUser();
      const addr1 = await testPrisma.customerAddress.create({
        data: { userId: user.id, label: 'Home', line1: 'First', city: 'HYD', state: 'Telangana', pincode: '500001', isDefault: true },
      });
      const addr2 = await testPrisma.customerAddress.create({
        data: { userId: user.id, label: 'Office', line1: 'Second', city: 'HYD', state: 'Telangana', pincode: '500002', isDefault: false },
      });

      const res = await request(app).patch(`/api/users/${user.id}/saved-addresses/${addr2.id}/set-default`);
      expect(res.status).toBe(200);
      expect(res.body.isDefault).toBe(true);

      const old = await testPrisma.customerAddress.findUnique({ where: { id: addr1.id } });
      expect(old?.isDefault).toBe(false);
    });

    it('returns 404 for unknown address', async () => {
      const user = await createTestUser();
      const res = await request(app).patch(`/api/users/${user.id}/saved-addresses/nonexistent-def-b15/set-default`);
      expect(res.status).toBe(404);
    });

    it('only one address is default at a time', async () => {
      const user = await createTestUser();
      const a1 = await testPrisma.customerAddress.create({
        data: { userId: user.id, label: 'Home', line1: 'A1', city: 'HYD', state: 'Telangana', pincode: '500001', isDefault: true },
      });
      const a2 = await testPrisma.customerAddress.create({
        data: { userId: user.id, label: 'Office', line1: 'A2', city: 'HYD', state: 'Telangana', pincode: '500002', isDefault: false },
      });
      const a3 = await testPrisma.customerAddress.create({
        data: { userId: user.id, label: 'Other', line1: 'A3', city: 'HYD', state: 'Telangana', pincode: '500003', isDefault: false },
      });

      await request(app).patch(`/api/users/${user.id}/saved-addresses/${a2.id}/set-default`);
      await request(app).patch(`/api/users/${user.id}/saved-addresses/${a3.id}/set-default`);

      const addresses = await testPrisma.customerAddress.findMany({ where: { userId: user.id } });
      const defaults = addresses.filter((a) => a.isDefault);
      expect(defaults).toHaveLength(1);
      expect(defaults[0].id).toBe(a3.id);
      void a1;
    });
  });
});

// ── Invoice with HSN codes ────────────────────────────────────────────────────

describe('GET /api/admin/orders/:id/invoice', () => {
  it('invoice contains HSN code when category has one', async () => {
    const cat = await createTestCategory('Invoice HSN Cat B15');
    // Set HSN code
    await request(app).patch(`/api/admin/categories/${cat.id}/hsn`).send({ hsnCode: '6211' });

    const product = await createTestProduct({ name: 'HSN Invoice Prod B15', categoryId: cat.id, stock: 5 });
    const order = await placeOrder('9811000050', 1000, product.id);

    const res = await request(app).get(`/api/admin/orders/${order.id}/invoice`);
    expect(res.status).toBe(200);
    expect(res.text).toContain('HSN');
  });

  it('invoice shows Thank you message', async () => {
    const product = await createTestProduct({ stock: 5 });
    const order = await placeOrder('9811000051', 1000, product.id);
    const res = await request(app).get(`/api/admin/orders/${order.id}/invoice`);
    expect(res.status).toBe(200);
    expect(res.text).toContain('Thank you for shopping with Srinidhi Boutique');
  });

  it('invoice contains digital signature placeholder', async () => {
    const product = await createTestProduct({ stock: 5 });
    const order = await placeOrder('9811000052', 1000, product.id);
    const res = await request(app).get(`/api/admin/orders/${order.id}/invoice`);
    expect(res.status).toBe(200);
    expect(res.text).toContain('Authorised Signatory');
  });

  it('invoice shows CGST and SGST for Telangana orders', async () => {
    const cat = await createTestCategory('Invoice GST B15');
    await request(app).patch(`/api/admin/categories/${cat.id}/gst-rate`).send({ gstRate: 12 });
    const product = await createTestProduct({ name: 'GST Invoice Prod B15', categoryId: cat.id, stock: 5 });
    const order = await placeOrder('9811000053', 1000, product.id);

    const res = await request(app).get(`/api/admin/orders/${order.id}/invoice`);
    expect(res.status).toBe(200);
    expect(res.text).toContain('CGST');
    expect(res.text).toContain('SGST');
  });

  it('invoice returns 404 for unknown order', async () => {
    const res = await request(app).get('/api/admin/orders/nonexistent-inv-b15/invoice');
    expect(res.status).toBe(404);
  });

  it('invoice shows order number', async () => {
    const product = await createTestProduct({ stock: 5 });
    const order = await placeOrder('9811000054', 1000, product.id);
    const res = await request(app).get(`/api/admin/orders/${order.id}/invoice`);
    expect(res.status).toBe(200);
    expect(res.text).toContain(order.orderNumber);
  });

  it('invoice shows customer name', async () => {
    const product = await createTestProduct({ stock: 5 });
    const order = await placeOrder('9811000055', 1000, product.id);
    const res = await request(app).get(`/api/admin/orders/${order.id}/invoice`);
    expect(res.status).toBe(200);
    expect(res.text).toContain('Test Customer');
  });
});

// ── Product fields visible on GET ─────────────────────────────────────────────

describe('Product fabricCare + videoUrl visible via API', () => {
  it('fabricCare and videoUrl appear in admin product response', async () => {
    const p = await createTestProduct({ name: 'Details Check B15', stock: 5 });
    await request(app)
      .patch(`/api/admin/products/${p.id}/details`)
      .send({ fabricCare: 'Dry clean', videoUrl: 'https://yt.com/embed/test' });

    const res = await request(app).get(`/api/admin/products/${p.id}`);
    expect(res.status).toBe(200);
    expect(res.body.fabricCare).toBe('Dry clean');
    expect(res.body.videoUrl).toBe('https://yt.com/embed/test');
  });

  it('fabricCare is null by default', async () => {
    const p = await createTestProduct({ name: 'No Details B15', stock: 5 });
    const res = await request(app).get(`/api/admin/products/${p.id}`);
    expect(res.status).toBe(200);
    expect(res.body.fabricCare).toBeNull();
  });
});
