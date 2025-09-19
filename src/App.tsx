// Combined login is handled in SelectLogin
import StaffDashboard from "./Pages/StaffDashboard/index";
import SelectLogin from "./Pages/SelectLogin";
import { Routes, Route, Navigate } from "react-router";
import { useAuth } from "./hooks/useAuth";
import ShopAdminDashboard from "./Pages/ShopAdminDashboard/index";

function ProtectedRoute({ children, type }: { children: React.ReactNode; type: string }) {
  const { token, type: userType } = useAuth();
  if (!token || userType !== type) {
    // Redirect to correct login page
  // Single entry now: send to root
  return <Navigate to="/" replace />;
    // Add more types as needed
  }
  return <>{children}</>;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<SelectLogin />} />
      <Route
        path="/staff-dashboard/*"
        element={
          <ProtectedRoute type="staff">
            <StaffDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/shop-admin-dashboard/*"
        element={
          <ProtectedRoute type="shopAdmin">
            <ShopAdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
