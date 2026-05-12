import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

interface Account {
  id: string;
  username: string;
  role: string;
  isActive: boolean;
}

interface SellerSelectorProps {
  value: string;
  onChange: (sellerId: string) => void;
  disabled?: boolean;
  required?: boolean;
  id?: string;
}

/**
 * Dropdown of active sellers fetched from GET /api/accounts.
 * Requirements: 6.2, 12.2
 */
export function SellerSelector({
  value,
  onChange,
  disabled = false,
  required = false,
  id = 'seller-selector',
}: SellerSelectorProps) {
  const { data: sellers = [], isLoading, isError } = useQuery<Account[]>({
    queryKey: ['accounts', 'sellers'],
    queryFn: async () => {
      const { data } = await api.get<Account[]>('/api/accounts');
      return data.filter((a) => a.role === 'SELLER' && a.isActive);
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
        {isLoading ? 'Loading sellers…' : isError ? 'Failed to load' : 'Select a seller'}
      </option>
      {sellers.map((s) => (
        <option key={s.id} value={s.id}>
          {s.username}
        </option>
      ))}
    </select>
  );
}
