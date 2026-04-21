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
import { ProfileSetupPage } from "../pages/ProfileSetupPage";
import { ScheduleSetupPage } from "../pages/ScheduleSetupPage";
import { SessionHistoryPage } from "../pages/SessionHistoryPage";
import { SettingsPage } from "../pages/SettingsPage";
import { SignInPage } from "../pages/SignInPage";
import { SubjectSyllabusDetailPage } from "../pages/SubjectSyllabusDetailPage";
import { SyllabusHubPage } from "../pages/SyllabusHubPage";
import { SyllabusSetupPage } from "../pages/SyllabusSetupPage";
import { TimerPage } from "../pages/TimerPage";

export const AppRouter = () => (
  <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/sign-in" element={<SignInPage />} />
    <Route path="/profile-setup" element={<ProfileSetupPage />} />
    <Route path="/syllabus-setup" element={<SyllabusSetupPage />} />
    <Route path="/schedule-setup" element={<ScheduleSetupPage />} />
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
