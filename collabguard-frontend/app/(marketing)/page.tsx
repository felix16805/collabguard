import type { Metadata } from "next"
import { GraphHero3D, GraphLegend } from "@/components/graph/GraphHero3D"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export const metadata: Metadata = {
  title: "CollabGuard — Code Similarity and Academic Integrity Detection",
  description:
    "CollabGuard builds a live similarity graph from student code submissions using Winnowing fingerprinting and AST analysis, then surfaces collusion clusters via Louvain community detection on Neo4j.",
  openGraph: {
    title: "CollabGuard — Code Similarity Detection",
    description: "Graph-based collusion detection for academic code submissions.",
    images: [{ url: "/og/home.png", width: 1200, height: 630 }],
  },
}

// ─── Section: Algorithm explanation ───────────────────────────────────────
function HowItWorks() {
  const steps = [
    {
      step: "01",
      title: "Submission ingestion",
      body: "Students upload source files (.py, .java, .c, .cpp) to a batch. Files are stored in a private Supabase bucket — never publicly accessible. Metadata (student ID, language, timestamp) is indexed in MongoDB.",
    },
    {
      step: "02",
      title: "Fingerprint extraction",
      body: "Each file is processed by two independent pipelines. Winnowing generates a set of k-gram hashes for position-independent token sequences. A separate AST parser extracts structural fingerprints — control flow, function signatures, expression trees — that survive variable renaming.",
    },
    {
      step: "03",
      title: "Similarity scoring",
      body: "Winnowing uses Jaccard similarity on the shingle sets. AST similarity is computed via tree-edit distance. Both scores are normalized to [0, 1] and combined with a configurable weight. Pairs above the threshold get an edge in the graph.",
    },
    {
      step: "04",
      title: "Graph construction and community detection",
      body: "Edges are written to Neo4j. The Louvain algorithm (via Neo4j GDS) partitions the submission graph into communities — a cluster with high internal similarity and few external edges is a collusion signal. Shortest-path queries surface the most direct connection between any two flagged nodes.",
    },
  ]

  return (
    <section
      className="max-w-6xl mx-auto px-6 py-24"
      aria-labelledby="how-it-works-heading"
    >
      <header className="mb-16 max-w-2xl">
        <h2
          id="how-it-works-heading"
          className="font-display text-[var(--text-primary)] mb-4"
        >
          What CollabGuard actually does
        </h2>
        <p className="text-[var(--text-secondary)] text-lg leading-relaxed">
          No magic. Four deterministic steps from submission to graph. Here is what runs on each file you upload.
        </p>
      </header>

      <ol className="grid gap-0 md:grid-cols-2" role="list">
        {steps.map(({ step, title, body }, i) => (
          <li
            key={step}
            className="relative p-8 border-[var(--border)] flex flex-col gap-4"
            style={{
              borderTopWidth:    i < 2   ? "0" : "1px",
              borderLeftWidth:   i % 2   ? "1px" : "0",
              borderBottomWidth: i >= 2  ? "0" : "0",
            }}
          >
            <span className="font-mono text-xs text-[var(--text-muted)] tracking-widest">
              {step}
            </span>
            <h3 className="font-display font-semibold text-xl text-[var(--text-primary)]">
              {title}
            </h3>
            <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
              {body}
            </p>
          </li>
        ))}
      </ol>
    </section>
  )
}

