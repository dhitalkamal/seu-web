import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/** /notifications redirect - notifications now live in the profile page under the notifications tab. */
export default function NotificationsPage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/profile?tab=notifications", { replace: true });
  }, [navigate]);

  return null;
}
