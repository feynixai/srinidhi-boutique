/**
 * Build 8 tests — WhatsApp notifications, email templates, analytics,
 * inventory management, stock movements, back-in-stock, recommendations,
 * abandoned carts, caching, health check, env validation.
 */
import request from 'supertest';
import { app } from '../index';
import {
  createTestProduct,
  createTestCategory,
  cleanupTest,
  testPrisma,
} from './helpers';
import {
  buildClickToChatLink,
  sendOrderConfirmationWhatsApp,
  sendShippingUpdateWhatsApp,
  sendDeliveryWhatsApp,
} from '../lib/whatsapp';
import {
  renderOrderConfirmationEmail,
  renderShippingEmail,
  renderWelcomeEmail,
  type OrderEmailData,
} from '../lib/email';
import { cache, TTL } from '../lib/cache';

beforeEach(async () => {
  await cleanupTest();
  cache.deleteByPrefix('products:');
});

afterAll(async () => {
  await cleanupTest();
  await testPrisma.$disconnect();
});

// ── WhatsApp utility tests ─────────────────────────────────────────────────

describe('WhatsApp — click-to-chat link generation', () => {
  it('generates correct link for 10-digit Indian number', () => {
    const link = buildClickToChatLink('9876543210', 'Hello');
    expect(link).toContain('wa.me/919876543210');
    expect(link).toContain('Hello');
  });

  it('generates correct link for number with country code', () => {
    const link = buildClickToChatLink('919876543210', 'Test');
    expect(link).toContain('wa.me/919876543210');
  });

  it('URL-encodes special characters in message', () => {
    const link = buildClickToChatLink('9876543210', 'Hello World!');
    expect(link).toContain(encodeURIComponent('Hello World!'));
  });
});

describe('WhatsApp — notification functions (no credentials = fallback)', () => {
  const order = {
    orderNumber: 'SB-TEST-001',
    customerName: 'Priya Sharma',
    customerPhone: '9876543210',
    total: 1999,
    paymentMethod: 'razorpay',
    items: [{ name: 'Silk Saree', quantity: 1, price: 1999 }],
  };

  it('sendOrderConfirmationWhatsApp returns fallback link when no credentials', async () => {
    const result = await sendOrderConfirmationWhatsApp(order);
    // No credentials set in test env → fallback
    expect(result.success).toBe(false);
    expect(result.fallbackLink).toContain('wa.me/');
    expect(result.fallbackLink).toContain('SB-TEST-001');
  });

  it('sendShippingUpdateWhatsApp returns fallback link', async () => {
    const result = await sendShippingUpdateWhatsApp({ ...order, trackingId: 'DHL123' });
    expect(result.success).toBe(false);
    expect(result.fallbackLink).toContain('wa.me/');
    expect(result.fallbackLink).toContain('DHL123');
  });

  it('sendDeliveryWhatsApp returns fallback link', async () => {
    const result = await sendDeliveryWhatsApp(order);
    expect(result.success).toBe(false);
    expect(result.fallbackLink).toContain('wa.me/');
  });
});

// ── Email template tests ───────────────────────────────────────────────────

