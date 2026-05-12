import { useQuery } from '@tanstack/react-query';
import { AppLayout } from '../../components/AppLayout';
import { BalanceSummary } from '../../components/BalanceSummary';
import { TransactionList } from '../../components/TransactionList';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import type { SellerBalance, TransactionEntry } from '../../types/index';

const SELLER_NAV = [
  { to: '/seller', label: 'Today' },
  { to: '/seller/report', label: 'Report' },
  { to: '/seller/balance', label: 'Balance' },
];

interface BalanceDetail {
  balance: SellerBalance;
  transactions: TransactionEntry[];
}

/**
 * Seller balance page — current balance and transaction history.
 * Requirements: 10.1, 10.2, 10.3
 */
export function SellerBalancePage() {
  const { user } = useAuth();

  const { data, isLoading, isError } = useQuery<BalanceDetail>({
    queryKey: ['balance', user?.id],
    queryFn: async () => {
      const { data } = await api.get<BalanceDetail>(`/api/sellers/${user!.id}/balance`);
      return data;
    },
    enabled: !!user,
  });

  return (
    <AppLayout navItems={SELLER_NAV}>
      <div className="space-y-6">
        <h1 className="text-lg font-semibold text-gray-900">Account Balance</h1>

        {isLoading && <p className="text-sm text-gray-500">Loading…</p>}

        {isError && (
          <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            Failed to load balance. Please try again.
          </div>
        )}

        {data && (
          <div className="space-y-5">
            <BalanceSummary balance={data.balance} />
            <TransactionList transactions={data.transactions} />
          </div>
        )}
      </div>
    </AppLayout>
  );
}
