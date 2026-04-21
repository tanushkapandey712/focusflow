import type { InstitutionType, UserProfile } from "../types/models";

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const getSavedInstitutionType = (
  profile: Pick<UserProfile, "institutionType">,
): InstitutionType => profile.institutionType ?? "school";

export const getClassOrCourseLabel = (institutionType: InstitutionType) =>
  institutionType === "college" ? "Course" : "Class";

export const getInstitutionLabel = (institutionType: InstitutionType) =>
  institutionType === "college" ? "College" : "School";

export const isProfileSetupComplete = (profile: Pick<UserProfile, "hasCompletedProfileSetup">) =>
  profile.hasCompletedProfileSetup === true;

export const isSyllabusSetupComplete = (profile: Pick<UserProfile, "hasCompletedSyllabusSetup">) =>
  profile.hasCompletedSyllabusSetup === true;

export const isScheduleSetupComplete = (profile: Pick<UserProfile, "hasCompletedScheduleSetup">) =>
  profile.hasCompletedScheduleSetup === true;

export const getNextAppRoute = (profile: UserProfile) => {
  if (!profile.isAuthenticated) {
    return "/sign-in";
  }

  if (!isProfileSetupComplete(profile)) return "/profile-setup";
  if (!isSyllabusSetupComplete(profile)) return "/syllabus-setup";
  if (!isScheduleSetupComplete(profile)) return "/schedule-setup";
  
  return "/dashboard";
};
