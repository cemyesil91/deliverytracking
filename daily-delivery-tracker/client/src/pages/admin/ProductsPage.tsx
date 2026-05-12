import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '../../components/AppLayout';
import { ConfirmationToast, useToast } from '../../components/ConfirmationToast';
import api from '../../lib/api';

const ADMIN_NAV = [
  { to: '/admin/accounts', label: 'Accounts' },
  { to: '/admin/products', label: 'Products' },
  { to: '/admin/pricing', label: 'Pricing' },
  { to: '/admin/deliveries', label: 'Deliveries' },
  { to: '/admin/finances', label: 'Finances' },
];

type ProductSource = 'BAKERY' | 'MILK_PRODUCER';

interface Product {
  id: string;
  name: string;
  source: ProductSource;
  unit: string;
  isActive: boolean;
}

const SOURCE_LABELS: Record<ProductSource, string> = {
  BAKERY: 'Bakery',
  MILK_PRODUCER: 'Milk Producer',
};

/**
 * Admin products page — list, create, update products.
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */
export function ProductsPage() {
  const queryClient = useQueryClient();
  const { toast, showToast, clearToast } = useToast();

  const [name, setName] = useState('');
  const [source, setSource] = useState<ProductSource>('BAKERY');
  const [unit, setUnit] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['products', 'all'],
    queryFn: async () => {
      const { data } = await api.get<Product[]>('/api/products');
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload: { name: string; source: ProductSource; unit: string }) =>
      api.post<Product>('/api/products', payload),
    onSuccess: () => {
      setName('');
      setSource('BAKERY');
      setUnit('');
      setFieldErrors({});
      showToast('Product added successfully.', 'success');
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (err: any) => {
      const code = err.response?.data?.error;
      if (code === 'PRODUCT_NAME_TAKEN') {
        setFieldErrors({ name: 'A product with this name already exists.' });
      } else {
        showToast('Failed to add product. Please try again.', 'error');
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { isActive?: boolean } }) =>
      api.patch<Product>(`/api/products/${id}`, data),
    onSuccess: () => {
      showToast('Product updated.', 'success');
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: () => showToast('Failed to update product.', 'error'),
  });

  function validate(): boolean {
    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = 'Product name is required.';
    if (!unit.trim()) errors.unit = 'Unit is required.';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    createMutation.mutate({ name: name.trim(), source, unit: unit.trim() });
  }

  return (
    <AppLayout navItems={ADMIN_NAV}>
      <div className="space-y-8">
        <h1 className="text-lg font-semibold text-gray-900">Product Management</h1>

        {/* Create form */}
        <section>
          <h2 className="text-base font-semibold text-gray-800 mb-3">Add New Product</h2>
          <form
            onSubmit={handleCreate}
            noValidate
            className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-5"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label htmlFor="prod-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="prod-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={createMutation.isPending}
                  placeholder="e.g. Sourdough Bread"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                             disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                {fieldErrors.name && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>
                )}
              </div>

              <div>
                <label htmlFor="prod-source" className="block text-sm font-medium text-gray-700 mb-1">
                  Source <span className="text-red-500">*</span>
                </label>
                <select
                  id="prod-source"
                  value={source}
                  onChange={(e) => setSource(e.target.value as ProductSource)}
                  disabled={createMutation.isPending}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                             disabled:bg-gray-100 disabled:cursor-not-allowed bg-white"
                >
                  <option value="BAKERY">Bakery</option>
                  <option value="MILK_PRODUCER">Milk Producer</option>
                </select>
              </div>

              <div>
                <label htmlFor="prod-unit" className="block text-sm font-medium text-gray-700 mb-1">
                  Unit <span className="text-red-500">*</span>
                </label>
                <input
                  id="prod-unit"
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  disabled={createMutation.isPending}
                  placeholder="e.g. loaf, kg, litre"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                             disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                {fieldErrors.unit && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.unit}</p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={createMutation.isPending}
              className="rounded-md bg-blue-600 px-5 py-2 text-sm font-semibold text-white
                         hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500
                         focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed
                         transition-colors"
            >
              {createMutation.isPending ? 'Adding…' : 'Add Product'}
            </button>
          </form>
        </section>

        {/* Products list */}
        <section>
          <h2 className="text-base font-semibold text-gray-800 mb-3">Product Catalogue</h2>
          {isLoading ? (
            <p className="text-sm text-gray-500">Loading…</p>
          ) : products.length === 0 ? (
            <p className="text-sm text-gray-500">No products found.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['Name', 'Source', 'Unit', 'Status', 'Actions'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-700">{p.name}</td>
                      <td className="px-4 py-3 text-gray-500">{SOURCE_LABELS[p.source]}</td>
                      <td className="px-4 py-3 text-gray-500">{p.unit}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          p.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {p.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => updateMutation.mutate({ id: p.id, data: { isActive: !p.isActive } })}
                          disabled={updateMutation.isPending}
                          className="text-xs text-blue-600 hover:text-blue-800 underline underline-offset-2
                                     focus:outline-none focus:ring-2 focus:ring-blue-500 rounded
                                     disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {p.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {toast && (
        <ConfirmationToast message={toast.message} variant={toast.variant} onDismiss={clearToast} />
      )}
    </AppLayout>
  );
}
