import { useState, useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { GuestRoute, ProtectedRoute } from "@/features/auth/components";
import OrgGuard from "@/features/orgs/components/OrgGuard";
import { useAuthStore } from "@/shared/store/auth.store";
import axios from "axios";

// auth
import ForgotPasswordPage from "@/features/auth/pages/ForgotPasswordPage";
import LoginPage from "@/features/auth/pages/LoginPage";
import MFAVerifyPage from "@/features/auth/pages/MFAVerifyPage";
import RegisterPage from "@/features/auth/pages/RegisterPage";
import ResetPasswordPage from "@/features/auth/pages/ResetPasswordPage";
import VerifyEmailPage from "@/features/auth/pages/VerifyEmailPage";
import VerifyResetOTPPage from "@/features/auth/pages/VerifyResetOTPPage";

// public
import HomePage from "@/features/events/pages/HomePage";
import EventListPage from "@/features/events/pages/EventListPage";
import AttendeeEventPage from "@/features/events/pages/AttendeeEventPage";
import OrgEventDetailPage from "@/features/events/pages/OrgEventDetailPage";
import OrgProfilePage from "@/features/orgs/pages/OrgProfilePage";

// org workspace
import OrgDashboardPage from "@/features/dashboard/pages/OrgDashboardPage";
import OrgEventsPage from "@/features/events/pages/OrgEventsPage";
import CreateEventPage from "@/features/events/pages/CreateEventPage";
import EditEventPage from "@/features/events/pages/EditEventPage";
import EventAnalyticsPage from "@/features/events/pages/EventAnalyticsPage";
import EventHealthPage from "@/features/events/pages/EventHealthPage";
import EventRegistrationsPage from "@/features/events/pages/EventRegistrationsPage";
import VolunteerManagementPage from "@/features/volunteers/pages/VolunteerManagementPage";
import ParticipationPage from "@/features/participation/pages/ParticipationPage";
import SponsorsPage from "@/features/sponsors/pages/SponsorsPage";
import TaxonomyPage from "@/features/taxonomy/pages/TaxonomyPage";
import VenuesPage from "@/features/venues/pages/VenuesPage";
import VolAppsPage from "@/features/volunteer-apps/pages/VolAppsPage";
import CheckinConsolePage from "@/features/checkin/pages/CheckinConsolePage";
import WaitlistPage from "@/features/waitlist/pages/WaitlistPage";
import TeamPage from "@/features/team/pages/TeamPage";
import FinanceHubPage from "@/features/finance/pages/FinanceHubPage";
import ReportsPage from "@/features/finance/pages/ReportsPage";
import OrgSettingsPage from "@/features/orgs/pages/OrgSettingsPage";
import OrgCreatePage from "@/features/orgs/pages/OrgCreatePage";
import PricingPage from "@/features/orgs/pages/PricingPage";

// attendee / user
import TicketsPage from "@/features/registration/pages/TicketsPage";
import HistoryPage from "@/features/registration/pages/HistoryPage";
import NotificationsPage from "@/features/notifications/pages/NotificationsPage";
import CheckoutPage from "@/features/payment/pages/CheckoutPage";
import SuccessPage from "@/features/payment/pages/SuccessPage";
import FailurePage from "@/features/payment/pages/FailurePage";
import ProfilePage from "@/features/profile/pages/ProfilePage";
import SettingsPage from "@/features/profile/pages/SettingsPage";
import SearchPage from "@/features/search/pages/SearchPage";
import SupportPage from "@/features/support/pages/SupportPage";

// volunteer
import VolunteerHomePage from "@/features/volunteer/pages/VolunteerHomePage";
import VolunteerShiftsPage from "@/features/volunteer/pages/VolunteerShiftsPage";
import VolunteerApplicationsPage from "@/features/volunteer/pages/VolunteerApplicationsPage";
import VolunteerHoursPage from "@/features/volunteer/pages/VolunteerHoursPage";
import VolunteerCertificatesPage from "@/features/volunteer/pages/VolunteerCertificatesPage";

import PassportPage from "@/features/participation/pages/PassportPage";

// attendee extras
import SavedEventsPage from "@/features/registration/pages/SavedEventsPage";

// new pages
import CommunityPage from "@/features/community/pages/CommunityPage";
import CampaignsPage from "@/features/marketing/pages/CampaignsPage";
import EventConnectionsPage from "@/features/events/pages/EventConnectionsPage";
import NetworkingPage from "@/features/events/pages/NetworkingPage";

import { useDeviceToken } from "@/features/notifications/hooks/useDeviceToken";
import ChatWidget from "@/shared/components/ChatWidget";

/** Wrap a page in ProtectedRoute. */
function P({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}

/** Wrap a page in GuestRoute. */
function G({ children }: { children: React.ReactNode }) {
  return <GuestRoute>{children}</GuestRoute>;
}

/** Redirect authenticated users away from a public page to a different route. */
function AuthRedirect({ to, children }: { to: string; children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (isAuthenticated) return <Navigate to={to} replace />;
  return <>{children}</>;
}

function AppInner() {
  useDeviceToken();
  return null;
}

/** Full-screen maintenance page shown when the platform is in maintenance mode. */
function MaintenancePage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #050a26, #121d3f)",
        color: "white",
        fontFamily: "'Manrope', sans-serif",
        textAlign: "center",
        padding: 32,
      }}
    >
      <div style={{ fontSize: 64, marginBottom: 24 }}>
        <span className="ms" style={{ fontSize: 64, color: "#dba13d" }}>
          construction
        </span>
      </div>
      <h1
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 36,
          fontWeight: 700,
          letterSpacing: "-0.03em",
          marginBottom: 12,
        }}
      >
        We'll be right back
      </h1>
      <p
        style={{
          fontSize: 16,
          color: "rgba(255,255,255,0.7)",
          maxWidth: 480,
          lineHeight: 1.6,
          marginBottom: 32,
        }}
      >
        Sansaar is currently undergoing scheduled maintenance. We're working hard to improve your
        experience. Please check back shortly.
      </p>
      <div
        style={{
          padding: "12px 24px",
          background: "rgba(255,255,255,0.1)",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.15)",
          fontSize: 13,
          color: "rgba(255,255,255,0.6)",
        }}
      >
        If this persists, contact support at{" "}
        <a href="mailto:support@sansaar.events" style={{ color: "#dba13d" }}>
          support@sansaar.events
        </a>
      </div>
    </div>
  );
}

