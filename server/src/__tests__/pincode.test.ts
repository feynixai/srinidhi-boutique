/**
 * Pincode delivery check API tests
 */
import request from 'supertest';
import { app } from '../index';
import { createTestPincodeZone, cleanupTest, testPrisma } from './helpers';

beforeEach(async () => {
  await cleanupTest();
});

afterAll(async () => {
  await cleanupTest();
  await testPrisma.$disconnect();
});

describe('GET /api/pincode/:pincode', () => {
  it('returns delivery info for known pincode from DB', async () => {
    await createTestPincodeZone({ pincode: '500033', city: 'Hyderabad', state: 'Telangana', deliveryDays: 2, available: true });

    const res = await request(app).get('/api/pincode/500033');
    expect(res.status).toBe(200);
    expect(res.body.available).toBe(true);
    expect(res.body.city).toBe('Hyderabad');
    expect(res.body.deliveryDays).toBe(2);
    expect(res.body.deliveryDate).toBeDefined();
  });

  it('returns unavailable for pincode marked unavailable', async () => {
    await createTestPincodeZone({ pincode: '999999', available: false });

    const res = await request(app).get('/api/pincode/999999');
    expect(res.status).toBe(200);
    expect(res.body.available).toBe(false);
  });

  it('falls back to prefix matching for unknown pincode', async () => {
    const res = await request(app).get('/api/pincode/500123');
    expect(res.status).toBe(200);
    expect(res.body.available).toBe(true);
    expect(res.body.deliveryDays).toBeDefined();
  });

  it('returns default delivery for completely unknown pincode', async () => {
    const res = await request(app).get('/api/pincode/123456');
    expect(res.status).toBe(200);
    expect(res.body.available).toBe(true);
    expect(res.body.deliveryDays).toBe(7);
  });

  it('returns 400 for invalid pincode format', async () => {
    const res = await request(app).get('/api/pincode/12345');
    expect(res.status).toBe(400);
  });

  it('returns 400 for non-numeric pincode', async () => {
    const res = await request(app).get('/api/pincode/ABCDEF');
    expect(res.status).toBe(400);
  });

  it('includes deliveryDate string', async () => {
    const res = await request(app).get('/api/pincode/400001');
    expect(res.status).toBe(200);
    expect(typeof res.body.deliveryDate).toBe('string');
    expect(res.body.deliveryDate.length).toBeGreaterThan(0);
  });

  it('returns faster delivery for Hyderabad (500 prefix)', async () => {
    const res = await request(app).get('/api/pincode/500034');
    expect(res.status).toBe(200);
    expect(res.body.deliveryDays).toBeLessThanOrEqual(3);
  });
});
