import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const performanceMetricsRoutes = Router();

// Main dashboard — all metrics
performanceMetricsRoutes.get('/', async (_req: Request, res: Response) => {
  const [
    totalOrders,
    paidOrders,
    totalCarts,
    abandonedCarts,
    recoveredCarts,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { paymentStatus: 'paid' } }),
    prisma.cartItem.groupBy({ by: ['sessionId'] }).then((r) => r.length),
    prisma.abandonedCart.count(),
    prisma.abandonedCart.count({ where: { recovered: true } }),
  ]);

  // Conversion rate: paid orders / total cart sessions (mock visitors = 3x cart sessions)
  const estimatedVisitors = totalCarts * 3 || 1;
  const conversionFunnel = {
    visitors: estimatedVisitors,
    addedToCart: totalCarts,
    reachedCheckout: Math.round(totalCarts * 0.65),
    paid: paidOrders,
    visitorToCart: totalCarts > 0 ? Math.round((totalCarts / estimatedVisitors) * 100) : 0,
    cartToCheckout: totalCarts > 0 ? 65 : 0,
    checkoutToPaid: totalCarts > 0 ? Math.round((paidOrders / Math.max(Math.round(totalCarts * 0.65), 1)) * 100) : 0,
    overall: estimatedVisitors > 0 ? Math.round((paidOrders / estimatedVisitors) * 100) : 0,
  };

  // Cart abandonment rate
  const cartAbandonmentRate =
    totalCarts > 0 ? Math.round((abandonedCarts / totalCarts) * 100) : 0;

  // Recovery rate
  const recoveryRate =
    abandonedCarts > 0 ? Math.round((recoveredCarts / abandonedCarts) * 100) : 0;

  // Average time to purchase (mock — 3.2 hours)
  const avgTimeToPurchaseHours = 3.2;

  // Page load times (mock data)
  const pageLoadTimes = {
    home: 1.2,
    productList: 1.5,
    productDetail: 1.8,
    checkout: 2.1,
    unit: 'seconds',
    p95: 3.0,
  };

  // Mobile vs Desktop (mock — India is heavily mobile)
  const deviceBreakdown = {
    mobile: 82,
    desktop: 14,
    tablet: 4,
    unit: 'percent',
  };

  res.json({
    conversionFunnel,
    cartAbandonmentRate,
    recoveryRate,
    totalOrders,
    paidOrders,
    abandonedCarts,
    recoveredCarts,
    avgTimeToPurchaseHours,
    pageLoadTimes,
    deviceBreakdown,
  });
});

// Conversion funnel only
performanceMetricsRoutes.get('/conversion', async (_req: Request, res: Response) => {
  const [totalCarts, paidOrders] = await Promise.all([
    prisma.cartItem.groupBy({ by: ['sessionId'] }).then((r) => r.length),
    prisma.order.count({ where: { paymentStatus: 'paid' } }),
  ]);

  const estimatedVisitors = totalCarts * 3 || 1;
  res.json({
    visitors: estimatedVisitors,
    addedToCart: totalCarts,
    paid: paidOrders,
    conversionRate: estimatedVisitors > 0 ? Math.round((paidOrders / estimatedVisitors) * 100) : 0,
  });
});

// Cart abandonment stats
performanceMetricsRoutes.get('/abandonment', async (_req: Request, res: Response) => {
  const [total, abandoned, recovered] = await Promise.all([
    prisma.cartItem.groupBy({ by: ['sessionId'] }).then((r) => r.length),
    prisma.abandonedCart.count(),
    prisma.abandonedCart.count({ where: { recovered: true } }),
  ]);

  res.json({
    totalCartSessions: total,
    abandonedCarts: abandoned,
    recoveredCarts: recovered,
    abandonmentRate: total > 0 ? Math.round((abandoned / total) * 100) : 0,
    recoveryRate: abandoned > 0 ? Math.round((recovered / abandoned) * 100) : 0,
  });
});
