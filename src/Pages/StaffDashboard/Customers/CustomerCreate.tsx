import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const CustomerCreate = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Add New Customer</h1>
        <p className="text-gray-600">Create a new customer account</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer Information</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Customer creation form coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerCreate;