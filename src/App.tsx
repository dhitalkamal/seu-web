import { BrowserRouter, Route, Routes } from "react-router-dom";
import ForgotPasswordPage from "@/features/auth/pages/ForgotPasswordPage";
import LoginPage from "@/features/auth/pages/LoginPage";
import MFAVerifyPage from "@/features/auth/pages/MFAVerifyPage";
import RegisterPage from "@/features/auth/pages/RegisterPage";
import ResetPasswordPage from "@/features/auth/pages/ResetPasswordPage";
import VerifyResetOTPPage from "@/features/auth/pages/VerifyResetOTPPage";
import HomePage from "@/features/events/pages/HomePage";

/** Root router. */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* public */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/mfa" element={<MFAVerifyPage />} />

        {/* 3-step password reset flow */}
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/forgot-password/verify" element={<VerifyResetOTPPage />} />
        <Route path="/forgot-password/reset" element={<ResetPasswordPage />} />
      </Routes>
    </BrowserRouter>
  );
}
