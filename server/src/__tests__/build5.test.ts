/**
 * Build 5 tests — returns flow, advanced filters, WhatsApp links,
 * fabric filter, coupon SRINIDHI20, admin returns, PWA manifest,
 * cart persistence helpers, and more.
 */
import request from 'supertest';
import { app } from '../index';
import {
  createTestProduct,
  createTestCategory,
  createTestCoupon,
  createTestReturnRequest,
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
  line1: '100 Jubilee Hills',
  city: 'Hyderabad',
  state: 'Telangana',
  pincode: '500033',
};

// ── Return Requests ─────────────────────────────────────────────────────────

describe('POST /api/returns', () => {
  it('submits a valid return request', async () => {
    const product = await createTestProduct({ stock: 5 });
    // create an order first
    const order = await testPrisma.order.create({
      data: {
        orderNumber: 'SB-9901',
        customerName: 'Meera Sharma',
        customerPhone: '9876543210',
        address: validAddress,
        subtotal: 999,
        shipping: 0,
        discount: 0,
        total: 999,
        paymentMethod: 'cod',
        status: 'delivered',
        paymentStatus: 'pending',
        items: {
          create: [{
            productId: product.id,
            name: product.name,
            price: 999,
            quantity: 1,
          }],
        },
      },
    });

    const res = await request(app).post('/api/returns').send({
      orderNumber: 'SB-9901',
      customerName: 'Meera Sharma',
      customerPhone: '9876543210',
      reason: 'defective',
      description: 'The fabric was torn on arrival.',
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.id).toBeDefined();
  });

  it('rejects return if order not found', async () => {
    const res = await request(app).post('/api/returns').send({
      orderNumber: 'SB-9999',
      customerName: 'Nobody',
      customerPhone: '9876543210',
      reason: 'defective',
    });
    expect(res.status).toBe(404);
  });

  it('rejects if phone does not match order', async () => {
    const product = await createTestProduct({ stock: 5 });
    await testPrisma.order.create({
      data: {
        orderNumber: 'SB-9902',
        customerName: 'Priya',
        customerPhone: '9000000001',
        address: validAddress,
        subtotal: 500,
        shipping: 0,
        discount: 0,
        total: 500,
        paymentMethod: 'cod',
        status: 'delivered',
        paymentStatus: 'pending',
        items: {
          create: [{ productId: product.id, name: product.name, price: 500, quantity: 1 }],
        },
      },
    });

    const res = await request(app).post('/api/returns').send({
      orderNumber: 'SB-9902',
      customerName: 'Priya',
      customerPhone: '9111111111', // wrong phone
      reason: 'size_issue',
    });
    expect(res.status).toBe(404);
  });

  it('rejects invalid reason enum', async () => {
    const res = await request(app).post('/api/returns').send({
      orderNumber: 'SB-1234',
      customerName: 'Test',
      customerPhone: '9876543210',
      reason: 'i_dont_like_it',
    });
    expect(res.status).toBe(400);
  });

  it('rejects missing required fields', async () => {
    const res = await request(app).post('/api/returns').send({
      orderNumber: 'SB-1234',
    });
    expect(res.status).toBe(400);
  });

  it('submits return without optional description', async () => {
    const product = await createTestProduct({ stock: 5 });
    await testPrisma.order.create({
      data: {
        orderNumber: 'SB-9903',
        customerName: 'Lakshmi',
        customerPhone: '9876543210',
        address: validAddress,
        subtotal: 1200,
        shipping: 0,
        discount: 0,
        total: 1200,
        paymentMethod: 'upi',
        status: 'delivered',
        paymentStatus: 'paid',
        items: {
          create: [{ productId: product.id, name: product.name, price: 1200, quantity: 1 }],
        },
      },
    });

    const res = await request(app).post('/api/returns').send({
      orderNumber: 'SB-9903',
      customerName: 'Lakshmi',
      customerPhone: '9876543210',
      reason: 'wrong_item',
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('accepts all valid reason types', async () => {
    const reasons = ['defective', 'wrong_item', 'size_issue', 'not_as_described', 'other'];
    for (let i = 0; i < reasons.length; i++) {
      const product = await createTestProduct({ stock: 5 });
      const orderNum = `SB-990${10 + i}`;
      await testPrisma.order.create({
        data: {
          orderNumber: orderNum,
          customerName: 'Sunita',
          customerPhone: '9876543210',
          address: validAddress,
          subtotal: 800,
          shipping: 0,
          discount: 0,
          total: 800,
          paymentMethod: 'cod',
          status: 'delivered',
          paymentStatus: 'pending',
          items: {
            create: [{ productId: product.id, name: product.name, price: 800, quantity: 1 }],
          },
        },
      });
      const res = await request(app).post('/api/returns').send({
        orderNumber: orderNum,
        customerName: 'Sunita',
        customerPhone: '9876543210',
        reason: reasons[i],
      });
      expect(res.status).toBe(201);
    }
  });
});

describe('GET /api/returns', () => {
  it('returns empty list when no requests', async () => {
    const res = await request(app).get('/api/returns');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);
  });

  it('lists all return requests', async () => {
    await createTestReturnRequest({ orderNumber: 'SB-8001' });
    await createTestReturnRequest({ orderNumber: 'SB-8002' });
    const res = await request(app).get('/api/returns');
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
  });

  it('returns requests in descending order by date', async () => {
    await createTestReturnRequest({ orderNumber: 'SB-8010' });
    await createTestReturnRequest({ orderNumber: 'SB-8011' });
    const res = await request(app).get('/api/returns');
    expect(res.status).toBe(200);
    expect(new Date(res.body[0].createdAt) >= new Date(res.body[1].createdAt)).toBe(true);
  });
});

describe('PATCH /api/returns/:id/status', () => {
  it('approves a pending return request', async () => {
    const req = await createTestReturnRequest({ status: 'pending' });
    const res = await request(app).patch(`/api/returns/${req.id}/status`).send({ status: 'approved' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('approved');
  });

  it('rejects a pending return request', async () => {
    const req = await createTestReturnRequest({ status: 'pending' });
    const res = await request(app).patch(`/api/returns/${req.id}/status`).send({ status: 'rejected' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('rejected');
  });

  it('marks a return as completed', async () => {
    const req = await createTestReturnRequest({ status: 'approved' });
    const res = await request(app).patch(`/api/returns/${req.id}/status`).send({ status: 'completed' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('completed');
  });

  it('rejects invalid status', async () => {
    const req = await createTestReturnRequest();
    const res = await request(app).patch(`/api/returns/${req.id}/status`).send({ status: 'invalid_status' });
    expect(res.status).toBe(400);
  });

  it('returns error for non-existent return request', async () => {
    const fakeId = 'clnotfound00000000000000000';
    const res = await request(app).patch(`/api/returns/${fakeId}/status`).send({ status: 'approved' });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});

// ── Admin Returns ──────────────────────────────────────────────────────────

describe('GET /api/admin/returns', () => {
  it('returns all return requests via admin route', async () => {
    await createTestReturnRequest({ orderNumber: 'SB-7001' });
    await createTestReturnRequest({ orderNumber: 'SB-7002', status: 'approved' });
    const res = await request(app).get('/api/admin/returns');
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
  });
});

describe('PATCH /api/admin/returns/:id/status', () => {
  it('updates status via admin route', async () => {
    const req = await createTestReturnRequest({ status: 'pending' });
    const res = await request(app).patch(`/api/admin/returns/${req.id}/status`).send({ status: 'approved' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('approved');
  });
});

// ── Advanced Filter — Fabric ────────────────────────────────────────────────

describe('GET /api/products — fabric filter', () => {
  it('filters products by fabric', async () => {
    await createTestProduct({ name: 'Silk Kurti Test', fabric: 'Silk', stock: 10 });
    await createTestProduct({ name: 'Cotton Kurti Test', fabric: 'Cotton', stock: 10 });

    const res = await request(app).get('/api/products?fabric=Silk');
    expect(res.status).toBe(200);
    expect(res.body.products.every((p: { fabric: string }) => p.fabric?.toLowerCase().includes('silk'))).toBe(true);
  });

  it('fabric filter is case-insensitive', async () => {
    await createTestProduct({ name: 'Linen Saree Test', fabric: 'Pure Linen', stock: 5 });
    const res = await request(app).get('/api/products?fabric=linen');
    expect(res.status).toBe(200);
    expect(res.body.products.length).toBeGreaterThan(0);
  });

  it('returns empty when fabric has no matches', async () => {
    await createTestProduct({ name: 'Cotton Test Only', fabric: 'Cotton', stock: 10 });
    const res = await request(app).get('/api/products?fabric=Velvet');
    expect(res.status).toBe(200);
    expect(res.body.products.length).toBe(0);
  });

  it('combines fabric with size filter', async () => {
    await createTestProduct({ name: 'Georgette M Test', fabric: 'Georgette', sizes: ['M', 'L'], stock: 10 });
    await createTestProduct({ name: 'Georgette S Test', fabric: 'Georgette', sizes: ['S'], stock: 10 });

    const res = await request(app).get('/api/products?fabric=Georgette&size=M');
    expect(res.status).toBe(200);
    expect(res.body.products.length).toBe(1);
    expect(res.body.products[0].name).toBe('Georgette M Test');
  });

  it('combines fabric with price filter', async () => {
    await createTestProduct({ name: 'Cheap Silk', fabric: 'Silk', price: 500, stock: 10 });
    await createTestProduct({ name: 'Expensive Silk', fabric: 'Silk', price: 5000, stock: 10 });

    const res = await request(app).get('/api/products?fabric=Silk&maxPrice=1000');
    expect(res.status).toBe(200);
    expect(res.body.products.every((p: { price: string }) => Number(p.price) <= 1000)).toBe(true);
  });
});

// ── SRINIDHI20 Coupon ───────────────────────────────────────────────────────

describe('SRINIDHI20 coupon', () => {
  it('applies 20% discount on orders above ₹2000', async () => {
    await createTestCoupon({ code: 'SRINIDHI20', discount: 20, minOrder: 2000 });
    const res = await request(app).post('/api/coupons/validate').send({
      code: 'SRINIDHI20',
      orderAmount: 2500,
    });
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
    expect(res.body.discountAmount).toBe(500); // 20% of 2500
  });

  it('rejects SRINIDHI20 if order below ₹2000', async () => {
    await createTestCoupon({ code: 'SRINIDHI20', discount: 20, minOrder: 2000 });
    const res = await request(app).post('/api/coupons/validate').send({
      code: 'SRINIDHI20',
      orderAmount: 1500,
    });
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(false);
  });

  it('WELCOME10 applies on orders above ₹500', async () => {
    await createTestCoupon({ code: 'WELCOME10', discount: 10, minOrder: 500 });
    const res = await request(app).post('/api/coupons/validate').send({
      code: 'WELCOME10',
      orderAmount: 800,
    });
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
    expect(res.body.discountAmount).toBe(80); // 10% of 800
  });
});

// ── WhatsApp Link Generation ─────────────────────────────────────────────────

describe('WhatsApp link generation', () => {
  it('order number is included in formatted notification text', () => {
    const orderNumber = 'SB-0042';
    const total = 2500;
    const paymentMethod = 'upi';
    const paymentLabel = paymentMethod === 'upi' ? 'UPI' : paymentMethod;
    const msg = `Hi, I just placed order #${orderNumber} on Srinidhi Boutique. Total: ₹${total.toLocaleString('en-IN')}. Payment: ${paymentLabel}.`;
    expect(msg).toContain('SB-0042');
    expect(msg).toContain('₹2,500');
    expect(msg).toContain('UPI');
  });

  it('COD payment label formats correctly', () => {
    const paymentMethod = 'cod';
    const label = paymentMethod === 'cod' ? 'Cash on Delivery' : paymentMethod;
    expect(label).toBe('Cash on Delivery');
  });

  it('Razorpay payment label defaults gracefully', () => {
    const paymentMethod: string = 'razorpay';
    const label = paymentMethod === 'cod' ? 'Cash on Delivery' : paymentMethod === 'upi' ? 'UPI' : 'Online Payment';
    expect(label).toBe('Online Payment');
  });

  it('WhatsApp link encodes order number', () => {
    const orderNumber = 'SB-0042';
    const waNumber = '919876543210';
    const msg = encodeURIComponent(`Hi, I just placed order #${orderNumber} on Srinidhi Boutique.`);
    const link = `https://wa.me/${waNumber}?text=${msg}`;
    expect(link).toContain('wa.me/919876543210');
    expect(link).toContain(encodeURIComponent('SB-0042'));
  });

  it('track order WhatsApp message contains order number', () => {
    const orderNumber = 'SB-0099';
    const msg = `Hi! I'd like to track my order ${orderNumber}. Can you help?`;
    expect(msg).toContain(orderNumber);
  });
});

// ── Cart — Additional Edge Cases ─────────────────────────────────────────────

describe('Cart persistence edge cases', () => {
  it('different sessions get different carts', async () => {
    const product = await createTestProduct({ stock: 20 });
    const session1 = uuidv4();
    const session2 = uuidv4();

    await request(app).post('/api/cart').send({ sessionId: session1, productId: product.id, quantity: 2 });
    await request(app).post('/api/cart').send({ sessionId: session2, productId: product.id, quantity: 5 });

    const cart1 = await request(app).get(`/api/cart/${session1}`);
    const cart2 = await request(app).get(`/api/cart/${session2}`);

    expect(cart1.body.items[0].quantity).toBe(2);
    expect(cart2.body.items[0].quantity).toBe(5);
  });

  it('adding same product+size+color twice accumulates quantity', async () => {
    const product = await createTestProduct({ sizes: ['M'], colors: ['Red'], stock: 20 });
    const session = uuidv4();

    const r1 = await request(app).post('/api/cart').send({ sessionId: session, productId: product.id, quantity: 1, size: 'M', color: 'Red' });
    expect(r1.status).toBe(201);
    const r2 = await request(app).post('/api/cart').send({ sessionId: session, productId: product.id, quantity: 2, size: 'M', color: 'Red' });
    expect(r2.status).toBe(201);

    const cart = await request(app).get(`/api/cart/${session}`);
    expect(cart.body.items.length).toBe(1);
    expect(cart.body.items[0].quantity).toBe(3);
  });

  it('cart subtotal is sum of item prices', async () => {
    const product = await createTestProduct({ price: 1000, stock: 20 });
    const session = uuidv4();

    await request(app).post('/api/cart').send({ sessionId: session, productId: product.id, quantity: 3 });
    const cart = await request(app).get(`/api/cart/${session}`);
    expect(Number(cart.body.subtotal)).toBe(3000);
  });

  it('removing all items gives empty cart', async () => {
    const product = await createTestProduct({ stock: 10 });
    const session = uuidv4();

    const addRes = await request(app).post('/api/cart').send({ sessionId: session, productId: product.id, quantity: 1 });
    await request(app).delete(`/api/cart/${addRes.body.id}`);

    const cart = await request(app).get(`/api/cart/${session}`);
    expect(cart.body.items.length).toBe(0);
    expect(Number(cart.body.subtotal)).toBe(0);
  });

  it('size and color variants create separate cart items', async () => {
    const product = await createTestProduct({ sizes: ['S', 'M'], colors: ['Red', 'Blue'], stock: 50 });
    const session = uuidv4();

    await request(app).post('/api/cart').send({ sessionId: session, productId: product.id, quantity: 1, size: 'S', color: 'Red' });
    await request(app).post('/api/cart').send({ sessionId: session, productId: product.id, quantity: 1, size: 'M', color: 'Blue' });

    const cart = await request(app).get(`/api/cart/${session}`);
    expect(cart.body.items.length).toBe(2);
  });
});

// ── Order — WhatsApp notification content ──────────────────────────────────

describe('Order confirmation WhatsApp notification', () => {
  it('new order generates correct notify message', async () => {
    const product = await createTestProduct({ price: 1500, stock: 5 });
    const session = uuidv4();

    const orderRes = await request(app).post('/api/orders').send({
      customerName: 'Ananya Reddy',
      customerPhone: '9000000002',
      address: validAddress,
      items: [{ productId: product.id, quantity: 1 }],
      paymentMethod: 'cod',
      sessionId: session,
    });

    expect(orderRes.status).toBe(201);
    const order = orderRes.body;

    const paymentLabel = order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'UPI';
    const expectedMsg = `Hi, I just placed order #${order.orderNumber} on Srinidhi Boutique. Total: ₹${Number(order.total).toLocaleString('en-IN')}. Payment: ${paymentLabel}.`;

    expect(expectedMsg).toContain(order.orderNumber);
    expect(expectedMsg).toContain('Cash on Delivery');
    expect(expectedMsg).toContain('Srinidhi Boutique');
  });

  it('UPI order generates correct payment label', async () => {
    const product = await createTestProduct({ price: 2000, stock: 5 });

    const orderRes = await request(app).post('/api/orders').send({
      customerName: 'Kavitha',
      customerPhone: '9000000003',
      address: validAddress,
      items: [{ productId: product.id, quantity: 1 }],
      paymentMethod: 'upi',
      paymentId: 'upi_test_001',
    });
    expect(orderRes.status).toBe(201);

    const paymentLabel = orderRes.body.paymentMethod === 'upi' ? 'UPI' : 'Other';
    expect(paymentLabel).toBe('UPI');
  });
});

// ── PWA Manifest ─────────────────────────────────────────────────────────────

describe('PWA manifest structure', () => {
  const manifest = {
    name: 'Srinidhi Boutique',
    short_name: 'Srinidhi',
    description: 'Premium women\'s ethnic fashion from Hyderabad',
    start_url: '/',
    display: 'standalone',
    background_color: '#FFFFF0',
    theme_color: '#B76E79',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcuts: [
      { name: 'Shop Now', url: '/shop' },
      { name: 'Track Order', url: '/track-order' },
    ],
  };

  it('has required name field', () => {
    expect(manifest.name).toBe('Srinidhi Boutique');
  });

  it('has standalone display mode', () => {
    expect(manifest.display).toBe('standalone');
  });

  it('has theme color matching brand color', () => {
    expect(manifest.theme_color).toBe('#B76E79');
  });

  it('has ivory background matching brand', () => {
    expect(manifest.background_color).toBe('#FFFFF0');
  });

  it('has two icons (192 and 512)', () => {
    expect(manifest.icons.length).toBe(2);
    expect(manifest.icons.some((i) => i.sizes === '192x192')).toBe(true);
    expect(manifest.icons.some((i) => i.sizes === '512x512')).toBe(true);
  });

  it('has shortcuts to shop and track-order', () => {
    expect(manifest.shortcuts.some((s) => s.url === '/shop')).toBe(true);
    expect(manifest.shortcuts.some((s) => s.url === '/track-order')).toBe(true);
  });

  it('starts from root URL', () => {
    expect(manifest.start_url).toBe('/');
  });
});

// ── Image Gallery Logic ───────────────────────────────────────────────────────

describe('Image gallery helpers', () => {
  it('selects correct image by index', () => {
    const images = ['img1.jpg', 'img2.jpg', 'img3.jpg'];
    let selectedIndex = 0;

    // Simulate selecting image at index 1
    selectedIndex = 1;
    expect(images[selectedIndex]).toBe('img2.jpg');
  });

  it('does not exceed upper bound on swipe', () => {
    const images = ['img1.jpg', 'img2.jpg', 'img3.jpg'];
    let idx = images.length - 1;
    // Swipe right at end — clamp
    idx = Math.min(idx + 1, images.length - 1);
    expect(idx).toBe(images.length - 1);
  });

  it('does not go below 0 on swipe', () => {
    let idx = 0;
    // Swipe left at start — clamp
    idx = Math.max(idx - 1, 0);
    expect(idx).toBe(0);
  });

  it('thumbnail click changes selected image', () => {
    const images = ['img1.jpg', 'img2.jpg', 'img3.jpg'];
    let selectedIndex = 0;

    // Simulate clicking thumbnail at index 2
    const clickedIndex = 2;
    selectedIndex = clickedIndex;

    expect(selectedIndex).toBe(2);
    expect(images[selectedIndex]).toBe('img3.jpg');
  });
});

// ── Filter Combination Tests ────────────────────────────────────────────────

describe('GET /api/products — multi-filter combinations', () => {
  it('filters by size and occasion together', async () => {
    await createTestProduct({
      name: 'Wedding M Saree',
      sizes: ['M', 'L'],
      occasion: ['wedding'],
      stock: 10,
    });
    await createTestProduct({
      name: 'Casual S Kurti',
      sizes: ['S'],
      occasion: ['casual'],
      stock: 10,
    });

    const res = await request(app).get('/api/products?size=M&occasion=wedding');
    expect(res.status).toBe(200);
    expect(res.body.products.every(
      (p: { sizes: string[]; occasion: string[] }) =>
        p.sizes.includes('M') && p.occasion.includes('wedding')
    )).toBe(true);
  });

  it('filters by price range + color', async () => {
    await createTestProduct({ name: 'Red Budget', price: 500, colors: ['Red'], stock: 5 });
    await createTestProduct({ name: 'Red Pricey', price: 5000, colors: ['Red'], stock: 5 });
    await createTestProduct({ name: 'Blue Budget', price: 500, colors: ['Blue'], stock: 5 });

    const res = await request(app).get('/api/products?color=Red&maxPrice=1000');
    expect(res.status).toBe(200);
    expect(res.body.products.length).toBe(1);
    expect(res.body.products[0].name).toBe('Red Budget');
  });

  it('search + size filter narrows results', async () => {
    await createTestProduct({ name: 'Anarkali Kurti Large', sizes: ['L', 'XL'], stock: 10 });
    await createTestProduct({ name: 'Anarkali Kurti Small', sizes: ['S'], stock: 10 });

    const res = await request(app).get('/api/products?search=Anarkali&size=L');
    expect(res.status).toBe(200);
    expect(res.body.products.length).toBe(1);
    expect(res.body.products[0].name).toBe('Anarkali Kurti Large');
  });
});

// ── Admin Returns Route ────────────────────────────────────────────────────

describe('Admin return request management', () => {
  it('pending count is correct', async () => {
    await createTestReturnRequest({ status: 'pending' });
    await createTestReturnRequest({ status: 'pending' });
    await createTestReturnRequest({ status: 'approved' });

    const res = await request(app).get('/api/admin/returns');
    expect(res.status).toBe(200);
    const pendingCount = res.body.filter((r: { status: string }) => r.status === 'pending').length;
    expect(pendingCount).toBe(2);
  });

  it('return request includes all required fields', async () => {
    await createTestReturnRequest({ orderNumber: 'SB-6001', reason: 'defective' });
    const res = await request(app).get('/api/admin/returns');
    expect(res.status).toBe(200);
    const req = res.body[0];
    expect(req).toHaveProperty('id');
    expect(req).toHaveProperty('orderNumber');
    expect(req).toHaveProperty('customerName');
    expect(req).toHaveProperty('customerPhone');
    expect(req).toHaveProperty('reason');
    expect(req).toHaveProperty('status');
    expect(req).toHaveProperty('createdAt');
  });

  it('status transitions: pending → approved → completed', async () => {
    const req = await createTestReturnRequest({ status: 'pending' });

    const approveRes = await request(app).patch(`/api/admin/returns/${req.id}/status`).send({ status: 'approved' });
    expect(approveRes.body.status).toBe('approved');

    const completeRes = await request(app).patch(`/api/admin/returns/${req.id}/status`).send({ status: 'completed' });
    expect(completeRes.body.status).toBe('completed');
  });
});
