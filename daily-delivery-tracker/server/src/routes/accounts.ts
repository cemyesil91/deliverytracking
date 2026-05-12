import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { listAccounts, createAccount, updateAccount } from '../services/accountService';
import { AppError } from '../lib/errors';

const router = Router();

const createAccountSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['PLATFORM_ADMIN', 'DRIVER', 'SELLER']),
});

const updateAccountSchema = z.object({
  role: z.enum(['PLATFORM_ADMIN', 'DRIVER', 'SELLER']).optional(),
  isActive: z.boolean().optional(),
});

/**
 * GET /api/accounts
 * List all user accounts. Platform Admin only.
 */
router.get('/', authenticate, requireRole('PLATFORM_ADMIN'), async (_req, res, next) => {
  try {
    const accounts = await listAccounts();
    res.json(accounts);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/accounts
 * Create a new user account. Platform Admin only.
 */
router.post('/', authenticate, requireRole('PLATFORM_ADMIN'), async (req, res, next) => {
  try {
    const result = createAccountSchema.safeParse(req.body);
    if (!result.success) {
      const fields: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path.join('.');
        fields[key] = issue.message;
      }
      next(new AppError('VALIDATION_ERROR', 'Validation failed', 400));
      return;
    }

    const account = await createAccount(result.data);
    res.status(201).json(account);
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/accounts/:id
 * Update an account's role or active status. Platform Admin only.
 */
router.patch('/:id', authenticate, requireRole('PLATFORM_ADMIN'), async (req, res, next) => {
  try {
    const result = updateAccountSchema.safeParse(req.body);
    if (!result.success) {
      const fields: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path.join('.');
        fields[key] = issue.message;
      }
      next(new AppError('VALIDATION_ERROR', 'Validation failed', 400));
      return;
    }

    const account = await updateAccount(req.params.id, result.data);
    res.json(account);
  } catch (err) {
    next(err);
  }
});

export default router;
