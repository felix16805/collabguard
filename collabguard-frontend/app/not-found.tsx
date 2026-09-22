import Link from "next/link"
import { Button } from "@/components/ui/button"
import { GraphHero3D } from "@/components/graph/GraphHero3D"

export default function NotFound() {
  return (
    <div className="min-h-svh flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Subdued graph background — the same graph, but smaller and dimmed */}
      <div className="absolute inset-0 opacity-20 pointer-events-none" aria-hidden="true">
        <GraphHero3D height={typeof window !== "undefined" ? window.innerHeight : 700} />
      </div>

      <div className="relative z-10 flex flex-col gap-8 items-center text-center max-w-md">
        <div className="flex flex-col gap-2">
          <span className="font-mono text-8xl font-bold text-[var(--border-strong)] select-none" aria-hidden="true">
            404
          </span>
          <h1 className="font-display font-semibold text-2xl text-[var(--text-primary)]">
            Node not found
          </h1>
          <p className="text-[var(--text-secondary)]">
            This path doesn't exist in the graph. The page may have moved or the URL is incorrect.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="solid" size="md" asChild>
            <Link href="/">Return home</Link>
          </Button>
          <Button variant="outline" size="md" asChild>
            <Link href="/analysis/demo">Open demo graph</Link>
          </Button>
        </div>

        <p className="text-xs font-mono text-[var(--text-muted)]">
          If you believe this is an error, contact{" "}
          <Link href="/contact" className="underline underline-offset-2 hover:text-[var(--text-secondary)]">
            Dipanjan Das
          </Link>
        </p>
      </div>
    </div>
  )
}
