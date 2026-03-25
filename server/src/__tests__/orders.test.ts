import request from 'supertest';
import { app } from '../index';
import { createTestProduct, createTestCoupon, cleanupTest, testPrisma } from './helpers';
import { v4 as uuidv4 } from 'uuid';

beforeEach(async () => {
  await cleanupTest();
});

afterAll(async () => {
  await cleanupTest();
  await testPrisma.$disconnect();
});

const validAddress = {
  line1: '123 MG Road',
  city: 'Hyderabad',
  state: 'Telangana',
  pincode: '500001',
};

describe('POST /api/orders — Place order', () => {
  it('places order with COD successfully', async () => {
    const product = await createTestProduct({ price: 1200, stock: 10 });

    const res = await request(app).post('/api/orders').send({
      customerName: 'Srinidhi Devi',
      customerPhone: '9876543210',
      customerEmail: 'test@example.com',
      address: validAddress,
      items: [{ productId: product.id, quantity: 2, size: 'M', color: 'Red' }],
      paymentMethod: 'cod',
    });

    expect(res.status).toBe(201);
    expect(res.body.orderNumber).toMatch(/^SB-\d{4}$/);
    expect(res.body.customerName).toBe('Srinidhi Devi');
    expect(res.body.paymentMethod).toBe('cod');
    expect(res.body.paymentStatus).toBe('pending');
    expect(Number(res.body.subtotal)).toBe(2400);
  });

  it('calculates free shipping for orders above ₹999', async () => {
    const product = await createTestProduct({ price: 1500, stock: 10 });

    const res = await request(app).post('/api/orders').send({
      customerName: 'Test Customer',
      customerPhone: '9876543210',
      address: validAddress,
      items: [{ productId: product.id, quantity: 1 }],
      paymentMethod: 'cod',
    });

    expect(res.status).toBe(201);
    expect(Number(res.body.shipping)).toBe(0);
  });

  it('charges shipping for orders below ₹999', async () => {
    const product = await createTestProduct({ price: 500, stock: 10 });

    const res = await request(app).post('/api/orders').send({
      customerName: 'Test Customer',
      customerPhone: '9876543210',
      address: validAddress,
      items: [{ productId: product.id, quantity: 1 }],
      paymentMethod: 'cod',
    });

    expect(res.status).toBe(201);
    expect(Number(res.body.shipping)).toBe(99);
  });

  it('applies valid coupon discount', async () => {
    const product = await createTestProduct({ price: 2000, stock: 10 });
    await createTestCoupon({ code: 'SAVE10', discount: 10, minOrder: 500 });

    const res = await request(app).post('/api/orders').send({
      customerName: 'Test Customer',
      customerPhone: '9876543210',
      address: validAddress,
      items: [{ productId: product.id, quantity: 1 }],
      paymentMethod: 'cod',
      couponCode: 'SAVE10',
    });

    expect(res.status).toBe(201);
    expect(Number(res.body.discount)).toBe(200);
    expect(res.body.couponCode).toBe('SAVE10');
  });

  it('decrements product stock after order', async () => {
    const product = await createTestProduct({ price: 1000, stock: 10 });

    await request(app).post('/api/orders').send({
      customerName: 'Test Customer',
      customerPhone: '9876543210',
      address: validAddress,
      items: [{ productId: product.id, quantity: 3 }],
      paymentMethod: 'cod',
    });

    const updatedProduct = await testPrisma.product.findUnique({ where: { id: product.id } });
    expect(updatedProduct?.stock).toBe(7);
  });

  it('clears cart after order', async () => {
    const product = await createTestProduct({ price: 1000, stock: 10 });
    const sessionId = uuidv4();

    await request(app).post('/api/cart').send({
      sessionId,
      productId: product.id,
      quantity: 1,
    });

    await request(app).post('/api/orders').send({
      customerName: 'Test Customer',
      customerPhone: '9876543210',
      address: validAddress,
      items: [{ productId: product.id, quantity: 1 }],
      paymentMethod: 'cod',
      sessionId,
    });

    const cart = await request(app).get(`/api/cart/${sessionId}`);
    expect(cart.body.items).toHaveLength(0);
  });

  it('returns 404 for nonexistent product', async () => {
    const res = await request(app).post('/api/orders').send({
      customerName: 'Test',
      customerPhone: '9876543210',
      address: validAddress,
      items: [{ productId: 'nonexistent', quantity: 1 }],
      paymentMethod: 'cod',
    });
    expect(res.status).toBe(404);
  });

  it('returns 400 when stock insufficient', async () => {
    const product = await createTestProduct({ price: 500, stock: 2 });

    const res = await request(app).post('/api/orders').send({
      customerName: 'Test',
      customerPhone: '9876543210',
      address: validAddress,
      items: [{ productId: product.id, quantity: 10 }],
      paymentMethod: 'cod',
    });
    expect(res.status).toBe(400);
  });

  it('marks payment as paid for non-COD orders', async () => {
    const product = await createTestProduct({ price: 1200, stock: 10 });

    const res = await request(app).post('/api/orders').send({
      customerName: 'Test Customer',
      customerPhone: '9876543210',
      address: validAddress,
      items: [{ productId: product.id, quantity: 1 }],
      paymentMethod: 'razorpay',
      paymentId: 'pay_test123',
    });

    expect(res.status).toBe(201);
    expect(res.body.paymentStatus).toBe('paid');
  });
});

describe('GET /api/orders/:id', () => {
  it('returns order by id', async () => {
    const product = await createTestProduct({ price: 1000, stock: 10 });

    const orderRes = await request(app).post('/api/orders').send({
      customerName: 'Priya Sharma',
      customerPhone: '9876543210',
      address: validAddress,
      items: [{ productId: product.id, quantity: 1 }],
      paymentMethod: 'cod',
    });

    const res = await request(app).get(`/api/orders/${orderRes.body.id}`);
    expect(res.status).toBe(200);
    expect(res.body.customerName).toBe('Priya Sharma');
    expect(res.body.items).toHaveLength(1);
  });

  it('returns 404 for nonexistent order', async () => {
    const res = await request(app).get('/api/orders/nonexistent-id');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/orders/:id/status', () => {
  it('updates order status', async () => {
    const product = await createTestProduct({ price: 1000, stock: 10 });

    const orderRes = await request(app).post('/api/orders').send({
      customerName: 'Test Customer',
      customerPhone: '9876543210',
      address: validAddress,
      items: [{ productId: product.id, quantity: 1 }],
      paymentMethod: 'cod',
    });

    const res = await request(app)
      .post(`/api/orders/${orderRes.body.id}/status`)
      .send({ status: 'confirmed' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('confirmed');
  });

  it('rejects invalid status', async () => {
    const product = await createTestProduct({ price: 1000, stock: 10 });

    const orderRes = await request(app).post('/api/orders').send({
      customerName: 'Test Customer',
      customerPhone: '9876543210',
      address: validAddress,
      items: [{ productId: product.id, quantity: 1 }],
      paymentMethod: 'cod',
    });

    const res = await request(app)
      .post(`/api/orders/${orderRes.body.id}/status`)
      .send({ status: 'invalid-status' });

    expect(res.status).toBe(400);
  });
});
