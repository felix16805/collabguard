"use client"

import { useEffect, useRef, useState } from "react"
import dynamic from "next/dynamic"
import { api } from "@/lib/api/mock"
import { colors } from "@/lib/design-tokens"
import type { GraphData, GraphNode, FlaggedPair } from "@/lib/api/types"
import { formatScore, scoreLevel } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import Link from "next/link"

// 2D canvas render — ForceGraph2D for analysis view (readable, precise)
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false })

function NodePanel({ node, pairs }: { node: GraphNode | null; pairs: FlaggedPair[] }) {
  if (!node) {
    return (
      <div className="p-6 flex flex-col gap-3">
        <p className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-widest">Node detail</p>
        <p className="text-sm text-[var(--text-muted)]">Click a node to inspect its submissions and similarity edges.</p>
      </div>
    )
  }

  const relatedPairs = pairs.filter(p => p.studentA === node.studentId || p.studentB === node.studentId)

  return (
    <div className="p-6 flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <p className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-widest">Selected node</p>
        <p className="font-mono text-lg font-semibold text-[var(--text-primary)]">{node.studentId}</p>
        <div className="flex items-center gap-2 mt-1">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ background: colors.graph.clusters[node.cluster % colors.graph.clusters.length] }}
            aria-hidden="true"
          />
          <span className="text-xs text-[var(--text-muted)]">Cluster {node.cluster}</span>
          {node.flagged && (
            <span className="score-badge" data-level="high" style={{ marginLeft: "auto" }}>
              Flagged
            </span>
          )}
        </div>
      </div>

      {relatedPairs.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-widest">
            Similar submissions ({relatedPairs.length})
          </p>
          {relatedPairs.map(pair => {
            const other = pair.studentA === node.studentId ? pair.studentB : pair.studentA
            const level = scoreLevel(pair.score)
            return (
              <div key={pair.id} className="flex items-center gap-3 py-2 border-b border-[var(--border)] last:border-0">
                <span className="font-mono text-sm text-[var(--text-primary)]">{other}</span>
                <span
                  className="score-badge ml-auto shrink-0"
                  data-level={level === "critical" || level === "high" ? level : undefined}
                >
                  {formatScore(pair.score)}
                </span>
                <span className="text-xs font-mono text-[var(--text-muted)] w-16 text-right">{pair.method}</span>
              </div>
            )
          })}
        </div>
      )}

      {relatedPairs.length === 0 && (
        <p className="text-xs text-[var(--text-muted)]">No flagged pairs involving this submission.</p>
      )}
    </div>
  )
}

interface AnalysisGraphProps {
  batchId: string
}

export function AnalysisGraph({ batchId }: AnalysisGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(800)
  const [height, setHeight] = useState(600)
  const [graphData, setGraphData] = useState<GraphData | null>(null)
  const [pairs, setPairs] = useState<FlaggedPair[]>([])
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [threshold, setThreshold] = useState(0.5)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(entries => {
      setWidth(entries[0].contentRect.width)
      setHeight(entries[0].contentRect.height)
    })
    ro.observe(el)
    setWidth(el.offsetWidth)
    setHeight(el.offsetHeight)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    let cancelled = false
    const fetchData = async () => {
      setLoading(true)
      const [graphRes, pairsRes] = await Promise.all([
        api.analysis.getGraph(batchId),
        api.analysis.getFlaggedPairs(batchId),
      ])
      if (cancelled) return
      if (graphRes.ok) setGraphData(graphRes.data)
      else setError(graphRes.error)
      if (pairsRes.ok) setPairs(pairsRes.data)
      setLoading(false)
    }
    fetchData()
    return () => { cancelled = true }
  }, [batchId])

  // Filter links by threshold
  const filteredData = graphData ? {
    nodes: graphData.nodes,
    links: graphData.links.filter(l => (l as { score?: number }).score! >= threshold),
  } : { nodes: [], links: [] }

  const clusterColors = colors.graph.clusters

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[var(--graph-bg)] rounded-[var(--radius-md)]">
        <div className="flex flex-col items-center gap-3">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border border-[var(--accent)]/30 animate-ping" />
            <div className="absolute inset-2 rounded-full border border-[var(--accent)]/60" />
          </div>
          <p className="text-xs font-mono text-[var(--text-muted)] tracking-widest uppercase">Loading graph</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col gap-4 text-center max-w-xs">
          <p className="text-sm text-[var(--error)]">{error}</p>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-6 flex-wrap">
        <div className="flex items-center gap-3">
          <label htmlFor="threshold-slider" className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-widest whitespace-nowrap">
            Min similarity
          </label>
          <input
            id="threshold-slider"
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={threshold}
            onChange={e => setThreshold(Number(e.target.value))}
            className="w-28 accent-[var(--accent)]"
          />
          <span className="font-mono text-sm text-[var(--accent-text)] tabular-nums w-10">
            {Math.round(threshold * 100)}%
          </span>
        </div>
        <span className="text-xs text-[var(--text-muted)]">
          {filteredData.links.length} edges shown / {filteredData.nodes.length} nodes
        </span>
        <Button variant="ghost" size="sm" onClick={() => setSelectedNode(null)} className="ml-auto">
          Clear selection
        </Button>
      </div>

      {/* Graph + panel */}
      <div className="flex gap-4 flex-1 min-h-0">
        <div
          ref={containerRef}
          className="flex-1 rounded-[var(--radius-md)] overflow-hidden"
          style={{ background: colors.graph.bg, minHeight: 400 }}
          aria-label="Similarity graph — 2D canvas view"
          role="img"
        >
          <ForceGraph2D
            width={width}
            height={height}
            graphData={filteredData as any}
            backgroundColor={colors.graph.bg}
            nodeColor={(node: unknown) => {
              const n = node as GraphNode
              return n.flagged ? colors.graph.nodeFlagged : clusterColors[n.cluster % clusterColors.length]
            }}
            nodeLabel={(node: unknown) => (node as GraphNode).studentId}
            nodeVal={(node: unknown) => (node as GraphNode).flagged ? 6 : 4}
            linkColor={(link: unknown) => {
              const l = link as { isFlagged?: boolean }
              return l.isFlagged ? colors.graph.edgeFlagged : colors.graph.edgeDefault
            }}
            linkWidth={(link: unknown) => {
              const l = link as { score?: number }
              return (l.score ?? 0.3) * 3
            }}
            onNodeClick={(node: unknown) => setSelectedNode(node as GraphNode)}
            cooldownTime={2000}
          />
        </div>

        {/* Node detail panel */}
        <div
          className="w-72 shrink-0 border border-[var(--border)] rounded-[var(--radius-md)] bg-[var(--surface-1)] overflow-y-auto"
          aria-live="polite"
          aria-atomic="true"
        >
          <NodePanel node={selectedNode} pairs={pairs} />
        </div>
      </div>
    </div>
  )
}
