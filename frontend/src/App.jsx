import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { useAuthStore, useSignalRStore } from './store';
import './index.css';
import './App.css';

// Pages
import LoginPage from './pages/Login/LoginPage';
import AppLayout from './components/layout/AppLayout';
import Overview from './pages/Dashboard/Overview';
import POSPage from './pages/POS/POSPage';
import ProductsPage from './pages/ProductsPage';
import OrdersPage from './pages/OrdersPage';
import InventoryPage from './pages/Inventory/InventoryPage';
import CustomersPage from './pages/Customers/CustomersPage';
import KitchenDisplay from './pages/Kitchen/KitchenDisplay';
import AnalyticsPage from './pages/Analytics/AnalyticsPage';
import HRPage from './pages/HR/HRPage';
import SettingsPage from './pages/Settings/SettingsPage';
import TablesPage from './pages/Tables/TablesPage';
import AccountingPage from './pages/Accounting/AccountingPage';
import AppointmentsPage from './pages/Appointments/AppointmentsPage';
import SecurityPage from './pages/Security/SecurityPage';
import HelpdeskPage from './pages/Helpdesk/HelpdeskPage';
import SupplyChain from './pages/SupplyChain';
import ProjectsPage from './pages/Projects/ProjectsPage';
import DocumentsPage from './pages/Documents/DocumentsPage';
import SpreadsheetBIPage from './pages/Analytics/SpreadsheetBIPage';
import OfflineSyncPage from './pages/Sync/OfflineSyncPage';
import WhatsAppPage from './pages/WhatsApp/WhatsAppPage';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/" replace />;
};

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const connect = useSignalRStore((state) => state.connect);
  const disconnect = useSignalRStore((state) => state.disconnect);

  useEffect(() => {
    if (isAuthenticated) {
      connect();
    } else {
      disconnect();
    }
  }, [isAuthenticated, connect, disconnect]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LoginPage />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Overview />} />
            <Route path="pos" element={<POSPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="kitchen" element={<KitchenDisplay />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="tables" element={<TablesPage />} />
            <Route path="hr" element={<HRPage />} />
            <Route path="accounting" element={<AccountingPage />} />
            <Route path="appointments" element={<AppointmentsPage />} />
            <Route path="security" element={<SecurityPage />} />
            <Route path="helpdesk" element={<HelpdeskPage />} />
            <Route path="supplychain" element={<SupplyChain />} />
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="documents" element={<DocumentsPage />} />
            <Route path="analytics" element={<SpreadsheetBIPage />} />
            <Route path="sync" element={<OfflineSyncPage />} />
            <Route path="whatsapp" element={<WhatsAppPage />} />
            <Route path="settings" element={<SettingsPage />} />

          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
