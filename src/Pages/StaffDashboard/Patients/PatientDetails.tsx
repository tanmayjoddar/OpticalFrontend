import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PatientDetails = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Patient Details</h1>
        <p className="text-gray-600">View and edit patient information</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Patient Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Patient details view coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PatientDetails;