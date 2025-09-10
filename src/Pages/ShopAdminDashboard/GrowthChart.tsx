
import { useEffect, useState } from "react";
import axios from "axios";

type GrowthData = {
  period: string;
  sales: number;
  orders: number;
  patients: number;
};

export default function GrowthChart() {
  const [data, setData] = useState<GrowthData[]>([]);
  const [period, setPeriod] = useState("monthly");

  useEffect(() => {
    axios.get(`https://staff-optical-production.up.railway.app/shop-admin/dashboard/growth?period=${period}`,
      {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("jwt")}`,
          "Content-Type": "application/json"
        }
      }
    ).then(res => {setData(res.data); console.log(res.data);});
  }, [period]);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex gap-2 mb-4">
        <button className={period === "daily" ? "font-bold" : ""} onClick={() => setPeriod("daily")}>Daily</button>
        <button className={period === "monthly" ? "font-bold" : ""} onClick={() => setPeriod("monthly")}>Monthly</button>
      </div>
      {/* Replace below with a chart component */}
      <div className="bg-white rounded shadow p-4">
        <h2 className="font-bold mb-2">Growth Data ({period})</h2>
        <ul>
          {data.map((item, idx) => (
            <li key={idx} className="mb-2">
              <strong>{item.period}:</strong> Sales ₹{item.sales}, Orders {item.orders}, Patients {item.patients}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
