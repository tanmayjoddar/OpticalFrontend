import { Button } from "@/components/ui/button";
import { useDispatch } from "react-redux";
import { logout } from "@/store/authSlice";

export default function Header() {
  const dispatch = useDispatch();
  return (
    <header className="h-16 bg-white flex items-center justify-between px-6 shadow">
      <span className="font-bold text-lg">Shop Admin Dashboard</span>
      <Button variant="outline" onClick={() => dispatch(logout())}>Logout</Button>
    </header>
  );
}
