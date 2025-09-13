import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Link } from "react-router";

const PrescriptionsList = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prescriptions</h1>
          <p className="text-gray-600">Manage patient prescriptions and medical records</p>
        </div>
        <Link to="/staff-dashboard/prescriptions/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Prescription
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Prescription List</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Prescription list implementation coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PrescriptionsList;