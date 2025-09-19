import { Button } from "./button";
import { useAuth } from "../../hooks/useAuth";

function Header() {
  const { logout } = useAuth();
  return (
    <header className="fixed top-0 left-0 w-full h-16 bg-white/60 backdrop-blur supports-[backdrop-filter]:bg-white/40 border-b z-50">
      <div className="flex items-center w-full h-full px-4">
        <Button variant="ghost" onClick={logout} className="mr-3 clay-button">
          Logout
        </Button>
        <span className="text-lg font-bold text-brand-gradient">Staff Dashboard</span>
      </div>
    </header>
  );
}

export default Header;
