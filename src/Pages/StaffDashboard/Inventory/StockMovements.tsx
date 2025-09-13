import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const StockMovements = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Stock Movements</h1>
        <p className="text-gray-600">Track inventory changes and stock operations</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stock Operations</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Stock movements implementation coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default StockMovements;