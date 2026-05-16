import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import AuthLayout from "@/shared/layouts/AuthLayout";
import { useAuth, getApiError } from "@/features/auth/hooks/useAuth";
import { cn } from "@/shared/lib/cn";

/** MFA verification page -- 6-digit OTP input with auto-advance and auto-submit. */
export default function MFAVerifyPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyMFAMutation } = useAuth();

  const userId = (location.state as { userId?: string })?.userId ?? "";

  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  // Redirect if landed here without a userId (e.g. direct bookmark)
  useEffect(() => {
    if (!userId) navigate("/login", { replace: true });
  }, [userId, navigate]);

  function submitCode(code: string) {
    verifyMFAMutation.mutate({ user_id: userId, code }, { onSuccess: () => navigate("/") });
  }

  function handleChange(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    if (digit && index < 5) inputRefs.current[index + 1]?.focus();
    if (digit && next.every(Boolean)) submitCode(next.join(""));
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      const next = pasted.split("");
      setDigits(next);
      inputRefs.current[5]?.focus();
      submitCode(pasted);
    }
  }

  const isPending = verifyMFAMutation.isPending;

  return (
    <AuthLayout
      title="Two-factor authentication"
      subtitle="Enter the 6-digit code from your authenticator app"
    >
      {verifyMFAMutation.isError && (
        <div className="rounded-xl bg-[#e83151]/10 border border-[#e83151]/30 px-4 py-3 text-sm text-[#e83151] font-['Manrope'] mb-4">
          {getApiError(verifyMFAMutation.error)}
        </div>
      )}

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.25 }}
        className={cn(
          "flex gap-3 justify-center my-8",
          isPending && "opacity-50 pointer-events-none"
        )}
        onPaste={handlePaste}
      >
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              inputRefs.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className={cn(
              "w-12 h-14 text-center text-xl font-bold rounded-xl border-2 outline-none transition-colors",
              "text-[#19191e] font-['Space_Grotesk']",
              d ? "border-[#121d3f] bg-[#121d3f]/5" : "border-[#121d3f]/20",
              "focus:border-[#121d3f] focus:ring-2 focus:ring-[#121d3f]/20"
            )}
          />
        ))}
      </motion.div>

      <p className="text-center text-sm text-[#6b6c75] font-['Manrope']">
        <Link to="/login" className="text-[#121d3f] hover:underline font-semibold">
          Back to sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
