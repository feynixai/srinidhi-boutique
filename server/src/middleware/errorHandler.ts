import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({ error: 'Validation error', details: err.errors });
    return;
  }

  // JSON parse errors from express.json()
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({ error: 'Invalid JSON body' });
    return;
  }

  // Prisma-specific errors
  const prismaError = err as { code?: string; meta?: { target?: string[] } };
  if (prismaError.code === 'P2002') {
    res.status(409).json({ error: 'A record with this value already exists', field: prismaError.meta?.target });
    return;
  }
  if (prismaError.code === 'P2025') {
    res.status(404).json({ error: 'Record not found' });
    return;
  }
  if (prismaError.code === 'P1001') {
    res.status(503).json({ error: 'Database connection failed. Please try again.' });
    return;
  }

  console.error('[ERROR]', err.name, err.message);
  res.status(500).json({ error: 'Internal server error. Please try again.' });
}
