import type { ReactNode } from "react";

type Props = { children: ReactNode };

/** Navbar + main content area + Footer for public pages. */
export default function PublicLayout({ children }: Props) {
  return <div>{children}</div>;
}
