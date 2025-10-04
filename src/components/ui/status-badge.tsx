import { Badge } from "./badge";
import React from "react";

// Supported status categories and their mappings to color classes.
// Extend this map as new status domains appear.
const STATUS_STYLES: Record<string, string> = {
  // Delivery statuses
  DELIVERED: 'bg-emerald-600 hover:bg-emerald-600 text-white',
  PENDING: 'bg-amber-600 hover:bg-amber-600 text-white',
  SHIPPED: 'bg-blue-600 hover:bg-blue-600 text-white',
  IN_TRANSIT: 'bg-indigo-600 hover:bg-indigo-600 text-white',
  RETURNED: 'bg-rose-600 hover:bg-rose-600 text-white',
  CANCELLED: 'bg-red-600 hover:bg-red-600 text-white',
  // Payment statuses
  PAID: 'bg-emerald-700 hover:bg-emerald-700 text-white',
  UNPAID: 'bg-amber-700 hover:bg-amber-700 text-white',
  OVERDUE: 'bg-red-700 hover:bg-red-700 text-white',
  PARTIAL: 'bg-sky-700 hover:bg-sky-700 text-white',
  // Generic activity
  ACTIVE: 'bg-emerald-600 hover:bg-emerald-600 text-white',
  INACTIVE: 'bg-gray-400 hover:bg-gray-400 text-white',
  LOW: 'bg-amber-600 hover:bg-amber-600 text-white',
  OUT: 'bg-red-600 hover:bg-red-600 text-white',
  OK: 'bg-slate-600 hover:bg-slate-600 text-white',
};

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  status?: string | null;
  fallbackClassName?: string; // override for unknown statuses
  uppercase?: boolean;
}

export function StatusBadge({ status, className = '', fallbackClassName = 'bg-slate-500 hover:bg-slate-500 text-white', uppercase = true, ...rest }: StatusBadgeProps) {
  if (!status) return null;
  const key = status.toUpperCase();
  const style = STATUS_STYLES[key] || fallbackClassName;
  return (
    <Badge className={`${style} ${className}`} {...rest}>{uppercase ? key : status}</Badge>
  );
}

export function deriveStockStatusClass(status?: string | null) {
  if (!status) return 'bg-muted/60';
  switch (status) {
    case 'OUT': return 'bg-red-600 text-white';
    case 'LOW': return 'bg-amber-600 text-white';
    case 'OK': return 'bg-emerald-600 text-white';
    default: return 'bg-muted/60';
  }
}
