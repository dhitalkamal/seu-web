import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/shared/store/auth.store";
import type { Role } from "@/features/auth/types/auth.types";

type Props = {
  children: ReactNode;
  allowedRoles?: Role[];
};

/** Redirects unauthenticated users to /login. Optionally enforces role-based access. */
export default function ProtectedRoute({ children, allowedRoles }: Props) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
