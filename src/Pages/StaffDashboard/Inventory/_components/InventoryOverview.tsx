import React, { useEffect, useMemo, useState } from 'react';
import { StaffAPI } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { RefreshCcw, PackageOpen, TriangleAlert } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';

interface InventoryItem {
	productId?: number; id?: number; name?: string; currentStock?: number; basePrice?: number; barcode?: string; company?: { name?: string };
	eyewearType?: string; lowStockThreshold?: number;
}

const deriveKeyMetrics = (items: InventoryItem[]) => {
	const totalSkus = items.length;
	const totalUnits = items.reduce((sum, i) => sum + (i.currentStock || 0), 0);
	const lowStock = items.filter(i => (i.currentStock ?? 0) > 0 && (i.currentStock ?? 0) <= 5).length;
	const outOfStock = items.filter(i => (i.currentStock ?? 0) === 0).length;
	const inventoryValue = items.reduce((sum, i) => sum + ((i.basePrice || 0) * (i.currentStock || 0)), 0);
	return { totalSkus, totalUnits, lowStock, outOfStock, inventoryValue };
};

const statusBadge = (qty?: number) => {
	if (qty == null) return 'bg-gray-200 text-gray-700';
	if (qty <= 0) return 'bg-red-600 text-white';
	if (qty <= 5) return 'bg-orange-500 text-white';
	return 'bg-green-600 text-white';
};

