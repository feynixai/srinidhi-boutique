/**
 * Build 14 tests — GST system, bulk product ops, coupons v2, admin order notes,
 * daily summary, low stock, data export, stock notifications, related products,
 * store sale edge cases, and admin product/order coverage.
 * Target: 1000+ total tests (~60 new)
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
  line1: '10 Banjara Hills',
  city: 'Hyderabad',
  state: 'Telangana',
  pincode: '500034',
};

async function placeOrder(phone: string, total: number, productId: string, orderNum?: string) {
  return testPrisma.order.create({
    data: {
      orderNumber: orderNum || `SB-B14-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      customerName: 'Test Customer',
      customerPhone: phone,
      address: validAddress,
      subtotal: total,
      shipping: 0,
      discount: 0,
      total,
      paymentMethod: 'cod',
      status: 'placed',
      items: {
        create: [{ productId, name: 'Test Product', price: total, quantity: 1 }],
      },
    },
  });
}

// ── GST Category Rates ─────────────────────────────────────────────────────────

describe('PATCH /api/admin/categories/:id/gst-rate', () => {
  it('updates the GST rate on a category', async () => {
    const category = await createTestCategory('GST Cat B14');
    const res = await request(app)
      .patch(`/api/admin/categories/${category.id}/gst-rate`)
      .send({ gstRate: 12 });
    expect(res.status).toBe(200);
    expect(res.body.gstRate).toBe(12);
  });

  it('returns 404 for unknown category', async () => {
    const res = await request(app)
      .patch('/api/admin/categories/nonexistent-id/gst-rate')
      .send({ gstRate: 5 });
    expect(res.status).toBe(404);
  });

  it('rejects gstRate below 0', async () => {
    const category = await createTestCategory('GST Cat Neg B14');
    const res = await request(app)
      .patch(`/api/admin/categories/${category.id}/gst-rate`)
      .send({ gstRate: -1 });
    expect(res.status).toBe(400);
  });

  it('rejects gstRate above 100', async () => {
    const category = await createTestCategory('GST Cat High B14');
    const res = await request(app)
      .patch(`/api/admin/categories/${category.id}/gst-rate`)
      .send({ gstRate: 101 });
    expect(res.status).toBe(400);
  });

  it('allows gstRate of 0 (exempt)', async () => {
    const category = await createTestCategory('GST Exempt B14');
    const res = await request(app)
      .patch(`/api/admin/categories/${category.id}/gst-rate`)
      .send({ gstRate: 0 });
    expect(res.status).toBe(200);
    expect(res.body.gstRate).toBe(0);
  });
});

describe('GET /api/admin/gst-preview', () => {
  it('returns CGST+SGST for intra-state (Telangana)', async () => {
    const category = await createTestCategory('GST Preview Cat B14');
    await request(app)
      .patch(`/api/admin/categories/${category.id}/gst-rate`)
      .send({ gstRate: 18 });

    const res = await request(app).get(
      `/api/admin/gst-preview?categoryId=${category.id}&subtotal=1000&state=Telangana`
    );
    expect(res.status).toBe(200);
    expect(res.body.type).toBe('CGST+SGST');
    expect(res.body.cgst).toBe(90);
    expect(res.body.sgst).toBe(90);
    expect(res.body.igst).toBe(0);
    expect(res.body.total).toBe(180);
  });

  it('returns IGST for inter-state (Maharashtra)', async () => {
    const category = await createTestCategory('GST IGST Cat B14');
    await request(app)
      .patch(`/api/admin/categories/${category.id}/gst-rate`)
      .send({ gstRate: 12 });

    const res = await request(app).get(
      `/api/admin/gst-preview?categoryId=${category.id}&subtotal=1000&state=Maharashtra`
    );
    expect(res.status).toBe(200);
    expect(res.body.type).toBe('IGST');
    expect(res.body.igst).toBe(120);
    expect(res.body.cgst).toBe(0);
    expect(res.body.sgst).toBe(0);
  });

  it('returns 400 when categoryId is missing', async () => {
    const res = await request(app).get('/api/admin/gst-preview?subtotal=1000&state=Telangana');
    expect(res.status).toBe(400);
  });

  it('returns 400 when subtotal is missing', async () => {
    const category = await createTestCategory('GST No Subtotal B14');
    const res = await request(app).get(
      `/api/admin/gst-preview?categoryId=${category.id}&state=Telangana`
    );
    expect(res.status).toBe(400);
  });

  it('returns 404 for unknown categoryId', async () => {
    const res = await request(app).get(
      '/api/admin/gst-preview?categoryId=nonexistent&subtotal=1000&state=Telangana'
    );
    expect(res.status).toBe(404);
  });

  it('returns category name in response', async () => {
    const category = await createTestCategory('Saree B14');
    const res = await request(app).get(
      `/api/admin/gst-preview?categoryId=${category.id}&subtotal=500&state=Telangana`
    );
    expect(res.status).toBe(200);
    expect(res.body.category).toBe('Saree B14');
  });
});

// ── Bulk Product Operations ────────────────────────────────────────────────────

describe('POST /api/admin/products/bulk', () => {
  it('toggles active status for multiple products', async () => {
    const p1 = await createTestProduct({ name: 'Bulk Toggle A B14', active: true });
    const p2 = await createTestProduct({ name: 'Bulk Toggle B B14', active: false });

    const res = await request(app)
      .post('/api/admin/products/bulk')
      .send({ ids: [p1.id, p2.id], action: 'toggle_active' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.updatedCount).toBe(2);

    const updated1 = await testPrisma.product.findUnique({ where: { id: p1.id } });
    const updated2 = await testPrisma.product.findUnique({ where: { id: p2.id } });
    expect(updated1?.active).toBe(false);
    expect(updated2?.active).toBe(true);
  });

  it('sets price for multiple products', async () => {
    const p1 = await createTestProduct({ name: 'Bulk Price A B14', price: 500 });
    const p2 = await createTestProduct({ name: 'Bulk Price B B14', price: 800 });

    const res = await request(app)
      .post('/api/admin/products/bulk')
      .send({ ids: [p1.id, p2.id], action: 'set_price', value: 999 });
    expect(res.status).toBe(200);
    expect(res.body.updatedCount).toBe(2);

    const updated1 = await testPrisma.product.findUnique({ where: { id: p1.id } });
    expect(Number(updated1?.price)).toBe(999);
  });

  it('increases price by flat amount', async () => {
    const p = await createTestProduct({ name: 'Bulk Inc Flat B14', price: 1000 });

    const res = await request(app)
      .post('/api/admin/products/bulk')
      .send({ ids: [p.id], action: 'increase_price', value: 200, isPercent: false });
    expect(res.status).toBe(200);

    const updated = await testPrisma.product.findUnique({ where: { id: p.id } });
    expect(Number(updated?.price)).toBe(1200);
  });

  it('increases price by percentage', async () => {
    const p = await createTestProduct({ name: 'Bulk Inc Pct B14', price: 1000 });

    const res = await request(app)
      .post('/api/admin/products/bulk')
      .send({ ids: [p.id], action: 'increase_price', value: 10, isPercent: true });
    expect(res.status).toBe(200);

    const updated = await testPrisma.product.findUnique({ where: { id: p.id } });
    expect(Number(updated?.price)).toBe(1100);
  });

  it('decreases price by flat amount', async () => {
    const p = await createTestProduct({ name: 'Bulk Dec B14', price: 1000 });

    const res = await request(app)
      .post('/api/admin/products/bulk')
      .send({ ids: [p.id], action: 'decrease_price', value: 300, isPercent: false });
    expect(res.status).toBe(200);

    const updated = await testPrisma.product.findUnique({ where: { id: p.id } });
    expect(Number(updated?.price)).toBe(700);
  });

  it('sets stock for multiple products', async () => {
    const p1 = await createTestProduct({ name: 'Bulk Stock A B14', stock: 10 });
    const p2 = await createTestProduct({ name: 'Bulk Stock B B14', stock: 50 });

    const res = await request(app)
      .post('/api/admin/products/bulk')
      .send({ ids: [p1.id, p2.id], action: 'set_stock', value: 25 });
    expect(res.status).toBe(200);
    expect(res.body.updatedCount).toBe(2);

    const updated1 = await testPrisma.product.findUnique({ where: { id: p1.id } });
    expect(updated1?.stock).toBe(25);
  });

  it('applies sale offer to products', async () => {
    const p = await createTestProduct({ name: 'Bulk Sale B14', price: 1000 });

    const res = await request(app)
      .post('/api/admin/products/bulk')
      .send({ ids: [p.id], action: 'apply_sale', value: 20 });
    expect(res.status).toBe(200);

    const updated = await testPrisma.product.findUnique({ where: { id: p.id } });
    expect(updated?.onOffer).toBe(true);
    expect(updated?.offerPercent).toBe(20);
  });

  it('returns 400 for invalid action', async () => {
    const p = await createTestProduct({ name: 'Bulk Invalid B14' });
    const res = await request(app)
      .post('/api/admin/products/bulk')
      .send({ ids: [p.id], action: 'fly_to_moon' });
    expect(res.status).toBe(400);
  });
});

// ── Coupons V2 ─────────────────────────────────────────────────────────────────

describe('POST /api/admin/coupons/v2', () => {
  it('creates a percentage coupon', async () => {
    const res = await request(app)
      .post('/api/admin/coupons/v2')
      .send({ code: 'V2PCT10', discount: 10, type: 'percentage' });
    expect(res.status).toBe(201);
    expect(res.body.code).toBe('V2PCT10');
    expect(res.body.type).toBe('percentage');
    expect(res.body.discount).toBe(10);
  });

  it('creates a flat discount coupon', async () => {
    const res = await request(app)
      .post('/api/admin/coupons/v2')
      .send({ code: 'V2FLAT200', discount: 200, type: 'flat' });
    expect(res.status).toBe(201);
    expect(res.body.type).toBe('flat');
    expect(res.body.discount).toBe(200);
  });

  it('creates coupon with minOrder requirement', async () => {
    const res = await request(app)
      .post('/api/admin/coupons/v2')
      .send({ code: 'V2MIN500', discount: 15, minOrder: 500 });
    expect(res.status).toBe(201);
    expect(Number(res.body.minOrder)).toBe(500);
  });

  it('creates coupon with maxUses cap', async () => {
    const res = await request(app)
      .post('/api/admin/coupons/v2')
      .send({ code: 'V2MAX50', discount: 20, maxUses: 50 });
    expect(res.status).toBe(201);
    expect(res.body.maxUses).toBe(50);
  });

  it('creates coupon with expiry date', async () => {
    const expiresAt = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();
    const res = await request(app)
      .post('/api/admin/coupons/v2')
      .send({ code: 'V2EXP30', discount: 10, expiresAt });
    expect(res.status).toBe(201);
    expect(res.body.expiresAt).toBeTruthy();
  });

  it('creates a first-order-only coupon', async () => {
    const res = await request(app)
      .post('/api/admin/coupons/v2')
      .send({ code: 'V2FIRST', discount: 25, firstOrderOnly: true });
    expect(res.status).toBe(201);
    expect(res.body.firstOrderOnly).toBe(true);
  });

  it('returns 400 for duplicate coupon code', async () => {
    await request(app)
      .post('/api/admin/coupons/v2')
      .send({ code: 'V2DUPE', discount: 10 });

    const res = await request(app)
      .post('/api/admin/coupons/v2')
      .send({ code: 'V2DUPE', discount: 15 });
    expect(res.status).toBe(400);
  });

  it('returns 404 when categoryId does not exist', async () => {
    const res = await request(app)
      .post('/api/admin/coupons/v2')
      .send({ code: 'V2BADCAT', discount: 10, categoryId: 'nonexistent-cat-id' });
    expect(res.status).toBe(404);
  });
});

// ── Admin Order Notes ──────────────────────────────────────────────────────────

describe('PATCH /api/admin/orders/:id/admin-notes', () => {
  it('sets admin notes on an order', async () => {
    const product = await createTestProduct({ stock: 5 });
    const order = await placeOrder('9700000001', 1000, product.id);

    const res = await request(app)
      .patch(`/api/admin/orders/${order.id}/admin-notes`)
      .send({ adminNotes: 'Customer requested gift wrapping' });
    expect(res.status).toBe(200);
    expect(res.body.adminNotes).toBe('Customer requested gift wrapping');
  });

  it('returns 404 for unknown order', async () => {
    const res = await request(app)
      .patch('/api/admin/orders/nonexistent-order-id/admin-notes')
      .send({ adminNotes: 'Some note' });
    expect(res.status).toBe(404);
  });

  it('clears admin notes with empty string', async () => {
    const product = await createTestProduct({ stock: 5 });
    const order = await placeOrder('9700000002', 1000, product.id);

    await request(app)
      .patch(`/api/admin/orders/${order.id}/admin-notes`)
      .send({ adminNotes: 'Initial note' });

    const res = await request(app)
      .patch(`/api/admin/orders/${order.id}/admin-notes`)
      .send({ adminNotes: '' });
    expect(res.status).toBe(200);
    expect(res.body.adminNotes).toBe('');
  });
});

// ── Daily Summary ──────────────────────────────────────────────────────────────

describe('GET /api/admin/daily-summary', () => {
  it('returns expected structure', async () => {
    const res = await request(app).get('/api/admin/daily-summary');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('date');
    expect(res.body).toHaveProperty('todayOrderCount');
    expect(res.body).toHaveProperty('todayRevenue');
    expect(res.body).toHaveProperty('pendingOrders');
    expect(res.body).toHaveProperty('lowStockProducts');
    expect(res.body).toHaveProperty('recentOrders');
    expect(Array.isArray(res.body.recentOrders)).toBe(true);
  });

  it('returns date in YYYY-MM-DD format', async () => {
    const res = await request(app).get('/api/admin/daily-summary');
    expect(res.status).toBe(200);
    expect(res.body.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('counts pending orders correctly', async () => {
    const product = await createTestProduct({ stock: 20 });
    await placeOrder('9700000003', 500, product.id);
    await placeOrder('9700000004', 750, product.id);

    const res = await request(app).get('/api/admin/daily-summary');
    expect(res.status).toBe(200);
    expect(res.body.pendingOrders).toBeGreaterThanOrEqual(2);
  });

  it('reports low stock products', async () => {
    await createTestProduct({ name: 'Low Stock Daily B14', stock: 3, active: true });

    const res = await request(app).get('/api/admin/daily-summary');
    expect(res.status).toBe(200);
    const lowStock = res.body.lowStockProducts.find(
      (p: { name: string }) => p.name === 'Low Stock Daily B14'
    );
    expect(lowStock).toBeDefined();
  });
});

// ── Low Stock Alerts ───────────────────────────────────────────────────────────

describe('GET /api/admin/low-stock', () => {
  it('returns empty when no products are low stock', async () => {
    await createTestProduct({ name: 'Full Stock B14', stock: 100 });
    const res = await request(app).get('/api/admin/low-stock');
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(0);
    expect(res.body.products).toHaveLength(0);
  });

  it('returns products with stock at or below default threshold (5)', async () => {
    await createTestProduct({ name: 'Low Stock Alert B14', stock: 4 });

    const res = await request(app).get('/api/admin/low-stock');
    expect(res.status).toBe(200);
    const found = res.body.products.find(
      (p: { name: string }) => p.name === 'Low Stock Alert B14'
    );
    expect(found).toBeDefined();
  });

  it('respects custom threshold query param', async () => {
    await createTestProduct({ name: 'Mid Stock B14', stock: 15 });

    const res = await request(app).get('/api/admin/low-stock?threshold=20');
    expect(res.status).toBe(200);
    const found = res.body.products.find(
      (p: { name: string }) => p.name === 'Mid Stock B14'
    );
    expect(found).toBeDefined();
  });

  it('excludes products that exceed the threshold', async () => {
    await createTestProduct({ name: 'Normal Stock B14', stock: 50 });

    const res = await request(app).get('/api/admin/low-stock?threshold=5');
    expect(res.status).toBe(200);
    const found = res.body.products.find(
      (p: { name: string }) => p.name === 'Normal Stock B14'
    );
    expect(found).toBeUndefined();
  });

  it('includes threshold and count in response', async () => {
    const res = await request(app).get('/api/admin/low-stock?threshold=10');
    expect(res.status).toBe(200);
    expect(res.body.threshold).toBe(10);
    expect(typeof res.body.count).toBe('number');
  });
});

// ── Data Export CSV ────────────────────────────────────────────────────────────

describe('GET /api/admin/export/:type', () => {
  it('exports products as CSV', async () => {
    await createTestProduct({ name: 'Export Product B14' });
    const res = await request(app).get('/api/admin/export/products');
    expect(res.status).toBe(200);
    expect(res.text).toContain('id,name,price');
    expect(res.text).toContain('Export Product B14');
  });

  it('exports orders as CSV', async () => {
    const product = await createTestProduct({ stock: 5 });
    await placeOrder('9700000005', 1200, product.id);

    const res = await request(app).get('/api/admin/export/orders');
    expect(res.status).toBe(200);
    expect(res.text).toContain('orderNumber,customerName');
  });

  it('exports customers as CSV', async () => {
    const res = await request(app).get('/api/admin/export/customers');
    expect(res.status).toBe(200);
    expect(res.text).toContain('phone');
  });

  it('exports reviews as CSV', async () => {
    const res = await request(app).get('/api/admin/export/reviews');
    expect(res.status).toBe(200);
    expect(res.text).toContain('rating');
  });

  it('returns 400 for invalid export type', async () => {
    const res = await request(app).get('/api/admin/export/invoices');
    expect(res.status).toBe(400);
  });

  it('sets Content-Disposition header for products export', async () => {
    const res = await request(app).get('/api/admin/export/products');
    expect(res.status).toBe(200);
    expect(res.headers['content-disposition']).toContain('attachment');
    expect(res.headers['content-disposition']).toContain('.csv');
  });
});

// ── Stock Notifications Admin ──────────────────────────────────────────────────

describe('GET /api/admin/stock-notifications', () => {
  it('returns empty when no notifications exist', async () => {
    const res = await request(app).get('/api/admin/stock-notifications');
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(0);
    expect(Array.isArray(res.body.notifications)).toBe(true);
  });

  it('returns notifications for a specific product', async () => {
    const product = await createTestProduct({ name: 'OOS Notify B14', stock: 0 });
    await testPrisma.backInStockNotification.create({
      data: { productId: product.id, email: 'test@b14.com', notified: false },
    });

    const res = await request(app).get(
      `/api/admin/stock-notifications?productId=${product.id}`
    );
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    expect(res.body.notifications[0].email).toBe('test@b14.com');
  });

  it('filters notifications by notified=false', async () => {
    const product = await createTestProduct({ name: 'OOS Filter B14', stock: 0 });
    await testPrisma.backInStockNotification.create({
      data: { productId: product.id, email: 'pending@b14.com', notified: false },
    });
    await testPrisma.backInStockNotification.create({
      data: { productId: product.id, email: 'done@b14.com', notified: true },
    });

    const res = await request(app).get('/api/admin/stock-notifications?notified=false');
    expect(res.status).toBe(200);
    const emails = res.body.notifications.map((n: { email: string }) => n.email);
    expect(emails).toContain('pending@b14.com');
    expect(emails).not.toContain('done@b14.com');
  });
});

describe('POST /api/admin/stock-notifications/notify/:productId', () => {
  it('marks all pending notifications as notified', async () => {
    const product = await createTestProduct({ name: 'Back In Stock B14', stock: 10 });
    await testPrisma.backInStockNotification.createMany({
      data: [
        { productId: product.id, email: 'a@b14.com', notified: false },
        { productId: product.id, email: 'b@b14.com', notified: false },
      ],
    });

    const res = await request(app).post(
      `/api/admin/stock-notifications/notify/${product.id}`
    );
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.notified).toBe(2);
  });

  it('returns 404 for unknown product', async () => {
    const res = await request(app).post(
      '/api/admin/stock-notifications/notify/nonexistent-product-id'
    );
    expect(res.status).toBe(404);
  });
});

// ── Related Products (new route) ───────────────────────────────────────────────

describe('GET /api/products/:slug/related', () => {
  it('returns products from the same category', async () => {
    const category = await createTestCategory('Related Cat B14');
    const p1 = await createTestProduct({ name: 'Related Main B14', categoryId: category.id, stock: 5 });
    const p2 = await createTestProduct({ name: 'Related Sibling B14', categoryId: category.id, stock: 5 });
    await createTestProduct({ name: 'Related Other Cat B14', stock: 5 }); // different category

    const res = await request(app).get(`/api/products/${p1.slug}/related`);
    expect(res.status).toBe(200);
    const ids = res.body.map((p: { id: string }) => p.id);
    expect(ids).toContain(p2.id);
  });

  it('excludes the queried product from results', async () => {
    const category = await createTestCategory('Related Excl Cat B14');
    const p1 = await createTestProduct({ name: 'Related Excl Main B14', categoryId: category.id, stock: 5 });
    await createTestProduct({ name: 'Related Excl Other B14', categoryId: category.id, stock: 5 });

    const res = await request(app).get(`/api/products/${p1.slug}/related`);
    expect(res.status).toBe(200);
    const ids = res.body.map((p: { id: string }) => p.id);
    expect(ids).not.toContain(p1.id);
  });

  it('returns 404 for unknown slug', async () => {
    const res = await request(app).get('/api/products/totally-unknown-slug-b14/related');
    expect(res.status).toBe(404);
  });

  it('returns empty array when no other products in same category', async () => {
    const category = await createTestCategory('Related Lone Cat B14');
    const p = await createTestProduct({ name: 'Lone Product B14', categoryId: category.id, stock: 5 });

    const res = await request(app).get(`/api/products/${p.slug}/related`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(0);
  });
});

// ── Store Sale Edge Cases ──────────────────────────────────────────────────────

describe('Store sale with date constraints', () => {
  it('does not apply a sale with a future startAt', async () => {
    await testPrisma.storeSale.create({
      data: {
        discountPct: 30,
        active: true,
        startAt: new Date(Date.now() + 7200 * 1000), // 2 hours from now
      },
    });
    await createTestProduct({ name: 'Future Sale B14', price: 1000, stock: 5 });

    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    const product = res.body.products.find(
      (p: { name: string }) => p.name === 'Future Sale B14'
    );
    expect(product).toBeDefined();
    expect(product.salePrice).toBeNull();
  });

  it('does not apply a sale that has already ended', async () => {
    await testPrisma.storeSale.create({
      data: {
        discountPct: 25,
        active: true,
        endAt: new Date(Date.now() - 3600 * 1000), // 1 hour ago
      },
    });
    await createTestProduct({ name: 'Expired Sale B14', price: 1000, stock: 5 });

    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    const product = res.body.products.find(
      (p: { name: string }) => p.name === 'Expired Sale B14'
    );
    expect(product).toBeDefined();
    expect(product.salePrice).toBeNull();
  });

  it('applies a sale when startAt is in the past and endAt is in the future', async () => {
    await testPrisma.storeSale.create({
      data: {
        discountPct: 15,
        active: true,
        startAt: new Date(Date.now() - 3600 * 1000),
        endAt: new Date(Date.now() + 3600 * 1000),
      },
    });
    await createTestProduct({ name: 'Active Dated Sale B14', price: 1000, stock: 5 });

    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    const product = res.body.products.find(
      (p: { name: string }) => p.name === 'Active Dated Sale B14'
    );
    expect(product).toBeDefined();
    expect(product.salePrice).toBe(850);
  });

  it('does not apply an inactive sale', async () => {
    await testPrisma.storeSale.create({
      data: { discountPct: 40, active: false },
    });
    await createTestProduct({ name: 'Inactive Sale B14', price: 1000, stock: 5 });

    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    const product = res.body.products.find(
      (p: { name: string }) => p.name === 'Inactive Sale B14'
    );
    expect(product).toBeDefined();
    expect(product.salePrice).toBeNull();
  });
});

// ── Admin Products Listing & Operations ───────────────────────────────────────

describe('GET /api/admin/products', () => {
  it('returns paginated product list', async () => {
    await createTestProduct({ name: 'Admin Prod List B14' });
    const res = await request(app).get('/api/admin/products?page=1&limit=10');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.products)).toBe(true);
    expect(res.body.total).toBeGreaterThanOrEqual(1);
  });

  it('filters products by search query', async () => {
    await createTestProduct({ name: 'Searchable UniqueB14 Saree' });
    await createTestProduct({ name: 'Other Admin Product B14' });

    const res = await request(app).get('/api/admin/products?search=UniqueB14');
    expect(res.status).toBe(200);
    const names = res.body.products.map((p: { name: string }) => p.name);
    expect(names.some((n: string) => n.includes('UniqueB14'))).toBe(true);
  });

  it('returns product with stock info', async () => {
    await createTestProduct({ name: 'Stock Info B14', stock: 42 });
    const res = await request(app).get('/api/admin/products?search=Stock Info B14');
    expect(res.status).toBe(200);
    const product = res.body.products.find(
      (p: { name: string }) => p.name === 'Stock Info B14'
    );
    expect(product?.stock).toBe(42);
  });
});

describe('PATCH /api/admin/products/:id/stock', () => {
  it('updates product stock', async () => {
    const product = await createTestProduct({ name: 'Stock Update B14', stock: 10 });

    const res = await request(app)
      .patch(`/api/admin/products/${product.id}/stock`)
      .send({ stock: 99 });
    expect(res.status).toBe(200);
    expect(res.body.stock).toBe(99);
  });

  it('returns 404 for unknown product', async () => {
    const res = await request(app)
      .patch('/api/admin/products/nonexistent-id/stock')
      .send({ stock: 10 });
    expect(res.status).toBe(404);
  });
});

// ── Admin Order Management ─────────────────────────────────────────────────────

describe('PUT /api/admin/orders/:id/status', () => {
  it('updates order status', async () => {
    const product = await createTestProduct({ stock: 5 });
    const order = await placeOrder('9700000006', 1500, product.id);

    const res = await request(app)
      .put(`/api/admin/orders/${order.id}/status`)
      .send({ status: 'confirmed' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('confirmed');
  });

  it('returns 404 for unknown order', async () => {
    const res = await request(app)
      .put('/api/admin/orders/no-such-id/status')
      .send({ status: 'confirmed' });
    expect(res.status).toBe(404);
  });
});

describe('POST /api/admin/orders/bulk-status', () => {
  it('updates status for multiple orders', async () => {
    const product = await createTestProduct({ stock: 20 });
    const o1 = await placeOrder('9700000007', 1000, product.id);
    const o2 = await placeOrder('9700000008', 1500, product.id);

    const res = await request(app)
      .post('/api/admin/orders/bulk-status')
      .send({ ids: [o1.id, o2.id], status: 'confirmed' });
    expect(res.status).toBe(200);
    expect(res.body.updated).toBe(2);
  });
});

// ── Admin Dashboard ────────────────────────────────────────────────────────────

describe('GET /api/admin/dashboard', () => {
  it('returns dashboard stats structure', async () => {
    const res = await request(app).get('/api/admin/dashboard');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('totalOrders');
    expect(res.body).toHaveProperty('totalRevenue');
    expect(res.body).toHaveProperty('totalProducts');
  });

  it('counts products correctly', async () => {
    await createTestProduct({ name: 'Dashboard Prod B14' });
    const res = await request(app).get('/api/admin/dashboard');
    expect(res.status).toBe(200);
    expect(res.body.totalProducts).toBeGreaterThanOrEqual(1);
  });
});
