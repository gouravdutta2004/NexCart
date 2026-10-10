import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import RoleGuard from './RoleGuard';
import { ROLES } from '../utils/constants';

// Pages
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import AdminDashboard from '../pages/admin/AdminDashboard';
import ProductManagement from '../pages/admin/ProductManagement';
import CategoryManagement from '../pages/admin/CategoryManagement';
import CashierDashboard from '../pages/cashier/CashierDashboard';
import InventoryDashboard from '../pages/inventory/InventoryDashboard';
import SupplierManagement from '../pages/inventory/SupplierManagement';
import PurchaseOrderManagement from '../pages/inventory/PurchaseOrderManagement';
import CustomerDashboard from '../pages/customer/CustomerDashboard';
import Catalog from '../pages/customer/Catalog';
import PosTerminal from '../pages/cashier/PosTerminal';
import SelfCheckout from '../pages/customer/SelfCheckout';
import Checkout from '../pages/customer/Checkout';
import Orders from '../pages/customer/Orders';
import OrderManagement from '../pages/admin/OrderManagement';
import AnalyticsDashboard from '../pages/admin/AnalyticsDashboard';
import DiscountManagement from '../pages/admin/DiscountManagement';
import AuditLogViewer from '../pages/admin/AuditLogViewer';
import UserManagement from '../pages/admin/UserManagement';

// Home Dashboard Component
import HomeDashboard from '../pages/common/HomeDashboard';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<HomeDashboard />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/catalog" element={<Catalog />} />

      {/* Admin Console & Catalog Management */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={[ROLES.ADMIN]}>
              <AdminDashboard />
            </RoleGuard>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/products"
        element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={[ROLES.ADMIN, ROLES.INVENTORY_MANAGER]}>
              <ProductManagement />
            </RoleGuard>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/categories"
        element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={[ROLES.ADMIN]}>
              <CategoryManagement />
            </RoleGuard>
          </ProtectedRoute>
        }
      />

      {/* Admin Order Fulfillment Console */}
      <Route
        path="/admin/orders"
        element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={[ROLES.ADMIN, ROLES.CASHIER]}>
              <OrderManagement />
            </RoleGuard>
          </ProtectedRoute>
        }
      />

      {/* Admin Analytics & Business Intelligence */}
      <Route
        path="/admin/analytics"
        element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={[ROLES.ADMIN, ROLES.INVENTORY_MANAGER]}>
              <AnalyticsDashboard />
            </RoleGuard>
          </ProtectedRoute>
        }
      />

      {/* Admin Discount & Coupon Rules */}
      <Route
        path="/admin/discounts"
        element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={[ROLES.ADMIN, ROLES.INVENTORY_MANAGER]}>
              <DiscountManagement />
            </RoleGuard>
          </ProtectedRoute>
        }
      />

      {/* Admin Audit Trail & Compliance */}
      <Route
        path="/admin/audit"
        element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={[ROLES.ADMIN]}>
              <AuditLogViewer />
            </RoleGuard>
          </ProtectedRoute>
        }
      />

      {/* Admin User Management */}
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={[ROLES.ADMIN]}>
              <UserManagement />
            </RoleGuard>
          </ProtectedRoute>
        }
      />

      {/* Cashier POS Workspace */}
      <Route
        path="/cashier"
        element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={[ROLES.ADMIN, ROLES.CASHIER]}>
              <CashierDashboard />
            </RoleGuard>
          </ProtectedRoute>
        }
      />
      <Route
        path="/cashier/pos"
        element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={[ROLES.ADMIN, ROLES.CASHIER]}>
              <PosTerminal />
            </RoleGuard>
          </ProtectedRoute>
        }
      />

      {/* Customer Express Self-Checkout */}
      <Route path="/self-checkout" element={<SelfCheckout />} />

      {/* Online Checkout */}
      <Route
        path="/checkout"
        element={
          <ProtectedRoute>
            <Checkout />
          </ProtectedRoute>
        }
      />

      {/* Inventory Logistics Workspace */}
      <Route
        path="/inventory"
        element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={[ROLES.ADMIN, ROLES.INVENTORY_MANAGER]}>
              <InventoryDashboard />
            </RoleGuard>
          </ProtectedRoute>
        }
      />
      <Route
        path="/inventory/products"
        element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={[ROLES.ADMIN, ROLES.INVENTORY_MANAGER]}>
              <ProductManagement />
            </RoleGuard>
          </ProtectedRoute>
        }
      />
      <Route
        path="/inventory/suppliers"
        element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={[ROLES.ADMIN, ROLES.INVENTORY_MANAGER]}>
              <SupplierManagement />
            </RoleGuard>
          </ProtectedRoute>
        }
      />
      <Route
        path="/inventory/purchase-orders"
        element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={[ROLES.ADMIN, ROLES.INVENTORY_MANAGER]}>
              <PurchaseOrderManagement />
            </RoleGuard>
          </ProtectedRoute>
        }
      />

      {/* Customer Workspace */}
      <Route
        path="/customer"
        element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={[ROLES.CUSTOMER, ROLES.ADMIN]}>
              <CustomerDashboard />
            </RoleGuard>
          </ProtectedRoute>
        }
      />
      <Route
        path="/customer/orders"
        element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={[ROLES.CUSTOMER, ROLES.ADMIN]}>
              <Orders />
            </RoleGuard>
          </ProtectedRoute>
        }
      />

      {/* Catch-all Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
