import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router";

const navItems = [
  { label: "Overview", to: "/shop-admin-dashboard" },
  { label: "Growth", to: "/shop-admin-dashboard/growth" },
  { label: "Activities", to: "/shop-admin-dashboard/activities" },
  { label: "Sales Report", to: "/shop-admin-dashboard/reports/sales" },
  { label: "Product Sales", to: "/shop-admin-dashboard/reports/products" },
  { label: "Inventory", to: "/shop-admin-dashboard/reports/inventory" },
  { label: "Low Stock Alerts", to: "/shop-admin-dashboard/reports/low-stock" },
  { label: "Patients", to: "/shop-admin-dashboard/reports/patients" },
  { label: "Patient Visits", to: "/shop-admin-dashboard/reports/patients/visits" },
  { label: "Staff List", to: "/shop-admin-dashboard/staff" },
];

export default function Sidebar() {
  const location = useLocation();
  return (
    <aside className="w-64 bg-white shadow-lg flex flex-col py-6 px-4 min-h-screen">
      {navItems.map(item => (
        <Button
          key={item.to}
          variant={location.pathname === item.to ? "default" : "outline"}
          className="mb-2 w-full"
          asChild
        >
          <Link to={item.to}>{item.label}</Link>
        </Button>
      ))}
    </aside>
  );
}
