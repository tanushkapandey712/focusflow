import { useEffect, useRef, useState } from "react";
import { ArrowRight, Mail } from "lucide-react";
import { Navigate, Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui";
import { useFocusFlowData } from "../hooks/useFocusFlowData";
import {
  getCurrentEmailAuthSession,
  isSupabaseEmailAuthConfigured,
  onEmailAuthStateChange,
  sendVerificationEmailLink,
} from "../services/auth/supabaseEmailAuth";
import { EMAIL_PATTERN, getNextAppRoute } from "../utils/profile";

export const SignInPage = () => {
  const navigate = useNavigate();
  const { profile, setProfile } = useFocusFlowData();

  const [email, setEmail] = useState(profile.email ?? "");
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "verifying">("idle");
  const [sentEmail, setSentEmail] = useState("");
  const hasSyncedSessionRef = useRef(false);

  useEffect(() => {
    if (!isSupabaseEmailAuthConfigured) {
      return;
    }

    const completeVerifiedSignIn = async () => {
      if (hasSyncedSessionRef.current) {
        return;
      }

      const session = await getCurrentEmailAuthSession();
      const verifiedEmail = session?.user.email?.trim().toLowerCase();

      if (!session || !verifiedEmail) {
        return;
      }

      hasSyncedSessionRef.current = true;
      const nextProfile = {
        ...profile,
        email: verifiedEmail,
        emailVerifiedAt: session.user.email_confirmed_at ?? new Date().toISOString(),
        timezone: profile.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
        preferredMode: profile.preferredMode ?? "pomodoro",
        isAuthenticated: true,
        hasCompletedProfileSetup: profile.hasCompletedProfileSetup,
      };

      setStatus("verifying");
      setProfile(nextProfile);
      navigate(getNextAppRoute(nextProfile), { replace: true });
    };

    void completeVerifiedSignIn().catch((sessionError: unknown) => {
      const message = sessionError instanceof Error ? sessionError.message : "Unable to finish email verification.";
      setError(message);
      setStatus("idle");
    });

    const unsubscribe = onEmailAuthStateChange(() => {
      void completeVerifiedSignIn().catch((sessionError: unknown) => {
        const message = sessionError instanceof Error ? sessionError.message : "Unable to finish email verification.";
        setError(message);
        setStatus("idle");
      });
    });

    return unsubscribe;
  }, [navigate, profile, setProfile]);

  if (profile.isAuthenticated) {
    return <Navigate to={getNextAppRoute(profile)} replace />;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const isAuthConfigured = isSupabaseEmailAuthConfigured;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      setError("Enter a valid email address to continue.");
      return;
    }

    if (!isAuthConfigured) {
      setError("Email authentication is not configured yet.");
      return;
    }

    setStatus("sending");
    setError("");

    try {
      await sendVerificationEmailLink(normalizedEmail, true);
      setSentEmail(normalizedEmail);
      setStatus("sent");
    } catch (sendError) {
      const message =
        sendError instanceof Error ? sendError.message : "We could not send the verification email.";
      setError(message);
      setStatus("idle");
    }
  };

  const handleGuestContinue = () => {
    const nextProfile = {
      ...profile,
      email: "guest@focusflow.app",
      isAuthenticated: true,
    };
    setProfile(nextProfile);
    navigate(getNextAppRoute(nextProfile), { replace: true });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f8f9fc] text-slate-900 dark:bg-surface-900 dark:text-slate-100 font-sans selection:bg-brand-500/30">
      {/* Background Animated Blobs for Calming Aesthetic */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
        <div className="absolute left-[10%] top-[10%] h-[40vw] w-[40vw] animate-[spin_40s_linear_infinite] rounded-full bg-brand-200/40 blur-[100px] dark:bg-brand-700/20" />
        <div className="absolute right-[10%] bottom-[10%] h-[45vw] w-[45vw] animate-[spin_50s_linear_infinite_reverse] rounded-full bg-sky-200/40 blur-[120px] dark:bg-sky-700/15" />
      </div>

      <div className="relative z-10 w-full max-w-md px-6 animate-fade-up">
        <div className="overflow-hidden rounded-[2.5rem] border border-white/60 bg-white/60 p-8 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/60 sm:p-10">
          <div className="flex flex-col items-center text-center space-y-6">
            
            {/* Logo and Tagline */}
            <div className="space-y-4 flex flex-col items-center">
              <Link to="/" className="group flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-sky-400 text-white shadow-lg transition-transform hover:scale-105">
                <img src="/focusflow-icon.svg" alt="FocusFlow Logo" className="h-7 w-7 brightness-0 invert transition-transform group-hover:rotate-12" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  FocusFlow
                </h1>
                <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                  One clean study block at a time.
                </p>
              </div>
            </div>

            {/* Google Sign In */}
            <button
              type="button"
              className="group flex h-12 w-full items-center justify-center gap-3 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
                <path d="M1 1h22v22H1z" fill="none" />
              </svg>
              Continue with Google
            </button>

            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-2 text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                  Or continue with email
                </span>
              </div>
            </div>

            {/* Email Form */}
            <form onSubmit={handleSubmit} className="w-full space-y-4">
              <div className="relative">
                <Mail size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setError("");
                  }}
                  placeholder="student@example.com"
                  className="h-12 w-full rounded-full border border-slate-200 bg-white/50 pl-11 pr-4 text-sm outline-none transition-all focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10 dark:border-slate-700 dark:bg-slate-800/50 dark:focus:border-brand-400 dark:focus:bg-slate-800"
                />
              </div>

              {error && (
                <p className="text-sm text-rose-500 text-left px-2">
                  {error}
                </p>
              )}

              {status === "sent" && sentEmail && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                  Check your inbox for a secure login link.
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 justify-center rounded-full"
                disabled={status === "sending" || status === "verifying"}
              >
                {status === "sending"
                  ? "Sending link..."
                  : status === "verifying"
                    ? "Verifying..."
                    : "Sign In"}
                <ArrowRight size={16} />
              </Button>
            </form>

            {/* Guest Option */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleGuestContinue}
                className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              >
                Continue as guest
              </button>
            </div>
            
          </div>
        </div>
        
        {/* Footer Links */}
        <div className="mt-8 flex justify-center gap-6 text-sm text-slate-500 dark:text-slate-400">
          <Link to="/privacy" className="hover:text-slate-900 dark:hover:text-white transition-colors">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-slate-900 dark:hover:text-white transition-colors">Terms of Use</Link>
        </div>
      </div>
    </div>
  );
};
