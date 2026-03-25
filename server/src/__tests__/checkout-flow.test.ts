/**
 * Checkout flow tests — UPI, coupon savings, free shipping, COD, stock management
 */
import request from 'supertest';
import { app } from '../index';
import {
  createTestProduct,
  createTestCoupon,
  cleanupTest,
  testPrisma,
} from './helpers';

beforeEach(async () => {
  await cleanupTest();
});

afterAll(async () => {
  await cleanupTest();
  await testPrisma.$disconnect();
});

const addr = {
  line1: '42 MG Road',
  city: 'Hyderabad',
  state: 'Telangana',
  pincode: '500001',
};

// ── Free Shipping ─────────────────────────────────────────────────────────────
describe('Free shipping threshold', () => {
  it('charges shipping for orders below ₹999', async () => {
    const product = await createTestProduct({ price: 500, stock: 10 });
    const res = await request(app).post('/api/orders').send({
      customerName: 'Test User',
      customerPhone: '9000001111',
      address: addr,
      items: [{ productId: product.id, quantity: 1 }],
      paymentMethod: 'cod',
    });
    expect(res.status).toBe(201);
    expect(Number(res.body.shipping)).toBe(99);
  });

  it('gives free shipping for orders ≥ ₹999', async () => {
    const product = await createTestProduct({ price: 999, stock: 10 });
    const res = await request(app).post('/api/orders').send({
      customerName: 'Test User',
      customerPhone: '9000001112',
      address: addr,
      items: [{ productId: product.id, quantity: 1 }],
      paymentMethod: 'upi',
    });
    expect(res.status).toBe(201);
    expect(Number(res.body.shipping)).toBe(0);
  });

  it('calculates free shipping based on subtotal across multiple items', async () => {
    const product = await createTestProduct({ price: 400, stock: 10 });
    const res = await request(app).post('/api/orders').send({
      customerName: 'Multi Item',
      customerPhone: '9000001113',
      address: addr,
      items: [{ productId: product.id, quantity: 3 }],
      paymentMethod: 'upi',
    });
    expect(res.status).toBe(201);
    expect(Number(res.body.subtotal)).toBe(1200);
    expect(Number(res.body.shipping)).toBe(0);
  });
});

// ── Coupon savings display ─────────────────────────────────────────────────────
describe('Order totals with coupon', () => {
  it('correctly computes total with coupon discount', async () => {
    const product = await createTestProduct({ price: 1000, stock: 10 });
    await createTestCoupon({ code: 'SAVE10', discount: 10, active: true });

    const res = await request(app).post('/api/orders').send({
      customerName: 'Coupon User',
      customerPhone: '9000002222',
      address: addr,
      items: [{ productId: product.id, quantity: 1 }],
      paymentMethod: 'upi',
      couponCode: 'SAVE10',
    });
    expect(res.status).toBe(201);
    expect(Number(res.body.discount)).toBe(100);
    expect(Number(res.body.total)).toBe(900);
  });

  it('applies discount to subtotal only (not shipping)', async () => {
    const product = await createTestProduct({ price: 500, stock: 10 });
    await createTestCoupon({ code: 'FLAT20', discount: 20, active: true });

    const res = await request(app).post('/api/orders').send({
      customerName: 'Discount Test',
      customerPhone: '9000002223',
      address: addr,
      items: [{ productId: product.id, quantity: 1 }],
      paymentMethod: 'upi',
      couponCode: 'FLAT20',
    });
    expect(res.status).toBe(201);
    expect(Number(res.body.subtotal)).toBe(500);
    expect(Number(res.body.discount)).toBe(100);
  });

  it('ignores invalid coupon code gracefully', async () => {
    const product = await createTestProduct({ price: 1000, stock: 10 });
    const res = await request(app).post('/api/orders').send({
      customerName: 'Bad Coupon',
      customerPhone: '9000002224',
      address: addr,
      items: [{ productId: product.id, quantity: 1 }],
      paymentMethod: 'cod',
      couponCode: 'FAKECODE',
    });
    expect(res.status).toBe(201);
    expect(Number(res.body.discount)).toBe(0);
  });
});

// ── Stock Management ──────────────────────────────────────────────────────────
describe('Stock management after order', () => {
  it('decrements stock after order is placed', async () => {
    const product = await createTestProduct({ price: 500, stock: 10 });
    await request(app).post('/api/orders').send({
      customerName: 'Stock Test',
      customerPhone: '9000003333',
      address: addr,
      items: [{ productId: product.id, quantity: 3 }],
      paymentMethod: 'cod',
    });

    const updated = await testPrisma.product.findUnique({ where: { id: product.id } });
    expect(updated?.stock).toBe(7);
  });

  it('rejects order when stock is insufficient', async () => {
    const product = await createTestProduct({ price: 500, stock: 2 });
    const res = await request(app).post('/api/orders').send({
      customerName: 'Out of Stock',
      customerPhone: '9000003334',
      address: addr,
      items: [{ productId: product.id, quantity: 5 }],
      paymentMethod: 'cod',
    });
    expect(res.status).toBe(400);
  });

  it('rejects order for inactive product', async () => {
    const product = await createTestProduct({ price: 500, stock: 10, active: false });
    const res = await request(app).post('/api/orders').send({
      customerName: 'Inactive Product',
      customerPhone: '9000003335',
      address: addr,
      items: [{ productId: product.id, quantity: 1 }],
      paymentMethod: 'cod',
    });
    expect(res.status).toBe(404);
  });

  it('handles zero stock exactly', async () => {
    const product = await createTestProduct({ price: 500, stock: 0 });
    const res = await request(app).post('/api/orders').send({
      customerName: 'Zero Stock',
      customerPhone: '9000003336',
      address: addr,
      items: [{ productId: product.id, quantity: 1 }],
      paymentMethod: 'cod',
    });
    expect(res.status).toBe(400);
  });
});

