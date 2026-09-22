/**
 * CollabGuard — Typed Mock API Layer
 *
 * All data calls in the app flow through this interface.
 * When the real FastAPI backend is ready, swap this file's
 * implementation for lib/api/client.ts — the rest of the
 * codebase stays unchanged.
 *
 * Mock data reflects real CollabGuard domain:
 *  - Student IDs, batch names, similarity scores from actual project context
 *  - Louvain cluster assignments, Winnowing/AST methods
 *  - NS25 batch / BCSE406L course identifiers
 */

import type {
  Batch, Submission, GraphData, Report, FlaggedPair, User, ApiResponse,
} from "./types"

// ─── Latency simulation ────────────────────────────────────────────────────
const delay = (ms: number) => new Promise<void>(r => setTimeout(r, ms))
const jitter = (base: number) => base + Math.random() * 100 - 50

// ─── Mock data ─────────────────────────────────────────────────────────────

const MOCK_USER: User = {
  id:         "a1b2c3d4-0000-0000-0000-000000000001",
  email:      "instructor@vit.ac.in",
  name:       "Dr. D. Vivek",
  role:       "instructor",
  courseId:   "course-bcse406l-ns25",
  createdAt:  "2025-01-10T08:00:00.000Z",
}

export const MOCK_BATCHES: Batch[] = [
  {
    id:                "batch-ns25-lab1",
    courseId:          "course-bcse406l-ns25",
    name:              "BCSE406L NS25 — Lab Assignment 1",
    description:       "Graph traversal implementation — BFS and DFS in Python",
    createdAt:         "2025-02-10T10:30:00.000Z",
    submissionCount:   38,
    flaggedPairsCount: 7,
    status:            "complete",
  },
  {
    id:                "batch-ns25-lab2",
    courseId:          "course-bcse406l-ns25",
    name:              "BCSE406L NS25 — Lab Assignment 2",
    description:       "Dijkstra's shortest path on a weighted adjacency matrix",
    createdAt:         "2025-03-03T09:00:00.000Z",
    submissionCount:   36,
    flaggedPairsCount: 12,
    status:            "complete",
  },
  {
    id:                "batch-ns25-lab3",
    courseId:          "course-bcse406l-ns25",
    name:              "BCSE406L NS25 — Lab Assignment 3",
    description:       "MongoDB aggregation pipeline — course project submissions",
    createdAt:         "2025-04-14T11:00:00.000Z",
    submissionCount:   40,
    flaggedPairsCount: 0,
    status:            "analyzing",
  },
]

export const MOCK_SUBMISSIONS: Submission[] = Array.from({ length: 40 }, (_, i) => ({
  id:             `sub-${String(i).padStart(3, "0")}`,
  studentId:      `22BCS${String(7001 + i).padStart(4, "0")}`,
  batchId:        "batch-ns25-lab2",
  filename:       `dijkstra_${String(i).padStart(3, "0")}.py`,
  language:       "python" as const,
  sizeBytes:      1200 + Math.floor(Math.random() * 3000),
  uploadedAt:     "2025-03-03T10:00:00.000Z",
  analysisStatus: "complete" as const,
}))

// Pre-computed mock graph for Lab 2 (the interesting one)
export const MOCK_GRAPH_DATA: GraphData = {
  nodes: MOCK_SUBMISSIONS.slice(0, 36).map((s, i) => ({
    id:        s.id,
    studentId: s.studentId,
    label:     s.studentId,
    cluster:   [0,0,0,0,0, 1,1,1,1, 2,2,2,2,2,2, 3,3,3,3, 0,0,1,1, 2,3,0,0, 1,2,3,0, 1,1,2,2,3][i] ?? 0,
    flagged:   [1, 2, 3, 5, 6, 7, 15, 16, 17, 22, 23].includes(i),
    val:       1 + (i % 5) * 0.3, // slight size variation
  })),
  links: [
    // Cluster 0 (amber) — high similarity cluster, flagged
    { source: "sub-001", target: "sub-002", score: 0.91, method: "winnowing", isFlagged: true },
    { source: "sub-001", target: "sub-003", score: 0.87, method: "winnowing", isFlagged: true },
    { source: "sub-002", target: "sub-003", score: 0.93, method: "combined", isFlagged: true },
    { source: "sub-003", target: "sub-004", score: 0.62, method: "ast",       isFlagged: false },
    { source: "sub-000", target: "sub-004", score: 0.71, method: "ast",       isFlagged: false },
    // Cluster 1
    { source: "sub-005", target: "sub-006", score: 0.89, method: "winnowing", isFlagged: true },
    { source: "sub-006", target: "sub-007", score: 0.78, method: "winnowing", isFlagged: true },
    { source: "sub-007", target: "sub-008", score: 0.55, method: "ast",       isFlagged: false },
    // Cluster 2
    { source: "sub-009", target: "sub-010", score: 0.64, method: "ast",       isFlagged: false },
    { source: "sub-010", target: "sub-011", score: 0.71, method: "ast",       isFlagged: false },
    { source: "sub-009", target: "sub-012", score: 0.58, method: "winnowing", isFlagged: false },
    // Cluster 3
    { source: "sub-015", target: "sub-016", score: 0.96, method: "combined",  isFlagged: true },
    { source: "sub-016", target: "sub-017", score: 0.88, method: "winnowing", isFlagged: true },
    // Cross-cluster (sparse)
    { source: "sub-004", target: "sub-009", score: 0.31, method: "ast",       isFlagged: false },
    { source: "sub-008", target: "sub-013", score: 0.28, method: "ast",       isFlagged: false },
    { source: "sub-014", target: "sub-019", score: 0.42, method: "ast",       isFlagged: false },
    // More intra-cluster connections
    { source: "sub-019", target: "sub-020", score: 0.68, method: "winnowing", isFlagged: false },
    { source: "sub-021", target: "sub-022", score: 0.81, method: "winnowing", isFlagged: true },
    { source: "sub-022", target: "sub-023", score: 0.79, method: "winnowing", isFlagged: true },
    { source: "sub-025", target: "sub-026", score: 0.52, method: "ast",       isFlagged: false },
    { source: "sub-027", target: "sub-028", score: 0.61, method: "ast",       isFlagged: false },
    { source: "sub-029", target: "sub-030", score: 0.74, method: "winnowing", isFlagged: false },
    { source: "sub-031", target: "sub-032", score: 0.83, method: "combined",  isFlagged: true },
    { source: "sub-033", target: "sub-034", score: 0.58, method: "ast",       isFlagged: false },
    { source: "sub-035", target: "sub-000", score: 0.47, method: "ast",       isFlagged: false },
  ].map(l => ({ ...l, value: l.score })),
}

