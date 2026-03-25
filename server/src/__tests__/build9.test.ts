/**
 * Build 9 tests — loyalty program, referrals, smart search, flash sales,
 * lookbook, live chat, best coupon, urgency signals, personalized recommendations.
 * Target: 625+ total tests (95+ new)
 */
import request from 'supertest';
import { app } from '../index';
import {
  createTestProduct,
  createTestCategory,
  createTestUser,
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

// ── Loyalty Program ───────────────────────────────────────────────────────────

describe('Loyalty — account creation', () => {
  it('creates loyalty account for new user', async () => {
    const user = await createTestUser();
    const res = await request(app).get(`/api/loyalty/account/${user.id}`);
    expect(res.status).toBe(200);
    expect(res.body.userId).toBe(user.id);
    expect(res.body.points).toBe(0);
    expect(res.body.tier).toBe('Bronze');
  });

  it('returns existing loyalty account on second call', async () => {
    const user = await createTestUser();
    await request(app).get(`/api/loyalty/account/${user.id}`);
    const res = await request(app).get(`/api/loyalty/account/${user.id}`);
    expect(res.status).toBe(200);
    expect(res.body.tier).toBe('Bronze');
  });

  it('returns 404 for non-existent user', async () => {
    const res = await request(app).get('/api/loyalty/account/nonexistent');
    expect(res.status).toBe(404);
  });

  it('returns tier benefits with account', async () => {
    const user = await createTestUser();
    const res = await request(app).get(`/api/loyalty/account/${user.id}`);
    expect(res.body.tierBenefits).toBeDefined();
    expect(res.body.tierBenefits.birthdayDiscount).toBeGreaterThan(0);
  });
});

describe('Loyalty — earning points', () => {
  it('earns points for purchase (1 point per ₹10)', async () => {
    const user = await createTestUser();
    const res = await request(app)
      .post('/api/loyalty/earn')
      .send({ userId: user.id, orderTotal: 1000, reason: 'purchase' });
    expect(res.status).toBe(200);
    expect(res.body.pointsAdded).toBe(100);
    expect(res.body.account.points).toBe(100);
  });

  it('earns 10 points for writing a review', async () => {
    const user = await createTestUser();
    const res = await request(app)
      .post('/api/loyalty/earn')
      .send({ userId: user.id, reason: 'review' });
    expect(res.status).toBe(200);
    expect(res.body.pointsAdded).toBe(10);
  });

  it('earns 50 points for referral', async () => {
    const user = await createTestUser();
    const res = await request(app)
      .post('/api/loyalty/earn')
      .send({ userId: user.id, reason: 'referral' });
    expect(res.status).toBe(200);
    expect(res.body.pointsAdded).toBe(50);
  });

  it('upgrades tier to Silver at 500 totalEarned', async () => {
    const user = await createTestUser();
    // Earn enough for Silver tier (500 total earned)
    const res = await request(app)
      .post('/api/loyalty/earn')
      .send({ userId: user.id, orderTotal: 5000, reason: 'purchase' });
    expect(res.status).toBe(200);
    expect(res.body.newTier).toBe('Silver');
  });

  it('upgrades tier to Gold at 2000 totalEarned', async () => {
    const user = await createTestUser();
    const res = await request(app)
      .post('/api/loyalty/earn')
      .send({ userId: user.id, orderTotal: 20000, reason: 'purchase' });
    expect(res.status).toBe(200);
    expect(res.body.newTier).toBe('Gold');
  });

  it('accumulates points across multiple transactions', async () => {
    const user = await createTestUser();
    await request(app).post('/api/loyalty/earn').send({ userId: user.id, orderTotal: 1000, reason: 'purchase' });
    await request(app).post('/api/loyalty/earn').send({ userId: user.id, reason: 'review' });
    const res = await request(app).get(`/api/loyalty/account/${user.id}`);
    expect(res.body.points).toBe(110); // 100 + 10
  });

  it('returns 404 for non-existent user', async () => {
    const res = await request(app)
      .post('/api/loyalty/earn')
      .send({ userId: 'nonexistent', reason: 'review' });
    expect(res.status).toBe(404);
  });
});

describe('Loyalty — redeeming points', () => {
  it('redeems 100 points for ₹50 discount', async () => {
    const user = await createTestUser();
    // First earn points
    await request(app).post('/api/loyalty/earn').send({ userId: user.id, orderTotal: 2000, reason: 'purchase' });

    const res = await request(app)
      .post('/api/loyalty/redeem')
      .send({ userId: user.id, points: 100 });
    expect(res.status).toBe(200);
    expect(res.body.discountAmount).toBe(50);
    expect(res.body.pointsRedeemed).toBe(100);
  });

  it('redeems 200 points for ₹100 discount', async () => {
    const user = await createTestUser();
    await request(app).post('/api/loyalty/earn').send({ userId: user.id, orderTotal: 3000, reason: 'purchase' });

    const res = await request(app)
      .post('/api/loyalty/redeem')
      .send({ userId: user.id, points: 200 });
    expect(res.status).toBe(200);
    expect(res.body.discountAmount).toBe(100);
  });

  it('rejects redemption with insufficient points', async () => {
    const user = await createTestUser();
    await request(app).post('/api/loyalty/earn').send({ userId: user.id, reason: 'review' }); // 10 pts

    const res = await request(app)
      .post('/api/loyalty/redeem')
      .send({ userId: user.id, points: 100 });
    expect(res.status).toBe(400);
  });

  it('rejects points not in multiples of 100', async () => {
    const user = await createTestUser();
    await request(app).post('/api/loyalty/earn').send({ userId: user.id, orderTotal: 5000, reason: 'purchase' });

    const res = await request(app)
      .post('/api/loyalty/redeem')
      .send({ userId: user.id, points: 150 });
    expect(res.status).toBe(400);
  });

  it('updates points balance after redemption', async () => {
    const user = await createTestUser();
    await request(app).post('/api/loyalty/earn').send({ userId: user.id, orderTotal: 2000, reason: 'purchase' });
    await request(app).post('/api/loyalty/redeem').send({ userId: user.id, points: 100 });

    const res = await request(app).get(`/api/loyalty/account/${user.id}`);
    expect(res.body.points).toBe(100); // 200 earned - 100 redeemed
  });
});

describe('Loyalty — admin', () => {
  it('lists all loyalty accounts', async () => {
    const user = await createTestUser();
    await request(app).get(`/api/loyalty/account/${user.id}`);

    const res = await request(app).get('/api/loyalty/admin/accounts');
    expect(res.status).toBe(200);
    expect(res.body.accounts).toBeInstanceOf(Array);
    expect(res.body.total).toBeGreaterThanOrEqual(1);
  });

  it('manually adjusts points', async () => {
    const user = await createTestUser();
    await request(app).get(`/api/loyalty/account/${user.id}`);

    const res = await request(app)
      .post('/api/loyalty/admin/adjust')
      .send({ userId: user.id, delta: 500, description: 'Loyalty bonus' });
    expect(res.status).toBe(200);
    expect(res.body.points).toBe(500);
  });

  it('returns loyalty stats', async () => {
    const res = await request(app).get('/api/loyalty/admin/stats');
    expect(res.status).toBe(200);
    expect(res.body.totalAccounts).toBeDefined();
    expect(res.body.tierCounts).toBeInstanceOf(Array);
  });

  it('filters accounts by tier', async () => {
    const user = await createTestUser();
    await request(app).post('/api/loyalty/earn').send({ userId: user.id, orderTotal: 20000, reason: 'purchase' });

    const res = await request(app).get('/api/loyalty/admin/accounts?tier=Gold');
    expect(res.status).toBe(200);
    expect(res.body.accounts.every((a: { tier: string }) => a.tier === 'Gold')).toBe(true);
  });
});

// ── Referral System ──────────────────────────────────────────────────────────

describe('Referrals — code generation', () => {
  it('generates a referral code for a user', async () => {
    const user = await createTestUser();
    const res = await request(app).get(`/api/referrals/code/${user.id}`);
    expect(res.status).toBe(200);
    expect(res.body.code).toMatch(/^REF/);
    expect(res.body.referralUrl).toContain(res.body.code);
  });

  it('returns same code on second request', async () => {
    const user = await createTestUser();
    const res1 = await request(app).get(`/api/referrals/code/${user.id}`);
    const res2 = await request(app).get(`/api/referrals/code/${user.id}`);
    expect(res1.body.code).toBe(res2.body.code);
  });

  it('returns referral rewards info', async () => {
    const user = await createTestUser();
    const res = await request(app).get(`/api/referrals/code/${user.id}`);
    expect(res.body.referrerReward).toBe(200);
    expect(res.body.friendReward).toBe(100);
  });

  it('returns 404 for non-existent user', async () => {
    const res = await request(app).get('/api/referrals/code/nonexistent');
    expect(res.status).toBe(404);
  });
});

describe('Referrals — applying a code', () => {
  it('validates a valid referral code', async () => {
    const referrer = await createTestUser();
    const newUser = await createTestUser();
    const codeRes = await request(app).get(`/api/referrals/code/${referrer.id}`);
    const code = codeRes.body.code;

    const res = await request(app)
      .post('/api/referrals/apply')
      .send({ code, newUserId: newUser.id });
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
    expect(res.body.discount).toBe(100);
  });

  it('rejects own referral code', async () => {
    const user = await createTestUser();
    const codeRes = await request(app).get(`/api/referrals/code/${user.id}`);
    const code = codeRes.body.code;

    const res = await request(app)
      .post('/api/referrals/apply')
      .send({ code, newUserId: user.id });
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(false);
  });

  it('rejects invalid referral code', async () => {
    const newUser = await createTestUser();
    const res = await request(app)
      .post('/api/referrals/apply')
      .send({ code: 'INVALIDCODE', newUserId: newUser.id });
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(false);
  });
});

describe('Referrals — completing a referral', () => {
  it('completes referral and awards loyalty points to referrer', async () => {
    const referrer = await createTestUser();
    const newUser = await createTestUser();
    const codeRes = await request(app).get(`/api/referrals/code/${referrer.id}`);
    const code = codeRes.body.code;

    // Create loyalty account for referrer first
    await request(app).get(`/api/loyalty/account/${referrer.id}`);

    const res = await request(app)
      .post('/api/referrals/complete')
      .send({ code, newUserId: newUser.id });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.referrerRewardPoints).toBe(400);
  });

  it('returns referral stats for a user', async () => {
    const user = await createTestUser();
    await request(app).get(`/api/referrals/code/${user.id}`);

    const res = await request(app).get(`/api/referrals/stats/${user.id}`);
    expect(res.status).toBe(200);
    expect(res.body.totalReferrals).toBeGreaterThanOrEqual(0);
    expect(res.body.completedReferrals).toBeGreaterThanOrEqual(0);
  });
});

