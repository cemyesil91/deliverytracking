import type { SellerBalance } from '../types/index';

interface BalanceSummaryProps {
  balance: SellerBalance;
}

function formatCurrency(value: number): string {
  return value.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  });
}

/**
 * Displays the current seller balance with colour coding.
 * Green for zero/positive, red for negative.
 * Requirements: 10.1
 */
export function BalanceSummary({ balance }: BalanceSummaryProps) {
  const isNegative = balance.balance < 0;
  const isZero = balance.balance === 0;

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-6">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
        Account Balance
      </h2>

      <div className="flex items-baseline gap-2 mb-6">
        <span
          className={`text-4xl font-bold tabular-nums ${
            isNegative
              ? 'text-red-600'
              : isZero
              ? 'text-gray-700'
              : 'text-green-600'
          }`}
        >
          {formatCurrency(balance.balance)}
        </span>
        {isNegative && (
          <span className="text-sm font-medium text-red-500">outstanding</span>
        )}
        {!isNegative && !isZero && (
          <span className="text-sm font-medium text-green-500">credit</span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
        <div>
          <p className="text-xs text-gray-500 mb-1">Total Debts</p>
          <p className="text-base font-semibold text-red-600 tabular-nums">
            {formatCurrency(balance.totalDebts)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Total Payments</p>
          <p className="text-base font-semibold text-green-600 tabular-nums">
            {formatCurrency(balance.totalPayments)}
          </p>
        </div>
      </div>
    </div>
  );
}
