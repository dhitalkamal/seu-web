import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";

/** Top navigation bar shown on all pages. */
export default function Navbar() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logoutMutation } = useAuth();

  function handleLogout() {
    logoutMutation.mutate(undefined, { onSettled: () => navigate("/login") });
  }

  return (
    <nav className="sticky top-0 z-30 bg-white border-b border-[#e0dfd8]">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="text-lg font-bold text-[#121d3f] font-['Manrope'] tracking-tight">
          Sansaar
        </Link>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <Link
                to="/events/create"
                className="text-sm text-[#6b6c75] hover:text-[#19191e] font-['Manrope'] hidden sm:block"
              >
                Create event
              </Link>
              <Link
                to="/events/mine"
                className="text-sm text-[#6b6c75] hover:text-[#19191e] font-['Manrope'] hidden sm:block"
              >
                My events
              </Link>
              <Link
                to="/settings"
                className="text-sm font-semibold text-[#19191e] font-['Manrope']"
              >
                {user?.first_name || "Account"}
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm text-[#6b6c75] hover:text-[#e83151] font-['Manrope'] transition-colors"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm text-[#6b6c75] hover:text-[#19191e] font-['Manrope']"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="text-sm bg-[#121d3f] text-white font-semibold font-['Manrope'] px-4 py-1.5 rounded-lg hover:bg-[#1a2a58] transition-colors"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
