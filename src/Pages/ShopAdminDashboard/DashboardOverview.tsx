
import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";
import axios from "axios";

type Metrics = {
  today: {
    sales: number;
    orders: number;
    patients: number;
    staff: number;
  };
  monthly: {
    sales: number;
    orders: number;
    salesGrowth: number;
    orderGrowth: number;
  };
  inventory: {
    totalProducts: number;
    lowStockAlerts: number;
  };
};

export default function DashboardOverview() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);

  useEffect(() => {
    axios.get("https://staff-optical-production.up.railway.app/shop-admin/dashboard/metrics", {
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("jwt")}`,
        "Content-Type": "application/json"
      }
    }).then(res => {setMetrics(res.data); console.log(res.data);});
  }, []);

  if (!metrics) return <div>Loading...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <h2 className="font-bold mb-2">Today's Metrics</h2>
        <div>Sales: ₹{metrics.today.sales}</div>
        <div>Orders: {metrics.today.orders}</div>
        <div>Patients: {metrics.today.patients}</div>
        <div>Staff: {metrics.today.staff}</div>
      </Card>
      <Card>
        <h2 className="font-bold mb-2">Monthly Metrics</h2>
        <div>Sales: ₹{metrics.monthly.sales}</div>
        <div>Orders: {metrics.monthly.orders}</div>
        <div>Sales Growth: {metrics.monthly.salesGrowth}%</div>
        <div>Order Growth: {metrics.monthly.orderGrowth}%</div>
      </Card>
      <Card>
        <h2 className="font-bold mb-2">Inventory</h2>
        <div>Total Products: {metrics.inventory.totalProducts}</div>
        <div>Low Stock Alerts: {metrics.inventory.lowStockAlerts}</div>
      </Card>
    </div>
  );
}
