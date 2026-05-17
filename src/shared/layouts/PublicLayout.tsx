import type { ReactNode } from "react";
import Navbar from "./Navbar";

type Props = { children: ReactNode };

/** Full-page layout with navbar for public-facing pages. */
export default function PublicLayout({ children }: Props) {
  return (
    <div className="min-h-screen bg-[#f3f2ef]">
      <Navbar />
      <main>{children}</main>
    </div>
  );
}
