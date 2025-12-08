import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/shared/store/auth.store";

type Props = { children: ReactNode };

/**
 * Wraps any route that requires an authenticated session.
 * Redirects unauthenticated users to /login, preserving the intended destination.
 */
export default function ProtectedRoute({ children }: Props) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