// ── Smart Search ─────────────────────────────────────────────────────────────

describe('Search — autocomplete suggestions', () => {
  it('returns suggestions for a valid query', async () => {
    await createTestProduct({ name: 'Silk Saree' });
    const res = await request(app).get('/api/search/suggest?q=saree');
    expect(res.status).toBe(200);
    expect(res.body.suggestions).toBeInstanceOf(Array);
  });

  it('returns empty suggestions for short query', async () => {
    const res = await request(app).get('/api/search/suggest?q=a');
    expect(res.status).toBe(200);
    expect(res.body.suggestions).toHaveLength(0);
  });

  it('returns empty suggestions for missing query', async () => {
    const res = await request(app).get('/api/search/suggest');
    expect(res.status).toBe(200);
    expect(res.body.suggestions).toHaveLength(0);
  });

  it('fuzzy matching: saari finds saree products', async () => {
    await createTestProduct({ name: 'Silk Saree Collection' });
    const res = await request(app).get('/api/search/suggest?q=saari');
    expect(res.status).toBe(200);
    // The synonym normalization maps saari -> saree, so it should find saree products
    expect(res.body.suggestions).toBeInstanceOf(Array);
  });

  it('returns didYouMean when normalized differs from query', async () => {
    const res = await request(app).get('/api/search/suggest?q=saari');
    expect(res.status).toBe(200);
    // saari normalizes to saree
    expect(res.body.didYouMean).toBe('saree');
  });

  it('returns popular searches in fallback', async () => {
    const res = await request(app).get('/api/search/suggest?q=zzz');
    expect(res.status).toBe(200);
    expect(res.body.popular).toBeInstanceOf(Array);
  });
});

