import { Link, useLocation } from "react-router";
import { Button } from "@/components/ui/button";
import { Users, ClipboardList, Calendar, BarChart3, LayoutDashboard } from "lucide-react";

const nav = [
  { label: "Overview", to: "/staff-dashboard", icon: LayoutDashboard },
  { label: "Patients", to: "/staff-dashboard/patients", icon: Users },
  { label: "Appointments", to: "/staff-dashboard/appointments", icon: Calendar },
  { label: "Tasks", to: "/staff-dashboard/tasks", icon: ClipboardList },
  { label: "Reports", to: "/staff-dashboard/reports", icon: BarChart3 },
];

export default function StaffSidebar() {
  const location = useLocation();
  return (
    <aside className="hidden md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-40 bg-sidebar border-r border-sidebar-border p-4">
      <div className="mb-4 flex items-center gap-2">
        <div className="h-8 w-8 rounded-xl clay flex items-center justify-center">
          <Users className="h-4 w-4 text-primary" />
        </div>
        <h2 className="text-lg font-bold text-brand-gradient">Staff Portal</h2>
      </div>
      <nav className="space-y-2">
        {nav.map((n) => {
          const active = location.pathname === n.to || location.pathname.startsWith(n.to + "/");
          const Icon = n.icon;
          return (
            <Button
              key={n.to}
              variant="ghost"
              className={`w-full justify-start gap-3 rounded-xl clay ${active ? "ring-1 ring-primary/25" : "hover:ring-1 hover:ring-primary/15"}`}
              asChild
            >
              <Link to={n.to} className="relative flex items-center gap-3 w-full">
                <span className={`absolute left-0 h-8 w-1 rounded-r bg-primary ${active ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`} />
                <Icon className="h-4 w-4" />
                <span className="text-sm font-medium">{n.label}</span>
              </Link>
            </Button>
          );
        })}
      </nav>
    </aside>
  );
}