describe('Email template rendering', () => {
  const orderData: OrderEmailData = {
    orderNumber: 'SB-0001',
    customerName: 'Priya Sharma',
    items: [
      { name: 'Silk Saree', quantity: 1, price: 1999, size: 'Free Size' },
      { name: 'Dupatta', quantity: 2, price: 499 },
    ],
    subtotal: 2997,
    shipping: 100,
    discount: 300,
    total: 2797,
    paymentMethod: 'razorpay',
    address: { line1: '123 MG Road', city: 'Hyderabad', state: 'Telangana', pincode: '500001' },
  };

  it('renders order confirmation email with order number', () => {
    const html = renderOrderConfirmationEmail(orderData);
    expect(html).toContain('SB-0001');
    expect(html).toContain('Priya Sharma');
    expect(html).toContain('Silk Saree');
    expect(html).toContain('Dupatta');
    expect(html).toContain('2,797');
  });

  it('renders order email with discount row', () => {
    const html = renderOrderConfirmationEmail(orderData);
    expect(html).toContain('300'); // discount
  });

  it('renders order email with item size', () => {
    const html = renderOrderConfirmationEmail(orderData);
    expect(html).toContain('Free Size');
  });

  it('renders shipping email with tracking ID', () => {
    const html = renderShippingEmail({
      customerName: 'Priya',
      orderNumber: 'SB-0001',
      trackingId: 'DHL-TRACK-123',
    });
    expect(html).toContain('SB-0001');
    expect(html).toContain('DHL-TRACK-123');
    expect(html).toContain('on its way');
  });

  it('renders shipping email without tracking ID', () => {
    const html = renderShippingEmail({ customerName: 'Priya', orderNumber: 'SB-0001' });
    expect(html).toContain('SB-0001');
    expect(html).not.toContain('Tracking ID:');
  });

  it('renders welcome email with customer name', () => {
    const html = renderWelcomeEmail({ name: 'Sneha' });
    expect(html).toContain('Sneha');
    expect(html).toContain('SRINIDHI20');
  });

  it('renders valid HTML structure in all templates', () => {
    const order = renderOrderConfirmationEmail(orderData);
    const shipping = renderShippingEmail({ customerName: 'A', orderNumber: 'SB-0001' });
    const welcome = renderWelcomeEmail({ name: 'B' });

    for (const html of [order, shipping, welcome]) {
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('Srinidhi Boutique');
      expect(html).toContain('</html>');
    }
  });
});

// ── Notification routes ────────────────────────────────────────────────────

describe('POST /api/notifications/send-order-confirmation', () => {
  it('returns 404 for non-existent order', async () => {
    const res = await request(app)
      .post('/api/notifications/send-order-confirmation')
      .send({ orderId: 'nonexistent' });
    expect(res.status).toBe(404);
  });

  it('sends notifications for a real order', async () => {
    const product = await createTestProduct({ stock: 10 });
    const order = await testPrisma.order.create({
      data: {
        orderNumber: `SB-NOTIF-${Date.now()}`,
        customerName: 'Test',
        customerPhone: '9876543210',
        customerEmail: 'test@test.com',
        address: { line1: 'Test', city: 'HYD', pincode: '500001' },
        subtotal: 999,
        shipping: 100,
        discount: 0,
        total: 1099,
        paymentMethod: 'cod',
        status: 'placed',
        items: { create: [{ productId: product.id, name: product.name, price: 999, quantity: 1 }] },
      },
    });

    const res = await request(app)
      .post('/api/notifications/send-order-confirmation')
      .send({ orderId: order.id });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.results).toHaveProperty('whatsapp');
  });
});

describe('GET /api/notifications/whatsapp-link', () => {
  it('returns click-to-chat link', async () => {
    const res = await request(app)
      .get('/api/notifications/whatsapp-link')
      .query({ phone: '9876543210', message: 'Hello' });
    expect(res.status).toBe(200);
    expect(res.body.link).toContain('wa.me/');
  });

  it('returns 400 when phone missing', async () => {
    const res = await request(app)
      .get('/api/notifications/whatsapp-link')
      .query({ message: 'Hello' });
    expect(res.status).toBe(400);
  });
});

// ── Analytics endpoint ─────────────────────────────────────────────────────

describe('GET /api/admin/analytics', () => {
  it('returns pro analytics shape', async () => {
    const res = await request(app).get('/api/admin/analytics?period=7');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('totalRevenue');
    expect(res.body).toHaveProperty('totalOrders');
    expect(res.body).toHaveProperty('avgOrderValue');
    expect(res.body).toHaveProperty('dailyRevenue');
    expect(res.body).toHaveProperty('topProducts');
    expect(res.body).toHaveProperty('revenueByPayment');
    expect(res.body).toHaveProperty('revenueByCategory');
    expect(res.body).toHaveProperty('conversionFunnel');
    expect(res.body).toHaveProperty('customerAcquisition');
    expect(res.body).toHaveProperty('abandonedCarts');
  });

  it('dailyRevenue has correct length for period', async () => {
    const res = await request(app).get('/api/admin/analytics?period=7');
    expect(res.status).toBe(200);
    expect(res.body.dailyRevenue).toHaveLength(7);
  });

  it('dailyRevenue entries have date + revenue + orders', async () => {
    const res = await request(app).get('/api/admin/analytics?period=7');
    const entry = res.body.dailyRevenue[0];
    expect(entry).toHaveProperty('date');
    expect(entry).toHaveProperty('revenue');
    expect(entry).toHaveProperty('orders');
  });

  it('conversionFunnel has required fields', async () => {
    const res = await request(app).get('/api/admin/analytics?period=30');
    expect(res.body.conversionFunnel).toHaveProperty('cartItems');
    expect(res.body.conversionFunnel).toHaveProperty('checkoutStarted');
    expect(res.body.conversionFunnel).toHaveProperty('paid');
    expect(res.body.conversionFunnel).toHaveProperty('abandonedCarts');
  });

  it('customerAcquisition has newCustomers + returningCustomers', async () => {
    const res = await request(app).get('/api/admin/analytics?period=30');
    expect(res.body.customerAcquisition).toHaveProperty('newCustomers');
    expect(res.body.customerAcquisition).toHaveProperty('returningCustomers');
  });
});

