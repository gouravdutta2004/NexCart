export const ROLES = {
  ADMIN: 'admin',
  INVENTORY_MANAGER: 'inventory_manager',
  CASHIER: 'cashier',
  CUSTOMER: 'customer',
};

export const ROLE_LABELS = {
  [ROLES.ADMIN]: 'Administrator',
  [ROLES.INVENTORY_MANAGER]: 'Inventory Manager',
  [ROLES.CASHIER]: 'Cashier',
  [ROLES.CUSTOMER]: 'Customer',
};

export const ORDER_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const ORDER_STATUS_COLORS = {
  [ORDER_STATUS.PENDING]: 'bg-amber-100 text-amber-800 border-amber-200',
  [ORDER_STATUS.PROCESSING]: 'bg-blue-100 text-blue-800 border-blue-200',
  [ORDER_STATUS.COMPLETED]: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  [ORDER_STATUS.CANCELLED]: 'bg-rose-100 text-rose-800 border-rose-200',
};
