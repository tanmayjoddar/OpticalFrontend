import { useEffect, useRef, useState, useMemo } from "react";
import { useLocation, useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RetailerAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from 'sonner';
import { TablePagination } from "@/components/ui/table-pagination";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/status-badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { DateRangeFilter } from "@/components/ui/date-range-filter";
import { useQuerySync } from "@/hooks/useQuerySync";

export default function RetailerDistributions() {
  void useLocation(); // ensure router context
  void useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [statusMsg, setStatusMsg] = useState('Loading distributions…');
  type DistributionRow = {
    id: number;
    shop?: { name?: string } | null;
    retailerProduct?: { product?: { name?: string } | null } | null;
    quantity?: number;
    totalAmount?: number;
    deliveryStatus?: string;
    paymentStatus?: string;
  };
  const [list, setList] = useState<{ distributions: DistributionRow[]; pagination?: { page: number; limit: number; total: number; pages: number } | null; summary?: { totalDistributions?: number; totalAmount?: number; pendingDeliveries?: number; pendingPayments?: number } | null }>({ distributions: [], pagination: null, summary: null });
  const [filters, setFilters] = useState<{ shopId?: string; deliveryStatus?: string; paymentStatus?: string; dateFrom?: string; dateTo?: string }>({});
  const [page, setPage] = useState(1);
  // Shop-specific drill-in
  const [shopView, setShopView] = useState<{ id: number; name?: string } | null>(null);
  const [shopLoading, setShopLoading] = useState(false);
  const [shopData, setShopData] = useState<{ distributions: DistributionRow[]; pagination?: { page: number; pages: number; total: number; limit: number } | null }>({ distributions: [], pagination: null });

  const loadShopDistributions = async (p = 1) => {
    if (!shopView) return;
    try {
      setShopLoading(true);
      const res = await RetailerAPI.distributions.getByShop(shopView.id, { page: p, limit: 15 });
      setShopData(res as any);
    } catch {/* ignore */} finally { setShopLoading(false); }
  };
  // Create Distribution state
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [shops, setShops] = useState<Array<{ id: number; name: string }>>([]);
  const [retailerProducts, setRetailerProducts] = useState<Array<{ id: number; label: string }>>([]);
  const [form, setForm] = useState<{ shopId: string; notes: string; paymentDueDate: string; lines: Array<{ retailerProductId: string; quantity: string; unitPrice: string }> }>({ shopId: '', notes: '', paymentDueDate: '', lines: [{ retailerProductId: '', quantity: '', unitPrice: '' }] });
  // Detail drawer state
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailDistribution, setDetailDistribution] = useState<any | null>(null);

  const openDetail = async (distId: number) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailDistribution(null);
    try {
      // If API has dedicated endpoint; else find in current list
      let record: any;
      try { record = await (RetailerAPI as any).distributions?.get?.(distId); } catch {/* fallback */}
      if (!record) {
        record = list.distributions.find(d => d.id === distId);
      }
      setDetailDistribution(record || { id: distId });
    } catch {/* ignore */} finally { setDetailLoading(false); }
  };

  // Metadata caching (in-memory + sessionStorage fallback) with 5 min TTL
  const META_TTL_MS = 5 * 60 * 1000;
  const metaCacheRef = useRef<{ shops?: { data: any[]; ts: number }; products?: { data: any[]; ts: number } }>({});
  const loadMeta = async () => {
    const now = Date.now();
    // Shops
    try {
      let useCached = false;
      if (metaCacheRef.current.shops && (now - metaCacheRef.current.shops.ts) < META_TTL_MS) useCached = true;
      if (!useCached) {
        const cachedStr = sessionStorage.getItem('retailerMetaShops');
        if (cachedStr) {
          const parsed = JSON.parse(cachedStr);
          if (now - parsed.ts < META_TTL_MS) {
            metaCacheRef.current.shops = parsed;
            useCached = true;
          }
        }
      }
      if (useCached) {
        setShops(metaCacheRef.current.shops!.data);
      } else {
        const shopsRes: any = await (RetailerAPI as any).shops?.list?.();
        const data = Array.isArray(shopsRes) ? shopsRes.map((s: any) => ({ id: s.id, name: s.name })) : [];
        metaCacheRef.current.shops = { data, ts: now };
        try { sessionStorage.setItem('retailerMetaShops', JSON.stringify(metaCacheRef.current.shops)); } catch {}
        setShops(data);
      }
    } catch {/* ignore */}
    // Retailer Products
    try {
      let useCached = false;
      if (metaCacheRef.current.products && (now - metaCacheRef.current.products.ts) < META_TTL_MS) useCached = true;
      if (!useCached) {
        const cachedStr = sessionStorage.getItem('retailerMetaProducts');
        if (cachedStr) {
          const parsed = JSON.parse(cachedStr);
          if (now - parsed.ts < META_TTL_MS) { metaCacheRef.current.products = parsed; useCached = true; }
        }
      }
      if (useCached) {
        setRetailerProducts(metaCacheRef.current.products!.data);
      } else {
        const prods: any = await RetailerAPI.inventory.myProducts({ page: 1, limit: 100 });
        const data = (prods && Array.isArray(prods.products)) ? prods.products.map((p: any) => ({ id: p.id, label: p.product?.name || `#${p.id}` })) : [];
        metaCacheRef.current.products = { data, ts: now };
        try { sessionStorage.setItem('retailerMetaProducts', JSON.stringify(metaCacheRef.current.products)); } catch {}
        setRetailerProducts(data);
      }
    } catch {/* ignore */}
  };

  useEffect(() => { if (createOpen) loadMeta(); }, [createOpen]);

  const fetchData = async (p = page) => {
    try {
      setLoading(true);
      setStatusMsg('Loading distributions…');
      const baseParams: any = {
        page: p,
        limit: 20,
        retailerShopId: filters.shopId ? Number(filters.shopId) : undefined,
        status: filters.deliveryStatus || undefined,
        startDate: filters.dateFrom || undefined,
        endDate: filters.dateTo || undefined,
      };
      if (filters.paymentStatus) baseParams.paymentStatus = filters.paymentStatus; // tolerated via casting if backend supports; ignored otherwise
      const data = await RetailerAPI.distributions.getAll(baseParams);
      setList((data as any) || { distributions: [] });
      setPage(p);
      setStatusMsg('Distributions loaded');
    } catch (e) {
      const message = typeof e === "object" && e && "message" in e ? String((e as { message?: unknown }).message) : undefined;
      setError(message || "Failed to load distributions");
      setStatusMsg('Error loading distributions');
    } finally {
      setLoading(false); setRefreshing(false);
    }
  };

  const fetchRef = useRef(fetchData);
  useEffect(() => { fetchRef.current = fetchData; });
  // Use shared query sync hook
  useQuerySync<{ shopId?: string; deliveryStatus?: string; paymentStatus?: string; dateFrom?: string; dateTo?: string }>({
    state: filters,
    setState: (updater) => setFilters(updater(filters)),
    keys: ['shopId','deliveryStatus','paymentStatus','dateFrom','dateTo'],
    onExternalChange: () => { /* external change triggers fetch in effect below */ }
  });

  // Fetch on filter change
  useEffect(() => { fetchRef.current(1); }, [JSON.stringify(filters)]);

  const summary = useMemo(() => {
    if (list.summary) return list.summary;
    const totals = list.distributions.reduce((acc, d: any) => {
      acc.totalDistributions += 1;
      acc.totalAmount += d.totalAmount || 0;
      if (d.deliveryStatus && d.deliveryStatus !== 'DELIVERED') acc.pendingDeliveries += 1;
      if (d.paymentStatus && d.paymentStatus !== 'PAID') acc.pendingPayments += 1;
      return acc;
    }, { totalDistributions: 0, totalAmount: 0, pendingDeliveries: 0, pendingPayments: 0 });
    return totals;
  }, [list]);

  const skeletonTable = (
    <div className="overflow-x-auto border rounded-md">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-muted-foreground">
            {['Shop','Product','Qty','Amount','Delivery','Payment','Payment Due'].map(h => <th key={h} className="py-2 px-3">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 8 }).map((_,i)=>(
            <tr key={i} className="border-t">
              <td className="py-2 px-3"><Skeleton className="h-4 w-28"/></td>
              <td className="py-2 px-3"><Skeleton className="h-4 w-40"/></td>
              <td className="py-2 px-3"><Skeleton className="h-4 w-10"/></td>
              <td className="py-2 px-3"><Skeleton className="h-4 w-16"/></td>
              <td className="py-2 px-3"><Skeleton className="h-4 w-20"/></td>
              <td className="py-2 px-3"><Skeleton className="h-4 w-24"/></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-brand-gradient">Distributions</h2>
        <p className="text-muted-foreground">Recent distributions and statuses</p>
      </div>

      <div className="flex justify-between flex-wrap gap-4 items-start">
        {/* Summary Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs w-full md:w-auto flex-1" aria-live="polite">
          <div className="p-2 rounded-md bg-muted/40 border"><div className="text-muted-foreground">Distributions</div><div className="font-medium">{formatNumber(summary.totalDistributions)}</div></div>
          <div className="p-2 rounded-md bg-muted/40 border"><div className="text-muted-foreground">Total Amount</div><div className="font-medium">{formatCurrency(summary.totalAmount)}</div></div>
          <div className="p-2 rounded-md bg-muted/40 border"><div className="text-muted-foreground">Pending Deliveries</div><div className="font-medium">{formatNumber(summary.pendingDeliveries)}</div></div>
          <div className="p-2 rounded-md bg-muted/40 border"><div className="text-muted-foreground">Pending Payments</div><div className="font-medium">{formatNumber(summary.pendingPayments)}</div></div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" variant="outline" disabled={refreshing || loading} onClick={()=> { setRefreshing(true); fetchData(1); }}>{refreshing? 'Refreshing…':'Refresh'}</Button>
  <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) { setForm({ shopId: '', notes: '', paymentDueDate: '', lines: [{ retailerProductId: '', quantity: '', unitPrice: '' }] }); } }}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">New Distribution</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Distribution</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 text-sm">
              <div>
                <label className="block text-xs mb-1">Shop</label>
                <select className="w-full border rounded-md p-2" value={form.shopId} onChange={(e) => setForm(f => ({ ...f, shopId: e.target.value }))}>
                  <option value="">Select shop</option>
                  {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs mb-1">Notes (optional)</label>
                <Input value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Notes" />
              </div>
              <div>
                <label className="block text-xs mb-1">Payment Due Date (optional)</label>
                <Input type="date" value={form.paymentDueDate} onChange={(e) => setForm(f => ({ ...f, paymentDueDate: e.target.value }))} />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">Line Items</h4>
                  <Button size="sm" variant="ghost" onClick={() => setForm(f => ({ ...f, lines: [...f.lines, { retailerProductId: '', quantity: '', unitPrice: '' }] }))}>Add Line</Button>
                </div>
                <div>
                  <Input placeholder="Search product…" className="mb-2" onChange={(e) => {
                    const q = e.target.value.toLowerCase();
                    // Simple client-side label filter; retailerProducts already loaded
                    setRetailerProducts(prev => prev.map(p => ({ ...p, hidden: q && !p.label.toLowerCase().includes(q) })) as any);
                  }} />
                </div>
                {form.lines.map((ln, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-2 p-2 border rounded-md bg-muted/30">
                    <select className="border rounded-md p-2" value={ln.retailerProductId} onChange={(e) => setForm(f => ({ ...f, lines: f.lines.map((l,i)=> i===idx? { ...l, retailerProductId: e.target.value }: l) }))}>
                      <option value="">Product</option>
                      {retailerProducts.filter((rp:any)=> !rp.hidden).map(rp => <option key={rp.id} value={rp.id}>{rp.label}</option>)}
                    </select>
                    <Input type="number" placeholder="Qty" value={ln.quantity} onChange={(e) => setForm(f => ({ ...f, lines: f.lines.map((l,i)=> i===idx? { ...l, quantity: e.target.value }: l) }))} />
                    <Input type="number" placeholder="Unit Price" value={ln.unitPrice} onChange={(e) => setForm(f => ({ ...f, lines: f.lines.map((l,i)=> i===idx? { ...l, unitPrice: e.target.value }: l) }))} />
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-muted-foreground flex-1">{formatCurrency((parseFloat(ln.unitPrice||'0')*parseInt(ln.quantity||'0',10) || 0))}</div>
                      {form.lines.length > 1 && (
                        <Button size="sm" variant="outline" onClick={() => setForm(f => ({ ...f, lines: f.lines.filter((_,i)=> i!==idx) }))}>Remove</Button>
                      )}
                    </div>
                  </div>
                ))}
                <div className="flex justify-end text-xs text-muted-foreground gap-4 pr-1">
                  <span>Total Qty: {formatNumber(form.lines.reduce((a,l)=> a + (parseInt(l.quantity,10)||0),0))}</span>
                  <span>Grand Total: {formatCurrency(form.lines.reduce((a,l)=> a + ((parseFloat(l.unitPrice)||0)*(parseInt(l.quantity,10)||0)),0))}</span>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                <Button disabled={creating} onClick={async () => {
                  // Basic validation
                  if (!form.shopId) { toast.error('Select a shop'); return; }
                  const rawLines = form.lines.map(l => ({ retailerProductId: Number(l.retailerProductId), quantity: parseInt(l.quantity,10), unitPrice: parseFloat(l.unitPrice) }));
                  const lines = rawLines.filter(l => l.retailerProductId && l.quantity>0 && l.unitPrice>0);
                  // Duplicate product detection
                  const ids = lines.map(l=> l.retailerProductId);
                  const dup = ids.find((id,i)=> ids.indexOf(id)!==i);
                  if (dup) { toast.error('Duplicate product lines found'); return; }
                  if (!lines.length) { toast.error('Add at least one valid line'); return; }
                  try {
                    setCreating(true);
                    const resp = await RetailerAPI.distributions.create({
                      retailerShopId: Number(form.shopId),
                      distributions: lines.map(l => ({ retailerProductId: l.retailerProductId, quantity: l.quantity, unitPrice: l.unitPrice })),
                      notes: form.notes || undefined,
                      paymentDueDate: form.paymentDueDate ? new Date(form.paymentDueDate).toISOString() : undefined,
                    });
                    toast.success('Distribution created');
                    setCreateOpen(false);
                    setForm({ shopId: '', notes: '', paymentDueDate: '', lines: [{ retailerProductId: '', quantity: '', unitPrice: '' }] });
                    // Optimistic prepend to current list (basic record shape)
                    if ((resp as any)?.distributions?.length) {
                      setList(prev => ({ ...prev, distributions: [...(resp as any).distributions, ...prev.distributions] }));
                    }
                    // Dispatch global event for other pages (shops) to adjust stats
                    window.dispatchEvent(new CustomEvent('retailer:distribution-created', { detail: { shopId: Number(form.shopId), lines } }));
                    fetchData(1);
                  } catch (e: any) {
                    toast.error(e?.message || 'Create failed');
                  } finally { setCreating(false); }
                }}>{creating ? 'Creating…' : 'Create'}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="text-sm"><AlertDescription>{error} <Button size="sm" variant="outline" className="ml-2" onClick={()=> fetchData(page)}>Retry</Button></AlertDescription></Alert>
      )}

      <Card className="glass-card">
        <CardHeader><CardTitle className="text-brand-gradient">Recent</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center mb-4 flex-wrap">
            <input className="border rounded-md p-2" placeholder="Shop ID" value={filters.shopId || ""} onChange={(e) => setFilters(f => ({ ...f, shopId: e.target.value }))} />
            <select className="border rounded-md p-2" value={filters.deliveryStatus || ""} onChange={(e) => setFilters(f => ({ ...f, deliveryStatus: e.target.value }))}>
              <option value="">Delivery: Any</option>
              {['PENDING','SHIPPED','IN_TRANSIT','DELIVERED','RETURNED','CANCELLED'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select className="border rounded-md p-2" value={filters.paymentStatus || ""} onChange={(e) => setFilters(f => ({ ...f, paymentStatus: e.target.value }))}>
              <option value="">Payment: Any</option>
              {['PAID','UNPAID','OVERDUE','PARTIAL'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <DateRangeFilter
              value={{ start: filters.dateFrom, end: filters.dateTo }}
              onChange={(r) => setFilters(f => ({ ...f, dateFrom: r.start, dateTo: r.end }))}
            />
            <Button onClick={() => fetchData(1)}>Apply</Button>
            <Button variant="ghost" onClick={() => { setFilters({}); /* fetch triggered by filters effect */ }}>Reset</Button>
          </div>
          {/* Active filter badges */}
          <div className="flex gap-2 flex-wrap mb-3">
            {Object.entries(filters).filter(([,v]) => v).map(([k,v]) => (
              <div key={k} className="text-[10px] px-2 py-1 bg-muted rounded-md flex items-center gap-1">
                <span>{k}:{v}</span>
                <button className="text-xs" onClick={() => { setFilters(f=> { const clone = {...f}; delete (clone as any)[k]; return clone; }); fetchData(1); }}>✕</button>
              </div>
            ))}
          </div>
          <div aria-live="polite" className="sr-only">{statusMsg}</div>
          {loading ? skeletonTable : (
            <div className="overflow-x-auto border rounded-md">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground">
                    <th className="py-2 px-3">Shop</th>
                    <th className="py-2 px-3">Product</th>
                    <th className="py-2 px-3">Qty</th>
                    <th className="py-2 px-3">Amount</th>
                    <th className="py-2 px-3">Delivery</th>
                    <th className="py-2 px-3">Payment</th>
                    <th className="py-2 px-3">Payment Due</th>
                  </tr>
                </thead>
                <tbody>
                  {(list?.distributions ?? []).length ? (list.distributions.map((d: any) => (
                    <tr key={d.id} className="border-t hover:bg-muted/30 cursor-pointer" onClick={() => openDetail(d.id)}>
                      <td className="py-2 px-3">{d.shop?.name}</td>
                      <td className="py-2 px-3">{d.retailerProduct?.product?.name}</td>
                      <td className="py-2 px-3">{formatNumber(d.quantity || 0)}</td>
                      <td className="py-2 px-3">{formatCurrency(d.totalAmount || 0)}</td>
                      <td className="py-2 px-3"><StatusBadge status={d.deliveryStatus} /></td>
                      <td className="py-2 px-3"><StatusBadge status={d.paymentStatus} /></td>
                      <td className="py-2 px-3 text-xs">{d.paymentDueDate ? new Date(d.paymentDueDate).toLocaleDateString(undefined, { year:'2-digit', month:'short', day:'numeric' }) : '-'}</td>
                    </tr>
                  ))) : (
                    <tr><td colSpan={7} className="py-4 text-center text-xs text-muted-foreground">No distributions match current filters.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          {list.pagination && (
            <TablePagination
              page={list.pagination.page}
              totalPages={list.pagination.pages}
              totalItems={list.pagination.total}
              onPrev={() => fetchData(list.pagination!.page - 1)}
              onNext={() => fetchData(list.pagination!.page + 1)}
              disablePrev={list.pagination.page <= 1}
              disableNext={list.pagination.page >= list.pagination.pages}
              label="Distributions pagination"
              className="mt-4"
            />
          )}
        </CardContent>
      </Card>
      {shopView && (
    <Card className="glass-card">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-brand-gradient">Shop Distributions – {shopView.name}</CardTitle>
            <Button size="sm" variant="outline" onClick={() => { setShopView(null); setShopData({ distributions: [], pagination: null }); }}>Close</Button>
          </CardHeader>
          <CardContent>
            {shopLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : shopData.distributions.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-muted-foreground">
                      <th className="py-2 pr-4">Product</th>
                      <th className="py-2 pr-4">Qty</th>
                      <th className="py-2 pr-4">Amount</th>
                      <th className="py-2 pr-4">Delivery</th>
                      <th className="py-2 pr-4">Payment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shopData.distributions.map(sd => (
                      <tr key={sd.id} className="border-t">
                        <td className="py-2 pr-4">{sd.retailerProduct?.product?.name}</td>
                        <td className="py-2 pr-4">{formatNumber(sd.quantity || 0)}</td>
                        <td className="py-2 pr-4">{formatCurrency(sd.totalAmount || 0)}</td>
                        <td className="py-2 pr-4"><StatusBadge status={sd.deliveryStatus} /></td>
                        {/* Payment status omitted */}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No distributions for this shop.</p>
            )}
            {shopData.pagination && (
              <TablePagination
                page={shopData.pagination.page}
                totalPages={shopData.pagination.pages}
                totalItems={shopData.pagination.total}
                onPrev={() => loadShopDistributions(shopData.pagination!.page - 1)}
                onNext={() => loadShopDistributions(shopData.pagination!.page + 1)}
                disablePrev={shopData.pagination.page <= 1}
                disableNext={shopData.pagination.page >= shopData.pagination.pages}
                label="Shop distributions pagination"
                className="mt-3 text-[10px]"
              />
            )}
          </CardContent>
        </Card>
      )}
      {/* Distribution Detail Drawer */}
      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent side="right" className="sm:max-w-xl w-full">
          <SheetHeader>
            <SheetTitle>Distribution #{detailDistribution?.id}</SheetTitle>
            <SheetDescription>{detailDistribution?.shop?.name || 'Details'}</SheetDescription>
          </SheetHeader>
          <div className="px-2 pb-6 space-y-4 text-sm overflow-y-auto max-h-[80vh]">
            {detailLoading && <div className="text-muted-foreground">Loading…</div>}
            {!detailLoading && detailDistribution && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="clay p-3 rounded-lg">
                    <div className="text-[10px] uppercase text-muted-foreground">Shop</div>
                    <div className="font-medium">{detailDistribution.shop?.name || '—'}</div>
                  </div>
                  <div className="clay p-3 rounded-lg">
                    <div className="text-[10px] uppercase text-muted-foreground">Delivery</div>
                    <div><StatusBadge status={detailDistribution.deliveryStatus} /></div>
                  </div>
                  <div className="clay p-3 rounded-lg">
                    <div className="text-[10px] uppercase text-muted-foreground">Total Amount</div>
                    <div>{formatCurrency(detailDistribution.totalAmount || 0)}</div>
                  </div>
                  <div className="clay p-3 rounded-lg">
                    <div className="text-[10px] uppercase text-muted-foreground">Payment Due</div>
                    <div>{detailDistribution.paymentDueDate ? new Date(detailDistribution.paymentDueDate).toLocaleDateString() : '—'}</div>
                  </div>
                </div>
                {Array.isArray(detailDistribution.distributions || detailDistribution.lines) && (
                  <div>
                    <h4 className="text-xs font-medium mb-2 text-muted-foreground uppercase tracking-wide">Line Items</h4>
                    <div className="overflow-x-auto border rounded-md">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-left text-muted-foreground">
                            <th className="py-2 px-3">Product</th>
                            <th className="py-2 px-3">Qty</th>
                            <th className="py-2 px-3">Unit Price</th>
                            <th className="py-2 px-3">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(detailDistribution.distributions || detailDistribution.lines).map((ln: any, i: number) => (
                            <tr key={i} className="border-t">
                              <td className="py-2 px-3">{ln.retailerProduct?.product?.name || ln.product?.name || `#${ln.retailerProductId}`}</td>
                              <td className="py-2 px-3">{formatNumber(ln.quantity || 0)}</td>
                              <td className="py-2 px-3">{formatCurrency(ln.unitPrice || ln.price || 0)}</td>
                              <td className="py-2 px-3">{formatCurrency((ln.unitPrice || ln.price || 0) * (ln.quantity || 0))}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                {detailDistribution.notes && (
                  <div>
                    <h4 className="text-xs font-medium mb-1 text-muted-foreground uppercase tracking-wide">Notes</h4>
                    <p className="text-sm whitespace-pre-wrap">{detailDistribution.notes}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
