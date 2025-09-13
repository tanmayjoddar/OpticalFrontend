import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ProductCreate = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Add New Product</h1>
        <p className="text-gray-600">Add a new product to inventory</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product Information</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Product creation form coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductCreate;