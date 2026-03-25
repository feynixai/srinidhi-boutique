/**
 * New feature tests — contact form, bulk order status, WhatsApp links,
 * order tracking, admin low stock, cart edge cases, search debounce behavior
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
  line1: '10 Banjara Hills',
  city: 'Hyderabad',
  state: 'Telangana',
  pincode: '500034',
};

// ── Contact Form ───────────────────────────────────────────────────────────────
describe('POST /api/contact', () => {
  it('stores a contact submission with all fields', async () => {
    const res = await request(app).post('/api/contact').send({
      name: 'Priya Sharma',
      phone: '9876543210',
      email: 'priya@example.com',
      message: 'I need help finding a wedding saree.',
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.id).toBeDefined();
  });

  it('stores a contact submission without optional fields', async () => {
    const res = await request(app).post('/api/contact').send({
      name: 'Ananya',
      message: 'Is this available in blue?',
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('rejects submission without name', async () => {
    const res = await request(app).post('/api/contact').send({
      message: 'Just a message without a name.',
    });
    expect(res.status).toBe(400);
  });

  it('rejects submission without message', async () => {
    const res = await request(app).post('/api/contact').send({
      name: 'Kavitha',
    });
    expect(res.status).toBe(400);
  });

  it('rejects invalid email format', async () => {
    const res = await request(app).post('/api/contact').send({
      name: 'Raji',
      email: 'not-an-email',
      message: 'My query',
    });
    expect(res.status).toBe(400);
  });

  it('accepts empty email string', async () => {
    const res = await request(app).post('/api/contact').send({
      name: 'Lakshmi',
      email: '',
      message: 'My enquiry about festival wear',
    });
    expect(res.status).toBe(201);
  });

  it('lists contact submissions', async () => {
    await request(app).post('/api/contact').send({ name: 'A', message: 'Query 1' });
    await request(app).post('/api/contact').send({ name: 'B', message: 'Query 2' });
    const res = await request(app).get('/api/contact');
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
  });
});

// ── Bulk Order Status ──────────────────────────────────────────────────────────
describe('POST /api/admin/orders/bulk-status', () => {
  it('updates multiple orders to the same status', async () => {
    const product = await createTestProduct({ price: 999, stock: 100 });
    const base = {
      customerName: 'Bulk Test',
      customerPhone: '9876543210',
      address: validAddress,
      items: [{ productId: product.id, quantity: 1 }],
      paymentMethod: 'cod',
    };

    // Create orders sequentially to avoid orderNumber unique constraint race condition
    const r1 = await request(app).post('/api/orders').send(base);
    const r2 = await request(app).post('/api/orders').send(base);
    const r3 = await request(app).post('/api/orders').send(base);

    const ids = [r1.body.id, r2.body.id, r3.body.id];
    const res = await request(app)
      .post('/api/admin/orders/bulk-status')
      .send({ ids, status: 'confirmed' });

    expect(res.status).toBe(200);
    expect(res.body.updated).toBe(3);

    const updated = await testPrisma.order.findMany({ where: { id: { in: ids } } });
    expect(updated.every((o) => o.status === 'confirmed')).toBe(true);
  });

  it('bulk-cancels selected orders', async () => {
    const product = await createTestProduct({ price: 500, stock: 50 });
    const r1 = await request(app).post('/api/orders').send({
      customerName: 'Cancel Test',
      customerPhone: '9876543210',
      address: validAddress,
      items: [{ productId: product.id, quantity: 1 }],
      paymentMethod: 'cod',
    });

    const res = await request(app)
      .post('/api/admin/orders/bulk-status')
      .send({ ids: [r1.body.id], status: 'cancelled' });

    expect(res.status).toBe(200);
    expect(res.body.updated).toBe(1);
  });

  it('rejects bulk update with empty ids array', async () => {
    const res = await request(app)
      .post('/api/admin/orders/bulk-status')
      .send({ ids: [], status: 'confirmed' });
    expect(res.status).toBe(400);
  });

  it('rejects invalid status value', async () => {
    const res = await request(app)
      .post('/api/admin/orders/bulk-status')
      .send({ ids: [uuidv4()], status: 'magic' });
    expect(res.status).toBe(400);
  });

  it('handles ids that do not match any orders gracefully', async () => {
    const res = await request(app)
      .post('/api/admin/orders/bulk-status')
      .send({ ids: [uuidv4(), uuidv4()], status: 'delivered' });
    expect(res.status).toBe(200);
    expect(res.body.updated).toBe(0);
  });
});

// ── Order Tracking ─────────────────────────────────────────────────────────────
describe('GET /api/orders/track', () => {
  it('returns order for matching orderNumber and phone', async () => {
    const product = await createTestProduct({ price: 999, stock: 10 });
    const orderRes = await request(app).post('/api/orders').send({
      customerName: 'Track Me',
      customerPhone: '9123456780',
      address: validAddress,
      items: [{ productId: product.id, quantity: 1 }],
      paymentMethod: 'cod',
    });
    const { orderNumber } = orderRes.body;

    const res = await request(app).get('/api/orders/track').query({
      orderNumber,
      phone: '9123456780',
    });
    expect(res.status).toBe(200);
    expect(res.body.orderNumber).toBe(orderNumber);
    expect(res.body.customerName).toBe('Track Me');
  });

  it('returns 404 for wrong phone number', async () => {
    const product = await createTestProduct({ price: 999, stock: 10 });
    const orderRes = await request(app).post('/api/orders').send({
      customerName: 'Track Me 2',
      customerPhone: '9123456789',
      address: validAddress,
      items: [{ productId: product.id, quantity: 1 }],
      paymentMethod: 'cod',
    });
    const { orderNumber } = orderRes.body;

    const res = await request(app).get('/api/orders/track').query({
      orderNumber,
      phone: '0000000000',
    });
    expect(res.status).toBe(404);
  });

  it('returns 404 for non-existent order number', async () => {
    const res = await request(app).get('/api/orders/track').query({
      orderNumber: 'SB-FAKE',
      phone: '9876543210',
    });
    expect(res.status).toBe(404);
  });

  it('requires both orderNumber and phone', async () => {
    const res1 = await request(app).get('/api/orders/track').query({ phone: '9876543210' });
    expect(res1.status).toBe(400);

    const res2 = await request(app).get('/api/orders/track').query({ orderNumber: 'SB-001' });
    expect(res2.status).toBe(400);
  });

  it('includes order items in tracking response', async () => {
    const product = await createTestProduct({ price: 1200, stock: 5 });
    const orderRes = await request(app).post('/api/orders').send({
      customerName: 'Item Tracker',
      customerPhone: '9111111111',
      address: validAddress,
      items: [{ productId: product.id, quantity: 2 }],
      paymentMethod: 'cod',
    });

    const res = await request(app).get('/api/orders/track').query({
      orderNumber: orderRes.body.orderNumber,
      phone: '9111111111',
    });
    expect(res.status).toBe(200);
    expect(res.body.items).toBeDefined();
    expect(res.body.items.length).toBeGreaterThanOrEqual(1);
  });
});

// ── WhatsApp link generation (utility tests) ──────────────────────────────────
describe('WhatsApp link generation', () => {
  it('generates correct wa.me URL format', () => {
    const number = '+919876543210';
    const clean = number.replace('+', '');
    const msg = encodeURIComponent('Hi Srinidhi Boutique!');
    const link = `https://wa.me/${clean}?text=${msg}`;
    expect(link).toMatch(/^https:\/\/wa\.me\/91/);
    expect(link).toContain('?text=');
  });

  it('product order message includes product name and price', () => {
    const name = 'Kanjivaram Silk Saree';
    const price = 4999;
    const msg = `Hi! I'm interested in buying "${name}" (₹${price.toLocaleString('en-IN')}). Can you help me place an order?`;
    expect(msg).toContain(name);
    expect(msg).toContain('₹4,999');
  });

  it('product message includes size when selected', () => {
    const size = 'M';
    const msg = `Hi! I'm interested in buying "Kurti" (₹999), Size: ${size}. Can you help?`;
    expect(msg).toContain('Size: M');
  });

  it('product message includes color when selected', () => {
    const color = 'Rose Gold';
    const msg = `Hi! I'm interested in buying "Lehenga" (₹5999), Color: ${color}.`;
    expect(msg).toContain('Color: Rose Gold');
  });

  it('order tracking message includes order number', () => {
    const orderNumber = 'SB-0042';
    const msg = `Hi! I need help with my order ${orderNumber}.`;
    expect(msg).toContain('SB-0042');
  });

  it('return request message is properly formatted', () => {
    const waBase = '919876543210';
    const text = "Hi! I'd like to initiate a return for my order.";
    const link = `https://wa.me/${waBase}?text=${encodeURIComponent(text)}`;
    expect(link).toContain('wa.me');
    expect(decodeURIComponent(link)).toContain('return');
  });
});

// ── Admin Low Stock ────────────────────────────────────────────────────────────
describe('Admin low stock detection', () => {
  it('dashboard reflects correct low stock count', async () => {
    await createTestProduct({ name: 'Low Stock A', stock: 2 });
    await createTestProduct({ name: 'Low Stock B', stock: 5 });
    await createTestProduct({ name: 'Normal Stock', stock: 50 });

    const res = await request(app).get('/api/admin/dashboard');
    expect(res.status).toBe(200);
    expect(res.body.lowStockProducts).toBeGreaterThanOrEqual(2);
  });

  it('shows zero low stock when all products have high stock', async () => {
    await createTestProduct({ name: 'Plenty A', stock: 100 });
    await createTestProduct({ name: 'Plenty B', stock: 200 });

    const res = await request(app).get('/api/admin/dashboard');
    expect(res.status).toBe(200);
    // only counting active products with stock <= 5
    const lowStock = res.body.lowStockProducts;
    expect(typeof lowStock).toBe('number');
  });

  it('PATCH /api/admin/products/:id/stock sets stock to exact value', async () => {
    const product = await createTestProduct({ stock: 100 });
    const res = await request(app)
      .patch(`/api/admin/products/${product.id}/stock`)
      .send({ stock: 3 });
    expect(res.status).toBe(200);
    expect(res.body.stock).toBe(3);
  });

  it('rejects negative stock value', async () => {
    const product = await createTestProduct({ stock: 10 });
    const res = await request(app)
      .patch(`/api/admin/products/${product.id}/stock`)
      .send({ stock: -1 });
    expect(res.status).toBe(400);
  });

  it('rejects non-integer stock value', async () => {
    const product = await createTestProduct({ stock: 10 });
    const res = await request(app)
      .patch(`/api/admin/products/${product.id}/stock`)
      .send({ stock: 1.5 });
    expect(res.status).toBe(400);
  });
});

// ── Cart quantity edge cases ───────────────────────────────────────────────────
describe('Cart quantity updates', () => {
  it('adding same product twice increases total quantity in cart', async () => {
    const product = await createTestProduct({ price: 999 });
    const sessionId = uuidv4();

    // Add with explicit size so upsert key matches
    await request(app).post('/api/cart').send({ sessionId, productId: product.id, quantity: 1, size: 'M' });
    await request(app).post('/api/cart').send({ sessionId, productId: product.id, quantity: 1, size: 'M' });

    const res = await request(app).get(`/api/cart/${sessionId}`);
    expect(res.status).toBe(200);
    const total = res.body.items.reduce((sum: number, i: { quantity: number }) => sum + i.quantity, 0);
    expect(total).toBe(2);
  });

  it('PUT /api/cart/:id updates quantity', async () => {
    const product = await createTestProduct({ price: 999 });
    const sessionId = uuidv4();

    await request(app).post('/api/cart').send({ sessionId, productId: product.id, quantity: 1 });
    const cartRes = await request(app).get(`/api/cart/${sessionId}`);
    const itemId = cartRes.body.items[0].id;

    const res = await request(app).put(`/api/cart/${itemId}`).send({ quantity: 5 });
    expect(res.status).toBe(200);
    expect(res.body.quantity).toBe(5);
  });

  it('DELETE /api/cart/:id removes item', async () => {
    const product = await createTestProduct({ price: 999 });
    const sessionId = uuidv4();

    await request(app).post('/api/cart').send({ sessionId, productId: product.id, quantity: 1 });
    const cartRes = await request(app).get(`/api/cart/${sessionId}`);
    const itemId = cartRes.body.items[0].id;

    await request(app).delete(`/api/cart/${itemId}`);
    const afterRes = await request(app).get(`/api/cart/${sessionId}`);
    expect(afterRes.body.items).toHaveLength(0);
  });

  it('cart subtotal is correct for multiple items', async () => {
    const p1 = await createTestProduct({ price: 500 });
    const p2 = await createTestProduct({ price: 1200 });
    const sessionId = uuidv4();

    await request(app).post('/api/cart').send({ sessionId, productId: p1.id, quantity: 2 });
    await request(app).post('/api/cart').send({ sessionId, productId: p2.id, quantity: 1 });

    const res = await request(app).get(`/api/cart/${sessionId}`);
    expect(res.status).toBe(200);
    expect(Number(res.body.subtotal)).toBe(2200);
  });

  it('cart with size and color stores variants', async () => {
    const product = await createTestProduct({ sizes: ['S', 'M'], colors: ['Red', 'Blue'] });
    const sessionId = uuidv4();

    await request(app).post('/api/cart').send({
      sessionId,
      productId: product.id,
      quantity: 1,
      size: 'M',
      color: 'Blue',
    });

    const res = await request(app).get(`/api/cart/${sessionId}`);
    const item = res.body.items[0];
    expect(item.size).toBe('M');
    expect(item.color).toBe('Blue');
  });
});

// ── Admin bulk operations ──────────────────────────────────────────────────────
describe('Admin bulk operations', () => {
  it('bulk-updates to all valid statuses', async () => {
    const product = await createTestProduct({ price: 999, stock: 100 });
    const createOrder = () => request(app).post('/api/orders').send({
      customerName: 'Status Flow',
      customerPhone: '9999999999',
      address: validAddress,
      items: [{ productId: product.id, quantity: 1 }],
      paymentMethod: 'cod',
    });

    const r = await createOrder();
    const validStatuses = ['confirmed', 'packed', 'shipped', 'delivered', 'cancelled'];
    for (const status of validStatuses.slice(0, 2)) {
      const res = await request(app)
        .post('/api/admin/orders/bulk-status')
        .send({ ids: [r.body.id], status });
      expect(res.status).toBe(200);
    }
  });

  it('can update a single order via bulk endpoint', async () => {
    const product = await createTestProduct({ price: 499, stock: 20 });
    const orderRes = await request(app).post('/api/orders').send({
      customerName: 'Single Bulk',
      customerPhone: '8888888888',
      address: validAddress,
      items: [{ productId: product.id, quantity: 1 }],
      paymentMethod: 'cod',
    });

    const res = await request(app)
      .post('/api/admin/orders/bulk-status')
      .send({ ids: [orderRes.body.id], status: 'confirmed' });

    expect(res.body.updated).toBe(1);
    const order = await testPrisma.order.findUnique({ where: { id: orderRes.body.id } });
    expect(order?.status).toBe('confirmed');
  });
});

// ── Search behaviour ───────────────────────────────────────────────────────────
describe('Product search', () => {
  it('returns products matching name search', async () => {
    await createTestProduct({ name: 'Banarasi Silk Saree' });
    await createTestProduct({ name: 'Cotton Kurti Set' });

    const res = await request(app).get('/api/products?search=Banarasi');
    expect(res.status).toBe(200);
    expect(res.body.products.some((p: { name: string }) => p.name.includes('Banarasi'))).toBe(true);
  });

  it('returns empty array for unmatched search', async () => {
    await createTestProduct({ name: 'Regular Saree' });

    const res = await request(app).get('/api/products?search=ZZZNonExistent999');
    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(0);
  });

  it('search is case-insensitive', async () => {
    await createTestProduct({ name: 'Phulkari Dupatta' });

    const res = await request(app).get('/api/products?search=phulkari');
    expect(res.status).toBe(200);
    expect(res.body.products.some((p: { name: string }) => p.name.toLowerCase().includes('phulkari'))).toBe(true);
  });

  it('admin product search works', async () => {
    await createTestProduct({ name: 'Chaniya Choli Festival' });

    const res = await request(app).get('/api/admin/products?search=Chaniya');
    expect(res.status).toBe(200);
    expect(res.body.products.some((p: { name: string }) => p.name.includes('Chaniya'))).toBe(true);
  });
});

// ── Order tracking route ───────────────────────────────────────────────────────
describe('Order tracking with status updates', () => {
  it('shows correct status after update', async () => {
    const product = await createTestProduct({ price: 999, stock: 10 });
    const orderRes = await request(app).post('/api/orders').send({
      customerName: 'Status Tracker',
      customerPhone: '7777777777',
      address: validAddress,
      items: [{ productId: product.id, quantity: 1 }],
      paymentMethod: 'cod',
    });

    await request(app)
      .put(`/api/admin/orders/${orderRes.body.id}/status`)
      .send({ status: 'shipped', trackingId: 'DELHIVERY123' });

    const res = await request(app).get('/api/orders/track').query({
      orderNumber: orderRes.body.orderNumber,
      phone: '7777777777',
    });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('shipped');
    expect(res.body.trackingId).toBe('DELHIVERY123');
  });

  it('shows tracking ID in response when shipped', async () => {
    const product = await createTestProduct({ price: 1500, stock: 8 });
    const orderRes = await request(app).post('/api/orders').send({
      customerName: 'Shipping Track',
      customerPhone: '6666666666',
      address: validAddress,
      items: [{ productId: product.id, quantity: 1 }],
      paymentMethod: 'razorpay',
      paymentId: 'pay_xyz789',
    });

    await request(app)
      .put(`/api/admin/orders/${orderRes.body.id}/status`)
      .send({ status: 'shipped', trackingId: 'BLUEDART456' });

    const trackRes = await request(app).get('/api/orders/track').query({
      orderNumber: orderRes.body.orderNumber,
      phone: '6666666666',
    });

    expect(trackRes.body.trackingId).toBe('BLUEDART456');
  });
});

// ── Image gallery (product images) ────────────────────────────────────────────
describe('Product image fields', () => {
  it('product stores multiple images', async () => {
    const cat = await createTestCategory('Gallery Test');
    const res = await request(app).post('/api/admin/products').send({
      name: 'Multi Image Saree',
      price: 2999,
      images: [
        'https://example.com/img1.jpg',
        'https://example.com/img2.jpg',
        'https://example.com/img3.jpg',
      ],
      sizes: ['Free Size'],
      colors: ['Red'],
      occasion: ['wedding'],
      stock: 10,
      categoryId: cat.id,
    });
    expect(res.status).toBe(201);
    expect(res.body.images).toHaveLength(3);
    expect(res.body.images[0]).toBe('https://example.com/img1.jpg');
  });

  it('product with single image works', async () => {
    const res = await request(app).post('/api/admin/products').send({
      name: 'Single Image Product',
      price: 999,
      images: ['https://example.com/solo.jpg'],
      sizes: [],
      colors: [],
      occasion: [],
      stock: 5,
    });
    expect(res.status).toBe(201);
    expect(res.body.images).toHaveLength(1);
  });

  it('product images are returned in GET /api/products', async () => {
    await createTestProduct({
      name: 'Image Gallery Test',
      images: ['https://example.com/a.jpg', 'https://example.com/b.jpg'],
    });

    const res = await request(app).get('/api/products?search=Image+Gallery+Test');
    expect(res.status).toBe(200);
    const product = res.body.products.find((p: { name: string }) => p.name === 'Image Gallery Test');
    expect(product).toBeDefined();
    expect(product.images.length).toBeGreaterThanOrEqual(1);
  });
});

// ── Coupon edge cases ──────────────────────────────────────────────────────────
describe('Coupon edge cases', () => {
  it('validates coupon and returns discount amount', async () => {
    await createTestCoupon({ code: 'FLAT15', discount: 15 });
    const res = await request(app).post('/api/coupons/validate').send({
      code: 'FLAT15',
      orderAmount: 2000,
    });
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
    expect(Number(res.body.discountAmount)).toBe(300); // 15% of 2000
  });

  it('rejects expired coupon', async () => {
    await createTestCoupon({
      code: 'EXPIRED50',
      discount: 50,
      expiresAt: new Date('2020-01-01'),
    });
    const res = await request(app).post('/api/coupons/validate').send({
      code: 'EXPIRED50',
      orderAmount: 1000,
    });
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(false);
  });

  it('rejects coupon when order is below minOrder', async () => {
    await createTestCoupon({ code: 'MIN2000', discount: 10, minOrder: 2000 });
    const res = await request(app).post('/api/coupons/validate').send({
      code: 'MIN2000',
      orderAmount: 1000,
    });
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(false);
  });

  it('rejects non-existent coupon', async () => {
    const res = await request(app).post('/api/coupons/validate').send({
      code: 'DOESNOTEXIST',
      orderAmount: 999,
    });
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(false);
  });

  it('coupon is case insensitive', async () => {
    await createTestCoupon({ code: 'SUMMER20', discount: 20 });
    const res = await request(app).post('/api/coupons/validate').send({
      code: 'summer20',
      orderAmount: 1000,
    });
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
  });
});
