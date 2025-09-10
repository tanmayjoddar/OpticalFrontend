import Header from "../components/ui/header";

function StaffDashboard() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main className="pt-16 flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <h1 className="text-3xl font-bold">Staff Dashboard</h1>
      </main>
    </div>
  );
}

export default StaffDashboard;
