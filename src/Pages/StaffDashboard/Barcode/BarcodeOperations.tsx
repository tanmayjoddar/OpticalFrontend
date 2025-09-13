import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScanLine } from "lucide-react";

const BarcodeOperations = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Barcode Scanner</h1>
        <p className="text-gray-600">Scan barcodes for quick inventory operations</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ScanLine className="mr-2 h-5 w-5" />
            Barcode Scanner
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Barcode scanning implementation coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default BarcodeOperations;