/**
 * Build 12 tests — GST system, bulk product ops, delivery slots, order cancellation,
 * coupon enhancements, stock notifications, order notes, data export, admin notes.
 * Target: 925+ total tests (~100 new)
 */
import request from 'supertest';
import { app } from '../index';
import {
  createTestProduct,
  createTestUser,
  cleanupTest,
  testPrisma,
  createTestCategory,
  createTestCoupon,
} from './helpers';

beforeEach(async () => {
  await cleanupTest();
  await testPrisma.storeCredit.deleteMany({});
});

afterAll(async () => {
  await testPrisma.storeCredit.deleteMany({});
  await cleanupTest();
});

// ── Bulk Product Operations ────────────────────────────────────────────────

describe('Bulk Product Operations — set_price', () => {
  it('sets a flat price on multiple products', async () => {
    const p1 = await createTestProduct({ name: 'BulkA', price: 500 });
    const p2 = await createTestProduct({ name: 'BulkB', price: 800 });

    const res = await request(app)
      .post('/api/admin/products/bulk')
      .send({ ids: [p1.id, p2.id], action: 'set_price', value: 999 });

    expect(res.status).toBe(200);
    expect(res.body.updatedCount).toBe(2);

    const updated = await testPrisma.product.findUnique({ where: { id: p1.id } });
    expect(Number(updated!.price)).toBe(999);
  });

  it('increases price by flat amount', async () => {
    const p = await createTestProduct({ name: 'BulkC', price: 1000 });

    const res = await request(app)
      .post('/api/admin/products/bulk')
      .send({ ids: [p.id], action: 'increase_price', value: 200, isPercent: false });

    expect(res.status).toBe(200);
    const updated = await testPrisma.product.findUnique({ where: { id: p.id } });
    expect(Number(updated!.price)).toBe(1200);
  });

  it('increases price by percentage', async () => {
    const p = await createTestProduct({ name: 'BulkD', price: 1000 });

    const res = await request(app)
      .post('/api/admin/products/bulk')
      .send({ ids: [p.id], action: 'increase_price', value: 10, isPercent: true });

    expect(res.status).toBe(200);
    const updated = await testPrisma.product.findUnique({ where: { id: p.id } });
    expect(Number(updated!.price)).toBeCloseTo(1100);
  });

  it('decreases price by flat amount', async () => {
    const p = await createTestProduct({ name: 'BulkE', price: 1000 });

    const res = await request(app)
      .post('/api/admin/products/bulk')
      .send({ ids: [p.id], action: 'decrease_price', value: 100, isPercent: false });

    expect(res.status).toBe(200);
    const updated = await testPrisma.product.findUnique({ where: { id: p.id } });
    expect(Number(updated!.price)).toBe(900);
  });

  it('decreases price by percentage', async () => {
    const p = await createTestProduct({ name: 'BulkF', price: 1000 });

    const res = await request(app)
      .post('/api/admin/products/bulk')
      .send({ ids: [p.id], action: 'decrease_price', value: 20, isPercent: true });

    expect(res.status).toBe(200);
    const updated = await testPrisma.product.findUnique({ where: { id: p.id } });
    expect(Number(updated!.price)).toBeCloseTo(800);
  });
});

describe('Bulk Product Operations — toggle_active', () => {
  it('toggles active state on products', async () => {
    const p = await createTestProduct({ name: 'BulkToggle', active: true });

    const res = await request(app)
      .post('/api/admin/products/bulk')
      .send({ ids: [p.id], action: 'toggle_active' });

    expect(res.status).toBe(200);
    expect(res.body.updatedCount).toBe(1);
    const updated = await testPrisma.product.findUnique({ where: { id: p.id } });
    expect(updated!.active).toBe(false);
  });

  it('toggles back to active', async () => {
    const p = await createTestProduct({ name: 'BulkToggle2', active: false });

    await request(app)
      .post('/api/admin/products/bulk')
      .send({ ids: [p.id], action: 'toggle_active' });

    const updated = await testPrisma.product.findUnique({ where: { id: p.id } });
    expect(updated!.active).toBe(true);
  });
});

describe('Bulk Product Operations — set_category', () => {
  it('changes category for multiple products', async () => {
    const cat = await createTestCategory('Bulk Category');
    const p1 = await createTestProduct({ name: 'BulkCat1' });
    const p2 = await createTestProduct({ name: 'BulkCat2' });

    const res = await request(app)
      .post('/api/admin/products/bulk')
      .send({ ids: [p1.id, p2.id], action: 'set_category', value: cat.id });

    expect(res.status).toBe(200);
    expect(res.body.updatedCount).toBe(2);

    const updated = await testPrisma.product.findUnique({ where: { id: p1.id } });
    expect(updated!.categoryId).toBe(cat.id);
  });

  it('returns 404 for invalid category', async () => {
    const p = await createTestProduct({ name: 'BulkCatFail' });

    const res = await request(app)
      .post('/api/admin/products/bulk')
      .send({ ids: [p.id], action: 'set_category', value: 'nonexistent-id' });

    expect(res.status).toBe(404);
  });
});

