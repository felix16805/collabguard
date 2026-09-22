import type { Metadata } from "next"
import { api } from "@/lib/api/mock"
import { formatDate, formatScore, scoreLevel } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Reports — CollabGuard",
  description: "All generated similarity analysis reports.",
  robots: { index: false },
}

export default async function ReportsPage() {
  const res = await api.reports.list()
  const reports = res.ok ? res.data : []

  return (
    <div className="page-content flex flex-col gap-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-semibold text-2xl text-[var(--text-primary)]">Reports</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">{reports.length} reports generated</p>
        </div>
      </header>

      {reports.length === 0 ? (
        <div className="py-20 text-center border border-[var(--border)] rounded-[var(--radius-md)] bg-[var(--surface-1)]">
          <p className="text-sm text-[var(--text-muted)]">No reports yet. Run an analysis first.</p>
          <Button variant="solid" size="sm" asChild className="mt-4">
            <Link href="/dashboard">Go to dashboard</Link>
          </Button>
        </div>
      ) : (
        <div className="border border-[var(--border)] rounded-[var(--radius-md)] bg-[var(--surface-1)] overflow-hidden">
          <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-8 px-5 py-3 border-b border-[var(--border)] bg-[var(--surface-2)]">
            {["Batch", "Flagged pairs", "Peak similarity", "Algorithm", "Status"].map(h => (
              <span key={h} className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-widest">{h}</span>
            ))}
          </div>
          {reports.map(report => {
            const level = scoreLevel(report.maxSimilarity)
            return (
              <Link
                key={report.id}
                href={`/reports/${report.id}`}
                className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-8 px-5 py-4 border-b border-[var(--border)] last:border-0 items-center hover:bg-[var(--surface-2)] transition-colors duration-[120ms]"
              >
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-sm font-medium text-[var(--text-primary)] truncate">{report.batchName}</span>
                  <span className="text-xs text-[var(--text-muted)]">{formatDate(report.createdAt)}</span>
                </div>
                <span className="text-sm font-mono tabular-nums text-[var(--text-primary)]">{report.flaggedCount}</span>
                <span
                  className="score-badge"
                  data-level={level === "critical" || level === "high" ? level : undefined}
                >
                  {formatScore(report.maxSimilarity)}
                </span>
                <span className="text-xs font-mono text-[var(--text-muted)] uppercase">{report.algorithm}</span>
                <span className="text-xs font-mono text-[var(--success)] uppercase">{report.status}</span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
