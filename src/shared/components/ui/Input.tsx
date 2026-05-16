import { forwardRef } from "react";
import { cn } from "@/shared/lib/cn";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  hint?: string;
};

/**
 * Labeled text input with error and hint state support.
 * @param label - visible label text above the input
 * @param error - validation error message; turns the border coral and shows below
 * @param hint - optional helper text shown below input when no error
 */
const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1">
        <label htmlFor={inputId} className="text-sm font-semibold text-[#25262c] font-['Manrope']">
          {label}
        </label>
        <input
          id={inputId}
          ref={ref}
          className={cn(
            "h-11 w-full rounded-xl border px-4 text-sm text-[#19191e] bg-white",
            "placeholder:text-[#6b6c75] outline-none transition-colors",
            "focus:ring-2 focus:ring-[#121d3f]/20 focus:border-[#121d3f]",
            error
              ? "border-[#e83151] focus:border-[#e83151] focus:ring-[#e83151]/20"
              : "border-[#121d3f]/20",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-[#e83151] font-['Manrope']">{error}</p>}
        {!error && hint && <p className="text-xs text-[#6b6c75] font-['Manrope']">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";
export default Input;
