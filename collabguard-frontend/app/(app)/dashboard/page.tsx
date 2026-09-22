import type { Metadata } from "next"
import { api, MOCK_BATCHES } from "@/lib/api/mock"
import { formatDate, formatScore, scoreLevel } from "@/lib/utils"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Dashboard — CollabGuard",
  description: "Overview of recent batches, flagged pairs, and analysis stats.",
  robots: { index: false, follow: false },
}

// ─── Stat card — no identical feature cards: each has different data shape ─
function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="flex flex-col gap-2 p-5 border border-[var(--border)] rounded-[var(--radius-md)] bg-[var(--surface-1)]">
      <span className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-widest">{label}</span>
      <span className="font-display font-semibold text-3xl text-[var(--text-primary)] tabular-nums">{value}</span>
      {sub && <span className="text-xs text-[var(--text-muted)]">{sub}</span>}
    </div>
  )
}

// ─── Batch row ─────────────────────────────────────────────────────────────
function BatchRow({ batch }: { batch: typeof MOCK_BATCHES[number] }) {
  const statusColor = {
    collecting: "var(--text-muted)",
    analyzing:  "var(--accent-text)",
    complete:   "var(--success)",
  }[batch.status]

  return (
    <div className="flex items-center justify-between py-4 border-b border-[var(--border)] last:border-0 gap-4">
      <div className="flex flex-col gap-1 min-w-0">
        <Link
          href={`/submissions/${batch.id}`}
          className="text-sm font-medium text-[var(--text-primary)] hover:text-[var(--accent-text)] transition-colors truncate"
        >
          {batch.name}
        </Link>
        <span className="text-xs text-[var(--text-muted)]">{formatDate(batch.createdAt)}</span>
      </div>
      <div className="flex items-center gap-6 shrink-0">
        <div className="text-right">
          <span className="text-xs text-[var(--text-muted)] block">Submissions</span>
          <span className="text-sm font-mono tabular-nums text-[var(--text-primary)]">{batch.submissionCount}</span>
        </div>
        <div className="text-right">
          <span className="text-xs text-[var(--text-muted)] block">Flagged pairs</span>
          <span
            className="text-sm font-mono tabular-nums"
            style={{ color: batch.flaggedPairsCount > 0 ? "var(--accent-text)" : "var(--text-muted)" }}
          >
            {batch.flaggedPairsCount}
          </span>
        </div>
        <div className="text-right">
          <span className="text-xs text-[var(--text-muted)] block">Status</span>
          <span className="text-xs font-mono uppercase tracking-wider" style={{ color: statusColor }}>
            {batch.status}
          </span>
        </div>
        {batch.status === "complete" && (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/analysis/${batch.id}`}>View graph</Link>
          </Button>
        )}
      </div>
    </div>
  )
}

export default async function DashboardPage() {
  const [batchesRes, reportsRes] = await Promise.all([
    api.batches.list(),
    api.reports.list(),
  ])

  const batches = batchesRes.ok ? batchesRes.data : []
  const reports = reportsRes.ok ? reportsRes.data : []

  const totalFlagged = batches.reduce((sum, b) => sum + b.flaggedPairsCount, 0)
  const totalSubmissions = batches.reduce((sum, b) => sum + b.submissionCount, 0)
  const completedBatches = batches.filter(b => b.status === "complete").length
  const maxSimilarity = reports.reduce((max, r) => Math.max(max, r.maxSimilarity), 0)

  return (
    <div className="page-content flex flex-col gap-10">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-semibold text-2xl text-[var(--text-primary)]">Dashboard</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">BCSE406L NS25 — all batches</p>
        </div>
        <Button variant="solid" size="md" asChild>
          <Link href="/submissions/upload">Upload batch</Link>
        </Button>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total submissions" value={totalSubmissions} sub={`across ${batches.length} batches`} />
        <StatCard label="Flagged pairs" value={totalFlagged} sub="above 70% threshold" />
        <StatCard label="Batches complete" value={completedBatches} sub={`of ${batches.length} total`} />
        <StatCard
          label="Peak similarity"
          value={maxSimilarity > 0 ? formatScore(maxSimilarity) : "—"}
          sub="highest recorded score"
        />
      </div>

      {/* Batches */}
      <section aria-labelledby="batches-heading">
        <div className="flex items-center justify-between mb-4">
          <h2 id="batches-heading" className="font-display font-semibold text-lg text-[var(--text-primary)]">
            Recent batches
          </h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/reports">View all reports</Link>
          </Button>
        </div>

        <div className="border border-[var(--border)] rounded-[var(--radius-md)] bg-[var(--surface-1)] px-5">
          {batches.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-[var(--text-muted)]">No batches yet.</p>
              <Button variant="solid" size="sm" asChild className="mt-4">
                <Link href="/submissions/upload">Upload first batch</Link>
              </Button>
            </div>
          ) : (
            batches.map(batch => <BatchRow key={batch.id} batch={batch} />)
          )}
        </div>
      </section>

      {/* Quick actions */}
      <section aria-labelledby="quickactions-heading">
        <h2 id="quickactions-heading" className="font-display font-semibold text-lg text-[var(--text-primary)] mb-4">
          Flagged pairs — latest batch
        </h2>
        <div className="border border-[var(--border)] rounded-[var(--radius-md)] bg-[var(--surface-1)] px-5 py-4 flex flex-col gap-1">
          {[
            { a: "22BCS7002", b: "22BCS7003", score: 0.93, method: "combined" },
            { a: "22BCS7016", b: "22BCS7017", score: 0.96, method: "combined" },
            { a: "22BCS7006", b: "22BCS7007", score: 0.89, method: "winnowing" },
            { a: "22BCS7022", b: "22BCS7023", score: 0.81, method: "winnowing" },
          ].map(({ a, b, score, method }) => {
            const level = scoreLevel(score)
            return (
              <div key={`${a}-${b}`} className="flex items-center gap-4 py-3 border-b border-[var(--border)] last:border-0">
                <span className="font-mono text-sm text-[var(--text-primary)]">{a}</span>
                <span className="text-[var(--text-muted)]">↔</span>
                <span className="font-mono text-sm text-[var(--text-primary)]">{b}</span>
                <span
                  className="score-badge ml-auto"
                  data-level={level === "critical" || level === "high" ? level : undefined}
                >
                  {formatScore(score)}
                </span>
                <span className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider w-20">{method}</span>
              </div>
            )
          })}
          <div className="pt-3">
            <Button variant="outline" size="sm" asChild>
              <Link href="/analysis/batch-ns25-lab2">Open full graph</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
