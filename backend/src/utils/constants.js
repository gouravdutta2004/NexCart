/**
 * NexCart Global System Constants
 */

const ROLES = {
  ADMIN: 'admin',
  INVENTORY_MANAGER: 'inventory_manager',
  CASHIER: 'cashier',
  CUSTOMER: 'customer',
};

const ORDER_TYPES = {
  ONLINE: 'online',
  POS_WALKIN: 'pos_walkin',
  SELF_CHECKOUT: 'self_checkout',
};

const ORDER_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

const PAYMENT_METHODS = {
  CASH: 'cash',
  CARD: 'card',
  UPI: 'upi',
  WALLET: 'wallet',
  SIMULATION: 'simulation',
};

const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
};

const PURCHASE_ORDER_STATUS = {
  DRAFT: 'draft',
  PLACED: 'placed',
  PARTIALLY_RECEIVED: 'partially_received',
  RECEIVED: 'received',
  CANCELLED: 'cancelled',
};

const NOTIFICATION_TYPES = {
  LOW_STOCK: 'low_stock',
  EXPIRY_WARNING: 'expiry_warning',
  NEW_ORDER: 'new_order',
  PO_RECEIVED: 'po_received',
  SYSTEM: 'system',
};

const AUDIT_MODULES = {
  INVENTORY: 'inventory',
  PRODUCTS: 'products',
  ORDERS: 'orders',
  POS: 'pos',
  USERS: 'users',
  DISCOUNTS: 'discounts',
  SYSTEM: 'system',
};

module.exports = {
  ROLES,
  ORDER_TYPES,
  ORDER_STATUS,
  PAYMENT_METHODS,
  PAYMENT_STATUS,
  PURCHASE_ORDER_STATUS,
  NOTIFICATION_TYPES,
  AUDIT_MODULES,
};
