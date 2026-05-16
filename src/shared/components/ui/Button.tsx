import { forwardRef } from "react";
import { cn } from "@/shared/lib/cn";
import Spinner from "./Spinner";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
};

const VARIANTS: Record<Variant, string> = {
  primary: "bg-[#121d3f] text-white hover:bg-[#050a26] focus-visible:ring-[#121d3f]",
  secondary: "bg-[#e83151] text-white hover:bg-[#c9294a] focus-visible:ring-[#e83151]",
  ghost:
    "bg-transparent text-[#121d3f] border border-[#121d3f]/30 hover:bg-[#121d3f]/5 focus-visible:ring-[#121d3f]",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-sm rounded-lg",
  md: "h-10 px-4 text-sm rounded-xl",
  lg: "h-12 px-6 text-base rounded-xl",
};

/**
 * Primary action button with variant and loading state support.
 * @param variant - visual style: primary (navy), secondary (coral), ghost (outlined)
 * @param loading - shows spinner and disables interaction
 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, className, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-semibold font-['Manrope'] transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  )
);
Button.displayName = "Button";
export default Button;
