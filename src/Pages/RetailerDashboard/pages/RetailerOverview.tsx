import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TrendingUp, Package, Store, ChartColumn } from "lucide-react";
import { RetailerAPI } from "@/lib/api";
import type {
  DashboardOverviewResponse,
  SalesAnalyticsResponse,
  SalesAnalyticsParams,
  ShopPerformanceResponse,
  ShopPerformanceParams,
} from "@/lib/types/retailer";

// Lightweight formatting helpers (central util planned in todo #40)
const formatCurrency = (n?: number) =>
  typeof n === "number"
    ? new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(n)
    : "₹0";
const formatNumber = (n?: number) =>
  typeof n === "number" ? n.toLocaleString() : "0";

// Using canonical API types
type OverviewData = DashboardOverviewResponse | null;
type SalesData = SalesAnalyticsResponse | null;
type ShopPerfData = ShopPerformanceResponse | null;

export default function RetailerOverview() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<OverviewData>(null);
  const [sales, setSales] = useState<SalesData>(null);
  const [salesPeriod, setSalesPeriod] =
    useState<SalesAnalyticsParams["period"]>("month");
  const [pendingSalesPeriod, setPendingSalesPeriod] =
    useState<SalesAnalyticsParams["period"]>("month");
  const [loadingSales, setLoadingSales] = useState(false);
  const [shopPerf, setShopPerf] = useState<ShopPerfData>(null);
  const [shopPeriod, setShopPeriod] =
    useState<ShopPerformanceParams["period"]>("month");
  const [loadingShopPerf, setLoadingShopPerf] = useState(false);
  const [shopSortField, setShopSortField] = useState<
    "shopName" | "totalDistributions" | "totalAmount" | "paymentStatus"
  >("totalAmount");
  const [shopSortDir, setShopSortDir] = useState<"asc" | "desc">("desc");

  // Debounced sales period -> triggers overview + sales fetch (initial + when salesPeriod changes)
  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        setLoading(true);
        const [ov, sa] = await Promise.all([
          RetailerAPI.dashboard.overview(),
          RetailerAPI.dashboard.salesAnalytics({ period: salesPeriod }),
        ]);
        if (!mounted) return;
        setOverview(ov);
        setSales(sa);
      } catch (e) {
        const message =
          typeof e === "object" && e && "message" in e
            ? String((e as { message?: unknown }).message)
            : undefined;
        setError(message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, [salesPeriod]);

  useEffect(() => {
    if (pendingSalesPeriod === salesPeriod) return;
    const t = setTimeout(() => setSalesPeriod(pendingSalesPeriod), 300); // 300ms debounce
    return () => clearTimeout(t);
  }, [pendingSalesPeriod, salesPeriod]);

  // Fetch shop performance separately (independent period)
  useEffect(() => {
    let mounted = true;
    const fetchShopPerformance = async () => {
      try {
        setLoadingShopPerf(true);
        const data = await RetailerAPI.dashboard.shopPerformance({
          period: shopPeriod,
        });
        if (!mounted) return;
        setShopPerf(data);
      } catch {
        // Do not override primary dashboard error; silent fail displays empty state
      } finally {
        setLoadingShopPerf(false);
      }
    };
    fetchShopPerformance();
    return () => {
      mounted = false;
    };
  }, [shopPeriod]);

  // Memoized sorted shop performance
  const sortedShopPerformance = useMemo(() => {
    const arr = [...(shopPerf?.shopPerformance ?? [])];
    arr.sort((a, b) => {
      const dir = shopSortDir === "asc" ? 1 : -1;
      let av: unknown = (a as Record<string, unknown>)[shopSortField];
      let bv: unknown = (b as Record<string, unknown>)[shopSortField];
      if (shopSortField === "shopName" || shopSortField === "paymentStatus") {
        av = (av || "").toString().toLowerCase();
        bv = (bv || "").toString().toLowerCase();
        if ((av as string) < (bv as string)) return -1 * dir;
        if ((av as string) > (bv as string)) return 1 * dir;
        return 0;
      }
      av = typeof av === "number" ? av : 0;
      bv = typeof bv === "number" ? bv : 0;
      return (av as number) === (bv as number)
        ? 0
        : (av as number) > (bv as number)
        ? dir
        : -dir;
    });
    return arr;
  }, [shopPerf, shopSortField, shopSortDir]);

  const toggleShopSort = (field: typeof shopSortField) => {
    setShopSortField((prev) => {
      if (prev === field) {
        setShopSortDir((d) => (d === "asc" ? "desc" : "asc"));
        return prev; // keep same field
      }
      setShopSortDir("desc");
      return field;
    });
  };

  const refetchSalesOnly = async (period: SalesAnalyticsParams["period"]) => {
    setLoadingSales(true);
    try {
      const data = await RetailerAPI.dashboard.salesAnalytics({ period });
      setSales(data);
    } catch {
      /* silent */
    } finally {
      setLoadingSales(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card className="glass-card" key={i}>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                <Skeleton className="h-4 w-28" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-4 w-32 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-brand-gradient">Overview</h2>
        <p className="text-muted-foreground">Your business at a glance</p>
      </div>

      {/* Top stats (core overview KPIs) */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(overview?.salesSummary?.today?.totalSales)}
            </div>
            <p className="text-xs text-muted-foreground">
              Orders: {formatNumber(overview?.salesSummary?.today?.orderCount)}
            </p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <ChartColumn className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(overview?.salesSummary?.thisMonth?.totalSales)}
            </div>
            <p className="text-xs text-muted-foreground">
              Orders:{" "}
              {formatNumber(overview?.salesSummary?.thisMonth?.orderCount)}
            </p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Inventory</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(overview?.inventoryStatus?.totalStock)}
            </div>
            <p className="text-xs text-muted-foreground">
              Products: {formatNumber(overview?.inventoryStatus?.totalProducts)}
            </p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Shops</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(overview?.monthlyOverview?.activeShops)}
            </div>
            <p className="text-xs text-muted-foreground">
              Distributions:{" "}
              {formatNumber(overview?.monthlyOverview?.distributionCount)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Extended monthly overview metrics (products sold & revenue generated) */}
      {overview?.monthlyOverview && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Products Sold (Month)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatNumber(overview.monthlyOverview.productsSold)}
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Revenue Generated (Month)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(overview.monthlyOverview.revenueGenerated)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Inventory health metrics (low/out-of-stock & extended available/allocated) */}
      {overview?.inventoryStatus && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Low Stock Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatNumber(overview.inventoryStatus.lowStockProducts)}
              </div>
              <p className="text-xs text-muted-foreground">Need restock soon</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Out of Stock
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatNumber(overview.inventoryStatus.outOfStockProducts)}
              </div>
              <p className="text-xs text-muted-foreground">
                Unavailable for sale
              </p>
            </CardContent>
          </Card>
          {typeof overview.inventoryStatus.availableStock === "number" && (
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Available Stock
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(overview.inventoryStatus.availableStock)}
                </div>
              </CardContent>
            </Card>
          )}
          {typeof overview.inventoryStatus.allocatedStock === "number" && (
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Allocated Stock
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(overview.inventoryStatus.allocatedStock)}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <Tabs defaultValue="top-products" className="w-full">
        <TabsList className="glass-card">
          <TabsTrigger value="top-products">Top Products</TabsTrigger>
          <TabsTrigger value="sales-by-shop">Sales by Shop</TabsTrigger>
          <TabsTrigger value="sales-analytics">Sales Analytics</TabsTrigger>
          <TabsTrigger value="shop-performance">Shop Performance</TabsTrigger>
        </TabsList>
        <TabsContent value="top-products" className="mt-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-brand-gradient">
                Top Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground">
                      <th className="py-2 pr-4">Product</th>
                      <th className="py-2 pr-4">Company</th>
                      <th className="py-2 pr-4">Sold</th>
                      <th className="py-2 pr-4">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(overview?.topProducts ?? []).map((tp, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="py-2 pr-4">{tp.product?.name || "-"}</td>
                        <td className="py-2 pr-4">
                          {tp.product?.company?.name || "-"}
                        </td>
                        <td className="py-2 pr-4">
                          {formatNumber(tp.soldQuantity)}
                        </td>
                        <td className="py-2 pr-4">
                          {formatCurrency(tp.revenue)}
                        </td>
                      </tr>
                    ))}
                    {(!overview ||
                      (overview.topProducts?.length ?? 0) === 0) && (
                      <tr className="border-t">
                        <td
                          className="py-4 pr-4 text-center text-muted-foreground"
                          colSpan={4}
                        >
                          No top products yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="sales-by-shop" className="mt-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-brand-gradient">
                Sales by Shop (month)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground">
                      <th className="py-2 pr-4">Shop</th>
                      <th className="py-2 pr-4">Revenue</th>
                      <th className="py-2 pr-4">Qty</th>
                      <th className="py-2 pr-4">Orders</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(sales?.topSellingProducts ?? []).map((p, idx) => {
                      const pData = p as Record<string, unknown>;
                      return (
                        <tr key={idx} className="border-t">
                          <td className="py-2 pr-4">
                            {String(
                              (
                                (pData?.product as Record<string, unknown>)
                                  ?.shop as Record<string, unknown> | null
                              )?.name ||
                                pData?.shopName ||
                                "-"
                            )}
                          </td>
                          <td className="py-2 pr-4">
                            ₹
                            {(
                              pData?.revenue as
                                | number
                                | { toLocaleString: () => string }
                            )?.toLocaleString?.() ?? 0}
                          </td>
                          <td className="py-2 pr-4">
                            {(pData?.quantity as number) ??
                              (pData?.soldQuantity as number) ??
                              0}
                          </td>
                          <td className="py-2 pr-4">
                            {(pData?.orderCount as number) ?? 0}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="sales-analytics" className="mt-4">
          <Card className="glass-card">
            <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <CardTitle className="text-brand-gradient">
                Sales Analytics
              </CardTitle>
              <div className="flex items-center gap-2">
                <select
                  className="border rounded-md p-2 text-sm"
                  value={pendingSalesPeriod || ""}
                  onChange={(e) => {
                    const p = e.target.value as SalesAnalyticsParams["period"];
                    setPendingSalesPeriod(p);
                    // fire background refetch immediately for snappier feel; state will update after debounce too
                    refetchSalesOnly(p);
                  }}
                >
                  <option value="week">Week</option>
                  <option value="month">Month</option>
                  <option value="quarter">Quarter</option>
                  <option value="year">Year</option>
                </select>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 rounded-md bg-muted/40">
                  <p className="text-xs text-muted-foreground">Total Revenue</p>
                  <p className="text-lg font-semibold">
                    {formatCurrency(sales?.salesData?.totalRevenue)}
                  </p>
                </div>
                <div className="p-3 rounded-md bg-muted/40">
                  <p className="text-xs text-muted-foreground">Total Orders</p>
                  <p className="text-lg font-semibold">
                    {formatNumber(sales?.salesData?.totalOrders)}
                  </p>
                </div>
                <div className="p-3 rounded-md bg-muted/40">
                  <p className="text-xs text-muted-foreground">
                    Avg Order Value
                  </p>
                  <p className="text-lg font-semibold">
                    {formatCurrency(sales?.salesData?.averageOrderValue)}
                  </p>
                </div>
                <div className="p-3 rounded-md bg-muted/40">
                  <p className="text-xs text-muted-foreground">Growth Rate</p>
                  <p className="text-lg font-semibold">
                    {sales?.salesData?.growthRate ?? 0}%
                  </p>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">
                  Revenue Trend (Placeholder)
                </h4>
                <div className="h-40 flex items-end gap-[2px] rounded-md bg-muted/30 p-2 overflow-x-auto">
                  {(Array.isArray(sales?.chartData)
                    ? (sales?.chartData as Array<Record<string, unknown>>)
                    : []
                  )
                    .slice(0, 40)
                    .map((pt, i, arr) => {
                      const raw =
                        typeof pt === "number"
                          ? pt
                          : ((pt as Record<string, unknown>)
                              ?.value as number) ??
                            ((pt as Record<string, unknown>)
                              ?.revenue as number) ??
                            ((pt as Record<string, unknown>)
                              ?.totalRevenue as number) ??
                            0;
                      const max = arr.reduce((m: number, p) => {
                        const v =
                          typeof p === "number"
                            ? p
                            : ((p as Record<string, unknown>)
                                ?.value as number) ??
                              ((p as Record<string, unknown>)
                                ?.revenue as number) ??
                              ((p as Record<string, unknown>)
                                ?.totalRevenue as number) ??
                              0;
                        return v > m ? v : m;
                      }, 0);
                      const h = max
                        ? Math.max(4, ((raw as number) / max) * 100)
                        : 4;
                      return (
                        <div
                          key={i}
                          title={String(raw)}
                          style={{ height: `${h}%` }}
                          className="w-2 min-w-[6px] bg-gradient-to-t from-primary/60 to-primary/30 rounded-sm"
                        />
                      );
                    })}
                  {(!sales?.chartData ||
                    (sales?.chartData as Array<Record<string, unknown>>)
                      .length === 0) && (
                    <div className="text-xs text-muted-foreground flex items-center h-full">
                      No chart data
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">
                  Top Selling Products
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-muted-foreground">
                        <th className="py-2 pr-4">Product</th>
                        <th className="py-2 pr-4">Company</th>
                        <th className="py-2 pr-4">Sold</th>
                        <th className="py-2 pr-4">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(sales?.topSellingProducts ?? []).map((tp, idx) => {
                        const tpData = tp as Record<string, unknown>;
                        return (
                          <tr key={idx} className="border-t">
                            <td className="py-2 pr-4">
                              {String(
                                (tpData?.product as Record<string, unknown>)
                                  ?.name ||
                                  tpData?.name ||
                                  "-"
                              )}
                            </td>
                            <td className="py-2 pr-4">
                              {String(
                                (
                                  (tpData?.product as Record<string, unknown>)
                                    ?.company as Record<string, unknown>
                                )?.name || "-"
                              )}
                            </td>
                            <td className="py-2 pr-4">
                              {formatNumber(
                                (tpData?.soldQuantity as number) ??
                                  (tpData?.quantity as number)
                              )}
                            </td>
                            <td className="py-2 pr-4">
                              {formatCurrency(tpData?.revenue as number)}
                            </td>
                          </tr>
                        );
                      })}
                      {(!sales ||
                        (sales.topSellingProducts?.length ?? 0) === 0) && (
                        <tr className="border-t">
                          <td
                            className="py-4 pr-4 text-center text-muted-foreground"
                            colSpan={4}
                          >
                            No top selling products
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              {loadingSales && (
                <div className="text-xs text-muted-foreground">
                  Updating analytics…
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="shop-performance" className="mt-4">
          <Card className="glass-card">
            <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <CardTitle className="text-brand-gradient">
                Shop Performance
              </CardTitle>
              <div className="flex items-center gap-2">
                <select
                  className="border rounded-md p-2 text-sm"
                  value={shopPeriod || ""}
                  onChange={(e) =>
                    setShopPeriod(
                      e.target.value as ShopPerformanceParams["period"]
                    )
                  }
                >
                  <option value="week">Week</option>
                  <option value="month">Month</option>
                  <option value="quarter">Quarter</option>
                </select>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 rounded-md bg-muted/40">
                  <p className="text-xs text-muted-foreground">Shops (rows)</p>
                  <p className="text-lg font-semibold">
                    {formatNumber(shopPerf?.shopPerformance.length)}
                  </p>
                </div>
                <div className="p-3 rounded-md bg-muted/40">
                  <p className="text-xs text-muted-foreground">
                    Total Distributions
                  </p>
                  <p className="text-lg font-semibold">
                    {formatNumber(
                      shopPerf?.shopPerformance.reduce?.(
                        (a, b) => a + (b.totalDistributions || 0),
                        0
                      )
                    )}
                  </p>
                </div>
                <div className="p-3 rounded-md bg-muted/40">
                  <p className="text-xs text-muted-foreground">Total Amount</p>
                  <p className="text-lg font-semibold">
                    {formatCurrency(
                      shopPerf?.shopPerformance.reduce?.(
                        (a, b) => a + (b.totalAmount || 0),
                        0
                      )
                    )}
                  </p>
                </div>
                <div className="p-3 rounded-md bg-muted/40">
                  <p className="text-xs text-muted-foreground">Period</p>
                  <p className="text-lg font-semibold capitalize">
                    {shopPerf?.period || shopPeriod}
                  </p>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">Per-Shop Metrics</h4>
                <div className="overflow-x-auto hidden md:block">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-muted-foreground select-none">
                        <th
                          className="py-2 pr-4 cursor-pointer"
                          onClick={() => toggleShopSort("shopName")}
                        >
                          Shop{" "}
                          {shopSortField === "shopName"
                            ? shopSortDir === "asc"
                              ? "▲"
                              : "▼"
                            : ""}
                        </th>
                        <th
                          className="py-2 pr-4 cursor-pointer"
                          onClick={() => toggleShopSort("totalDistributions")}
                        >
                          Distributions{" "}
                          {shopSortField === "totalDistributions"
                            ? shopSortDir === "asc"
                              ? "▲"
                              : "▼"
                            : ""}
                        </th>
                        <th
                          className="py-2 pr-4 cursor-pointer"
                          onClick={() => toggleShopSort("totalAmount")}
                        >
                          Amount{" "}
                          {shopSortField === "totalAmount"
                            ? shopSortDir === "asc"
                              ? "▲"
                              : "▼"
                            : ""}
                        </th>
                        <th
                          className="py-2 pr-4 cursor-pointer"
                          onClick={() => toggleShopSort("paymentStatus")}
                        >
                          Payment Status{" "}
                          {shopSortField === "paymentStatus"
                            ? shopSortDir === "asc"
                              ? "▲"
                              : "▼"
                            : ""}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedShopPerformance.map((sp, idx) => (
                        <tr key={sp.shopId || idx} className="border-t">
                          <td className="py-2 pr-4 whitespace-nowrap">
                            {sp.shopName}
                          </td>
                          <td className="py-2 pr-4">
                            {formatNumber(sp.totalDistributions)}
                          </td>
                          <td className="py-2 pr-4">
                            {formatCurrency(sp.totalAmount)}
                          </td>
                          <td className="py-2 pr-4">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${
                                sp.paymentStatus === "PAID"
                                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                  : sp.paymentStatus === "PENDING"
                                  ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                  : sp.paymentStatus === "OVERDUE"
                                  ? "bg-red-500/10 text-red-600 border-red-500/20"
                                  : "bg-muted text-muted-foreground border-border"
                              }`}
                            >
                              {sp.paymentStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {(!shopPerf || shopPerf.shopPerformance.length === 0) &&
                        !loadingShopPerf && (
                          <tr className="border-t">
                            <td
                              className="py-4 pr-4 text-center text-muted-foreground"
                              colSpan={4}
                            >
                              No performance data
                            </td>
                          </tr>
                        )}
                      {loadingShopPerf && (
                        <tr className="border-t">
                          <td
                            className="py-4 pr-4 text-center text-muted-foreground"
                            colSpan={4}
                          >
                            Loading…
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {/* Mobile stacked list */}
                <div className="space-y-3 md:hidden">
                  {sortedShopPerformance.map((sp, idx) => (
                    <div
                      key={sp.shopId || idx}
                      className="rounded-md border p-3 bg-muted/30"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-sm">{sp.shopName}</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {sp.paymentStatus}
                          </p>
                        </div>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border ${
                            sp.paymentStatus === "PAID"
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                              : sp.paymentStatus === "PENDING"
                              ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                              : sp.paymentStatus === "OVERDUE"
                              ? "bg-red-500/10 text-red-600 border-red-500/20"
                              : "bg-muted text-muted-foreground border-border"
                          }`}
                        >
                          {sp.paymentStatus}
                        </span>
                      </div>
                      <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <p className="text-muted-foreground">Distributions</p>
                          <p className="font-semibold">
                            {formatNumber(sp.totalDistributions)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Amount</p>
                          <p className="font-semibold">
                            {formatCurrency(sp.totalAmount)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Period</p>
                          <p className="font-semibold capitalize">
                            {shopPerf?.period || shopPeriod}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!shopPerf || shopPerf.shopPerformance.length === 0) &&
                    !loadingShopPerf && (
                      <div className="text-center text-muted-foreground text-sm py-4">
                        No performance data
                      </div>
                    )}
                  {loadingShopPerf && (
                    <div className="text-center text-muted-foreground text-sm py-4">
                      Loading…
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
