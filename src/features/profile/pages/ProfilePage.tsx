import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuthStore } from "@/shared/store/auth.store";

/**
 * /profile redirect — sends authenticated users to /settings,
 * unauthenticated users to /login.
 */
export default function ProfilePage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/settings", { replace: true });
    } else {
      navigate("/login", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return null;
}
