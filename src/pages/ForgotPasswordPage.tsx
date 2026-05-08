import { useState } from "react";
import { ArrowRight, Mail, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui";
import { resetPasswordForEmail, isSupabaseEmailAuthConfigured } from "../services/auth/supabaseEmailAuth";
import { EMAIL_PATTERN } from "../utils/profile";

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");

  const normalizedEmail = email.trim().toLowerCase();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      setError("Enter a valid email address.");
      return;
    }

    if (!isSupabaseEmailAuthConfigured) {
      setError("Authentication is not configured.");
      return;
    }

    setStatus("loading");
    setError("");

    try {
      await resetPasswordForEmail(normalizedEmail);
      setStatus("success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(message);
      setStatus("idle");
    }
  };

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
                  Reset Password
                </h1>
                <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                  Enter your email and we'll send a link to reset your password.
                </p>
              </div>
            </div>

            {/* Form */}
            {status === "success" ? (
              <div className="w-full space-y-6">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                  Password reset link sent. Check your email.
                </div>
                <Link to="/sign-in" className="flex items-center justify-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 transition-colors">
                  <ArrowLeft size={16} />
                  Back to Sign In
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="w-full space-y-4">
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
                    className={`h-12 w-full rounded-full border bg-white/50 pl-11 pr-4 text-sm outline-none transition-all focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10 dark:bg-slate-800/50 dark:focus:border-brand-400 dark:focus:bg-slate-800 ${
                      error ? "border-rose-400 dark:border-rose-500" : "border-slate-200 dark:border-slate-700"
                    }`}
                  />
                </div>

                {/* Error */}
                {error && (
                  <p className="text-sm text-rose-500 text-left px-2">
                    {error}
                  </p>
                )}

                {/* Submit */}
                <Button
                  type="submit"
                  className="w-full h-12 justify-center rounded-full"
                  disabled={status === "loading"}
                >
                  {status === "loading" ? "Sending..." : "Send Reset Link"}
                  {!status && <ArrowRight size={16} />}
                </Button>
                
                <div className="pt-4 text-center">
                  <Link to="/sign-in" className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
                    Back to Sign In
                  </Link>
                </div>
              </form>
            )}
            
          </div>
        </div>
        
      </div>
    </div>
  );
};
