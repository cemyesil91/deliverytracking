import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '../../components/AppLayout';
import { ProductSelector } from '../../components/ProductSelector';
import { SellerSelector } from '../../components/SellerSelector';
import { DeliveryTable } from '../../components/DeliveryTable';
import { ConfirmationToast, useToast } from '../../components/ConfirmationToast';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import type { DeliveryRecord } from '../../types/index';

const DRIVER_NAV = [
  { to: '/driver', label: 'Today' },
  { to: '/driver/report', label: 'Report' },
];

interface CreateDeliveryPayload {
  sellerId: string;
  productId: string;
  quantity: number;
  deliveredAt: string;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Driver home page — delivery form + today's delivery list.
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
 */
export function DriverHomePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast, showToast, clearToast } = useToast();

  // Form state
  const [sellerId, setSellerId] = useState('');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [deliveredAt, setDeliveredAt] = useState(() => {
    // Default to current local datetime
    const now = new Date();
    now.setSeconds(0, 0);
    return now.toISOString().slice(0, 16); // "YYYY-MM-DDTHH:mm"
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Today's deliveries
  const { data: deliveries = [], isLoading } = useQuery<DeliveryRecord[]>({
    queryKey: ['deliveries', 'driver', 'today'],
    queryFn: async () => {
      const today = todayISO();
      const { data } = await api.get<DeliveryRecord[]>('/api/deliveries', {
        params: { startDate: today, endDate: today },
      });
      return data;
    },
  });

  const mutation = useMutation({
    mutationFn: (payload: CreateDeliveryPayload) =>
      api.post<DeliveryRecord>('/api/deliveries', payload),
    onSuccess: () => {
      // Reset form
      setSellerId('');
      setProductId('');
      setQuantity('');
      setDeliveredAt(() => {
        const now = new Date();
        now.setSeconds(0, 0);
        return now.toISOString().slice(0, 16);
      });
      setFieldErrors({});
      showToast('Delivery recorded successfully.', 'success');
      queryClient.invalidateQueries({ queryKey: ['deliveries', 'driver', 'today'] });
    },
    onError: () => {
      showToast('Failed to record delivery. Please try again.', 'error');
    },
  });

  function validate(): boolean {
    const errors: Record<string, string> = {};
    if (!sellerId) errors.sellerId = 'Please select a seller.';
    if (!productId) errors.productId = 'Please select a product.';
    const qty = Number(quantity);
    if (!quantity || isNaN(qty) || !Number.isInteger(qty) || qty <= 0) {
      errors.quantity = 'Quantity must be a positive whole number.';
    }
    if (!deliveredAt) errors.deliveredAt = 'Delivery date and time are required.';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    mutation.mutate({
      sellerId,
      productId,
      quantity: Number(quantity),
      deliveredAt: new Date(deliveredAt).toISOString(),
    });
  }

  return (
    <AppLayout navItems={DRIVER_NAV}>
      <div className="space-y-8">
        {/* Delivery form */}
        <section>
          <h1 className="text-lg font-semibold text-gray-900 mb-4">Record a Delivery</h1>

          <form
            onSubmit={handleSubmit}
            noValidate
            className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-5"
          >
            {/* Driver field — read-only */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Driver</label>
              <input
                type="text"
                value={user?.username ?? ''}
                readOnly
                className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm
                           text-gray-500 cursor-not-allowed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Seller */}
              <div>
                <label htmlFor="seller-selector" className="block text-sm font-medium text-gray-700 mb-1">
                  Seller <span className="text-red-500">*</span>
                </label>
                <SellerSelector
                  id="seller-selector"
                  value={sellerId}
                  onChange={setSellerId}
                  disabled={mutation.isPending}
                  required
                />
                {fieldErrors.sellerId && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.sellerId}</p>
                )}
              </div>

              {/* Product */}
              <div>
                <label htmlFor="product-selector" className="block text-sm font-medium text-gray-700 mb-1">
                  Product <span className="text-red-500">*</span>
                </label>
                <ProductSelector
                  id="product-selector"
                  value={productId}
                  onChange={setProductId}
                  disabled={mutation.isPending}
                  required
                />
                {fieldErrors.productId && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.productId}</p>
                )}
              </div>

              {/* Quantity */}
              <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  id="quantity"
                  type="number"
                  min={1}
                  step={1}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  disabled={mutation.isPending}
                  placeholder="e.g. 10"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                             disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                {fieldErrors.quantity && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.quantity}</p>
                )}
              </div>

              {/* Delivered at */}
              <div>
                <label htmlFor="deliveredAt" className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery Date &amp; Time <span className="text-red-500">*</span>
                </label>
                <input
                  id="deliveredAt"
                  type="datetime-local"
                  value={deliveredAt}
                  onChange={(e) => setDeliveredAt(e.target.value)}
                  disabled={mutation.isPending}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                             disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                {fieldErrors.deliveredAt && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.deliveredAt}</p>
                )}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={mutation.isPending}
                className="rounded-md bg-blue-600 px-5 py-2 text-sm font-semibold text-white
                           hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500
                           focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed
                           transition-colors"
              >
                {mutation.isPending ? 'Saving…' : 'Record Delivery'}
              </button>
            </div>
          </form>
        </section>

        {/* Today's deliveries */}
        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-3">
            Today's Deliveries
          </h2>
          {isLoading ? (
            <p className="text-sm text-gray-500">Loading…</p>
          ) : (
            <DeliveryTable
              records={deliveries}
              columns={['sellerName', 'productName', 'quantity', 'deliveredAt']}
              emptyMessage="No deliveries recorded for today."
            />
          )}
        </section>
      </div>

      {toast && (
        <ConfirmationToast
          message={toast.message}
          variant={toast.variant}
          onDismiss={clearToast}
        />
      )}
    </AppLayout>
  );
}
