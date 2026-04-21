import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useFocusFlowData } from "../../hooks/useFocusFlowData";
import { isProfileSetupComplete, isSyllabusSetupComplete, isScheduleSetupComplete } from "../../utils/profile";

export const RequireSignedIn = () => {
  const { profile } = useFocusFlowData();
  const location = useLocation();

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
