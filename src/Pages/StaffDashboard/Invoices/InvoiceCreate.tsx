import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const InvoiceCreate = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create Invoice</h1>
        <p className="text-gray-600">Generate new invoice for customer</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoice Details</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Invoice creation wizard coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoiceCreate;