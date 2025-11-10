export const CURRENCY_CODE = 'INR';
export const LOCALE = 'en-IN';

export function formatCurrency(value?: number | null, options?: Intl.NumberFormatOptions): string {
  if (value == null || Number.isNaN(Number(value))) return '—';
  const opts: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: CURRENCY_CODE,
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    ...options,
  };
  try {
    return new Intl.NumberFormat(LOCALE, opts).format(value);
  } catch (e) {
    // Fallback
    return `${getCurrencySymbol()}${Number(value).toFixed(opts.maximumFractionDigits ?? 2)}`;
  }
}

export function getCurrencySymbol(): string {
  // Using a simple mapping for now; Intl may vary by environment.
  return '₹';
}

export default formatCurrency;
