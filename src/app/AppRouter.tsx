import { Navigate, Route, Routes } from "react-router-dom";
import { RequireSignedIn } from "../components/auth/RequireSignedIn";
import { AppLayout } from "../components/layout/AppLayout";
import { StudyTimerProvider } from "../features/timer/StudyTimerProvider";
import { FocusTrackingProvider } from "../hooks/FocusTrackingProvider";
import { AnalyticsPage } from "../pages/AnalyticsPage";
import { DashboardPage } from "../pages/DashboardPage";
import { GoalsPage } from "../pages/GoalsPage";
import { MilestonesPage } from "../pages/MilestonesPage";
import { LandingPage } from "../pages/LandingPage";
import { PlannerPage } from "../pages/PlannerPage";
import { OnboardingPage } from "../pages/OnboardingPage";
import { SessionHistoryPage } from "../pages/SessionHistoryPage";
import { SettingsPage } from "../pages/SettingsPage";
import { SignInPage } from "../pages/SignInPage";
import { ForgotPasswordPage } from "../pages/ForgotPasswordPage";
import { ResetPasswordPage } from "../pages/ResetPasswordPage";
import { SubjectSyllabusDetailPage } from "../pages/SubjectSyllabusDetailPage";
import { SyllabusHubPage } from "../pages/SyllabusHubPage";
import { TimerPage } from "../pages/TimerPage";
import { PrivacyPage } from "../pages/PrivacyPage";
import { TermsPage } from "../pages/TermsPage";

export const AppRouter = () => (
  <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/sign-in" element={<SignInPage />} />
    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
    <Route path="/reset-password" element={<ResetPasswordPage />} />
    <Route path="/privacy" element={<PrivacyPage />} />
    <Route path="/terms" element={<TermsPage />} />
    
    <Route path="/onboarding" element={<OnboardingPage />} />
    
    {/* Legacy redirects */}
    <Route path="/profile-setup" element={<Navigate to="/onboarding" replace />} />
    <Route path="/syllabus-setup" element={<Navigate to="/onboarding" replace />} />
    <Route path="/schedule-setup" element={<Navigate to="/onboarding" replace />} />

    <Route element={<RequireSignedIn />}>
      <Route
        element={
          <FocusTrackingProvider>
            <StudyTimerProvider>
              <AppLayout />
            </StudyTimerProvider>
          </FocusTrackingProvider>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/timer" element={<TimerPage />} />
        <Route path="/syllabus" element={<SyllabusHubPage />} />
        <Route path="/syllabus/:subjectId" element={<SubjectSyllabusDetailPage />} />
        <Route path="/goals" element={<GoalsPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/planner" element={<PlannerPage />} />
        <Route path="/milestones" element={<MilestonesPage />} />
        <Route path="/history" element={<SessionHistoryPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);
