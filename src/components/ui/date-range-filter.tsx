import { Button } from './button';

export type DateRangeValue = { start?: string; end?: string };

interface DateRangeFilterProps {
  value: DateRangeValue;
  onChange: (next: DateRangeValue) => void;
  className?: string;
  presets?: Array<{ label: string; range: () => DateRangeValue }>;
}

const defaultPresets: DateRangeFilterProps['presets'] = [
  { label: '7d', range: () => lastNDays(7) },
  { label: '30d', range: () => lastNDays(30) },
  { label: 'QTD', range: () => quarterToDate() },
  { label: 'YTD', range: () => yearToDate() },
  { label: 'All', range: () => ({ start: undefined, end: undefined }) },
];

function fmt(d: Date) { return d.toISOString().slice(0,10); }
function startOfDay(d: Date) { d.setHours(0,0,0,0); return d; }
function endOfDay(d: Date) { d.setHours(23,59,59,999); return d; }
function lastNDays(n: number): DateRangeValue { const end = new Date(); const start = new Date(); start.setDate(end.getDate() - (n-1)); return { start: fmt(startOfDay(start)), end: fmt(endOfDay(end)) }; }
function yearToDate(): DateRangeValue { const now = new Date(); const start = new Date(now.getFullYear(),0,1); return { start: fmt(startOfDay(start)), end: fmt(endOfDay(now)) }; }
function quarterToDate(): DateRangeValue { const now = new Date(); const q = Math.floor(now.getMonth()/3); const start = new Date(now.getFullYear(), q*3, 1); return { start: fmt(startOfDay(start)), end: fmt(endOfDay(now)) }; }

export function DateRangeFilter({ value, onChange, className='', presets = defaultPresets }: DateRangeFilterProps) {
  const apply = (range: DateRangeValue) => onChange(range);
  const list: NonNullable<DateRangeFilterProps['presets']> = (presets && presets.length ? presets : defaultPresets)!;
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <input type="date" className="border rounded-md p-2 text-sm" value={value.start || ''} onChange={(e)=> onChange({ ...value, start: e.target.value || undefined })} />
      <span className="text-xs text-muted-foreground">to</span>
      <input type="date" className="border rounded-md p-2 text-sm" value={value.end || ''} onChange={(e)=> onChange({ ...value, end: e.target.value || undefined })} />
      <div className="flex items-center gap-1">
        {list.map(p => (
          <Button key={p.label} size="sm" variant="outline" type="button" onClick={() => apply(p.range())}>{p.label}</Button>
        ))}
      </div>
    </div>
  );
}
