import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { getPricesForSeller, upsertPrice } from '../services/sellerPriceService';
import { AppError } from '../lib/errors';

const router = Router();

const upsertPriceSchema = z.object({
  price: z.number().positive('Price must be a positive number'),
});

/**
 * GET /api/sellers/:sellerId/prices
 * List all prices for a seller. Platform Admin only.
 */
router.get(
  '/:sellerId/prices',
  authenticate,
  requireRole('PLATFORM_ADMIN'),
  async (req, res, next) => {
    try {
      const prices = await getPricesForSeller(req.params.sellerId);
      res.json(prices);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PUT /api/sellers/:sellerId/prices/:productId
 * Set or update a seller-product price. Platform Admin only.
 */
router.put(
  '/:sellerId/prices/:productId',
  authenticate,
  requireRole('PLATFORM_ADMIN'),
  async (req, res, next) => {
    try {
      const result = upsertPriceSchema.safeParse(req.body);
      if (!result.success) {
        const fields: Record<string, string> = {};
        for (const issue of result.error.issues) {
          const key = issue.path.join('.');
          fields[key] = issue.message;
        }
        next(new AppError('VALIDATION_ERROR', 'Validation failed', 400));
        return;
      }

      const entry = await upsertPrice(
        req.params.sellerId,
        req.params.productId,
        result.data.price
      );
      res.json(entry);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
