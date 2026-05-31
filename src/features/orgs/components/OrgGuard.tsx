import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useOrgStore, isOrgActive } from "@/shared/store/org.store";
import toast from "react-hot-toast";

/** Redirects to /profile if the user has no active (approved) organization.
 *  Exception: rejected/pending orgs can still access /org/settings to edit and resubmit. */
export default function OrgGuard({ children }: { children: ReactNode }) {
  const org = useOrgStore((s) => s.org);
  const { pathname } = useLocation();

  if (!org) {
    toast("Create an organization first", { id: "org-guard" });
    return <Navigate to="/profile" replace />;
  }

  // allow rejected/pending orgs to access settings so they can edit and resubmit
  if (!isOrgActive(org)) {
    const isSettingsPage = pathname === "/org/settings" || pathname.startsWith("/org/settings/");
    if (isSettingsPage) return <>{children}</>;

    const msg =
      org.status === "rejected"
        ? "Your organization was rejected. Edit your details in Settings and resubmit."
        : org.status === "suspended"
          ? "Your organization has been suspended."
          : "Your organization is pending verification.";
    toast(msg, { id: "org-guard" });
    return <Navigate to="/org/settings" replace />;
  }

  return <>{children}</>;
}
