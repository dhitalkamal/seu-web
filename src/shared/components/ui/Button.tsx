import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
};

const variants: Record<Variant, string> = {
  primary:
    "bg-[#121d3f] text-white hover:bg-[#1a2a58] active:bg-[#0d1530] disabled:bg-[#121d3f]/50",
  secondary:
    "bg-white text-[#121d3f] border border-[#e0dfd8] hover:bg-[#f3f2ef] active:bg-[#e8e7e0]",
  ghost: "text-[#121d3f] hover:bg-[#f3f2ef] active:bg-[#e8e7e0]",
  danger: "bg-[#e83151] text-white hover:bg-[#cc2844] active:bg-[#b82240] disabled:bg-[#e83151]/50",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-sm rounded-lg",
  md: "h-10 px-4 text-sm rounded-xl",
  lg: "h-12 px-6 text-base rounded-xl",
};

/** General-purpose button matching the Sansaar design system. */
export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className,
  children,
  ...props
}: Props) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-semibold font-['Manrope'] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#dba13d] disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
      )}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : null}
      {children}
    </button>
  );
}
