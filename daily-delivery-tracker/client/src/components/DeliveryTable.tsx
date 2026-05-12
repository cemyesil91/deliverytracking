import type { DeliveryRecord } from '../types/index';

export type DeliveryColumn =
  | 'sellerName'
  | 'productName'
  | 'quantity'
  | 'driverName'
  | 'deliveredAt'
  | 'unitPrice'
  | 'lineTotal';

interface ReportLine extends Omit<DeliveryRecord, 'productUnit'> {
  unitPrice?: number | null;
  lineTotal?: number | null;
  productUnit?: string;
}

interface DeliveryTableProps {
  records: ReportLine[];
  columns?: DeliveryColumn[];
  /** Optional summary row shown at the bottom (for seller reports) */
  summary?: { totalQuantity: number; totalValue: number };
  /** Show a warning when any record has a missing price */
  showMissingPriceWarning?: boolean;
  emptyMessage?: string;
}

const COLUMN_LABELS: Record<DeliveryColumn, string> = {
  sellerName: 'Seller',
  productName: 'Product',
  quantity: 'Qty',
  driverName: 'Driver',
  deliveredAt: 'Delivered At',
  unitPrice: 'Unit Price',
  lineTotal: 'Total',
};

const DEFAULT_COLUMNS: DeliveryColumn[] = [
  'sellerName',
  'productName',
  'quantity',
  'driverName',
  'deliveredAt',
];

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function formatCurrency(value: number | null | undefined): string {
  if (value == null) return '—';
  return value.toLocaleString(undefined, { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
}

/**
 * Renders a list of delivery records with configurable columns.
 * Requirements: 7.3, 8.2, 12.3
 */
export function DeliveryTable({
  records,
  columns = DEFAULT_COLUMNS,
  summary,
  showMissingPriceWarning = false,
  emptyMessage = 'No deliveries found.',
}: DeliveryTableProps) {
  const hasMissingPrice =
    showMissingPriceWarning && records.some((r) => r.unitPrice == null);

  if (records.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white px-6 py-10 text-center">
        <p className="text-sm text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {hasMissingPrice && (
        <div
          role="alert"
          className="rounded-md bg-yellow-50 border border-yellow-200 px-4 py-3 text-sm text-yellow-800"
        >
          Some records are missing a price assignment. Contact your administrator.
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((col) => (
                <th
                  key={col}
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
                >
                  {COLUMN_LABELS[col]}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {records.map((record) => (
              <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                {columns.map((col) => (
                  <td key={col} className="px-4 py-3 text-gray-700 whitespace-nowrap">
                    {col === 'deliveredAt'
                      ? formatDateTime(record.deliveredAt)
                      : col === 'unitPrice'
                      ? formatCurrency(record.unitPrice)
                      : col === 'lineTotal'
                      ? formatCurrency(record.lineTotal)
                      : col === 'quantity'
                      ? `${record.quantity}${record.productUnit ? ` ${record.productUnit}` : ''}`
                      : String(record[col] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>

          {summary && (
            <tfoot className="bg-gray-50 border-t-2 border-gray-200">
              <tr>
                {columns.map((col, i) => (
                  <td
                    key={col}
                    className="px-4 py-3 text-sm font-semibold text-gray-800 whitespace-nowrap"
                  >
                    {col === 'quantity'
                      ? summary.totalQuantity
                      : col === 'lineTotal'
                      ? formatCurrency(summary.totalValue)
                      : i === 0
                      ? 'Total'
                      : ''}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
