import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { listProducts, createProduct, updateProduct } from '../services/productService';
import { AppError } from '../lib/errors';

const router = Router();

const createProductSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  source: z.enum(['BAKERY', 'MILK_PRODUCER']),
  unit: z.string().min(1, 'Unit is required'),
});

const updateProductSchema = z.object({
  name: z.string().min(1, 'Name must not be empty').optional(),
  unit: z.string().min(1, 'Unit must not be empty').optional(),
  isActive: z.boolean().optional(),
});

/**
 * GET /api/products
 * List all products. Platform Admin only.
 */
router.get('/', authenticate, requireRole('PLATFORM_ADMIN'), async (_req, res, next) => {
  try {
    const products = await listProducts();
    res.json(products);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/products
 * Create a new product. Platform Admin only.
 */
router.post('/', authenticate, requireRole('PLATFORM_ADMIN'), async (req, res, next) => {
  try {
    const result = createProductSchema.safeParse(req.body);
    if (!result.success) {
      const fields: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path.join('.');
        fields[key] = issue.message;
      }
      next(new AppError('VALIDATION_ERROR', 'Validation failed', 400));
      return;
    }

    const product = await createProduct(result.data);
    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/products/:id
 * Update a product's name, unit, or active status. Platform Admin only.
 */
router.patch('/:id', authenticate, requireRole('PLATFORM_ADMIN'), async (req, res, next) => {
  try {
    const result = updateProductSchema.safeParse(req.body);
    if (!result.success) {
      const fields: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path.join('.');
        fields[key] = issue.message;
      }
      next(new AppError('VALIDATION_ERROR', 'Validation failed', 400));
      return;
    }

    const product = await updateProduct(req.params.id, result.data);
    res.json(product);
  } catch (err) {
    next(err);
  }
});

export default router;
