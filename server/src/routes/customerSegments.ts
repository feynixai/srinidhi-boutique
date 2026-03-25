import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const customerSegmentRoutes = Router();

export type CustomerSegment = 'New' | 'Returning' | 'VIP' | 'AtRisk';

export function getSegment(orderCount: number, daysSinceLastOrder: number | null): CustomerSegment {
  if (orderCount === 0) return 'New';
  if (daysSinceLastOrder !== null && daysSinceLastOrder > 90) return 'AtRisk';
  if (orderCount >= 5) return 'VIP';
  return 'Returning';
}

// Get all customers with segment badges
customerSegmentRoutes.get('/', async (req: Request, res: Response) => {
  const segmentFilter = req.query.segment as string | undefined;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  const users = await prisma.user.findMany({
    include: {
      orders: {
        select: { createdAt: true },
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const now = Date.now();

  const segmented = users.map((user) => {
    const orderCount = user.orders.length;
    const lastOrder = user.orders[0];
    const daysSinceLast = lastOrder
      ? Math.floor((now - lastOrder.createdAt.getTime()) / 86400000)
      : null;
    const segment = getSegment(orderCount, daysSinceLast);

    return {
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      createdAt: user.createdAt,
      orderCount,
      lastOrderDate: lastOrder?.createdAt ?? null,
      daysSinceLastOrder: daysSinceLast,
      segment,
    };
  });

  const filtered = segmentFilter
    ? segmented.filter((u) => u.segment === segmentFilter)
    : segmented;

  const total = filtered.length;
  const paginated = filtered.slice((page - 1) * limit, page * limit);

  res.json({
    customers: paginated,
    total,
    page,
    pages: Math.ceil(total / limit),
  });
});

// Get segment summary counts
customerSegmentRoutes.get('/summary', async (_req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    include: {
      orders: {
        select: { createdAt: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  const now = Date.now();
  const counts: Record<CustomerSegment, number> = { New: 0, Returning: 0, VIP: 0, AtRisk: 0 };

  for (const user of users) {
    const orderCount = user.orders.length;
    const lastOrder = user.orders[0];
    const daysSinceLast = lastOrder
      ? Math.floor((now - lastOrder.createdAt.getTime()) / 86400000)
      : null;
    const segment = getSegment(orderCount, daysSinceLast);
    counts[segment]++;
  }

  res.json({ total: users.length, segments: counts });
});

// Get single customer with segment
customerSegmentRoutes.get('/:userId', async (req: Request, res: Response) => {
  const { userId } = req.params;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      orders: {
        select: { id: true, orderNumber: true, total: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
  if (!user) return res.status(404).json({ error: 'User not found' });

  const now = Date.now();
  const orderCount = user.orders.length;
  const lastOrder = user.orders[0];
  const daysSinceLast = lastOrder
    ? Math.floor((now - lastOrder.createdAt.getTime()) / 86400000)
    : null;
  const segment = getSegment(orderCount, daysSinceLast);

  res.json({ ...user, segment, orderCount, daysSinceLastOrder: daysSinceLast });
});
