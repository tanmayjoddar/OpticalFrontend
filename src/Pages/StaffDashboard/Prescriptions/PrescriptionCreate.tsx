import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PrescriptionCreate = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create Prescription</h1>
        <p className="text-gray-600">Create new prescription for patient</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Prescription Details</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Prescription creation form coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PrescriptionCreate;