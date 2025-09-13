import { useState } from "react";
import { Outlet } from "react-router";
import StaffHeader from "./StaffHeader";
import StaffSidebar from "./StaffSidebar";

interface StaffLayoutProps {
  children?: React.ReactNode;
}

const StaffLayout = ({ children }: StaffLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Sidebar for desktop */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <StaffSidebar />
      </div>

      {/* Mobile sidebar */}
      <StaffSidebar mobile open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className="flex flex-col flex-1 lg:pl-64">
        <StaffHeader onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children || <Outlet />}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default StaffLayout;