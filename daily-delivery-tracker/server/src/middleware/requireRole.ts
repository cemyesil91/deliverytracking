import type { Request, Response, NextFunction } from 'express';
import type { Role } from '../types/index';
import { AppError } from '../lib/errors';

export function requireRole(role: Role) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError('UNAUTHENTICATED', 'Authentication required', 401));
      return;
    }
    if (req.user.role !== role) {
      next(new AppError('FORBIDDEN', 'You do not have permission to access this resource', 403));
      return;
    }
    next();
  };
}
