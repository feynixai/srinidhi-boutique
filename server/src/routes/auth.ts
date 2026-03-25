import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { rateLimit } from '../middleware/rateLimiter';

export const authRoutes = Router();
const prisma = new PrismaClient();

// 5 OTP sends per 15 minutes per IP
const otpSendLimiter = rateLimit(5, 15 * 60 * 1000);
// 10 OTP verify attempts per 15 minutes per IP
const otpVerifyLimiter = rateLimit(10, 15 * 60 * 1000);
// 10 login attempts per 10 minutes per IP
const loginLimiter = rateLimit(10, 10 * 60 * 1000);

// Simple in-memory OTP store (keyed by phone)
// In production, use Redis or DB. Here we use OtpCode model.
function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// POST /api/auth/otp/send
authRoutes.post('/otp/send', otpSendLimiter, async (req: Request, res: Response) => {
  const { phone } = z.object({ phone: z.string().min(10).max(15) }).parse(req.body);

  const code = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

  // Invalidate old codes for this phone
  await prisma.otpCode.updateMany({
    where: { phone, used: false },
    data: { used: true },
  });

  await prisma.otpCode.create({
    data: { phone, code, expiresAt },
  });

  // In production: send via Twilio. For now, return in dev mode.
  const isDev = process.env.NODE_ENV !== 'production';
  res.json({
    success: true,
    message: 'OTP sent successfully',
    ...(isDev && { otp: code }), // Only expose in dev
  });
});

// POST /api/auth/otp/verify
authRoutes.post('/otp/verify', otpVerifyLimiter, async (req: Request, res: Response) => {
  const { phone, code } = z
    .object({ phone: z.string().min(10).max(15), code: z.string().length(6) })
    .parse(req.body);

  const otpRecord = await prisma.otpCode.findFirst({
    where: {
      phone,
      code,
      used: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!otpRecord) {
    throw new AppError(400, 'Invalid or expired OTP');
  }

  // Mark used
  await prisma.otpCode.update({ where: { id: otpRecord.id }, data: { used: true } });

  // Upsert user
  const user = await prisma.user.upsert({
    where: { phone },
    update: {},
    create: { phone },
  });

  res.json({ success: true, user: { id: user.id, phone: user.phone, name: user.name } });
});

// GET /api/auth/user/:id
authRoutes.get('/user/:id', async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) throw new AppError(404, 'User not found');
  res.json(user);
});

// PUT /api/auth/user/:id  — update profile
authRoutes.put('/user/:id', async (req: Request, res: Response) => {
  const { name, email, avatar } = z
    .object({
      name: z.string().optional(),
      email: z.string().email().optional(),
      avatar: z.string().optional(),
    })
    .parse(req.body);

  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { ...(name !== undefined && { name }), ...(email !== undefined && { email }), ...(avatar !== undefined && { avatar }) },
  });
  res.json(user);
});

// PUT /api/auth/user/:id/addresses
authRoutes.put('/user/:id/addresses', async (req: Request, res: Response) => {
  const { addresses } = z
    .object({ addresses: z.array(z.record(z.unknown())) })
    .parse(req.body);

  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { addresses: addresses as never },
  });
  res.json({ addresses: user.addresses });
});

// POST /api/auth/google — upsert user from Google profile
authRoutes.post('/google', loginLimiter, async (req: Request, res: Response) => {
  const { googleId, email, name, avatar } = z
    .object({
      googleId: z.string(),
      email: z.string().email(),
      name: z.string().optional(),
      avatar: z.string().optional(),
    })
    .parse(req.body);

  const user = await prisma.user.upsert({
    where: { googleId },
    update: { name, avatar },
    create: { googleId, email, name, avatar },
  });

  res.json({ success: true, user: { id: user.id, email: user.email, name: user.name } });
});

// ── Admin auth ───────────────────────────────────────────────────────────────

// POST /api/auth/admin/google — upsert admin from Google, check whitelist
authRoutes.post('/admin/google', loginLimiter, async (req: Request, res: Response) => {
  const { googleId, email, name, avatar } = z
    .object({
      googleId: z.string(),
      email: z.string().email(),
      name: z.string().optional(),
      avatar: z.string().optional(),
    })
    .parse(req.body);

  // Check if admin exists and is active
  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (!existing) {
    throw new AppError(403, 'Not authorized — contact the store owner');
  }
  if (!existing.active) {
    throw new AppError(403, 'Admin account is deactivated');
  }

  const admin = await prisma.adminUser.update({
    where: { email },
    data: { googleId, name, avatar },
  });

  res.json({ success: true, admin: { id: admin.id, email: admin.email, name: admin.name, role: admin.role } });
});

// GET /api/auth/admin/users — list admin users (owner only concept, no middleware here)
authRoutes.get('/admin/users', async (_req: Request, res: Response) => {
  const admins = await prisma.adminUser.findMany({ orderBy: { createdAt: 'asc' } });
  res.json(admins);
});

// POST /api/auth/admin/users — add staff
authRoutes.post('/admin/users', async (req: Request, res: Response) => {
  const { email, name, role } = z
    .object({
      email: z.string().email(),
      name: z.string().optional(),
      role: z.enum(['OWNER', 'STAFF']).default('STAFF'),
    })
    .parse(req.body);

  const admin = await prisma.adminUser.upsert({
    where: { email },
    update: { name, role, active: true },
    create: { email, name, role },
  });
  res.status(201).json(admin);
});

// DELETE /api/auth/admin/users/:id
authRoutes.delete('/admin/users/:id', async (req: Request, res: Response) => {
  await prisma.adminUser.update({
    where: { id: req.params.id },
    data: { active: false },
  });
  res.json({ success: true });
});
