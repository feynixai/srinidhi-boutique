/**
 * Reviews API tests — submit, fetch, approve, delete
 */
import request from 'supertest';
import { app } from '../index';
import {
  createTestProduct,
  createTestReview,
  cleanupTest,
  testPrisma,
} from './helpers';

beforeEach(async () => {
  await cleanupTest();
});

afterAll(async () => {
  await cleanupTest();
});

describe('GET /api/reviews/:productId', () => {
  it('returns empty reviews for product with no reviews', async () => {
    const product = await createTestProduct();
    const res = await request(app).get(`/api/reviews/${product.id}`);
    expect(res.status).toBe(200);
    expect(res.body.reviews).toEqual([]);
    expect(res.body.total).toBe(0);
    expect(res.body.avgRating).toBe(0);
  });

  it('returns reviews with correct avg rating', async () => {
    const product = await createTestProduct();
    await createTestReview(product.id, { rating: 5 });
    await createTestReview(product.id, { rating: 3 });

    const res = await request(app).get(`/api/reviews/${product.id}`);
    expect(res.status).toBe(200);
    expect(res.body.reviews).toHaveLength(2);
    expect(res.body.avgRating).toBe(4);
    expect(res.body.total).toBe(2);
  });

  it('works with product slug too', async () => {
    const product = await createTestProduct({ name: 'Slug Test Product' });
    await createTestReview(product.id, { rating: 5 });

    const res = await request(app).get(`/api/reviews/${product.slug}`);
    expect(res.status).toBe(200);
    expect(res.body.reviews).toHaveLength(1);
  });

  it('returns 404 for non-existent product', async () => {
    const res = await request(app).get('/api/reviews/nonexistent-id');
    expect(res.status).toBe(404);
  });

  it('only returns approved reviews', async () => {
    const product = await createTestProduct();
    await createTestReview(product.id, { rating: 5, approved: true });
    await createTestReview(product.id, { rating: 1, approved: false });

    const res = await request(app).get(`/api/reviews/${product.id}`);
    expect(res.status).toBe(200);
    expect(res.body.reviews).toHaveLength(1);
    expect(res.body.reviews[0].rating).toBe(5);
  });

  it('includes rating distribution', async () => {
    const product = await createTestProduct();
    await createTestReview(product.id, { rating: 5 });
    await createTestReview(product.id, { rating: 5 });
    await createTestReview(product.id, { rating: 3 });

    const res = await request(app).get(`/api/reviews/${product.id}`);
    expect(res.status).toBe(200);
    expect(res.body.distribution).toBeDefined();
    const fiveStar = res.body.distribution.find((d: { star: number }) => d.star === 5);
    expect(fiveStar?.count).toBe(2);
  });
});

describe('POST /api/reviews/:productId', () => {
  it('creates a review successfully', async () => {
    const product = await createTestProduct();
    const res = await request(app)
      .post(`/api/reviews/${product.id}`)
      .send({ customerName: 'Priya S.', rating: 5, title: 'Loved it!', body: 'Beautiful saree' });
    expect(res.status).toBe(201);
    expect(res.body.customerName).toBe('Priya S.');
    expect(res.body.rating).toBe(5);
    expect(res.body.approved).toBe(true);
  });

  it('creates review with minimum required fields', async () => {
    const product = await createTestProduct();
    const res = await request(app)
      .post(`/api/reviews/${product.id}`)
      .send({ customerName: 'Anita', rating: 4 });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
  });

  it('rejects review with invalid rating', async () => {
    const product = await createTestProduct();
    const res = await request(app)
      .post(`/api/reviews/${product.id}`)
      .send({ customerName: 'Test', rating: 6 });
    expect(res.status).toBe(400);
  });

  it('rejects review with rating below 1', async () => {
    const product = await createTestProduct();
    const res = await request(app)
      .post(`/api/reviews/${product.id}`)
      .send({ customerName: 'Test', rating: 0 });
    expect(res.status).toBe(400);
  });

  it('rejects review without customerName', async () => {
    const product = await createTestProduct();
    const res = await request(app)
      .post(`/api/reviews/${product.id}`)
      .send({ rating: 5 });
    expect(res.status).toBe(400);
  });

  it('returns 404 for non-existent product', async () => {
    const res = await request(app)
      .post('/api/reviews/nonexistent-id')
      .send({ customerName: 'Test', rating: 5 });
    expect(res.status).toBe(404);
  });

  it('persists review to database', async () => {
    const product = await createTestProduct();
    await request(app)
      .post(`/api/reviews/${product.id}`)
      .send({ customerName: 'Sunita', rating: 4, body: 'Good quality' });

    const reviews = await testPrisma.review.findMany({ where: { productId: product.id } });
    expect(reviews).toHaveLength(1);
    expect(reviews[0].customerName).toBe('Sunita');
  });
});

describe('PATCH /api/reviews/:id/approve', () => {
  it('toggles review approval', async () => {
    const product = await createTestProduct();
    const review = await createTestReview(product.id, { approved: true });

    const res = await request(app).patch(`/api/reviews/${review.id}/approve`);
    expect(res.status).toBe(200);
    expect(res.body.approved).toBe(false);
  });

  it('toggles unapproved to approved', async () => {
    const product = await createTestProduct();
    const review = await createTestReview(product.id, { approved: false });

    const res = await request(app).patch(`/api/reviews/${review.id}/approve`);
    expect(res.status).toBe(200);
    expect(res.body.approved).toBe(true);
  });

  it('returns 404 for non-existent review', async () => {
    const res = await request(app).patch('/api/reviews/nonexistent/approve');
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/reviews/:id', () => {
  it('deletes a review', async () => {
    const product = await createTestProduct();
    const review = await createTestReview(product.id);

    const res = await request(app).delete(`/api/reviews/${review.id}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const deleted = await testPrisma.review.findUnique({ where: { id: review.id } });
    expect(deleted).toBeNull();
  });

  it('returns 404 for non-existent review', async () => {
    const res = await request(app).delete('/api/reviews/nonexistent');
    expect(res.status).toBe(404);
  });
});

describe('GET /api/reviews (admin)', () => {
  it('returns all reviews including unapproved', async () => {
    const product = await createTestProduct();
    await createTestReview(product.id, { approved: true });
    await createTestReview(product.id, { approved: false });

    const res = await request(app).get('/api/reviews');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });
});
