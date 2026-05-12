import { prisma } from '../lib/prisma';
import { AppError } from '../lib/errors';
import { isDateRangeValid } from '../lib/deliveryUtils';
import type { AuthUser, DeliveryRecord } from '../types/index';

export interface CreateDeliveryData {
  sellerId: string;
  productId: string;
  quantity: number;
  deliveredAt: string; // ISO 8601
}

export interface DeliveryFilters {
  sellerId?: string;
  driverId?: string;
  productId?: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
}

type DeliveryWithRelations = {
  id: string;
  driverId: string;
  sellerId: string;
  productId: string;
  quantity: number;
  deliveredAt: Date;
  createdAt: Date;
  driver: { username: string };
  seller: { username: string };
  product: { name: string; unit: string };
};

function mapDelivery(d: DeliveryWithRelations): DeliveryRecord {
  return {
    id: d.id,
    driverId: d.driverId,
    driverName: d.driver.username,
    sellerId: d.sellerId,
    sellerName: d.seller.username,
    productId: d.productId,
    productName: d.product.name,
    productUnit: d.product.unit,
    quantity: d.quantity,
    deliveredAt: d.deliveredAt.toISOString(),
  };
}

/**
 * Create a delivery record.
 * The driverId is always taken from the authenticated user — never from the request body.
 *
 * Throws:
 *   NOT_FOUND (404) — seller or product does not exist
 */
export async function createDelivery(
  authenticatedDriverId: string,
  data: CreateDeliveryData
): Promise<DeliveryRecord> {
  // Verify seller exists and is a SELLER role
  const seller = await prisma.user.findUnique({ where: { id: data.sellerId } });
  if (!seller || seller.role !== 'SELLER') {
    throw new AppError('NOT_FOUND', 'Seller not found', 404);
  }

  // Verify product exists and is active
  const product = await prisma.product.findUnique({ where: { id: data.productId } });
  if (!product || !product.isActive) {
    throw new AppError('NOT_FOUND', 'Product not found or inactive', 404);
  }

  const record = (await prisma.deliveryRecord.create({
    data: {
      driverId: authenticatedDriverId, // always use authenticated driver's ID
      sellerId: data.sellerId,
      productId: data.productId,
      quantity: data.quantity,
      deliveredAt: new Date(data.deliveredAt),
    },
    include: {
      driver: { select: { username: true } },
      seller: { select: { username: true } },
      product: { select: { name: true, unit: true } },
    },
  })) as DeliveryWithRelations;

  return mapDelivery(record);
}

/**
 * List delivery records, scoped by the requesting user's role.
 * - DRIVER: only their own records
 * - SELLER: only records for their account
 * - PLATFORM_ADMIN: all records, with optional filters
 *
 * Throws:
 *   VALIDATION_ERROR (400) — invalid date range (start > end)
 */
export async function listDeliveries(
  filters: DeliveryFilters,
  requestingUser: AuthUser
): Promise<DeliveryRecord[]> {
  // Validate date range if both are provided
  if (filters.startDate && filters.endDate) {
    if (!isDateRangeValid(filters.startDate, filters.endDate)) {
      throw new AppError('VALIDATION_ERROR', 'Start date must not be after end date', 400);
    }
  }

  // Build the where clause
  const where: Record<string, unknown> = {};

  // Role-based scoping — cannot be overridden by query params
  if (requestingUser.role === 'DRIVER') {
    where.driverId = requestingUser.id;
  } else if (requestingUser.role === 'SELLER') {
    where.sellerId = requestingUser.id;
  } else {
    // PLATFORM_ADMIN: apply optional filters
    if (filters.sellerId) where.sellerId = filters.sellerId;
    if (filters.driverId) where.driverId = filters.driverId;
    if (filters.productId) where.productId = filters.productId;
  }

  // Date range filter (applies to all roles)
  if (filters.startDate || filters.endDate) {
    const deliveredAt: Record<string, Date> = {};
    if (filters.startDate) {
      deliveredAt.gte = new Date(`${filters.startDate}T00:00:00.000Z`);
    }
    if (filters.endDate) {
      deliveredAt.lte = new Date(`${filters.endDate}T23:59:59.999Z`);
    }
    where.deliveredAt = deliveredAt;
  }

  const records = (await prisma.deliveryRecord.findMany({
    where,
    include: {
      driver: { select: { username: true } },
      seller: { select: { username: true } },
      product: { select: { name: true, unit: true } },
    },
    orderBy: { deliveredAt: 'desc' },
  })) as DeliveryWithRelations[];

  return records.map(mapDelivery);
}
