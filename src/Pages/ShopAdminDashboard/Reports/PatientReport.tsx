import { useEffect, useState } from "react";
import axios from "axios";
import Pagination from "../Pagination/Pagination";
import { Card } from "@/components/ui/card";

export default function PatientReport() {
  const [report, setReport] = useState<any>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    axios.get("https://staff-optical-production.up.railway.app/shop-admin/reports/patients?type=active&startDate=2025-09-01&endDate=2025-09-30", {
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("jwt")}`,
        "Content-Type": "application/json"
      }
    }).then(res => setReport(res.data));
  }, []);

  if (!report) return <div>Loading...</div>;

  const paginated = report.patients.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(report.patients.length / pageSize);

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="mb-4">
        <h2 className="font-bold mb-2">Patient Summary</h2>
        <div>Total Patients: {report.summary.totalPatients}</div>
        <div>New Patients: {report.summary.newPatients}</div>
        <div>Total Visits: {report.summary.totalVisits}</div>
        <div>Avg Spend/Patient: ₹{report.summary.avgSpendPerPatient}</div>
      </Card>
      <Card>
        <h2 className="font-bold mb-2">Patients</h2>
        <table className="w-full text-left">
          <thead>
            <tr>
              <th>Name</th>
              <th>Age</th>
              <th>Gender</th>
              <th>Phone</th>
              <th>Registration Date</th>
              <th>Total Spent</th>
              <th>Total Orders</th>
              <th>Total Prescriptions</th>
              <th>Last Visit</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((patient: any) => (
              <tr key={patient.id} className="border-b">
                <td>{patient.name}</td>
                <td>{patient.age}</td>
                <td>{patient.gender}</td>
                <td>{patient.phone}</td>
                <td>{new Date(patient.registrationDate).toLocaleDateString()}</td>
                <td>₹{patient.totalSpent}</td>
                <td>{patient.totalOrders}</td>
                <td>{patient.totalPrescriptions}</td>
                <td>{new Date(patient.lastVisit).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </Card>
    </div>
  );
}
