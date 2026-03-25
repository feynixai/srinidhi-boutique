/**
 * Inventory management routes
 * - Stock movement log
 * - Bulk stock update via CSV
 * - Back-in-stock notification signup
 * - Restock alerts
 */
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } });

export const inventoryRoutes = Router();

// ── Stock Movements ───────────────────────────────────────────────────────────

// GET /api/inventory/movements?productId=&page=&limit=
inventoryRoutes.get('/movements', async (req: Request, res: Response) => {
  const { productId, page = '1', limit = '50' } = req.query;
  const pageNum = Math.max(1, parseInt(page as string, 10));
  const limitNum = Math.min(100, parseInt(limit as string, 10));

  const where = productId ? { productId: productId as string } : {};

  const [movements, total] = await Promise.all([
    prisma.stockMovement.findMany({
      where,
      include: { product: { select: { name: true, slug: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    }),
    prisma.stockMovement.count({ where }),
  ]);

  res.json({ movements, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
});

// POST /api/inventory/movements — log a manual stock adjustment
inventoryRoutes.post('/movements', async (req: Request, res: Response) => {
  const { productId, delta, reason, note, adminId } = z
    .object({
      productId: z.string(),
      delta: z.number().int(),
      reason: z.enum(['restock', 'adjustment', 'return', 'csv_import']),
      note: z.string().max(200).optional(),
      adminId: z.string().optional(),
    })
    .parse(req.body);

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new AppError(404, 'Product not found');

  const newStock = product.stock + delta;
  if (newStock < 0) throw new AppError(400, 'Stock cannot go below 0');

  const [movement] = await prisma.$transaction([
    prisma.stockMovement.create({ data: { productId, delta, reason, note, adminId } }),
    prisma.product.update({
      where: { id: productId },
      data: {
        stock: newStock,
        // auto-enable if restocking out-of-stock product
        ...(newStock > 0 && !product.active ? { active: true } : {}),
      },
    }),
  ]);

  // Notify back-in-stock subscribers if stock came back
  if (newStock > 0 && product.stock === 0) {
    const subscribers = await prisma.backInStockNotification.findMany({
      where: { productId, notified: false },
    });
    if (subscribers.length > 0) {
      await prisma.backInStockNotification.updateMany({
        where: { productId, notified: false },
        data: { notified: true },
      });
      // In production: send emails/WhatsApp to subscribers here
    }
  }

  res.status(201).json(movement);
});

// ── Bulk CSV Stock Update ─────────────────────────────────────────────────────

// POST /api/inventory/bulk-update — CSV: productId,delta,reason
inventoryRoutes.post('/bulk-update', upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) throw new AppError(400, 'CSV file required');

  const csv = req.file.buffer.toString('utf-8');
  const lines = csv.split('\n').map((l) => l.trim()).filter(Boolean);

  // Skip header row if present
  const dataLines = lines[0]?.toLowerCase().includes('productid') ? lines.slice(1) : lines;

  const results: Array<{ productId: string; success: boolean; error?: string; newStock?: number }> = [];

  for (const line of dataLines) {
    const parts = line.split(',').map((p) => p.trim());
    const [productId, deltaStr, reason = 'csv_import'] = parts;

    if (!productId || !deltaStr) {
      results.push({ productId: productId || 'unknown', success: false, error: 'Missing fields' });
      continue;
    }

    const delta = parseInt(deltaStr, 10);
    if (isNaN(delta)) {
      results.push({ productId, success: false, error: 'Invalid delta' });
      continue;
    }

    try {
      const product = await prisma.product.findUnique({ where: { id: productId } });
      if (!product) {
        results.push({ productId, success: false, error: 'Product not found' });
        continue;
      }

      const newStock = product.stock + delta;
      if (newStock < 0) {
        results.push({ productId, success: false, error: 'Stock cannot go below 0' });
        continue;
      }

      await prisma.$transaction([
        prisma.stockMovement.create({ data: { productId, delta, reason: 'csv_import' } }),
        prisma.product.update({
          where: { id: productId },
          data: { stock: newStock, ...(newStock === 0 ? { active: false } : { active: true }) },
        }),
      ]);

      results.push({ productId, success: true, newStock });
    } catch {
      results.push({ productId, success: false, error: 'Database error' });
    }
  }

  const successCount = results.filter((r) => r.success).length;
  res.json({ processed: results.length, succeeded: successCount, failed: results.length - successCount, results });
});

// ── Low Stock & Restock Alerts ────────────────────────────────────────────────

// GET /api/inventory/low-stock?threshold=3
inventoryRoutes.get('/low-stock', async (req: Request, res: Response) => {
  const threshold = parseInt((req.query.threshold as string) || '3', 10);

  const products = await prisma.product.findMany({
    where: { stock: { lte: threshold }, active: true },
    select: { id: true, name: true, slug: true, stock: true, images: true, category: { select: { name: true } } },
    orderBy: { stock: 'asc' },
  });

  res.json({ count: products.length, products });
});

// ── Back-in-Stock Notifications ───────────────────────────────────────────────

// POST /api/inventory/back-in-stock — customer signup
inventoryRoutes.post('/back-in-stock', async (req: Request, res: Response) => {
  const { productId, email, phone } = z
    .object({
      productId: z.string(),
      email: z.string().email().optional(),
      phone: z.string().min(5).optional(),
    })
    .refine((d) => d.email || d.phone, { message: 'email or phone required' })
    .parse(req.body);

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new AppError(404, 'Product not found');

  // If product is already in stock, no need to notify
  if (product.stock > 0) {
    return res.json({ success: true, message: 'Product is already in stock' });
  }

  const notification = await prisma.backInStockNotification.create({
    data: { productId, email, phone },
  });

  res.status(201).json({ success: true, notificationId: notification.id });
});

// GET /api/inventory/back-in-stock/:productId — admin: list subscribers
inventoryRoutes.get('/back-in-stock/:productId', async (req: Request, res: Response) => {
  const notifications = await prisma.backInStockNotification.findMany({
    where: { productId: req.params.productId, notified: false },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ count: notifications.length, notifications });
});
