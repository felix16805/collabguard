import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms of Use — CollabGuard",
  description: "CollabGuard terms of use — permitted uses, uploaded content, and limitations of liability.",
}

export default function TermsPage() {
  return (
    <article className="page-content max-w-3xl mx-auto px-6 py-24">
      <header className="mb-16 flex flex-col gap-4">
        <p className="font-mono text-xs text-[var(--text-muted)] uppercase tracking-widest">Legal</p>
        <h1 className="font-display font-semibold text-[var(--text-primary)]">Terms of Use</h1>
        <p className="text-sm text-[var(--text-muted)] font-mono">Last updated: 22 September 2025</p>
      </header>

      <div className="flex flex-col gap-12 text-[var(--text-secondary)]">
        <section>
          <h2 className="font-display font-semibold text-xl text-[var(--text-primary)] mb-4">Scope</h2>
          <p>CollabGuard is an academic demonstration project operated by Dipanjan Das (VIT, BCSE406L NS25). Access is provided for academic evaluation and demonstration purposes. Commercial use is not permitted.</p>
        </section>

        <section>
          <h2 className="font-display font-semibold text-xl text-[var(--text-primary)] mb-4">Permitted use</h2>
          <div className="flex flex-col gap-3">
            <p>You may use CollabGuard to:</p>
            <ul className="list-disc pl-5 flex flex-col gap-2">
              <li>Evaluate the similarity detection methodology on your own code submissions</li>
              <li>Demonstrate the system for academic or research purposes with your own data</li>
              <li>Explore the graph visualization and analysis tools as a product demonstration</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="font-display font-semibold text-xl text-[var(--text-primary)] mb-4">Uploaded content</h2>
          <p>By uploading files you confirm that you have the right to share the content. Do not upload confidential, proprietary, or personally identifiable code that you are not authorized to share. You retain ownership of all uploaded content. CollabGuard does not claim any license to your files beyond what is necessary to perform the analysis.</p>
        </section>

        <section>
          <h2 className="font-display font-semibold text-xl text-[var(--text-primary)] mb-4">Analysis results</h2>
          <p>Similarity scores are algorithmic outputs, not final determinations of academic misconduct. Any use of analysis results in formal academic proceedings is the sole responsibility of the instructor or institution. CollabGuard makes no warranty about the accuracy or completeness of its similarity analysis.</p>
        </section>

        <section>
          <h2 className="font-display font-semibold text-xl text-[var(--text-primary)] mb-4">Limitation of liability</h2>
          <p>CollabGuard is provided &quot;as is&quot; for academic evaluation purposes. No warranty, express or implied, is provided. The author is not liable for any direct, indirect, or consequential damages arising from use or inability to use the service.</p>
        </section>
      </div>
    </article>
  )
}