// ── Order validation ──────────────────────────────────────────────────────────
describe('Order validation edge cases', () => {
  it('rejects order without items', async () => {
    const res = await request(app).post('/api/orders').send({
      customerName: 'Empty Cart',
      customerPhone: '9000004444',
      address: addr,
      items: [],
      paymentMethod: 'cod',
    });
    expect(res.status).toBe(400);
  });

  it('rejects order with invalid phone', async () => {
    const product = await createTestProduct({ stock: 10 });
    const res = await request(app).post('/api/orders').send({
      customerName: 'Bad Phone',
      customerPhone: '123',
      address: addr,
      items: [{ productId: product.id, quantity: 1 }],
      paymentMethod: 'cod',
    });
    expect(res.status).toBe(400);
  });

  it('rejects order with missing address fields', async () => {
    const product = await createTestProduct({ stock: 10 });
    const res = await request(app).post('/api/orders').send({
      customerName: 'No Address',
      customerPhone: '9000004446',
      address: { line1: '123' },
      items: [{ productId: product.id, quantity: 1 }],
      paymentMethod: 'cod',
    });
    expect(res.status).toBe(400);
  });

  it('rejects order with invalid pincode', async () => {
    const product = await createTestProduct({ stock: 10 });
    const res = await request(app).post('/api/orders').send({
      customerName: 'Bad Pincode',
      customerPhone: '9000004447',
      address: { ...addr, pincode: '12' },
      items: [{ productId: product.id, quantity: 1 }],
      paymentMethod: 'cod',
    });
    expect(res.status).toBe(400);
  });

  it('accepts optional customer email', async () => {
    const product = await createTestProduct({ stock: 10 });
    const res = await request(app).post('/api/orders').send({
      customerName: 'Email User',
      customerPhone: '9000004448',
      customerEmail: 'test@example.com',
      address: addr,
      items: [{ productId: product.id, quantity: 1 }],
      paymentMethod: 'upi',
    });
    expect(res.status).toBe(201);
    expect(res.body.customerEmail).toBe('test@example.com');
  });
});

// ── Cart-to-order session ─────────────────────────────────────────────────────
describe('Cart session clearing on order', () => {
  it('clears cart items for session after order is placed', async () => {
    const product = await createTestProduct({ stock: 10 });
    const sessionId = `test-session-${Date.now()}`;

    await testPrisma.cartItem.create({
      data: { sessionId, productId: product.id, quantity: 1 },
    });

    await request(app).post('/api/orders').send({
      customerName: 'Session Clear',
      customerPhone: '9000005555',
      address: addr,
      items: [{ productId: product.id, quantity: 1 }],
      paymentMethod: 'cod',
      sessionId,
    });

    const cartItems = await testPrisma.cartItem.findMany({ where: { sessionId } });
    expect(cartItems).toHaveLength(0);
  });
});

// ── Order number format ───────────────────────────────────────────────────────
describe('Order number format', () => {
  it('generates SB-XXXX format order number', async () => {
    const product = await createTestProduct({ stock: 10 });
    const res = await request(app).post('/api/orders').send({
      customerName: 'Order Number Test',
      customerPhone: '9000006666',
      address: addr,
      items: [{ productId: product.id, quantity: 1 }],
      paymentMethod: 'upi',
    });
    expect(res.status).toBe(201);
    expect(res.body.orderNumber).toMatch(/^SB-\d{4}$/);
  });
});

// ── Coupon validation endpoint ────────────────────────────────────────────────
describe('POST /api/coupons/validate', () => {
  it('validates a working coupon', async () => {
    await createTestCoupon({ code: 'VALID25', discount: 25 });
    const res = await request(app).post('/api/coupons/validate').send({
      code: 'VALID25',
      orderAmount: 1000,
    });
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
    expect(res.body.discount).toBe(25);
  });

  it('returns invalid for unknown coupon', async () => {
    const res = await request(app).post('/api/coupons/validate').send({
      code: 'UNKNOWN',
      orderAmount: 1000,
    });
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(false);
  });

  it('returns invalid for coupon below min order', async () => {
    await createTestCoupon({ code: 'MINREQ', discount: 15, minOrder: 2000 });
    const res = await request(app).post('/api/coupons/validate').send({
      code: 'MINREQ',
      orderAmount: 500,
    });
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(false);
  });
});
