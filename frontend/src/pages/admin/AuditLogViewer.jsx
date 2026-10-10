import React, { useState, useEffect } from 'react';
import Navbar from '../../components/common/Navbar';
import auditService from '../../services/auditService';
import { formatDateTime } from '../../utils/formatters';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  Eye, 
  Clock, 
  Layers, 
  X, 
  AlertCircle,
  FileText,
  UserCheck,
  ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Pagination from '../../components/ui/Pagination';

export default function AuditLogViewer() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [moduleFilter, setModuleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    fetchLogs();
  }, [page, moduleFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit: 20 };
      if (moduleFilter) params.module = moduleFilter;

      const res = await auditService.getAuditLogs(params);
      setLogs(res?.data?.logs || res?.logs || []);
      setPagination(res?.meta || { total: 0, pages: 1 });
    } catch (err) {
      setError(err.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const getModuleBadge = (mod) => {
    switch (mod) {
      case 'inventory':
        return <Badge variant="warning">Inventory</Badge>;
      case 'orders':
        return <Badge variant="success">Orders</Badge>;
      case 'products':
        return <Badge variant="primary">Products</Badge>;
      case 'discounts':
        return <Badge variant="purple">Discounts</Badge>;
      default:
        return <Badge variant="neutral">{mod}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800 gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-semibold uppercase tracking-wider">
                System Governance
              </span>
              <span className="text-slate-500 text-xs font-mono">{pagination.total} Immutable Entries</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Audit Trail & Compliance Log
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
              Tamper-evident record of stock adjustments, product updates, order fulfillments, and user activities
            </p>
          </div>

          <Link to="/admin">
            <Button variant="secondary" size="sm">
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Admin Console
            </Button>
          </Link>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-200 text-xs mb-6 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Filter Bar */}
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl mb-6 shadow-sm flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5" /> Filter by Module:
            </span>
            <select
              value={moduleFilter}
              onChange={(e) => {
                setModuleFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-purple-500"
            >
              <option value="">All System Modules</option>
              <option value="inventory">Inventory Adjustments</option>
              <option value="orders">Orders & Fulfillment</option>
              <option value="products">Catalog Products</option>
              <option value="discounts">Discounts & Rules</option>
              <option value="users">User Governance</option>
            </select>
          </div>
        </div>

        {/* Logs Table */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin mx-auto mb-3"></div>
            <p className="text-xs text-slate-400">Loading audit log events...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900/40 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md mx-auto shadow-sm">
            <ShieldCheck className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800 dark:text-white mb-1">No Audit Entries Found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Operations will log automatically upon execution.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-6 py-4">Timestamp</th>
                      <th className="px-6 py-4">Module & Action</th>
                      <th className="px-6 py-4">Actor (User)</th>
                      <th className="px-6 py-4">Notes / Rationale</th>
                      <th className="px-6 py-4 text-right">State Diff</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                    {logs.map((log) => (
                      <tr key={log._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                          {formatDateTime(log.createdAt)}
                        </td>

                        <td className="px-6 py-4 font-sans">
                          <div className="flex items-center gap-2 mb-1">
                            {getModuleBadge(log.module)}
                          </div>
                          <div className="font-bold text-slate-900 dark:text-white text-xs">{log.action}</div>
                        </td>

                        <td className="px-6 py-4 font-sans">
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {log.userId?.name || 'Automated System'}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">
                            {log.userId?.email || 'System Daemon'} ({log.userId?.role || 'SYSTEM'})
                          </div>
                        </td>

                        <td className="px-6 py-4 font-sans text-slate-600 dark:text-slate-300 max-w-xs truncate">
                          {log.notes || 'Routine transactional state update'}
                        </td>

                        <td className="px-6 py-4 text-right font-sans">
                          <button
                            type="button"
                            onClick={() => setSelectedLog(log)}
                            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                            title="Inspect State Snapshot"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden mt-4">
              <Pagination
                currentPage={page}
                totalPages={pagination.pages}
                totalItems={pagination.total}
                pageSize={15}
                onPageChange={setPage}
              />
            </div>
          </div>
        )}

        {/* State Snapshot Diff Modal */}
        {selectedLog && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl flex flex-col max-h-[85vh]">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    {getModuleBadge(selectedLog.module)}
                    <span className="text-xs font-mono text-purple-600 dark:text-purple-300 font-semibold">{selectedLog.action}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">Audit Snapshot & State Diff</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedLog(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400 block">Actor:</span>
                    <span className="text-slate-900 dark:text-white font-medium">{selectedLog.userId?.name || 'System Daemon'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Date & Time:</span>
                    <span className="text-slate-900 dark:text-white">{formatDateTime(selectedLog.createdAt)}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block">Notes:</span>
                    <span className="text-slate-700 dark:text-slate-300">{selectedLog.notes || 'None'}</span>
                  </div>
                </div>

                {selectedLog.previousState && (
                  <div>
                    <span className="font-bold text-rose-600 dark:text-rose-400 block mb-1">Previous State</span>
                    <pre className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-800 dark:text-slate-300 overflow-x-auto">
                      {JSON.stringify(selectedLog.previousState, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedLog.newState && (
                  <div>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 block mb-1">New State</span>
                    <pre className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-800 dark:text-slate-300 overflow-x-auto">
                      {JSON.stringify(selectedLog.newState, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                <Button
                  onClick={() => setSelectedLog(null)}
                  variant="secondary"
                  size="sm"
                >
                  Close Snapshot
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
