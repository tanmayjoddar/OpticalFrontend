import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const CustomerDetails = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Customer Details</h1>
        <p className="text-gray-600">View and edit customer information</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Customer details view coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerDetails;