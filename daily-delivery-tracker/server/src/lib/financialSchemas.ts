import { z } from 'zod';

/**
 * Zod schema for debt and payment record creation.
 * Shared between route handlers and tests.
 */
export const financialRecordSchema = z.object({
  amount: z.number().positive('Amount must be a positive number'),
  date: z.string().min(1, 'Date is required'),
  note: z.string().optional(),
});

export type FinancialRecordInput = z.infer<typeof financialRecordSchema>;
