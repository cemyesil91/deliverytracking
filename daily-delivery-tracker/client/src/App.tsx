import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { RoleGuard } from './components/RoleGuard';
import { LoginPage } from './pages/LoginPage';

// Admin pages
import { AccountsPage } from './pages/admin/AccountsPage';
import { ProductsPage } from './pages/admin/ProductsPage';
import { PricingPage } from './pages/admin/PricingPage';
import { AdminDeliveriesPage } from './pages/admin/AdminDeliveriesPage';
import { FinancesPage } from './pages/admin/FinancesPage';

// Driver pages
import { DriverHomePage } from './pages/driver/DriverHomePage';
import { DriverReportPage } from './pages/driver/DriverReportPage';

// Seller pages
import { SellerHomePage } from './pages/seller/SellerHomePage';
import { SellerReportPage } from './pages/seller/SellerReportPage';
import { SellerBalancePage } from './pages/seller/SellerBalancePage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />

            {/* Admin routes */}
            <Route
              path="/admin/accounts"
              element={
                <RoleGuard allowedRole="PLATFORM_ADMIN">
                  <AccountsPage />
                </RoleGuard>
              }
            />
            <Route
              path="/admin/products"
              element={
                <RoleGuard allowedRole="PLATFORM_ADMIN">
                  <ProductsPage />
                </RoleGuard>
              }
            />
            <Route
              path="/admin/pricing"
              element={
                <RoleGuard allowedRole="PLATFORM_ADMIN">
                  <PricingPage />
                </RoleGuard>
              }
            />
            <Route
              path="/admin/deliveries"
              element={
                <RoleGuard allowedRole="PLATFORM_ADMIN">
                  <AdminDeliveriesPage />
                </RoleGuard>
              }
            />
            <Route
              path="/admin/finances"
              element={
                <RoleGuard allowedRole="PLATFORM_ADMIN">
                  <FinancesPage />
                </RoleGuard>
              }
            />
            <Route path="/admin" element={<Navigate to="/admin/accounts" replace />} />

            {/* Driver routes */}
            <Route
              path="/driver"
              element={
                <RoleGuard allowedRole="DRIVER">
                  <DriverHomePage />
                </RoleGuard>
              }
            />
            <Route
              path="/driver/report"
              element={
                <RoleGuard allowedRole="DRIVER">
                  <DriverReportPage />
                </RoleGuard>
              }
            />

            {/* Seller routes */}
            <Route
              path="/seller"
              element={
                <RoleGuard allowedRole="SELLER">
                  <SellerHomePage />
                </RoleGuard>
              }
            />
            <Route
              path="/seller/report"
              element={
                <RoleGuard allowedRole="SELLER">
                  <SellerReportPage />
                </RoleGuard>
              }
            />
            <Route
              path="/seller/balance"
              element={
                <RoleGuard allowedRole="SELLER">
                  <SellerBalancePage />
                </RoleGuard>
              }
            />

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
