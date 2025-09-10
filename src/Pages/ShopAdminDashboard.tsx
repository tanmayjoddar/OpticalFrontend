import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import { logout } from '../store/authSlice';
import { Button } from '../components/ui/button';

function ShopAdminDashboard() {
  const dispatch = useDispatch();
  const { type, user } = useSelector((state: RootState) => state.auth);
  // Try to get userData from localStorage if Redux state is empty
  let userData = user;
  let userType = type;
  if (!userData || !userType) {
    const stored = localStorage.getItem('userData');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        userData = parsed.user;
        userType = parsed.type;
      } catch {}
    }
  }
  // Check for JWT in localStorage
  const jwt = localStorage.getItem('jwt');
  if (userType !== 'shopAdmin' || !userData || !jwt) {
    return <div className="min-h-screen flex items-center justify-center">Not logged in.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="fixed top-0 left-0 w-full h-16 bg-white shadow flex items-center px-4 z-50">
        <Button variant="outline" onClick={() => dispatch(logout())} className="mr-4">Logout</Button>
        <span className="text-lg font-semibold">Shop Admin Dashboard</span>
      </header>
      <main className="pt-16 flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]">
        <h1 className="text-3xl font-bold mb-4">Welcome, {userData.name}</h1>
        <div className="bg-white rounded-lg shadow p-6 w-full max-w-md">
          <h2 className="text-xl font-semibold mb-2">Shop Info</h2>
          <p><strong>Name:</strong> {userData.shop?.name}</p>
          <p><strong>Address:</strong> {userData.shop?.address}</p>
          <p><strong>Phone:</strong> {userData.shop?.phone}</p>
        </div>
      </main>
    </div>
  );
}

export default ShopAdminDashboard;
