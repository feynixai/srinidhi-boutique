export default async function globalSetup() {
  process.env.DATABASE_URL =
    process.env.TEST_DATABASE_URL || 'postgresql://arun@localhost:5432/srinidhi_test';
  process.env.NODE_ENV = 'test';
}