export const MOCK_REPORTS: Report[] = [
  {
    id:            "report-lab2-01",
    batchId:       "batch-ns25-lab2",
    batchName:     "BCSE406L NS25 — Lab Assignment 2",
    createdAt:     "2025-03-04T08:00:00.000Z",
    flaggedCount:  12,
    clusterCount:  4,
    maxSimilarity: 0.96,
    algorithm:     "combined",
    status:        "ready",
  },
  {
    id:            "report-lab1-01",
    batchId:       "batch-ns25-lab1",
    batchName:     "BCSE406L NS25 — Lab Assignment 1",
    createdAt:     "2025-02-11T09:30:00.000Z",
    flaggedCount:  7,
    clusterCount:  3,
    maxSimilarity: 0.88,
    algorithm:     "winnowing",
    status:        "ready",
  },
]

export const MOCK_FLAGGED_PAIRS: FlaggedPair[] = [
  {
    id:      "pair-001",
    studentA: "22BCS7002",
    studentB: "22BCS7003",
    score:    0.93,
    method:   "combined",
    snippetA: `def dijkstra(graph, src):\n    dist = {v: float('inf') for v in graph}\n    dist[src] = 0\n    pq = [(0, src)]\n    while pq:\n        d, u = heappop(pq)`,
    snippetB: `def dijkstra(graph, src):\n    dist = {v: float('inf') for v in graph}\n    dist[src] = 0\n    pq = [(0, src)]\n    while pq:\n        d, u = heappop(pq)`,
    shortestPath: ["sub-001", "sub-002", "sub-003"],
  },
  {
    id:      "pair-002",
    studentA: "22BCS7016",
    studentB: "22BCS7017",
    score:    0.96,
    method:   "combined",
    snippetA: `visited = set()\n    while pq:\n        d, u = heappop(pq)\n        if u in visited: continue\n        visited.add(u)`,
    snippetB: `visited = set()\n    while pq:\n        d, u = heappop(pq)\n        if u in visited: continue\n        visited.add(u)`,
    shortestPath: ["sub-015", "sub-016", "sub-017"],
  },
]

// ─── API methods ───────────────────────────────────────────────────────────

export const api = {
  auth: {
    async getCurrentUser(): Promise<ApiResponse<User>> {
      await delay(jitter(200))
      return { ok: true, data: MOCK_USER }
    },
  },

  batches: {
    async list(): Promise<ApiResponse<Batch[]>> {
      await delay(jitter(400))
      return { ok: true, data: MOCK_BATCHES }
    },
    async get(id: string): Promise<ApiResponse<Batch>> {
      await delay(jitter(250))
      const batch = MOCK_BATCHES.find(b => b.id === id)
      if (!batch) return { ok: false, error: `Batch '${id}' not found` }
      return { ok: true, data: batch }
    },
  },

  submissions: {
    async listForBatch(batchId: string): Promise<ApiResponse<Submission[]>> {
      await delay(jitter(500))
      const subs = MOCK_SUBMISSIONS.filter(s => s.batchId === batchId)
      return { ok: true, data: subs }
    },
    async upload(_files: File[], _batchId: string): Promise<ApiResponse<{ count: number }>> {
      await delay(jitter(1500)) // simulate upload time
      return { ok: true, data: { count: 1 } }
    },
  },

  analysis: {
    async getGraph(batchId: string): Promise<ApiResponse<GraphData>> {
      await delay(jitter(600))
      if (batchId !== "batch-ns25-lab2" && batchId !== "demo") {
        return { ok: true, data: { nodes: [], links: [] } }
      }
      return { ok: true, data: MOCK_GRAPH_DATA }
    },
    async getFlaggedPairs(batchId: string): Promise<ApiResponse<FlaggedPair[]>> {
      await delay(jitter(400))
      void batchId
      return { ok: true, data: MOCK_FLAGGED_PAIRS }
    },
  },

  reports: {
    async list(): Promise<ApiResponse<Report[]>> {
      await delay(jitter(450))
      return { ok: true, data: MOCK_REPORTS }
    },
    async get(id: string): Promise<ApiResponse<Report & { pairs: FlaggedPair[] }>> {
      await delay(jitter(350))
      const report = MOCK_REPORTS.find(r => r.id === id)
      if (!report) return { ok: false, error: `Report '${id}' not found` }
      return { ok: true, data: { ...report, pairs: MOCK_FLAGGED_PAIRS } }
    },
  },

  contact: {
    async submit(_data: unknown): Promise<ApiResponse<{ sent: true }>> {
      await delay(jitter(800))
      return { ok: true, data: { sent: true } }
    },
  },
}

export type Api = typeof api
