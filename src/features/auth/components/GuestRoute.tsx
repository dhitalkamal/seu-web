import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/shared/store/auth.store";

type Props = { children: ReactNode };

/**
 * Wraps auth-only pages (login, register, etc.).
 * Redirects already-authenticated users to the home page.
 */
export default function GuestRoute({ children }: Props) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