describe('Bulk Product Operations — apply_sale', () => {
  it('applies sale discount to products', async () => {
    const p = await createTestProduct({ name: 'BulkSale' });

    const res = await request(app)
      .post('/api/admin/products/bulk')
      .send({ ids: [p.id], action: 'apply_sale', value: 20 });

    expect(res.status).toBe(200);
    const updated = await testPrisma.product.findUnique({ where: { id: p.id } });
    expect(updated!.onOffer).toBe(true);
    expect(updated!.offerPercent).toBe(20);
  });

  it('removes sale when value is 0', async () => {
    const p = await createTestProduct({ name: 'BulkSaleRemove', onOffer: true, offerPercent: 15 });

    const res = await request(app)
      .post('/api/admin/products/bulk')
      .send({ ids: [p.id], action: 'apply_sale', value: 0 });

    expect(res.status).toBe(200);
    const updated = await testPrisma.product.findUnique({ where: { id: p.id } });
    expect(updated!.onOffer).toBe(false);
  });

  it('rejects invalid sale percent', async () => {
    const p = await createTestProduct({ name: 'BulkSaleInvalid' });

    const res = await request(app)
      .post('/api/admin/products/bulk')
      .send({ ids: [p.id], action: 'apply_sale', value: 150 });

    expect(res.status).toBe(400);
  });
});

describe('Bulk Product Operations — set_stock', () => {
  it('sets stock level on multiple products', async () => {
    const p1 = await createTestProduct({ name: 'BulkStock1', stock: 10 });
    const p2 = await createTestProduct({ name: 'BulkStock2', stock: 5 });

    const res = await request(app)
      .post('/api/admin/products/bulk')
      .send({ ids: [p1.id, p2.id], action: 'set_stock', value: 100 });

    expect(res.status).toBe(200);
    const updated = await testPrisma.product.findUnique({ where: { id: p1.id } });
    expect(updated!.stock).toBe(100);
  });
});

describe('Bulk Product Operations — validation', () => {
  it('rejects empty ids array', async () => {
    const res = await request(app)
      .post('/api/admin/products/bulk')
      .send({ ids: [], action: 'set_price', value: 999 });

    expect(res.status).toBe(400);
  });

  it('rejects invalid action', async () => {
    const res = await request(app)
      .post('/api/admin/products/bulk')
      .send({ ids: ['some-id'], action: 'invalid_action' });

    expect(res.status).toBe(400);
  });
});

// ── GST System ────────────────────────────────────────────────────────────

describe('GST — category rate management', () => {
  it('sets GST rate on a category', async () => {
    const cat = await createTestCategory('GST Category');

    const res = await request(app)
      .patch(`/api/admin/categories/${cat.id}/gst-rate`)
      .send({ gstRate: 12 });

    expect(res.status).toBe(200);
    expect(res.body.gstRate).toBe(12);
  });

  it('rejects invalid GST rate (>100)', async () => {
    const cat = await createTestCategory('GST Cat Invalid');

    const res = await request(app)
      .patch(`/api/admin/categories/${cat.id}/gst-rate`)
      .send({ gstRate: 101 });

    expect(res.status).toBe(400);
  });

  it('returns 404 for nonexistent category', async () => {
    const res = await request(app)
      .patch('/api/admin/categories/nonexistent/gst-rate')
      .send({ gstRate: 5 });

    expect(res.status).toBe(404);
  });
});

describe('GST — preview endpoint', () => {
  it('returns GST breakdown for intra-state (Telangana → CGST+SGST)', async () => {
    const cat = await testPrisma.category.create({
      data: { name: 'GST Preview Cat', slug: `gst-preview-${Date.now()}`, gstRate: 5 },
    });

    const res = await request(app)
      .get(`/api/admin/gst-preview?categoryId=${cat.id}&subtotal=1000&state=Telangana`);

    expect(res.status).toBe(200);
    expect(res.body.type).toBe('CGST+SGST');
    expect(res.body.cgst).toBe(25);
    expect(res.body.sgst).toBe(25);
    expect(res.body.igst).toBe(0);
    expect(res.body.total).toBe(50);
  });

  it('returns IGST for inter-state', async () => {
    const cat = await testPrisma.category.create({
      data: { name: 'GST Inter Cat', slug: `gst-inter-${Date.now()}`, gstRate: 12 },
    });

    const res = await request(app)
      .get(`/api/admin/gst-preview?categoryId=${cat.id}&subtotal=1000&state=Maharashtra`);

    expect(res.status).toBe(200);
    expect(res.body.type).toBe('IGST');
    expect(res.body.igst).toBe(120);
    expect(res.body.cgst).toBe(0);
  });

  it('returns 400 if categoryId missing', async () => {
    const res = await request(app).get('/api/admin/gst-preview?subtotal=1000');
    expect(res.status).toBe(400);
  });

  it('returns 404 for nonexistent category', async () => {
    const res = await request(app)
      .get('/api/admin/gst-preview?categoryId=nonexistent&subtotal=1000');
    expect(res.status).toBe(404);
  });

  it('calculates 18% GST rate correctly', async () => {
    const cat = await testPrisma.category.create({
      data: { name: 'GST 18 Cat', slug: `gst-18-${Date.now()}`, gstRate: 18 },
    });

    const res = await request(app)
      .get(`/api/admin/gst-preview?categoryId=${cat.id}&subtotal=500&state=Karnataka`);

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(90); // 18% of 500
    expect(res.body.type).toBe('IGST');
  });
});

