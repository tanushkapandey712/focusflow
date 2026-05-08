import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useFocusFlowData } from "../../hooks/useFocusFlowData";
import { isProfileSetupComplete, isSyllabusSetupComplete, isScheduleSetupComplete } from "../../utils/profile";

export const RequireSignedIn = () => {
  const { profile, isAuthReady, isLoading, authUserId, syncError } = useFocusFlowData();
  const location = useLocation();

  if (!isAuthReady || (authUserId && (isLoading || !profile.isAuthenticated))) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 text-center text-sm font-medium text-slate-500 dark:bg-slate-950 dark:text-slate-300">
        {syncError
          ? "We could not restore your FocusFlow session. Please refresh and try again."
          : "Restoring your FocusFlow session..."}
      </div>
    );
  }

  if (!profile.isAuthenticated) {
    return <Navigate to="/sign-in" replace state={{ from: location.pathname }} />;
  }

  if (!isProfileSetupComplete(profile)) {
    return <Navigate to="/profile-setup" replace state={{ from: location.pathname }} />;
  }

  if (!isSyllabusSetupComplete(profile)) {
    return <Navigate to="/syllabus-setup" replace state={{ from: location.pathname }} />;
  }

  if (!isScheduleSetupComplete(profile)) {
    return <Navigate to="/schedule-setup" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
};