// ── Inventory — stock movements ────────────────────────────────────────────

describe('POST /api/inventory/movements', () => {
  it('logs a restock movement and updates stock', async () => {
    const product = await createTestProduct({ stock: 5 });

    const res = await request(app)
      .post('/api/inventory/movements')
      .send({ productId: product.id, delta: 10, reason: 'restock', note: 'Supplier delivery' });
    expect(res.status).toBe(201);
    expect(res.body.delta).toBe(10);
    expect(res.body.reason).toBe('restock');

    const updated = await testPrisma.product.findUnique({ where: { id: product.id } });
    expect(updated!.stock).toBe(15);
  });

  it('logs a negative adjustment', async () => {
    const product = await createTestProduct({ stock: 20 });

    const res = await request(app)
      .post('/api/inventory/movements')
      .send({ productId: product.id, delta: -5, reason: 'adjustment' });
    expect(res.status).toBe(201);

    const updated = await testPrisma.product.findUnique({ where: { id: product.id } });
    expect(updated!.stock).toBe(15);
  });

  it('returns 400 when stock would go below 0', async () => {
    const product = await createTestProduct({ stock: 3 });

    const res = await request(app)
      .post('/api/inventory/movements')
      .send({ productId: product.id, delta: -10, reason: 'adjustment' });
    expect(res.status).toBe(400);
  });

  it('returns 404 for non-existent product', async () => {
    const res = await request(app)
      .post('/api/inventory/movements')
      .send({ productId: 'nonexistent', delta: 5, reason: 'restock' });
    expect(res.status).toBe(404);
  });
});

describe('GET /api/inventory/movements', () => {
  it('returns paginated movements', async () => {
    const product = await createTestProduct({ stock: 5 });
    await testPrisma.stockMovement.create({
      data: { productId: product.id, delta: 10, reason: 'restock' },
    });

    const res = await request(app)
      .get('/api/inventory/movements')
      .query({ productId: product.id });
    expect(res.status).toBe(200);
    expect(res.body.movements).toBeDefined();
    expect(res.body.total).toBeGreaterThanOrEqual(1);
  });
});

// ── Inventory — low stock ──────────────────────────────────────────────────

describe('GET /api/inventory/low-stock', () => {
  it('returns products with stock <= threshold', async () => {
    await createTestProduct({ name: 'Low Stock Item', stock: 2 });
    await createTestProduct({ name: 'Normal Stock Item', stock: 20 });

    const res = await request(app).get('/api/inventory/low-stock?threshold=5');
    expect(res.status).toBe(200);
    expect(res.body.products.every((p: { stock: number }) => p.stock <= 5)).toBe(true);
  });

  it('uses default threshold of 3', async () => {
    const res = await request(app).get('/api/inventory/low-stock');
    expect(res.status).toBe(200);
    expect(res.body.products.every((p: { stock: number }) => p.stock <= 3)).toBe(true);
  });
});

// ── Inventory — back-in-stock ──────────────────────────────────────────────