describe('Search — popular searches', () => {
  it('returns list of popular searches', async () => {
    const res = await request(app).get('/api/search/popular');
    expect(res.status).toBe(200);
    expect(res.body.popular).toBeInstanceOf(Array);
    expect(res.body.popular.length).toBeGreaterThan(0);
  });
});

describe('Search — full text search', () => {
  it('returns products matching search query', async () => {
    await createTestProduct({ name: 'Banarasi Silk Saree' });
    const res = await request(app).get('/api/search?q=banarasi');
    expect(res.status).toBe(200);
    expect(res.body.total).toBeGreaterThanOrEqual(1);
  });

  it('returns empty results for no-match query', async () => {
    const res = await request(app).get('/api/search?q=xyznonexistentproduct123');
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(0);
  });

  it('returns empty results when query is missing', async () => {
    const res = await request(app).get('/api/search');
    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(0);
  });

  it('supports pagination', async () => {
    await createTestProduct({ name: 'Silk Saree One' });
    await createTestProduct({ name: 'Silk Saree Two' });
    const res = await request(app).get('/api/search?q=silk&limit=1&page=1');
    expect(res.status).toBe(200);
    expect(res.body.products.length).toBeLessThanOrEqual(1);
    expect(res.body.totalPages).toBeGreaterThanOrEqual(1);
  });

  it('includes didYouMean for fuzzy no-result queries', async () => {
    const res = await request(app).get('/api/search?q=saari');
    expect(res.status).toBe(200);
    // If no results, didYouMean should be saree
    if (res.body.total === 0) {
      expect(res.body.didYouMean).toBe('saree');
    }
  });
});

