import React from 'react';
import Badge from './Badge';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  XCircle, 
  ShieldCheck, 
  AlertTriangle,
  Package
} from 'lucide-react';

export default function StatusBadge({ status, type = 'order', size = 'md' }) {
  const normalized = (status || '').toString().toLowerCase();

  // Order Status
  if (type === 'order') {
    switch (normalized) {
      case 'completed':
        return <Badge variant="success" size={size} dot icon={CheckCircle2}>Completed</Badge>;
      case 'processing':
        return <Badge variant="info" size={size} dot icon={Clock}>Processing</Badge>;
      case 'pending':
        return <Badge variant="warning" size={size} dot icon={Clock}>Pending</Badge>;
      case 'cancelled':
        return <Badge variant="danger" size={size} dot icon={XCircle}>Cancelled</Badge>;
      default:
        return <Badge size={size}>{status}</Badge>;
    }
  }

  // Stock Status
  if (type === 'stock') {
    switch (normalized) {
      case 'in_stock':
      case 'healthy':
        return <Badge variant="success" size={size} dot>In Stock</Badge>;
      case 'low_stock':
      case 'warning':
        return <Badge variant="warning" size={size} dot icon={AlertTriangle}>Low Stock</Badge>;
      case 'out_of_stock':
      case 'critical':
      case 'expired':
        return <Badge variant="danger" size={size} dot icon={AlertCircle}>Critical / Out</Badge>;
      default:
        return <Badge size={size}>{status}</Badge>;
    }
  }

  // PO Status
  if (type === 'po') {
    switch (normalized) {
      case 'received':
        return <Badge variant="success" size={size} dot icon={CheckCircle2}>Received</Badge>;
      case 'placed':
        return <Badge variant="warning" size={size} dot icon={Clock}>Placed</Badge>;
      case 'draft':
        return <Badge size={size} dot>Draft</Badge>;
      case 'cancelled':
        return <Badge variant="danger" size={size} dot icon={XCircle}>Cancelled</Badge>;
      default:
        return <Badge size={size}>{status}</Badge>;
    }
  }

  // Role Status
  if (type === 'role') {
    switch (normalized) {
      case 'admin':
        return <Badge variant="purple" size={size} icon={ShieldCheck}>Admin</Badge>;
      case 'inventory_manager':
        return <Badge variant="warning" size={size} icon={Package}>Inventory Manager</Badge>;
      case 'cashier':
        return <Badge variant="info" size={size}>Cashier</Badge>;
      case 'customer':
        return <Badge variant="emerald" size={size}>Customer</Badge>;
      default:
        return <Badge size={size}>{status}</Badge>;
    }
  }

  return <Badge size={size}>{status}</Badge>;
}
