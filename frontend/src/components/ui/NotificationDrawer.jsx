import React, { useState, useMemo, useEffect, useRef } from 'react';
import Drawer from './Drawer';
import Badge from './Badge';
import { 
  Bell, 
  Package, 
  ShoppingBag, 
  AlertTriangle, 
  Clock, 
  Check, 
  Trash2, 
  CheckCircle2,
  CreditCard,
  PlayCircle,
  Zap,
  Truck,
  FileText,
  Store,
  Info
} from 'lucide-react';

// Panel & Role-Specific Configuration Matrices
const ROLE_CONFIGS = {
  admin: {
    badge: 'Admin Console',
    badgeVariant: 'purple',
    title: 'Supermarket Operations & Alerts',
    description: 'System telemetry, orders, inventory radar & audit ledger',
    categories: [
      { id: 'all', label: 'All Events' },
      { id: 'orders', label: 'Orders' },
      { id: 'inventory', label: 'Inventory' },
      { id: 'system', label: 'System & Audit' },
    ],
    defaultFeed: [
      {
        id: 'admin-1',
        category: 'orders',
        title: 'New Online Order: #NXC-ORD-743293',
        message: 'Order of ₹1,250.00 confirmed with atomic FEFO batch deductions.',
        time: '12 mins ago',
        unread: true,
        type: 'success',
      },
      {
        id: 'admin-2',
        category: 'inventory',
        title: 'Low Stock Alert: Amul Butter 500g',
        message: 'Stock (3 units) dropped below reorder threshold (10 units).',
        time: '25 mins ago',
        unread: true,
        type: 'warning',
      },
      {
        id: 'admin-3',
        category: 'inventory',
        title: 'Expiry Radar Warning: Britannia Bread',
        message: 'Batch BAT-2026-0001 expires within 5 days. Clearance discount active.',
        time: '45 mins ago',
        unread: false,
        type: 'warning',
      },
      {
        id: 'admin-4',
        category: 'system',
        title: 'Audit Trail Snapshot Committed',
        message: 'Automated hourly inventory reconciliation completed with immutable verification.',
        time: '2 hours ago',
        unread: false,
        type: 'info',
      },
    ],
  },
  inventory_manager: {
    badge: 'Inventory Hub',
    badgeVariant: 'warning',
    title: 'Warehouse & Stock Operations',
    description: 'Threshold alerts, FEFO batch radar & supplier fulfillment',
    categories: [
      { id: 'all', label: 'All Alerts' },
      { id: 'inventory', label: 'Stock & FEFO' },
      { id: 'procurement', label: 'Purchase Orders' },
    ],
    defaultFeed: [
      {
        id: 'inv-1',
        category: 'inventory',
        title: 'Low Stock Trigger: Amul Butter 500g',
        message: 'Warehouse stock at 3 units. Automated reorder trigger threshold reached.',
        time: '10 mins ago',
        unread: true,
        type: 'warning',
      },
      {
        id: 'inv-2',
        category: 'inventory',
        title: 'Perishable Expiry Notice: Britannia Bread',
        message: 'Batch BAT-2026-0001 (40 units) enters 5-day clearance window.',
        time: '30 mins ago',
        unread: true,
        type: 'warning',
      },
      {
        id: 'inv-3',
        category: 'procurement',
        title: 'PO-2026-001 Received & Deposited',
        message: 'Supplier Gujarat Co-op delivery accepted. 50 units allocated to Main Aisle.',
        time: '1 hour ago',
        unread: false,
        type: 'success',
      },
      {
        id: 'inv-4',
        category: 'inventory',
        title: 'Cycle Count Audit Recorded',
        message: 'Discrepancy adjustment committed to append-only compliance ledger.',
        time: '3 hours ago',
        unread: false,
        type: 'info',
      },
    ],
  },
  cashier: {
    badge: 'POS Terminal',
    badgeVariant: 'info',
    title: 'POS Lane Operations',
    description: 'Active lane tenders, parked carts & express cashier alerts',
    categories: [
      { id: 'all', label: 'All Lane Events' },
      { id: 'pos', label: 'POS Billing' },
      { id: 'held_carts', label: 'Parked Baskets' },
    ],
    defaultFeed: [
      {
        id: 'csh-1',
        category: 'held_carts',
        title: 'Customer Basket on Hold: #HC-8421',
        message: 'Walk-in Shopper basket (₹840.00) parked at Lane 01. Press F8 to recall.',
        time: '5 mins ago',
        unread: true,
        type: 'warning',
      },
      {
        id: 'csh-2',
        category: 'pos',
        title: 'POS Tender Settled: #INV-2026-0042',
        message: 'Transaction ₹1,420.00 finalized via Cash. Change of ₹80.00 tendered.',
        time: '20 mins ago',
        unread: false,
        type: 'success',
      },
      {
        id: 'csh-3',
        category: 'pos',
        title: 'Barcode Scanner Hardware Ready',
        message: 'Hardware scanner and POS thermal printer online on Terminal #01.',
        time: '1 hour ago',
        unread: false,
        type: 'info',
      },
      {
        id: 'csh-4',
        category: 'pos',
        title: 'Velocity Clearance Discount Active',
        message: 'Dynamic 15% markdown enabled for expiring dairy batches.',
        time: '2 hours ago',
        unread: false,
        type: 'success',
      },
    ],
  },
  customer: {
    badge: 'Customer Account',
    badgeVariant: 'emerald',
    title: 'My Shopping Updates',
    description: 'Order fulfillment status, GST digital tax invoices & savings',
    categories: [
      { id: 'all', label: 'All Updates' },
      { id: 'orders', label: 'My Orders' },
      { id: 'promotions', label: 'Deals & Savings' },
    ],
    defaultFeed: [
      {
        id: 'cust-1',
        category: 'orders',
        title: 'Order Confirmed: #NXC-ORD-743293',
        message: 'Your supermarket grocery order of ₹1,250.00 has been verified and confirmed.',
        time: '20 mins ago',
        unread: true,
        type: 'success',
      },
      {
        id: 'cust-2',
        category: 'orders',
        title: 'GST Digital Tax Invoice Ready',
        message: 'Official paperless invoice generated. Access and download anytime from My Orders.',
        time: '40 mins ago',
        unread: false,
        type: 'info',
      },
      {
        id: 'cust-3',
        category: 'promotions',
        title: 'Smart Clearance Deal: Up to 25% Off Dairy',
        message: 'Automated FEFO freshness savings now available on select organic dairy products.',
        time: '2 hours ago',
        unread: false,
        type: 'warning',
      },
      {
        id: 'cust-4',
        category: 'promotions',
        title: 'Express Self-Checkout Available',
        message: 'Skip the queues! Scan barcodes directly at our in-store express kiosks.',
        time: '1 day ago',
        unread: false,
        type: 'success',
      },
    ],
  },
  guest: {
    badge: 'Storefront',
    badgeVariant: 'default',
    title: 'Supermarket Announcements',
    description: 'Fresh arrivals, automated clearance discounts & store features',
    categories: [
      { id: 'all', label: 'All Announcements' },
      { id: 'promotions', label: 'Fresh Deals' },
      { id: 'store', label: 'Store Features' },
    ],
    defaultFeed: [
      {
        id: 'guest-1',
        category: 'promotions',
        title: 'Automated Freshness Deals Active',
        message: 'Enjoy real-time FEFO discounts on fresh bakery, dairy, and seasonal groceries.',
        time: '15 mins ago',
        unread: true,
        type: 'warning',
      },
      {
        id: 'guest-2',
        category: 'store',
        title: 'Express Self-Checkout Kiosks Open',
        message: 'Scan barcodes and pay with zero waiting time at self-checkout lane terminals.',
        time: '1 hour ago',
        unread: false,
        type: 'success',
      },
      {
        id: 'guest-3',
        category: 'store',
        title: 'GST-Compliant Digital Invoicing',
        message: 'NexCart provides paperless, verified tax invoices on every transaction.',
        time: '3 hours ago',
        unread: false,
        type: 'info',
      },
    ],
  },
};

