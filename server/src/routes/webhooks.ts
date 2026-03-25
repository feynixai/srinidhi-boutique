import { Router, Request, Response } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

export const webhookRoutes = Router();

const VALID_EVENTS = ['order.created', 'order.shipped', 'payment.received', 'order.cancelled'];

// ── Admin CRUD ──────────────────────────────────────────────────────────────

const WebhookSchema = z.object({
  url: z.string().url(),
  events: z.array(z.string()).min(1),
  active: z.boolean().optional(),
});

// Create webhook
webhookRoutes.post('/admin', async (req: Request, res: Response) => {
  const data = WebhookSchema.parse(req.body);

  const invalidEvents = data.events.filter((e) => !VALID_EVENTS.includes(e));
  if (invalidEvents.length > 0) {
    throw new AppError(400, `Invalid events: ${invalidEvents.join(', ')}. Valid: ${VALID_EVENTS.join(', ')}`);
  }

  const secret = crypto.randomBytes(24).toString('hex');

  const webhook = await prisma.webhook.create({
    data: {
      url: data.url,
      events: data.events,
      secret,
      active: data.active ?? true,
    },
  });

  res.status(201).json(webhook);
});

// List webhooks
webhookRoutes.get('/admin', async (_req: Request, res: Response) => {
  const webhooks = await prisma.webhook.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { deliveries: true } } },
  });
  res.json(webhooks);
});

// Get single webhook
webhookRoutes.get('/admin/:id', async (req: Request, res: Response) => {
  const webhook = await prisma.webhook.findUnique({
    where: { id: req.params.id },
    include: {
      deliveries: { orderBy: { createdAt: 'desc' }, take: 20 },
    },
  });
  if (!webhook) throw new AppError(404, 'Webhook not found');
  res.json(webhook);
});

// Update webhook
webhookRoutes.put('/admin/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const webhook = await prisma.webhook.findUnique({ where: { id } });
  if (!webhook) throw new AppError(404, 'Webhook not found');

  const data = WebhookSchema.partial().parse(req.body);

  if (data.events) {
    const invalidEvents = data.events.filter((e) => !VALID_EVENTS.includes(e));
    if (invalidEvents.length > 0) {
      throw new AppError(400, `Invalid events: ${invalidEvents.join(', ')}`);
    }
  }

  const updated = await prisma.webhook.update({ where: { id }, data });
  res.json(updated);
});

// Delete webhook
webhookRoutes.delete('/admin/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const webhook = await prisma.webhook.findUnique({ where: { id } });
  if (!webhook) throw new AppError(404, 'Webhook not found');
  await prisma.webhook.delete({ where: { id } });
  res.json({ message: 'Deleted' });
});

// ── Delivery / trigger ──────────────────────────────────────────────────────

// Trigger event to all matching webhooks
webhookRoutes.post('/trigger', async (req: Request, res: Response) => {
  const { event, payload } = z
    .object({
      event: z.string(),
      payload: z.record(z.unknown()),
    })
    .parse(req.body);

  if (!VALID_EVENTS.includes(event)) {
    throw new AppError(400, `Invalid event: ${event}`);
  }

  const webhooks = await prisma.webhook.findMany({
    where: { active: true, events: { has: event } },
  });

  const results = await Promise.all(
    webhooks.map(async (wh) => {
      const body = JSON.stringify({ event, payload, timestamp: new Date().toISOString() });
      const signature = crypto.createHmac('sha256', wh.secret).update(body).digest('hex');

      let statusCode: number | null = null;
      let success = false;
      let error: string | undefined;

      try {
        const response = await fetch(wh.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': signature,
            'X-Webhook-Event': event,
          },
          body,
          signal: AbortSignal.timeout(5000),
        });
        statusCode = response.status;
        success = response.ok;
      } catch (err) {
        error = err instanceof Error ? err.message : 'Unknown error';
      }

      await prisma.webhookDelivery.create({
        data: { webhookId: wh.id, event, payload: payload as import('@prisma/client').Prisma.InputJsonValue, statusCode, success, error },
      });

      return { webhookId: wh.id, success, statusCode };
    })
  );

  res.json({ event, deliveries: results.length, results });
});

// Get delivery history for a webhook
webhookRoutes.get('/admin/:id/deliveries', async (req: Request, res: Response) => {
  const { id } = req.params;
  const deliveries = await prisma.webhookDelivery.findMany({
    where: { webhookId: id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  res.json(deliveries);
});
