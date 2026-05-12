import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

interface Product {
  id: string;
  name: string;
  unit: string;
  isActive: boolean;
}

interface ProductSelectorProps {
  value: string;
  onChange: (productId: string) => void;
  disabled?: boolean;
  required?: boolean;
  id?: string;
}

/**
 * Dropdown of active products fetched from GET /api/products.
 * Requirements: 6.2, 12.2
 */
export function ProductSelector({
  value,
  onChange,
  disabled = false,
  required = false,
  id = 'product-selector',
}: ProductSelectorProps) {
  const { data: products = [], isLoading, isError } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const { data } = await api.get<Product[]>('/api/products');
      return data.filter((p) => p.isActive);
    },
  });

  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled || isLoading}
      required={required}
      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm
                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                 disabled:bg-gray-100 disabled:cursor-not-allowed bg-white"
    >
      <option value="">
        {isLoading ? 'Loading products…' : isError ? 'Failed to load' : 'Select a product'}
      </option>
      {products.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name} ({p.unit})
        </option>
      ))}
    </select>
  );
}
