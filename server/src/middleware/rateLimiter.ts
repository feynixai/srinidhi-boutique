import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';

interface Window {
  count: number;
  resetAt: number;
}

// Simple in-memory rate limiter — sufficient for a boutique store.
// For multi-instance prod, swap the Map for Redis.
const store = new Map<string, Window>();

function getKey(req: Request): string {
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
  return `${ip}:${req.path}`;
}

/**
 * Creates a rate-limit middleware.
 * @param maxRequests  max requests per window
 * @param windowMs     window size in milliseconds
 */
export function rateLimit(maxRequests: number, windowMs: number) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (process.env.NODE_ENV === 'test') return next(); // skip in tests

    const key = getKey(req);
    const now = Date.now();
    const win = store.get(key);

    if (!win || now > win.resetAt) {
      store.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    win.count += 1;
    if (win.count > maxRequests) {
      throw new AppError(429, 'Too many requests — please try again later');
    }
    return next();
  };
}

// Prune expired entries every 5 minutes to avoid memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, win] of store) {
    if (now > win.resetAt) store.delete(key);
  }
}, 5 * 60 * 1000);
