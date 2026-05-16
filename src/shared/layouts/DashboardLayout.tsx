import type { ReactNode } from "react";

type Props = { children: ReactNode };

/** Sidebar + main content area for authenticated dashboard pages. */
export default function DashboardLayout({ children }: Props) {
  return <div>{children}</div>;
}
