import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AppLayout } from '../../components/AppLayout';
import { DateRangePicker } from '../../components/DateRangePicker';
import { DeliveryTable } from '../../components/DeliveryTable';
import api from '../../lib/api';
import type { DeliveryRecord, DateRange } from '../../types/index';

const DRIVER_NAV = [
  { to: '/driver', label: 'Today' },
  { to: '/driver/report', label: 'Report' },
];

/**
 * Driver report page — filter deliveries by date range.
 * Requirements: 7.1, 7.2, 7.3
 */
export function DriverReportPage() {
  const [range, setRange] = useState<DateRange>({ startDate: '', endDate: '' });
  const [appliedRange, setAppliedRange] = useState<DateRange | null>(null);

  const { data: deliveries = [], isLoading, isFetching } = useQuery<DeliveryRecord[]>({
    queryKey: ['deliveries', 'driver', 'report', appliedRange],
    queryFn: async () => {
      if (!appliedRange) return [];
      const { data } = await api.get<DeliveryRecord[]>('/api/deliveries', {
        params: {
          startDate: appliedRange.startDate,
          endDate: appliedRange.endDate,
        },
      });
      return data;
    },
    enabled: !!appliedRange,
  });

  function handleApply(r: DateRange) {
    setAppliedRange(r);
  }

  const loading = isLoading || isFetching;

  return (
    <AppLayout navItems={DRIVER_NAV}>
      <div className="space-y-6">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 mb-1">Delivery Report</h1>
          <p className="text-sm text-gray-500">
            Filter your deliveries by date range.
          </p>
        </div>

        {/* Date range filter */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
          <DateRangePicker
            value={range}
            onChange={setRange}
            onSubmit={handleApply}
            submitLabel="Apply Filter"
            disabled={loading}
          />
        </div>

        {/* Results */}
        {appliedRange && (
          <section>
            <h2 className="text-sm font-semibold text-gray-700 mb-3">
              {loading
                ? 'Loading…'
                : `${deliveries.length} record${deliveries.length !== 1 ? 's' : ''} found`}
            </h2>

            {!loading && (
              <DeliveryTable
                records={deliveries}
                columns={['sellerName', 'productName', 'quantity', 'deliveredAt']}
                emptyMessage="No deliveries found for the selected date range."
              />
            )}
          </section>
        )}
      </div>
    </AppLayout>
  );
}
