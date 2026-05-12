import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { getBalance, createDebt, createPayment, listSellerBalances } from '../services/financialService';
import { AppError } from '../lib/errors';
import { financialRecordSchema } from '../lib/financialSchemas';

const router = Router();

/**
 * GET /api/sellers/balances
 * List all sellers with their current balance. Platform Admin only.
 * NOTE: This route must be registered BEFORE /:sellerId routes to avoid conflicts.
 */
router.get('/balances', authenticate, requireRole('PLATFORM_ADMIN'), async (_req, res, next) => {
  try {
    const balances = await listSellerBalances();
    res.json(balances);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/sellers/:sellerId/balance
 * Get balance and transaction history for a seller.
 * Platform Admin can access any seller; Seller can only access their own.
 */
router.get('/:sellerId/balance', authenticate, async (req, res, next) => {
  try {
    const { sellerId } = req.params;
    const user = req.user!;

    // Sellers can only view their own balance
    if (user.role === 'SELLER' && user.id !== sellerId) {
      next(new AppError('FORBIDDEN', 'You do not have permission to access this resource', 403));
      return;
    }

    // Drivers cannot access balance endpoints
    if (user.role === 'DRIVER') {
      next(new AppError('FORBIDDEN', 'You do not have permission to access this resource', 403));
      return;
    }

    const detail = await getBalance(sellerId);
    res.json(detail);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/sellers/:sellerId/debts
 * Record a debt for a seller. Platform Admin only.
 */
router.post('/:sellerId/debts', authenticate, requireRole('PLATFORM_ADMIN'), async (req, res, next) => {
  try {
    const result = financialRecordSchema.safeParse(req.body);
    if (!result.success) {
      const fields: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path.join('.');
        fields[key] = issue.message;
      }
      next(new AppError('VALIDATION_ERROR', 'Validation failed', 400));
      return;
    }

    const entry = await createDebt(req.params.sellerId, result.data);
    res.status(201).json(entry);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/sellers/:sellerId/payments
 * Record a payment for a seller. Platform Admin only.
 */
router.post('/:sellerId/payments', authenticate, requireRole('PLATFORM_ADMIN'), async (req, res, next) => {
  try {
    const result = financialRecordSchema.safeParse(req.body);
    if (!result.success) {
      const fields: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path.join('.');
        fields[key] = issue.message;
      }
      next(new AppError('VALIDATION_ERROR', 'Validation failed', 400));
      return;
    }

    const entry = await createPayment(req.params.sellerId, result.data);
    res.status(201).json(entry);
  } catch (err) {
    next(err);
  }
});

export default router;
