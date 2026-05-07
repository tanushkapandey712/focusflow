import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export const PrivacyPage = () => {
  useEffect(() => {
    try {
      const stored = localStorage.getItem("focusflow.darkmode.v1");
      const darkMode = stored ? JSON.parse(stored) === true : false;
      document.documentElement.classList.toggle("dark", darkMode);
    } catch {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  return (
    <div className="relative min-h-screen w-full bg-[#f8f9fc] text-slate-900 dark:bg-surface-900 dark:text-slate-100 font-sans selection:bg-brand-500/30">
      {/* Background Animated Blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute -left-[10%] -top-[10%] h-[50vw] w-[50vw] animate-[spin_40s_linear_infinite] rounded-full bg-brand-200/20 blur-[120px] dark:bg-brand-700/10" />
        <div className="absolute right-[10%] top-[20%] h-[40vw] w-[40vw] animate-[spin_50s_linear_infinite_reverse] rounded-full bg-indigo-200/20 blur-[100px] dark:bg-indigo-700/10" />
      </div>

      {/* Sticky Navigation */}
      <nav className="sticky top-0 z-50 flex items-center px-6 py-4 md:px-12 backdrop-blur-md bg-white/60 dark:bg-surface-900/60 border-b border-slate-200/50 dark:border-white/5">
        <Link to="/" className="flex items-center gap-2 group transition-opacity hover:opacity-80">
          <ArrowLeft size={18} className="text-slate-500 dark:text-slate-400 group-hover:-translate-x-1 transition-transform" />
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-indigo-500 shadow-soft">
            <img src="/focusflow-icon.svg" alt="FocusFlow Logo" className="h-5 w-5 brightness-0 invert" />
          </div>
          <span className="text-xl font-bold tracking-tight">FocusFlow</span>
        </Link>
      </nav>

      <main className="relative z-10 mx-auto max-w-3xl px-6 py-16 md:py-24">
        <article className="prose prose-slate dark:prose-invert prose-headings:font-bold prose-headings:tracking-tight max-w-none">
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Privacy Policy</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Last updated: May 8, 2026</p>
          </div>

          <div className="space-y-10">
            <section>
              <h2 className="text-2xl border-b border-slate-200 dark:border-slate-800 pb-2 mb-4">1. Introduction</h2>
              <p>
                Welcome to FocusFlow! This Privacy Policy explains how we collect, use, and protect your information when you use our study productivity application. FocusFlow is built to help students stay organized and build consistent study habits. We believe in transparency and only collect the data necessary to make the app work for you.
              </p>
            </section>

            <section>
              <h2 className="text-2xl border-b border-slate-200 dark:border-slate-800 pb-2 mb-4">2. Information We Collect</h2>
              <p>When you use FocusFlow, we may collect the following types of information:</p>
              <ul>
                <li><strong>Account Information:</strong> Your email address and basic profile details when you sign in via Google or email authentication.</li>
                <li><strong>Study Data:</strong> Information you input into the app, including syllabus structures, subjects, topics, and study goals.</li>
                <li><strong>Usage Data:</strong> Analytics on how you interact with the app, such as session durations, completion rates, and streak tracking.</li>
                <li><strong>Device Information:</strong> Basic browser and device details required to maintain active sessions and sync your preferences.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl border-b border-slate-200 dark:border-slate-800 pb-2 mb-4">3. How Your Information is Used</h2>
              <p>We use the collected data strictly to provide and improve the FocusFlow experience:</p>
              <ul>
                <li>To maintain your account and sync your study progress across sessions.</li>
                <li>To generate your personal productivity analytics, heatmaps, and study trends.</li>
                <li>To provide smart, personalized AI study suggestions based on your completion history and performance.</li>
                <li>To troubleshoot errors and improve the overall stability of the application.</li>
              </ul>
              <p>We do not sell your personal data to advertisers or data brokers.</p>
            </section>

            <section>
              <h2 className="text-2xl border-b border-slate-200 dark:border-slate-800 pb-2 mb-4">4. Study & Analytics Usage</h2>
              <p>
                Your study analytics (such as focus scores, time spent per subject, and daily consistency) are processed to build your personal Dashboard and Analytics pages. This data is private to your account and is used solely to help you visualize your academic progress.
              </p>
            </section>

            <section>
              <h2 className="text-2xl border-b border-slate-200 dark:border-slate-800 pb-2 mb-4">5. Optional Focus & Camera Tracking</h2>
              <p>
                FocusFlow offers optional distraction tracking features, including tab-switching detection and local camera-based posture/focus tracking ("Desk Mode").
              </p>
              <ul>
                <li><strong>Local Processing:</strong> If you enable camera tracking, all image processing happens <em>locally on your device</em> using your browser. </li>
                <li><strong>No Cloud Uploads:</strong> We do not record, transmit, or store any video feeds, images, or biometric data on our servers. The camera is only used in real-time to compute a numeric "focus score".</li>
                <li><strong>Opt-in Only:</strong> These features are strictly opt-in and can be disabled at any time in your Settings.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl border-b border-slate-200 dark:border-slate-800 pb-2 mb-4">6. Data Storage & Security</h2>
              <p>
                We use industry-standard cloud providers to store your account and study data securely. While we take reasonable steps to protect your data, please remember that no method of electronic storage or transmission over the internet is 100% secure. Because FocusFlow is an early-stage productivity tool, we recommend not storing highly sensitive or confidential information within the app's notes or goals.
              </p>
            </section>

            <section>
              <h2 className="text-2xl border-b border-slate-200 dark:border-slate-800 pb-2 mb-4">7. Third-Party Services</h2>
              <p>We may use trusted third-party services to operate the application:</p>
              <ul>
                <li><strong>Authentication:</strong> We use external providers (like Supabase or Google) to securely handle login credentials. FocusFlow does not store your passwords directly.</li>
                <li><strong>Hosting & Database:</strong> Your syllabus and session data are stored on secure cloud databases managed by our hosting partners.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl border-b border-slate-200 dark:border-slate-800 pb-2 mb-4">8. Your Rights and Controls</h2>
              <p>You have full control over your data within FocusFlow:</p>
              <ul>
                <li>You can edit or delete your study sessions, goals, and syllabus data at any time through the app interface.</li>
                <li>You can completely delete your account and associated data via the Settings page.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl border-b border-slate-200 dark:border-slate-800 pb-2 mb-4">9. Contact Us</h2>
              <p>
                If you have any questions or concerns about this Privacy Policy or how your data is handled, please contact us at:
              </p>
              <p className="font-semibold text-brand-600 dark:text-brand-400">
                <a href="mailto:focusflow.studytracker@gmail.com" className="hover:underline">focusflow.studytracker@gmail.com</a>
              </p>
            </section>
          </div>
        </article>
      </main>

      <footer className="relative z-10 border-t border-slate-200/50 bg-white/50 px-6 py-8 backdrop-blur-md dark:border-white/5 dark:bg-surface-900/50 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} FocusFlow. All rights reserved.
      </footer>
    </div>
  );
};
