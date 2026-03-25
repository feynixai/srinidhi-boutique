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

export async function cleanupTest() {
  // Delete in FK-safe order
  await testPrisma.orderItem.deleteMany({});
  await testPrisma.cartItem.deleteMany({});
  await testPrisma.order.deleteMany({});
  await testPrisma.coupon.deleteMany({});
  await testPrisma.product.deleteMany({});
  await testPrisma.category.deleteMany({});
}