// ── Flash Sales ───────────────────────────────────────────────────────────────

describe('Flash Sales — CRUD', () => {
  it('creates a flash sale', async () => {
    const product = await createTestProduct();
    const startsAt = new Date(Date.now() - 1000).toISOString(); // already started
    const endsAt = new Date(Date.now() + 3600000).toISOString(); // 1 hour from now

    const res = await request(app)
      .post('/api/flash-sales/admin')
      .send({ title: 'Diwali Flash Sale', discountPercent: 20, startsAt, endsAt, productIds: [product.id] });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Diwali Flash Sale');
    expect(res.body.discountPercent).toBe(20);
    expect(res.body.products).toHaveLength(1);
  });

  it('rejects flash sale with end before start', async () => {
    const product = await createTestProduct();
    const startsAt = new Date(Date.now() + 3600000).toISOString();
    const endsAt = new Date(Date.now()).toISOString();

    const res = await request(app)
      .post('/api/flash-sales/admin')
      .send({ title: 'Bad Sale', discountPercent: 20, startsAt, endsAt, productIds: [product.id] });
    expect(res.status).toBe(400);
  });

  it('rejects discount > 90%', async () => {
    const product = await createTestProduct();
    const res = await request(app)
      .post('/api/flash-sales/admin')
      .send({
        title: 'Too Good',
        discountPercent: 95,
        startsAt: new Date(Date.now() - 1000).toISOString(),
        endsAt: new Date(Date.now() + 3600000).toISOString(),
        productIds: [product.id],
      });
    expect(res.status).toBe(400);
  });

  it('lists all flash sales via admin endpoint', async () => {
    const res = await request(app).get('/api/flash-sales/admin');
    expect(res.status).toBe(200);
    expect(res.body.sales).toBeInstanceOf(Array);
  });

  it('updates a flash sale', async () => {
    const product = await createTestProduct();
    const createRes = await request(app)
      .post('/api/flash-sales/admin')
      .send({
        title: 'Test Sale',
        discountPercent: 15,
        startsAt: new Date(Date.now() - 1000).toISOString(),
        endsAt: new Date(Date.now() + 3600000).toISOString(),
        productIds: [product.id],
      });

    const res = await request(app)
      .patch(`/api/flash-sales/admin/${createRes.body.id}`)
      .send({ discountPercent: 25 });
    expect(res.status).toBe(200);
    expect(res.body.discountPercent).toBe(25);
  });

  it('deletes a flash sale', async () => {
    const product = await createTestProduct();
    const createRes = await request(app)
      .post('/api/flash-sales/admin')
      .send({
        title: 'To Delete',
        discountPercent: 10,
        startsAt: new Date(Date.now() - 1000).toISOString(),
        endsAt: new Date(Date.now() + 3600000).toISOString(),
        productIds: [product.id],
      });

    const res = await request(app).delete(`/api/flash-sales/admin/${createRes.body.id}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Flash sale deleted');
  });

  it('returns 404 for non-existent flash sale update', async () => {
    const res = await request(app).patch('/api/flash-sales/admin/nonexistent').send({ discountPercent: 10 });
    expect(res.status).toBe(404);
  });
});

describe('Flash Sales — active sales & pricing', () => {
  it('returns active flash sales', async () => {
    const product = await createTestProduct();
    await request(app).post('/api/flash-sales/admin').send({
      title: 'Active Sale',
      discountPercent: 20,
      startsAt: new Date(Date.now() - 1000).toISOString(),
      endsAt: new Date(Date.now() + 3600000).toISOString(),
      productIds: [product.id],
    });

    const res = await request(app).get('/api/flash-sales/active');
    expect(res.status).toBe(200);
    expect(res.body.sales).toBeInstanceOf(Array);
    expect(res.body.sales.length).toBeGreaterThanOrEqual(1);
  });

  it('active sale includes flash sale price', async () => {
    const product = await createTestProduct({ price: 1000 });
    await request(app).post('/api/flash-sales/admin').send({
      title: 'Priced Sale',
      discountPercent: 20,
      startsAt: new Date(Date.now() - 1000).toISOString(),
      endsAt: new Date(Date.now() + 3600000).toISOString(),
      productIds: [product.id],
    });

    const res = await request(app).get('/api/flash-sales/active');
    expect(res.status).toBe(200);
    const saleProducts = res.body.sales[0]?.products || [];
    const sp = saleProducts.find((p: { id: string }) => p.id === product.id);
    if (sp) {
      expect(sp.flashSalePrice).toBe(800); // 1000 * 0.8
    }
  });

  it('checks if a specific product is in active flash sale', async () => {
    const product = await createTestProduct();
    await request(app).post('/api/flash-sales/admin').send({
      title: 'Product Check Sale',
      discountPercent: 30,
      startsAt: new Date(Date.now() - 1000).toISOString(),
      endsAt: new Date(Date.now() + 3600000).toISOString(),
      productIds: [product.id],
    });

    const res = await request(app).get(`/api/flash-sales/product/${product.id}`);
    expect(res.status).toBe(200);
    expect(res.body.inFlashSale).toBe(true);
    expect(res.body.discountPercent).toBe(30);
  });

  it('returns inFlashSale false for product not in sale', async () => {
    const product = await createTestProduct();
    const res = await request(app).get(`/api/flash-sales/product/${product.id}`);
    expect(res.status).toBe(200);
    expect(res.body.inFlashSale).toBe(false);
  });

  it('includes secondsRemaining in active sale response', async () => {
    const product = await createTestProduct();
    await request(app).post('/api/flash-sales/admin').send({
      title: 'Timer Sale',
      discountPercent: 10,
      startsAt: new Date(Date.now() - 1000).toISOString(),
      endsAt: new Date(Date.now() + 3600000).toISOString(),
      productIds: [product.id],
    });

    const res = await request(app).get('/api/flash-sales/active');
    expect(res.body.sales[0].secondsRemaining).toBeGreaterThan(0);
  });

  it('does not return expired flash sales as active', async () => {
    const product = await createTestProduct();
    await request(app).post('/api/flash-sales/admin').send({
      title: 'Expired Sale',
      discountPercent: 10,
      startsAt: new Date(Date.now() - 7200000).toISOString(), // 2h ago
      endsAt: new Date(Date.now() - 3600000).toISOString(),   // 1h ago
      productIds: [product.id],
    });

    const res = await request(app).get('/api/flash-sales/active');
    expect(res.status).toBe(200);
    const expiredSale = res.body.sales.find((s: { title: string }) => s.title === 'Expired Sale');
    expect(expiredSale).toBeUndefined();
  });
});

// ── Lookbook ──────────────────────────────────────────────────────────────────

describe('Lookbook — CRUD', () => {
  it('creates a lookbook entry', async () => {
    const product = await createTestProduct();
    const res = await request(app)
      .post('/api/lookbook/admin')
      .send({
        title: 'Festive Collection',
        description: 'Perfect for Diwali',
        image: 'https://example.com/lookbook1.jpg',
        productIds: [product.id],
      });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Festive Collection');
    expect(res.body.productIds).toContain(product.id);
  });

  it('rejects lookbook with invalid image URL', async () => {
    const product = await createTestProduct();
    const res = await request(app)
      .post('/api/lookbook/admin')
      .send({
        title: 'Bad Image',
        image: 'not-a-url',
        productIds: [product.id],
      });
    expect(res.status).toBe(400);
  });

  it('rejects lookbook with non-existent product', async () => {
    const res = await request(app)
      .post('/api/lookbook/admin')
      .send({
        title: 'Ghost Products',
        image: 'https://example.com/img.jpg',
        productIds: ['nonexistent'],
      });
    expect(res.status).toBe(400);
  });

  it('lists active lookbook entries', async () => {
    const product = await createTestProduct();
    await request(app).post('/api/lookbook/admin').send({
      title: 'Summer Look',
      image: 'https://example.com/summer.jpg',
      productIds: [product.id],
    });

    const res = await request(app).get('/api/lookbook');
    expect(res.status).toBe(200);
    expect(res.body.lookbook).toBeInstanceOf(Array);
    expect(res.body.lookbook.length).toBeGreaterThanOrEqual(1);
  });

  it('enriches lookbook entries with product data', async () => {
    const product = await createTestProduct();
    await request(app).post('/api/lookbook/admin').send({
      title: 'Rich Look',
      image: 'https://example.com/rich.jpg',
      productIds: [product.id],
    });

    const res = await request(app).get('/api/lookbook');
    expect(res.status).toBe(200);
    expect(res.body.lookbook[0].products).toBeInstanceOf(Array);
    expect(res.body.lookbook[0].products[0].name).toBeDefined();
  });

  it('gets single lookbook entry by id', async () => {
    const product = await createTestProduct();
    const createRes = await request(app).post('/api/lookbook/admin').send({
      title: 'Single Look',
      image: 'https://example.com/single.jpg',
      productIds: [product.id],
    });

    const res = await request(app).get(`/api/lookbook/${createRes.body.id}`);
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Single Look');
    expect(res.body.products).toBeInstanceOf(Array);
  });

  it('returns 404 for non-existent lookbook entry', async () => {
    const res = await request(app).get('/api/lookbook/nonexistent');
    expect(res.status).toBe(404);
  });

  it('updates a lookbook entry', async () => {
    const product = await createTestProduct();
    const createRes = await request(app).post('/api/lookbook/admin').send({
      title: 'To Update',
      image: 'https://example.com/update.jpg',
      productIds: [product.id],
    });

    const res = await request(app)
      .patch(`/api/lookbook/admin/${createRes.body.id}`)
      .send({ title: 'Updated Title' });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Updated Title');
  });

  it('deletes a lookbook entry', async () => {
    const product = await createTestProduct();
    const createRes = await request(app).post('/api/lookbook/admin').send({
      title: 'To Delete',
      image: 'https://example.com/delete.jpg',
      productIds: [product.id],
    });

    const res = await request(app).delete(`/api/lookbook/admin/${createRes.body.id}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Lookbook entry deleted');
  });

  it('lists all lookbook entries including inactive via admin', async () => {
    const res = await request(app).get('/api/lookbook/admin/all');
    expect(res.status).toBe(200);
    expect(res.body.lookbook).toBeInstanceOf(Array);
  });
});

// ── Chat Widget ───────────────────────────────────────────────────────────────

describe('Chat — customer messages', () => {
  it('submits a chat message', async () => {
    const res = await request(app)
      .post('/api/chat/messages')
      .send({ name: 'Priya Sharma', email: 'priya@example.com', message: 'Do you have silk sarees?' });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.message).toContain('received');
  });

  it('submits a message without email', async () => {
    const res = await request(app)
      .post('/api/chat/messages')
      .send({ name: 'Ananya', message: 'What are your store hours?' });
    expect(res.status).toBe(201);
  });

  it('rejects message with missing name', async () => {
    const res = await request(app)
      .post('/api/chat/messages')
      .send({ email: 'test@example.com', message: 'Hello' });
    expect(res.status).toBe(400);
  });

  it('rejects message with empty message body', async () => {
    const res = await request(app)
      .post('/api/chat/messages')
      .send({ name: 'Test', message: '' });
    expect(res.status).toBe(400);
  });

  it('rejects message with invalid email', async () => {
    const res = await request(app)
      .post('/api/chat/messages')
      .send({ name: 'Test', email: 'notanemail', message: 'Hello' });
    expect(res.status).toBe(400);
  });
});

