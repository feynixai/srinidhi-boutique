/**
 * Miscellaneous tests — health, edge cases, admin stock, order export
 */
import request from 'supertest';
import { app } from '../index';
import {
  createTestProduct,
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

const addr = { line1: '1 Street', city: 'Hyderabad', state: 'Telangana', pincode: '500001' };

// ── Health ────────────────────────────────────────────────────────────────────
describe('Server health', () => {
  it('GET /health returns status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.timestamp).toBeDefined();
  });
});

// ── Admin stock update ────────────────────────────────────────────────────────
describe('PATCH /api/admin/products/:id/stock', () => {
  it('updates product stock', async () => {
    const product = await createTestProduct({ stock: 10 });
    const res = await request(app)
      .patch(`/api/admin/products/${product.id}/stock`)
      .send({ stock: 50 });
    expect(res.status).toBe(200);
    expect(res.body.stock).toBe(50);
  });

  it('sets stock to zero', async () => {
    const product = await createTestProduct({ stock: 10 });
    const res = await request(app)
      .patch(`/api/admin/products/${product.id}/stock`)
      .send({ stock: 0 });
    expect(res.status).toBe(200);
    expect(res.body.stock).toBe(0);
  });

  it('rejects negative stock', async () => {
    const product = await createTestProduct({ stock: 10 });
    const res = await request(app)
      .patch(`/api/admin/products/${product.id}/stock`)
      .send({ stock: -1 });
    expect(res.status).toBe(400);
  });
});

// ── Order export CSV ──────────────────────────────────────────────────────────
describe('GET /api/admin/orders/export', () => {
  it('returns CSV file', async () => {
    const res = await request(app).get('/api/admin/orders/export');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
  });

  it('includes CSV headers', async () => {
    const res = await request(app).get('/api/admin/orders/export');
    expect(res.text).toContain('Order Number');
    expect(res.text).toContain('Customer');
  });

  it('includes order data in CSV', async () => {
    const product = await createTestProduct({ stock: 10 });
    await request(app).post('/api/orders').send({
      customerName: 'CSV Export Test',
      customerPhone: '9000007777',
      address: addr,
      items: [{ productId: product.id, quantity: 1 }],
      paymentMethod: 'upi',
    });

    const res = await request(app).get('/api/admin/orders/export');
    expect(res.text).toContain('CSV Export Test');
  });
});

// ── Product search pagination ─────────────────────────────────────────────────
describe('Product pagination', () => {
  it('returns correct totalPages', async () => {
    for (let i = 0; i < 5; i++) {
      await createTestProduct({ name: `Paginate Product ${i}` });
    }
    const res = await request(app).get('/api/products?limit=2');
    expect(res.status).toBe(200);
    expect(res.body.totalPages).toBeGreaterThanOrEqual(3);
  });

  it('returns empty products for out-of-range page', async () => {
    await createTestProduct({ name: 'Single Product' });
    const res = await request(app).get('/api/products?page=999&limit=10');
    expect(res.status).toBe(200);
    expect(res.body.products).toEqual([]);
  });
});
