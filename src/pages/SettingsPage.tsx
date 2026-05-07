import { useState } from "react";
import { DashboardContainer } from "../components/dashboard/DashboardContainer";
import { Button, Card, SectionContainer } from "../components/ui";
import { useFocusFlowData } from "../hooks/useFocusFlowData";
import { Palette, Clock, Activity, User, LogOut, Trash2 } from "lucide-react";
import { cn } from "../lib/cn";

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

export const SettingsPage = () => {
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

  const handleSaveProfile = () => {
    setProfile({ ...profile, name });
    alert("Profile saved successfully.");
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
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Display Name</label>
                  <div className="flex gap-2">
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="flex-1 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                    />
                    <Button onClick={handleSaveProfile} disabled={name === profile.name} className="px-4">Save</Button>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 pt-4 border-t border-slate-100 dark:border-slate-800/60">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Email Address</label>
                  <input
                    value={profile.email ?? "Not provided"}
                    disabled
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-500 cursor-not-allowed opacity-70"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-6">
                  <Button variant="secondary" className="flex-1 text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 border-transparent">
                    <LogOut size={16} className="mr-2" /> Sign Out
                  </Button>
                  <Button variant="secondary" className="flex-1 text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20 border-transparent">
                    <Trash2 size={16} className="mr-2" /> Delete Account
                  </Button>
                </div>
              </div>
            </Card>
          </section>

        </div>
      </SectionContainer>
    </DashboardContainer>
  );
};
