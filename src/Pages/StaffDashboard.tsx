import Header from "../components/ui/header";
import StaffSidebar from "./StaffSidebar";

function StaffDashboard() {
  return (
    <div className="min-h-screen bg-app-gradient">
      <Header />
      <StaffSidebar />
      <main className="pt-16 md:ml-72 px-4 py-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-brand-gradient">Staff Dashboard</h1>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="glass-card rounded-xl p-4">
              <p className="text-sm text-muted-foreground">Today’s Appointments</p>
              <p className="text-2xl font-semibold">12</p>
            </div>
            <div className="glass-card rounded-xl p-4">
              <p className="text-sm text-muted-foreground">Pending Tasks</p>
              <p className="text-2xl font-semibold">5</p>
            </div>
            <div className="glass-card rounded-xl p-4">
              <p className="text-sm text-muted-foreground">Follow-ups</p>
              <p className="text-2xl font-semibold">8</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default StaffDashboard;