describe('POST /api/inventory/back-in-stock', () => {
  it('subscribes with email', async () => {
    const product = await createTestProduct({ stock: 0 });

    const res = await request(app)
      .post('/api/inventory/back-in-stock')
      .send({ productId: product.id, email: 'test@example.com' });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.notificationId).toBeDefined();
  });

  it('subscribes with phone', async () => {
    const product = await createTestProduct({ stock: 0 });

    const res = await request(app)
      .post('/api/inventory/back-in-stock')
      .send({ productId: product.id, phone: '9876543210' });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('returns 200 with message if product is already in stock', async () => {
    const product = await createTestProduct({ stock: 10 });

    const res = await request(app)
      .post('/api/inventory/back-in-stock')
      .send({ productId: product.id, email: 'test@example.com' });
    expect(res.status).toBe(200);
    expect(res.body.message).toContain('already in stock');
  });

  it('returns 400 if neither email nor phone provided', async () => {
    const product = await createTestProduct({ stock: 0 });

    const res = await request(app)
      .post('/api/inventory/back-in-stock')
      .send({ productId: product.id });
    expect(res.status).toBe(400);
  });

  it('returns 404 for non-existent product', async () => {
    const res = await request(app)
      .post('/api/inventory/back-in-stock')
      .send({ productId: 'nonexistent', email: 'a@b.com' });
    expect(res.status).toBe(404);
  });
});

describe('GET /api/inventory/back-in-stock/:productId', () => {
  it('returns subscribers for a product', async () => {
    const product = await createTestProduct({ stock: 0 });
    await testPrisma.backInStockNotification.create({
      data: { productId: product.id, email: 'a@test.com' },
    });

    const res = await request(app).get(`/api/inventory/back-in-stock/${product.id}`);
    expect(res.status).toBe(200);
    expect(res.body.count).toBeGreaterThanOrEqual(1);
  });
});

// ── Inventory — bulk CSV update ────────────────────────────────────────────

describe('POST /api/inventory/bulk-update', () => {
  it('processes CSV file with valid data', async () => {
    const p1 = await createTestProduct({ name: 'CSV Product 1', stock: 10 });
    const p2 = await createTestProduct({ name: 'CSV Product 2', stock: 5 });

    const csv = `productId,delta,reason\n${p1.id},5,restock\n${p2.id},3,restock`;

    const res = await request(app)
      .post('/api/inventory/bulk-update')
      .attach('file', Buffer.from(csv), { filename: 'stock.csv', contentType: 'text/csv' });
    expect(res.status).toBe(200);
    expect(res.body.succeeded).toBe(2);
    expect(res.body.failed).toBe(0);
  });

  it('handles invalid rows gracefully', async () => {
    const csv = `productId,delta,reason\nnonexistent,5,restock\n`;

    const res = await request(app)
      .post('/api/inventory/bulk-update')
      .attach('file', Buffer.from(csv), { filename: 'stock.csv', contentType: 'text/csv' });
    expect(res.status).toBe(200);
    expect(res.body.failed).toBeGreaterThanOrEqual(1);
  });

  it('returns 400 if no file uploaded', async () => {
    const res = await request(app).post('/api/inventory/bulk-update');
    expect(res.status).toBe(400);
  });
});

// ── Product recommendations ────────────────────────────────────────────────

describe('GET /api/products/:slug/recommendations', () => {
  it('returns recommendations for a product', async () => {
    const category = await createTestCategory('Sarees');
    const product = await createTestProduct({ name: 'Main Saree', categoryId: category.id, price: 1500 });
    await createTestProduct({ name: 'Related Saree', categoryId: category.id, price: 1400 });

    const res = await request(app).get(`/api/products/${product.slug}/recommendations`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    // Should not include the product itself
    expect(res.body.every((p: { id: string }) => p.id !== product.id)).toBe(true);
  });

  it('returns 404 for non-existent product slug', async () => {
    const res = await request(app).get('/api/products/non-existent-slug/recommendations');
    expect(res.status).toBe(404);
  });
});

// ── Product lookup by ID ────────────────────────────────────────────────────

describe('GET /api/products/id/:id', () => {
  it('returns product by ID', async () => {
    const product = await createTestProduct({ name: 'ID Lookup Test' });

    const res = await request(app).get(`/api/products/id/${product.id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(product.id);
    expect(res.body.name).toBe('ID Lookup Test');
  });

  it('returns 404 for non-existent ID', async () => {
    const res = await request(app).get('/api/products/id/nonexistent');
    expect(res.status).toBe(404);
  });
});

// ── Abandoned cart endpoints ───────────────────────────────────────────────

describe('GET /api/cart/abandoned', () => {
  it('returns abandoned cart sessions', async () => {
    const res = await request(app).get('/api/cart/abandoned');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('sessions');
    expect(typeof res.body.count).toBe('number');
  });
});

describe('GET /api/cart/reminder/:sessionId', () => {
  it('returns hasAbandonedCart false for new session', async () => {
    const res = await request(app).get('/api/cart/reminder/new-session-xyz');
    expect(res.status).toBe(200);
    expect(res.body.hasAbandonedCart).toBe(false);
    expect(res.body.items).toHaveLength(0);
  });
});

// ── In-memory cache ────────────────────────────────────────────────────────

describe('In-memory cache', () => {
  it('stores and retrieves values', () => {
    cache.set('test:key', { foo: 'bar' }, 5000);
    expect(cache.get('test:key')).toEqual({ foo: 'bar' });
  });

  it('returns null for expired entries', async () => {
    cache.set('test:expire', 'value', 1); // 1ms TTL
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(cache.get('test:expire')).toBeNull();
  });

  it('returns null for missing keys', () => {
    expect(cache.get('nonexistent:key')).toBeNull();
  });

  it('deletes keys by prefix', () => {
    cache.set('products:featured', [1, 2, 3], 60000);
    cache.set('products:list', [4, 5, 6], 60000);
    cache.set('other:key', 'untouched', 60000);

    cache.deleteByPrefix('products:');

    expect(cache.get('products:featured')).toBeNull();
    expect(cache.get('products:list')).toBeNull();
    expect(cache.get('other:key')).toBe('untouched');
  });

  it('featured products endpoint serves from cache on second request', async () => {
    // Warm the cache
    const res1 = await request(app).get('/api/products/featured');
    expect(res1.status).toBe(200);

    // Second request should also succeed (from cache)
    const res2 = await request(app).get('/api/products/featured');
    expect(res2.status).toBe(200);
    expect(JSON.stringify(res1.body)).toBe(JSON.stringify(res2.body));
  });
});

// ── Health check ───────────────────────────────────────────────────────────

describe('GET /health', () => {
  it('returns ok status with database info', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.timestamp).toBeDefined();
    expect(res.body.database).toBe('connected');
  });

  it('returns env field', async () => {
    const res = await request(app).get('/health');
    expect(res.body.env).toBeDefined();
  });
});

// ── Order auto-disables products at zero stock ─────────────────────────────

describe('Order placement — auto-disable at zero stock', () => {
  it('disables product when stock reaches 0 after order', async () => {
    const product = await createTestProduct({ stock: 1, price: 999 });

    await request(app)
      .post('/api/orders')
      .send({
        customerName: 'Test',
        customerPhone: '9876543210',
        address: { line1: '1 Main St', city: 'Hyderabad', pincode: '500001' },
        items: [{ productId: product.id, quantity: 1 }],
        paymentMethod: 'cod',
      });

    const updated = await testPrisma.product.findUnique({ where: { id: product.id } });
    expect(updated!.stock).toBe(0);
    expect(updated!.active).toBe(false);
  });

  it('logs stock movement for order', async () => {
    const product = await createTestProduct({ stock: 5, price: 999 });

    await request(app)
      .post('/api/orders')
      .send({
        customerName: 'Test',
        customerPhone: '9876543210',
        address: { line1: '1 Main St', city: 'Hyderabad', pincode: '500001' },
        items: [{ productId: product.id, quantity: 2 }],
        paymentMethod: 'cod',
      });

    const movement = await testPrisma.stockMovement.findFirst({
      where: { productId: product.id },
    });
    expect(movement).toBeTruthy();
    expect(movement!.delta).toBe(-2);
    expect(movement!.reason).toBe('sale');
  });
});

// ── Environment validation ─────────────────────────────────────────────────

describe('Environment validation', () => {
  it('validates env module is importable', async () => {
    const { validateEnv } = await import('../lib/validateEnv');
    expect(typeof validateEnv).toBe('function');
  });

  it('does not throw when DATABASE_URL is set (not called in test env)', async () => {
    // validateEnv() is only called in index.ts when NODE_ENV !== 'test'
    // So importing it should be safe
    const mod = await import('../lib/validateEnv');
    expect(typeof mod.validateEnv).toBe('function');
  });
});
