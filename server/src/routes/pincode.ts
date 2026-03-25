import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const pincodeRoutes = Router();

// Major Indian pincodes seed data for fast lookup
const DEFAULT_ZONES: Record<string, { city: string; state: string; days: number }> = {
  '500': { city: 'Hyderabad', state: 'Telangana', days: 2 },
  '400': { city: 'Mumbai', state: 'Maharashtra', days: 3 },
  '110': { city: 'Delhi', state: 'Delhi', days: 3 },
  '600': { city: 'Chennai', state: 'Tamil Nadu', days: 3 },
  '560': { city: 'Bengaluru', state: 'Karnataka', days: 3 },
  '700': { city: 'Kolkata', state: 'West Bengal', days: 4 },
  '380': { city: 'Ahmedabad', state: 'Gujarat', days: 4 },
  '302': { city: 'Jaipur', state: 'Rajasthan', days: 5 },
  '226': { city: 'Lucknow', state: 'Uttar Pradesh', days: 4 },
  '411': { city: 'Pune', state: 'Maharashtra', days: 3 },
};

pincodeRoutes.get('/:pincode', async (req: Request, res: Response) => {
  const { pincode } = req.params;

  if (!/^\d{6}$/.test(pincode)) {
    return res.status(400).json({ available: false, message: 'Invalid pincode format' });
  }

  // Check DB first
  const zone = await prisma.pincodeZone.findUnique({ where: { pincode } }).catch(() => null);
  if (zone) {
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + zone.deliveryDays);
    return res.json({
      available: zone.available,
      city: zone.city,
      state: zone.state,
      deliveryDays: zone.deliveryDays,
      deliveryDate: deliveryDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }),
    });
  }

  // Fallback: check prefix
  const prefix3 = pincode.slice(0, 3);
  const prefix2 = pincode.slice(0, 2);
  const match = DEFAULT_ZONES[prefix3] || DEFAULT_ZONES[prefix2];

  if (match) {
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + match.days);
    return res.json({
      available: true,
      city: match.city,
      state: match.state,
      deliveryDays: match.days,
      deliveryDate: deliveryDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }),
    });
  }

  // Default: deliver anywhere in India
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 7);
  return res.json({
    available: true,
    city: '',
    state: '',
    deliveryDays: 7,
    deliveryDate: deliveryDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }),
  });
});
