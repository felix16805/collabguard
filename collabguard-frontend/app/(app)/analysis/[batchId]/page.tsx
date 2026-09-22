import type { Metadata } from "next"
import { api } from "@/lib/api/mock"
import { AnalysisGraph } from "@/components/graph/AnalysisGraph"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface Props { params: Promise<{ batchId: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { batchId } = await params
  const res = await api.batches.get(batchId === "demo" ? "batch-ns25-lab2" : batchId)
  const name = res.ok ? res.data.name : "Analysis"
  return {
    title: `${name} — Graph Analysis — CollabGuard`,
    description: `Similarity graph and Louvain cluster view for: ${name}`,
    robots: { index: false },
  }
}

export default async function AnalysisPage({ params }: Props) {
  const { batchId } = await params
  const realId = batchId === "demo" ? "batch-ns25-lab2" : batchId
  const batchRes = await api.batches.get(realId)
  const batch = batchRes.ok ? batchRes.data : null

  return (
    <div className="page-content h-[calc(100svh-5rem)] flex flex-col gap-4">
      <header className="flex items-center justify-between shrink-0">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard">← Dashboard</Link>
            </Button>
            {batchId === "demo" && (
              <span className="text-xs font-mono text-[var(--accent-text)] uppercase tracking-widest">
                Demo mode
              </span>
            )}
          </div>
          <h1 className="font-display font-semibold text-xl text-[var(--text-primary)]">
            {batch?.name ?? "Similarity graph"}
          </h1>
          {batch && (
            <p className="text-xs text-[var(--text-muted)]">
              {batch.submissionCount} submissions · {batch.flaggedPairsCount} flagged pairs · Louvain community detection
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/reports?batch=${realId}`}>View report</Link>
          </Button>
        </div>
      </header>

      {/* Graph — takes remaining height */}
      <div className="flex-1 min-h-0">
        <AnalysisGraph batchId={realId} />
      </div>
    </div>
  )
}
