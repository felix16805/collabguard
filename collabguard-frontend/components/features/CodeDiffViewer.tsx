"use client";

import React, { useState } from "react";
import {
  FileCode2,
  GitCompare,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Code,
  Sparkles,
  Layers,
  Search,
} from "lucide-react";

const SUBMISSION_A_RAW = `def dijkstra(graph, start_node):
    # Student A: Dijkstra shortest-path implementation
    distances = {node: float('inf') for node in graph}
    distances[start_node] = 0
    pq = [(0, start_node)]
    visited = set()

    while pq:
        curr_dist, curr_node = heapq.heappop(pq)
        if curr_node in visited:
            continue
        visited.add(curr_node)

        for neighbor, weight in graph[curr_node].items():
            new_dist = curr_dist + weight
            if new_dist < distances[neighbor]:
                distances[neighbor] = new_dist
                heapq.heappush(pq, (new_dist, neighbor))

    return distances`;

const SUBMISSION_B_RAW = `def dijkstra_solver(graph_dict, origin_v):
    # Student B: Renamed variables & altered whitespace
    cost_table = {v: float('inf') for v in graph_dict}
    cost_table[origin_v] = 0
    priority_queue = [(0, origin_v)]
    seen_nodes = set()

    while priority_queue:
        dist_val, active_v = heapq.heappop(priority_queue)
        if active_v in seen_nodes:
            continue
        seen_nodes.add(active_v)

        for adj_v, edge_w in graph_dict[active_v].items():
            alt_dist = dist_val + edge_w
            if alt_dist < cost_table[adj_v]:
                cost_table[adj_v] = alt_dist
                heapq.heappush(priority_queue, (alt_dist, adj_v))

    return cost_table`;

const SUBMISSION_A_AST = `FUNC_1(PARAM_1, PARAM_2):
    VAR_1 = {VAR_2: CONST:inf for VAR_2 in PARAM_1}
    VAR_1[PARAM_2] = CONST:0
    VAR_3 = [(CONST:0, PARAM_2)]
    VAR_4 = set()
    while VAR_3:
        VAR_5, VAR_6 = MODULE.heappop(VAR_3)
        if VAR_6 in VAR_4:
            continue
        VAR_4.add(VAR_6)
        for VAR_7, VAR_8 in PARAM_1[VAR_6].items():
            VAR_9 = VAR_5 + VAR_8
            if VAR_9 < VAR_1[VAR_7]:
                VAR_1[VAR_7] = VAR_9
                MODULE.heappush(VAR_3, (VAR_9, VAR_7))
    return VAR_1`;

const SUBMISSION_B_AST = `FUNC_1(PARAM_1, PARAM_2):
    VAR_1 = {VAR_2: CONST:inf for VAR_2 in PARAM_1}
    VAR_1[PARAM_2] = CONST:0
    VAR_3 = [(CONST:0, PARAM_2)]
    VAR_4 = set()
    while VAR_3:
        VAR_5, VAR_6 = MODULE.heappop(VAR_3)
        if VAR_6 in VAR_4:
            continue
        VAR_4.add(VAR_6)
        for VAR_7, VAR_8 in PARAM_1[VAR_6].items():
            VAR_9 = VAR_5 + VAR_8
            if VAR_9 < VAR_1[VAR_7]:
                VAR_1[VAR_7] = VAR_9
                MODULE.heappush(VAR_3, (VAR_9, VAR_7))
    return VAR_1`;

