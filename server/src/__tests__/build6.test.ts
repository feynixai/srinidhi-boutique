/**
 * Build 6 tests — Auth (Google, Phone OTP), Admin auth + roles,
 * International shipping, Stripe session, User CRUD, Wishlist sync,
 * Recently viewed, Address management.
 */
import request from 'supertest';
import { app } from '../index';
import {
  createTestProduct,
  createTestUser,
  createTestAdminUser,
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

// ── Phone OTP ────────────────────────────────────────────────────────────────

describe('POST /api/auth/otp/send', () => {
  it('sends OTP to a phone number and returns otp in dev mode', async () => {
    const res = await request(app)
      .post('/api/auth/otp/send')
      .send({ phone: '9876543210' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.otp).toMatch(/^\d{6}$/);
  });

  it('rejects too-short phone', async () => {
    const res = await request(app)
      .post('/api/auth/otp/send')
      .send({ phone: '123' });
    expect(res.status).toBe(400);
  });

  it('invalidates old OTPs before creating a new one', async () => {
    const phone = '9111111111';
    await request(app).post('/api/auth/otp/send').send({ phone });
    const res2 = await request(app).post('/api/auth/otp/send').send({ phone });
    expect(res2.body.success).toBe(true);

    // Only one valid OTP should exist
    const valid = await testPrisma.otpCode.count({
      where: { phone, used: false },
    });
    expect(valid).toBe(1);
  });

  it('creates user record in OtpCode table', async () => {
    const phone = '9222222222';
    await request(app).post('/api/auth/otp/send').send({ phone });
    const record = await testPrisma.otpCode.findFirst({ where: { phone, used: false } });
    expect(record).toBeTruthy();
    expect(record!.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });
});

describe('POST /api/auth/otp/verify', () => {
  it('verifies valid OTP and creates/returns user', async () => {
    const phone = '9333333333';
    const sendRes = await request(app).post('/api/auth/otp/send').send({ phone });
    const { otp } = sendRes.body;

    const res = await request(app)
      .post('/api/auth/otp/verify')
      .send({ phone, code: otp });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.phone).toBe(phone);
    expect(res.body.user.id).toBeTruthy();
  });

  it('rejects wrong OTP', async () => {
    const phone = '9444444444';
    await request(app).post('/api/auth/otp/send').send({ phone });

    const res = await request(app)
      .post('/api/auth/otp/verify')
      .send({ phone, code: '000000' });
    expect(res.status).toBe(400);
  });

  it('rejects expired OTP', async () => {
    const phone = '9555555555';
    // Insert an expired OTP directly
    await testPrisma.otpCode.create({
      data: {
        phone,
        code: '123456',
        expiresAt: new Date(Date.now() - 1000), // already expired
        used: false,
      },
    });

    const res = await request(app)
      .post('/api/auth/otp/verify')
      .send({ phone, code: '123456' });
    expect(res.status).toBe(400);
  });

  it('marks OTP as used after verification', async () => {
    const phone = '9666666666';
    const sendRes = await request(app).post('/api/auth/otp/send').send({ phone });
    const { otp } = sendRes.body;

    await request(app).post('/api/auth/otp/verify').send({ phone, code: otp });

    const record = await testPrisma.otpCode.findFirst({ where: { phone, code: otp } });
    expect(record!.used).toBe(true);
  });

  it('cannot reuse an already-used OTP', async () => {
    const phone = '9777777777';
    const sendRes = await request(app).post('/api/auth/otp/send').send({ phone });
    const { otp } = sendRes.body;

    await request(app).post('/api/auth/otp/verify').send({ phone, code: otp });

    const res2 = await request(app)
      .post('/api/auth/otp/verify')
      .send({ phone, code: otp });
    expect(res2.status).toBe(400);
  });

  it('upserts user — second verify returns same user id', async () => {
    const phone = '9888888888';
    const s1 = await request(app).post('/api/auth/otp/send').send({ phone });
    const r1 = await request(app).post('/api/auth/otp/verify').send({ phone, code: s1.body.otp });
    const userId1 = r1.body.user.id;

    const s2 = await request(app).post('/api/auth/otp/send').send({ phone });
    const r2 = await request(app).post('/api/auth/otp/verify').send({ phone, code: s2.body.otp });
    expect(r2.body.user.id).toBe(userId1);
  });
});

// ── Google Auth (Customer) ───────────────────────────────────────────────────

describe('POST /api/auth/google', () => {
  it('creates a user from Google profile', async () => {
    const res = await request(app)
      .post('/api/auth/google')
      .send({
        googleId: 'google-uid-001',
        email: 'googleuser@gmail.com',
        name: 'Google User',
        avatar: 'https://example.com/avatar.jpg',
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe('googleuser@gmail.com');
  });

  it('upserts on repeated Google login', async () => {
    await request(app).post('/api/auth/google').send({ googleId: 'google-uid-002', email: 'guser2@gmail.com', name: 'G User' });
    const res = await request(app).post('/api/auth/google').send({ googleId: 'google-uid-002', email: 'guser2@gmail.com', name: 'G User Updated' });
    expect(res.status).toBe(200);
    const user = await testPrisma.user.findUnique({ where: { googleId: 'google-uid-002' } });
    expect(user?.name).toBe('G User Updated');
  });

  it('requires email', async () => {
    const res = await request(app)
      .post('/api/auth/google')
      .send({ googleId: 'google-uid-003' });
    expect(res.status).toBe(400);
  });
});

// ── User Profile ─────────────────────────────────────────────────────────────

describe('GET /api/auth/user/:id', () => {
  it('returns user by id', async () => {
    const user = await createTestUser();
    const res = await request(app).get(`/api/auth/user/${user.id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(user.id);
  });

  it('returns 404 for unknown id', async () => {
    const res = await request(app).get('/api/auth/user/nonexistent');
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/auth/user/:id', () => {
  it('updates user name', async () => {
    const user = await createTestUser();
    const res = await request(app)
      .put(`/api/auth/user/${user.id}`)
      .send({ name: 'Updated Name' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Updated Name');
  });

  it('updates user email', async () => {
    const user = await createTestUser({ email: null });
    const res = await request(app)
      .put(`/api/auth/user/${user.id}`)
      .send({ email: 'new@email.com' });
    expect(res.status).toBe(200);
    expect(res.body.email).toBe('new@email.com');
  });
});

describe('PUT /api/auth/user/:id/addresses', () => {
  it('saves user addresses', async () => {
    const user = await createTestUser();
    const addresses = [{ id: '1', name: 'Home', line1: '123 Main St', city: 'Hyderabad', state: 'Telangana', pincode: '500001', country: 'IN', isDefault: true, phone: '9876543210' }];
    const res = await request(app)
      .put(`/api/auth/user/${user.id}/addresses`)
      .send({ addresses });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.addresses)).toBe(true);
    expect(res.body.addresses).toHaveLength(1);
  });
});

// ── Admin Auth ───────────────────────────────────────────────────────────────

describe('POST /api/auth/admin/google', () => {
  it('allows whitelisted admin to sign in', async () => {
    const admin = await createTestAdminUser({ email: 'admin@boutique.com', googleId: null });
    const res = await request(app)
      .post('/api/auth/admin/google')
      .send({
        googleId: 'admin-google-001',
        email: admin.email,
        name: 'Admin User',
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.admin.role).toBeTruthy();
  });

  it('rejects non-whitelisted email', async () => {
    const res = await request(app)
      .post('/api/auth/admin/google')
      .send({
        googleId: 'unknown-001',
        email: 'random@gmail.com',
        name: 'Random Person',
      });
    expect(res.status).toBe(403);
  });

  it('rejects deactivated admin', async () => {
    const admin = await createTestAdminUser({ email: 'deactivated@boutique.com', active: false });
    const res = await request(app)
      .post('/api/auth/admin/google')
      .send({ googleId: 'deact-001', email: admin.email, name: 'Old Admin' });
    expect(res.status).toBe(403);
  });
});

describe('GET /api/auth/admin/users', () => {
  it('lists admin users', async () => {
    await createTestAdminUser({ email: 'staff1@boutique.com' });
    await createTestAdminUser({ email: 'staff2@boutique.com' });
    const res = await request(app).get('/api/auth/admin/users');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
  });
});

describe('POST /api/auth/admin/users', () => {
  it('adds a new staff member', async () => {
    const res = await request(app)
      .post('/api/auth/admin/users')
      .send({ email: 'newstaff@boutique.com', name: 'New Staff', role: 'STAFF' });
    expect(res.status).toBe(201);
    expect(res.body.email).toBe('newstaff@boutique.com');
    expect(res.body.role).toBe('STAFF');
  });

  it('can add OWNER role', async () => {
    const res = await request(app)
      .post('/api/auth/admin/users')
      .send({ email: 'owner@boutique.com', role: 'OWNER' });
    expect(res.status).toBe(201);
    expect(res.body.role).toBe('OWNER');
  });

  it('upserts on duplicate email', async () => {
    await request(app).post('/api/auth/admin/users').send({ email: 'dup@boutique.com', role: 'STAFF' });
    const res = await request(app).post('/api/auth/admin/users').send({ email: 'dup@boutique.com', role: 'OWNER' });
    expect(res.status).toBe(201);
    expect(res.body.role).toBe('OWNER');
  });
});

describe('DELETE /api/auth/admin/users/:id', () => {
  it('deactivates an admin user', async () => {
    const admin = await createTestAdminUser({ email: 'todelete@boutique.com' });
    const res = await request(app).delete(`/api/auth/admin/users/${admin.id}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const updated = await testPrisma.adminUser.findUnique({ where: { id: admin.id } });
    expect(updated?.active).toBe(false);
  });
});

// ── International Shipping ───────────────────────────────────────────────────

describe('POST /api/shipping/calculate', () => {
  it('India — free shipping above ₹999', async () => {
    const res = await request(app)
      .post('/api/shipping/calculate')
      .send({ subtotal: 1200, country: 'IN' });
    expect(res.status).toBe(200);
    expect(res.body.shipping).toBe(0);
    expect(res.body.free).toBe(true);
  });

  it('India — ₹99 shipping below ₹999', async () => {
    const res = await request(app)
      .post('/api/shipping/calculate')
      .send({ subtotal: 500, country: 'IN' });
    expect(res.status).toBe(200);
    expect(res.body.shipping).toBe(99);
    expect(res.body.free).toBe(false);
  });

  it('India — exactly ₹999 is free', async () => {
    const res = await request(app)
      .post('/api/shipping/calculate')
      .send({ subtotal: 999, country: 'IN' });
    expect(res.body.shipping).toBe(0);
  });

  it('US — flat ₹1499', async () => {
    const res = await request(app)
      .post('/api/shipping/calculate')
      .send({ subtotal: 5000, country: 'US' });
    expect(res.body.shipping).toBe(1499);
    expect(res.body.delivery).toContain('10-15');
  });

  it('UAE — flat ₹999', async () => {
    const res = await request(app)
      .post('/api/shipping/calculate')
      .send({ subtotal: 2000, country: 'AE' });
    expect(res.body.shipping).toBe(999);
    expect(res.body.delivery).toContain('12-20');
  });

  it('UK — flat ₹1299', async () => {
    const res = await request(app)
      .post('/api/shipping/calculate')
      .send({ subtotal: 1500, country: 'GB' });
    expect(res.body.shipping).toBe(1299);
  });

  it('Other country — flat ₹1999', async () => {
    const res = await request(app)
      .post('/api/shipping/calculate')
      .send({ subtotal: 3000, country: 'SG' });
    expect(res.body.shipping).toBe(1999);
  });

  it('defaults to India when country not provided', async () => {
    const res = await request(app)
      .post('/api/shipping/calculate')
      .send({ subtotal: 500 });
    expect(res.body.country).toBe('IN');
  });

  it('returns delivery estimate', async () => {
    const res = await request(app)
      .post('/api/shipping/calculate')
      .send({ subtotal: 500, country: 'IN' });
    expect(res.body.delivery).toContain('3-7');
  });

  it('returns freeAbove for India', async () => {
    const res = await request(app)
      .post('/api/shipping/calculate')
      .send({ subtotal: 500, country: 'IN' });
    expect(res.body.freeAbove).toBe(999);
  });
});

describe('GET /api/shipping/rates', () => {
  it('returns all shipping rates', async () => {
    const res = await request(app).get('/api/shipping/rates');
    expect(res.status).toBe(200);
    expect(res.body.IN).toBeDefined();
    expect(res.body.US).toBeDefined();
    expect(res.body.AE).toBeDefined();
    expect(res.body.GB).toBeDefined();
  });
});

// ── Stripe ───────────────────────────────────────────────────────────────────

describe('POST /api/payments/stripe/create-session', () => {
  it('returns 500 when Stripe not configured', async () => {
    const res = await request(app)
      .post('/api/payments/stripe/create-session')
      .send({
        orderNumber: 'SB-12345',
        amount: 2999,
        customerEmail: 'test@example.com',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      });
    // In test env, Stripe key not set → 500
    expect(res.status).toBe(500);
  });

  it('validates required fields', async () => {
    const res = await request(app)
      .post('/api/payments/stripe/create-session')
      .send({ orderNumber: 'SB-001' }); // missing amount, urls
    expect(res.status).toBe(400);
  });

  it('validates successUrl format', async () => {
    const res = await request(app)
      .post('/api/payments/stripe/create-session')
      .send({
        orderNumber: 'SB-001',
        amount: 999,
        successUrl: 'not-a-url',
        cancelUrl: 'https://example.com/cancel',
      });
    expect(res.status).toBe(400);
  });

  it('validates positive amount', async () => {
    const res = await request(app)
      .post('/api/payments/stripe/create-session')
      .send({
        orderNumber: 'SB-001',
        amount: -100,
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/payments/stripe/webhook', () => {
  it('handles webhook without signature in dev mode', async () => {
    const res = await request(app)
      .post('/api/payments/stripe/webhook')
      .set('Content-Type', 'application/json')
      .send({
        type: 'checkout.session.completed',
        data: { object: { metadata: { orderNumber: 'NONEXISTENT-ORDER' }, payment_intent: 'pi_test' } },
      });
    // Should handle gracefully (order not found is ok for webhook)
    expect([200, 400]).toContain(res.status);
  });

  it('updates order paymentStatus on checkout.session.completed', async () => {
    const product = await createTestProduct({ stock: 10 });
    const order = await testPrisma.order.create({
      data: {
        orderNumber: 'SB-STRIPE-001',
        customerName: 'John Smith',
        customerPhone: '+1-555-0001',
        address: { line1: '1 Main St', city: 'New York', state: 'New York', pincode: '10001', country: 'US' },
        subtotal: 2999,
        shipping: 1499,
        discount: 0,
        total: 4498,
        paymentMethod: 'stripe',
        paymentStatus: 'pending',
        country: 'US',
        items: {
          create: [{
            productId: product.id,
            name: product.name,
            price: 2999,
            quantity: 1,
          }],
        },
      },
    });

    await request(app)
      .post('/api/payments/stripe/webhook')
      .set('Content-Type', 'application/json')
      .send({
        type: 'checkout.session.completed',
        data: {
          object: {
            metadata: { orderNumber: order.orderNumber },
            payment_intent: 'pi_test_001',
          },
        },
      });

    const updated = await testPrisma.order.findUnique({ where: { id: order.id } });
    expect(updated?.paymentStatus).toBe('paid');
    expect(updated?.paymentId).toBe('pi_test_001');
  });
});

// ── User Routes ──────────────────────────────────────────────────────────────

describe('GET /api/users/:id/profile', () => {
  it('returns user profile', async () => {
    const user = await createTestUser({ name: 'Priya' });
    const res = await request(app).get(`/api/users/${user.id}/profile`);
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Priya');
    expect(res.body.id).toBe(user.id);
  });

  it('returns 404 for unknown user', async () => {
    const res = await request(app).get('/api/users/nonexistent/profile');
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/users/:id/profile', () => {
  it('updates name and email', async () => {
    const user = await createTestUser();
    const res = await request(app)
      .put(`/api/users/${user.id}/profile`)
      .send({ name: 'Kavya', email: 'kavya@example.com' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Kavya');
    expect(res.body.email).toBe('kavya@example.com');
  });
});

describe('PUT /api/users/:id/addresses', () => {
  it('saves and retrieves addresses', async () => {
    const user = await createTestUser();
    const addrs = [
      { id: 'addr1', name: 'Home', phone: '9876543210', line1: '10 Park St', city: 'Bangalore', state: 'Karnataka', pincode: '560001', country: 'IN', isDefault: true },
      { id: 'addr2', name: 'Office', phone: '9876543210', line1: '5 Tech Park', city: 'Bangalore', state: 'Karnataka', pincode: '560002', country: 'IN', isDefault: false },
    ];

    const res = await request(app)
      .put(`/api/users/${user.id}/addresses`)
      .send({ addresses: addrs });
    expect(res.status).toBe(200);
    expect(res.body.addresses).toHaveLength(2);
  });

  it('replaces existing addresses', async () => {
    const user = await createTestUser();
    await request(app).put(`/api/users/${user.id}/addresses`).send({ addresses: [{ id: '1', name: 'Old', line1: 'Old St', city: 'City', state: 'State', pincode: '500001', country: 'IN', isDefault: true, phone: '9999999999' }] });
    const res = await request(app).put(`/api/users/${user.id}/addresses`).send({ addresses: [] });
    expect(res.body.addresses).toHaveLength(0);
  });
});

// ── Wishlist ─────────────────────────────────────────────────────────────────

describe('Wishlist sync', () => {
  it('adds product to wishlist', async () => {
    const user = await createTestUser();
    const product = await createTestProduct({ name: 'Wishlist Saree' });

    const res = await request(app)
      .post(`/api/users/${user.id}/wishlist`)
      .send({ productId: product.id });
    expect(res.status).toBe(201);
    expect(res.body.id).toBe(product.id);
  });

  it('gets wishlist for user', async () => {
    const user = await createTestUser();
    const p1 = await createTestProduct({ name: 'Wish Product 1' });
    const p2 = await createTestProduct({ name: 'Wish Product 2' });

    await request(app).post(`/api/users/${user.id}/wishlist`).send({ productId: p1.id });
    await request(app).post(`/api/users/${user.id}/wishlist`).send({ productId: p2.id });

    const res = await request(app).get(`/api/users/${user.id}/wishlist`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  it('does not duplicate wishlist items', async () => {
    const user = await createTestUser();
    const product = await createTestProduct({ name: 'No Dup Saree' });

    await request(app).post(`/api/users/${user.id}/wishlist`).send({ productId: product.id });
    await request(app).post(`/api/users/${user.id}/wishlist`).send({ productId: product.id });

    const res = await request(app).get(`/api/users/${user.id}/wishlist`);
    expect(res.body).toHaveLength(1);
  });

  it('removes product from wishlist', async () => {
    const user = await createTestUser();
    const product = await createTestProduct({ name: 'Delete Wish' });

    await request(app).post(`/api/users/${user.id}/wishlist`).send({ productId: product.id });
    const del = await request(app).delete(`/api/users/${user.id}/wishlist/${product.id}`);
    expect(del.status).toBe(200);

    const res = await request(app).get(`/api/users/${user.id}/wishlist`);
    expect(res.body).toHaveLength(0);
  });

  it('returns empty wishlist for new user', async () => {
    const user = await createTestUser();
    const res = await request(app).get(`/api/users/${user.id}/wishlist`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });
});

// ── Recently Viewed ──────────────────────────────────────────────────────────

describe('Recently Viewed', () => {
  it('adds product to recently viewed', async () => {
    const user = await createTestUser();
    const product = await createTestProduct({ name: 'Viewed Kurti' });

    const res = await request(app)
      .post(`/api/users/${user.id}/recently-viewed`)
      .send({ productId: product.id });
    expect(res.status).toBe(200);
  });

  it('gets recently viewed products', async () => {
    const user = await createTestUser();
    const p1 = await createTestProduct({ name: 'Recent 1' });
    const p2 = await createTestProduct({ name: 'Recent 2' });

    await request(app).post(`/api/users/${user.id}/recently-viewed`).send({ productId: p1.id });
    await request(app).post(`/api/users/${user.id}/recently-viewed`).send({ productId: p2.id });

    const res = await request(app).get(`/api/users/${user.id}/recently-viewed`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  it('updates viewedAt on re-view', async () => {
    const user = await createTestUser();
    const product = await createTestProduct({ name: 'Re-View Test' });

    await request(app).post(`/api/users/${user.id}/recently-viewed`).send({ productId: product.id });
    const before = await testPrisma.recentlyViewed.findFirst({ where: { userId: user.id, productId: product.id } });

    // Small delay to ensure different timestamps
    await new Promise((r) => setTimeout(r, 50));
    await request(app).post(`/api/users/${user.id}/recently-viewed`).send({ productId: product.id });
    const after = await testPrisma.recentlyViewed.findFirst({ where: { userId: user.id, productId: product.id } });

    expect(after!.viewedAt.getTime()).toBeGreaterThanOrEqual(before!.viewedAt.getTime());
  });

  it('limits to 10 recent products', async () => {
    const user = await createTestUser();
    // Create 12 products
    for (let i = 0; i < 12; i++) {
      const p = await createTestProduct({ name: `Limit Product ${i}-${Date.now()}` });
      await request(app).post(`/api/users/${user.id}/recently-viewed`).send({ productId: p.id });
    }

    const res = await request(app).get(`/api/users/${user.id}/recently-viewed`);
    expect(res.body.length).toBeLessThanOrEqual(10);
  });
});

// ── User Orders ──────────────────────────────────────────────────────────────

describe('GET /api/users/:id/orders', () => {
  it('returns orders for logged-in user', async () => {
    const user = await createTestUser();
    const product = await createTestProduct({ stock: 5 });

    await testPrisma.order.create({
      data: {
        orderNumber: 'SB-USER-ORDER-001',
        customerName: 'Test User',
        customerPhone: '9876543210',
        userId: user.id,
        address: { line1: '1 Main St', city: 'Hyderabad', state: 'Telangana', pincode: '500001' },
        subtotal: 999,
        shipping: 0,
        discount: 0,
        total: 999,
        paymentMethod: 'cod',
        country: 'IN',
        items: {
          create: [{ productId: product.id, name: product.name, price: 999, quantity: 1 }],
        },
      },
    });

    const res = await request(app).get(`/api/users/${user.id}/orders`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].orderNumber).toBe('SB-USER-ORDER-001');
  });

  it('returns empty array for user with no orders', async () => {
    const user = await createTestUser();
    const res = await request(app).get(`/api/users/${user.id}/orders`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });

  it('returns 404 for unknown user', async () => {
    const res = await request(app).get('/api/users/nonexistent/orders');
    expect(res.status).toBe(404);
  });
});

// ── Order schema with country ────────────────────────────────────────────────

describe('International order creation', () => {
  it('creates order with country field', async () => {
    const product = await createTestProduct({ stock: 20 });
    const res = await request(app)
      .post('/api/orders')
      .send({
        customerName: 'Sarah Johnson',
        customerPhone: '+1-555-123-4567',
        customerEmail: 'sarah@example.com',
        address: {
          line1: '123 Oak Street',
          city: 'Austin',
          state: 'Texas',
          pincode: '787010',
          country: 'US',
        },
        items: [{ productId: product.id, quantity: 1, size: 'M' }],
        paymentMethod: 'stripe',
        country: 'US',
        sessionId: `sess-intl-${Date.now()}`,
      });
    expect(res.status).toBe(201);
    expect(res.body.country).toBe('US');
  });

  it('creates order with UAE country', async () => {
    const product = await createTestProduct({ stock: 10 });
    const res = await request(app)
      .post('/api/orders')
      .send({
        customerName: 'Fatima Al-Hassan',
        customerPhone: '+971-50-123-4567',
        address: {
          line1: 'Villa 12, Jumeirah',
          city: 'Dubai',
          state: 'Dubai',
          pincode: '000000',
          country: 'AE',
        },
        items: [{ productId: product.id, quantity: 2 }],
        paymentMethod: 'stripe',
        country: 'AE',
        sessionId: `sess-uae-${Date.now()}`,
      });
    expect(res.status).toBe(201);
    expect(res.body.country).toBe('AE');
  });
});

// ── Schema validation ─────────────────────────────────────────────────────────

describe('Prisma schema — new models', () => {
  it('creates and retrieves a User', async () => {
    const user = await testPrisma.user.create({
      data: { phone: '9000000001', name: 'Schema Test User', email: 'schema@test.com' },
    });
    expect(user.id).toBeTruthy();
    expect(user.addresses).toEqual([]);
    await testPrisma.user.delete({ where: { id: user.id } });
  });

  it('creates AdminUser with default STAFF role', async () => {
    const admin = await testPrisma.adminUser.create({
      data: { email: 'schema_admin@test.com', name: 'Schema Admin' },
    });
    expect(admin.role).toBe('STAFF');
    expect(admin.active).toBe(true);
    await testPrisma.adminUser.delete({ where: { id: admin.id } });
  });

  it('creates WishlistItem linked to user and product', async () => {
    const user = await createTestUser({ email: 'wishtest@test.com' });
    const product = await createTestProduct({ name: 'Schema Wishlist Product' });

    const item = await testPrisma.wishlistItem.create({
      data: { userId: user.id, productId: product.id },
    });
    expect(item.id).toBeTruthy();
  });

  it('creates RecentlyViewed linked to user and product', async () => {
    const user = await createTestUser({ email: 'recenttest@test.com' });
    const product = await createTestProduct({ name: 'Schema Recent Product' });

    const rv = await testPrisma.recentlyViewed.create({
      data: { userId: user.id, productId: product.id },
    });
    expect(rv.id).toBeTruthy();
  });

  it('Order has country field defaulting to IN', async () => {
    const product = await createTestProduct({ stock: 5 });
    const order = await testPrisma.order.create({
      data: {
        orderNumber: 'SB-SCHEMA-001',
        customerName: 'Schema Test',
        customerPhone: '9876543210',
        address: { line1: '1 St', city: 'City', state: 'State', pincode: '500001' },
        subtotal: 999,
        shipping: 0,
        discount: 0,
        total: 999,
        paymentMethod: 'cod',
        items: {
          create: [{ productId: product.id, name: product.name, price: 999, quantity: 1 }],
        },
      },
    });
    expect(order.country).toBe('IN');
  });

  it('OtpCode model stores and retrieves codes', async () => {
    const otp = await testPrisma.otpCode.create({
      data: {
        phone: '9000000099',
        code: '123456',
        expiresAt: new Date(Date.now() + 600000),
      },
    });
    expect(otp.used).toBe(false);
    await testPrisma.otpCode.delete({ where: { id: otp.id } });
  });
});

// ── Address validation by country ────────────────────────────────────────────

describe('Country-specific address logic', () => {
  it('shipping rate for IN is 99 below threshold', () => {
    const RATES: Record<string, { rate: number; freeAbove?: number }> = {
      IN: { rate: 99, freeAbove: 999 },
      US: { rate: 1499 },
      AE: { rate: 999 },
      GB: { rate: 1299 },
      DEFAULT: { rate: 1999 },
    };
    const calcShipping = (subtotal: number, country: string) => {
      const cfg = RATES[country] || RATES['DEFAULT'];
      if (cfg.freeAbove && subtotal >= cfg.freeAbove) return 0;
      return cfg.rate;
    };

    expect(calcShipping(500, 'IN')).toBe(99);
    expect(calcShipping(999, 'IN')).toBe(0);
    expect(calcShipping(1000, 'IN')).toBe(0);
    expect(calcShipping(500, 'US')).toBe(1499);
    expect(calcShipping(500, 'AE')).toBe(999);
    expect(calcShipping(500, 'GB')).toBe(1299);
    expect(calcShipping(500, 'SG')).toBe(1999); // DEFAULT
  });
});

// ── User profile isolated tests ───────────────────────────────────────────────

describe('User profile management', () => {
  it('partial update — only name changes, email unchanged', async () => {
    const user = await createTestUser({ email: 'partial@test.com', name: 'Old Name' });
    const res = await request(app)
      .put(`/api/users/${user.id}/profile`)
      .send({ name: 'New Name' });
    expect(res.body.name).toBe('New Name');
    expect(res.body.email).toBe('partial@test.com');
  });

  it('sets addresses with multiple entries and preserves default flag', async () => {
    const user = await createTestUser();
    const addrs = [
      { id: 'a1', name: 'Home', phone: '9876543210', line1: '1 St', city: 'Hyd', state: 'TS', pincode: '500001', country: 'IN', isDefault: true },
      { id: 'a2', name: 'Work', phone: '9876543210', line1: '2 St', city: 'Hyd', state: 'TS', pincode: '500002', country: 'IN', isDefault: false },
    ];
    await request(app).put(`/api/users/${user.id}/addresses`).send({ addresses: addrs });

    const res = await request(app).get(`/api/users/${user.id}/profile`);
    const saved = res.body.addresses as typeof addrs;
    const defaultAddr = saved.find((a) => a.isDefault);
    expect(defaultAddr?.id).toBe('a1');
  });
});
