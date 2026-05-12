import { prisma } from '../lib/prisma';
import { AppError } from '../lib/errors';
import { calculateBalance } from '../lib/balanceUtils';
import type { SellerBalance, TransactionEntry } from '../types/index';

export interface CreateDebtData {
  amount: number;
  date: string; // ISO 8601 date string
  note?: string;
}

export interface CreatePaymentData {
  amount: number;
  date: string; // ISO 8601 date string
  note?: string;
}

export interface SellerBalanceDetail {
  balance: SellerBalance;
  transactions: TransactionEntry[];
}

/**
 * Get the balance and full transaction history for a seller.
 *
 * Throws:
 *   NOT_FOUND (404) — seller does not exist
 */
export async function getBalance(sellerId: string): Promise<SellerBalanceDetail> {
  const seller = await prisma.user.findUnique({ where: { id: sellerId } });
  if (!seller || seller.role !== 'SELLER') {
    throw new AppError('NOT_FOUND', 'Seller not found', 404);
  }

  const [debts, payments] = await Promise.all([
    prisma.debtRecord.findMany({ where: { sellerId }, orderBy: { date: 'asc' } }),
    prisma.paymentRecord.findMany({ where: { sellerId }, orderBy: { date: 'asc' } }),
  ]);

  const debtAmounts = debts.map((d: { amount: { toString(): string } | number }) => Number(d.amount));
  const paymentAmounts = payments.map((p: { amount: { toString(): string } | number }) => Number(p.amount));
  const balance = calculateBalance(debtAmounts, paymentAmounts);

  const transactions: TransactionEntry[] = [
    ...debts.map((d: { id: string; amount: { toString(): string } | number; date: Date; note: string | null }) => ({
      id: d.id,
      type: 'DEBT' as const,
      amount: Number(d.amount),
      date: d.date.toISOString(),
      note: d.note ?? undefined,
    })),
    ...payments.map((p: { id: string; amount: { toString(): string } | number; date: Date; note: string | null }) => ({
      id: p.id,
      type: 'PAYMENT' as const,
      amount: Number(p.amount),
      date: p.date.toISOString(),
      note: p.note ?? undefined,
    })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return {
    balance: {
      sellerId,
      sellerName: seller.username,
      totalDebts: debtAmounts.reduce((s: number, v: number) => s + v, 0),
      totalPayments: paymentAmounts.reduce((s: number, v: number) => s + v, 0),
      balance,
    },
    transactions,
  };
}

/**
 * Record a debt for a seller.
 *
 * Throws:
 *   NOT_FOUND (404) — seller does not exist
 */
export async function createDebt(
  sellerId: string,
  data: CreateDebtData
): Promise<TransactionEntry> {
  const seller = await prisma.user.findUnique({ where: { id: sellerId } });
  if (!seller || seller.role !== 'SELLER') {
    throw new AppError('NOT_FOUND', 'Seller not found', 404);
  }

  const record = await prisma.debtRecord.create({
    data: {
      sellerId,
      amount: data.amount,
      date: new Date(data.date),
      note: data.note,
    },
  });

  return {
    id: record.id,
    type: 'DEBT',
    amount: Number(record.amount),
    date: record.date.toISOString(),
    note: record.note ?? undefined,
  };
}

/**
 * Record a payment for a seller.
 *
 * Throws:
 *   NOT_FOUND (404) — seller does not exist
 */
export async function createPayment(
  sellerId: string,
  data: CreatePaymentData
): Promise<TransactionEntry> {
  const seller = await prisma.user.findUnique({ where: { id: sellerId } });
  if (!seller || seller.role !== 'SELLER') {
    throw new AppError('NOT_FOUND', 'Seller not found', 404);
  }

  const record = await prisma.paymentRecord.create({
    data: {
      sellerId,
      amount: data.amount,
      date: new Date(data.date),
      note: data.note,
    },
  });

  return {
    id: record.id,
    type: 'PAYMENT',
    amount: Number(record.amount),
    date: record.date.toISOString(),
    note: record.note ?? undefined,
  };
}

/**
 * List all sellers with their current balance.
 * Only returns users with SELLER role.
 */
export async function listSellerBalances(): Promise<SellerBalance[]> {
  const sellers = await prisma.user.findMany({
    where: { role: 'SELLER' },
    orderBy: { username: 'asc' },
  });

  const results = await Promise.all(
    sellers.map(async (seller: { id: string; username: string }) => {
      const [debts, payments] = await Promise.all([
        prisma.debtRecord.findMany({ where: { sellerId: seller.id } }),
        prisma.paymentRecord.findMany({ where: { sellerId: seller.id } }),
      ]);

      const debtAmounts = debts.map((d: { amount: { toString(): string } | number }) => Number(d.amount));
      const paymentAmounts = payments.map((p: { amount: { toString(): string } | number }) => Number(p.amount));
      const balance = calculateBalance(debtAmounts, paymentAmounts);

      return {
        sellerId: seller.id,
        sellerName: seller.username,
        totalDebts: debtAmounts.reduce((s: number, v: number) => s + v, 0),
        totalPayments: paymentAmounts.reduce((s: number, v: number) => s + v, 0),
        balance,
      };
    })
  );

  return results;
}
