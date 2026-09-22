/**
 * CollabGuard — 3D Similarity Graph Hero
 *
 * Uses react-force-graph-3d (WebGL/Three.js) for the marketing hero.
 * This is the ONE deliberate 3D centerpiece — not a decorative blob.
 * Nodes = student submissions, edges = similarity scores, colors = Louvain clusters.
 *
 * For the in-app analysis page, use GraphCanvas2D instead —
 * it uses react-force-graph-2d for faster, more readable information display.
 *
 * Falls back gracefully if WebGL is unavailable.
 */
"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import type { GraphData, GraphNode } from "@/lib/api/types"
import { colors } from "@/lib/design-tokens"
import { scoreLevel } from "@/lib/utils"
import { MOCK_GRAPH_DATA } from "@/lib/api/mock"

// Dynamic import — no SSR, requires browser/WebGL
const ForceGraph3D = dynamic(
  () => import("react-force-graph-3d"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-[var(--graph-bg)]">
        <GraphLoadingPulse />
      </div>
    ),
  }
)

function GraphLoadingPulse() {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border border-[var(--accent)]/30 animate-ping" />
        <div className="absolute inset-2 rounded-full border border-[var(--accent)]/60" />
        <div className="absolute inset-4 rounded-full bg-[var(--accent)]/20" />
      </div>
      <p className="text-xs font-mono text-[var(--text-muted)] tracking-widest uppercase">
        Rendering graph
      </p>
    </div>
  )
}

interface GraphHero3DProps {
  /** Graph data — defaults to demo mock data */
  data?: GraphData
  /** Height of the canvas in px */
  height?: number
  /** Whether to show node labels */
  showLabels?: boolean
  /** Callback when a node is clicked */
  onNodeClick?: (node: GraphNode) => void
}

export function GraphHero3D({
  data = MOCK_GRAPH_DATA,
  height = 600,
  showLabels = false,
  onNodeClick,
}: GraphHero3DProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [width, setWidth] = React.useState(1200)
  const [webglAvailable, setWebglAvailable] = React.useState<boolean | null>(null)

  // Detect WebGL support
  React.useEffect(() => {
    try {
      const canvas = document.createElement("canvas")
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl")
      setWebglAvailable(!!gl)
    } catch {
      setWebglAvailable(false)
    }
  }, [])

  // Responsive width
  React.useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(entries => {
      setWidth(entries[0].contentRect.width)
    })
    ro.observe(el)
    setWidth(el.offsetWidth)
    return () => ro.disconnect()
  }, [])

  if (webglAvailable === false) {
    // Fallback: static message (real app would load ForceGraph2D)
    return (
      <div
        ref={containerRef}
        className="w-full flex items-center justify-center bg-[var(--graph-bg)] rounded-[var(--radius-md)]"
        style={{ height }}
      >
        <p className="text-sm text-[var(--text-muted)] font-mono">
          WebGL unavailable — open in a modern browser to view the graph.
        </p>
      </div>
    )
  }

  const clusterColors = colors.graph.clusters

  return (
    <div
      ref={containerRef}
      className="w-full overflow-hidden rounded-[var(--radius-md)]"
      style={{ height, background: colors.graph.bg }}
      aria-label="3D similarity graph visualization showing student submission clusters and similarity edges"
      role="img"
    >
      {webglAvailable && (
        <ForceGraph3D
          width={width}
          height={height}
          graphData={data as Parameters<typeof ForceGraph3D>[0]["graphData"]}
          backgroundColor={colors.graph.bg}
          // Node appearance
          nodeLabel={showLabels ? "label" : undefined}
          nodeColor={(node: unknown) => {
            const n = node as GraphNode
            return n.flagged
              ? colors.graph.nodeFlagged
              : clusterColors[n.cluster % clusterColors.length]
          }}
          nodeVal={(node: unknown) => {
            const n = node as GraphNode
            return (n.val ?? 1) * (n.flagged ? 2 : 1) * 2
          }}
          nodeOpacity={0.92}
          // Edge appearance
          linkColor={(link: unknown) => {
            const l = link as { isFlagged?: boolean; score?: number }
            if (l.isFlagged) return colors.graph.edgeFlagged
            return colors.graph.edgeDefault
          }}
          linkWidth={(link: unknown) => {
            const l = link as { score?: number }
            return (l.score ?? 0.3) * 2
          }}
          linkOpacity={0.6}
          linkDirectionalParticles={(link: unknown) => {
            const l = link as { isFlagged?: boolean }
            return l.isFlagged ? 4 : 0
          }}
          linkDirectionalParticleSpeed={0.004}
          linkDirectionalParticleColor={(link: unknown) => {
            const l = link as { isFlagged?: boolean }
            return l.isFlagged ? colors.graph.nodeFlagged : colors.graph.edgeDefault
          }}
          // Interaction
          onNodeClick={(node: unknown) => {
            if (onNodeClick) onNodeClick(node as GraphNode)
          }}
          // Performance
          cooldownTime={2000}
          d3AlphaDecay={0.02}
          d3VelocityDecay={0.3}
          // Camera — slight angle to show depth without being disorienting
          enableNodeDrag={true}
          enableNavigationControls={true}
        />
      )}
    </div>
  )
}

// ─── Similarity legend (used alongside hero) ───────────────────────────────

interface LegendItem {
  color: string
  label: string
}

export function GraphLegend() {
  const items: LegendItem[] = [
    { color: colors.graph.clusters[0], label: "Cluster A" },
    { color: colors.graph.clusters[1], label: "Cluster B" },
    { color: colors.graph.clusters[2], label: "Cluster C" },
    { color: colors.graph.clusters[3], label: "Cluster D" },
    { color: colors.graph.edgeFlagged, label: "Flagged similarity (>70%)" },
  ]

  return (
    <div className="flex flex-wrap items-center gap-4" aria-label="Graph legend">
      {items.map(({ color, label }) => (
        <div key={label} className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ background: color }}
            aria-hidden="true"
          />
          <span className="text-xs text-[var(--text-muted)] font-mono">
            {label}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Edge tooltip info ─────────────────────────────────────────────────────

interface EdgeInfoProps {
  studentA: string
  studentB: string
  score: number
  method: string
}

export function EdgeInfo({ studentA, studentB, score, method }: EdgeInfoProps) {
  const level = scoreLevel(score)
  return (
    <div className="flex items-center gap-3">
      <span className="font-mono text-sm text-[var(--text-primary)]">{studentA}</span>
      <span className="text-[var(--text-muted)]">↔</span>
      <span className="font-mono text-sm text-[var(--text-primary)]">{studentB}</span>
      <span
        className="score-badge"
        data-level={level === "critical" || level === "high" ? level : undefined}
      >
        {Math.round(score * 100)}%
      </span>
      <span className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider">
        {method}
      </span>
    </div>
  )
}
