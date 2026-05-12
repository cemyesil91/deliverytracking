import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { calculateBalance } from './balanceUtils';

// ---------------------------------------------------------------------------
// Unit tests
// ---------------------------------------------------------------------------

describe('calculateBalance', () => {
  it('returns 0 for empty arrays', () => {
    expect(calculateBalance([], [])).toBe(0);
  });

  it('returns sum of debts when no payments', () => {
    expect(calculateBalance([100, 200, 50], [])).toBe(350);
  });

  it('returns negative of payments when no debts', () => {
    expect(calculateBalance([], [100, 50])).toBe(-150);
  });

  it('returns debts minus payments', () => {
    expect(calculateBalance([500], [200])).toBe(300);
  });

  it('returns negative balance when payments exceed debts', () => {
    expect(calculateBalance([100], [300])).toBe(-200);
  });
});

// ---------------------------------------------------------------------------
// Property-based tests
// ---------------------------------------------------------------------------

/**
 * Feature: daily-delivery-tracker, Property 7: Balance calculation consistency
 * For any arrays of debt and payment amounts,
 * calculateBalance(debts, payments) === sum(debts) - sum(payments)
 */
describe('Property 7: Balance calculation consistency', () => {
  it('always equals sum(debts) - sum(payments)', () => {
    fc.assert(
      fc.property(
        fc.array(fc.float({ min: Math.fround(0.01), max: Math.fround(100000), noNaN: true }), {
          minLength: 0,
          maxLength: 100,
        }),
        fc.array(fc.float({ min: Math.fround(0.01), max: Math.fround(100000), noNaN: true }), {
          minLength: 0,
          maxLength: 100,
        }),
        (debts, payments) => {
          const result = calculateBalance(debts, payments);
          const expected =
            debts.reduce((s, v) => s + v, 0) - payments.reduce((s, v) => s + v, 0);
          expect(result).toBeCloseTo(expected, 5);
        }
      ),
      { numRuns: 100 }
    );
  });
});
