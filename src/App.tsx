import StaffLogin from "./Pages/StaffLogin";
import StaffDashboard from "./Pages/StaffDashboard";
import SelectLogin from "./Pages/SelectLogin";
import { AuthProvider, useAuth } from "./providers/AuthProvider";
import { Routes, Route, Navigate } from "react-router";
import ShopAdminLogin from "./Pages/ShopAdminLogin";
import ShopAdminDashboard from "./Pages/ShopAdminDashboard/index";

function ProtectedRoute({ children, type }: { children: React.ReactNode; type: string }) {
  const { token, type: userType } = useAuth();
  if (!token || userType !== type) {
    // Redirect to correct login page
    if (type === 'staff') return <Navigate to="/staff-login" replace />;
    if (type === 'shopAdmin') return <Navigate to="/shop-admin-login" replace />;
    // Add more types as needed
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<SelectLogin />} />
        <Route path="/staff-login" element={<StaffLogin />} />
        <Route
          path="/staff-dashboard"
          element={
            <ProtectedRoute type="staff">
              <StaffDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/shop-admin-login" element={<ShopAdminLogin />} />
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
    </AuthProvider>
  );
}

export default App;
