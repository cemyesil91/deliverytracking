import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '../../components/AppLayout';
import { SellerSelector } from '../../components/SellerSelector';
import { ConfirmationToast, useToast } from '../../components/ConfirmationToast';
import api from '../../lib/api';

const ADMIN_NAV = [
  { to: '/admin/accounts', label: 'Accounts' },
  { to: '/admin/products', label: 'Products' },
  { to: '/admin/pricing', label: 'Pricing' },
  { to: '/admin/deliveries', label: 'Deliveries' },
  { to: '/admin/finances', label: 'Finances' },
];

interface SellerPriceEntry {
  sellerId: string;
  productId: string;
  productName: string;
  productUnit: string;
  price: number;
}

interface Product {
  id: string;
  name: string;
  unit: string;
  isActive: boolean;
}

/**
 * Admin pricing page — assign/update seller-product prices.
 * Requirements: 5.1, 5.2, 5.3, 5.4
 */
export function PricingPage() {
  const queryClient = useQueryClient();
  const { toast, showToast, clearToast } = useToast();
  const [sellerId, setSellerId] = useState('');
  // Map of productId → draft price string for inline editing
  const [draftPrices, setDraftPrices] = useState<Record<string, string>>({});

  const { data: prices = [], isLoading: pricesLoading } = useQuery<SellerPriceEntry[]>({
    queryKey: ['prices', sellerId],
    queryFn: async () => {
      const { data } = await api.get<SellerPriceEntry[]>(`/api/sellers/${sellerId}/prices`);
      return data;
    },
    enabled: !!sellerId,
  });

  const { data: allProducts = [] } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const { data } = await api.get<Product[]>('/api/products');
      return data.filter((p) => p.isActive);
    },
  });

  const upsertMutation = useMutation({
    mutationFn: ({ productId, price }: { productId: string; price: number }) =>
      api.put(`/api/sellers/${sellerId}/prices/${productId}`, { price }),
    onSuccess: (_data, vars) => {
      showToast('Price updated.', 'success');
      // Clear draft for this product
      setDraftPrices((prev) => {
        const next = { ...prev };
        delete next[vars.productId];
        return next;
      });
      queryClient.invalidateQueries({ queryKey: ['prices', sellerId] });
    },
    onError: () => showToast('Failed to update price.', 'error'),
  });

  // Build a merged list: all active products, with current price if set
  const priceMap = Object.fromEntries(prices.map((p) => [p.productId, p.price]));

  function handleSave(productId: string) {
    const raw = draftPrices[productId];
    const price = parseFloat(raw);
    if (isNaN(price) || price <= 0) {
      showToast('Price must be a positive number.', 'error');
      return;
    }
    upsertMutation.mutate({ productId, price });
  }

  return (
    <AppLayout navItems={ADMIN_NAV}>
      <div className="space-y-8">
        <h1 className="text-lg font-semibold text-gray-900">Seller Pricing</h1>

        {/* Seller selector */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
          <label htmlFor="seller-selector" className="block text-sm font-medium text-gray-700 mb-2">
            Select Seller
          </label>
          <div className="max-w-xs">
            <SellerSelector
              id="seller-selector"
              value={sellerId}
              onChange={(id) => {
                setSellerId(id);
                setDraftPrices({});
              }}
            />
          </div>
        </div>

        {/* Price table */}
        {sellerId && (
          <section>
            <h2 className="text-base font-semibold text-gray-800 mb-3">Price Assignments</h2>

            {pricesLoading ? (
              <p className="text-sm text-gray-500">Loading…</p>
            ) : allProducts.length === 0 ? (
              <p className="text-sm text-gray-500">No active products found.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Product', 'Unit', 'Current Price', 'Set Price'].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {allProducts.map((product) => {
                      const currentPrice = priceMap[product.id];
                      const draft = draftPrices[product.id] ?? '';
                      const hasPrice = currentPrice != null;

                      return (
                        <tr key={product.id} className={`hover:bg-gray-50 transition-colors ${!hasPrice ? 'bg-yellow-50' : ''}`}>
                          <td className="px-4 py-3 text-gray-700">{product.name}</td>
                          <td className="px-4 py-3 text-gray-500">{product.unit}</td>
                          <td className="px-4 py-3">
                            {hasPrice ? (
                              <span className="font-medium text-gray-800">
                                ${currentPrice.toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-xs text-yellow-700 font-medium">Not set</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min={0.01}
                                step={0.01}
                                value={draft}
                                onChange={(e) =>
                                  setDraftPrices((prev) => ({ ...prev, [product.id]: e.target.value }))
                                }
                                placeholder={hasPrice ? currentPrice.toFixed(2) : '0.00'}
                                className="w-24 rounded-md border border-gray-300 px-2 py-1 text-sm
                                           focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              <button
                                onClick={() => handleSave(product.id)}
                                disabled={!draft || upsertMutation.isPending}
                                className="rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white
                                           hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
                                           transition-colors"
                              >
                                Save
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </div>

      {toast && (
        <ConfirmationToast message={toast.message} variant={toast.variant} onDismiss={clearToast} />
      )}
    </AppLayout>
  );
}
