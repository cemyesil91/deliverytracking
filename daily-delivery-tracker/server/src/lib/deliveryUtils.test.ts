import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  isDateRangeValid,
  filterDeliveriesByDateRange,
  computeLineTotal,
  computeReportSummary,
} from './deliveryUtils';

// ---------------------------------------------------------------------------
// Unit tests
// ---------------------------------------------------------------------------

describe('isDateRangeValid', () => {
  it('returns true when start equals end', () => {
    expect(isDateRangeValid('2024-01-01', '2024-01-01')).toBe(true);
  });

  it('returns true when start is before end', () => {
    expect(isDateRangeValid('2024-01-01', '2024-12-31')).toBe(true);
  });

  it('returns false when start is after end', () => {
    expect(isDateRangeValid('2024-12-31', '2024-01-01')).toBe(false);
  });
});

describe('filterDeliveriesByDateRange', () => {
  it('returns only records within the range', () => {
    const records = [
      { id: '1', deliveredAt: '2024-01-01T10:00:00.000Z' },
      { id: '2', deliveredAt: '2024-01-15T10:00:00.000Z' },
      { id: '3', deliveredAt: '2024-02-01T10:00:00.000Z' },
    ];
    const result = filterDeliveriesByDateRange(records, {
      startDate: '2024-01-01',
      endDate: '2024-01-31',
    });
    expect(result.map((r) => r.id)).toEqual(['1', '2']);
  });

  it('includes records on the boundary dates', () => {
    const records = [
      { id: '1', deliveredAt: '2024-01-01T00:00:00.000Z' },
      { id: '2', deliveredAt: '2024-01-31T23:59:59.000Z' },
    ];
    const result = filterDeliveriesByDateRange(records, {
      startDate: '2024-01-01',
      endDate: '2024-01-31',
    });
    expect(result).toHaveLength(2);
  });
});

describe('computeLineTotal', () => {
  it('returns quantity * price', () => {
    expect(computeLineTotal(5, 2.5)).toBe(12.5);
  });

  it('returns null when price is null', () => {
    expect(computeLineTotal(5, null)).toBeNull();
  });
});

describe('computeReportSummary', () => {
  it('sums quantities and values correctly', () => {
    const records = [
      { quantity: 3, unitPrice: 2, lineTotal: 6 },
      { quantity: 5, unitPrice: 4, lineTotal: 20 },
    ];
    expect(computeReportSummary(records)).toEqual({ totalQuantity: 8, totalValue: 26 });
  });

  it('excludes null lineTotals from totalValue', () => {
    const records = [
      { quantity: 3, unitPrice: null, lineTotal: null },
      { quantity: 5, unitPrice: 4, lineTotal: 20 },
    ];
    expect(computeReportSummary(records)).toEqual({ totalQuantity: 8, totalValue: 20 });
  });
});

// ---------------------------------------------------------------------------
// Property-based tests
// ---------------------------------------------------------------------------

/**
 * Feature: daily-delivery-tracker, Property 4: Date range filter correctness
 * For any valid date range [start, end] (start <= end), every record returned by
 * filterDeliveriesByDateRange has deliveredAt within [start, end] inclusive,
 * and no out-of-range record appears.
 */
describe('Property 4: Date range filter correctness', () => {
  it('all returned records fall within the specified date range', () => {
    fc.assert(
      fc.property(
        // Generate an array of records with random dates in 2023-2025
        fc.array(
          fc.record({
            id: fc.uuid(),
            deliveredAt: fc.date({
              min: new Date('2023-01-01'),
              max: new Date('2025-12-31'),
            }).map((d) => d.toISOString()),
          }),
          { minLength: 0, maxLength: 50 }
        ),
        // Generate a valid date range (start <= end)
        fc.tuple(
          fc.integer({ min: 0, max: 364 }),
          fc.integer({ min: 0, max: 364 })
        ).map(([a, b]) => {
          const base = new Date('2024-01-01');
          const d1 = new Date(base.getTime() + Math.min(a, b) * 86400000);
          const d2 = new Date(base.getTime() + Math.max(a, b) * 86400000);
          return {
            startDate: d1.toISOString().slice(0, 10),
            endDate: d2.toISOString().slice(0, 10),
          };
        }),
        (records, range) => {
          const result = filterDeliveriesByDateRange(records, range);

          // Every returned record must be within the range
          for (const r of result) {
            const date = r.deliveredAt.slice(0, 10);
            expect(date >= range.startDate).toBe(true);
            expect(date <= range.endDate).toBe(true);
          }

          // No out-of-range record should appear in the result
          const outOfRange = records.filter((r) => {
            const date = r.deliveredAt.slice(0, 10);
            return date < range.startDate || date > range.endDate;
          });
          for (const r of outOfRange) {
            expect(result.find((res) => res.id === r.id)).toBeUndefined();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: daily-delivery-tracker, Property 5: Invalid date range rejection
 * For any date pair where start > end, isDateRangeValid returns false.
 */
describe('Property 5: Invalid date range rejection', () => {
  it('isDateRangeValid returns false when start > end', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.integer({ min: 1, max: 365 }),
          fc.integer({ min: 1, max: 365 })
        ).filter(([a, b]) => a !== b).map(([a, b]) => {
          const base = new Date('2024-01-01');
          const d1 = new Date(base.getTime() + Math.max(a, b) * 86400000);
          const d2 = new Date(base.getTime() + Math.min(a, b) * 86400000);
          return {
            start: d1.toISOString().slice(0, 10),
            end: d2.toISOString().slice(0, 10),
          };
        }),
        ({ start, end }) => {
          expect(isDateRangeValid(start, end)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: daily-delivery-tracker, Property 9: Delivery report line total and summary correctness
 * For any set of (quantity, price) pairs:
 * - computeLineTotal(qty, price) === qty * price
 * - computeReportSummary totals equal the sums of all lines
 */
describe('Property 9: Report line total and summary correctness', () => {
  it('line totals equal quantity * price and summary totals are correct', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            quantity: fc.integer({ min: 1, max: 1000 }),
            price: fc.oneof(
              fc.float({ min: Math.fround(0.01), max: Math.fround(9999.99), noNaN: true }),
              fc.constant(null)
            ),
          }),
          { minLength: 0, maxLength: 50 }
        ),
        (items) => {
          const lines = items.map((item) => ({
            quantity: item.quantity,
            unitPrice: item.price,
            lineTotal: computeLineTotal(item.quantity, item.price),
          }));

          // Each line total must equal qty * price (or null)
          for (let i = 0; i < items.length; i++) {
            const { quantity, price } = items[i];
            if (price === null) {
              expect(lines[i].lineTotal).toBeNull();
            } else {
              expect(lines[i].lineTotal).toBeCloseTo(quantity * price, 5);
            }
          }

          // Summary totals must equal sums
          const summary = computeReportSummary(lines);
          const expectedQty = items.reduce((s, i) => s + i.quantity, 0);
          const expectedValue = lines
            .filter((l) => l.lineTotal !== null)
            .reduce((s, l) => s + (l.lineTotal as number), 0);

          expect(summary.totalQuantity).toBe(expectedQty);
          expect(summary.totalValue).toBeCloseTo(expectedValue, 5);
        }
      ),
      { numRuns: 100 }
    );
  });
});
