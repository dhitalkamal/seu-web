import type { InputHTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  hint?: string;
};

/** Labelled text input matching the Sansaar design system. */
export default function Input({ label, error, hint, className, id, ...props }: Props) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <label htmlFor={inputId} className="text-sm font-semibold text-[#19191e] font-['Manrope']">
          {label}
        </label>
      ) : null}
      <input
        {...props}
        id={inputId}
        className={cn(
          "h-11 w-full rounded-xl border px-4 text-sm font-['Manrope'] text-[#19191e] placeholder-[#9b9ca4] outline-none transition-colors",
          error
            ? "border-[#e83151] bg-[#e83151]/5 focus:border-[#e83151] focus:ring-1 focus:ring-[#e83151]/30"
            : "border-[#e0dfd8] bg-white focus:border-[#dba13d] focus:ring-1 focus:ring-[#dba13d]/30",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
      />
      {error ? (
        <p className="text-xs text-[#e83151] font-['Manrope']">{error}</p>
      ) : hint ? (
        <p className="text-xs text-[#6b6c75] font-['Manrope']">{hint}</p>
      ) : null}
    </div>
  );
}
