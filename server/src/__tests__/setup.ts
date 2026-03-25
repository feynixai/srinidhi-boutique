import { execSync } from 'child_process';

export default async function globalSetup() {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/srinidhi_test';
  process.env.NODE_ENV = 'test';
}
