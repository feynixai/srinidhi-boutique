import request from 'supertest';
import { app } from '../index';
import { createTestProduct, cleanupTest, testPrisma } from './helpers';
import { v4 as uuidv4 } from 'uuid';

beforeEach(async () => {
  await cleanupTest();
});

afterAll(async () => {
  await cleanupTest();
  await testPrisma.$disconnect();
});

describe('POST /api/cart — Add to cart', () => {
  it('adds item to cart', async () => {
    const product = await createTestProduct();
    const sessionId = uuidv4();

    const res = await request(app).post('/api/cart').send({
      sessionId,
      productId: product.id,
      quantity: 2,
      size: 'M',
      color: 'Red',
    });

    expect(res.status).toBe(201);
    expect(res.body.quantity).toBe(2);
    expect(res.body.productId).toBe(product.id);
  });

  it('increments quantity if same item added again', async () => {
    const product = await createTestProduct();
    const sessionId = uuidv4();

    await request(app).post('/api/cart').send({
      sessionId,
      productId: product.id,
      quantity: 1,
      size: 'M',
      color: 'Red',
    });

    const res = await request(app).post('/api/cart').send({
      sessionId,
      productId: product.id,
      quantity: 2,
      size: 'M',
      color: 'Red',
    });

    expect(res.status).toBe(201);
    expect(res.body.quantity).toBe(3);
  });

  it('returns 404 for nonexistent product', async () => {
    const res = await request(app).post('/api/cart').send({
      sessionId: uuidv4(),
      productId: 'nonexistent-id',
      quantity: 1,
    });
    expect(res.status).toBe(404);
  });

  it('returns 400 when stock insufficient', async () => {
    const product = await createTestProduct({ stock: 2 });

    const res = await request(app).post('/api/cart').send({
      sessionId: uuidv4(),
      productId: product.id,
      quantity: 5,
    });

    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid data', async () => {
    const res = await request(app).post('/api/cart').send({
      sessionId: '',
      productId: '',
    });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/cart/:sessionId', () => {
  it('returns cart items for session', async () => {
    const product = await createTestProduct({ price: 500 });
    const sessionId = uuidv4();

    await request(app).post('/api/cart').send({
      sessionId,
      productId: product.id,
      quantity: 2,
    });

    const res = await request(app).get(`/api/cart/${sessionId}`);
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.subtotal).toBe(1000);
  });

  it('returns empty cart for unknown session', async () => {
    const res = await request(app).get(`/api/cart/${uuidv4()}`);
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(0);
    expect(res.body.subtotal).toBe(0);
  });
});

describe('PUT /api/cart/:id', () => {
  it('updates cart item quantity', async () => {
    const product = await createTestProduct();
    const sessionId = uuidv4();

    const addRes = await request(app).post('/api/cart').send({
      sessionId,
      productId: product.id,
      quantity: 1,
    });

    const res = await request(app)
      .put(`/api/cart/${addRes.body.id}`)
      .send({ quantity: 3 });

    expect(res.status).toBe(200);
    expect(res.body.quantity).toBe(3);
  });

  it('returns 404 for nonexistent cart item', async () => {
    const res = await request(app).put('/api/cart/nonexistent-id').send({ quantity: 2 });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/cart/:id', () => {
  it('removes cart item', async () => {
    const product = await createTestProduct();
    const sessionId = uuidv4();

    const addRes = await request(app).post('/api/cart').send({
      sessionId,
      productId: product.id,
      quantity: 1,
    });

    const deleteRes = await request(app).delete(`/api/cart/${addRes.body.id}`);
    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.success).toBe(true);

    const cartRes = await request(app).get(`/api/cart/${sessionId}`);
    expect(cartRes.body.items).toHaveLength(0);
  });
});
