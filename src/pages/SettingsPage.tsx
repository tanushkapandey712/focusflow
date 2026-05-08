import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardContainer } from "../components/dashboard/DashboardContainer";
import { Button, Card, SectionContainer } from "../components/ui";
import { useFocusFlowData } from "../hooks/useFocusFlowData";
import { Palette, Clock, Activity, User, LogOut, Trash2, AlertTriangle, Loader2, X } from "lucide-react";
import { cn } from "../lib/cn";
import { signOut } from "../services/auth/supabaseEmailAuth";
import { deleteAllUserData } from "../services/data/supabaseDataService";
import { getCurrentUserId } from "../services/data/supabaseClient";

// Simple toggle switch component for settings
const SettingToggle = ({ label, description, checked, onChange }: { label: string, description?: string, checked: boolean, onChange: (val: boolean) => void }) => (
  <div className="flex items-center justify-between py-3">
    <div>
      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{label}</p>
      {description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>}
    </div>
    <button 
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900",
        checked ? "bg-brand-500" : "bg-slate-200 dark:bg-slate-700"
      )}
    >
      <span className={cn(
        "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
        checked ? "translate-x-5" : "translate-x-0"
      )} />
    </button>
  </div>
);

// Simple select component for settings
const SettingSelect = ({ label, options, value, onChange }: { label: string, options: {label: string, value: string}[], value: string, onChange: (val: string) => void }) => (
  <div className="flex items-center justify-between py-3">
    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{label}</p>
    <select 
      value={value} 
      onChange={(e) => onChange(e.target.value)}
      className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

// ──────────────────────────────────────────────────────────────────────────────
// Delete Account Confirmation Modal
// ──────────────────────────────────────────────────────────────────────────────

const CONFIRM_TEXT = "DELETE";

interface DeleteModalProps {
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

const DeleteAccountModal = ({ onConfirm, onCancel }: DeleteModalProps) => {
  const [confirmInput, setConfirmInput] = useState("");
  const [status, setStatus] = useState<"idle" | "deleting" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const isConfirmed = confirmInput.trim().toUpperCase() === CONFIRM_TEXT;

  const handleDelete = async () => {
    if (!isConfirmed) return;
    setStatus("deleting");
    setErrorMsg("");
    try {
      await onConfirm();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-up">
      <div className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-white/60 bg-white/90 p-6 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/90 sm:p-8">
        <button
          onClick={onCancel}
          disabled={status === "deleting"}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-50"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <div className="flex flex-col items-center text-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-rose-100 dark:bg-rose-500/15 flex items-center justify-center">
            <AlertTriangle size={28} className="text-rose-600 dark:text-rose-400" />
          </div>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            Delete your account?
          </h2>

          <div className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed space-y-2">
            <p>This will <strong className="text-rose-600 dark:text-rose-400">permanently delete</strong> all your data:</p>
            <ul className="text-left text-xs space-y-1 bg-rose-50 dark:bg-rose-500/10 rounded-xl p-3">
              <li>• Your profile and preferences</li>
              <li>• All subjects, units, and topics</li>
              <li>• All study sessions and analytics</li>
              <li>• All goals and milestones</li>
            </ul>
            <p className="font-semibold text-rose-600 dark:text-rose-400">This action cannot be undone.</p>
          </div>

          <div className="w-full space-y-2">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block text-left">
              Type <span className="font-bold text-rose-600 dark:text-rose-400">{CONFIRM_TEXT}</span> to confirm
            </label>
            <input
              type="text"
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              disabled={status === "deleting"}
              placeholder={CONFIRM_TEXT}
              autoComplete="off"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-400 disabled:opacity-50"
            />
          </div>

          {errorMsg && (
            <p className="text-sm text-rose-500 bg-rose-50 dark:bg-rose-500/10 w-full rounded-xl p-3">{errorMsg}</p>
          )}

          <div className="flex gap-3 w-full mt-1">
            <Button
              variant="secondary"
              onClick={onCancel}
              disabled={status === "deleting"}
              className="flex-1"
            >
              Cancel
            </Button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={!isConfirmed || status === "deleting"}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all",
                isConfirmed
                  ? "bg-rose-600 text-white hover:bg-rose-700 shadow-sm"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-600",
              )}
            >
              {status === "deleting" ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 size={16} />
                  Delete Account
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────────────────────────────────────
// Settings Page
// ──────────────────────────────────────────────────────────────────────────────

export const SettingsPage = () => {
  const navigate = useNavigate();
  const { profile, setProfile } = useFocusFlowData();

  // Appearance
  const [theme, setTheme] = useState("system");
  const [calmMode, setCalmMode] = useState(true);
  const [accentColor, setAccentColor] = useState("blue");

  // Timer
  const [defaultDuration, setDefaultDuration] = useState("25");
  const [breakInterval, setBreakInterval] = useState("5");
  const [autoStart, setAutoStart] = useState(false);

  // Tracking
  const [cameraTracking, setCameraTracking] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [focusDetection, setFocusDetection] = useState(true);

  // Account
  const [name, setName] = useState(profile.name);
  const [nameError, setNameError] = useState("");

  // Logout / Delete state
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleSaveProfile = () => {
    if (!name.trim()) {
      setNameError("Display name is required.");
      return;
    }
    setProfile({ ...profile, name: name.trim() });
    setNameError("");
  };

  // ── Logout ───────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      // Clear app state except harmless preferences
      const theme = localStorage.getItem("focusflow.theme");
      const sidebar = localStorage.getItem("focusflow.sidebarCollapsed");

      await signOut();

      // Clear all focusflow localStorage
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith("focusflow.")) keysToRemove.push(key);
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));

      // Restore harmless preferences
      if (theme) localStorage.setItem("focusflow.theme", theme);
      if (sidebar) localStorage.setItem("focusflow.sidebarCollapsed", sidebar);

      navigate("/", { replace: true });
    } catch (err) {
      console.error("Logout failed:", err);
      setIsLoggingOut(false);
    }
  };

  // ── Delete Account ───────────────────────────────────────────────────────
  const handleDeleteAccount = async () => {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error("Not signed in.");

    // 1. Wipe all user data from Supabase tables
    await deleteAllUserData(userId);

    // 2. Sign out
    await signOut();

    // 3. Clear all localStorage
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("focusflow.")) keysToRemove.push(key);
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));

    // 4. Redirect to landing
    navigate("/", { replace: true });
  };

  return (
    <DashboardContainer className="max-w-2xl">
      <SectionContainer
        title="Settings"
        description="Customize your workspace, tracking preferences, and account details."
      >
        <div className="space-y-6">

          {/* 1. Appearance */}
          <section>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
              <Palette size={16} /> Appearance
            </h3>
            <Card className="p-4 sm:p-5 divide-y divide-slate-100 dark:divide-slate-800/60">
              <SettingSelect 
                label="Theme" 
                options={[{label: "System", value: "system"}, {label: "Light", value: "light"}, {label: "Dark", value: "dark"}]}
                value={theme}
                onChange={setTheme}
              />
              <SettingToggle 
                label="Calm Mode" 
                description="Reduces visual noise and aggressive UI animations."
                checked={calmMode}
                onChange={setCalmMode}
              />
              <SettingSelect 
                label="Accent Color" 
                options={[{label: "Soft Blue", value: "blue"}, {label: "Lavender", value: "purple"}, {label: "Mint", value: "green"}]}
                value={accentColor}
                onChange={setAccentColor}
              />
            </Card>
          </section>

          {/* 2. Timer Settings */}
          <section>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
              <Clock size={16} /> Timer Settings
            </h3>
            <Card className="p-4 sm:p-5 divide-y divide-slate-100 dark:divide-slate-800/60">
              <SettingSelect 
                label="Default Session Duration" 
                options={[{label: "25 minutes", value: "25"}, {label: "45 minutes", value: "45"}, {label: "60 minutes", value: "60"}]}
                value={defaultDuration}
                onChange={setDefaultDuration}
              />
              <SettingSelect 
                label="Default Break Duration" 
                options={[{label: "5 minutes", value: "5"}, {label: "10 minutes", value: "10"}, {label: "15 minutes", value: "15"}]}
                value={breakInterval}
                onChange={setBreakInterval}
              />
              <SettingToggle 
                label="Auto-start Breaks" 
                description="Automatically start the break timer when a session ends."
                checked={autoStart}
                onChange={setAutoStart}
              />
            </Card>
          </section>

          {/* 3. Tracking */}
          <section>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
              <Activity size={16} /> Tracking
            </h3>
            <Card className="p-4 sm:p-5 divide-y divide-slate-100 dark:divide-slate-800/60">
              <SettingToggle 
                label="Camera Distraction Tracking" 
                description="Use your webcam to track physical distractions."
                checked={cameraTracking}
                onChange={setCameraTracking}
              />
              <SettingToggle 
                label="Smart Focus Detection" 
                description="Detect tab switches and mouse inactivity."
                checked={focusDetection}
                onChange={setFocusDetection}
              />
              <SettingToggle 
                label="Session Notifications" 
                description="Get notified when it's time to start or take a break."
                checked={notifications}
                onChange={setNotifications}
              />
            </Card>
          </section>

          {/* 4. Account */}
          <section>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
              <User size={16} /> Account
            </h3>
            <Card className="p-4 sm:p-5">
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Display Name <span className="text-rose-500" aria-hidden="true">*</span></label>
                  <div className="flex gap-2">
                    <input
                      value={name}
                      onChange={(e) => { setName(e.target.value); setNameError(""); }}
                      aria-required="true"
                      aria-invalid={!!nameError}
                      className={`flex-1 bg-slate-50 dark:bg-slate-900/50 border rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none ${nameError ? "border-rose-400 dark:border-rose-500" : "border-slate-200 dark:border-slate-800"}`}
                    />
                    <Button onClick={handleSaveProfile} disabled={name === profile.name || !name.trim()} className="px-4">Save</Button>
                  </div>
                  {nameError && <p className="text-xs text-rose-500">{nameError}</p>}
                </div>

                <div className="flex flex-col gap-1.5 pt-4 border-t border-slate-100 dark:border-slate-800/60">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Email Address</label>
                  <input
                    value={profile.email ?? "Not provided"}
                    disabled
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-500 cursor-not-allowed opacity-70"
                  />
                </div>

                {/* Sign Out */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60">
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-all disabled:opacity-50"
                  >
                    {isLoggingOut ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Signing out...
                      </>
                    ) : (
                      <>
                        <LogOut size={16} />
                        Sign Out
                      </>
                    )}
                  </button>
                </div>
              </div>
            </Card>
          </section>

          {/* 5. Danger Zone */}
          <section>
            <h3 className="text-sm font-bold uppercase tracking-wider text-rose-500/80 mb-3 flex items-center gap-2">
              <AlertTriangle size={16} /> Danger Zone
            </h3>
            <div className="rounded-2xl border-2 border-dashed border-rose-200 dark:border-rose-500/20 p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Delete Account</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Permanently remove your account and all associated data. This cannot be undone.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  className="flex items-center justify-center gap-2 shrink-0 rounded-xl px-5 py-2.5 text-sm font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20 transition-all"
                >
                  <Trash2 size={16} />
                  Delete Account
                </button>
              </div>
            </div>
          </section>

        </div>
      </SectionContainer>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <DeleteAccountModal
          onConfirm={handleDeleteAccount}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </DashboardContainer>
  );
};
