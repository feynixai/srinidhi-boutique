import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@srinidhiboutique.com';
  const password = 'Srinidhi@2026';
  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await prisma.adminUser.upsert({
    where: { email },
    update: { passwordHash },
    create: {
      email,
      name: 'Admin',
      role: 'OWNER',
      passwordHash,
      active: true,
    },
  });

  console.log(`✅ Admin user seeded: ${admin.email} (${admin.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
