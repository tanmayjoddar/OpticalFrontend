import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { StaffAPI } from '@/lib/api';
import { Alert } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import BarcodeScanner from 'react-qr-barcode-scanner';

interface ProductData {
  id: number;
  name: string;
  description?: string;
  barcode?: string;
  sku?: string;
  basePrice?: number;
  currentStock?: number;
  eyewearType?: string;
  material?: string;
  color?: string;
  size?: string;
  model?: string;
  imageUrl?: string;
  company?: { id: number; name: string };
}

interface LookupHistoryItem {
  barcode: string;
  product?: ProductData | null;
  ts: number;
  error?: string;
}

const DEBOUNCE_MS = 400;

export const ProductBarcodeLookup: React.FC = () => {
  const [barcode, setBarcode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<ProductData | null>(null);
  const [history, setHistory] = useState<LookupHistoryItem[]>([]);
  const [batch, setBatch] = useState<string[]>([]); // future batch list
  const [isScannerActive, setIsScannerActive] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  const performLookup = useCallback(async (code: string) => {
    if (!code) return;
    setLoading(true);
    setError(null);
    try {
      const data = await StaffAPI.inventory.getProductByBarcode(code.trim());
      setProduct(data || null);
      setHistory(h => [{ barcode: code, product: data, ts: Date.now() }, ...h.slice(0,49)]);
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Product not found or error occurred';
      setError(msg);
      setProduct(null);
      setHistory(h => [{ barcode: code, product: null, error: msg, ts: Date.now() }, ...h.slice(0,49)]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced lookup on barcode change
  useEffect(() => {
    if (!barcode) { setProduct(null); setError(null); return; }
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => performLookup(barcode), DEBOUNCE_MS);
    return () => { if (timerRef.current) window.clearTimeout(timerRef.current); };
  }, [barcode, performLookup]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (timerRef.current) window.clearTimeout(timerRef.current);
    performLookup(barcode);
  };

  const addToBatch = () => {
    if (!barcode) return;
    setBatch(b => b.includes(barcode) ? b : [barcode, ...b]);
  };

  const handleBarcodeDetected = (err: any, result?: any) => {
    if (result) {
      const detectedCode = result.getText();
      setBarcode(detectedCode);
      setScannerError(null);
      // Automatically switch to result tab
      const resultTab = document.querySelector('[value="result"]') as HTMLElement;
      if (resultTab) resultTab.click();
    }
    if (err && err.name !== 'NotFoundException') {
      setScannerError(err.message || 'Scanner error occurred');
    }
  };

  const toggleScanner = () => {
    setIsScannerActive(prev => !prev);
    setScannerError(null);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Product Lookup by Barcode</h1>
        <div className="space-x-2">
          <Button variant="secondary" onClick={addToBatch} disabled={!barcode}>Add to Batch</Button>
          <Button variant="outline" onClick={() => { setBarcode(''); setProduct(null); setError(null); }}>Clear</Button>
        </div>
      </div>
      <Card className="p-4 space-y-4">
        <form onSubmit={handleManualSubmit} className="space-y-3">
          <div>
            <label className="text-sm font-medium">Barcode</label>
            <Input
              placeholder="Scan or enter barcode"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              autoFocus
            />
            <p className="text-xs text-muted-foreground mt-1">Debounced lookup ({DEBOUNCE_MS}ms). Press Enter to force immediate search.</p>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={!barcode || loading}>Lookup</Button>
            <Button type="button" variant="outline" onClick={addToBatch} disabled={!barcode}>Queue for Batch</Button>
          </div>
        </form>
      </Card>

      <Tabs defaultValue="result" className="w-full">
        <TabsList>
          <TabsTrigger value="result">Result</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="batch">Batch</TabsTrigger>
          <TabsTrigger value="scanner">Scanner</TabsTrigger>
        </TabsList>
        <TabsContent value="result">
          <Card className="p-4 min-h-[200px]">
            {loading && <div className="space-y-2"><Skeleton className="h-6 w-1/3" /><Skeleton className="h-4 w-1/2" /><Skeleton className="h-4 w-2/5" /></div>}
            {!loading && error && <Alert variant="destructive">{error}</Alert>}
            {!loading && !error && !product && barcode && <p className="text-sm text-muted-foreground">No product found for this barcode.</p>}
            {!loading && !error && !barcode && <p className="text-sm text-muted-foreground">Enter or scan a barcode to see product details.</p>}
            {!loading && product && (
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="w-40 h-40 bg-muted flex items-center justify-center text-xs text-muted-foreground rounded">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="object-contain max-w-full max-h-full" />
                    ) : 'Image'}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <h2 className="text-lg font-semibold">{product.name}</h2>
                      {product.sku && <span className="text-xs px-2 py-0.5 bg-muted rounded">SKU: {product.sku}</span>}
                      {product.barcode && <span className="text-xs px-2 py-0.5 bg-muted rounded">BARCODE: {product.barcode}</span>}
                    </div>
                    {product.description && <p className="text-sm text-muted-foreground max-w-prose">{product.description}</p>}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                      {product.eyewearType && <div><span className="font-medium">Type:</span> {product.eyewearType}</div>}
                      {product.material && <div><span className="font-medium">Material:</span> {product.material}</div>}
                      {product.color && <div><span className="font-medium">Color:</span> {product.color}</div>}
                      {product.size && <div><span className="font-medium">Size:</span> {product.size}</div>}
                      {product.model && <div><span className="font-medium">Model:</span> {product.model}</div>}
                      {product.company?.name && <div><span className="font-medium">Company:</span> {product.company.name}</div>}
                    </div>
                    <Separator />
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div><span className="font-medium">Base Price:</span> {product.basePrice != null ? `₹${product.basePrice.toFixed(2)}` : '—'}</div>
                      <div><span className="font-medium">Current Stock:</span> {product.currentStock != null ? product.currentStock : '—'}</div>
                      <div><span className="font-medium">Stock Status:</span> {product.currentStock != null ? (product.currentStock <= 0 ? 'Out of Stock' : product.currentStock < 5 ? 'Low' : 'In Stock') : '—'}</div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" variant="outline" onClick={() => {/* future navigate to edit */}}>Edit</Button>
                      <Button size="sm" variant="secondary" onClick={() => { /* navigate to quick stock update */ }}>Stock Update</Button>
                      <Button size="sm" onClick={() => { /* navigate to product details page when implemented */ }}>View Details</Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>
        <TabsContent value="history">
          <Card className="p-4">
            <ScrollArea className="h-64">
              <ul className="space-y-2 text-sm">
                {history.length === 0 && <li className="text-muted-foreground">No lookups yet.</li>}
                {history.map(item => (
                  <li key={item.ts} className="flex items-start justify-between gap-4 border-b pb-2 last:border-b-0">
                    <div>
                      <div className="font-medium">{item.barcode}</div>
                      <div className="text-xs text-muted-foreground">{new Date(item.ts).toLocaleTimeString()}</div>
                      {item.error && <div className="text-xs text-red-500">{item.error}</div>}
                      {item.product && <div className="text-xs text-green-600">{item.product.name}</div>}
                    </div>
                    <Button size="sm" variant="outline" onClick={() => setBarcode(item.barcode)}>Recall</Button>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </Card>
        </TabsContent>
        <TabsContent value="batch">
          <Card className="p-4 space-y-3">
            <p className="text-sm text-muted-foreground">Batch scanning queue placeholder. Future feature: process multiple barcodes sequentially for reconciliation or bulk verification.</p>
            {batch.length === 0 && <p className="text-xs text-muted-foreground">No barcodes queued.</p>}
            {batch.length > 0 && (
              <ul className="text-sm list-disc pl-5 space-y-1">
                {batch.map(code => <li key={code}>{code}</li>)}
              </ul>
            )}
            {batch.length > 0 && <div className="flex gap-2"><Button size="sm" onClick={() => {/* future batch process */}}>Process (Future)</Button><Button size="sm" variant="outline" onClick={() => setBatch([])}>Clear</Button></div>}
          </Card>
        </TabsContent>
        <TabsContent value="scanner">
          <Card className="p-4 space-y-3">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {isScannerActive 
                  ? 'Point your camera at a barcode. The scanner will automatically detect and populate the barcode field.' 
                  : 'Click "Start Scanner" to activate the camera and scan barcodes.'}
              </p>
              
              {scannerError && (
                <Alert variant="destructive">{scannerError}</Alert>
              )}
              
              {isScannerActive ? (
                <div className="w-full bg-black rounded overflow-hidden">
                  <BarcodeScanner
                    width="100%"
                    height={400}
                    onUpdate={handleBarcodeDetected}
                  />
                </div>
              ) : (
                <div className="aspect-video w-full bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
                  Camera Off - Click Start Scanner to activate
                </div>
              )}
              
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant={isScannerActive ? "destructive" : "default"}
                  onClick={toggleScanner}
                >
                  {isScannerActive ? 'Stop Scanner' : 'Start Scanner'}
                </Button>
                {isScannerActive && barcode && (
                  <Button size="sm" variant="outline" onClick={() => setIsScannerActive(false)}>
                    Use This Barcode
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProductBarcodeLookup;
