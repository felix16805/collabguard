import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy — CollabGuard",
  description: "CollabGuard privacy policy — what data is collected, how it is used, and your rights.",
}

export default function PrivacyPolicyPage() {
  const updated = "22 September 2025"
  return (
    <article className="page-content max-w-3xl mx-auto px-6 py-24">
      <header className="mb-16 flex flex-col gap-4">
        <p className="font-mono text-xs text-[var(--text-muted)] uppercase tracking-widest">Legal</p>
        <h1 className="font-display font-semibold text-[var(--text-primary)]">Privacy Policy</h1>
        <p className="text-sm text-[var(--text-muted)] font-mono">Last updated: {updated}</p>
      </header>

      <div className="flex flex-col gap-12 text-[var(--text-secondary)]">
        <section>
          <h2 className="font-display font-semibold text-xl text-[var(--text-primary)] mb-4">What this service is</h2>
          <p>CollabGuard is an academic project operated by Dipanjan Das (VIT, BCSE406L NS25). It is not a commercial service. It is made available for academic demonstration purposes only.</p>
        </section>

        <section>
          <h2 className="font-display font-semibold text-xl text-[var(--text-primary)] mb-4">Data we collect</h2>
          <div className="flex flex-col gap-3">
            <p><strong className="text-[var(--text-primary)]">Account data:</strong> Your email address and display name, provided at signup. Used only to authenticate you and associate your submissions with your account.</p>
            <p><strong className="text-[var(--text-primary)]">Submitted files:</strong> Source code files you upload for analysis. Stored in a private Supabase Storage bucket, accessible only to you and to instructors in your course. Files are never shared with third parties.</p>
            <p><strong className="text-[var(--text-primary)]">Usage analytics:</strong> This site uses Plausible Analytics — a privacy-respecting tool that collects no cookies and no personal data. Plausible records: page path, referrer, browser type, country (derived from IP, not stored). IP addresses are never stored. See <a href="https://plausible.io/data-policy" className="text-[var(--accent-text)] underline underline-offset-2" target="_blank" rel="noopener noreferrer">Plausible&apos;s data policy</a>.</p>
            <p><strong className="text-[var(--text-primary)]">Contact form:</strong> Name, email, subject, and message — used only to respond to your enquiry. Not stored in a marketing database.</p>
          </div>
        </section>

        <section>
          <h2 className="font-display font-semibold text-xl text-[var(--text-primary)] mb-4">Cookies</h2>
          <p>The only cookies set are <strong className="text-[var(--text-primary)]">authentication session cookies</strong> (httpOnly, SameSite=Strict). These are essential for the service to function. No analytics cookies, no advertising cookies, no third-party tracking cookies.</p>
        </section>

        <section>
          <h2 className="font-display font-semibold text-xl text-[var(--text-primary)] mb-4">Your rights</h2>
          <p>You may request deletion of your account and all associated data at any time by contacting the author at the address on the <a href="/contact" className="text-[var(--accent-text)] underline underline-offset-2">contact page</a>. Deletion will be completed within 7 days.</p>
        </section>

        <section>
          <h2 className="font-display font-semibold text-xl text-[var(--text-primary)] mb-4">Changes</h2>
          <p>If this policy changes materially, registered users will be notified by email. The &quot;last updated&quot; date at the top will reflect any changes.</p>
        </section>
      </div>
    </article>
  )
}
