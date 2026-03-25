import { PrismaClient } from '@prisma/client';
import slugify from 'slugify';

export const testPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://arun@localhost:5432/srinidhi_test',
    },
  },
});

export async function createTestCategory(name = 'Test Category') {
  const slug = slugify(name, { lower: true, strict: true });
  return testPrisma.category.upsert({
    where: { slug },
    update: { name },
    create: { name, slug },
  });
}

export async function createTestProduct(overrides: Record<string, unknown> = {}) {
  const name = (overrides.name as string) || `Test Product ${Date.now()}`;
  const slug = slugify(name, { lower: true, strict: true });

  const category = overrides.categoryId ? null : await createTestCategory();

  return testPrisma.product.upsert({
    where: { slug },
    update: {},
    create: {
      name,
      slug,
      price: 999,
      images: ['https://example.com/image.jpg'],
      sizes: ['S', 'M', 'L'],
      colors: ['Red'],
      occasion: ['casual'],
      stock: 50,
      active: true,
      categoryId: (overrides.categoryId as string) || category?.id,
      ...(overrides as Record<string, unknown>),
    },
    include: { category: true },
  });
}

export async function createTestCoupon(overrides: Record<string, unknown> = {}) {
  const code = (overrides.code as string) || `TEST${Date.now()}`;
  return testPrisma.coupon.create({
    data: {
      code,
      discount: 10,
      active: true,
      ...(overrides as Record<string, unknown>),
    },
  });
}

export async function createTestReview(productId: string, overrides: Record<string, unknown> = {}) {
  return testPrisma.review.create({
    data: {
      productId,
      customerName: 'Test Customer',
      rating: 5,
      title: 'Great product',
      body: 'Really loved this product!',
      approved: true,
      ...(overrides as Record<string, unknown>),
    },
  });
}

export async function createTestPincodeZone(overrides: Record<string, unknown> = {}) {
  const pincode = (overrides.pincode as string) || `50000${Math.floor(Math.random() * 9)}`;
  return testPrisma.pincodeZone.upsert({
    where: { pincode },
    update: {},
    create: {
      pincode,
      zone: 'south',
      city: 'Hyderabad',
      state: 'Telangana',
      deliveryDays: 2,
      available: true,
      ...(overrides as Record<string, unknown>),
    },
  });
}

export async function createTestReturnRequest(overrides: Record<string, unknown> = {}) {
  return testPrisma.returnRequest.create({
    data: {
      orderNumber: `SB-${Date.now()}`,
      customerName: 'Test Customer',
      customerPhone: '9876543210',
      reason: 'defective',
      description: 'Item arrived damaged',
      status: 'pending',
      ...(overrides as Record<string, unknown>),
    },
  });
}

export async function createTestUser(overrides: Record<string, unknown> = {}) {
  const phone = (overrides.phone as string) || `9${Math.floor(100000000 + Math.random() * 900000000)}`;
  return testPrisma.user.create({
    data: {
      phone,
      name: 'Test User',
      email: overrides.email as string || `test${Date.now()}${Math.floor(Math.random() * 10000)}@example.com`,
      ...(overrides as Record<string, unknown>),
    },
  });
}

export async function createTestAdminUser(overrides: Record<string, unknown> = {}) {
  const email = (overrides.email as string) || `admin${Date.now()}@example.com`;
  return testPrisma.adminUser.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: 'Test Admin',
      role: 'STAFF',
      active: true,
      ...(overrides as Record<string, unknown>),
    },
  });
}

export async function cleanupTest() {
  // Delete in FK-safe order
  await testPrisma.chatMessage.deleteMany({});
  await testPrisma.lookbook.deleteMany({});
  await testPrisma.flashSaleProduct.deleteMany({});
  await testPrisma.flashSale.deleteMany({});
  await testPrisma.loyaltyHistory.deleteMany({});
  await testPrisma.loyaltyAccount.deleteMany({});
  await testPrisma.referral.deleteMany({});
  await testPrisma.backInStockNotification.deleteMany({});
  await testPrisma.stockMovement.deleteMany({});
  await testPrisma.recentlyViewed.deleteMany({});
  await testPrisma.wishlistItem.deleteMany({});
  await testPrisma.returnRequest.deleteMany({});
  await testPrisma.review.deleteMany({});
  await testPrisma.orderItem.deleteMany({});
  await testPrisma.cartItem.deleteMany({});
  await testPrisma.order.deleteMany({});
  await testPrisma.coupon.deleteMany({});
  // Build 10 models
  await testPrisma.productQA.deleteMany({});
  await testPrisma.productTag.deleteMany({});
  await testPrisma.productVariant.deleteMany({});
  await testPrisma.tag.deleteMany({});
  await testPrisma.collection.deleteMany({});
  await testPrisma.userNotification.deleteMany({});
  await testPrisma.product.deleteMany({});
  await testPrisma.category.deleteMany({});
  await testPrisma.pincodeZone.deleteMany({});
  await testPrisma.newsletter.deleteMany({});
  await testPrisma.contactSubmission.deleteMany({});
  await testPrisma.otpCode.deleteMany({});
  await testPrisma.user.deleteMany({});
  await testPrisma.adminUser.deleteMany({});
}

export async function createTestNewsletter(email: string, overrides: Record<string, unknown> = {}) {
  return testPrisma.newsletter.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: 'Test Subscriber',
      active: true,
      source: 'test',
      ...overrides,
    },
  });
}
