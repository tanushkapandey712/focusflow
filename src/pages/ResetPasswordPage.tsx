import { useState, useEffect } from "react";
import { ArrowRight, Lock, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui";
import { updateUserPassword, isSupabaseEmailAuthConfigured } from "../services/auth/supabaseEmailAuth";

export const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");

  useEffect(() => {
    // If the user lands here directly without a `#access_token` hash in the URL,
    // they might not have the session established by Supabase's redirect.
    // However, Supabase automatically handles the hash and sets the session on load.
    // So we just rely on `updateUserPassword` doing its job with the current session.
  }, []);

  const validate = (): string | null => {
    if (!password) return "Password is required.";
    if (password.length < 8) return "Password must be at least 8 characters.";
    if (password !== confirmPassword) return "Passwords do not match.";
    if (!isSupabaseEmailAuthConfigured) return "Authentication is not configured.";
    return null;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setStatus("loading");
    setError("");

    try {
      await updateUserPassword(password);
      setStatus("success");
      
      // Give them a moment to read the success message before redirecting
      setTimeout(() => {
        navigate("/sign-in", { replace: true });
      }, 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(message);
      setStatus("idle");
    }
  };

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
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-sky-400 text-white shadow-lg">
                <img src="/focusflow-icon.svg" alt="FocusFlow Logo" className="h-7 w-7 brightness-0 invert" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Set New Password
                </h1>
                <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                  Please enter a strong new password below.
                </p>
              </div>
            </div>

            {/* Form */}
            {status === "success" ? (
              <div className="w-full space-y-4">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                  Password successfully updated! Redirecting to sign in...
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="w-full space-y-4">
                {/* Password */}
                <div className="relative">
                  <Lock size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                    placeholder="New password"
                    aria-required="true"
                    autoComplete="new-password"
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

                {/* Confirm Password */}
                <div className="relative">
                  <Lock size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                    placeholder="Confirm new password"
                    aria-required="true"
                    autoComplete="new-password"
                    minLength={8}
                    className={inputClass(!!error)}
                  />
                </div>

                <p className="text-xs text-slate-400 dark:text-slate-500 text-left px-2">
                  Minimum 8 characters
                </p>

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
                  {status === "loading" ? "Updating..." : "Update Password"}
                  {!status && <ArrowRight size={16} />}
                </Button>
              </form>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
};
