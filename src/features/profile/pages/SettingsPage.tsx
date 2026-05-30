import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/** /settings redirect — all settings are now on the combined /profile page. */
export default function SettingsPage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/profile", { replace: true });
  }, [navigate]);

  return null;
}
