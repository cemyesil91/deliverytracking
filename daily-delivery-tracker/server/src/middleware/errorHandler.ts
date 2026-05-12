import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../lib/errors';

/**
 * Global error handler middleware.
 * Must be registered last (after all routes) in the Express app.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.code,
      message: err.message,
    });
    return;
  }

  if (err instanceof ZodError) {
    const fields: Record<string, string> = {};
    for (const issue of err.issues) {
      const path = issue.path.join('.') || '_';
      fields[path] = issue.message;
    }
    res.status(400).json({
      error: 'VALIDATION_ERROR',
      fields,
    });
    return;
  }

  // Unknown / unexpected errors
  res.status(500).json({
    error: 'INTERNAL_ERROR',
  });
}
