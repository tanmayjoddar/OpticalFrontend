import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RetailerAPI } from "@/lib/api";
import type {
  ReportsListResponse,
  ProfitLossResponse,
  TaxReportResponse,
  StockValuationResponse,
} from "@/lib/types/retailer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Lightweight formatting helpers (will be centralized in util per todo #40)
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

export default function RetailerReports() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  type ReportRow = {
    id: number;
    type?: string;
    generatedAt: string;
    summary?: {
      totalRevenue?: number;
      totalCosts?: number;
      netProfit?: number;
    } | null;
  };
  const [reportData, setReportData] = useState<ReportsListResponse | null>(
    null
  );
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [fetching, setFetching] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "list" | "profit-loss" | "tax" | "valuation"
  >("list");
  const [plLoading, setPlLoading] = useState(false);
  const [taxLoading, setTaxLoading] = useState(false);
  const [valLoading, setValLoading] = useState(false);
  const [profitLoss, setProfitLoss] = useState<ProfitLossResponse | null>(null);
  const [taxReport, setTaxReport] = useState<TaxReportResponse | null>(null);
  const [valuation, setValuation] = useState<StockValuationResponse | null>(
    null
  );
  const [plStart, setPlStart] = useState("");
  const [plEnd, setPlEnd] = useState("");
  const [taxStart, setTaxStart] = useState("");
  const [taxEnd, setTaxEnd] = useState("");
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await RetailerAPI.reports.getAll({ page, limit });
        if (!mounted) return;
        setReportData(data as ReportsListResponse);
      } catch (e) {
        const message =
          typeof e === "object" && e && "message" in e
            ? String((e as { message?: unknown }).message)
            : undefined;
        setError(message || "Failed to load reports");
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [page, limit]);

  const refetch = async (resetToFirst?: boolean) => {
    setFetching(true);
    try {
      const currentPage = resetToFirst ? 1 : page;
      if (resetToFirst && page !== 1) setPage(1); // effect will refetch; still we assign below for immediate accuracy
      const data = await RetailerAPI.reports.getAll({
        page: currentPage,
        limit,
      });
      setReportData(data as ReportsListResponse);
    } finally {
      setFetching(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card className="glass-card" key={i}>
            <CardHeader>
              <CardTitle className="text-sm">
                <Skeleton className="h-4 w-40" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-16 w-full" />
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
        <h2 className="text-2xl font-semibold text-brand-gradient">
          Reports & Analytics
        </h2>
        <p className="text-muted-foreground">
          Generate and review financial & inventory reports
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) =>
          setActiveTab(v as "list" | "profit-loss" | "tax" | "valuation")
        }
        className="w-full"
      >
        <TabsList className="glass-card flex flex-wrap gap-2">
          <TabsTrigger value="list">Report List</TabsTrigger>
          <TabsTrigger value="profit-loss">Profit & Loss</TabsTrigger>
          <TabsTrigger value="tax">Tax Report</TabsTrigger>
          <TabsTrigger value="valuation">Stock Valuation</TabsTrigger>
        </TabsList>

        {/* Report List Tab */}
        <TabsContent value="list" className="mt-4 space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-brand-gradient">
                Generate Quick Reports
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Input
                  placeholder="Start"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <Input
                  placeholder="End"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
                <Button
                  size="sm"
                  onClick={async () => {
                    if (!startDate || !endDate) return;
                    try {
                      await RetailerAPI.reports.profitLoss({
                        startDate,
                        endDate,
                        format: "json",
                      });
                      await refetch(true);
                    } catch {
                      /* ignore */
                    }
                  }}
                >
                  P&L
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={async () => {
                    if (!startDate || !endDate) return;
                    try {
                      await RetailerAPI.reports.taxReport({
                        startDate,
                        endDate,
                        format: "json",
                      });
                      await refetch(true);
                    } catch {
                      /* ignore */
                    }
                  }}
                >
                  Tax
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    try {
                      await RetailerAPI.reports.stockValuation();
                      await refetch(true);
                    } catch {
                      /* ignore */
                    }
                  }}
                >
                  Valuation
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-brand-gradient">
                Recent Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground">
                      <th className="py-2 pr-4">Type</th>
                      <th className="py-2 pr-4">Generated</th>
                      <th className="py-2 pr-4">Summary</th>
                      <th className="py-2 pr-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(reportData?.reports ?? []).map((r: ReportRow) => (
                      <tr key={r.id} className="border-t">
                        <td className="py-2 pr-4">{r.type}</td>
                        <td className="py-2 pr-4">
                          {new Date(r.generatedAt).toLocaleString()}
                        </td>
                        <td className="py-2 pr-4">
                          {r.type === "profit-loss" && (
                            <span>
                              Rev: {formatCurrency(r.summary?.totalRevenue)} |
                              Net: {formatCurrency(r.summary?.netProfit)}
                            </span>
                          )}
                          {r.type === "tax-report" && (
                            <span>
                              Taxable: {formatCurrency(r.summary?.totalRevenue)}
                            </span>
                          )}
                          {r.type === "stock-valuation" && (
                            <span>
                              Value: {formatCurrency(r.summary?.totalRevenue)}
                            </span>
                          )}
                        </td>
                        <td className="py-2 pr-4 flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setActiveTab(
                                r.type === "profit-loss"
                                  ? "profit-loss"
                                  : r.type === "tax-report"
                                  ? "tax"
                                  : "valuation"
                              )
                            }
                          >
                            View
                          </Button>
                          <Dialog
                            open={confirmId === r.id}
                            onOpenChange={(o) => !o && setConfirmId(null)}
                          >
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => setConfirmId(r.id)}
                              >
                                Delete
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Delete Report</DialogTitle>
                              </DialogHeader>
                              <p className="text-sm text-muted-foreground">
                                Are you sure you want to delete this report?
                                This action cannot be undone.
                              </p>
                              <DialogFooter className="mt-4">
                                <Button
                                  variant="outline"
                                  onClick={() => setConfirmId(null)}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  variant="destructive"
                                  onClick={async () => {
                                    if (!confirmId) return;
                                    // optimistic remove
                                    const prev = reportData;
                                    setReportData((d) =>
                                      d
                                        ? {
                                            ...d,
                                            reports: d.reports.filter(
                                              (rw) => rw.id !== confirmId
                                            ),
                                          }
                                        : d
                                    );
                                    setConfirmId(null);
                                    try {
                                      await RetailerAPI.reports.delete(
                                        confirmId
                                      );
                                    } catch {
                                      // revert on failure
                                      setReportData(prev);
                                    }
                                  }}
                                >
                                  Delete
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </td>
                      </tr>
                    ))}
                    {(!reportData || reportData.reports.length === 0) && (
                      <tr className="border-t">
                        <td
                          colSpan={4}
                          className="py-4 text-center text-muted-foreground"
                        >
                          No reports yet. Generate one above.
                        </td>
                      </tr>
                    )}
                    {fetching && (
                      <tr className="border-t">
                        <td
                          colSpan={4}
                          className="py-3 text-center text-xs text-muted-foreground"
                        >
                          Updating…
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {reportData?.pagination && reportData.pagination.pages > 1 && (
                <div className="flex items-center justify-between mt-4 text-sm">
                  <div>
                    Page {reportData.pagination.page} of{" "}
                    {reportData.pagination.pages} • Total{" "}
                    {reportData.pagination.total}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1 || fetching}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Prev
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= reportData.pagination.pages || fetching}
                      onClick={() =>
                        setPage((p) =>
                          Math.min(reportData.pagination.pages, p + 1)
                        )
                      }
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profit & Loss Detail */}
        <TabsContent value="profit-loss" className="mt-4">
          <Card className="glass-card">
            <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <CardTitle className="text-brand-gradient">
                Profit & Loss Report
              </CardTitle>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Input
                  type="date"
                  value={plStart}
                  onChange={(e) => setPlStart(e.target.value)}
                />
                <Input
                  type="date"
                  value={plEnd}
                  onChange={(e) => setPlEnd(e.target.value)}
                />
                <Button
                  size="sm"
                  disabled={!plStart || !plEnd || plLoading}
                  onClick={async () => {
                    try {
                      setPlLoading(true);
                      const data = await RetailerAPI.reports.profitLoss({
                        startDate: plStart,
                        endDate: plEnd,
                        format: "json",
                      });
                      setProfitLoss(data);
                      await refetch(true);
                    } finally {
                      setPlLoading(false);
                    }
                  }}
                >
                  {plLoading ? "Loading…" : "Generate"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {profitLoss && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 rounded-md bg-muted/40">
                    <p className="text-xs text-muted-foreground">Revenue</p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(profitLoss.summary.totalRevenue)}
                    </p>
                  </div>
                  <div className="p-3 rounded-md bg-muted/40">
                    <p className="text-xs text-muted-foreground">Costs</p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(profitLoss.summary.totalCosts)}
                    </p>
                  </div>
                  <div className="p-3 rounded-md bg-muted/40">
                    <p className="text-xs text-muted-foreground">
                      Gross Profit
                    </p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(profitLoss.summary.grossProfit)}
                    </p>
                  </div>
                  <div className="p-3 rounded-md bg-muted/40">
                    <p className="text-xs text-muted-foreground">Net Profit</p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(profitLoss.summary.netProfit)}
                    </p>
                  </div>
                </div>
              )}
              <div>
                <h4 className="text-sm font-medium mb-2">Details</h4>
                {profitLoss?.details?.length ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-muted-foreground">
                          <th className="py-2 pr-4">Category</th>
                          <th className="py-2 pr-4">Description</th>
                          <th className="py-2 pr-4">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(profitLoss?.details || []).map((d, idx) => (
                          <tr key={idx} className="border-t">
                            <td className="py-2 pr-4">
                              {String(
                                (d as Record<string, unknown>)?.category ||
                                  (d as Record<string, unknown>)?.type ||
                                  "-"
                              )}
                            </td>
                            <td className="py-2 pr-4">
                              {String(
                                (d as Record<string, unknown>)?.description ||
                                  (d as Record<string, unknown>)?.note ||
                                  "-"
                              )}
                            </td>
                            <td className="py-2 pr-4">
                              {formatCurrency(
                                ((d as Record<string, unknown>)
                                  ?.amount as number) ||
                                  ((d as Record<string, unknown>)
                                    ?.value as number) ||
                                  0
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {profitLoss ? "No detail rows." : "Generate a report."}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tax Report Detail */}
        <TabsContent value="tax" className="mt-4">
          <Card className="glass-card">
            <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <CardTitle className="text-brand-gradient">Tax Report</CardTitle>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Input
                  type="date"
                  value={taxStart}
                  onChange={(e) => setTaxStart(e.target.value)}
                />
                <Input
                  type="date"
                  value={taxEnd}
                  onChange={(e) => setTaxEnd(e.target.value)}
                />
                <Button
                  size="sm"
                  disabled={!taxStart || !taxEnd || taxLoading}
                  onClick={async () => {
                    try {
                      setTaxLoading(true);
                      const data = await RetailerAPI.reports.taxReport({
                        startDate: taxStart,
                        endDate: taxEnd,
                        format: "json",
                      });
                      setTaxReport(data);
                      await refetch(true);
                    } finally {
                      setTaxLoading(false);
                    }
                  }}
                >
                  {taxLoading ? "Loading…" : "Generate"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {taxReport && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 rounded-md bg-muted/40">
                    <p className="text-xs text-muted-foreground">
                      Taxable Amount
                    </p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(taxReport.taxSummary.totalTaxableAmount)}
                    </p>
                  </div>
                  <div className="p-3 rounded-md bg-muted/40">
                    <p className="text-xs text-muted-foreground">Tax Amount</p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(taxReport.taxSummary.totalTaxAmount)}
                    </p>
                  </div>
                </div>
              )}
              <div>
                <h4 className="text-sm font-medium mb-2">GST Breakdown</h4>
                {taxReport?.taxSummary.gstBreakdown?.length ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-muted-foreground">
                          <th className="py-2 pr-4">Rate</th>
                          <th className="py-2 pr-4">Base</th>
                          <th className="py-2 pr-4">Tax</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(taxReport?.taxSummary?.gstBreakdown || []).map(
                          (g, idx) => (
                            <tr key={idx} className="border-t">
                              <td className="py-2 pr-4">
                                {String(
                                  (g as Record<string, unknown>)?.rate ||
                                    (g as Record<string, unknown>)?.percent ||
                                    "-"
                                )}
                                %
                              </td>
                              <td className="py-2 pr-4">
                                {formatCurrency(
                                  ((g as Record<string, unknown>)
                                    ?.base as number) ||
                                    ((g as Record<string, unknown>)
                                      ?.amount as number) ||
                                    0
                                )}
                              </td>
                              <td className="py-2 pr-4">
                                {formatCurrency(
                                  ((g as Record<string, unknown>)
                                    ?.tax as number) ||
                                    ((g as Record<string, unknown>)
                                      ?.value as number) ||
                                    0
                                )}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {taxReport ? "No GST lines." : "Generate a report."}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stock Valuation Detail */}
        <TabsContent value="valuation" className="mt-4">
          <Card className="glass-card">
            <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <CardTitle className="text-brand-gradient">
                Stock Valuation
              </CardTitle>
              <Button
                size="sm"
                disabled={valLoading}
                onClick={async () => {
                  try {
                    setValLoading(true);
                    const data = await RetailerAPI.reports.stockValuation();
                    setValuation(data);
                    await refetch(true);
                  } finally {
                    setValLoading(false);
                  }
                }}
              >
                {valLoading ? "Loading…" : valuation ? "Refresh" : "Generate"}
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {valLoading && !valuation && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-md bg-muted/40 space-y-2"
                    >
                      <div className="h-3 w-20 bg-muted animate-pulse rounded" />
                      <div className="h-5 w-16 bg-muted animate-pulse rounded" />
                    </div>
                  ))}
                </div>
              )}
              {valuation && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="p-3 rounded-md bg-muted/40">
                    <p className="text-xs text-muted-foreground">Products</p>
                    <p className="text-lg font-semibold">
                      {formatNumber(valuation.summary.totalProducts)}
                    </p>
                  </div>
                  <div className="p-3 rounded-md bg-muted/40">
                    <p className="text-xs text-muted-foreground">Stock Value</p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(valuation.summary.totalStockValue)}
                    </p>
                  </div>
                  <div className="p-3 rounded-md bg-muted/40">
                    <p className="text-xs text-muted-foreground">
                      Potential Revenue
                    </p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(valuation.summary.totalPotentialRevenue)}
                    </p>
                  </div>
                  <div className="p-3 rounded-md bg-muted/40">
                    <p className="text-xs text-muted-foreground">
                      Expected Profit
                    </p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(valuation.summary.totalExpectedProfit)}
                    </p>
                  </div>
                  <div className="p-3 rounded-md bg-muted/40">
                    <p className="text-xs text-muted-foreground">Updated</p>
                    <p className="text-lg font-semibold">
                      {new Date().toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              )}
              <div>
                <h4 className="text-sm font-medium mb-2">Valuation Lines</h4>
                {valuation?.stockValuation?.length ? (
                  <div className="overflow-x-auto max-h-80 border rounded-md">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-muted-foreground sticky top-0 bg-background">
                          <th className="py-2 pr-4">Product</th>
                          <th className="py-2 pr-4">Stock</th>
                          <th className="py-2 pr-4">Unit Cost</th>
                          <th className="py-2 pr-4">Value</th>
                          <th className="py-2 pr-4">Selling Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(valuation?.stockValuation || []).map(
                          (v: Record<string, unknown> | null) => {
                            const product = (v as Record<string, unknown>)
                              ?.product as Record<string, unknown> | null;
                            const inventory = (v as Record<string, unknown>)
                              ?.inventory as Record<string, unknown> | null;
                            const valData = (v as Record<string, unknown>)
                              ?.valuation as Record<string, unknown> | null;
                            return (
                              <tr
                                key={(product?.id as string) || Math.random()}
                                className="border-t"
                              >
                                <td className="py-2 pr-4">
                                  {(product?.name as string) || "-"}
                                </td>
                                <td className="py-2 pr-4">
                                  {(inventory?.totalStock as number) || 0}
                                </td>
                                <td className="py-2 pr-4">
                                  {formatCurrency(
                                    (valData?.unitCost as number) || 0
                                  )}
                                </td>
                                <td className="py-2 pr-4">
                                  {formatCurrency(
                                    (valData?.totalValue as number) || 0
                                  )}
                                </td>
                                <td className="py-2 pr-4">
                                  {formatCurrency(
                                    (valData?.sellingPrice as number) || 0
                                  )}
                                </td>
                              </tr>
                            );
                          }
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {valuation
                      ? "No valuation lines."
                      : "Generate a valuation."}
                  </p>
                )}
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">Company Breakdown</h4>
                {valuation?.companyBreakdown?.length ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-muted-foreground">
                          <th className="py-2 pr-4">Company</th>
                          <th className="py-2 pr-4">Products</th>
                          <th className="py-2 pr-4">Stock</th>
                          <th className="py-2 pr-4">Value</th>
                          <th className="py-2 pr-4">Avg Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(valuation?.companyBreakdown || []).map(
                          (c: Record<string, unknown> | null, idx: number) => (
                            <tr key={idx} className="border-t">
                              <td className="py-2 pr-4">
                                {((c as Record<string, unknown>)
                                  ?.company as string) || "-"}
                              </td>
                              <td className="py-2 pr-4">
                                {((c as Record<string, unknown>)
                                  ?.productCount as number) || 0}
                              </td>
                              <td className="py-2 pr-4">
                                {((c as Record<string, unknown>)
                                  ?.totalStock as number) || 0}
                              </td>
                              <td className="py-2 pr-4">
                                {formatCurrency(
                                  (c as Record<string, unknown>)
                                    ?.totalValue as number
                                )}
                              </td>
                              <td className="py-2 pr-4">
                                {formatCurrency(
                                  (c as Record<string, unknown>)
                                    ?.averageValue as number
                                )}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {valuation
                      ? "No company breakdown."
                      : "Generate a valuation."}
                  </p>
                )}
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">Type Breakdown</h4>
                {valuation?.typeBreakdown?.length ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-muted-foreground">
                          <th className="py-2 pr-4">Type</th>
                          <th className="py-2 pr-4">Products</th>
                          <th className="py-2 pr-4">Stock</th>
                          <th className="py-2 pr-4">Value</th>
                          <th className="py-2 pr-4">Potential Rev</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(valuation?.typeBreakdown || []).map(
                          (t: Record<string, unknown> | null, idx: number) => (
                            <tr key={idx} className="border-t">
                              <td className="py-2 pr-4">
                                {((t as Record<string, unknown>)
                                  ?.eyewearType as string) || "-"}
                              </td>
                              <td className="py-2 pr-4">
                                {((t as Record<string, unknown>)
                                  ?.productCount as number) || 0}
                              </td>
                              <td className="py-2 pr-4">
                                {((t as Record<string, unknown>)
                                  ?.totalStock as number) || 0}
                              </td>
                              <td className="py-2 pr-4">
                                {formatCurrency(
                                  (t as Record<string, unknown>)
                                    ?.totalValue as number
                                )}
                              </td>
                              <td className="py-2 pr-4">
                                {formatCurrency(
                                  (t as Record<string, unknown>)
                                    ?.totalPotentialRevenue as number
                                )}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {valuation ? "No type breakdown." : "Generate a valuation."}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