// ─── Section: Graph interpretation ────────────────────────────────────────
function WhatTheGraphTells() {
  return (
    <section
      className="border-t border-[var(--border)] bg-[var(--bg-subtle)]"
      aria-labelledby="graph-reading-heading"
    >
      <div className="max-w-6xl mx-auto px-6 py-24 grid gap-16 md:grid-cols-2 items-center">
        <div className="flex flex-col gap-6">
          <h2
            id="graph-reading-heading"
            className="font-display text-[var(--text-primary)]"
          >
            Reading the graph
          </h2>
          <div className="flex flex-col gap-8">
            {[
              {
                indicator: "Node color",
                meaning:   "Louvain community assignment. Nodes with the same color share a high intra-cluster similarity — they submitted code that looks structurally alike.",
              },
              {
                indicator: "Edge thickness",
                meaning:   "Normalized similarity score. A thick edge means Winnowing + AST both returned high overlap. A thin edge is below the reporting threshold but still logged.",
              },
              {
                indicator: "Amber edges",
                meaning:   "Pairs above the flagging threshold (configurable, default 70%). These appear in the generated report and are the primary review targets.",
              },
              {
                indicator: "Shortest path",
                meaning:   "Click any two flagged nodes in the analysis view to see the shortest path between them via Neo4j's GDS `shortestPath.dijkstra`. This explains indirect collusion chains.",
              },
            ].map(({ indicator, meaning }) => (
              <div key={indicator} className="flex flex-col gap-1.5">
                <span className="text-sm font-display font-semibold text-[var(--text-primary)]">
                  {indicator}
                </span>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  {meaning}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-[var(--radius-md)] overflow-hidden border border-[var(--border)]">
            {/* Mini 3D graph preview — same component, smaller + non-interactive */}
            <GraphHero3D height={320} showLabels={false} />
          </div>
          <GraphLegend />
        </div>
      </div>
    </section>
  )
}

// ─── Section: Technical stack ──────────────────────────────────────────────
function TechnicalStack() {
  const stack = [
    { layer: "Similarity detection", detail: "Winnowing (k-gram hashing) + AST structural diff — two independent signals, combined score" },
    { layer: "Graph database",       detail: "Neo4j with Graph Data Science library — Louvain community detection, betweenness centrality, shortest path" },
    { layer: "Document store",       detail: "MongoDB — raw submission files, batch metadata, per-pair similarity records" },
    { layer: "API layer",            detail: "Python FastAPI — JWT-authenticated endpoints, zod-validated payloads, rate-limited public routes" },
    { layer: "Frontend",             detail: "Next.js App Router + TypeScript + Supabase auth — server-side session validation, signed upload URLs" },
  ]

  return (
    <section
      className="max-w-6xl mx-auto px-6 py-24"
      aria-labelledby="stack-heading"
    >
      <header className="mb-12 max-w-2xl">
        <h2 id="stack-heading" className="font-display text-[var(--text-primary)] mb-4">
          How it is built
        </h2>
        <p className="text-[var(--text-secondary)]">
          CollabGuard is a polyglot persistence project. MongoDB and Neo4j handle different aspects of the same data — documents for raw content, graphs for relationships.
        </p>
      </header>

      <div
        className="divide-y divide-[var(--border)] border border-[var(--border)] rounded-[var(--radius-md)] overflow-hidden"
        role="list"
        aria-label="Technical stack"
      >
        {stack.map(({ layer, detail }) => (
          <div
            key={layer}
            className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-8 px-6 py-5 bg-[var(--surface-1)] hover:bg-[var(--surface-2)] transition-colors duration-[120ms]"
            role="listitem"
          >
            <span className="font-mono text-xs text-[var(--accent-text)] uppercase tracking-widest shrink-0 w-44">
              {layer}
            </span>
            <span className="text-sm text-[var(--text-secondary)] leading-relaxed">
              {detail}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <div className="page-content">
      {/* ── Hero ── */}
      <section
        className="relative min-h-[calc(100svh-64px)] flex flex-col"
        aria-labelledby="hero-heading"
      >
        {/* Graph canvas — full bleed background */}
        <div
          className="absolute inset-0 z-0"
          aria-hidden="true"
        >
          <GraphHero3D height={typeof window !== "undefined" ? window.innerHeight - 64 : 700} />
          {/* Vignette — bottom fade to bg for clean section transition */}
          <div
            className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none"
            style={{
              background: "linear-gradient(to bottom, transparent, var(--bg))",
            }}
          />
        </div>

        {/* Overlay content — left-aligned, readable over the graph */}
        <div className="relative z-10 max-w-6xl mx-auto px-6 py-20 flex flex-col gap-8 mt-auto">
          <div
            className="max-w-lg flex flex-col gap-6 p-8 rounded-[var(--radius-lg)]"
            style={{ background: "var(--bg)/85", backdropFilter: "blur(12px)" }}
          >
            <div className="flex flex-col gap-3">
              <p className="font-mono text-xs text-[var(--text-muted)] uppercase tracking-widest">
                BCSE406L NS25 — Academic integrity tooling
              </p>
              <h1
                id="hero-heading"
                className="font-display font-semibold text-[var(--text-primary)] leading-tight"
              >
                Code collusion detection through graph analysis
              </h1>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                CollabGuard fingerprints student submissions with Winnowing and AST analysis,
                then builds a Neo4j similarity graph. Louvain community detection surfaces
                collusion clusters that line-by-line diffs miss.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="solid" size="lg" asChild>
                <Link href="/analysis/demo">
                  Run sample analysis
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/about">
                  Read how it works
                </Link>
              </Button>
            </div>

            <GraphLegend />
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <HowItWorks />

      {/* ── Graph reading guide ── */}
      <WhatTheGraphTells />

      {/* ── Technical stack ── */}
      <TechnicalStack />

      {/* ── Final CTA ── */}
      <section className="border-t border-[var(--border)] bg-[var(--bg-subtle)]">
        <div className="max-w-6xl mx-auto px-6 py-24 flex flex-col gap-8 items-start">
          <div className="max-w-xl flex flex-col gap-4">
            <h2 className="font-display text-[var(--text-primary)]">
              Run the sample analysis
            </h2>
            <p className="text-[var(--text-secondary)]">
              The demo batch contains 36 synthetic submissions from a Dijkstra implementation assignment.
              Four Louvain clusters, twelve flagged pairs, one prominent collusion ring.
              Explore the graph without signing in.
            </p>
          </div>
          <Button variant="solid" size="lg" asChild>
            <Link href="/analysis/demo">
              Open demo graph
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
