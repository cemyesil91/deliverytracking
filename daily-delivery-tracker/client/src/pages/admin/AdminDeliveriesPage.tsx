import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AppLayout } from '../../components/AppLayout';
import { DateRangePicker } from '../../components/DateRangePicker';
import { DeliveryTable } from '../../components/DeliveryTable';
import { SellerSelector } from '../../components/SellerSelector';
import { ProductSelector } from '../../components/ProductSelector';
import api from '../../lib/api';
import type { DeliveryRecord, DateRange } from '../../types/index';

const ADMIN_NAV = [
  { to: '/admin/accounts', label: 'Accounts' },
  { to: '/admin/products', label: 'Products' },
  { to: '/admin/pricing', label: 'Pricing' },
  { to: '/admin/deliveries', label: 'Deliveries' },
  { to: '/admin/finances', label: 'Finances' },
];

interface Filters {
  sellerId: string;
  driverId: string;
  productId: string;
  dateRange: DateRange;
}

interface Account {
  id: string;
  username: string;
  role: string;
  isActive: boolean;
}

/**
 * Admin deliveries page — view all records with multi-filter support.
 * Requirements: 12.1, 12.2, 12.3
 */
export function AdminDeliveriesPage() {
  const [filters, setFilters] = useState<Filters>({
    sellerId: '',
    driverId: '',
    productId: '',
    dateRange: { startDate: '', endDate: '' },
  });
  const [appliedFilters, setAppliedFilters] = useState<Filters | null>(null);

  // Fetch drivers for the driver filter dropdown
  const { data: drivers = [] } = useQuery<Account[]>({
    queryKey: ['accounts', 'drivers'],
    queryFn: async () => {
      const { data } = await api.get<Account[]>('/api/accounts');
      return data.filter((a) => a.role === 'DRIVER' && a.isActive);
    },
  });

  const { data: deliveries = [], isLoading, isFetching } = useQuery<DeliveryRecord[]>({
    queryKey: ['deliveries', 'admin', appliedFilters],
    queryFn: async () => {
      if (!appliedFilters) return [];
      const params: Record<string, string> = {};
      if (appliedFilters.sellerId) params.sellerId = appliedFilters.sellerId;
      if (appliedFilters.driverId) params.driverId = appliedFilters.driverId;
      if (appliedFilters.productId) params.productId = appliedFilters.productId;
      if (appliedFilters.dateRange.startDate) params.startDate = appliedFilters.dateRange.startDate;
      if (appliedFilters.dateRange.endDate) params.endDate = appliedFilters.dateRange.endDate;
      const { data } = await api.get<DeliveryRecord[]>('/api/deliveries', { params });
      return data;
    },
    enabled: !!appliedFilters,
  });

  const loading = isLoading || isFetching;

  function handleApply() {
    setAppliedFilters({ ...filters });
  }

  function handleReset() {
    const empty: Filters = { sellerId: '', driverId: '', productId: '', dateRange: { startDate: '', endDate: '' } };
    setFilters(empty);
    setAppliedFilters(null);
  }

  return (
    <AppLayout navItems={ADMIN_NAV}>
      <div className="space-y-6">
        <h1 className="text-lg font-semibold text-gray-900">All Deliveries</h1>

        {/* Filter panel */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 space-y-5">
          <h2 className="text-sm font-semibold text-gray-700">Filters</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Seller */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide">
                Seller
              </label>
              <SellerSelector
                value={filters.sellerId}
                onChange={(id) => setFilters((f) => ({ ...f, sellerId: id }))}
              />
            </div>

            {/* Driver */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide">
                Driver
              </label>
              <select
                value={filters.driverId}
                onChange={(e) => setFilters((f) => ({ ...f, driverId: e.target.value }))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">All drivers</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>{d.username}</option>
                ))}
              </select>
            </div>

            {/* Product */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide">
                Product
              </label>
              <ProductSelector
                value={filters.productId}
                onChange={(id) => setFilters((f) => ({ ...f, productId: id }))}
              />
            </div>
          </div>

          {/* Date range */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">
              Date Range
            </label>
            <DateRangePicker
              value={filters.dateRange}
              onChange={(r) => setFilters((f) => ({ ...f, dateRange: r }))}
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              onClick={handleApply}
              disabled={loading}
              className="rounded-md bg-blue-600 px-5 py-2 text-sm font-semibold text-white
                         hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500
                         focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed
                         transition-colors"
            >
              {loading ? 'Loading…' : 'Apply Filters'}
            </button>
            <button
              onClick={handleReset}
              className="rounded-md border border-gray-300 bg-white px-5 py-2 text-sm font-medium
                         text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2
                         focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Results */}
        {appliedFilters && !loading && (
          <section>
            <p className="text-sm text-gray-600 mb-3">
              {deliveries.length} record{deliveries.length !== 1 ? 's' : ''} found
            </p>
            <DeliveryTable
              records={deliveries}
              columns={['sellerName', 'productName', 'quantity', 'driverName', 'deliveredAt']}
              emptyMessage="No deliveries match the applied filters."
            />
          </section>
        )}
      </div>
    </AppLayout>
  );
}
