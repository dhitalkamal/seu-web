import type { ReactNode } from "react";
import Navbar from "./Navbar";

type Props = { children: ReactNode };

/** Full-page layout with navbar for public-facing pages. */
export default function PublicLayout({ children }: Props) {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <Navbar />
      <main className="pt-24">{children}</main>
    </div>
  );
}
