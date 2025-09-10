import { Routes, Route, Navigate } from "react-router";
import Sidebar from "./Sidebar";
import Header from "./Header";
import DashboardOverview from "./DashboardOverview";
import GrowthChart from "./GrowthChart";
import RecentActivities from "./RecentActivities";
import SalesReport from "./Reports/SalesReport";
import ProductSalesReport from "./Reports/ProductSalesReport";
import InventoryReport from "./Reports/InventoryReport";
import LowStockAlerts from "./Reports/LowStockAlerts";
import PatientReport from "./Reports/PatientReport";
import PatientVisitHistory from "./Reports/PatientVisitHistory";
import StaffList from "./Staff/StaffList";
import StaffDetails from "./Staff/StaffDetails";
import StaffActivities from "./Staff/StaffActivities";

export default function ShopAdminDashboard() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-4 bg-gray-50">
          <Routes>
            <Route path="" element={<DashboardOverview />} />
            <Route path="growth" element={<GrowthChart />} />
            <Route path="activities" element={<RecentActivities />} />
            <Route path="reports/sales" element={<SalesReport />} />
            <Route path="reports/products" element={<ProductSalesReport />} />
            <Route path="reports/inventory" element={<InventoryReport />} />
            <Route path="reports/low-stock" element={<LowStockAlerts />} />
            <Route path="reports/patients" element={<PatientReport />} />
            <Route path="reports/patients/visits" element={<PatientVisitHistory />} />
            <Route path="staff" element={<StaffList />} />
            <Route path="staff/:staffId" element={<StaffDetails />} />
            <Route path="staff/:staffId/activities" element={<StaffActivities />} />
            <Route path="*" element={<Navigate to="." />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
