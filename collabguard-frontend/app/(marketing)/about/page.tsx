import type { Metadata } from "next"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export const metadata: Metadata = {
  title: "About CollabGuard",
  description:
    "The technical story behind CollabGuard — Winnowing fingerprinting, AST structural analysis, Neo4j GDS Louvain community detection. Built by Dipanjan Das for BCSE406L at VIT.",
  openGraph: {
    title: "About CollabGuard — Technical approach and academic context",
    description: "How Winnowing, AST analysis, and Neo4j graph algorithms work together to detect code collusion.",
    images: [{ url: "/og/about.png", width: 1200, height: 630 }],
  },
}

export default function AboutPage() {
  return (
    <article className="page-content max-w-3xl mx-auto px-6 py-24" aria-labelledby="about-heading">
      <header className="mb-20 flex flex-col gap-6">
        <p className="font-mono text-xs text-[var(--text-muted)] uppercase tracking-widest">
          Engineering brief
        </p>
        <h1
          id="about-heading"
          className="font-display font-semibold text-[var(--text-primary)]"
        >
          CollabGuard — what it is and how it works
        </h1>
        <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
          This is a technical document, not a marketing page. If you want to understand
          what the system does and why the design choices were made, keep reading.
        </p>
        <div className="flex gap-3">
          <Button variant="solid" size="md" asChild>
            <Link href="/analysis/demo">Open demo graph</Link>
          </Button>
          <Button variant="outline" size="md" asChild>
            <Link href="/contact">Contact author</Link>
          </Button>
        </div>
      </header>

      {/* Academic context */}
      <section id="course" className="mb-16 flex flex-col gap-6" aria-labelledby="course-heading">
        <h2 id="course-heading" className="font-display font-semibold text-[var(--text-primary)] text-2xl">
          Academic context
        </h2>
        <div className="flex flex-col gap-4 text-[var(--text-secondary)]">
          <p>
            CollabGuard is the course project for <strong className="text-[var(--text-primary)]">BCSE406L — NoSQL Database</strong> at
            the Vellore Institute of Technology (VIT), Batch ID NS25. The project specification
            required students to build a meaningful application over a non-relational database.
          </p>
          <p>
            The design premise: most NoSQL course projects use MongoDB as a glorified JSON store
            with no real motivation for the database choice. This project uses MongoDB and Neo4j
            for fundamentally different reasons, with a FastAPI backend that queries both databases
            to produce a single analysis result.
          </p>
          <div className="mt-2 p-5 border border-[var(--border)] rounded-[var(--radius-md)] bg-[var(--surface-1)] flex flex-col gap-2">
            <div className="flex gap-6 flex-wrap">
              <div>
                <span className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider block mb-1">Author</span>
                <span className="text-sm text-[var(--text-primary)]">Dipanjan Das</span>
              </div>
              <div>
                <span className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider block mb-1">Course</span>
                <span className="text-sm text-[var(--text-primary)]">BCSE406L — NoSQL Database</span>
              </div>
              <div>
                <span className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider block mb-1">Batch</span>
                <span className="text-sm text-[var(--text-primary)]">NS25</span>
              </div>
              <div>
                <span className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider block mb-1">Faculty guide</span>
                <span className="text-sm text-[var(--text-primary)]">Dr. D. Vivek</span>
              </div>
              <div>
                <span className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider block mb-1">Institution</span>
                <span className="text-sm text-[var(--text-primary)]">VIT, Vellore</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why polyglot persistence */}
      <section className="mb-16 flex flex-col gap-6" aria-labelledby="db-heading">
        <h2 id="db-heading" className="font-display font-semibold text-[var(--text-primary)] text-2xl">
          Why two databases
        </h2>
        <div className="flex flex-col gap-4 text-[var(--text-secondary)]">
          <p>
            MongoDB stores document data: the raw submission files (stored as GridFS references),
            batch metadata, student records, and per-pair similarity result documents. Documents
            are schema-flexible, which matters because different languages produce different
            analysis output shapes.
          </p>
          <p>
            Neo4j stores relationship data: the similarity graph itself. Each student submission
            is a node. Each detected similarity above the minimum threshold is a directed edge
            with a weight property (the normalized score). Storing this in MongoDB would mean
            custom graph traversal logic in application code; Neo4j provides that natively
            through Cypher and the GDS library.
          </p>
          <p>
            The Louvain algorithm is a GDS function call, not 400 lines of custom Python.
            Shortest-path between two nodes is <code className="font-mono text-xs bg-[var(--surface-2)] px-1.5 py-0.5 rounded">CALL gds.shortestPath.dijkstra.stream</code>,
            not a hand-written BFS. That is the real argument for Neo4j here.
          </p>
        </div>
      </section>

      {/* Winnowing */}
      <section id="winnowing" className="mb-16 flex flex-col gap-6" aria-labelledby="winnowing-heading">
        <h2 id="winnowing-heading" className="font-display font-semibold text-[var(--text-primary)] text-2xl">
          Winnowing fingerprinting
        </h2>
        <div className="flex flex-col gap-4 text-[var(--text-secondary)]">
          <p>
            Winnowing is the algorithm behind MOSS (Measure Of Software Similarity), the industry-standard
            plagiarism detector used by Stanford and most major CS programs. The intuition:
            represent each document as a small set of position-independent hash fingerprints,
            then compute Jaccard similarity between two fingerprint sets.
          </p>
          <p>
            The process: tokenize the source file (strip comments, normalize whitespace, case-fold
            identifiers), compute rolling k-grams (k = 5 by default), hash each k-gram,
            apply a sliding window of size w, and select the minimum hash in each window.
            The resulting set is the document&apos;s fingerprint — a compact, order-independent
            signature of its token structure.
          </p>
          <p>
            The Jaccard similarity of two fingerprint sets A and B is <code className="font-mono text-xs bg-[var(--surface-2)] px-1.5 py-0.5 rounded">|A ∩ B| / |A ∪ B|</code>.
            A score of 1.0 means identical fingerprints. A score above 0.7 triggers a flag.
            This survives variable renaming, comment removal, and most formatting changes —
            but not structural rewrites or algorithmic changes.
          </p>
        </div>
      </section>

      {/* AST */}
      <section className="mb-16 flex flex-col gap-6" aria-labelledby="ast-heading">
        <h2 id="ast-heading" className="font-display font-semibold text-[var(--text-primary)] text-2xl">
          AST structural analysis
        </h2>
        <div className="flex flex-col gap-4 text-[var(--text-secondary)]">
          <p>
            Winnowing catches textual similarity. AST analysis catches structural similarity —
            submissions that have been paraphrased at the code level (loops converted to recursion,
            variables renamed systematically) but retain the same abstract structure.
          </p>
          <p>
            The backend parses each submission into an abstract syntax tree using language-specific
            parsers (Python&apos;s <code className="font-mono text-xs bg-[var(--surface-2)] px-1.5 py-0.5 rounded">ast</code> module for Python,
            <code className="font-mono text-xs bg-[var(--surface-2)] px-1.5 py-0.5 rounded mx-1">tree-sitter</code> for other languages).
            Structural similarity is computed via tree-edit distance on the normalized AST,
            with identifiers canonicalized to prevent name-based false negatives.
          </p>
          <p>
            The combined score is a weighted average of the Winnowing and AST scores.
            Both must independently exceed a minimum threshold to generate a flagged edge —
            a single high score with a low counterpart gets logged but not flagged.
          </p>
        </div>
      </section>

      {/* Neo4j GDS / Louvain */}
      <section id="graph" className="mb-16 flex flex-col gap-6" aria-labelledby="louvain-heading">
        <h2 id="louvain-heading" className="font-display font-semibold text-[var(--text-primary)] text-2xl">
          Neo4j GDS and Louvain community detection
        </h2>
        <div className="flex flex-col gap-4 text-[var(--text-secondary)]">
          <p>
            After similarity scores are computed for all pairs, the result is a weighted undirected graph:
            nodes are submissions, edges are similarity scores. This graph is projected into Neo4j GDS
            (Graph Data Science) as an in-memory named graph.
          </p>
          <p>
            Louvain community detection partitions this graph into communities that maximize modularity —
            a measure of how much more densely connected nodes are within their community versus what
            you&apos;d expect from a random graph. Practically: a tight cluster of five submissions that
            all scored 0.85+ against each other is a strong collusion signal. Five isolated nodes
            with one high-similarity edge each is a different pattern entirely.
          </p>
          <p>
            The community assignment for each node is written back to MongoDB as part of the
            analysis result document. The frontend renders this as node color in the graph view.
          </p>
          <p>
            Shortest-path queries use <code className="font-mono text-xs bg-[var(--surface-2)] px-1.5 py-0.5 rounded">gds.shortestPath.dijkstra</code> with similarity
            score as the path weight. This answers: &quot;given that A and B are flagged, what is the
            chain of intermediate submissions connecting them?&quot; — useful for identifying the source
            document in an indirect copy chain.
          </p>
        </div>
      </section>

      {/* Design note */}
      <section className="mb-16 flex flex-col gap-6 border-t border-[var(--border)] pt-16" aria-labelledby="design-heading">
        <h2 id="design-heading" className="font-display font-semibold text-[var(--text-primary)] text-2xl">
          Frontend design decisions
        </h2>
        <div className="flex flex-col gap-4 text-[var(--text-secondary)]">
          <p>
            The frontend is built as a real product, not a course submission wrapper.
            The graph visualization on the home page is a live WebGL render of the actual
            similarity graph data — not a decorative unrelated 3D shape. The in-app analysis
            view uses a 2D canvas render for readability when you need to inspect scores.
          </p>
          <p>
            Type system: Geist (display + UI) and DM Sans (body). Accent: amber
            (<code className="font-mono text-xs bg-[var(--surface-2)] px-1.5 py-0.5 rounded">hsl(38 92% 48%)</code>)
            — chosen because it is the natural color for &quot;flagged / attention&quot; in a detection system,
            it is not purple, and it achieves AA contrast against the near-black background without
            needing gradient tricks.
          </p>
        </div>
      </section>

      <div className="flex gap-3 border-t border-[var(--border)] pt-8">
        <Button variant="solid" size="md" asChild>
          <Link href="/analysis/demo">Run the demo</Link>
        </Button>
        <Button variant="outline" size="md" asChild>
          <Link href="/security">Security posture</Link>
        </Button>
      </div>
    </article>
  )
}
