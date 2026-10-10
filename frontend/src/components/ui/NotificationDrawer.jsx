import React, { useState } from 'react';
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
  CheckCircle2
} from 'lucide-react';

export default function NotificationDrawer({
  isOpen,
  onClose,
  notifications = [],
  onClearAll,
}) {
  const [filter, setFilter] = useState('all');

  const defaultNotifications = [
    {
      id: 'notif-1',
      category: 'inventory',
      title: 'Low Stock Alert: Amul Butter 500g',
      message: 'Remaining stock is below reorder threshold (3 units left).',
      time: '10 mins ago',
      unread: true,
      type: 'warning',
    },
    {
      id: 'notif-2',
      category: 'inventory',
      title: 'Expiry Radar Notice',
      message: 'Batch BAT-2026-0001 (Britannia Bread) expires within 5 days.',
      time: '25 mins ago',
      unread: true,
      type: 'warning',
    },
    {
      id: 'notif-3',
      category: 'orders',
      title: 'Order Completed: #NXC-ORD-743293',
      message: 'Customer Emily Watson placed online grocery order of ₹1,250.00.',
      time: '1 hour ago',
      unread: false,
      type: 'success',
    },
    {
      id: 'notif-4',
      category: 'system',
      title: 'Audit Trail Snapshot Committed',
      message: 'Hourly physical inventory reconciliation cycle complete.',
      time: '2 hours ago',
      unread: false,
      type: 'info',
    },
  ];

  const list = notifications.length > 0 ? notifications : defaultNotifications;
  const filtered = filter === 'all' ? list : list.filter((n) => n.category === filter);

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Notifications & Alerts"
      description="Real-time supermarket event feed"
      width="max-w-md"
    >
      <div className="flex flex-col h-full space-y-4">
        {/* Category Filters */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5">
            {['all', 'inventory', 'orders'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFilter(cat)}
                className={`
                  px-2.5 py-1 text-xs font-semibold rounded-lg capitalize transition-colors
                  ${
                    filter === cat
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }
                `}
              >
                {cat}
              </button>
            ))}
          </div>

          {onClearAll && (
            <button
              type="button"
              onClick={onClearAll}
              className="text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className="flex-1 space-y-3 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              No notifications in this category.
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id || item._id}
                className={`
                  p-4 rounded-2xl border transition-all
                  ${
                    item.unread
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40'
                      : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800'
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`
                      w-8 h-8 rounded-xl shrink-0 flex items-center justify-center mt-0.5
                      ${
                        item.type === 'warning'
                          ? 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400'
                          : item.type === 'success'
                          ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                          : 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
                      }
                    `}
                  >
                    {item.type === 'warning' ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : item.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Package className="w-4 h-4" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                        {item.title}
                      </h4>
                      {item.unread && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-2">
                      {item.message}
                    </p>
                    <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
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