export default function NotificationDrawer({
  isOpen,
  onClose,
  notifications = [],
  onClearAll,
  role = null,
  userName = null,
}) {
  const [filter, setFilter] = useState('all');
  const [isCleared, setIsCleared] = useState(false);
  const prevCountRef = useRef(notifications.length);

  useEffect(() => {
    if (notifications.length > prevCountRef.current) {
      setIsCleared(false);
    }
    prevCountRef.current = notifications.length;
  }, [notifications.length]);

  const handleClear = () => {
    setIsCleared(true);
    if (onClearAll) onClearAll();
  };

  // Identify current workspace role configuration
  const currentRole = role || 'guest';
  const roleConfig = ROLE_CONFIGS[currentRole] || ROLE_CONFIGS.guest;

  // Filter out any socket messages that don't belong to this role's purview
  const filteredNotifications = useMemo(() => {
    if (isCleared) return [];

    // If we have live socket notifications, filter them by current role scope
    const liveFiltered = notifications.filter((item) => {
      if (currentRole === 'admin') return true;
      if (currentRole === 'inventory_manager') {
        return item.category === 'inventory' || item.category === 'procurement';
      }
      if (currentRole === 'cashier') {
        return item.category === 'pos' || item.category === 'held_carts';
      }
      if (currentRole === 'customer') {
        return item.category === 'orders' || item.category === 'promotions';
      }
      return item.category === 'promotions' || item.category === 'store';
    });

    if (liveFiltered.length > 0) {
      return liveFiltered;
    }
    return roleConfig.defaultFeed;
  }, [notifications, currentRole, roleConfig, isCleared]);

  const activeCategoryList = filter === 'all' 
    ? filteredNotifications 
    : filteredNotifications.filter((n) => n.category === filter);

  // Render context-specific icon per notification type & category
  const renderItemIcon = (item) => {
    if (item.category === 'held_carts') {
      return <PlayCircle className="w-4 h-4 text-amber-500" />;
    }
    if (item.category === 'pos') {
      return <CreditCard className="w-4 h-4 text-emerald-500" />;
    }
    if (item.category === 'procurement') {
      return <Truck className="w-4 h-4 text-blue-500" />;
    }
    if (item.category === 'system') {
      return <FileText className="w-4 h-4 text-purple-500" />;
    }
    if (item.category === 'promotions') {
      return <Zap className="w-4 h-4 text-amber-500" />;
    }
    if (item.category === 'store') {
      return <Store className="w-4 h-4 text-emerald-500" />;
    }

    if (item.type === 'warning') {
      return <AlertTriangle className="w-4 h-4 text-amber-500" />;
    }
    if (item.type === 'success') {
      return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    }
    if (item.category === 'orders') {
      return <ShoppingBag className="w-4 h-4 text-emerald-500" />;
    }
    return <Package className="w-4 h-4 text-blue-500" />;
  };

  const getIconBackground = (item) => {
    if (item.type === 'warning' || item.category === 'held_carts' || item.category === 'promotions') {
      return 'bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400';
    }
    if (item.type === 'success' || item.category === 'orders' || item.category === 'store') {
      return 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400';
    }
    if (item.category === 'system') {
      return 'bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400';
    }
    return 'bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400';
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={roleConfig.title}
      description={roleConfig.description}
      width="max-w-md"
    >
      <div className="flex flex-col h-full space-y-4">
        {/* Role Workspace Indicator */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Badge variant={roleConfig.badgeVariant} size="sm" dot>
              {roleConfig.badge}
            </Badge>
            {userName && (
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate max-w-[150px]">
                {userName}
              </span>
            )}
          </div>

          {onClearAll && (
            <button
              type="button"
              onClick={handleClear}
              className="text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Dynamic Category Filter Tabs Tailored to the Role */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {roleConfig.categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setFilter(cat.id)}
              className={`
                px-2.5 py-1 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors
                ${
                  filter === cat.id
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }
              `}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Notifications Event Feed */}
        <div className="flex-1 space-y-3 overflow-y-auto pr-0.5">
          {activeCategoryList.length === 0 ? (
            <div className="text-center py-12 text-slate-400 dark:text-slate-500 text-xs">
              <Info className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
              No active events in this view.
            </div>
          ) : (
            activeCategoryList.map((item) => (
              <div
                key={item.id || item._id}
                className={`
                  p-4 rounded-2xl border transition-all
                  ${
                    item.unread
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 shadow-xs'
                      : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80'
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center mt-0.5 ${getIconBackground(item)}`}>
                    {renderItemIcon(item)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                        {item.title}
                      </h4>
                      {item.unread && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Unread" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-2">
                      {item.message}
                    </p>
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" />
                      {item.time || 'Just now'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Drawer>
  );
}
