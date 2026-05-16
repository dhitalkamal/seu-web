import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/shared/store/auth.store";

type Props = { children: ReactNode };

/** Redirects already-authenticated users away from guest-only pages (login, register). */
export default function GuestRoute({ children }: Props) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <Navigate to="/" replace /> : <>{children}</>;
}
