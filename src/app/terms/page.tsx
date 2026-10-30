import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | Brainwhite",
};

export default function TermsPage() {
  return (
    <section className="min-h-screen bg-white p-6 text-black antialiased dark:bg-[#050505] dark:text-white">
      <div className="mx-auto max-w-3xl space-y-10">
        <header className="pt-12">
          <Link href="/" className="text-sm text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white">
            ← Back to Brainwhite
          </Link>
          <h1 className="mt-8 text-4xl font-medium tracking-tight">Terms of Service</h1>
          <p className="mt-2 text-black/60 dark:text-white/50">Last updated: October 30, 2026</p>
        </header>

        <article className="prose prose-slate dark:prose-invert max-w-none space-y-8">
          <section>
            <h2>1. Acceptance of Terms</h2>
            <p>
              By creating an account or using Brainwhite ("the Service"), you agree to these Terms of Service ("Terms").
              If you do not agree, you may not use the Service.
            </p>
          </section>

          <section>
            <h2>2. Your Account</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>You must provide accurate, complete registration information.</li>
              <li>You are responsible for safeguarding your password and for all activity under your account.</li>
              <li>Organisations may have multiple members with different roles (Owner, Manager, Mentor, Candidate).</li>
            </ul>
          </section>

          <section>
            <h2>3. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Violate any applicable law or regulation.</li>
              <li>Attempt to gain unauthorized access to the Service or other users' accounts.</li>
              <li>Interfere with the security or performance of the Service.</li>
              <li>Use the Service to store or transmit malicious code.</li>
            </ul>
          </section>

          <section>
            <h2>4. Intellectual Property</h2>
            <p>
              Brainwhite and its original content, features, and functionality are owned by Brainwhite Inc. and are protected
              by international copyright, trademark, and other intellectual property laws.
            </p>
          </section>

          <section>
            <h2>5. User Content</h2>
            <p>
              You retain ownership of content you submit (code, learning paths, tasks, reports). By submitting content,
              you grant Brainwhite a worldwide, non-exclusive, royalty-free license to use, reproduce, and display that
              content solely to provide the Service.
            </p>
          </section>

          <section>
            <h2>6. Privacy</h2>
            <p>Your use of the Service is also governed by our <Link href="/privacy" className="underline">Privacy Policy</Link>.</p>
          </section>

          <section>
            <h2>7. Termination</h2>
            <p>
              We may suspend or terminate your access to the Service at any time, with or without cause, including for
              breach of these Terms. Upon termination, your right to use the Service ceases immediately.
            </p>
          </section>

          <section>
            <h2>8. Disclaimer of Warranties</h2>
            <p>
              The Service is provided "as is" and "as available" without warranties of any kind, either express or implied,
              including but not limited to implied warranties of merchantability, fitness for a particular purpose,
              and non-infringement.
            </p>
          </section>

          <section>
            <h2>9. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, Brainwhite Inc. shall not be liable for any indirect, incidental,
              special, consequential, or punitive damages, or any loss of profits, data, or business opportunities.
            </p>
          </section>

          <section>
            <h2>10. Governing Law</h2>
            <p>These Terms shall be governed by the laws of the State of Delaware, USA, without regard to conflict of law principles.</p>
          </section>

          <section>
            <h2>11. Changes to Terms</h2>
            <p>
              We may modify these Terms at any time. Material changes will be communicated via email or through the Service.
              Continued use after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2>12. Contact</h2>
            <p>Questions about these Terms? Contact us at <a href="mailto:contact@brainwhite.com" className="underline">contact@brainwhite.com</a>.</p>
          </section>
        </article>

        <footer className="pt-8 border-t border-black/10 dark:border-white/10">
          <p className="text-sm text-black/50 dark:text-white/50">
            This is a template Terms of Service document. Have legal counsel review before using in production.
          </p>
        </footer>
      </div>
    </section>
  );
}