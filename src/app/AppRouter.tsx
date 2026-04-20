import { Navigate, Route, Routes } from "react-router-dom";
import { RequireSignedIn } from "../components/auth/RequireSignedIn";
import { AppLayout } from "../components/layout/AppLayout";
import { FocusTrackingProvider } from "../hooks/FocusTrackingProvider";
import { AnalyticsPage } from "../pages/AnalyticsPage";
import { DashboardPage } from "../pages/DashboardPage";
import { GoalsPage } from "../pages/GoalsPage";
import { LandingPage } from "../pages/LandingPage";
import { ProfileSetupPage } from "../pages/ProfileSetupPage";
import { SessionHistoryPage } from "../pages/SessionHistoryPage";
import { SettingsPage } from "../pages/SettingsPage";
import { SignInPage } from "../pages/SignInPage";
import { SubjectSyllabusDetailPage } from "../pages/SubjectSyllabusDetailPage";
import { SyllabusHubPage } from "../pages/SyllabusHubPage";
import { TimerPage } from "../pages/TimerPage";

export const AppRouter = () => (
  <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/sign-in" element={<SignInPage />} />
    <Route path="/profile-setup" element={<ProfileSetupPage />} />
    <Route element={<RequireSignedIn />}>
      <Route
        element={
          <FocusTrackingProvider>
            <AppLayout />
          </FocusTrackingProvider>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/timer" element={<TimerPage />} />
        <Route path="/syllabus" element={<SyllabusHubPage />} />
        <Route path="/syllabus/:subjectId" element={<SubjectSyllabusDetailPage />} />
        <Route path="/goals" element={<GoalsPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/history" element={<SessionHistoryPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);
