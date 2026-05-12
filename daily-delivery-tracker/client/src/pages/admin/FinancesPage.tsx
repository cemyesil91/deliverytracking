import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '../../components/AppLayout';
import { BalanceSummary } from '../../components/BalanceSummary';
import { TransactionList } from '../../components/TransactionList';
import { ConfirmationToast, useToast } from '../../components/ConfirmationToast';
import api from '../../lib/api';
import type { SellerBalance, TransactionEntry } from '../../types/index';

const ADMIN_NAV = [
  { to: '/admin/accounts', label: 'Accounts' },
  { to: '/admin/products', label: 'Products' },
  { to: '/admin/pricing', label: 'Pricing' },
  { to: '/admin/deliveries', label: 'Deliveries' },
  { to: '/admin/finances', label: 'Finances' },
];

interface BalanceDetail {
  balance: SellerBalance;
  transactions: TransactionEntry[];
}

interface TransactionPayload {
  amount: number;
  date: string;
  note?: string;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Admin finances page — view all seller balances, record debts and payments.
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5
 */
export function FinancesPage() {
  const queryClient = useQueryClient();
  const { toast, showToast, clearToast } = useToast();
  const [selectedSellerId, setSelectedSellerId] = useState<string | null>(null);

  // Debt form state
  const [debtAmount, setDebtAmount] = useState('');
  const [debtDate, setDebtDate] = useState(todayISO);
  const [debtNote, setDebtNote] = useState('');
  const [debtErrors, setDebtErrors] = useState<Record<string, string>>({});

  // Payment form state
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState(todayISO);
  const [payNote, setPayNote] = useState('');
  const [payErrors, setPayErrors] = useState<Record<string, string>>({});

  // All seller balances
  const { data: balances = [], isLoading: balancesLoading } = useQuery<SellerBalance[]>({
    queryKey: ['seller-balances'],
    queryFn: async () => {
      const { data } = await api.get<SellerBalance[]>('/api/sellers/balances');
      return data;
    },
  });

  // Selected seller detail
  const { data: detail, isLoading: detailLoading } = useQuery<BalanceDetail>({
    queryKey: ['balance', selectedSellerId],
    queryFn: async () => {
      const { data } = await api.get<BalanceDetail>(`/api/sellers/${selectedSellerId}/balance`);
      return data;
    },
    enabled: !!selectedSellerId,
  });

  const debtMutation = useMutation({
    mutationFn: (payload: TransactionPayload) =>
      api.post(`/api/sellers/${selectedSellerId}/debts`, payload),
    onSuccess: () => {
      setDebtAmount(''); setDebtDate(todayISO()); setDebtNote(''); setDebtErrors({});
      showToast('Debt recorded.', 'success');
      queryClient.invalidateQueries({ queryKey: ['balance', selectedSellerId] });
      queryClient.invalidateQueries({ queryKey: ['seller-balances'] });
    },
    onError: () => showToast('Failed to record debt.', 'error'),
  });

  const paymentMutation = useMutation({
    mutationFn: (payload: TransactionPayload) =>
      api.post(`/api/sellers/${selectedSellerId}/payments`, payload),
    onSuccess: () => {
      setPayAmount(''); setPayDate(todayISO()); setPayNote(''); setPayErrors({});
      showToast('Payment recorded.', 'success');
      queryClient.invalidateQueries({ queryKey: ['balance', selectedSellerId] });
      queryClient.invalidateQueries({ queryKey: ['seller-balances'] });
    },
    onError: () => showToast('Failed to record payment.', 'error'),
  });

  function validateAmount(raw: string, setErrors: (e: Record<string, string>) => void): number | null {
    const val = parseFloat(raw);
    if (!raw || isNaN(val) || val <= 0) {
      setErrors({ amount: 'Amount must be a positive number.' });
      return null;
    }
    setErrors({});
    return val;
  }

  function handleDebt(e: FormEvent) {
    e.preventDefault();
    const amount = validateAmount(debtAmount, setDebtErrors);
    if (amount == null) return;
    debtMutation.mutate({ amount, date: debtDate, note: debtNote || undefined });
  }

  function handlePayment(e: FormEvent) {
    e.preventDefault();
    const amount = validateAmount(payAmount, setPayErrors);
    if (amount == null) return;
    paymentMutation.mutate({ amount, date: payDate, note: payNote || undefined });
  }

  function formatCurrency(v: number) {
    return v.toLocaleString(undefined, { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
  }

  return (
    <AppLayout navItems={ADMIN_NAV}>
      <div className="space-y-8">
        <h1 className="text-lg font-semibold text-gray-900">Finances</h1>

        {/* All seller balances */}
        <section>
          <h2 className="text-base font-semibold text-gray-800 mb-3">Seller Balances</h2>
          {balancesLoading ? (
            <p className="text-sm text-gray-500">Loading…</p>
          ) : balances.length === 0 ? (
            <p className="text-sm text-gray-500">No sellers found.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['Seller', 'Total Debts', 'Total Payments', 'Balance', ''].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {balances.map((b) => (
                    <tr
                      key={b.sellerId}
                      className={`hover:bg-gray-50 transition-colors ${selectedSellerId === b.sellerId ? 'bg-blue-50' : ''}`}
                    >
                      <td className="px-4 py-3 font-medium text-gray-800">{b.sellerName}</td>
                      <td className="px-4 py-3 text-red-600 tabular-nums">{formatCurrency(b.totalDebts)}</td>
                      <td className="px-4 py-3 text-green-600 tabular-nums">{formatCurrency(b.totalPayments)}</td>
                      <td className={`px-4 py-3 font-semibold tabular-nums ${b.balance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(b.balance)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelectedSellerId(b.sellerId === selectedSellerId ? null : b.sellerId)}
                          className="text-xs text-blue-600 hover:text-blue-800 underline underline-offset-2
                                     focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                        >
                          {selectedSellerId === b.sellerId ? 'Close' : 'Manage'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Selected seller detail */}
        {selectedSellerId && (
          <section className="space-y-6">
            <h2 className="text-base font-semibold text-gray-800">
              {balances.find((b) => b.sellerId === selectedSellerId)?.sellerName ?? 'Seller'} — Detail
            </h2>

            {detailLoading ? (
              <p className="text-sm text-gray-500">Loading…</p>
            ) : detail ? (
              <>
                <BalanceSummary balance={detail.balance} />
                <TransactionList transactions={detail.transactions} />
              </>
            ) : null}

            {/* Record debt / payment forms side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Debt form */}
              <form
                onSubmit={handleDebt}
                noValidate
                className="bg-white rounded-lg border border-red-200 shadow-sm p-5 space-y-4"
              >
                <h3 className="text-sm font-semibold text-red-700">Record Debt</h3>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Amount <span className="text-red-500">*</span></label>
                  <input
                    type="number" min={0.01} step={0.01}
                    value={debtAmount}
                    onChange={(e) => setDebtAmount(e.target.value)}
                    disabled={debtMutation.isPending}
                    placeholder="0.00"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm
                               focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400
                               disabled:bg-gray-100"
                  />
                  {debtErrors.amount && <p className="mt-1 text-xs text-red-600">{debtErrors.amount}</p>}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Date <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    value={debtDate}
                    onChange={(e) => setDebtDate(e.target.value)}
                    disabled={debtMutation.isPending}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm
                               focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400
                               disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Note (optional)</label>
                  <input
                    type="text"
                    value={debtNote}
                    onChange={(e) => setDebtNote(e.target.value)}
                    disabled={debtMutation.isPending}
                    placeholder="e.g. Monthly invoice"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm
                               focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400
                               disabled:bg-gray-100"
                  />
                </div>

                <button
                  type="submit"
                  disabled={debtMutation.isPending}
                  className="w-full rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white
                             hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500
                             focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed
                             transition-colors"
                >
                  {debtMutation.isPending ? 'Saving…' : 'Record Debt'}
                </button>
              </form>

              {/* Payment form */}
              <form
                onSubmit={handlePayment}
                noValidate
                className="bg-white rounded-lg border border-green-200 shadow-sm p-5 space-y-4"
              >
                <h3 className="text-sm font-semibold text-green-700">Record Payment</h3>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Amount <span className="text-red-500">*</span></label>
                  <input
                    type="number" min={0.01} step={0.01}
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    disabled={paymentMutation.isPending}
                    placeholder="0.00"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm
                               focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400
                               disabled:bg-gray-100"
                  />
                  {payErrors.amount && <p className="mt-1 text-xs text-red-600">{payErrors.amount}</p>}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Date <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    disabled={paymentMutation.isPending}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm
                               focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400
                               disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Note (optional)</label>
                  <input
                    type="text"
                    value={payNote}
                    onChange={(e) => setPayNote(e.target.value)}
                    disabled={paymentMutation.isPending}
                    placeholder="e.g. Cash received"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm
                               focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400
                               disabled:bg-gray-100"
                  />
                </div>

                <button
                  type="submit"
                  disabled={paymentMutation.isPending}
                  className="w-full rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white
                             hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500
                             focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed
                             transition-colors"
                >
                  {paymentMutation.isPending ? 'Saving…' : 'Record Payment'}
                </button>
              </form>
            </div>
          </section>
        )}
      </div>

      {toast && (
        <ConfirmationToast message={toast.message} variant={toast.variant} onDismiss={clearToast} />
      )}
    </AppLayout>
  );
}
