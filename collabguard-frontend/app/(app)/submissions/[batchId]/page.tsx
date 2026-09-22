import type { Metadata } from "next"
import { api } from "@/lib/api/mock"
import { formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface Props { params: Promise<{ batchId: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { batchId } = await params
  const res = await api.batches.get(batchId)
  const name = res.ok ? res.data.name : "Batch"
  return { title: `${name} — CollabGuard`, robots: { index: false } }
}

export default async function BatchDetailPage({ params }: Props) {
  const { batchId } = await params
  const [batchRes, subsRes] = await Promise.all([
    api.batches.get(batchId),
    api.submissions.listForBatch(batchId),
  ])

  if (!batchRes.ok) return (
    <div className="py-20 text-center">
      <p className="text-[var(--text-muted)]">Batch not found.</p>
      <Button variant="solid" size="sm" asChild className="mt-4">
        <Link href="/dashboard">Dashboard</Link>
      </Button>
    </div>
  )

  const batch = batchRes.data
  const submissions = subsRes.ok ? subsRes.data : []

  return (
    <div className="page-content flex flex-col gap-8">
      <header className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <Button variant="ghost" size="sm" asChild className="-ml-2 w-fit">
            <Link href="/dashboard">← Dashboard</Link>
          </Button>
          <h1 className="font-display font-semibold text-2xl text-[var(--text-primary)]">{batch.name}</h1>
          {batch.description && <p className="text-sm text-[var(--text-muted)]">{batch.description}</p>}
        </div>
        {batch.status === "complete" && (
          <Button variant="solid" size="md" asChild>
            <Link href={`/analysis/${batchId}`}>View similarity graph</Link>
          </Button>
        )}
      </header>

      {/* Submissions table */}
      <section aria-labelledby="subs-heading">
        <h2 id="subs-heading" className="font-display font-semibold text-lg text-[var(--text-primary)] mb-4">
          Submissions ({submissions.length})
        </h2>
        <div className="border border-[var(--border)] rounded-[var(--radius-md)] bg-[var(--surface-1)] overflow-hidden">
          <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-x-6 px-5 py-3 border-b border-[var(--border)] bg-[var(--surface-2)]">
            {["Student ID", "File", "Language", "Size", "Status"].map(h => (
              <span key={h} className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-widest">{h}</span>
            ))}
          </div>
          {submissions.map(sub => (
            <div
              key={sub.id}
              className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-x-6 px-5 py-3.5 border-b border-[var(--border)] last:border-0 items-center hover:bg-[var(--surface-2)] transition-colors"
            >
              <span className="font-mono text-sm text-[var(--text-primary)]">{sub.studentId}</span>
              <span className="text-sm text-[var(--text-secondary)] truncate">{sub.filename}</span>
              <span className="text-xs font-mono text-[var(--text-muted)] uppercase">{sub.language}</span>
              <span className="text-xs font-mono text-[var(--text-muted)]">{(sub.sizeBytes / 1024).toFixed(1)} KB</span>
              <span className="text-xs font-mono text-[var(--success)] uppercase">{sub.analysisStatus}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
