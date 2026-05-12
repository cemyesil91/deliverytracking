import { prisma } from '../lib/prisma';
import { AppError } from '../lib/errors';

export interface SellerPriceEntry {
  sellerId: string;
  productId: string;
  productName: string;
  productUnit: string;
  price: number;
  updatedAt: Date;
}

type PriceWithProduct = {
  sellerId: string;
  productId: string;
  price: { toString(): string };
  updatedAt: Date;
  product: { name: string; unit: string };
};

/**
 * Return all price entries for a seller, including product info.
 */
export async function getPricesForSeller(sellerId: string): Promise<SellerPriceEntry[]> {
  const prices = (await prisma.sellerPrice.findMany({
    where: { sellerId },
    include: {
      product: {
        select: {
          name: true,
          unit: true,
        },
      },
    },
    orderBy: {
      product: { name: 'asc' },
    },
  })) as PriceWithProduct[];

  return prices.map((p) => ({
    sellerId: p.sellerId,
    productId: p.productId,
    productName: p.product.name,
    productUnit: p.product.unit,
    price: Number(p.price),
    updatedAt: p.updatedAt,
  }));
}

/**
 * Create or update the price for a seller-product pair.
 *
 * Throws:
 *   NOT_FOUND (404) — seller or product does not exist
 */
export async function upsertPrice(
  sellerId: string,
  productId: string,
  price: number
): Promise<SellerPriceEntry> {
  // Verify seller exists
  const seller = await prisma.user.findUnique({ where: { id: sellerId } });
  if (!seller) {
    throw new AppError('NOT_FOUND', 'Seller not found', 404);
  }

  // Verify product exists
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    throw new AppError('NOT_FOUND', 'Product not found', 404);
  }

  const sellerPrice = (await prisma.sellerPrice.upsert({
    where: { sellerId_productId: { sellerId, productId } },
    create: { sellerId, productId, price },
    update: { price },
    include: {
      product: {
        select: {
          name: true,
          unit: true,
        },
      },
    },
  })) as PriceWithProduct;

  return {
    sellerId: sellerPrice.sellerId,
    productId: sellerPrice.productId,
    productName: sellerPrice.product.name,
    productUnit: sellerPrice.product.unit,
    price: Number(sellerPrice.price),
    updatedAt: sellerPrice.updatedAt,
  };
}
