import { BrowserRouter, Route, Routes } from "react-router-dom";
import { GuestRoute } from "@/features/auth/components";
import ForgotPasswordPage from "@/features/auth/pages/ForgotPasswordPage";
import LoginPage from "@/features/auth/pages/LoginPage";
import MFAVerifyPage from "@/features/auth/pages/MFAVerifyPage";
import RegisterPage from "@/features/auth/pages/RegisterPage";
import HomePage from "@/features/events/pages/HomePage";

/** Root router -- add routes here as pages are implemented. */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/login"
          element={
            <GuestRoute>
              <LoginPage />
            </GuestRoute>
          }
        />
        <Route
          path="/register"
          element={
            <GuestRoute>
              <RegisterPage />
            </GuestRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <GuestRoute>
              <ForgotPasswordPage />
            </GuestRoute>
          }
        />
        <Route
          path="/mfa"
          element={
            <GuestRoute>
              <MFAVerifyPage />
            </GuestRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
