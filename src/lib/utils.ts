import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Number & currency formatting helpers (simple, can expand later)
const currencyFormatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });
const numberFormatter = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

export function formatCurrency(val: number | null | undefined) {
  if (val == null || isNaN(val as any)) return '—';
  try { return currencyFormatter.format(val); } catch { return `₹${val}`; }
}
export function formatNumber(val: number | null | undefined) {
  if (val == null || isNaN(val as any)) return '—';
  try { return numberFormatter.format(val); } catch { return String(val); }
}
