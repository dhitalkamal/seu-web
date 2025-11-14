import type { ReactNode } from "react";

type Props = { children: ReactNode };

/** Centered card layout for login, register, and forgot-password pages. */
export default function AuthLayout({ children }: Props) {
  return <div>{children}</div>;
}