export default function CodeDiffViewer() {
  const [viewMode, setViewMode] = useState<"raw" | "ast">("raw");

  return (
    <section className="diff-viewer-section section-frame" style={{ marginTop: "3rem", marginBottom: "3rem" }}>
      {/* Section Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "1.5rem" }}>
        <div>
          <span style={{ 
            fontFamily: "var(--mono)", 
            fontSize: "11px", 
            letterSpacing: "0.15em", 
            textTransform: "uppercase", 
            color: "#ff6b5f", 
            background: "rgba(255, 107, 95, 0.1)", 
            padding: "4px 10px", 
            border: "1px solid rgba(255, 107, 95, 0.3)" 
          }}>
            FLAGGED EVIDENCE PAIR: SUB-017 ↔ SUB-042
          </span>
          <h2 style={{ fontSize: "clamp(1.5rem, 2.5vw, 2.2rem)", fontWeight: 800, margin: "8px 0 4px" }}>
            Side-by-Side <span style={{ color: "var(--primary)" }}>Code &amp; AST Diff</span>
          </h2>
          <p style={{ color: "var(--muted)", margin: 0, fontSize: "14px" }}>
            Visual proof of token substitution evasion. AST normalization exposes 100% structural congruence behind renamed identifiers.
          </p>
        </div>

        {/* View Switcher */}
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => setViewMode("raw")}
            style={{
              padding: "8px 16px",
              background: viewMode === "raw" ? "var(--primary)" : "rgba(255, 255, 255, 0.03)",
              color: viewMode === "raw" ? "#0d0e0c" : "var(--foreground)",
              fontFamily: "var(--mono)",
              fontSize: "12px",
              fontWeight: 700,
              border: viewMode === "raw" ? "1px solid var(--primary)" : "1px solid var(--line)",
            }}
          >
            Raw Python Diff (81.2%)
          </button>
          <button
            onClick={() => setViewMode("ast")}
            style={{
              padding: "8px 16px",
              background: viewMode === "ast" ? "var(--primary)" : "rgba(255, 255, 255, 0.03)",
              color: viewMode === "ast" ? "#0d0e0c" : "var(--foreground)",
              fontFamily: "var(--mono)",
              fontSize: "12px",
              fontWeight: 700,
              border: viewMode === "ast" ? "1px solid var(--primary)" : "1px solid var(--line)",
            }}
          >
            Normalized AST Tokens (100% Match)
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "12px",
        marginBottom: "1.5rem",
      }}>
        <div style={{ padding: "12px 16px", background: "rgba(255, 107, 95, 0.06)", border: "1px solid rgba(255, 107, 95, 0.25)" }}>
          <small style={{ color: "#ff6b5f", fontFamily: "var(--mono)", fontSize: "10px", display: "block" }}>
            WINNOWING JACCARD SCORE
          </small>
          <strong style={{ fontSize: "20px", color: "#ff6b5f", fontFamily: "var(--mono)" }}>0.812 (81.2%)</strong>
        </div>
        <div style={{ padding: "12px 16px", background: "rgba(255, 255, 255, 0.02)", border: "1px solid var(--line)" }}>
          <small style={{ color: "var(--muted)", fontFamily: "var(--mono)", fontSize: "10px", display: "block" }}>
            MATCHED FINGERPRINTS
          </small>
          <strong style={{ fontSize: "20px", fontFamily: "var(--mono)", color: "var(--primary)" }}>38 / 46 hashes</strong>
        </div>
        <div style={{ padding: "12px 16px", background: "rgba(255, 255, 255, 0.02)", border: "1px solid var(--line)" }}>
          <small style={{ color: "var(--muted)", fontFamily: "var(--mono)", fontSize: "10px", display: "block" }}>
            EVASION TECHNIQUE
          </small>
          <strong style={{ fontSize: "13px" }}>Identifier Renaming &amp; Spacing</strong>
        </div>
        <div style={{ padding: "12px 16px", background: "rgba(16, 185, 129, 0.06)", border: "1px solid rgba(16, 185, 129, 0.25)" }}>
          <small style={{ color: "#10b981", fontFamily: "var(--mono)", fontSize: "10px", display: "block" }}>
            GRAPH STATUS
          </small>
          <strong style={{ fontSize: "13px", color: "#10b981" }}>Cluster C-03 (Bridge Node)</strong>
        </div>
      </div>

      {/* Side-by-Side Code Comparison */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "16px",
        background: "var(--card)",
        border: "1px solid var(--line)",
        padding: "16px",
      }}>
        {/* Left Side: Submission 17 */}
        <div>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "8px 12px",
            background: "rgba(255, 255, 255, 0.03)",
            borderBottom: "1px solid var(--line)",
            marginBottom: "8px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "var(--primary)",
                display: "inline-block",
              }} />
              <strong style={{ fontSize: "13px", fontFamily: "var(--mono)" }}>SUB-017 · Student A</strong>
            </div>
            <span style={{ fontSize: "11px", fontFamily: "var(--mono)", color: "var(--muted)" }}>
              23BCE0101 · BCSE406L Lab 04
            </span>
          </div>

          <pre style={{
            margin: 0,
            background: "#0a0b09",
            border: "1px solid var(--line)",
            padding: "16px",
            fontSize: "12px",
            fontFamily: "var(--mono)",
            color: "var(--foreground)",
            overflowX: "auto",
            lineHeight: 1.6,
          }}>
            {viewMode === "raw" ? SUBMISSION_A_RAW : SUBMISSION_A_AST}
          </pre>
        </div>

        {/* Right Side: Submission 42 */}
        <div>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "8px 12px",
            background: "rgba(255, 255, 255, 0.03)",
            borderBottom: "1px solid var(--line)",
            marginBottom: "8px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "#ff6b5f",
                display: "inline-block",
              }} />
              <strong style={{ fontSize: "13px", fontFamily: "var(--mono)" }}>SUB-042 · Student B (Bridge Node)</strong>
            </div>
            <span style={{ fontSize: "11px", fontFamily: "var(--mono)", color: "var(--muted)" }}>
              23BCE0142 · BCSE406L Lab 04
            </span>
          </div>

          <pre style={{
            margin: 0,
            background: "#0a0b09",
            border: "1px solid var(--line)",
            padding: "16px",
            fontSize: "12px",
            fontFamily: "var(--mono)",
            color: "var(--foreground)",
            overflowX: "auto",
            lineHeight: 1.6,
          }}>
            {viewMode === "raw" ? SUBMISSION_B_RAW : SUBMISSION_B_AST}
          </pre>
        </div>
      </div>

      {/* Explanatory Callout */}
      <div style={{
        marginTop: "12px",
        padding: "12px 16px",
        background: "rgba(219, 255, 92, 0.04)",
        borderLeft: "3px solid var(--primary)",
        fontSize: "12px",
        color: "var(--foreground)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <span>
          <strong style={{ color: "var(--primary)" }}>Inspection Note: </strong>
          Student B replaced identifiers (<code>distances</code> &rarr; <code>cost_table</code>, <code>pq</code> &rarr; <code>priority_queue</code>) to evade basic keyword diffs. CollabGuard&apos;s AST normalization strips these rename attempts to reveal an identical abstract syntax tree.
        </span>
        <span style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--muted)", marginLeft: "1rem", whiteSpace: "nowrap" }}>
          FIGURE 12.5 EVIDENCE ARTIFACT
        </span>
      </div>
    </section>
  );
}
