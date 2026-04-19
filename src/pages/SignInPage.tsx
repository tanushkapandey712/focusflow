import { useEffect, useRef, useState } from "react";
import { ArrowRight, CheckCircle2, Mail, Sparkles } from "lucide-react";
import { Navigate, Link, useNavigate } from "react-router-dom";
import { Button, Card, GradientCard } from "../components/ui";
import { useFocusFlowData } from "../hooks/useFocusFlowData";
import {
  getCurrentEmailAuthSession,
  isSupabaseEmailAuthConfigured,
  onEmailAuthStateChange,
  sendVerificationEmailLink,
} from "../services/auth/supabaseEmailAuth";
import { EMAIL_PATTERN, getNextAppRoute } from "../utils/profile";

const authHighlights = [
  "Passwordless email verification that stays simple.",
  "Fast access back into the same study workspace.",
  "Subjects, schedule, and profile details stay editable later.",
] as const;

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
      setError("Add your Supabase URL and anon key before sending verification emails.");
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

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f7f8ff] text-slate-900 dark:bg-surface-900 dark:text-slate-100">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-5rem] top-[-4rem] h-72 w-72 rounded-full bg-brand-100/80 blur-3xl dark:bg-brand-700/15" />
        <div className="absolute right-[-4rem] top-16 h-72 w-72 rounded-full bg-cyan-200/70 blur-3xl dark:bg-sky-500/12" />
        <div className="absolute bottom-[-2rem] left-1/3 h-80 w-80 rounded-full bg-pastel-peach/65 blur-3xl dark:bg-orange-300/8" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid w-full gap-6 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
          <GradientCard tone="lavender" className="overflow-hidden p-7 sm:p-8">
            <div className="space-y-6">
              <Link to="/" className="inline-flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-950 via-brand-700 to-sky-400 text-white shadow-soft">
                  <Sparkles size={18} />
                </div>
                <div>
                  <p className="text-lg font-semibold tracking-tight text-slate-900">FocusFlow</p>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Calm Study System</p>
                </div>
              </Link>

              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">Secure Access</p>
                <h1 className="text-balance text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
                  Sign in with your email.
                </h1>
                <p className="max-w-xl text-base leading-7 text-slate-600">
                  Verify once, come back quickly, and keep the study flow uninterrupted.
                </p>
              </div>

              <div className="grid gap-3">
                {authHighlights.map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-3xl bg-white/70 p-4 shadow-soft">
                    <CheckCircle2 size={18} className="mt-0.5 text-brand-600" />
                    <p className="text-sm leading-6 text-slate-700">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </GradientCard>

          <Card className="space-y-6 p-6 sm:p-7 dark:bg-slate-800/90">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                  Email verification
                </h2>
                <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">
                  Enter the email you want to use with FocusFlow.
                </p>
              </div>

              <label className="space-y-1.5">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Email address</span>
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
                    className="field-surface pl-11"
                  />
                </div>
              </label>

              {!isAuthConfigured ? (
                <div className="rounded-3xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-6 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
                  Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env` to enable email verification.
                </div>
              ) : null}

              {status === "sent" && sentEmail ? (
                <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm leading-6 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100">
                  Check your inbox. We sent a secure verification link to `{sentEmail}`.
                </div>
              ) : null}

              {error ? (
                <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
                  {error}
                </p>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No password needed. Once verified, you&apos;ll continue straight into FocusFlow.
                </p>
              )}

              <Button
                type="submit"
                className="w-full justify-center"
                disabled={status === "sending" || status === "verifying" || !isAuthConfigured}
              >
                {status === "sending"
                  ? "Sending link..."
                  : status === "verifying"
                    ? "Verifying..."
                    : "Send verification link"}
                <ArrowRight size={16} />
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};
