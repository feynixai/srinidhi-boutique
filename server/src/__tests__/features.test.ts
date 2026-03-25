/**
 * Feature tests — sort, price filters, checkout validation, product admin, orders
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
  line1: '10 Jubilee Hills',
  city: 'Hyderabad',
  state: 'Telangana',
  pincode: '500033',
};

// ── Sort ──────────────────────────────────────────────────────────────────────
describe('Product sort', () => {
  it('sorts by price ascending', async () => {
    await createTestProduct({ name: 'Cheap Product', price: 500 });
    await createTestProduct({ name: 'Expensive Product', price: 5000 });

    const res = await request(app).get('/api/products?sort=price_asc');
    expect(res.status).toBe(200);
    const prices = res.body.products.map((p: { price: string }) => Number(p.price));
    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
    }
  });

  it('sorts by price descending', async () => {
    await createTestProduct({ name: 'Budget Kurti', price: 299 });
    await createTestProduct({ name: 'Premium Lehenga', price: 8999 });

    const res = await request(app).get('/api/products?sort=price_desc');
    expect(res.status).toBe(200);
    const prices = res.body.products.map((p: { price: string }) => Number(p.price));
    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]).toBeLessThanOrEqual(prices[i - 1]);
    }
  });

  it('defaults to newest sort', async () => {
    await createTestProduct({ name: 'First Product' });
    await createTestProduct({ name: 'Second Product' });

    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(res.body.products.length).toBeGreaterThanOrEqual(2);
  });
});

// ── Price range filter ─────────────────────────────────────────────────────────
describe('Price range filter', () => {
  it('filters by minPrice', async () => {
    await createTestProduct({ name: 'Affordable', price: 299 });
    await createTestProduct({ name: 'Mid Range', price: 1500 });
    await createTestProduct({ name: 'Premium', price: 4999 });

    const res = await request(app).get('/api/products?minPrice=1000');
    expect(res.status).toBe(200);
    expect(res.body.products.every((p: { price: string }) => Number(p.price) >= 1000)).toBe(true);
  });

  it('filters by maxPrice', async () => {
    await createTestProduct({ name: 'Low Price', price: 500 });
    await createTestProduct({ name: 'High Price', price: 9999 });

    const res = await request(app).get('/api/products?maxPrice=1000');
    expect(res.status).toBe(200);
    expect(res.body.products.every((p: { price: string }) => Number(p.price) <= 1000)).toBe(true);
  });

  it('filters by min and max price combined', async () => {
    await createTestProduct({ name: 'Too Cheap', price: 100 });
    await createTestProduct({ name: 'Just Right', price: 750 });
    await createTestProduct({ name: 'Too Expensive', price: 5000 });

    const res = await request(app).get('/api/products?minPrice=500&maxPrice=1000');
    expect(res.status).toBe(200);
    const prices = res.body.products.map((p: { price: string }) => Number(p.price));
    expect(prices.every((p: number) => p >= 500 && p <= 1000)).toBe(true);
  });
});

// ── Checkout validation ───────────────────────────────────────────────────────
describe('Checkout validation', () => {
  it('rejects empty items array', async () => {
    const res = await request(app).post('/api/orders').send({
      customerName: 'Test',
      customerPhone: '9876543210',
      address: validAddress,
      items: [],
      paymentMethod: 'cod',
    });
    expect(res.status).toBe(400);
  });

  it('rejects invalid payment method', async () => {
    const product = await createTestProduct({ stock: 10 });
    const res = await request(app).post('/api/orders').send({
      customerName: 'Test',
      customerPhone: '9876543210',
      address: validAddress,
      items: [{ productId: product.id, quantity: 1 }],
      paymentMethod: 'bitcoin',
    });
    expect(res.status).toBe(400);
  });

  it('rejects missing customer name', async () => {
    const product = await createTestProduct({ stock: 10 });
    const res = await request(app).post('/api/orders').send({
      customerPhone: '9876543210',
      address: validAddress,
      items: [{ productId: product.id, quantity: 1 }],
      paymentMethod: 'cod',
    });
    expect(res.status).toBe(400);
  });

  it('rejects nonexistent product', async () => {
    const res = await request(app).post('/api/orders').send({
      customerName: 'Test',
      customerPhone: '9876543210',
      address: validAddress,
      items: [{ productId: 'nonexistent-id', quantity: 1 }],
      paymentMethod: 'cod',
    });
    expect(res.status).toBe(404);
  });

  it('rejects order exceeding stock', async () => {
    const product = await createTestProduct({ price: 999, stock: 2 });
    const res = await request(app).post('/api/orders').send({
      customerName: 'Test',
      customerPhone: '9876543210',
      address: validAddress,
      items: [{ productId: product.id, quantity: 99 }],
      paymentMethod: 'cod',
    });
    expect(res.status).toBe(400);
  });

  it('applies valid coupon and calculates discount', async () => {
    const product = await createTestProduct({ price: 1000, stock: 10 });
    await createTestCoupon({ code: 'SAVE10', discount: 10 });

    const res = await request(app).post('/api/orders').send({
      customerName: 'Test',
      customerPhone: '9876543210',
      address: validAddress,
      items: [{ productId: product.id, quantity: 1 }],
      paymentMethod: 'cod',
      couponCode: 'SAVE10',
    });

    expect(res.status).toBe(201);
    expect(Number(res.body.discount)).toBe(100); // 10% of 1000
    expect(res.body.couponCode).toBe('SAVE10');
  });

  it('accepts razorpay payment with paymentId', async () => {
    const product = await createTestProduct({ price: 999, stock: 5 });
    const res = await request(app).post('/api/orders').send({
      customerName: 'Online Payer',
      customerPhone: '9876543210',
      address: validAddress,
      items: [{ productId: product.id, quantity: 1 }],
      paymentMethod: 'razorpay',
      paymentId: 'pay_abc123',
    });
    expect(res.status).toBe(201);
    expect(res.body.paymentMethod).toBe('razorpay');
  });
});

// ── Admin product CRUD ─────────────────────────────────────────────────────────
describe('Admin product CRUD', () => {
  it('creates a product via admin API', async () => {
    const cat = await createTestCategory('Sarees');
    const res = await request(app).post('/api/admin/products').send({
      name: 'Kanjivaram Silk Saree',
      price: 4999,
      images: ['https://example.com/img.jpg'],
      sizes: ['Free Size'],
      colors: ['Red', 'Gold'],
      occasion: ['wedding'],
      stock: 15,
      categoryId: cat.id,
    });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Kanjivaram Silk Saree');
    expect(res.body.slug).toBe('kanjivaram-silk-saree');
  });

  it('updates a product stock and price', async () => {
    const product = await createTestProduct({ name: 'Update Me' });
    const res = await request(app)
      .put(`/api/admin/products/${product.id}`)
      .send({ price: 2999, stock: 100 });

    expect(res.status).toBe(200);
    expect(Number(res.body.price)).toBe(2999);
    expect(res.body.stock).toBe(100);
  });

  it('toggles product active status', async () => {
    const product = await createTestProduct({ name: 'Toggle Me' });
    const res = await request(app)
      .put(`/api/admin/products/${product.id}`)
      .send({ active: false });

    expect(res.status).toBe(200);
    expect(res.body.active).toBe(false);
  });

  it('soft-deletes a product (sets active=false)', async () => {
    const product = await createTestProduct({ name: 'Delete Me Prod' });
    const res = await request(app).delete(`/api/admin/products/${product.id}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const check = await testPrisma.product.findUnique({ where: { id: product.id } });
    expect(check?.active).toBe(false);
  });

  it('returns 404 for updating nonexistent product', async () => {
    const res = await request(app)
      .put('/api/admin/products/nonexistent')
      .send({ price: 100 });
    expect(res.status).toBe(404);
  });
});

// ── Cart pagination and session ───────────────────────────────────────────────
describe('Cart session isolation', () => {
  it('two sessions have separate carts', async () => {
    const product = await createTestProduct({ price: 999 });
    const session1 = uuidv4();
    const session2 = uuidv4();

    await request(app).post('/api/cart').send({ sessionId: session1, productId: product.id, quantity: 2 });
    await request(app).post('/api/cart').send({ sessionId: session2, productId: product.id, quantity: 5 });

    const [c1, c2] = await Promise.all([
      request(app).get(`/api/cart/${session1}`),
      request(app).get(`/api/cart/${session2}`),
    ]);

    expect(c1.body.items[0].quantity).toBe(2);
    expect(c2.body.items[0].quantity).toBe(5);
  });

  it('returns empty cart for unknown session', async () => {
    const res = await request(app).get(`/api/cart/${uuidv4()}`);
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(0);
    expect(res.body.subtotal).toBe(0);
  });
});

// ── Orders list and filter ─────────────────────────────────────────────────────
describe('Admin orders list', () => {
  it('returns paginated orders', async () => {
    const product = await createTestProduct({ price: 999, stock: 100 });
    const base = {
      customerName: 'Paginate Test',
      customerPhone: '9876543210',
      address: validAddress,
      items: [{ productId: product.id, quantity: 1 }],
      paymentMethod: 'cod',
    };

    await Promise.all([
      request(app).post('/api/orders').send(base),
      request(app).post('/api/orders').send(base),
      request(app).post('/api/orders').send(base),
    ]);

    const res = await request(app).get('/api/admin/orders?limit=2');
    expect(res.status).toBe(200);
    expect(res.body.orders.length).toBeLessThanOrEqual(2);
    expect(res.body).toHaveProperty('total');
  });

  it('filters orders by status', async () => {
    const product = await createTestProduct({ price: 999, stock: 100 });
    const orderRes = await request(app).post('/api/orders').send({
      customerName: 'Status Filter',
      customerPhone: '9876543210',
      address: validAddress,
      items: [{ productId: product.id, quantity: 1 }],
      paymentMethod: 'cod',
    });

    await request(app)
      .put(`/api/admin/orders/${orderRes.body.id}/status`)
      .send({ status: 'confirmed' });

    const res = await request(app).get('/api/admin/orders?status=confirmed');
    expect(res.status).toBe(200);
    expect(res.body.orders.every((o: { status: string }) => o.status === 'confirmed')).toBe(true);
  });
});

// ── Category product association ───────────────────────────────────────────────
describe('Category and product association', () => {
  it('filters products by category slug', async () => {
    const cat1 = await createTestCategory('Bridal');
    const cat2 = await createTestCategory('Casual Wear');
    await createTestProduct({ name: 'Bridal Lehenga', categoryId: cat1.id });
    await createTestProduct({ name: 'Casual Kurti', categoryId: cat2.id });

    const res = await request(app).get(`/api/products?category=${cat1.slug}`);
    expect(res.status).toBe(200);
    expect(res.body.products.every((p: { category: { slug: string } }) => p.category.slug === cat1.slug)).toBe(true);
  });

  it('GET /api/categories/:slug returns products in category', async () => {
    const cat = await createTestCategory('Kurtis Test');
    await createTestProduct({ name: 'Cotton Kurti', categoryId: cat.id });

    const res = await request(app).get(`/api/categories/${cat.slug}`);
    expect(res.status).toBe(200);
    expect(res.body.products.length).toBeGreaterThanOrEqual(1);
  });
});
