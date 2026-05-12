import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AppLayout } from '../../components/AppLayout';
import { DateRangePicker } from '../../components/DateRangePicker';
import { DeliveryTable } from '../../components/DeliveryTable';
import api from '../../lib/api';
import type { DeliveryRecord, DateRange } from '../../types/index';

const SELLER_NAV = [
  { to: '/seller', label: 'Today' },
  { to: '/seller/report', label: 'Report' },
  { to: '/seller/balance', label: 'Balance' },
];

/** A delivery record enriched with pricing info from the report endpoint */
interface ReportRecord extends DeliveryRecord {
  unitPrice: number | null;
  lineTotal: number | null;
}

/** Get Monday of the current week (ISO week: Mon–Sun) */
function thisWeekRange(): DateRange {
  const now = new Date();
  const day = now.getDay(); // 0 = Sun
  const diffToMon = (day === 0 ? -6 : 1 - day);
  const mon = new Date(now);
  mon.setDate(now.getDate() + diffToMon);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  return {
    startDate: mon.toISOString().slice(0, 10),
    endDate: sun.toISOString().slice(0, 10),
  };
}

/** Get first and last day of the current calendar month */
function thisMonthRange(): DateRange {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    startDate: first.toISOString().slice(0, 10),
    endDate: last.toISOString().slice(0, 10),
  };
}

type Preset = 'week' | 'month' | 'custom';

/**
 * Seller report page — weekly, monthly, and custom date range.
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6
 */
export function SellerReportPage() {
  const [preset, setPreset] = useState<Preset | null>(null);
  const [customRange, setCustomRange] = useState<DateRange>({ startDate: '', endDate: '' });
  const [appliedRange, setAppliedRange] = useState<DateRange | null>(null);

  function applyPreset(p: Preset) {
    setPreset(p);
    if (p === 'week') {
      setAppliedRange(thisWeekRange());
    } else if (p === 'month') {
      setAppliedRange(thisMonthRange());
    }
    // 'custom' waits for DateRangePicker submit
  }

  const { data: records = [], isLoading, isFetching } = useQuery<ReportRecord[]>({
    queryKey: ['deliveries', 'seller', 'report', appliedRange],
    queryFn: async () => {
      if (!appliedRange) return [];
      const { data } = await api.get<ReportRecord[]>('/api/deliveries', {
        params: {
          startDate: appliedRange.startDate,
          endDate: appliedRange.endDate,
        },
      });
      return data;
    },
    enabled: !!appliedRange,
  });

  const loading = isLoading || isFetching;

  // Compute summary totals (exclude null lineTotals)
  const totalQuantity = records.reduce((s, r) => s + r.quantity, 0);
  const totalValue = records
    .filter((r) => r.lineTotal != null)
    .reduce((s, r) => s + (r.lineTotal as number), 0);

  const hasMissingPrice = records.some((r) => r.unitPrice == null);

  return (
    <AppLayout navItems={SELLER_NAV}>
      <div className="space-y-6">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 mb-1">Delivery Report</h1>
          <p className="text-sm text-gray-500">View your delivery history by period.</p>
        </div>

        {/* Preset buttons + custom picker */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 space-y-4">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => applyPreset('week')}
              className={`rounded-md px-4 py-1.5 text-sm font-medium border transition-colors
                ${preset === 'week'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
            >
              This Week
            </button>
            <button
              type="button"
              onClick={() => applyPreset('month')}
              className={`rounded-md px-4 py-1.5 text-sm font-medium border transition-colors
                ${preset === 'month'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
            >
              This Month
            </button>
            <button
              type="button"
              onClick={() => { setPreset('custom'); setAppliedRange(null); }}
              className={`rounded-md px-4 py-1.5 text-sm font-medium border transition-colors
                ${preset === 'custom'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
            >
              Custom Range
            </button>
          </div>

          {preset === 'custom' && (
            <DateRangePicker
              value={customRange}
              onChange={setCustomRange}
              onSubmit={(r) => setAppliedRange(r)}
              submitLabel="Apply"
              disabled={loading}
            />
          )}
        </div>

        {/* Results */}
        {appliedRange && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-700">
              {loading
                ? 'Loading…'
                : `${records.length} record${records.length !== 1 ? 's' : ''} — ${appliedRange.startDate} to ${appliedRange.endDate}`}
            </h2>

            {!loading && (
              <DeliveryTable
                records={records}
                columns={['productName', 'quantity', 'unitPrice', 'lineTotal', 'driverName', 'deliveredAt']}
                summary={records.length > 0 ? { totalQuantity, totalValue } : undefined}
                showMissingPriceWarning={hasMissingPrice}
                emptyMessage="No deliveries found for the selected period."
              />
            )}
          </section>
        )}
      </div>
    </AppLayout>
  );
}
