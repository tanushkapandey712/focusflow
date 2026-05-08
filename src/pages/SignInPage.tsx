import { useEffect, useRef, useState } from "react";
import { ArrowRight, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Navigate, Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui";
import { useFocusFlowData } from "../hooks/useFocusFlowData";
import {
  getCurrentEmailAuthSession,
  isSupabaseEmailAuthConfigured,
  onEmailAuthStateChange,
  signInWithPassword,
  signUpWithPassword,
} from "../services/auth/supabaseEmailAuth";
import { EMAIL_PATTERN, getNextAppRoute } from "../utils/profile";

type AuthMode = "sign-in" | "sign-up";

export const SignInPage = () => {
  const navigate = useNavigate();
  const { profile, setProfile } = useFocusFlowData();

  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [email, setEmail] = useState(profile.email ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "verifying">("idle");
  const hasSyncedSessionRef = useRef(false);

  // ── Check for existing session on mount ──────────────────────────────────
  useEffect(() => {
    if (!isSupabaseEmailAuthConfigured) return;

    const completeSignIn = async () => {
      if (hasSyncedSessionRef.current) return;

      const session = await getCurrentEmailAuthSession();
      const verifiedEmail = session?.user.email?.trim().toLowerCase();

      if (!session || !verifiedEmail) return;

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
      const savedProfile = await setProfile(nextProfile);
      navigate(getNextAppRoute(savedProfile), { replace: true });
    };

    void completeSignIn().catch((sessionError: unknown) => {
      const message = sessionError instanceof Error ? sessionError.message : "Unable to verify session.";
      setError(message);
      setStatus("idle");
    });

    const unsubscribe = onEmailAuthStateChange(() => {
      void completeSignIn().catch((sessionError: unknown) => {
        const message = sessionError instanceof Error ? sessionError.message : "Unable to verify session.";
        setError(message);
        setStatus("idle");
      });
    });

    return unsubscribe;
  }, [navigate, profile, setProfile]);

  // ── Already authenticated — redirect ─────────────────────────────────────
  if (profile.isAuthenticated) {
    return <Navigate to={getNextAppRoute(profile)} replace />;
  }

  const normalizedEmail = email.trim().toLowerCase();

  // ── Form validation ──────────────────────────────────────────────────────
  const validate = (): string | null => {
    if (!EMAIL_PATTERN.test(normalizedEmail)) return "Enter a valid email address.";
    if (!password) return "Password is required.";
    if (password.length < 8) return "Password must be at least 8 characters.";
    if (mode === "sign-up" && password !== confirmPassword) return "Passwords do not match.";
    if (!isSupabaseEmailAuthConfigured) return "Authentication is not configured.";
    return null;
  };

  // ── Submit handler ───────────────────────────────────────────────────────
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setStatus("loading");
    setError("");
    setSuccessMessage("");

    try {
      if (mode === "sign-up") {
        await signUpWithPassword(normalizedEmail, password);
        setSuccessMessage("Account created! Check your email to verify before signing in.");
        setMode("sign-in");
        setPassword("");
        setConfirmPassword("");
        setStatus("idle");
      } else {
        const { session } = await signInWithPassword(normalizedEmail, password);

        if (!session) {
          setError("Please verify your email before signing in. Check your inbox.");
          setStatus("idle");
          return;
        }

        const verifiedEmail = session.user.email?.trim().toLowerCase() ?? normalizedEmail;
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
        const savedProfile = await setProfile(nextProfile);
        navigate(getNextAppRoute(savedProfile), { replace: true });
      }
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : "Something went wrong. Please try again.";
      setError(message);
      setStatus("idle");
    }
  };

  // ── Switch mode ──────────────────────────────────────────────────────────
  const switchMode = () => {
    setMode(mode === "sign-in" ? "sign-up" : "sign-in");
    setError("");
    setSuccessMessage("");
    setPassword("");
    setConfirmPassword("");
  };

  // ── Guest login ──────────────────────────────────────────────────────────
  const handleGuestContinue = async () => {
    const nextProfile = {
      ...profile,
      email: "guest@focusflow.app",
      isAuthenticated: true,
    };
    const savedProfile = await setProfile(nextProfile);
    navigate(getNextAppRoute(savedProfile), { replace: true });
  };

  // ── Input class helper ──────────────────────────────────────────────────
  const inputClass = (hasError: boolean) =>
    `h-12 w-full rounded-full border bg-white/50 pl-11 pr-12 text-sm outline-none transition-all focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10 dark:bg-slate-800/50 dark:focus:border-brand-400 dark:focus:bg-slate-800 ${
      hasError ? "border-rose-400 dark:border-rose-500" : "border-slate-200 dark:border-slate-700"
    }`;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f8f9fc] text-slate-900 dark:bg-surface-900 dark:text-slate-100 font-sans selection:bg-brand-500/30">
      {/* Background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
        <div className="absolute left-[10%] top-[10%] h-[40vw] w-[40vw] animate-[spin_40s_linear_infinite] rounded-full bg-brand-200/40 blur-[100px] dark:bg-brand-700/20" />
        <div className="absolute right-[10%] bottom-[10%] h-[45vw] w-[45vw] animate-[spin_50s_linear_infinite_reverse] rounded-full bg-sky-200/40 blur-[120px] dark:bg-sky-700/15" />
      </div>

      <div className="relative z-10 w-full max-w-md px-6 animate-fade-up">
        <div className="overflow-hidden rounded-[2.5rem] border border-white/60 bg-white/60 p-8 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/60 sm:p-10">
          <div className="flex flex-col items-center text-center space-y-6">
            
            {/* Logo */}
            <div className="space-y-4 flex flex-col items-center">
              <Link to="/" className="group flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-sky-400 text-white shadow-lg transition-transform hover:scale-105">
                <img src="/focusflow-icon.svg" alt="FocusFlow Logo" className="h-7 w-7 brightness-0 invert transition-transform group-hover:rotate-12" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {mode === "sign-in" ? "Welcome back" : "Create your account"}
                </h1>
                <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                  {mode === "sign-in"
                    ? "Sign in to continue studying."
                    : "Start your focus journey today."}
                </p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="w-full space-y-4">
              {/* Email */}
              <div className="relative">
                <Mail size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  placeholder="Email address"
                  aria-required="true"
                  aria-invalid={!!error}
                  autoComplete="email"
                  className={inputClass(!!error)}
                />
              </div>

              {/* Password */}
              <div className="relative">
                <Lock size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  placeholder="Password"
                  aria-required="true"
                  autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
                  minLength={8}
                  className={inputClass(!!error)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Forgot password link */}
              {mode === "sign-in" && (
                <div className="flex justify-end pt-1">
                  <Link 
                    to="/forgot-password" 
                    className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
              )}

              {/* Confirm Password (sign-up only) */}
              {mode === "sign-up" && (
                <div className="relative">
                  <Lock size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                    placeholder="Confirm password"
                    aria-required="true"
                    autoComplete="new-password"
                    minLength={8}
                    className={inputClass(!!error)}
                  />
                </div>
              )}

              {mode === "sign-up" && (
                <p className="text-xs text-slate-400 dark:text-slate-500 text-left px-2">
                  Minimum 8 characters
                </p>
              )}

              {/* Error */}
              {error && (
                <p className="text-sm text-rose-500 text-left px-2">
                  {error}
                </p>
              )}

              {/* Success */}
              {successMessage && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                  {successMessage}
                </div>
              )}

              {/* Submit */}
              <Button
                type="submit"
                className="w-full h-12 justify-center rounded-full"
                disabled={status === "loading" || status === "verifying"}
              >
                {status === "loading"
                  ? mode === "sign-up"
                    ? "Creating account..."
                    : "Signing in..."
                  : status === "verifying"
                    ? "Verifying..."
                    : mode === "sign-up"
                      ? "Create Account"
                      : "Sign In"}
                <ArrowRight size={16} />
              </Button>
            </form>

            {/* Switch mode */}
            <div className="text-sm">
              <span className="text-slate-500 dark:text-slate-400">
                {mode === "sign-in" ? "Don't have an account? " : "Already have an account? "}
              </span>
              <button
                type="button"
                onClick={switchMode}
                className="font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 transition-colors"
              >
                {mode === "sign-in" ? "Sign up" : "Sign in"}
              </button>
            </div>

            {/* Divider */}
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-700" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-2 text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                  or
                </span>
              </div>
            </div>

            {/* Guest */}
            <button
              type="button"
              onClick={handleGuestContinue}
              className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            >
              Continue as guest
            </button>
            
          </div>
        </div>
        
        {/* Footer */}
        <div className="mt-8 flex justify-center gap-6 text-sm text-slate-500 dark:text-slate-400">
          <Link to="/privacy" className="hover:text-slate-900 dark:hover:text-white transition-colors">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-slate-900 dark:hover:text-white transition-colors">Terms of Use</Link>
        </div>
      </div>
    </div>
  );
};
