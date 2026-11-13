import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | Brainwhite",
};

export default function PrivacyPage() {
  return (
    <section className="min-h-screen bg-white p-6 text-black antialiased dark:bg-[#050505] dark:text-white">
      <div className="mx-auto max-w-3xl space-y-10">
        <header className="pt-12">
          <Link href="/" className="text-sm text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white">
            ← Back to Brainwhite
          </Link>
          <h1 className="mt-8 text-4xl font-medium tracking-tight">Privacy Policy</h1>
          <p className="mt-2 text-black/60 dark:text-white/50">Last updated: October 30, 2026</p>
        </header>

        <article className="prose prose-slate dark:prose-invert max-w-none space-y-8">
          <section>
            <h2>1. Information We Collect</h2>
            <p>We collect information you provide directly:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Account data: name, email, password (hashed), role, organisation name.</li>
              <li>Usage data: learning progress, task completion, GitHub activity (when linked).</li>
              <li>Communication data: messages you send to support, feedback.</li>
            </ul>
            <p>We also collect automatically:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Log data: IP address, browser type, access times, pages viewed.</li>
              <li>Cookie data: session cookies for authentication, preference cookies.</li>
            </ul>
          </section>

          <section>
            <h2>2. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide, maintain, and improve the Service.</li>
              <li>Authenticate you and manage your account.</li>
              <li>Send transactional emails (verification, password reset, invitations).</li>
              <li>Analyze usage to improve product features.</li>
              <li>Comply with legal obligations.</li>
            </ul>
          </section>

          <section>
            <h2>3. Sharing Your Information</h2>
            <p>We do not sell your personal data. We may share information:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Within your organisation: members with appropriate roles can see your learning progress and task activity.</li>
              <li>With service providers: hosting (Vercel), database (Supabase), email (Resend), AI providers (Google, Groq) — only as needed to operate the Service.</li>
              <li>Legal compliance: when required by law or to protect rights/safety.</li>
            </ul>
          </section>

          <section>
            <h2>4. GitHub Integration</h2>
            <p>
              If you link GitHub, we store your GitHub user ID, username, and an encrypted access token. We use this to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Fetch your repositories for codebase analysis.</li>
              <li>Receive webhook events for PR/task tracking.</li>
              <li>Create issues and PRs on your behalf (when you take actions in the app).</li>
            </ul>
            <p>You can unlink GitHub at any time from your account settings.</p>
          </section>

          <section>
            <h2>5. Data Retention</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Account data: retained while your account is active.</li>
              <li>Learning/task data: retained for the duration of your organisation's subscription.</li>
              <li>Logs: retained for up to 90 days for security and debugging.</li>
              <li>Deleted accounts: data purged within 30 days of deletion request.</li>
            </ul>
          </section>

          <section>
            <h2>6. Your Rights</h2>
            <p>Depending on your jurisdiction, you may have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access your personal data.</li>
              <li>Rectify inaccurate data.</li>
              <li>Erase your data ("right to be forgotten").</li>
              <li>Restrict or object to processing.</li>
              <li>Data portability.</li>
            </ul>
            <p>To exercise these rights, contact us at <a href="mailto:contact@brainwhite.com" className="underline">contact@brainwhite.com</a>.</p>
          </section>

          <section>
            <h2>7. Security</h2>
            <p>
              We implement appropriate technical and organisational measures: HTTPS/TLS encryption, bcrypt password hashing,
              encrypted storage for OAuth tokens, httpOnly secure cookies, and regular security reviews.
            </p>
          </section>

          <section>
            <h2>8. International Transfers</h2>
            <p>
              Your data may be processed in the United States and other countries where our service providers operate.
              We rely on standard contractual clauses and adequacy decisions for cross-border transfers.
            </p>
          </section>

          <section>
            <h2>9. Children's Privacy</h2>
            <p>The Service is not directed to children under 16. We do not knowingly collect personal data from children.</p>
          </section>

          <section>
            <h2>10. Changes to This Policy</h2>
            <p>We may update this Policy. Material changes will be communicated via email or in-app notification.</p>
          </section>

          <section>
            <h2>11. Contact</h2>
            <p>Questions about this Policy? Contact us at <a href="mailto:contact@brainwhite.com" className="underline">contact@brainwhite.com</a>.</p>
          </section>
        </article>

        <footer className="pt-8 border-t border-black/10 dark:border-white/10">
          <p className="text-sm text-black/50 dark:text-white/50">
            This is a template Privacy Policy document. Have legal counsel review before using in production.
          </p>
        </footer>
      </div>
    </section>
  );
}