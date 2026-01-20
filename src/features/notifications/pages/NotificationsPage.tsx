import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/** /notifications redirect — notifications now live in the profile page + navbar dropdown. */
export default function NotificationsPage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/profile", { replace: true });
  }, [navigate]);

  return null;
}