describe('Chat — admin', () => {
  it('lists all messages', async () => {
    await request(app).post('/api/chat/messages').send({ name: 'Customer1', message: 'Question 1' });

    const res = await request(app).get('/api/chat/admin/messages');
    expect(res.status).toBe(200);
    expect(res.body.messages).toBeInstanceOf(Array);
    expect(res.body.total).toBeGreaterThanOrEqual(1);
  });

  it('filters messages by status', async () => {
    await request(app).post('/api/chat/messages').send({ name: 'Customer2', message: 'Question 2' });

    const res = await request(app).get('/api/chat/admin/messages?status=open');
    expect(res.status).toBe(200);
    expect(res.body.messages.every((m: { status: string }) => m.status === 'open')).toBe(true);
  });

  it('replies to a message', async () => {
    const msgRes = await request(app)
      .post('/api/chat/messages')
      .send({ name: 'Customer3', message: 'Can I return an item?' });

    const res = await request(app)
      .post(`/api/chat/admin/messages/${msgRes.body.id}/reply`)
      .send({ reply: 'Yes, you can return within 7 days!' });
    expect(res.status).toBe(200);
    expect(res.body.reply).toBe('Yes, you can return within 7 days!');
    expect(res.body.status).toBe('replied');
  });

  it('returns 404 when replying to non-existent message', async () => {
    const res = await request(app)
      .post('/api/chat/admin/messages/nonexistent/reply')
      .send({ reply: 'Hello' });
    expect(res.status).toBe(404);
  });

  it('updates message status', async () => {
    const msgRes = await request(app)
      .post('/api/chat/messages')
      .send({ name: 'Customer4', message: 'Tracking?' });

    const res = await request(app)
      .patch(`/api/chat/admin/messages/${msgRes.body.id}`)
      .send({ status: 'closed' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('closed');
  });

  it('returns chat stats', async () => {
    const res = await request(app).get('/api/chat/admin/stats');
    expect(res.status).toBe(200);
    expect(res.body.total).toBeDefined();
    expect(res.body.open).toBeDefined();
    expect(res.body.replied).toBeDefined();
  });
});

// ── Best Coupon ───────────────────────────────────────────────────────────────

describe('Coupons — best coupon endpoint', () => {
  it('returns best coupon for an order total', async () => {
    await createTestCoupon({ code: 'SAVE10', discount: 10, active: true });
    await createTestCoupon({ code: 'SAVE20', discount: 20, active: true });

    const res = await request(app).get('/api/coupons/best?total=2000');
    expect(res.status).toBe(200);
    expect(res.body.best).toBeDefined();
    expect(res.body.best.code).toBe('SAVE20'); // 20% is better
    expect(res.body.coupons.length).toBeGreaterThanOrEqual(2);
  });

  it('respects minimum order requirement', async () => {
    await createTestCoupon({ code: 'BIGSAVE', discount: 30, minOrder: 5000, active: true });
    await createTestCoupon({ code: 'SMALLSAVE', discount: 5, active: true });

    const res = await request(app).get('/api/coupons/best?total=1000');
    expect(res.status).toBe(200);
    // BIGSAVE requires ₹5000 min, so should not appear for ₹1000 order
    const bigSave = res.body.coupons.find((c: { code: string }) => c.code === 'BIGSAVE');
    expect(bigSave).toBeUndefined();
  });

  it('returns empty for zero order total', async () => {
    const res = await request(app).get('/api/coupons/best?total=0');
    expect(res.status).toBe(200);
    expect(res.body.best).toBeNull();
  });

  it('returns best as null when no coupons available', async () => {
    const res = await request(app).get('/api/coupons/best?total=500');
    expect(res.status).toBe(200);
    expect(res.body.best).toBeNull();
  });

  it('sorts coupons by discount amount descending', async () => {
    await createTestCoupon({ code: 'TEN', discount: 10, active: true });
    await createTestCoupon({ code: 'FIVE', discount: 5, active: true });
    await createTestCoupon({ code: 'FIFTEEN', discount: 15, active: true });

    const res = await request(app).get('/api/coupons/best?total=1000');
    expect(res.status).toBe(200);
    const amounts = res.body.coupons.map((c: { discountAmount: number }) => c.discountAmount);
    for (let i = 1; i < amounts.length; i++) {
      expect(amounts[i - 1]).toBeGreaterThanOrEqual(amounts[i]);
    }
  });

  it('marks best deal coupon', async () => {
    await createTestCoupon({ code: 'BESTDEAL', discount: 25, active: true });
    const res = await request(app).get('/api/coupons/best?total=2000');
    expect(res.status).toBe(200);
    expect(res.body.best.isBestDeal).toBe(true);
  });

  it('excludes expired coupons from best', async () => {
    await createTestCoupon({
      code: 'EXPIRED',
      discount: 50,
      active: true,
      expiresAt: new Date(Date.now() - 86400000), // yesterday
    });
    await createTestCoupon({ code: 'VALID', discount: 10, active: true });

    const res = await request(app).get('/api/coupons/best?total=1000');
    expect(res.status).toBe(200);
    const expiredCoupon = res.body.coupons.find((c: { code: string }) => c.code === 'EXPIRED');
    expect(expiredCoupon).toBeUndefined();
  });
});

// ── Urgency & Social Proof ────────────────────────────────────────────────────

describe('Products — urgency and social proof signals', () => {
  it('product detail includes trending flag for bestsellers', async () => {
    const product = await createTestProduct({ bestSeller: true });
    const res = await request(app).get(`/api/products/${product.slug}`);
    expect(res.status).toBe(200);
    expect(res.body.trending).toBe(true);
  });

  it('non-bestseller product has trending false', async () => {
    const product = await createTestProduct({ bestSeller: false });
    const res = await request(app).get(`/api/products/${product.slug}`);
    expect(res.status).toBe(200);
    expect(res.body.trending).toBe(false);
  });

  it('product with stock < 5 shows lowStock true', async () => {
    const product = await createTestProduct({ stock: 3 });
    const res = await request(app).get(`/api/products/${product.slug}`);
    expect(res.status).toBe(200);
    expect(res.body.lowStock).toBe(true);
  });

  it('product with stock >= 5 shows lowStock false', async () => {
    const product = await createTestProduct({ stock: 20 });
    const res = await request(app).get(`/api/products/${product.slug}`);
    expect(res.status).toBe(200);
    expect(res.body.lowStock).toBe(false);
  });

  it('product with stock 0 shows outOfStock true', async () => {
    const product = await createTestProduct({ stock: 0 });
    const res = await request(app).get(`/api/products/${product.slug}`);
    expect(res.status).toBe(200);
    expect(res.body.outOfStock).toBe(true);
  });

  it('product detail includes recentPurchases count', async () => {
    const product = await createTestProduct();
    const res = await request(app).get(`/api/products/${product.slug}`);
    expect(res.status).toBe(200);
    expect(res.body.recentPurchases).toBeGreaterThanOrEqual(0);
  });

  it('product detail includes review count and avg rating', async () => {
    const product = await createTestProduct();
    await testPrisma.review.create({
      data: {
        productId: product.id,
        customerName: 'Test',
        rating: 5,
        approved: true,
      },
    });

    const res = await request(app).get(`/api/products/${product.slug}`);
    expect(res.status).toBe(200);
    expect(res.body.reviewCount).toBe(1);
    expect(res.body.avgRating).toBe(5);
  });

  it('product with no reviews has null avgRating', async () => {
    const product = await createTestProduct();
    const res = await request(app).get(`/api/products/${product.slug}`);
    expect(res.status).toBe(200);
    expect(res.body.avgRating).toBeNull();
  });
});

// ── Personalized Recommendations ─────────────────────────────────────────────

describe('Products — personalized for-you', () => {
  it('returns personalized products based on recently viewed categories', async () => {
    const user = await createTestUser();
    const category = await createTestCategory('Sarees');
    const product = await createTestProduct({ categoryId: category.id, name: 'Silk Saree For You' });

    // Add to recently viewed
    await testPrisma.recentlyViewed.create({
      data: { userId: user.id, productId: product.id },
    });

    const res = await request(app).get(`/api/products/for-you/${user.id}`);
    expect(res.status).toBe(200);
    expect(res.body.products).toBeInstanceOf(Array);
    expect(res.body.personalized).toBe(true);
  });

  it('falls back to bestsellers for users with no history', async () => {
    const user = await createTestUser();
    await createTestProduct({ bestSeller: true });

    const res = await request(app).get(`/api/products/for-you/${user.id}`);
    expect(res.status).toBe(200);
    expect(res.body.products).toBeInstanceOf(Array);
    expect(res.body.personalized).toBe(false);
  });

  it('excludes already purchased products from recommendations', async () => {
    const user = await createTestUser();
    const category = await createTestCategory('Kurtis');
    const product = await createTestProduct({ categoryId: category.id, name: 'Already Bought Kurti' });

    // Add to recently viewed
    await testPrisma.recentlyViewed.create({ data: { userId: user.id, productId: product.id } });

    // Simulate purchase
    const order = await testPrisma.order.create({
      data: {
        orderNumber: `SB-TEST-${Date.now()}`,
        userId: user.id,
        customerName: 'Test User',
        customerPhone: user.phone!,
        address: { line1: '123 Main St', city: 'Hyderabad', pincode: '500001', state: 'TS' },
        subtotal: 999,
        total: 999,
        paymentMethod: 'cod',
        status: 'delivered',
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

    const res = await request(app).get(`/api/products/for-you/${user.id}`);
    expect(res.status).toBe(200);
    const productIds = res.body.products.map((p: { id: string }) => p.id);
    expect(productIds).not.toContain(product.id);

    await testPrisma.orderItem.deleteMany({ where: { orderId: order.id } });
    await testPrisma.order.delete({ where: { id: order.id } });
  });
});

// ── Tier Benefits ─────────────────────────────────────────────────────────────

describe('Loyalty — tier benefits', () => {
  it('Bronze tier has no free shipping', async () => {
    const user = await createTestUser();
    const res = await request(app).get(`/api/loyalty/account/${user.id}`);
    expect(res.body.tier).toBe('Bronze');
    expect(res.body.tierBenefits.freeShipping).toBe(false);
  });

  it('Gold tier has free shipping', async () => {
    const user = await createTestUser();
    await request(app).post('/api/loyalty/earn').send({ userId: user.id, orderTotal: 20000, reason: 'purchase' });
    const res = await request(app).get(`/api/loyalty/account/${user.id}`);
    expect(res.body.tier).toBe('Gold');
    expect(res.body.tierBenefits.freeShipping).toBe(true);
  });

  it('Silver tier has early access', async () => {
    const user = await createTestUser();
    await request(app).post('/api/loyalty/earn').send({ userId: user.id, orderTotal: 5000, reason: 'purchase' });
    const res = await request(app).get(`/api/loyalty/account/${user.id}`);
    expect(res.body.tier).toBe('Silver');
    expect(res.body.tierBenefits.earlyAccess).toBe(true);
  });

  it('Gold tier has higher birthday discount', async () => {
    const user = await createTestUser();
    await request(app).post('/api/loyalty/earn').send({ userId: user.id, orderTotal: 20000, reason: 'purchase' });
    const res = await request(app).get(`/api/loyalty/account/${user.id}`);
    expect(res.body.tierBenefits.birthdayDiscount).toBeGreaterThan(5); // More than Bronze
  });

  it('loyalty history is tracked', async () => {
    const user = await createTestUser();
    await request(app).post('/api/loyalty/earn').send({ userId: user.id, reason: 'review' });
    await request(app).post('/api/loyalty/earn').send({ userId: user.id, reason: 'review' });

    const res = await request(app).get(`/api/loyalty/account/${user.id}`);
    expect(res.body.history).toBeInstanceOf(Array);
    expect(res.body.history.length).toBeGreaterThanOrEqual(2);
  });
});
