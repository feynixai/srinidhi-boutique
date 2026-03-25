import request from 'supertest';
import { app } from '../index';
import { createTestProduct, createTestCategory, cleanupTest, testPrisma } from './helpers';

beforeEach(async () => {
  await cleanupTest();
});

afterAll(async () => {
  await cleanupTest();
});

const validAddress = {
  line1: '123 MG Road',
  city: 'Hyderabad',
  state: 'Telangana',
  pincode: '500001',
};

describe('Admin Products', () => {
  describe('GET /api/admin/products', () => {
    it('returns all products including inactive', async () => {
      await createTestProduct({ name: 'Active', active: true });
      await createTestProduct({ name: 'Inactive', active: false });

      const res = await request(app).get('/api/admin/products');
      expect(res.status).toBe(200);
      expect(res.body.total).toBe(2);
    });

    it('searches by name', async () => {
      await createTestProduct({ name: 'Kanjivaram Silk' });
      await createTestProduct({ name: 'Cotton Kurti' });

      const res = await request(app).get('/api/admin/products?search=kanjivaram');
      expect(res.status).toBe(200);
      expect(res.body.products).toHaveLength(1);
    });
  });

  describe('POST /api/admin/products', () => {
    it('creates a new product', async () => {
      const category = await createTestCategory();

      const res = await request(app)
        .post('/api/admin/products')
        .send({
          name: 'New Saree',
          price: 5000,
          images: ['https://example.com/saree.jpg'],
          sizes: ['Free Size'],
          colors: ['Red'],
          occasion: ['wedding'],
          stock: 20,
          categoryId: category.id,
        });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe('New Saree');
      expect(res.body.slug).toBe('new-saree');
      expect(Number(res.body.price)).toBe(5000);
    });

    it('auto-generates unique slug', async () => {
      const category = await createTestCategory();
      const data = {
        name: 'Duplicate Name',
        price: 1000,
        images: [],
        sizes: [],
        colors: [],
        occasion: [],
        stock: 10,
        categoryId: category.id,
      };

      await request(app).post('/api/admin/products').send(data);
      const res = await request(app).post('/api/admin/products').send(data);

      expect(res.status).toBe(201);
      expect(res.body.slug).not.toBe('duplicate-name');
    });

    it('validates required fields', async () => {
      const res = await request(app).post('/api/admin/products').send({});
      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/admin/products/:id', () => {
    it('updates product', async () => {
      const product = await createTestProduct({ name: 'Old Name', price: 1000 });

      const res = await request(app)
        .put(`/api/admin/products/${product.id}`)
        .send({ name: 'New Name', price: 1500 });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('New Name');
      expect(Number(res.body.price)).toBe(1500);
    });

    it('returns 404 for nonexistent product', async () => {
      const res = await request(app)
        .put('/api/admin/products/nonexistent')
        .send({ name: 'Test' });
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/admin/products/:id', () => {
    it('soft-deletes product (sets active=false)', async () => {
      const product = await createTestProduct({ active: true });

      const res = await request(app).delete(`/api/admin/products/${product.id}`);
      expect(res.status).toBe(200);

      const updated = await testPrisma.product.findUnique({ where: { id: product.id } });
      expect(updated?.active).toBe(false);
    });
  });
});

describe('Admin Orders', () => {
  describe('GET /api/admin/orders', () => {
    it('returns all orders', async () => {
      const product = await createTestProduct({ price: 1000, stock: 20 });

      await request(app).post('/api/orders').send({
        customerName: 'Customer 1',
        customerPhone: '9876543210',
        address: validAddress,
        items: [{ productId: product.id, quantity: 1 }],
        paymentMethod: 'cod',
      });

      const res = await request(app).get('/api/admin/orders');
      expect(res.status).toBe(200);
      expect(res.body.total).toBeGreaterThanOrEqual(1);
    });

    it('filters orders by status', async () => {
      const product = await createTestProduct({ price: 1000, stock: 20 });

      const orderRes = await request(app).post('/api/orders').send({
        customerName: 'Customer',
        customerPhone: '9876543210',
        address: validAddress,
        items: [{ productId: product.id, quantity: 1 }],
        paymentMethod: 'cod',
      });

      await request(app)
        .put(`/api/admin/orders/${orderRes.body.id}/status`)
        .send({ status: 'confirmed' });

      const confirmedRes = await request(app).get('/api/admin/orders?status=confirmed');
      expect(confirmedRes.status).toBe(200);
      expect(confirmedRes.body.orders[0].status).toBe('confirmed');

      const placedRes = await request(app).get('/api/admin/orders?status=placed');
      expect(placedRes.status).toBe(200);
      expect(placedRes.body.total).toBe(0);
    });
  });

  describe('PUT /api/admin/orders/:id/status', () => {
    it('updates order status with tracking', async () => {
      const product = await createTestProduct({ price: 1000, stock: 10 });

      const orderRes = await request(app).post('/api/orders').send({
        customerName: 'Test',
        customerPhone: '9876543210',
        address: validAddress,
        items: [{ productId: product.id, quantity: 1 }],
        paymentMethod: 'cod',
      });

      const res = await request(app)
        .put(`/api/admin/orders/${orderRes.body.id}/status`)
        .send({ status: 'shipped', trackingId: 'DELHIVERY123456' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('shipped');
      expect(res.body.trackingId).toBe('DELHIVERY123456');
    });
  });
});

describe('Admin Dashboard', () => {
  it('returns dashboard stats', async () => {
    const res = await request(app).get('/api/admin/dashboard');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('todayOrders');
    expect(res.body).toHaveProperty('todayRevenue');
    expect(res.body).toHaveProperty('totalOrders');
    expect(res.body).toHaveProperty('pendingOrders');
    expect(res.body).toHaveProperty('recentOrders');
    expect(res.body).toHaveProperty('totalProducts');
  });
});

describe('Admin Coupons', () => {
  it('creates a coupon', async () => {
    const res = await request(app).post('/api/admin/coupons').send({
      code: 'NEWCOUPON',
      discount: 15,
      minOrder: 1000,
      active: true,
    });

    expect(res.status).toBe(201);
    expect(res.body.code).toBe('NEWCOUPON');
    expect(res.body.discount).toBe(15);
  });

  it('prevents duplicate coupon codes', async () => {
    await request(app).post('/api/admin/coupons').send({ code: 'DUPE', discount: 10 });
    const res = await request(app).post('/api/admin/coupons').send({ code: 'DUPE', discount: 20 });
    expect(res.status).toBe(400);
  });
});
