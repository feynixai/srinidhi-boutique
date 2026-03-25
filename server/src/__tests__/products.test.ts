import request from 'supertest';
import { app } from '../index';
import { createTestProduct, createTestCategory, cleanupTest, testPrisma } from './helpers';

beforeEach(async () => {
  await cleanupTest();
});

afterAll(async () => {
  await cleanupTest();
  await testPrisma.$disconnect();
});

describe('GET /api/products', () => {
  it('returns empty list when no products', async () => {
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(res.body.products).toEqual([]);
    expect(res.body.total).toBe(0);
  });

  it('returns list of active products', async () => {
    await createTestProduct({ name: 'Product A' });
    await createTestProduct({ name: 'Product B' });

    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(2);
    expect(res.body.total).toBe(2);
  });

  it('does not return inactive products', async () => {
    await createTestProduct({ name: 'Active Product', active: true });
    await createTestProduct({ name: 'Inactive Product', active: false });

    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(1);
    expect(res.body.products[0].name).toBe('Active Product');
  });

  it('filters by category slug', async () => {
    const cat1 = await createTestCategory('Sarees');
    const cat2 = await createTestCategory('Kurtis');
    await createTestProduct({ name: 'Silk Saree', categoryId: cat1.id });
    await createTestProduct({ name: 'Cotton Kurti', categoryId: cat2.id });

    const res = await request(app).get('/api/products?category=sarees');
    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(1);
    expect(res.body.products[0].name).toBe('Silk Saree');
  });

  it('filters by price range', async () => {
    await createTestProduct({ name: 'Budget Item', price: 500 });
    await createTestProduct({ name: 'Mid Item', price: 1500 });
    await createTestProduct({ name: 'Premium Item', price: 5000 });

    const res = await request(app).get('/api/products?minPrice=1000&maxPrice=3000');
    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(1);
    expect(res.body.products[0].name).toBe('Mid Item');
  });

  it('filters by search term', async () => {
    await createTestProduct({ name: 'Kanjivaram Silk Saree' });
    await createTestProduct({ name: 'Cotton Kurti' });

    const res = await request(app).get('/api/products?search=kanjivaram');
    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(1);
    expect(res.body.products[0].name).toContain('Kanjivaram');
  });

  it('paginates results', async () => {
    for (let i = 0; i < 5; i++) {
      await createTestProduct({ name: `Product ${i}` });
    }

    const res = await request(app).get('/api/products?page=1&limit=3');
    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(3);
    expect(res.body.totalPages).toBe(2);
  });
});

describe('GET /api/products/featured', () => {
  it('returns only featured products', async () => {
    await createTestProduct({ name: 'Featured', featured: true });
    await createTestProduct({ name: 'Not Featured', featured: false });

    const res = await request(app).get('/api/products/featured');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Featured');
  });
});

describe('GET /api/products/best-sellers', () => {
  it('returns only best sellers', async () => {
    await createTestProduct({ name: 'Best Seller', bestSeller: true });
    await createTestProduct({ name: 'Regular', bestSeller: false });

    const res = await request(app).get('/api/products/best-sellers');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Best Seller');
  });
});

describe('GET /api/products/offers', () => {
  it('returns only offer products', async () => {
    await createTestProduct({ name: 'On Offer', onOffer: true, offerPercent: 20 });
    await createTestProduct({ name: 'No Offer', onOffer: false });

    const res = await request(app).get('/api/products/offers');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('On Offer');
  });
});

describe('GET /api/products/:slug', () => {
  it('returns product by slug', async () => {
    const product = await createTestProduct({ name: 'My Product 123' });

    const res = await request(app).get(`/api/products/${product.slug}`);
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('My Product 123');
    expect(res.body.slug).toBe(product.slug);
  });

  it('returns 404 for nonexistent slug', async () => {
    const res = await request(app).get('/api/products/nonexistent-slug-xyz');
    expect(res.status).toBe(404);
  });

  it('returns 404 for inactive product', async () => {
    const product = await createTestProduct({ name: 'Inactive Product', active: false });
    const res = await request(app).get(`/api/products/${product.slug}`);
    expect(res.status).toBe(404);
  });
});

describe('GET /api/categories', () => {
  it('returns all categories', async () => {
    await createTestCategory('Sarees');
    await createTestCategory('Kurtis');

    const res = await request(app).get('/api/categories');
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
  });
});
