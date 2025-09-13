import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PatientCreate = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Add New Patient</h1>
        <p className="text-gray-600">Create a new patient record</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Patient Information</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Patient creation form coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PatientCreate;