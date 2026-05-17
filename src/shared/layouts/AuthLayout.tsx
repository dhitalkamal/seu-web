import type { ReactNode } from "react";
import { Link } from "react-router-dom";

type Props = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

/**
 * Centered card layout for all auth screens (login, register, forgot-password).
 * Shows the Sansaar wordmark at the top and a white card below.
 */
export default function AuthLayout({ title, subtitle, children }: Props) {
  return (
    <div className="min-h-screen bg-[#f3f2ef] flex flex-col items-center justify-center px-4 py-12">
      {/* wordmark */}
      <Link
        to="/"
        className="mb-8 text-xl font-bold text-[#121d3f] font-['Manrope'] tracking-tight"
      >
        Sansaar
      </Link>

      {/* card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-[#e0dfd8] px-8 py-10">
        <div className="mb-7 text-center">
          <h1 className="text-2xl font-bold text-[#19191e] font-['Manrope']">{title}</h1>
          {subtitle ? (
            <p className="mt-1.5 text-sm text-[#6b6c75] font-['Manrope']">{subtitle}</p>
          ) : null}
        </div>
        {children}
      </div>
    </div>
  );
}
