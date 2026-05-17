import { BrowserRouter, Route, Routes } from "react-router-dom";
import { GuestRoute, ProtectedRoute } from "@/features/auth/components";
import ForgotPasswordPage from "@/features/auth/pages/ForgotPasswordPage";
import LoginPage from "@/features/auth/pages/LoginPage";
import MFAVerifyPage from "@/features/auth/pages/MFAVerifyPage";
import RegisterPage from "@/features/auth/pages/RegisterPage";
import ResetPasswordPage from "@/features/auth/pages/ResetPasswordPage";
import VerifyEmailPage from "@/features/auth/pages/VerifyEmailPage";
import VerifyResetOTPPage from "@/features/auth/pages/VerifyResetOTPPage";
import CreateEventPage from "@/features/events/pages/CreateEventPage";
import EditEventPage from "@/features/events/pages/EditEventPage";
import EventDetailPage from "@/features/events/pages/EventDetailPage";
import HomePage from "@/features/events/pages/HomePage";
import OrgEventsPage from "@/features/events/pages/OrgEventsPage";
import SettingsPage from "@/features/profile/pages/SettingsPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* public */}
        <Route path="/" element={<HomePage />} />
        <Route path="/events/:id" element={<EventDetailPage />} />

        {/* guest-only auth */}
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
          path="/verify-email"
          element={
            <GuestRoute>
              <VerifyEmailPage />
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

        {/* password reset flow (3 steps, no auth required) */}
        <Route
          path="/forgot-password"
          element={
            <GuestRoute>
              <ForgotPasswordPage />
            </GuestRoute>
          }
        />
        <Route
          path="/forgot-password/verify"
          element={
            <GuestRoute>
              <VerifyResetOTPPage />
            </GuestRoute>
          }
        />
        <Route
          path="/forgot-password/reset"
          element={
            <GuestRoute>
              <ResetPasswordPage />
            </GuestRoute>
          }
        />

        {/* authenticated */}
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/events/create"
          element={
            <ProtectedRoute>
              <CreateEventPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/events/mine"
          element={
            <ProtectedRoute>
              <OrgEventsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/events/:id/edit"
          element={
            <ProtectedRoute>
              <EditEventPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
