import type { DateRange } from '../types/index';

export interface ReportLine {
  quantity: number;
  unitPrice: number | null;
  lineTotal: number | null;
}

export interface ReportSummary {
  totalQuantity: number;
  totalValue: number;
}

/**
 * Returns true if the date range is valid (start <= end).
 * Dates are expected as YYYY-MM-DD strings.
 */
export function isDateRangeValid(start: string, end: string): boolean {
  return start <= end;
}

/**
 * Filters delivery records to those whose deliveredAt falls within [start, end] inclusive.
 * Dates are compared as ISO 8601 strings (lexicographic comparison works for YYYY-MM-DD prefix).
 */
export function filterDeliveriesByDateRange<T extends { deliveredAt: string }>(
  records: T[],
  range: DateRange
): T[] {
  return records.filter((r) => {
    const date = r.deliveredAt.slice(0, 10); // YYYY-MM-DD
    return date >= range.startDate && date <= range.endDate;
  });
}

/**
 * Computes the line total for a delivery record.
 * Returns null if price is null (no seller price assigned).
 */
export function computeLineTotal(quantity: number, price: number | null): number | null {
  if (price === null) return null;
  return quantity * price;
}

/**
 * Computes the summary totals for a report.
 * Records with null lineTotal are excluded from totalValue.
 */
export function computeReportSummary(records: ReportLine[]): ReportSummary {
  let totalQuantity = 0;
  let totalValue = 0;

  for (const r of records) {
    totalQuantity += r.quantity;
    if (r.lineTotal !== null) {
      totalValue += r.lineTotal;
    }
  }

  return { totalQuantity, totalValue };
}
