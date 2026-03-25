import { Router, Request, Response } from 'express';
import { z } from 'zod';

export const shippingRoutes = Router();

export type CountryCode = 'IN' | 'US' | 'AE' | 'GB' | string;

export const SHIPPING_RATES: Record<string, { rate: number; freeAbove?: number; days: string }> = {
  IN:      { rate: 99,   freeAbove: 999,  days: '3-7' },
  US:      { rate: 1499,                  days: '10-15' },
  AE:      { rate: 999,                   days: '12-20' },
  GB:      { rate: 1299,                  days: '12-20' },
  DEFAULT: { rate: 1999,                  days: '12-20' },
};

export function calculateShipping(subtotal: number, country: string): number {
  const config = SHIPPING_RATES[country] || SHIPPING_RATES['DEFAULT'];
  if (config.freeAbove !== undefined && subtotal >= config.freeAbove) return 0;
  return config.rate;
}

export function getDeliveryEstimate(country: string): string {
  const config = SHIPPING_RATES[country] || SHIPPING_RATES['DEFAULT'];
  return `${config.days} business days`;
}

// POST /api/shipping/calculate
shippingRoutes.post('/calculate', (req: Request, res: Response) => {
  const { subtotal, country } = z
    .object({
      subtotal: z.number().min(0),
      country: z.string().default('IN'),
    })
    .parse(req.body);

  const shipping = calculateShipping(subtotal, country);
  const delivery = getDeliveryEstimate(country);

  res.json({
    shipping,
    country,
    delivery,
    free: shipping === 0,
    freeAbove: (SHIPPING_RATES[country] || SHIPPING_RATES['DEFAULT']).freeAbove,
  });
});

// GET /api/shipping/rates
shippingRoutes.get('/rates', (_req: Request, res: Response) => {
  res.json(SHIPPING_RATES);
});
