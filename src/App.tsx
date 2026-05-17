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
import EventListPage from "@/features/events/pages/EventListPage";
import EventRegistrationsPage from "@/features/events/pages/EventRegistrationsPage";
import HomePage from "@/features/events/pages/HomePage";
import OrgEventsPage from "@/features/events/pages/OrgEventsPage";
import NotificationsPage from "@/features/notifications/pages/NotificationsPage";
import ProfilePage from "@/features/profile/pages/ProfilePage";
import SettingsPage from "@/features/profile/pages/SettingsPage";
import CheckoutPage from "@/features/payment/pages/CheckoutPage";
import FailurePage from "@/features/payment/pages/FailurePage";
import SuccessPage from "@/features/payment/pages/SuccessPage";
import TicketsPage from "@/features/registration/pages/TicketsPage";

/** Wrap a page in ProtectedRoute. */
function P({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}

/** Wrap a page in GuestRoute. */
function G({ children }: { children: React.ReactNode }) {
  return <GuestRoute>{children}</GuestRoute>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* public */}
        <Route path="/" element={<HomePage />} />
        <Route path="/events" element={<EventListPage />} />
        <Route path="/events/:id" element={<EventDetailPage />} />

        {/* guest-only auth */}
        <Route
          path="/login"
          element={
            <G>
              <LoginPage />
            </G>
          }
        />
        <Route
          path="/register"
          element={
            <G>
              <RegisterPage />
            </G>
          }
        />
        <Route
          path="/verify-email"
          element={
            <G>
              <VerifyEmailPage />
            </G>
          }
        />
        <Route
          path="/mfa"
          element={
            <G>
              <MFAVerifyPage />
            </G>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <G>
              <ForgotPasswordPage />
            </G>
          }
        />
        <Route
          path="/forgot-password/verify"
          element={
            <G>
              <VerifyResetOTPPage />
            </G>
          }
        />
        <Route
          path="/forgot-password/reset"
          element={
            <G>
              <ResetPasswordPage />
            </G>
          }
        />

        {/* authenticated */}
        <Route
          path="/settings"
          element={
            <P>
              <SettingsPage />
            </P>
          }
        />
        <Route path="/profile" element={<ProfilePage />} />
        <Route
          path="/notifications"
          element={
            <P>
              <NotificationsPage />
            </P>
          }
        />
        <Route
          path="/tickets"
          element={
            <P>
              <TicketsPage />
            </P>
          }
        />
        <Route
          path="/checkout"
          element={
            <P>
              <CheckoutPage />
            </P>
          }
        />
        <Route path="/payment/success" element={<SuccessPage />} />
        <Route path="/payment/failure" element={<FailurePage />} />
        <Route
          path="/events/create"
          element={
            <P>
              <CreateEventPage />
            </P>
          }
        />
        <Route
          path="/events/mine"
          element={
            <P>
              <OrgEventsPage />
            </P>
          }
        />
        <Route
          path="/events/:id/edit"
          element={
            <P>
              <EditEventPage />
            </P>
          }
        />
        <Route
          path="/events/:id/registrations"
          element={
            <P>
              <EventRegistrationsPage />
            </P>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
