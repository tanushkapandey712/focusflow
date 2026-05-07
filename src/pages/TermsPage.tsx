import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export const TermsPage = () => {
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
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Terms of Use</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Last updated: May 8, 2026</p>
          </div>

          <div className="space-y-10">
            <section>
              <h2 className="text-2xl border-b border-slate-200 dark:border-slate-800 pb-2 mb-4">1. Acceptance of Terms</h2>
              <p>
                By accessing or using FocusFlow, you agree to be bound by these Terms of Use. If you do not agree with any part of these terms, you may not use our service. FocusFlow is currently provided "as is" and is intended for personal, educational productivity tracking.
              </p>
            </section>

            <section>
              <h2 className="text-2xl border-b border-slate-200 dark:border-slate-800 pb-2 mb-4">2. Educational & Productivity Use</h2>
              <p>
                FocusFlow is an indie-built tool designed to help students manage their study sessions, track their syllabi, and build better focus habits. The analytics and AI suggestions provided are for motivational and informational purposes only and do not guarantee academic performance or outcomes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl border-b border-slate-200 dark:border-slate-800 pb-2 mb-4">3. User Responsibilities</h2>
              <p>When using FocusFlow, you agree to the following responsibilities:</p>
              <ul>
                <li>You will provide accurate information during profile setup.</li>
                <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
                <li>You will use the app in a manner consistent with its purpose (study productivity).</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl border-b border-slate-200 dark:border-slate-800 pb-2 mb-4">4. Data and Account Responsibility</h2>
              <p>
                You retain ownership of the study data you input into FocusFlow. However, you are solely responsible for backing up any critical notes or syllabus structures. As an early-stage application, we cannot guarantee that data will never be lost or corrupted due to unforeseen technical issues.
              </p>
            </section>

            <section>
              <h2 className="text-2xl border-b border-slate-200 dark:border-slate-800 pb-2 mb-4">5. Prohibited Misuse</h2>
              <p>You agree not to engage in any of the following prohibited activities:</p>
              <ul>
                <li>Attempting to bypass authentication or gain unauthorized access to other users' data.</li>
                <li>Using automated bots, scripts, or scrapers to interact with the application.</li>
                <li>Using the application to store or transmit illegal, abusive, or harmful content.</li>
                <li>Reverse-engineering the application's source code or proprietary focus tracking algorithms.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl border-b border-slate-200 dark:border-slate-800 pb-2 mb-4">6. Feature Availability Disclaimer</h2>
              <p>
                FocusFlow is in active development. Features such as the "Desk Mode" camera tracking, AI-driven analytics, and specific syllabus integrations are provided on an experimental basis. We reserve the right to modify, pause, or remove features at any time without prior notice as we refine the platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl border-b border-slate-200 dark:border-slate-800 pb-2 mb-4">7. Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by law, the creators of FocusFlow shall not be liable for any indirect, incidental, special, or consequential damages resulting from your use of the application. We do not warrant that the application will be completely error-free or uninterrupted.
              </p>
            </section>

            <section>
              <h2 className="text-2xl border-b border-slate-200 dark:border-slate-800 pb-2 mb-4">8. Updates to Terms</h2>
              <p>
                We may update these Terms of Use periodically as the application grows and evolves. We will indicate the "Last updated" date at the top of this page. Continued use of the application after changes are published constitutes your acceptance of the new terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl border-b border-slate-200 dark:border-slate-800 pb-2 mb-4">9. Contact Information</h2>
              <p>
                If you have questions about these Terms of Use, please reach out to us at:
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
