import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { createDelivery, listDeliveries } from '../services/deliveryService';
import { AppError } from '../lib/errors';

const router = Router();

const createDeliverySchema = z.object({
  sellerId: z.string().min(1, 'Seller ID is required'),
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int().positive('Quantity must be a positive integer'),
  deliveredAt: z.string().datetime('deliveredAt must be a valid ISO 8601 datetime'),
});

/**
 * POST /api/deliveries
 * Create a delivery record. Driver only.
 * The driverId is always taken from the authenticated user — never from the request body.
 */
router.post('/', authenticate, requireRole('DRIVER'), async (req, res, next) => {
  try {
    const result = createDeliverySchema.safeParse(req.body);
    if (!result.success) {
      const fields: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path.join('.');
        fields[key] = issue.message;
      }
      next(new AppError('VALIDATION_ERROR', 'Validation failed', 400));
      return;
    }

    // req.user is guaranteed by authenticate middleware
    const delivery = await createDelivery(req.user!.id, result.data);
    res.status(201).json(delivery);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/deliveries
 * List delivery records, scoped by the requesting user's role.
 * - DRIVER: only their own records
 * - SELLER: only records for their account
 * - PLATFORM_ADMIN: all records, with optional filters
 *
 * Query params: sellerId, driverId, productId, startDate, endDate (all optional)
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { sellerId, driverId, productId, startDate, endDate } = req.query as Record<
      string,
      string | undefined
    >;

    const deliveries = await listDeliveries(
      { sellerId, driverId, productId, startDate, endDate },
      req.user!
    );
    res.json(deliveries);
  } catch (err) {
    next(err);
  }
});

export default router;
