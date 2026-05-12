/**
 * Shared domain types for the Daily Delivery Tracker.
 * These types are used across the server and mirror the client-side types.
 */

export type Role = 'PLATFORM_ADMIN' | 'DRIVER' | 'SELLER';

export interface AuthUser {
  id: string;
  username: string;
  role: Role;
}

export interface DeliveryRecord {
  id: string;
  driverId: string;
  driverName: string;
  sellerId: string;
  sellerName: string;
  productId: string;
  productName: string;
  productUnit: string;
  quantity: number;
  deliveredAt: string; // ISO 8601
}

export interface SellerBalance {
  sellerId: string;
  sellerName: string;
  totalDebts: number;
  totalPayments: number;
  balance: number; // totalDebts - totalPayments
}

export interface TransactionEntry {
  id: string;
  type: 'DEBT' | 'PAYMENT';
  amount: number;
  date: string;
  note?: string;
}

export interface DateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
}
