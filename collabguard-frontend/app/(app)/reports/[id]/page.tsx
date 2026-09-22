import type { Metadata } from "next"
import { api } from "@/lib/api/mock"
import { formatDate, formatScore, scoreLevel } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { notFound } from "next/navigation"

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const res = await api.reports.get(id)
  if (!res.ok) return { title: "Report not found — CollabGuard" }
  return {
    title: `${res.data.batchName} — Report — CollabGuard`,
    description: `Similarity analysis report for ${res.data.batchName}. ${res.data.flaggedCount} flagged pairs, peak score ${formatScore(res.data.maxSimilarity)}.`,
    robots: { index: false },
  }
}

export default async function ReportDetailPage({ params }: Props) {
  const { id } = await params
  const res = await api.reports.get(id)
  if (!res.ok) notFound()

  const { pairs, ...report } = res.data

  return (
    <div className="page-content flex flex-col gap-8">
      <header className="flex items-center justify-between">
        <div className="flex flex-col gap-1.5">
          <Button variant="ghost" size="sm" asChild className="-ml-2 w-fit">
            <Link href="/reports">← Reports</Link>
          </Button>
          <h1 className="font-display font-semibold text-2xl text-[var(--text-primary)]">
            {report.batchName}
          </h1>
          <p className="text-xs text-[var(--text-muted)] font-mono">
            Generated {formatDate(report.createdAt)} · Algorithm: {report.algorithm}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/analysis/${report.batchId}`}>Open graph</Link>
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            Export PDF
          </Button>
        </div>
      </header>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Flagged pairs", value: report.flaggedCount },
          { label: "Louvain clusters", value: report.clusterCount },
          { label: "Peak similarity", value: formatScore(report.maxSimilarity) },
          { label: "Algorithm", value: report.algorithm },
        ].map(({ label, value }) => (
          <div key={label} className="p-4 border border-[var(--border)] rounded-[var(--radius-md)] bg-[var(--surface-1)]">
            <span className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-widest block mb-1">{label}</span>
            <span className="font-display font-semibold text-xl text-[var(--text-primary)] tabular-nums">{value}</span>
          </div>
        ))}
      </div>

      {/* Flagged pairs */}
      <section aria-labelledby="pairs-heading">
        <h2 id="pairs-heading" className="font-display font-semibold text-lg text-[var(--text-primary)] mb-4">
          Flagged pairs ({pairs.length})
        </h2>
        <div className="flex flex-col gap-4">
          {pairs.map(pair => {
            const level = scoreLevel(pair.score)
            return (
              <div
                key={pair.id}
                className="border border-[var(--border)] rounded-[var(--radius-md)] bg-[var(--surface-1)] overflow-hidden"
              >
                {/* Pair header */}
                <div className="flex items-center gap-4 px-5 py-4 border-b border-[var(--border)] bg-[var(--surface-2)]">
                  <span className="font-mono text-sm text-[var(--text-primary)]">{pair.studentA}</span>
                  <span className="text-[var(--text-muted)]">↔</span>
                  <span className="font-mono text-sm text-[var(--text-primary)]">{pair.studentB}</span>
                  <span
                    className="score-badge ml-auto"
                    data-level={level === "critical" || level === "high" ? level : undefined}
                  >
                    {formatScore(pair.score)}
                  </span>
                  <span className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider">{pair.method}</span>
                </div>

                {/* Code diff view */}
                {pair.snippetA && pair.snippetB && (
                  <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-[var(--border)]">
                    {[
                      { label: pair.studentA, code: pair.snippetA },
                      { label: pair.studentB, code: pair.snippetB },
                    ].map(({ label, code }) => (
                      <div key={label} className="flex flex-col">
                        <div className="px-4 py-2 border-b border-[var(--border)] bg-[var(--surface-2)]">
                          <span className="text-xs font-mono text-[var(--text-muted)]">{label}</span>
                        </div>
                        <pre className="p-4 text-xs font-mono text-[var(--text-secondary)] overflow-x-auto leading-relaxed">
                          <code>{code}</code>
                        </pre>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
