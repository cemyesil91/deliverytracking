import { useQuery } from '@tanstack/react-query';
import { AppLayout } from '../../components/AppLayout';
import { DeliveryTable } from '../../components/DeliveryTable';
import api from '../../lib/api';
import type { DeliveryRecord } from '../../types/index';

const SELLER_NAV = [
  { to: '/seller', label: 'Today' },
  { to: '/seller/report', label: 'Report' },
  { to: '/seller/balance', label: 'Balance' },
];

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Seller home page — today's deliveries.
 * Requirements: 8.1, 8.2, 8.3
 */
export function SellerHomePage() {
  const { data: deliveries = [], isLoading } = useQuery<DeliveryRecord[]>({
    queryKey: ['deliveries', 'seller', 'today'],
    queryFn: async () => {
      const today = todayISO();
      const { data } = await api.get<DeliveryRecord[]>('/api/deliveries', {
        params: { startDate: today, endDate: today },
      });
      return data;
    },
  });

  return (
    <AppLayout navItems={SELLER_NAV}>
      <div className="space-y-6">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 mb-1">Today's Deliveries</h1>
          <p className="text-sm text-gray-500">
            {new Date().toLocaleDateString(undefined, { dateStyle: 'full' })}
          </p>
        </div>

        {isLoading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : (
          <DeliveryTable
            records={deliveries}
            columns={['productName', 'quantity', 'driverName', 'deliveredAt']}
            emptyMessage="No deliveries recorded for today."
          />
        )}
      </div>
    </AppLayout>
  );
}
