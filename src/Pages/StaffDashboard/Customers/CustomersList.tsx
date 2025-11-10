import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, RefreshCw, Search, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { StaffAPI } from "@/lib/api";
import { useEffect, useRef, useState } from "react";

interface Customer {
  id: number;
  name?: string;
  phone?: string;
  address?: string;
}

const DEFAULT_LIMIT = 10;

const CustomersList = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState(""); // debounced applied value
  const [idSearch, setIdSearch] = useState<string>('');
  const [idLookupLoading, setIdLookupLoading] = useState(false);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();

  // Debounce search input
  useEffect(() => {
    const id = setTimeout(() => { setQuery(search); setPage(1); }, 400);
    return () => clearTimeout(id);
  }, [search]);

  const fetchData = async () => {
    try {
      setLoading(true); setError(null);
      const res = await StaffAPI.customers.getAll({ page, limit: DEFAULT_LIMIT, search: query || undefined });
      // Flexible shape handling
      let list: Customer[] = [];
      let total = 0; let pages = 1;
      if (Array.isArray(res)) {
        list = res;
        total = res.length; pages = 1;
      } else {
        list = res.customers || res.data || [];
        total = res.total || res.count || list.length;
        pages = res.pages || (total ? Math.max(1, Math.ceil(total / (res.limit || DEFAULT_LIMIT))) : 1);
      }
      setCustomers(list);
      setTotalPages(pages);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load customers";
      setError(msg);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [page, query]);

  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600">Manage customer accounts and orders</p>
        </div>
        <div className="flex gap-2">
          <Link to="/staff-dashboard/customers/create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Customer
            </Button>
          </Link>
          <Button variant="outline" onClick={() => fetchData()} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-4 w-4" /> Customer List
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <div className="flex gap-2">
                <Input ref={searchRef} placeholder="Search name, phone or address" value={search} onChange={(e) => setSearch(e.target.value)} />
                <Input placeholder="Search by ID" value={idSearch} onChange={(e) => setIdSearch(e.target.value)} className="w-40" />
                <Button variant="outline" onClick={async () => {
                  const v = idSearch.trim();
                  if (!v) return;
                  const n = Number(v);
                  if (!Number.isFinite(n) || n <= 0) { setError('Enter a valid numeric customer ID'); return; }
                  try {
                    setIdLookupLoading(true); setError(null);
                    await StaffAPI.customers.getById(n);
                    // If found, navigate to the customer detail page
                    navigate(`/staff-dashboard/customers/${n}`);
                  } catch (e) {
                    const msg = e instanceof Error ? e.message : 'Customer not found';
                    setError(msg);
                  } finally { setIdLookupLoading(false); }
                }} disabled={idLookupLoading}>{idLookupLoading ? 'Looking…' : 'Go'}</Button>
              </div>
            </div>
          </div>
          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : customers.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">No customers found</div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr className="text-left">
                    <th className="py-2 px-3">Name</th>
                    <th className="py-2 px-3">Phone</th>
                    <th className="py-2 px-3">Address</th>
                    <th className="py-2 px-3 w-20">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map(c => (
                    <tr key={c.id} className="border-t hover:bg-muted/40 cursor-pointer" onClick={() => navigate(`/staff-dashboard/customers/${c.id}`)}>
                      <td className="py-2 px-3 font-medium">{c.name}</td>
                      <td className="py-2 px-3">{c.phone || <span className="text-muted-foreground">—</span>}</td>
                      <td className="py-2 px-3 max-w-[260px] truncate" title={c.address}>{c.address || <span className="text-muted-foreground">—</span>}</td>
                      <td className="py-2 px-3">
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/staff-dashboard/customers/${c.id}`); }} aria-label={`View ${c.name || 'customer'}`}>
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-muted-foreground">
              Page {page} of {totalPages}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => canPrev && setPage(p => p - 1)} disabled={!canPrev}> <ChevronLeft className="h-4 w-4" /> </Button>
              <Button variant="outline" size="sm" onClick={() => canNext && setPage(p => p + 1)} disabled={!canNext}> <ChevronRight className="h-4 w-4" /> </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomersList;
