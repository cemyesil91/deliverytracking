import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '../../components/AppLayout';
import { ConfirmationToast, useToast } from '../../components/ConfirmationToast';
import api from '../../lib/api';
import type { Role } from '../../types/index';

const ADMIN_NAV = [
  { to: '/admin/accounts', label: 'Accounts' },
  { to: '/admin/products', label: 'Products' },
  { to: '/admin/pricing', label: 'Pricing' },
  { to: '/admin/deliveries', label: 'Deliveries' },
  { to: '/admin/finances', label: 'Finances' },
];

interface Account {
  id: string;
  username: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
}

/**
 * Admin accounts page — list, create, update accounts.
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
 */
export function AccountsPage() {
  const queryClient = useQueryClient();
  const { toast, showToast, clearToast } = useToast();

  // Form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('DRIVER');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const { data: accounts = [], isLoading } = useQuery<Account[]>({
    queryKey: ['accounts'],
    queryFn: async () => {
      const { data } = await api.get<Account[]>('/api/accounts');
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload: { username: string; password: string; role: Role }) =>
      api.post<Account>('/api/accounts', payload),
    onSuccess: () => {
      setUsername('');
      setPassword('');
      setRole('DRIVER');
      setFieldErrors({});
      showToast('Account created successfully.', 'success');
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
    onError: (err: any) => {
      const code = err.response?.data?.error;
      if (code === 'USERNAME_TAKEN') {
        setFieldErrors({ username: 'This username is already taken.' });
      } else {
        showToast('Failed to create account. Please try again.', 'error');
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { role?: Role; isActive?: boolean } }) =>
      api.patch<Account>(`/api/accounts/${id}`, data),
    onSuccess: () => {
      showToast('Account updated successfully.', 'success');
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
    onError: () => {
      showToast('Failed to update account. Please try again.', 'error');
    },
  });

  function validate(): boolean {
    const errors: Record<string, string> = {};
    if (!username.trim()) errors.username = 'Username is required.';
    if (!password || password.length < 6) errors.password = 'Password must be at least 6 characters.';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    createMutation.mutate({ username: username.trim(), password, role });
  }

  return (
    <AppLayout navItems={ADMIN_NAV}>
      <div className="space-y-8">
        <h1 className="text-lg font-semibold text-gray-900">Account Management</h1>

        {/* Create form */}
        <section>
          <h2 className="text-base font-semibold text-gray-800 mb-3">Create New Account</h2>
          <form
            onSubmit={handleCreate}
            noValidate
            className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-5"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={createMutation.isPending}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                             disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                {fieldErrors.username && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.username}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={createMutation.isPending}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                             disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                {fieldErrors.password && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>
                )}
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  disabled={createMutation.isPending}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                             disabled:bg-gray-100 disabled:cursor-not-allowed bg-white"
                >
                  <option value="DRIVER">Driver</option>
                  <option value="SELLER">Seller</option>
                  <option value="PLATFORM_ADMIN">Platform Admin</option>
                </select>
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
              {createMutation.isPending ? 'Creating…' : 'Create Account'}
            </button>
          </form>
        </section>

        {/* Accounts list */}
        <section>
          <h2 className="text-base font-semibold text-gray-800 mb-3">All Accounts</h2>
          {isLoading ? (
            <p className="text-sm text-gray-500">Loading…</p>
          ) : accounts.length === 0 ? (
            <p className="text-sm text-gray-500">No accounts found.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      Username
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      Role
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {accounts.map((acc) => (
                    <tr key={acc.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-700">{acc.username}</td>
                      <td className="px-4 py-3 text-gray-700">
                        <select
                          value={acc.role}
                          onChange={(e) =>
                            updateMutation.mutate({
                              id: acc.id,
                              data: { role: e.target.value as Role },
                            })
                          }
                          disabled={updateMutation.isPending}
                          className="text-sm rounded border border-gray-300 px-2 py-1 bg-white
                                     focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="DRIVER">Driver</option>
                          <option value="SELLER">Seller</option>
                          <option value="PLATFORM_ADMIN">Platform Admin</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            acc.isActive
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {acc.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() =>
                            updateMutation.mutate({
                              id: acc.id,
                              data: { isActive: !acc.isActive },
                            })
                          }
                          disabled={updateMutation.isPending}
                          className="text-xs text-blue-600 hover:text-blue-800 underline underline-offset-2
                                     focus:outline-none focus:ring-2 focus:ring-blue-500 rounded
                                     disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {acc.isActive ? 'Deactivate' : 'Activate'}
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
        <ConfirmationToast
          message={toast.message}
          variant={toast.variant}
          onDismiss={clearToast}
        />
      )}
    </AppLayout>
  );
}