// ── Coupon Enhancements ───────────────────────────────────────────────────

describe('Coupon — flat discount type', () => {
  it('creates flat discount coupon via v2 endpoint', async () => {
    const res = await request(app)
      .post('/api/admin/coupons/v2')
      .send({
        code: `FLAT${Date.now()}`,
        discount: 150,
        type: 'flat',
        minOrder: 500,
        active: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.type).toBe('flat');
    expect(res.body.discount).toBe(150);
  });

  it('validates flat coupon — applies flat discount', async () => {
    const code = `FLATV${Date.now()}`;
    await testPrisma.coupon.create({
      data: { code, discount: 100, type: 'flat', active: true },
    });

    const res = await request(app)
      .post('/api/coupons/validate')
      .send({ code, orderAmount: 500 });

    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
    expect(res.body.discountAmount).toBe(100);
    expect(res.body.type).toBe('flat');
  });

  it('flat discount cannot exceed order amount', async () => {
    const code = `FLATBIG${Date.now()}`;
    await testPrisma.coupon.create({
      data: { code, discount: 1000, type: 'flat', active: true },
    });

    const res = await request(app)
      .post('/api/coupons/validate')
      .send({ code, orderAmount: 200 });

    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
    expect(res.body.discountAmount).toBe(200); // capped at order amount
  });
});

describe('Coupon — category-specific', () => {
  it('creates category-specific coupon', async () => {
    const cat = await createTestCategory('Saree Cat');

    const res = await request(app)
      .post('/api/admin/coupons/v2')
      .send({
        code: `SAREE${Date.now()}`,
        discount: 10,
        categoryId: cat.id,
        active: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.categoryId).toBe(cat.id);
  });

  it('rejects coupon for wrong category', async () => {
    const cat1 = await createTestCategory('Saree Cat2');
    const cat2 = await createTestCategory('Kurti Cat');
    const code = `CATCOUPON${Date.now()}`;
    await testPrisma.coupon.create({
      data: { code, discount: 15, active: true, categoryId: cat1.id },
    });

    const res = await request(app)
      .post('/api/coupons/validate')
      .send({ code, orderAmount: 500, categoryId: cat2.id });

    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(false);
    expect(res.body.message).toMatch(/only valid for/i);
  });

  it('accepts coupon for correct category', async () => {
    const cat = await createTestCategory('Saree Cat3');
    const code = `CATRIGHT${Date.now()}`;
    await testPrisma.coupon.create({
      data: { code, discount: 15, active: true, categoryId: cat.id },
    });

    const res = await request(app)
      .post('/api/coupons/validate')
      .send({ code, orderAmount: 500, categoryId: cat.id });

    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
  });
});

describe('Coupon — first-order only', () => {
  it('creates first-order-only coupon', async () => {
    const res = await request(app)
      .post('/api/admin/coupons/v2')
      .send({
        code: `FIRST${Date.now()}`,
        discount: 20,
        firstOrderOnly: true,
        active: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.firstOrderOnly).toBe(true);
  });

  it('rejects first-order coupon for returning user', async () => {
    const user = await createTestUser();
    // Create a prior order for the user
    const product = await createTestProduct({ name: 'FOProduct' });
    await testPrisma.order.create({
      data: {
        orderNumber: `SB-FO${Date.now()}`,
        customerName: 'Test', customerPhone: user.phone!,
        address: { line1: '1 St', city: 'Hyd', pincode: '500001' },
        subtotal: 999, shipping: 0, discount: 0, total: 999,
        paymentMethod: 'cod', status: 'delivered', userId: user.id,
        items: { create: [{ productId: product.id, name: product.name, price: 999, quantity: 1 }] },
      },
    });

    const code = `FIRSTFAIL${Date.now()}`;
    await testPrisma.coupon.create({
      data: { code, discount: 20, firstOrderOnly: true, active: true },
    });

    const res = await request(app)
      .post('/api/coupons/validate')
      .send({ code, orderAmount: 999, userId: user.id });

    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(false);
    expect(res.body.message).toMatch(/first order/i);
  });

  it('accepts first-order coupon for new user with no prior orders', async () => {
    const user = await createTestUser();
    const code = `FIRSTOK${Date.now()}`;
    await testPrisma.coupon.create({
      data: { code, discount: 20, firstOrderOnly: true, active: true },
    });

    const res = await request(app)
      .post('/api/coupons/validate')
      .send({ code, orderAmount: 999, userId: user.id });

    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
  });
});

describe('Coupon — user-specific', () => {
  it('creates user-specific coupon via v2', async () => {
    const user = await createTestUser();

    const res = await request(app)
      .post('/api/admin/coupons/v2')
      .send({
        code: `USER${Date.now()}`,
        discount: 25,
        userId: user.id,
        active: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.userId).toBe(user.id);
  });

  it('rejects user-specific coupon for wrong user', async () => {
    const user1 = await createTestUser();
    const user2 = await createTestUser();
    const code = `USERFAIL${Date.now()}`;
    await testPrisma.coupon.create({
      data: { code, discount: 25, active: true, userId: user1.id },
    });

    const res = await request(app)
      .post('/api/coupons/validate')
      .send({ code, orderAmount: 500, userId: user2.id });

    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(false);
    expect(res.body.message).toMatch(/not valid for your account/i);
  });

  it('accepts user-specific coupon for correct user', async () => {
    const user = await createTestUser();
    const code = `USEROK${Date.now()}`;
    await testPrisma.coupon.create({
      data: { code, discount: 25, active: true, userId: user.id },
    });

    const res = await request(app)
      .post('/api/coupons/validate')
      .send({ code, orderAmount: 500, userId: user.id });

    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
  });
});

describe('Coupon — countdown / expiry', () => {
  it('returns countdown text for coupon expiring in 3 days', async () => {
    const expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const code = `COUNTDOWN${Date.now()}`;
    await testPrisma.coupon.create({
      data: { code, discount: 10, active: true, expiresAt },
    });

    const res = await request(app)
      .post('/api/coupons/validate')
      .send({ code, orderAmount: 500 });

    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
    expect(res.body.countdownText).toMatch(/3 days/i);
    expect(res.body.expiresAt).toBeTruthy();
  });

  it('returns "Expires tomorrow" for coupon expiring in 1 day', async () => {
    const expiresAt = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000);
    const code = `TOMORROW${Date.now()}`;
    await testPrisma.coupon.create({
      data: { code, discount: 10, active: true, expiresAt },
    });

    const res = await request(app)
      .post('/api/coupons/validate')
      .send({ code, orderAmount: 500 });

    expect(res.status).toBe(200);
    expect(res.body.countdownText).toMatch(/tomorrow/i);
  });

  it('returns null countdownText for no-expiry coupons', async () => {
    const code = `NOEXPIRY${Date.now()}`;
    await testPrisma.coupon.create({
      data: { code, discount: 10, active: true },
    });

    const res = await request(app)
      .post('/api/coupons/validate')
      .send({ code, orderAmount: 500 });

    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
    expect(res.body.countdownText).toBeNull();
  });
});

// ── Delivery Slot Selection ───────────────────────────────────────────────

describe('Delivery Slot — order placement', () => {
  it('stores deliverySlot on order creation', async () => {
    const product = await createTestProduct({ name: 'SlotProd', stock: 20 });

    const res = await request(app)
      .post('/api/orders')
      .send({
        customerName: 'Slot Customer',
        customerPhone: '9111111111',
        address: { line1: '1 Main St', city: 'Hyderabad', pincode: '500001' },
        items: [{ productId: product.id, quantity: 1 }],
        paymentMethod: 'cod',
        deliverySlot: 'morning',
      });

    expect(res.status).toBe(201);
    expect(res.body.deliverySlot).toBe('morning');
  });

  it('stores afternoon slot', async () => {
    const product = await createTestProduct({ name: 'SlotProd2', stock: 20 });

    const res = await request(app)
      .post('/api/orders')
      .send({
        customerName: 'Slot Customer2',
        customerPhone: '9222222222',
        address: { line1: '2 Main St', city: 'Hyderabad', pincode: '500001' },
        items: [{ productId: product.id, quantity: 1 }],
        paymentMethod: 'cod',
        deliverySlot: 'afternoon',
      });

    expect(res.status).toBe(201);
    expect(res.body.deliverySlot).toBe('afternoon');
  });

  it('stores evening slot', async () => {
    const product = await createTestProduct({ name: 'SlotProd3', stock: 20 });

    const res = await request(app)
      .post('/api/orders')
      .send({
        customerName: 'Slot Customer3',
        customerPhone: '9333333333',
        address: { line1: '3 Main St', city: 'Hyderabad', pincode: '500001' },
        items: [{ productId: product.id, quantity: 1 }],
        paymentMethod: 'cod',
        deliverySlot: 'evening',
      });

    expect(res.status).toBe(201);
    expect(res.body.deliverySlot).toBe('evening');
  });

  it('order without slot still works', async () => {
    const product = await createTestProduct({ name: 'NoSlotProd', stock: 20 });

    const res = await request(app)
      .post('/api/orders')
      .send({
        customerName: 'No Slot Customer',
        customerPhone: '9444444444',
        address: { line1: '4 Main St', city: 'Hyderabad', pincode: '500001' },
        items: [{ productId: product.id, quantity: 1 }],
        paymentMethod: 'cod',
      });

    expect(res.status).toBe(201);
    expect(res.body.deliverySlot).toBeNull();
  });

  it('rejects invalid delivery slot', async () => {
    const product = await createTestProduct({ name: 'BadSlotProd', stock: 20 });

    const res = await request(app)
      .post('/api/orders')
      .send({
        customerName: 'Bad Slot',
        customerPhone: '9555555555',
        address: { line1: '5 Main St', city: 'Hyderabad', pincode: '500001' },
        items: [{ productId: product.id, quantity: 1 }],
        paymentMethod: 'cod',
        deliverySlot: 'midnight',
      });

    expect(res.status).toBe(400);
  });
});

// ── Order Cancellation ────────────────────────────────────────────────────

describe('Order Cancellation — basic', () => {
  it('cancels a placed order', async () => {
    const product = await createTestProduct({ name: 'CancelProd', stock: 10 });
    const order = await testPrisma.order.create({
      data: {
        orderNumber: `SB-CANCEL${Date.now()}`,
        customerName: 'Cancel Test',
        customerPhone: '9600000001',
        address: { line1: '1 St', city: 'Hyd', pincode: '500001' },
        subtotal: 999, shipping: 0, discount: 0, total: 999,
        paymentMethod: 'cod', status: 'placed',
        items: { create: [{ productId: product.id, name: product.name, price: 999, quantity: 2 }] },
      },
    });

    const res = await request(app).post(`/api/orders/${order.id}/cancel`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.order.status).toBe('cancelled');
  });

  it('cancels a confirmed order', async () => {
    const product = await createTestProduct({ name: 'CancelConfirmed', stock: 10 });
    const order = await testPrisma.order.create({
      data: {
        orderNumber: `SB-CANCELCONF${Date.now()}`,
        customerName: 'Cancel Confirmed',
        customerPhone: '9600000002',
        address: { line1: '1 St', city: 'Hyd', pincode: '500001' },
        subtotal: 999, shipping: 0, discount: 0, total: 999,
        paymentMethod: 'cod', status: 'confirmed',
        items: { create: [{ productId: product.id, name: product.name, price: 999, quantity: 1 }] },
      },
    });

    const res = await request(app).post(`/api/orders/${order.id}/cancel`);

    expect(res.status).toBe(200);
    expect(res.body.order.status).toBe('cancelled');
  });

  it('rejects cancellation after shipment', async () => {
    const product = await createTestProduct({ name: 'CancelShipped', stock: 10 });
    const order = await testPrisma.order.create({
      data: {
        orderNumber: `SB-CANCELSHIP${Date.now()}`,
        customerName: 'Cancel Shipped',
        customerPhone: '9600000003',
        address: { line1: '1 St', city: 'Hyd', pincode: '500001' },
        subtotal: 999, shipping: 0, discount: 0, total: 999,
        paymentMethod: 'cod', status: 'shipped',
        items: { create: [{ productId: product.id, name: product.name, price: 999, quantity: 1 }] },
      },
    });

    const res = await request(app).post(`/api/orders/${order.id}/cancel`);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/cannot cancel/i);
  });

  it('returns 404 for nonexistent order', async () => {
    const res = await request(app).post('/api/orders/nonexistent-order/cancel');
    expect(res.status).toBe(404);
  });

  it('restores stock when order is cancelled', async () => {
    const product = await createTestProduct({ name: 'CancelStock', stock: 10 });
    const order = await testPrisma.order.create({
      data: {
        orderNumber: `SB-CANCELSTOCK${Date.now()}`,
        customerName: 'Cancel Stock',
        customerPhone: '9600000004',
        address: { line1: '1 St', city: 'Hyd', pincode: '500001' },
        subtotal: 999, shipping: 0, discount: 0, total: 999,
        paymentMethod: 'cod', status: 'placed',
        items: { create: [{ productId: product.id, name: product.name, price: 999, quantity: 3 }] },
      },
    });

    await request(app).post(`/api/orders/${order.id}/cancel`);

    const updatedProduct = await testPrisma.product.findUnique({ where: { id: product.id } });
    expect(updatedProduct!.stock).toBe(13); // 10 + 3 restored
  });
});

describe('Order Cancellation — refund to store credit', () => {
  it('issues store credit for paid online order with userId', async () => {
    const user = await createTestUser();
    const product = await createTestProduct({ name: 'CancelOnline', stock: 10 });
    const order = await testPrisma.order.create({
      data: {
        orderNumber: `SB-CANCELONLINE${Date.now()}`,
        customerName: 'Cancel Online',
        customerPhone: user.phone!,
        address: { line1: '1 St', city: 'Hyd', pincode: '500001' },
        subtotal: 999, shipping: 0, discount: 0, total: 999,
        paymentMethod: 'razorpay', paymentStatus: 'paid', status: 'placed',
        userId: user.id,
        items: { create: [{ productId: product.id, name: product.name, price: 999, quantity: 1 }] },
      },
    });

    const res = await request(app).post(`/api/orders/${order.id}/cancel`);

    expect(res.status).toBe(200);
    expect(res.body.refund.type).toBe('store_credit');
    expect(res.body.refund.amount).toBe(999);

    const credit = await testPrisma.storeCredit.findFirst({ where: { userId: user.id } });
    expect(credit).toBeTruthy();
    expect(Number(credit!.amount)).toBe(999);
    expect(credit!.source).toBe('refund');
  });

  it('no refund for COD order', async () => {
    const user = await createTestUser();
    const product = await createTestProduct({ name: 'CancelCOD', stock: 10 });
    const order = await testPrisma.order.create({
      data: {
        orderNumber: `SB-CANCELCOD${Date.now()}`,
        customerName: 'Cancel COD',
        customerPhone: user.phone!,
        address: { line1: '1 St', city: 'Hyd', pincode: '500001' },
        subtotal: 599, shipping: 0, discount: 0, total: 599,
        paymentMethod: 'cod', status: 'placed', userId: user.id,
        items: { create: [{ productId: product.id, name: product.name, price: 599, quantity: 1 }] },
      },
    });

    const res = await request(app).post(`/api/orders/${order.id}/cancel`);

    expect(res.status).toBe(200);
    expect(res.body.refund.type).toBe('none');
    expect(res.body.refund.message).toMatch(/COD/i);
  });
});

// ── Stock Availability Notifications ─────────────────────────────────────

describe('Stock Notifications — subscribe', () => {
  it('subscribes via email for out-of-stock product', async () => {
    const product = await createTestProduct({ name: 'OOS Product', stock: 0 });

    const res = await request(app)
      .post('/api/inventory/back-in-stock')
      .send({ productId: product.id, email: 'notify@example.com' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.notificationId).toBeTruthy();
  });

  it('subscribes via phone for out-of-stock product', async () => {
    const product = await createTestProduct({ name: 'OOS Product2', stock: 0 });

    const res = await request(app)
      .post('/api/inventory/back-in-stock')
      .send({ productId: product.id, phone: '9876543210' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('tells user product is already in stock', async () => {
    const product = await createTestProduct({ name: 'In Stock Prod', stock: 10 });

    const res = await request(app)
      .post('/api/inventory/back-in-stock')
      .send({ productId: product.id, email: 'test@example.com' });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/already in stock/i);
  });
});

describe('Stock Notifications — admin view', () => {
  it('lists pending notifications', async () => {
    const product = await createTestProduct({ name: 'Notif Product', stock: 0 });
    await testPrisma.backInStockNotification.create({
      data: { productId: product.id, email: 'a@b.com', notified: false },
    });

    const res = await request(app).get('/api/admin/stock-notifications');

    expect(res.status).toBe(200);
    expect(res.body.notifications.length).toBeGreaterThan(0);
    expect(res.body.count).toBeGreaterThan(0);
  });

  it('filters by productId', async () => {
    const product = await createTestProduct({ name: 'FilterNotif', stock: 0 });
    await testPrisma.backInStockNotification.create({
      data: { productId: product.id, email: 'filter@b.com', notified: false },
    });

    const res = await request(app)
      .get(`/api/admin/stock-notifications?productId=${product.id}`);

    expect(res.status).toBe(200);
    const all = res.body.notifications as { productId: string }[];
    expect(all.every((n) => n.productId === product.id)).toBe(true);
  });

  it('marks notifications as sent', async () => {
    const product = await createTestProduct({ name: 'NotifyNow', stock: 5 });
    await testPrisma.backInStockNotification.create({
      data: { productId: product.id, email: 'send@b.com', notified: false },
    });

    const res = await request(app)
      .post(`/api/admin/stock-notifications/notify/${product.id}`);

    expect(res.status).toBe(200);
    expect(res.body.notified).toBeGreaterThan(0);
    expect(res.body.success).toBe(true);
  });

  it('returns 404 for nonexistent product in notify', async () => {
    const res = await request(app)
      .post('/api/admin/stock-notifications/notify/nonexistent');

    expect(res.status).toBe(404);
  });
});

// ── Order Notes ───────────────────────────────────────────────────────────

describe('Order Notes — customer notes at checkout', () => {
  it('stores customer note on order', async () => {
    const product = await createTestProduct({ name: 'NotesProd', stock: 10 });

    const res = await request(app)
      .post('/api/orders')
      .send({
        customerName: 'Notes Customer',
        customerPhone: '9700000001',
        address: { line1: '1 St', city: 'Hyd', pincode: '500001' },
        items: [{ productId: product.id, quantity: 1 }],
        paymentMethod: 'cod',
        notes: 'Please gift wrap this order',
      });

    expect(res.status).toBe(201);
    expect(res.body.notes).toBe('Please gift wrap this order');
  });

  it('updates notes on a placed order', async () => {
    const product = await createTestProduct({ name: 'NotesProd2', stock: 10 });
    const order = await testPrisma.order.create({
      data: {
        orderNumber: `SB-NOTES${Date.now()}`,
        customerName: 'Notes Update',
        customerPhone: '9700000002',
        address: { line1: '1 St', city: 'Hyd', pincode: '500001' },
        subtotal: 999, shipping: 0, discount: 0, total: 999,
        paymentMethod: 'cod', status: 'placed',
        items: { create: [{ productId: product.id, name: product.name, price: 999, quantity: 1 }] },
      },
    });

    const res = await request(app)
      .patch(`/api/orders/${order.id}/notes`)
      .send({ notes: 'Call before delivery' });

    expect(res.status).toBe(200);
    expect(res.body.notes).toBe('Call before delivery');
  });

  it('rejects note update on shipped order', async () => {
    const product = await createTestProduct({ name: 'NotesShipped', stock: 10 });
    const order = await testPrisma.order.create({
      data: {
        orderNumber: `SB-NOTESSHIP${Date.now()}`,
        customerName: 'Notes Shipped',
        customerPhone: '9700000003',
        address: { line1: '1 St', city: 'Hyd', pincode: '500001' },
        subtotal: 999, shipping: 0, discount: 0, total: 999,
        paymentMethod: 'cod', status: 'shipped',
        items: { create: [{ productId: product.id, name: product.name, price: 999, quantity: 1 }] },
      },
    });

    const res = await request(app)
      .patch(`/api/orders/${order.id}/notes`)
      .send({ notes: 'Too late' });

    expect(res.status).toBe(400);
  });
});

describe('Order Notes — admin internal notes', () => {
  it('admin adds internal note to order', async () => {
    const product = await createTestProduct({ name: 'AdminNotesProd', stock: 10 });
    const order = await testPrisma.order.create({
      data: {
        orderNumber: `SB-ADMINNOTES${Date.now()}`,
        customerName: 'Admin Notes',
        customerPhone: '9700000010',
        address: { line1: '1 St', city: 'Hyd', pincode: '500001' },
        subtotal: 999, shipping: 0, discount: 0, total: 999,
        paymentMethod: 'cod', status: 'placed',
        items: { create: [{ productId: product.id, name: product.name, price: 999, quantity: 1 }] },
      },
    });

    const res = await request(app)
      .patch(`/api/admin/orders/${order.id}/admin-notes`)
      .send({ adminNotes: 'VIP customer — handle with care' });

    expect(res.status).toBe(200);
    expect(res.body.adminNotes).toBe('VIP customer — handle with care');
  });

  it('clears admin notes with empty string', async () => {
    const product = await createTestProduct({ name: 'AdminNotesClear', stock: 10 });
    const order = await testPrisma.order.create({
      data: {
        orderNumber: `SB-ADMINCLEAR${Date.now()}`,
        customerName: 'Admin Clear',
        customerPhone: '9700000011',
        address: { line1: '1 St', city: 'Hyd', pincode: '500001' },
        subtotal: 999, shipping: 0, discount: 0, total: 999,
        paymentMethod: 'cod', status: 'placed', adminNotes: 'Old note',
        items: { create: [{ productId: product.id, name: product.name, price: 999, quantity: 1 }] },
      },
    });

    const res = await request(app)
      .patch(`/api/admin/orders/${order.id}/admin-notes`)
      .send({ adminNotes: '' });

    expect(res.status).toBe(200);
    expect(res.body.adminNotes).toBe('');
  });

  it('returns 404 for nonexistent order', async () => {
    const res = await request(app)
      .patch('/api/admin/orders/nonexistent/admin-notes')
      .send({ adminNotes: 'test' });

    expect(res.status).toBe(404);
  });
});

// ── Data Export CSV ───────────────────────────────────────────────────────

describe('Data Export — products', () => {
  it('exports products as CSV', async () => {
    await createTestProduct({ name: 'Export Prod A' });
    await createTestProduct({ name: 'Export Prod B' });

    const res = await request(app).get('/api/admin/export/products');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/);
    expect(res.text).toContain('id,name,price');
    expect(res.text).toContain('Export Prod A');
    expect(res.text).toContain('Export Prod B');
  });

  it('filters products by date range', async () => {
    await createTestProduct({ name: 'OldExport' });

    const from = new Date(Date.now() - 60 * 60 * 1000).toISOString(); // 1h ago
    const to = new Date().toISOString();

    const res = await request(app)
      .get(`/api/admin/export/products?from=${from}&to=${to}`);

    expect(res.status).toBe(200);
    expect(res.text).toContain('id,name');
  });
});

describe('Data Export — orders', () => {
  it('exports orders as CSV', async () => {
    const product = await createTestProduct({ name: 'ExportOrderProd', stock: 20 });
    await testPrisma.order.create({
      data: {
        orderNumber: `SB-CSVEXP${Date.now()}`,
        customerName: 'CSV Customer',
        customerPhone: '9800000001',
        address: { line1: '1 St', city: 'Hyd', pincode: '500001' },
        subtotal: 999, shipping: 0, discount: 0, total: 999,
        paymentMethod: 'cod', status: 'placed',
        items: { create: [{ productId: product.id, name: product.name, price: 999, quantity: 1 }] },
      },
    });

    const res = await request(app).get('/api/admin/export/orders');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/);
    expect(res.text).toContain('orderNumber,customerName');
    expect(res.text).toContain('CSV Customer');
  });

  it('exports orders with date filter', async () => {
    const from = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const to = new Date().toISOString();

    const res = await request(app)
      .get(`/api/admin/export/orders?from=${from}&to=${to}`);

    expect(res.status).toBe(200);
    expect(res.text).toContain('orderNumber');
  });
});

describe('Data Export — customers', () => {
  it('exports customers as CSV', async () => {
    const product = await createTestProduct({ name: 'CustExportProd', stock: 20 });
    await testPrisma.order.create({
      data: {
        orderNumber: `SB-CUSTEXP${Date.now()}`,
        customerName: 'Customer Export',
        customerPhone: '9811111111',
        address: { line1: '1 St', city: 'Hyd', pincode: '500001' },
        subtotal: 1200, shipping: 0, discount: 0, total: 1200,
        paymentMethod: 'cod', status: 'delivered',
        items: { create: [{ productId: product.id, name: product.name, price: 1200, quantity: 1 }] },
      },
    });

    const res = await request(app).get('/api/admin/export/customers');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/);
    expect(res.text).toContain('phone,name,email,orderCount');
    expect(res.text).toContain('Customer Export');
  });
});

describe('Data Export — reviews', () => {
  it('exports reviews as CSV', async () => {
    const product = await createTestProduct({ name: 'ReviewExportProd' });
    await testPrisma.review.create({
      data: {
        productId: product.id,
        customerName: 'Review Export Customer',
        rating: 5,
        title: 'Great item',
        body: 'Loved it',
        approved: true,
      },
    });

    const res = await request(app).get('/api/admin/export/reviews');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/);
    expect(res.text).toContain('productName,customerName,rating');
    expect(res.text).toContain('Review Export Customer');
  });
});

describe('Data Export — validation', () => {
  it('rejects invalid export type', async () => {
    const res = await request(app).get('/api/admin/export/invalid-type');
    expect(res.status).toBe(400);
  });
});

// ── Invoice GST breakdown ─────────────────────────────────────────────────

describe('Invoice — GST breakdown', () => {
  it('returns HTML invoice with GST sections', async () => {
    const product = await createTestProduct({ name: 'InvoiceGST', stock: 5 });
    const order = await testPrisma.order.create({
      data: {
        orderNumber: `SB-INV${Date.now()}`,
        customerName: 'Invoice Test',
        customerPhone: '9900000001',
        address: { line1: '1 St', city: 'Hyd', state: 'Telangana', pincode: '500001' },
        subtotal: 999, shipping: 0, discount: 0, total: 999,
        paymentMethod: 'razorpay', paymentStatus: 'paid', status: 'delivered',
        items: { create: [{ productId: product.id, name: product.name, price: 999, quantity: 1 }] },
      },
    });

    const res = await request(app).get(`/api/admin/orders/${order.id}/invoice`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/html/);
    expect(res.text).toMatch(/TAX INVOICE/i);
    expect(res.text).toMatch(/GST|CGST|SGST|IGST/);
  });
});

// ── Category GST defaults ─────────────────────────────────────────────────

describe('Category — GST default rate', () => {
  it('new category has default gstRate of 5', async () => {
    const res = await request(app)
      .post('/api/admin/categories')
      .send({ name: `DefaultGST${Date.now()}` });

    expect(res.status).toBe(201);
    expect(res.body.gstRate).toBe(5);
  });

  it('gstRate is returned in category list', async () => {
    await createTestCategory('GST Listed');

    const res = await request(app).get('/api/categories');

    expect(res.status).toBe(200);
    const cats = Array.isArray(res.body) ? res.body : res.body.categories || [];
    if (cats.length > 0) {
      expect(cats[0]).toHaveProperty('gstRate');
    }
  });
});

// ── Coupon admin v2 validation ────────────────────────────────────────────

describe('Coupon admin v2 — validation', () => {
  it('rejects duplicate coupon code', async () => {
    const code = `DUPV2${Date.now()}`;
    await testPrisma.coupon.create({ data: { code, discount: 10, active: true } });

    const res = await request(app)
      .post('/api/admin/coupons/v2')
      .send({ code, discount: 15 });

    expect(res.status).toBe(400);
  });

  it('rejects invalid categoryId', async () => {
    const res = await request(app)
      .post('/api/admin/coupons/v2')
      .send({
        code: `CATINVALID${Date.now()}`,
        discount: 10,
        categoryId: 'nonexistent-cat',
      });

    expect(res.status).toBe(404);
  });

  it('rejects invalid userId', async () => {
    const res = await request(app)
      .post('/api/admin/coupons/v2')
      .send({
        code: `USERINVALID${Date.now()}`,
        discount: 10,
        userId: 'nonexistent-user',
      });

    expect(res.status).toBe(404);
  });
});
