import type { TransactionEntry } from '../types/index';

interface TransactionListProps {
  transactions: TransactionEntry[];
}

function formatCurrency(value: number): string {
  return value.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' });
}

/**
 * Chronological list of debt and payment entries.
 * Requirements: 10.2, 10.3
 */
export function TransactionList({ transactions }: TransactionListProps) {
  if (transactions.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white px-6 py-10 text-center">
        <p className="text-sm text-gray-500">No transactions recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
        <h3 className="text-sm font-semibold text-gray-700">Transaction History</h3>
      </div>

      <ul className="divide-y divide-gray-100">
        {transactions.map((tx) => {
          const isDebt = tx.type === 'DEBT';
          return (
            <li key={tx.id} className="flex items-start justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
              <div className="flex items-start gap-3">
                {/* Type badge */}
                <span
                  className={`mt-0.5 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    isDebt
                      ? 'bg-red-100 text-red-700'
                      : 'bg-green-100 text-green-700'
                  }`}
                >
                  {isDebt ? 'Debt' : 'Payment'}
                </span>

                <div>
                  <p className="text-sm text-gray-500">{formatDate(tx.date)}</p>
                  {tx.note && (
                    <p className="text-xs text-gray-400 mt-0.5 italic">{tx.note}</p>
                  )}
                </div>
              </div>

              <span
                className={`text-sm font-semibold tabular-nums ${
                  isDebt ? 'text-red-600' : 'text-green-600'
                }`}
              >
                {isDebt ? '+' : '−'}{formatCurrency(tx.amount)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
