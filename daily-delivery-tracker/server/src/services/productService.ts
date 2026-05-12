import { prisma } from '../lib/prisma';
import { AppError } from '../lib/errors';

export type ProductSource = 'BAKERY' | 'MILK_PRODUCER';

export interface ProductSummary {
  id: string;
  name: string;
  source: ProductSource;
  unit: string;
  isActive: boolean;
  createdAt: Date;
}

export interface CreateProductData {
  name: string;
  source: ProductSource;
  unit: string;
}

export interface UpdateProductData {
  name?: string;
  unit?: string;
  isActive?: boolean;
}

/**
 * Return all products ordered by name.
 */
export async function listProducts(): Promise<ProductSummary[]> {
  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      source: true,
      unit: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { name: 'asc' },
  });

  return products as ProductSummary[];
}

/**
 * Create a new product.
 *
 * Throws:
 *   PRODUCT_NAME_TAKEN (409) — a product with the given name already exists
 */
export async function createProduct(data: CreateProductData): Promise<ProductSummary> {
  const existing = await prisma.product.findUnique({ where: { name: data.name } });
  if (existing) {
    throw new AppError('PRODUCT_NAME_TAKEN', 'A product with that name already exists', 409);
  }

  const product = await prisma.product.create({
    data: {
      name: data.name,
      source: data.source,
      unit: data.unit,
    },
    select: {
      id: true,
      name: true,
      source: true,
      unit: true,
      isActive: true,
      createdAt: true,
    },
  });

  return product as ProductSummary;
}

/**
 * Update an existing product's name, unit, and/or active status.
 *
 * Throws:
 *   NOT_FOUND (404) — no product with the given id exists
 */
export async function updateProduct(id: string, data: UpdateProductData): Promise<ProductSummary> {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('NOT_FOUND', 'Product not found', 404);
  }

  const product = await prisma.product.update({
    where: { id },
    data,
    select: {
      id: true,
      name: true,
      source: true,
      unit: true,
      isActive: true,
      createdAt: true,
    },
  });

  return product as ProductSummary;
}
