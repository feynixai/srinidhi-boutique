import request from 'supertest';
import { app } from '../index';
import { createTestCoupon, cleanupTest, testPrisma } from './helpers';

beforeEach(async () => {
  await cleanupTest();
});

afterAll(async () => {
  await cleanupTest();
});

describe('POST /api/coupons/validate', () => {
  it('validates a valid coupon', async () => {
    await createTestCoupon({ code: 'VALID10', discount: 10, minOrder: 500 });

    const res = await request(app).post('/api/coupons/validate').send({
      code: 'VALID10',
      orderAmount: 1000,
    });

    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
    expect(res.body.discount).toBe(10);
    expect(res.body.discountAmount).toBe(100);
  });

  it('rejects invalid coupon code', async () => {
    const res = await request(app).post('/api/coupons/validate').send({
      code: 'INVALID',
      orderAmount: 1000,
    });

    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(false);
  });

  it('rejects expired coupon', async () => {
    await createTestCoupon({
      code: 'EXPIRED',
      discount: 15,
      expiresAt: new Date('2020-01-01'),
    });

    const res = await request(app).post('/api/coupons/validate').send({
      code: 'EXPIRED',
      orderAmount: 1000,
    });

    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(false);
    expect(res.body.message).toContain('expired');
  });

  it('rejects coupon below minimum order', async () => {
    await createTestCoupon({ code: 'MINORDER', discount: 20, minOrder: 2000 });

    const res = await request(app).post('/api/coupons/validate').send({
      code: 'MINORDER',
      orderAmount: 500,
    });

    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(false);
    expect(res.body.message).toContain('Minimum');
  });

  it('rejects inactive coupon', async () => {
    await createTestCoupon({ code: 'INACTIVE', discount: 10, active: false });

    const res = await request(app).post('/api/coupons/validate').send({
      code: 'INACTIVE',
      orderAmount: 1000,
    });

    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(false);
  });

  it('rejects coupon that reached max uses', async () => {
    await createTestCoupon({ code: 'MAXUSED', discount: 10, maxUses: 5, usedCount: 5 });

    const res = await request(app).post('/api/coupons/validate').send({
      code: 'MAXUSED',
      orderAmount: 1000,
    });

    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(false);
  });

  it('is case-insensitive for coupon code', async () => {
    await createTestCoupon({ code: 'UPPER20', discount: 20 });

    const res = await request(app).post('/api/coupons/validate').send({
      code: 'upper20',
      orderAmount: 1000,
    });

    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
  });
});
