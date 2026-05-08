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

            {/* Email Sign In */}

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
                  aria-required="true"
                  aria-invalid={!!error}
                  className={`h-12 w-full rounded-full border bg-white/50 pl-11 pr-4 text-sm outline-none transition-all focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10 dark:bg-slate-800/50 dark:focus:border-brand-400 dark:focus:bg-slate-800 ${error ? "border-rose-400 dark:border-rose-500" : "border-slate-200 dark:border-slate-700"}`}
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
