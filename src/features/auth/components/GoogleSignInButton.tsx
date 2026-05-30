import { useRef, useState, useEffect } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useAuthStore } from "@/shared/store/auth.store";
import authApi from "@/features/auth/api/auth.api";

type Props = {
  onSuccess?: (isNewUser: boolean) => void;
  onError?: (message: string) => void;
};

/**
 * Google Sign-In button using the @react-oauth/google GoogleLogin component.
 * On success, sends the credential (ID token) to the IAM social auth endpoint.
 *
 * The GoogleLogin `width` prop only accepts pixel numbers, so we measure the
 * container on mount + resize to keep the button flush with the form.
 */
export default function GoogleSignInButton({ onSuccess, onError }: Props) {
  const { setAuth } = useAuthStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [btnWidth, setBtnWidth] = useState(400);

  /** Measure the container so we can pass a pixel width to GoogleLogin. */
  useEffect(() => {
    function measure() {
      if (containerRef.current) {
        setBtnWidth(containerRef.current.offsetWidth);
      }
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  async function handleCredential(credential: string) {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || ""}/iam/api/v1/auth/social/google/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id_token: credential }),
        }
      );
      const data = (await res.json()) as {
        data: { access_token: string; refresh_token: string; is_new_user: boolean };
        error: { message: string } | null;
      };

      if (!res.ok || data.error) {
        onError?.(data.error?.message ?? "Google sign-in failed.");
        return;
      }

      const { access_token, refresh_token, is_new_user } = data.data;
      // ! set tokens first so axios interceptor can attach the Bearer header
      setAuth(
        {
          id: "",
          email: "",
          first_name: "",
          last_name: "",
          avatar_url: null,
          phone: null,
          bio: null,
          is_email_verified: true,
          mfa_enabled: false,
          date_joined: new Date().toISOString(),
        },
        access_token,
        refresh_token
      );
      // ! fetch full profile immediately — fills in name, email, etc.
      try {
        const profile = await authApi.getProfile();
        setAuth(profile.data, access_token, refresh_token);
      } catch {
        // non-fatal — useProfileBootstrap will retry on next page load
      }
      onSuccess?.(is_new_user);
    } catch {
      onError?.("Google sign-in failed. Please try again.");
    }
  }

  return (
    <div ref={containerRef} style={{ width: "100%" }}>
      <GoogleLogin
        onSuccess={(res) => {
          if (res.credential) handleCredential(res.credential);
          else onError?.("Google did not return a credential.");
        }}
        onError={() => onError?.("Google sign-in was cancelled or failed.")}
        width={btnWidth}
        text="continue_with"
        shape="rectangular"
        theme="outline"
        size="large"
        logo_alignment="center"
      />
    </div>
  );
}
