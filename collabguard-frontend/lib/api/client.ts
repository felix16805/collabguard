/**
 * CollabGuard — API Client
 *
 * Connects frontend to the FastAPI backend (http://localhost:8000).
 * Falls back transparently to mock data if the backend is unreachable.
 */

import { graphNodes, graphEdges } from "@/lib/mock-data"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export async function fetchHealth() {
  try {
    const res = await fetch(`${API_BASE}/api/health`, { cache: "no-store" })
    if (!res.ok) throw new Error("Health check failed")
    return await res.json()
  } catch (err) {
    return {
      status: "fallback",
      service: "CollabGuard (Client Mode)",
      databases: {
        mongodb: { connected: false, status: "mock" },
        neo4j: { connected: false, status: "mock" },
      },
    }
  }
}

export async function fetchGraphData(batchId: string = "batch_ns25_demo") {
  try {
    const res = await fetch(`${API_BASE}/api/graph/${batchId}`, { cache: "no-store" })
    if (res.ok) {
      return await res.json()
    }
  } catch (e) {
    // Fall back to in-memory mock data
  }
  return {
    batch_id: batchId,
    nodes: graphNodes,
    links: graphEdges.map(([source, target]) => ({ source, target, rel_type: "SIMILAR_TO", weight: 0.8 })),
    total_nodes: graphNodes.length,
    total_edges: graphEdges.length,
  }
}

export async function fetchShortestPath(
  batchId: string = "batch_ns25_demo",
  studentA: string,
  studentB: string
) {
  try {
    const res = await fetch(
      `${API_BASE}/api/graph/${batchId}/shortest-path?student_a=${encodeURIComponent(studentA)}&student_b=${encodeURIComponent(studentB)}`,
      { cache: "no-store" }
    )
    if (res.ok) return await res.json()
  } catch (e) {
    // Fallback
  }
  return {
    student_a_id: studentA,
    student_b_id: studentB,
    has_path: true,
    path: [`student_${studentA}`, "submission_bridge", `student_${studentB}`],
    hops: 2,
  }
}

export async function fetchBatchReport(batchId: string = "batch_ns25_demo") {
  try {
    const res = await fetch(`${API_BASE}/api/reports/${batchId}`, { cache: "no-store" })
    if (res.ok) return await res.json()
  } catch (e) {
    // Fallback
  }
  return {
    report_id: `rep_${batchId}`,
    batch_id: batchId,
    summary: { total_submissions: 12, flagged_pairs_count: 3, clusters_count: 2 },
    clusters: [],
    flagged_pairs: [],
  }
}
