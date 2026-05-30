import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useOrgStore, isOrgActive } from "@/shared/store/org.store";
import toast from "react-hot-toast";

/** Redirects to /profile if the user has no active (approved) organization. */
export default function OrgGuard({ children }: { children: ReactNode }) {
  const org = useOrgStore((s) => s.org);

  if (!org) {
    toast("Create an organization first", { id: "org-guard" });
    return <Navigate to="/profile" replace />;
  }

  if (!isOrgActive(org)) {
    toast("Your organization is pending verification", { id: "org-guard" });
    return <Navigate to="/profile" replace />;
  }

  return <>{children}</>;
}
