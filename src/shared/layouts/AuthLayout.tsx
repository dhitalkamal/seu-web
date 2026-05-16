import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

type Props = {
  children: ReactNode;
  title: string;
  subtitle?: string;
};

/**
 * Centered card layout for authentication pages.
 * Navy gradient background, gold Sansaar wordmark, Framer Motion entry animation.
 */
export default function AuthLayout({ children, title, subtitle }: Props) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#050a26] via-[#121d3f] to-[#1a2d5a] px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <span className="text-3xl font-bold font-['Space_Grotesk'] text-[#dba13d]">
              Sansaar
            </span>
          </Link>
          <p className="text-sm text-white/50 mt-1 font-['Manrope']">The Event Universe</p>
        </div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="bg-white rounded-2xl shadow-2xl p-8"
        >
          <div className="mb-6">
            <h1 className="text-2xl font-bold font-['Space_Grotesk'] text-[#19191e]">{title}</h1>
            {subtitle && <p className="text-sm text-[#6b6c75] font-['Manrope'] mt-1">{subtitle}</p>}
          </div>
          {children}
        </motion.div>

        {/* Footer */}
        <p className="text-center text-sm text-white/40 mt-6 font-['Manrope']">
          <Link to="/" className="hover:text-white/70 transition-colors">
            Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
