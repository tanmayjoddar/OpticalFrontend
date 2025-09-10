
import { useEffect, useState } from "react";
import axios from "axios";
import Pagination from "./Pagination/Pagination";

type Activity = {
  type: string;
  message: string;
  amount?: number;
  timestamp: string;
};

export default function RecentActivities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    axios.get("https://staff-optical-production.up.railway.app/shop-admin/dashboard/activities", {
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("jwt")}`,
        "Content-Type": "application/json"
      }
    }).then(res => setActivities(res.data));
  }, []);

  const paginated = activities.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(activities.length / pageSize);

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="font-bold mb-4">Recent Activities</h2>
      <ul className="bg-white rounded shadow p-4">
        {paginated.map((activity, idx) => (
          <li key={idx} className="mb-2">
            <span className="font-semibold">[{activity.type}]</span> {activity.message}
            {activity.amount && <span> - ₹{activity.amount}</span>}
            <span className="text-xs text-gray-500 ml-2">{new Date(activity.timestamp).toLocaleString()}</span>
          </li>
        ))}
      </ul>
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