export default function App() {
  const [maintenance, setMaintenance] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    function checkStatus() {
      axios
        .get(
          `${import.meta.env.VITE_RENDER_IAM || import.meta.env.VITE_API_BASE_URL || ""}/api/v1/platform/status/`
        )
        .then((res) => {
          setMaintenance(res.data?.data?.maintenance === true);
        })
        .catch(() => {
          setMaintenance(false);
        })
        .finally(() => setChecked(true));
    }

    checkStatus();
    const interval = setInterval(checkStatus, 30_000);
    window.addEventListener("focus", checkStatus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", checkStatus);
    };
  }, []);

  if (!checked) return null;
  if (maintenance) return <MaintenancePage />;

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "var(--surface)",
            color: "var(--on-bg)",
            border: "1px solid var(--mid)",
            fontFamily: "'Manrope', sans-serif",
            fontSize: "14px",
          },
          success: { iconTheme: { primary: "#22c55e", secondary: "#fff" } },
          error: { iconTheme: { primary: "var(--secondary)", secondary: "#fff" } },
        }}
      />
      <Routes>
        {/* * public pages - authenticated users redirect to /events instead of seeing PublicLayout */}
        <Route
          path="/"
          element={
            <AuthRedirect to="/events">
              <HomePage />
            </AuthRedirect>
          }
        />
        <Route
          path="/events"
          element={
            <P>
              <EventListPage />
            </P>
          }
        />
        <Route
          path="/events/:id"
          element={
            <P>
              <AttendeeEventPage />
            </P>
          }
        />
        <Route
          path="/orgs/:id"
          element={
            <P>
              <OrgProfilePage />
            </P>
          }
        />
        <Route
          path="/search"
          element={
            <P>
              <SearchPage />
            </P>
          }
        />

        {/* * guest-only auth */}
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

        {/* * org workspace - all under /org prefix, guarded by OrgGuard */}
        <Route
          path="/org/dashboard"
          element={
            <P>
              <OrgGuard>
                <OrgDashboardPage />
              </OrgGuard>
            </P>
          }
        />
        <Route
          path="/org/events"
          element={
            <P>
              <OrgGuard>
                <OrgEventsPage />
              </OrgGuard>
            </P>
          }
        />
        <Route
          path="/org/events/create"
          element={
            <P>
              <OrgGuard>
                <CreateEventPage />
              </OrgGuard>
            </P>
          }
        />
        <Route
          path="/org/events/:id"
          element={
            <P>
              <OrgGuard>
                <OrgEventDetailPage />
              </OrgGuard>
            </P>
          }
        />
        <Route
          path="/org/events/:id/edit"
          element={
            <P>
              <OrgGuard>
                <EditEventPage />
              </OrgGuard>
            </P>
          }
        />
        <Route
          path="/org/events/:id/registrations"
          element={
            <P>
              <OrgGuard>
                <EventRegistrationsPage />
              </OrgGuard>
            </P>
          }
        />
        <Route
          path="/org/events/:id/analytics"
          element={
            <P>
              <OrgGuard>
                <EventAnalyticsPage />
              </OrgGuard>
            </P>
          }
        />
        <Route
          path="/org/events/:id/volunteers"
          element={
            <P>
              <OrgGuard>
                <VolunteerManagementPage />
              </OrgGuard>
            </P>
          }
        />
        <Route
          path="/org/participation"
          element={
            <P>
              <OrgGuard>
                <ParticipationPage />
              </OrgGuard>
            </P>
          }
        />
        <Route
          path="/org/sponsors"
          element={
            <P>
              <OrgGuard>
                <SponsorsPage />
              </OrgGuard>
            </P>
          }
        />
        <Route
          path="/org/taxonomy"
          element={
            <P>
              <OrgGuard>
                <TaxonomyPage />
              </OrgGuard>
            </P>
          }
        />
        <Route
          path="/org/venues"
          element={
            <P>
              <OrgGuard>
                <VenuesPage />
              </OrgGuard>
            </P>
          }
        />
        <Route
          path="/org/volunteer-apps"
          element={
            <P>
              <OrgGuard>
                <VolAppsPage />
              </OrgGuard>
            </P>
          }
        />
        <Route
          path="/org/checkin"
          element={
            <P>
              <OrgGuard>
                <CheckinConsolePage />
              </OrgGuard>
            </P>
          }
        />
        <Route
          path="/org/waitlist"
          element={
            <P>
              <OrgGuard>
                <WaitlistPage />
              </OrgGuard>
            </P>
          }
        />
        <Route
          path="/org/team"
          element={
            <P>
              <OrgGuard>
                <TeamPage />
              </OrgGuard>
            </P>
          }
        />
        <Route
          path="/org/events/:id/health"
          element={
            <P>
              <OrgGuard>
                <EventHealthPage />
              </OrgGuard>
            </P>
          }
        />
        <Route
          path="/org/finance"
          element={
            <P>
              <OrgGuard>
                <FinanceHubPage />
              </OrgGuard>
            </P>
          }
        />
        <Route
          path="/org/reports"
          element={
            <P>
              <OrgGuard>
                <ReportsPage />
              </OrgGuard>
            </P>
          }
        />
        <Route
          path="/org/analytics"
          element={
            <P>
              <OrgGuard>
                <EventAnalyticsPage />
              </OrgGuard>
            </P>
          }
        />
        <Route
          path="/org/settings"
          element={
            <P>
              <OrgSettingsPage />
            </P>
          }
        />
        <Route
          path="/org/new"
          element={
            <P>
              <OrgCreatePage />
            </P>
          }
        />
        <Route
          path="/org/pricing"
          element={
            <P>
              <PricingPage />
            </P>
          }
        />

        <Route
          path="/org/support"
          element={
            <P>
              <SupportPage />
            </P>
          }
        />
        <Route
          path="/org/community"
          element={
            <P>
              <CommunityPage />
            </P>
          }
        />

        {/* * attendee pages */}
        <Route
          path="/tickets"
          element={
            <P>
              <TicketsPage />
            </P>
          }
        />
        <Route
          path="/history"
          element={
            <P>
              <HistoryPage />
            </P>
          }
        />
        <Route
          path="/saved"
          element={
            <P>
              <SavedEventsPage />
            </P>
          }
        />
        <Route
          path="/notifications"
          element={
            <P>
              <NotificationsPage />
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
          path="/passport"
          element={
            <P>
              <PassportPage />
            </P>
          }
        />
        <Route
          path="/profile"
          element={
            <P>
              <ProfilePage />
            </P>
          }
        />
        <Route
          path="/settings"
          element={
            <P>
              <SettingsPage />
            </P>
          }
        />

        {/* * volunteer pages */}
        <Route
          path="/volunteer"
          element={
            <P>
              <VolunteerHomePage />
            </P>
          }
        />
        <Route
          path="/volunteer/applications"
          element={
            <P>
              <VolunteerApplicationsPage />
            </P>
          }
        />
        <Route
          path="/volunteer/shifts"
          element={
            <P>
              <VolunteerShiftsPage />
            </P>
          }
        />
        <Route
          path="/volunteer/hours"
          element={
            <P>
              <VolunteerHoursPage />
            </P>
          }
        />
        <Route
          path="/volunteer/certificates"
          element={
            <P>
              <VolunteerCertificatesPage />
            </P>
          }
        />

        {/* * community, campaigns, networking */}
        <Route
          path="/community"
          element={
            <P>
              <CommunityPage />
            </P>
          }
        />
        <Route
          path="/org/campaigns"
          element={
            <P>
              <OrgGuard>
                <CampaignsPage />
              </OrgGuard>
            </P>
          }
        />
        <Route
          path="/networking"
          element={
            <P>
              <NetworkingPage />
            </P>
          }
        />
        <Route
          path="/support"
          element={
            <P>
              <SupportPage />
            </P>
          }
        />
        <Route
          path="/events/:id/connections"
          element={
            <P>
              <EventConnectionsPage />
            </P>
          }
        />
      </Routes>
      <AppInner />
      <ChatWidget />
    </BrowserRouter>
  );
}
