import { GraphHero3D } from "@/components/graph/GraphHero3D"
import Link from "next/link"

/**
 * Auth layout — split screen:
 * Left: graph visualization panel (the product, not decoration)
 * Right: form panel
 *
 * Adapted from Login10 structural idea — reskinned completely to our system.
 * The graph panel is the product, not a stock illustration or gradient blob.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-svh grid lg:grid-cols-2">
      {/* Left panel — graph */}
      <div className="hidden lg:flex flex-col relative overflow-hidden bg-[var(--graph-bg)]">
        <div className="absolute inset-0">
          <GraphHero3D showLabels={false} />
        </div>
        {/* Content overlay */}
        <div className="relative z-10 flex flex-col h-full p-10 justify-between">
          <Link
            href="/"
            className="font-display font-semibold text-lg text-white/90 hover:text-white transition-colors w-fit"
          >
            CollabGuard
          </Link>
          <div className="flex flex-col gap-3 max-w-xs">
            <p className="text-sm font-mono text-white/50 uppercase tracking-widest">
              Current demo batch
            </p>
            <p className="text-sm text-white/80 leading-relaxed">
              36 submissions, 4 Louvain clusters, 12 flagged pairs detected via Winnowing + AST combined analysis.
            </p>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-col items-center justify-center min-h-svh p-8 bg-[var(--bg)]">
        <div className="w-full max-w-sm flex flex-col gap-8">
          {/* Mobile wordmark */}
          <Link
            href="/"
            className="lg:hidden font-display font-semibold text-lg text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors"
          >
            CollabGuard
          </Link>
          {children}
        </div>
      </div>
    </div>
  )
}
