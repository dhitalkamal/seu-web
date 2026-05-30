import { useState, type InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  optional?: boolean;
};

/** SEU-design ghost-border input field with required asterisk and password eye toggle. */
export function SeuField({ label, error, id, optional, type, ...props }: Props) {
  const fieldId = id ?? label.toLowerCase().replace(/\s+/g, "-");
  const isPassword = type === "password";
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={fieldId}
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--on-mut)",
        }}
      >
        {label}
        {!optional && <span style={{ color: "#ef4444", marginLeft: 3 }}>*</span>}
      </label>
      <div style={{ position: "relative" }}>
        <input
          id={fieldId}
          type={isPassword && showPassword ? "text" : type}
          {...props}
          style={{
            fontFamily: "Manrope, sans-serif",
            fontSize: 14,
            padding: "11px 14px",
            paddingRight: isPassword ? 42 : 14,
            border: error ? "1px solid var(--error)" : "1px solid var(--outline-strong)",
            borderRadius: 10,
            background: "white",
            outline: "none",
            color: "var(--on-bg)",
            transition: "border-color 150ms",
            width: "100%",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "var(--primary)";
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = error ? "var(--error)" : "var(--outline-strong)";
            props.onBlur?.(e);
          }}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            style={{
              position: "absolute",
              right: 10,
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 4,
              display: "grid",
              placeItems: "center",
              color: "var(--on-mut)",
            }}
            tabIndex={-1}
          >
            <span className="ms" style={{ fontSize: 18 }}>
              {showPassword ? "visibility_off" : "visibility"}
            </span>
          </button>
        )}
      </div>
      {error && (
        <p style={{ fontSize: 12, color: "var(--error)", fontFamily: "Manrope, sans-serif" }}>
          {error}
        </p>
      )}
    </div>
  );
}

/** SEU-design navy gradient submit button. */
export function SeuSubmitButton({
  children,
  loading,
  ...props
}: {
  children: React.ReactNode;
  loading?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      style={{
        padding: "13px",
        width: "100%",
        border: "none",
        borderRadius: 12,
        background:
          loading || props.disabled ? "var(--high)" : "linear-gradient(135deg, #050a26, #121d3f)",
        color: loading || props.disabled ? "var(--on-mut)" : "white",
        fontFamily: "Manrope, sans-serif",
        fontWeight: 700,
        fontSize: 14,
        letterSpacing: "0.02em",
        cursor: loading || props.disabled ? "not-allowed" : "pointer",
        transition: "opacity 200ms",
      }}
    >
      {loading ? "Loading…" : children}
    </button>
  );
}

/** Horizontal divider with text. */
export function SeuDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3" style={{ margin: "4px 0" }}>
      <div style={{ flex: 1, height: 1, background: "var(--outline)" }} />
      <span
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--on-mut)",
          fontWeight: 600,
        }}
      >
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: "var(--outline)" }} />
    </div>
  );
}
