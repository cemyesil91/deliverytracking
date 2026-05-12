import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { financialRecordSchema } from './financialSchemas';

// ---------------------------------------------------------------------------
// Unit tests
// ---------------------------------------------------------------------------

describe('financialRecordSchema', () => {
  it('accepts a valid positive amount', () => {
    const result = financialRecordSchema.safeParse({ amount: 100, date: '2024-01-15' });
    expect(result.success).toBe(true);
  });

  it('accepts a valid amount with an optional note', () => {
    const result = financialRecordSchema.safeParse({
      amount: 50.5,
      date: '2024-01-15',
      note: 'January payment',
    });
    expect(result.success).toBe(true);
  });

  it('rejects amount of zero', () => {
    const result = financialRecordSchema.safeParse({ amount: 0, date: '2024-01-15' });
    expect(result.success).toBe(false);
  });

  it('rejects a negative amount', () => {
    const result = financialRecordSchema.safeParse({ amount: -50, date: '2024-01-15' });
    expect(result.success).toBe(false);
  });

  it('rejects a missing date', () => {
    const result = financialRecordSchema.safeParse({ amount: 100 });
    expect(result.success).toBe(false);
  });

  it('rejects a missing amount', () => {
    const result = financialRecordSchema.safeParse({ date: '2024-01-15' });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Property-based tests
// ---------------------------------------------------------------------------

/**
 * Feature: daily-delivery-tracker, Property 8: Financial record validation rejects non-positive amounts
 * For any debt or payment submission where amount <= 0, the Zod schema must
 * reject the record. No record should be persisted (schema rejection prevents
 * the service layer from being called).
 */
describe('Property 8: Financial record validation rejects non-positive amounts', () => {
  it('rejects zero and negative amounts for debt records', () => {
    fc.assert(
      fc.property(
        // Generate zero or negative numbers
        fc.oneof(
          fc.constant(0),
          fc.float({ min: -1_000_000, max: -Number.EPSILON, noNaN: true })
        ),
        (amount) => {
          const result = financialRecordSchema.safeParse({
            amount,
            date: '2024-01-15',
          });
          expect(result.success).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('rejects zero and negative amounts for payment records', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(0),
          fc.float({ min: -1_000_000, max: -Number.EPSILON, noNaN: true })
        ),
        (amount) => {
          const result = financialRecordSchema.safeParse({
            amount,
            date: '2024-06-01',
            note: 'some note',
          });
          expect(result.success).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('accepts all strictly positive amounts', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Number.EPSILON, max: 1_000_000, noNaN: true }),
        (amount) => {
          const result = financialRecordSchema.safeParse({
            amount,
            date: '2024-01-15',
          });
          expect(result.success).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