const InventoryOverview: React.FC = () => {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [items, setItems] = useState<InventoryItem[]>([]);
	const [search, setSearch] = useState('');
	const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all');
	const [view, setView] = useState<'grid' | 'table'>('grid');
	const [refreshTick, setRefreshTick] = useState(0);

	useEffect(() => {
		const fetchData = async () => {
			try {
				setLoading(true);
				const data = await StaffAPI.inventory.getAll();
				const list: any[] = Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []);
				setItems(list);
				setError(null);
			} catch (e: any) {
				setError(e?.message || 'Failed to load inventory');
			} finally { setLoading(false); }
		};
		fetchData();
	}, [refreshTick]);

	const metrics = useMemo(() => deriveKeyMetrics(items), [items]);

	const filtered = useMemo(() => {
		let list = items;
		if (search) {
			const s = search.toLowerCase();
			list = list.filter(i => (i.name || '').toLowerCase().includes(s) || (i.barcode || '').includes(s));
		}
		if (filter === 'low') list = list.filter(i => (i.currentStock ?? 0) > 0 && (i.currentStock ?? 0) <= 5);
		if (filter === 'out') list = list.filter(i => (i.currentStock ?? 0) === 0);
		return list;
	}, [items, search, filter]);

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-center gap-3">
				<h1 className="text-2xl font-semibold">Inventory Overview</h1>
				<Button variant="outline" size="sm" onClick={() => setRefreshTick(t => t+1)}><RefreshCcw className="h-4 w-4 mr-1" />Refresh</Button>
				<div className="text-xs text-muted-foreground">Items: {metrics.totalSkus} • Units: {metrics.totalUnits} • Value: {formatCurrency(metrics.inventoryValue)}</div>
			</div>

			{error && <Alert variant="destructive">{error}</Alert>}

			<div className="grid grid-cols-2 md:grid-cols-5 gap-4">
				<Card className="p-3 flex flex-col gap-1"><span className="text-xs text-muted-foreground">Total SKUs</span><span className="text-lg font-medium">{metrics.totalSkus}</span></Card>
				<Card className="p-3 flex flex-col gap-1"><span className="text-xs text-muted-foreground">Units in Stock</span><span className="text-lg font-medium">{metrics.totalUnits}</span></Card>
				<Card className="p-3 flex flex-col gap-1 bg-orange-50 dark:bg-orange-950/30"><span className="text-xs text-orange-600">Low Stock</span><span className="text-lg font-medium">{metrics.lowStock}</span></Card>
				<Card className="p-3 flex flex-col gap-1 bg-red-50 dark:bg-red-950/30"><span className="text-xs text-red-600">Out of Stock</span><span className="text-lg font-medium">{metrics.outOfStock}</span></Card>
				<Card className="p-3 flex flex-col gap-1"><span className="text-xs text-muted-foreground">Inventory Value</span><span className="text-lg font-medium">{formatCurrency(metrics.inventoryValue, { maximumFractionDigits: 0, minimumFractionDigits: 0 })}</span></Card>
			</div>

			<Card className="p-4 space-y-4">
				<div className="flex flex-wrap gap-2 items-center">
					<Input placeholder="Search name or barcode" value={search} onChange={(e) => setSearch(e.target.value)} className="w-60" />
					<select value={filter} onChange={(e) => setFilter(e.target.value as any)} className="h-10 border rounded px-2 text-sm bg-background">
						<option value="all">All</option>
						<option value="low">Low Stock</option>
						<option value="out">Out of Stock</option>
					</select>
					<select value={view} onChange={(e) => setView(e.target.value as any)} className="h-10 border rounded px-2 text-sm bg-background">
						<option value="grid">Grid</option>
						<option value="table">Table</option>
					</select>
					<div className="ml-auto flex gap-2">
						<Button variant="outline" size="sm" onClick={() => setFilter('low')}>Low</Button>
						<Button variant="outline" size="sm" onClick={() => setFilter('out')}>Out</Button>
						<Button variant="outline" size="sm" onClick={() => setFilter('all')}>Reset</Button>
					</div>
				</div>
				<Separator />
				{loading && (
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
						{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
					</div>
				)}
				{!loading && filtered.length === 0 && <div className="text-sm text-muted-foreground">No items match criteria.</div>}
				{!loading && filtered.length > 0 && view === 'grid' && (
					<div className="grid gap-4 grid-cols-2 md:grid-cols-4 xl:grid-cols-6">
						{filtered.slice(0, 120).map(i => (
							<Card key={i.id || i.productId} className="p-3 space-y-2 hover:shadow transition">
								<div className="flex items-center justify-between gap-2">
									<div className="text-xs font-medium line-clamp-2 leading-tight">{i.name}</div>
									<span className={`text-[10px] px-1.5 py-0.5 rounded ${statusBadge(i.currentStock)}`}>{i.currentStock ?? '—'}</span>
								</div>
								<div className="text-[10px] text-muted-foreground flex flex-col gap-0.5">
									{i.barcode && <span>BC: {i.barcode}</span>}
									{i.company?.name && <span>⛭ {i.company.name}</span>}
									{i.basePrice != null && <span>{formatCurrency(i.basePrice)}</span>}
								</div>
								<div className="flex gap-1 flex-wrap pt-1">
									<Button size="sm" variant="outline" onClick={() => window.location.href = `/staff-dashboard/inventory/products/${i.id || i.productId}`}>View</Button>
									<Button size="sm" variant="outline" onClick={() => window.location.href = `/staff-dashboard/inventory/stock-in?productId=${i.id || i.productId}`}>In</Button>
									<Button size="sm" variant="outline" onClick={() => window.location.href = `/staff-dashboard/inventory/stock-out?productId=${i.id || i.productId}`}>Out</Button>
								</div>
							</Card>
						))}
					</div>
				)}
				{!loading && filtered.length > 0 && view === 'table' && (
					<div className="overflow-x-auto">
						<table className="w-full text-xs">
							<thead className="bg-muted/50">
								<tr className="text-left">
									<th className="py-2 px-2">Name</th>
									<th className="py-2 px-2">Stock</th>
									<th className="py-2 px-2">Price</th>
									<th className="py-2 px-2">Barcode</th>
									<th className="py-2 px-2">Actions</th>
								</tr>
							</thead>
							<tbody>
								{filtered.slice(0, 300).map(i => (
									<tr key={i.id || i.productId} className="border-t">
										<td className="py-1 px-2 text-[11px] max-w-[220px] truncate">{i.name}</td>
										<td className="py-1 px-2"><span className={`text-[10px] px-1.5 py-0.5 rounded ${statusBadge(i.currentStock)}`}>{i.currentStock ?? '—'}</span></td>
										<td className="py-1 px-2">{i.basePrice != null ? formatCurrency(i.basePrice) : '—'}</td>
										<td className="py-1 px-2 font-mono text-[10px]">{i.barcode || '—'}</td>
										<td className="py-1 px-2 flex gap-1 flex-wrap">
											<Button size="sm" variant="outline" onClick={() => window.location.href = `/staff-dashboard/inventory/products/${i.id || i.productId}`}>View</Button>
											<Button size="sm" variant="outline" onClick={() => window.location.href = `/staff-dashboard/inventory/stock-in?productId=${i.id || i.productId}`}>In</Button>
											<Button size="sm" variant="outline" onClick={() => window.location.href = `/staff-dashboard/inventory/stock-out?productId=${i.id || i.productId}`}>Out</Button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</Card>

			<Tabs defaultValue="alerts" className="w-full">
				<TabsList>
					<TabsTrigger value="alerts">Alerts</TabsTrigger>
					<TabsTrigger value="low">Low Stock</TabsTrigger>
					<TabsTrigger value="out">Out of Stock</TabsTrigger>
				</TabsList>
				<TabsContent value="alerts">
					<Card className="p-4 text-sm space-y-2">
						<div className="flex items-center gap-2 text-orange-600"><TriangleAlert className="h-4 w-4" /> {metrics.lowStock} low-stock items require attention.</div>
						<div className="flex items-center gap-2 text-red-600"><PackageOpen className="h-4 w-4" /> {metrics.outOfStock} items are out of stock.</div>
					</Card>
				</TabsContent>
				<TabsContent value="low">
					<Card className="p-3 space-y-1 text-xs">
						{items.filter(i => (i.currentStock ?? 0) > 0 && (i.currentStock ?? 0) <= 5).slice(0,40).map(i => (
							<div key={i.id || i.productId} className="flex justify-between gap-2">
								<span className="truncate max-w-[220px]">{i.name}</span>
								<span className="px-1.5 py-0.5 rounded bg-orange-500 text-white text-[10px]">{i.currentStock}</span>
							</div>
						))}
						{items.filter(i => (i.currentStock ?? 0) > 0 && (i.currentStock ?? 0) <= 5).length === 0 && <div className="text-muted-foreground">None 🎉</div>}
					</Card>
				</TabsContent>
				<TabsContent value="out">
					<Card className="p-3 space-y-1 text-xs">
						{items.filter(i => (i.currentStock ?? 0) === 0).slice(0,40).map(i => (
							<div key={i.id || i.productId} className="flex justify-between gap-2">
								<span className="truncate max-w-[220px]">{i.name}</span>
								<span className="px-1.5 py-0.5 rounded bg-red-600 text-white text-[10px]">0</span>
							</div>
						))}
						{items.filter(i => (i.currentStock ?? 0) === 0).length === 0 && <div className="text-muted-foreground">No outages 🎉</div>}
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
};

export default InventoryOverview;
