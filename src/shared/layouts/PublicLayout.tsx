import type { ReactNode } from "react";
import Footer from "@/shared/components/Footer";
import Navbar from "./Navbar";

type Props = { children: ReactNode };

/** Full-page layout with navbar and footer for public-facing pages. */
export default function PublicLayout({ children }: Props) {
  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col">
      <Navbar />
      <main className="pt-24 flex-1">{children}</main>
      <Footer />
    </div>
  );
}
