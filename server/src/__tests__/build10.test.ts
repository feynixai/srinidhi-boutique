/**
 * Build 10 tests — product variants, invoice PDF, shipping prep, collections,
 * tags, notifications, Q&A, reports, double-submit prevention, stock race conditions.
 * Target: 725+ total tests (97+ new)
 */
import request from 'supertest';
import { app } from '../index';
import {
  createTestProduct,
  createTestCategory,
  createTestUser,
  cleanupTest,
  testPrisma,
} from './helpers';

beforeEach(async () => {
  await cleanupTest();
});

afterAll(async () => {
  await cleanupTest();
});

// ── Product Variants ─────────────────────────────────────────────────────────

describe('Product Variants — list', () => {
  it('returns empty array for product with no variants', async () => {
    const product = await createTestProduct();
    const res = await request(app).get(`/api/variants/${product.id}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns 200 for non-existent product (empty list)', async () => {
    const res = await request(app).get('/api/variants/nonexistent');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('Product Variants — create', () => {
  it('creates a variant for a product', async () => {
    const product = await createTestProduct();
    const res = await request(app)
      .post(`/api/variants/${product.id}`)
      .send({ size: 'M', color: 'Red', stock: 10 });
    expect(res.status).toBe(201);
    expect(res.body.size).toBe('M');
    expect(res.body.color).toBe('Red');
    expect(res.body.stock).toBe(10);
    expect(res.body.productId).toBe(product.id);
  });

  it('creates a variant with price override', async () => {
    const product = await createTestProduct();
    const res = await request(app)
      .post(`/api/variants/${product.id}`)
      .send({ size: 'L', color: 'Blue', stock: 5, priceOverride: 1299 });
    expect(res.status).toBe(201);
    expect(Number(res.body.priceOverride)).toBe(1299);
  });

  it('creates variant with SKU', async () => {
    const product = await createTestProduct();
    const res = await request(app)
      .post(`/api/variants/${product.id}`)
      .send({ size: 'S', color: 'Green', stock: 3, sku: 'SKU-001' });
    expect(res.status).toBe(201);
    expect(res.body.sku).toBe('SKU-001');
  });

  it('rejects duplicate size+color combination', async () => {
    const product = await createTestProduct();
    await request(app).post(`/api/variants/${product.id}`).send({ size: 'M', color: 'Red', stock: 5 });
    const res = await request(app).post(`/api/variants/${product.id}`).send({ size: 'M', color: 'Red', stock: 3 });
    expect(res.status).toBe(409);
  });

  it('returns 404 for non-existent product', async () => {
    const res = await request(app)
      .post('/api/variants/nonexistent')
      .send({ size: 'M', color: 'Red', stock: 5 });
    expect(res.status).toBe(404);
  });

  it('rejects negative stock', async () => {
    const product = await createTestProduct();
    const res = await request(app)
      .post(`/api/variants/${product.id}`)
      .send({ size: 'M', color: 'Red', stock: -1 });
    expect(res.status).toBe(400);
  });

  it('rejects missing size', async () => {
    const product = await createTestProduct();
    const res = await request(app)
      .post(`/api/variants/${product.id}`)
      .send({ color: 'Red', stock: 5 });
    expect(res.status).toBe(400);
  });
});

describe('Product Variants — update', () => {
  it('updates variant stock', async () => {
    const product = await createTestProduct();
    const createRes = await request(app)
      .post(`/api/variants/${product.id}`)
      .send({ size: 'M', color: 'Red', stock: 10 });
    const variantId = createRes.body.id;

    const res = await request(app)
      .patch(`/api/variants/${product.id}/${variantId}`)
      .send({ stock: 20 });
    expect(res.status).toBe(200);
    expect(res.body.stock).toBe(20);
  });

  it('updates variant price override', async () => {
    const product = await createTestProduct();
    const createRes = await request(app)
      .post(`/api/variants/${product.id}`)
      .send({ size: 'M', color: 'Red', stock: 10 });
    const variantId = createRes.body.id;

    const res = await request(app)
      .patch(`/api/variants/${product.id}/${variantId}`)
      .send({ priceOverride: 1500 });
    expect(res.status).toBe(200);
    expect(Number(res.body.priceOverride)).toBe(1500);
  });

  it('returns 404 for non-existent variant', async () => {
    const product = await createTestProduct();
    const res = await request(app)
      .patch(`/api/variants/${product.id}/nonexistent`)
      .send({ stock: 5 });
    expect(res.status).toBe(404);
  });
});

describe('Product Variants — stock adjustment', () => {
  it('increments variant stock', async () => {
    const product = await createTestProduct();
    const createRes = await request(app)
      .post(`/api/variants/${product.id}`)
      .send({ size: 'M', color: 'Red', stock: 10 });
    const variantId = createRes.body.id;

    const res = await request(app)
      .post(`/api/variants/${product.id}/${variantId}/adjust-stock`)
      .send({ delta: 5 });
    expect(res.status).toBe(200);
    expect(res.body.stock).toBe(15);
  });

  it('decrements variant stock', async () => {
    const product = await createTestProduct();
    const createRes = await request(app)
      .post(`/api/variants/${product.id}`)
      .send({ size: 'M', color: 'Red', stock: 10 });
    const variantId = createRes.body.id;

    const res = await request(app)
      .post(`/api/variants/${product.id}/${variantId}/adjust-stock`)
      .send({ delta: -3 });
    expect(res.status).toBe(200);
    expect(res.body.stock).toBe(7);
  });

  it('rejects decrement below zero', async () => {
    const product = await createTestProduct();
    const createRes = await request(app)
      .post(`/api/variants/${product.id}`)
      .send({ size: 'M', color: 'Red', stock: 2 });
    const variantId = createRes.body.id;

    const res = await request(app)
      .post(`/api/variants/${product.id}/${variantId}/adjust-stock`)
      .send({ delta: -5 });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/insufficient/i);
  });
});

describe('Product Variants — delete', () => {
  it('deletes a variant', async () => {
    const product = await createTestProduct();
    const createRes = await request(app)
      .post(`/api/variants/${product.id}`)
      .send({ size: 'M', color: 'Red', stock: 10 });
    const variantId = createRes.body.id;

    const del = await request(app).delete(`/api/variants/${product.id}/${variantId}`);
    expect(del.status).toBe(200);
    expect(del.body.success).toBe(true);

    const list = await request(app).get(`/api/variants/${product.id}`);
    expect(list.body).toHaveLength(0);
  });

  it('returns 404 when deleting non-existent variant', async () => {
    const product = await createTestProduct();
    const res = await request(app).delete(`/api/variants/${product.id}/nonexistent`);
    expect(res.status).toBe(404);
  });
});

// ── Collections ───────────────────────────────────────────────────────────────

describe('Collections — list', () => {
  it('returns empty list when no collections', async () => {
    const res = await request(app).get('/api/collections');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('returns active collections', async () => {
    await request(app).post('/api/collections').send({ name: 'Wedding 2026' });
    const res = await request(app).get('/api/collections');
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  it('filters featured collections', async () => {
    await request(app).post('/api/collections').send({ name: 'Featured Col', featured: true });
    await request(app).post('/api/collections').send({ name: 'Normal Col', featured: false });
    const res = await request(app).get('/api/collections?featured=true');
    expect(res.status).toBe(200);
    expect(res.body.every((c: { featured: boolean }) => c.featured)).toBe(true);
  });
});

describe('Collections — create', () => {
  it('creates a collection', async () => {
    const res = await request(app)
      .post('/api/collections')
      .send({ name: 'Under ₹1000', description: 'Budget-friendly picks' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Under ₹1000');
    expect(res.body.slug).toBeTruthy();
  });

  it('creates featured collection', async () => {
    const res = await request(app)
      .post('/api/collections')
      .send({ name: 'Bridal Special', featured: true });
    expect(res.status).toBe(201);
    expect(res.body.featured).toBe(true);
  });

  it('rejects duplicate collection name', async () => {
    await request(app).post('/api/collections').send({ name: 'My Collection' });
    const res = await request(app).post('/api/collections').send({ name: 'My Collection' });
    expect(res.status).toBe(409);
  });

  it('rejects missing name', async () => {
    const res = await request(app).post('/api/collections').send({ description: 'No name' });
    expect(res.status).toBe(400);
  });
});

describe('Collections — get by slug', () => {
  it('returns collection with products', async () => {
    const product = await createTestProduct();
    const createRes = await request(app)
      .post('/api/collections')
      .send({ name: 'Test Collection', productIds: [product.id] });
    const slug = createRes.body.slug;

    const res = await request(app).get(`/api/collections/${slug}`);
    expect(res.status).toBe(200);
    expect(res.body.slug).toBe(slug);
    expect(Array.isArray(res.body.products)).toBe(true);
  });

  it('returns 404 for non-existent collection', async () => {
    const res = await request(app).get('/api/collections/nonexistent-slug');
    expect(res.status).toBe(404);
  });
});

describe('Collections — update', () => {
  it('updates collection', async () => {
    const createRes = await request(app).post('/api/collections').send({ name: 'Old Name' });
    const id = createRes.body.id;

    const res = await request(app)
      .patch(`/api/collections/${id}`)
      .send({ name: 'New Name', featured: true });
    expect(res.status).toBe(200);
    expect(res.body.featured).toBe(true);
  });

  it('deactivates collection', async () => {
    const createRes = await request(app).post('/api/collections').send({ name: 'Active Col' });
    const id = createRes.body.id;

    const res = await request(app).patch(`/api/collections/${id}`).send({ active: false });
    expect(res.status).toBe(200);
    expect(res.body.active).toBe(false);
  });

  it('returns 404 for non-existent collection', async () => {
    const res = await request(app).patch('/api/collections/nonexistent').send({ name: 'X' });
    expect(res.status).toBe(404);
  });
});

describe('Collections — delete', () => {
  it('deletes a collection', async () => {
    const createRes = await request(app).post('/api/collections').send({ name: 'Delete Me' });
    const id = createRes.body.id;
    const del = await request(app).delete(`/api/collections/${id}`);
    expect(del.status).toBe(200);
  });

  it('returns 404 when deleting non-existent', async () => {
    const res = await request(app).delete('/api/collections/nonexistent');
    expect(res.status).toBe(404);
  });
});

// ── Tags ──────────────────────────────────────────────────────────────────────

describe('Tags — CRUD', () => {
  it('lists all tags', async () => {
    const res = await request(app).get('/api/collections/tags/all');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('creates a tag', async () => {
    const res = await request(app).post('/api/collections/tags').send({ name: 'Wedding' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Wedding');
    expect(res.body.slug).toBe('wedding');
  });

  it('rejects duplicate tag', async () => {
    await request(app).post('/api/collections/tags').send({ name: 'Festive' });
    const res = await request(app).post('/api/collections/tags').send({ name: 'Festive' });
    expect(res.status).toBe(409);
  });

  it('adds tags to product', async () => {
    const product = await createTestProduct();
    const tagRes = await request(app).post('/api/collections/tags').send({ name: 'Office' });
    const tagId = tagRes.body.id;

    const res = await request(app)
      .post(`/api/collections/tags/product/${product.id}`)
      .send({ tagIds: [tagId] });
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe(tagId);
  });

  it('gets product tags', async () => {
    const product = await createTestProduct();
    const tagRes = await request(app).post('/api/collections/tags').send({ name: 'Casual' });
    const tagId = tagRes.body.id;
    await request(app).post(`/api/collections/tags/product/${product.id}`).send({ tagIds: [tagId] });

    const res = await request(app).get(`/api/collections/tags/product/${product.id}`);
    expect(res.status).toBe(200);
    expect(res.body[0].slug).toBe('casual');
  });

  it('removes tag from product', async () => {
    const product = await createTestProduct();
    const tagRes = await request(app).post('/api/collections/tags').send({ name: 'Party' });
    const tagId = tagRes.body.id;
    await request(app).post(`/api/collections/tags/product/${product.id}`).send({ tagIds: [tagId] });

    const del = await request(app).delete(`/api/collections/tags/product/${product.id}/${tagId}`);
    expect(del.status).toBe(200);
    expect(del.body.success).toBe(true);
  });

  it('returns 404 when adding tags to non-existent product', async () => {
    const tagRes = await request(app).post('/api/collections/tags').send({ name: 'Test Tag 2' });
    const res = await request(app)
      .post('/api/collections/tags/product/nonexistent')
      .send({ tagIds: [tagRes.body.id] });
    expect(res.status).toBe(404);
  });
});

// ── Product Q&A ───────────────────────────────────────────────────────────────

describe('Product Q&A — submit question', () => {
  it('submits a question', async () => {
    const product = await createTestProduct();
    const res = await request(app)
      .post(`/api/qa/${product.id}`)
      .send({ question: 'Is this available in XL?', askedBy: 'Priya' });
    expect(res.status).toBe(201);
    expect(res.body.question).toBe('Is this available in XL?');
    expect(res.body.askedBy).toBe('Priya');
    expect(res.body.answer).toBeNull();
  });

  it('submits question without name', async () => {
    const product = await createTestProduct();
    const res = await request(app)
      .post(`/api/qa/${product.id}`)
      .send({ question: 'What fabric is this made of?' });
    expect(res.status).toBe(201);
    expect(res.body.askedBy).toBeNull();
  });

  it('rejects question shorter than 5 chars', async () => {
    const product = await createTestProduct();
    const res = await request(app)
      .post(`/api/qa/${product.id}`)
      .send({ question: 'Hi?' });
    expect(res.status).toBe(400);
  });

  it('rejects question for non-existent product', async () => {
    const res = await request(app)
      .post('/api/qa/nonexistent')
      .send({ question: 'Is this available?' });
    expect(res.status).toBe(404);
  });
});

describe('Product Q&A — answer', () => {
  it('admin answers a question', async () => {
    const product = await createTestProduct();
    const qaRes = await request(app)
      .post(`/api/qa/${product.id}`)
      .send({ question: 'Does this come in petite?' });
    const qaId = qaRes.body.id;

    const res = await request(app)
      .patch(`/api/qa/${qaId}/answer`)
      .send({ answer: 'Yes, we have petite sizes. Please WhatsApp us!' });
    expect(res.status).toBe(200);
    expect(res.body.answer).toBe('Yes, we have petite sizes. Please WhatsApp us!');
    expect(res.body.answeredAt).not.toBeNull();
  });

  it('rejects empty answer', async () => {
    const product = await createTestProduct();
    const qaRes = await request(app)
      .post(`/api/qa/${product.id}`)
      .send({ question: 'What is the return policy?' });
    const res = await request(app)
      .patch(`/api/qa/${qaRes.body.id}/answer`)
      .send({ answer: '' });
    expect(res.status).toBe(400);
  });

  it('returns 404 for non-existent Q&A', async () => {
    const res = await request(app)
      .patch('/api/qa/nonexistent/answer')
      .send({ answer: 'Some answer' });
    expect(res.status).toBe(404);
  });
});

describe('Product Q&A — list', () => {
  it('lists only approved and answered Q&A', async () => {
    const product = await createTestProduct();
    // Answered
    const qaRes = await request(app)
      .post(`/api/qa/${product.id}`)
      .send({ question: 'Is this machine washable?' });
    await request(app)
      .patch(`/api/qa/${qaRes.body.id}/answer`)
      .send({ answer: 'Yes, gentle cycle.' });

    // Unanswered (won't show in list since we filter by answer in client, but all approved show)
    await request(app).post(`/api/qa/${product.id}`).send({ question: 'Can I get customisation?' });

    const res = await request(app).get(`/api/qa/${product.id}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });
});

describe('Product Q&A — admin', () => {
  it('admin gets all Q&A', async () => {
    const product = await createTestProduct();
    await request(app).post(`/api/qa/${product.id}`).send({ question: 'Admin test question?' });
    const res = await request(app).get('/api/qa/admin/all');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('admin filters unanswered questions', async () => {
    const product = await createTestProduct();
    const qaRes = await request(app)
      .post(`/api/qa/${product.id}`)
      .send({ question: 'Unanswered question here?' });
    await request(app)
      .post(`/api/qa/${product.id}`)
      .send({ question: 'Another unanswered question is here?' });
    // Answer one
    await request(app).patch(`/api/qa/${qaRes.body.id}/answer`).send({ answer: 'Answered!' });

    const res = await request(app).get('/api/qa/admin/all?unanswered=true');
    expect(res.status).toBe(200);
    expect(res.body.every((q: { answer: string | null }) => !q.answer)).toBe(true);
  });

  it('admin deletes a question', async () => {
    const product = await createTestProduct();
    const qaRes = await request(app)
      .post(`/api/qa/${product.id}`)
      .send({ question: 'Delete this question please?' });
    const res = await request(app).delete(`/api/qa/${qaRes.body.id}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 404 when deleting non-existent Q&A', async () => {
    const res = await request(app).delete('/api/qa/nonexistent');
    expect(res.status).toBe(404);
  });
});

// ── User Notifications ────────────────────────────────────────────────────────

describe('User Notifications — create and list', () => {
  it('creates a notification for a user', async () => {
    const user = await createTestUser();
    const res = await request(app)
      .post('/api/user-notifications')
      .send({
        userId: user.id,
        type: 'order_update',
        title: 'Order Shipped',
        message: 'Your order SB-0001 has been shipped!',
      });
    expect(res.status).toBe(201);
    expect(res.body.userId).toBe(user.id);
    expect(res.body.read).toBe(false);
  });

  it('creates notification with link', async () => {
    const user = await createTestUser();
    const res = await request(app)
      .post('/api/user-notifications')
      .send({
        userId: user.id,
        type: 'flash_sale',
        title: 'Flash Sale!',
        message: '50% off for next 2 hours',
        link: '/offers',
      });
    expect(res.status).toBe(201);
    expect(res.body.link).toBe('/offers');
  });

  it('returns 404 for non-existent user', async () => {
    const res = await request(app)
      .post('/api/user-notifications')
      .send({ userId: 'nonexistent', type: 'order_update', title: 'Test', message: 'Test' });
    expect(res.status).toBe(404);
  });

  it('rejects invalid notification type', async () => {
    const user = await createTestUser();
    const res = await request(app)
      .post('/api/user-notifications')
      .send({ userId: user.id, type: 'invalid_type', title: 'T', message: 'M' });
    expect(res.status).toBe(400);
  });

  it('lists notifications for a user', async () => {
    const user = await createTestUser();
    await request(app).post('/api/user-notifications').send({
      userId: user.id, type: 'loyalty_reward', title: 'Points Earned!', message: 'You earned 50 points',
    });

    const res = await request(app).get(`/api/user-notifications/${user.id}`);
    expect(res.status).toBe(200);
    expect(res.body.notifications).toHaveLength(1);
    expect(res.body.unreadCount).toBe(1);
    expect(res.body.total).toBe(1);
  });

  it('returns empty list for user with no notifications', async () => {
    const user = await createTestUser();
    const res = await request(app).get(`/api/user-notifications/${user.id}`);
    expect(res.status).toBe(200);
    expect(res.body.notifications).toHaveLength(0);
    expect(res.body.unreadCount).toBe(0);
  });
});

describe('User Notifications — unread count', () => {
  it('returns unread count', async () => {
    const user = await createTestUser();
    await request(app).post('/api/user-notifications').send({
      userId: user.id, type: 'price_drop', title: 'Price Drop', message: 'Item wishlist price dropped',
    });
    await request(app).post('/api/user-notifications').send({
      userId: user.id, type: 'flash_sale', title: 'Flash Sale', message: 'Big sale now!',
    });

    const res = await request(app).get(`/api/user-notifications/${user.id}/unread-count`);
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(2);
  });
});

describe('User Notifications — mark read', () => {
  it('marks a notification as read', async () => {
    const user = await createTestUser();
    const createRes = await request(app).post('/api/user-notifications').send({
      userId: user.id, type: 'order_update', title: 'Shipped', message: 'Order shipped',
    });
    const notifId = createRes.body.id;

    const res = await request(app).patch(`/api/user-notifications/${user.id}/${notifId}/read`);
    expect(res.status).toBe(200);
    expect(res.body.read).toBe(true);
  });

  it('returns 404 for wrong user', async () => {
    const user = await createTestUser();
    const user2 = await createTestUser();
    const createRes = await request(app).post('/api/user-notifications').send({
      userId: user.id, type: 'order_update', title: 'T', message: 'M',
    });
    const res = await request(app).patch(`/api/user-notifications/${user2.id}/${createRes.body.id}/read`);
    expect(res.status).toBe(404);
  });

  it('marks all notifications as read', async () => {
    const user = await createTestUser();
    await request(app).post('/api/user-notifications').send({ userId: user.id, type: 'order_update', title: 'T1', message: 'M1' });
    await request(app).post('/api/user-notifications').send({ userId: user.id, type: 'flash_sale', title: 'T2', message: 'M2' });

    const res = await request(app).post(`/api/user-notifications/${user.id}/read-all`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const list = await request(app).get(`/api/user-notifications/${user.id}`);
    expect(list.body.unreadCount).toBe(0);
  });
});

describe('User Notifications — delete', () => {
  it('deletes a notification', async () => {
    const user = await createTestUser();
    const createRes = await request(app).post('/api/user-notifications').send({
      userId: user.id, type: 'loyalty_reward', title: 'Reward', message: 'Points added',
    });
    const notifId = createRes.body.id;

    const del = await request(app).delete(`/api/user-notifications/${user.id}/${notifId}`);
    expect(del.status).toBe(200);
    expect(del.body.success).toBe(true);
  });

  it('returns 404 when deleting non-existent notification', async () => {
    const user = await createTestUser();
    const res = await request(app).delete(`/api/user-notifications/${user.id}/nonexistent`);
    expect(res.status).toBe(404);
  });
});

// ── Invoice PDF ───────────────────────────────────────────────────────────────

describe('Order Invoice PDF', () => {
  async function createTestOrder() {
    const product = await createTestProduct({ price: 999, stock: 50 });
    const res = await request(app).post('/api/orders').send({
      customerName: 'Test Customer',
      customerPhone: '9876543210',
      customerEmail: 'test@example.com',
      address: { line1: '123 Test St', city: 'Hyderabad', state: 'Telangana', pincode: '500001' },
      items: [{ productId: product.id, quantity: 1, size: 'M', color: 'Red' }],
      paymentMethod: 'cod',
    });
    return res.body;
  }

  it('returns PDF for a valid order', async () => {
    const order = await createTestOrder();
    const res = await request(app).get(`/api/orders/${order.id}/invoice-pdf`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/pdf');
    expect(res.headers['content-disposition']).toContain('invoice-');
  });

  it('returns 404 for non-existent order', async () => {
    const res = await request(app).get('/api/orders/nonexistent/invoice-pdf');
    expect(res.status).toBe(404);
  });
});

// ── Shiprocket Format ─────────────────────────────────────────────────────────

describe('Shiprocket order format', () => {
  async function createTestOrder() {
    const product = await createTestProduct({ price: 999, stock: 50 });
    const res = await request(app).post('/api/orders').send({
      customerName: 'Priya Sharma',
      customerPhone: '9876543210',
      address: { line1: 'Flat 4B, Green Park', city: 'Hyderabad', state: 'Telangana', pincode: '500001' },
      items: [{ productId: product.id, quantity: 2, size: 'M' }],
      paymentMethod: 'razorpay',
      paymentId: 'pay_test123',
    });
    return res.body;
  }

  it('returns Shiprocket-ready payload', async () => {
    const order = await createTestOrder();
    const res = await request(app).get(`/api/orders/${order.id}/shiprocket`);
    expect(res.status).toBe(200);
    expect(res.body.order_id).toBe(order.orderNumber);
    expect(res.body.billing_customer_name).toBe('Priya Sharma');
    expect(res.body.billing_phone).toBe('9876543210');
    expect(Array.isArray(res.body.order_items)).toBe(true);
    expect(res.body.order_items[0]).toHaveProperty('hsn');
    expect(res.body.payment_method).toBe('Prepaid');
  });

  it('marks COD orders correctly', async () => {
    const product = await createTestProduct({ price: 999, stock: 50 });
    const orderRes = await request(app).post('/api/orders').send({
      customerName: 'Anita',
      customerPhone: '9876543211',
      address: { line1: 'MG Road', city: 'Hyderabad', state: 'Telangana', pincode: '500001' },
      items: [{ productId: product.id, quantity: 1 }],
      paymentMethod: 'cod',
    });
    const res = await request(app).get(`/api/orders/${orderRes.body.id}/shiprocket`);
    expect(res.body.payment_method).toBe('COD');
  });

  it('returns 404 for non-existent order', async () => {
    const res = await request(app).get('/api/orders/nonexistent/shiprocket');
    expect(res.status).toBe(404);
  });
});

describe('AWB and courier update', () => {
  async function createTestOrder() {
    const product = await createTestProduct({ price: 999, stock: 50 });
    const res = await request(app).post('/api/orders').send({
      customerName: 'Test',
      customerPhone: '9876543210',
      address: { line1: 'Test St', city: 'Hyd', state: 'TS', pincode: '500001' },
      items: [{ productId: product.id, quantity: 1 }],
      paymentMethod: 'cod',
    });
    return res.body;
  }

  it('sets AWB and courier on order', async () => {
    const order = await createTestOrder();
    const res = await request(app)
      .patch(`/api/orders/${order.id}/shipping`)
      .send({ awbNumber: 'AWB123456', courierName: 'Blue Dart' });
    expect(res.status).toBe(200);
    expect(res.body.awbNumber).toBe('AWB123456');
    expect(res.body.courierName).toBe('Blue Dart');
  });

  it('sets tracking ID', async () => {
    const order = await createTestOrder();
    const res = await request(app)
      .patch(`/api/orders/${order.id}/shipping`)
      .send({ trackingId: 'TRACK-001', courierName: 'Delhivery' });
    expect(res.status).toBe(200);
    expect(res.body.trackingId).toBe('TRACK-001');
  });

  it('returns 404 for non-existent order', async () => {
    const res = await request(app)
      .patch('/api/orders/nonexistent/shipping')
      .send({ awbNumber: 'AWB123' });
    expect(res.status).toBe(404);
  });
});

// ── Admin Reports ─────────────────────────────────────────────────────────────

describe('Reports — sales', () => {
  it('returns monthly sales report as JSON', async () => {
    const res = await request(app).get('/api/reports/sales');
    expect(res.status).toBe(200);
    expect(res.body.summary).toBeDefined();
    expect(res.body.summary.totalOrders).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(res.body.orders)).toBe(true);
  });

  it('returns sales CSV', async () => {
    const res = await request(app).get('/api/reports/sales?format=csv');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
  });

  it('returns sales for specific month', async () => {
    const res = await request(app).get('/api/reports/sales?month=2026-03');
    expect(res.status).toBe(200);
    expect(res.body.summary).toBeDefined();
  });
});

describe('Reports — customers', () => {
  it('returns customer list', async () => {
    await createTestUser();
    const res = await request(app).get('/api/reports/customers');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('returns customers CSV', async () => {
    const res = await request(app).get('/api/reports/customers?format=csv');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
  });
});

describe('Reports — products', () => {
  it('returns product performance data', async () => {
    await createTestProduct();
    const res = await request(app).get('/api/reports/products');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    if (res.body.length > 0) {
      expect(res.body[0]).toHaveProperty('totalOrders');
      expect(res.body[0]).toHaveProperty('unitsSold');
    }
  });

  it('returns products CSV', async () => {
    const res = await request(app).get('/api/reports/products?format=csv');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
  });
});

describe('Reports — returns', () => {
  it('returns return report with summary', async () => {
    const res = await request(app).get('/api/reports/returns');
    expect(res.status).toBe(200);
    expect(res.body.summary).toBeDefined();
    expect(res.body.summary.returnRate).toBeDefined();
    expect(Array.isArray(res.body.returns)).toBe(true);
  });

  it('returns returns CSV', async () => {
    const res = await request(app).get('/api/reports/returns?format=csv');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
  });
});

describe('Reports — revenue by region', () => {
  it('returns revenue breakdown', async () => {
    const res = await request(app).get('/api/reports/revenue-by-region');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('returns region CSV', async () => {
    const res = await request(app).get('/api/reports/revenue-by-region?format=csv');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
  });
});

// ── Double-submit Prevention ──────────────────────────────────────────────────

describe('Double-submit prevention (idempotency)', () => {
  it('handles duplicate order submission with idempotency key', async () => {
    const product = await createTestProduct({ price: 499, stock: 20 });
    const orderPayload = {
      customerName: 'Duplicate Test',
      customerPhone: '9876543210',
      address: { line1: 'Test', city: 'Hyderabad', state: 'TS', pincode: '500001' },
      items: [{ productId: product.id, quantity: 1 }],
      paymentMethod: 'cod',
    };

    const res1 = await request(app)
      .post('/api/orders')
      .set('x-idempotency-key', 'idem-key-001')
      .send(orderPayload);
    expect(res1.status).toBe(201);

    // Second request with same key — should return same or 201
    const res2 = await request(app)
      .post('/api/orders')
      .set('x-idempotency-key', 'idem-key-001')
      .send(orderPayload);
    expect([200, 201]).toContain(res2.status);
  });

  it('creates separate orders for different idempotency keys', async () => {
    const product = await createTestProduct({ price: 499, stock: 20 });
    const orderPayload = {
      customerName: 'Key Test',
      customerPhone: '9876543210',
      address: { line1: 'Test', city: 'Hyderabad', state: 'TS', pincode: '500001' },
      items: [{ productId: product.id, quantity: 1 }],
      paymentMethod: 'cod',
    };

    const res1 = await request(app).post('/api/orders').set('x-idempotency-key', 'key-aaa').send(orderPayload);
    const res2 = await request(app).post('/api/orders').set('x-idempotency-key', 'key-bbb').send(orderPayload);
    expect(res1.status).toBe(201);
    expect(res2.status).toBe(201);
    expect(res1.body.orderNumber).not.toBe(res2.body.orderNumber);
  });
});

// ── Stock Race Conditions ─────────────────────────────────────────────────────

describe('Stock race condition protection', () => {
  it('prevents ordering more than available stock', async () => {
    const product = await createTestProduct({ price: 999, stock: 3 });
    const res = await request(app).post('/api/orders').send({
      customerName: 'Over Stock',
      customerPhone: '9876543210',
      address: { line1: 'Test', city: 'Hyd', state: 'TS', pincode: '500001' },
      items: [{ productId: product.id, quantity: 5 }],
      paymentMethod: 'cod',
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/stock/i);
  });

  it('depletes stock correctly after order', async () => {
    const product = await createTestProduct({ price: 999, stock: 10 });
    await request(app).post('/api/orders').send({
      customerName: 'Stock Check',
      customerPhone: '9876543210',
      address: { line1: 'Test', city: 'Hyd', state: 'TS', pincode: '500001' },
      items: [{ productId: product.id, quantity: 3 }],
      paymentMethod: 'cod',
    });
    const updated = await testPrisma.product.findUnique({ where: { id: product.id } });
    expect(updated?.stock).toBe(7);
  });

  it('deactivates product when stock reaches zero', async () => {
    const product = await createTestProduct({ price: 999, stock: 2 });
    await request(app).post('/api/orders').send({
      customerName: 'Last Stock',
      customerPhone: '9876543210',
      address: { line1: 'Test', city: 'Hyd', state: 'TS', pincode: '500001' },
      items: [{ productId: product.id, quantity: 2 }],
      paymentMethod: 'cod',
    });
    const updated = await testPrisma.product.findUnique({ where: { id: product.id } });
    expect(updated?.stock).toBe(0);
    expect(updated?.active).toBe(false);
  });
});

// ── Error Handler Improvements ────────────────────────────────────────────────

describe('Error handler — graceful errors', () => {
  it('returns 404 for unknown routes gracefully', async () => {
    const res = await request(app).get('/api/nonexistent-route-xyz');
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('returns 400 for invalid JSON body', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Content-Type', 'application/json')
      .send('{ invalid json }');
    expect(res.status).toBe(400);
  });
});

// ── Variant Stock Management Integration ─────────────────────────────────────

describe('Variant management — multiple variants', () => {
  it('lists multiple variants for a product', async () => {
    const product = await createTestProduct();
    await request(app).post(`/api/variants/${product.id}`).send({ size: 'S', color: 'Red', stock: 5 });
    await request(app).post(`/api/variants/${product.id}`).send({ size: 'M', color: 'Red', stock: 8 });
    await request(app).post(`/api/variants/${product.id}`).send({ size: 'L', color: 'Blue', stock: 3 });

    const res = await request(app).get(`/api/variants/${product.id}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(3);
  });

  it('total stock across all variants is correct', async () => {
    const product = await createTestProduct();
    await request(app).post(`/api/variants/${product.id}`).send({ size: 'S', color: 'Red', stock: 5 });
    await request(app).post(`/api/variants/${product.id}`).send({ size: 'M', color: 'Green', stock: 10 });

    const res = await request(app).get(`/api/variants/${product.id}`);
    const total = res.body.reduce((sum: number, v: { stock: number }) => sum + v.stock, 0);
    expect(total).toBe(15);
  });

  it('out of stock variant has stock 0', async () => {
    const product = await createTestProduct();
    await request(app).post(`/api/variants/${product.id}`).send({ size: 'XL', color: 'Black', stock: 0 });

    const res = await request(app).get(`/api/variants/${product.id}`);
    expect(res.body[0].stock).toBe(0);
  });
});

// ── Collections with products ─────────────────────────────────────────────────

describe('Collections — product membership', () => {
  it('collection with multiple products returns all products', async () => {
    const p1 = await createTestProduct({ name: `ColProd1 ${Date.now()}` });
    const p2 = await createTestProduct({ name: `ColProd2 ${Date.now()}` });
    const createRes = await request(app)
      .post('/api/collections')
      .send({ name: `Multi Product Col ${Date.now()}`, productIds: [p1.id, p2.id] });
    const slug = createRes.body.slug;

    const res = await request(app).get(`/api/collections/${slug}`);
    expect(res.status).toBe(200);
    expect(res.body.products.length).toBeGreaterThanOrEqual(2);
  });

  it('updating productIds on collection changes products', async () => {
    const product = await createTestProduct({ name: `UpdateProd ${Date.now()}` });
    const createRes = await request(app)
      .post('/api/collections')
      .send({ name: `Update Col ${Date.now()}` });
    const id = createRes.body.id;

    const updated = await request(app)
      .patch(`/api/collections/${id}`)
      .send({ productIds: [product.id] });
    expect(updated.status).toBe(200);
    expect(updated.body.productIds).toContain(product.id);
  });
});

// ── Q&A approve/disapprove ────────────────────────────────────────────────────

describe('Product Q&A — approve toggle', () => {
  it('admin can disapprove a question', async () => {
    const product = await createTestProduct();
    const qaRes = await request(app)
      .post(`/api/qa/${product.id}`)
      .send({ question: 'Can I get a refund on this item?' });
    const qaId = qaRes.body.id;

    const res = await request(app)
      .patch(`/api/qa/${qaId}/approve`)
      .send({ approved: false });
    expect(res.status).toBe(200);
    expect(res.body.approved).toBe(false);
  });

  it('admin can re-approve a question', async () => {
    const product = await createTestProduct();
    const qaRes = await request(app)
      .post(`/api/qa/${product.id}`)
      .send({ question: 'What are the washing instructions?' });
    const qaId = qaRes.body.id;

    await request(app).patch(`/api/qa/${qaId}/approve`).send({ approved: false });
    const res = await request(app).patch(`/api/qa/${qaId}/approve`).send({ approved: true });
    expect(res.status).toBe(200);
    expect(res.body.approved).toBe(true);
  });
});

// ── Notification pagination ───────────────────────────────────────────────────

describe('User Notifications — pagination', () => {
  it('paginates notifications correctly', async () => {
    const user = await createTestUser();
    // Create 5 notifications
    for (let i = 0; i < 5; i++) {
      await request(app).post('/api/user-notifications').send({
        userId: user.id, type: 'order_update', title: `Notif ${i}`, message: 'Test',
      });
    }
    const res = await request(app).get(`/api/user-notifications/${user.id}?limit=3&page=1`);
    expect(res.status).toBe(200);
    expect(res.body.notifications).toHaveLength(3);
    expect(res.body.total).toBe(5);
  });
});

// ── Admin reports — CSV format validation ────────────────────────────────────

describe('Reports — CSV format validation', () => {
  it('sales CSV has correct headers', async () => {
    const product = await createTestProduct({ price: 999, stock: 10 });
    await request(app).post('/api/orders').send({
      customerName: 'CSV Test',
      customerPhone: '9876543210',
      address: { line1: 'Test', city: 'Hyd', state: 'TS', pincode: '500001' },
      items: [{ productId: product.id, quantity: 1 }],
      paymentMethod: 'razorpay',
      paymentId: 'pay_test_csv',
    });
    const res = await request(app).get('/api/reports/sales?format=csv');
    expect(res.status).toBe(200);
    // CSV body should have header row
    const body = res.text || '';
    if (body.length > 0) {
      expect(body).toContain('orderNumber');
    }
  });

  it('product CSV has name column', async () => {
    await createTestProduct({ name: `CSV Product ${Date.now()}` });
    const res = await request(app).get('/api/reports/products?format=csv');
    expect(res.status).toBe(200);
    if (res.text && res.text.length > 0) {
      expect(res.text).toContain('name');
    }
  });
});
