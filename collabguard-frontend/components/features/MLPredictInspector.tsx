"use client";

import React, { useState } from "react";
import {
  Brain,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  Layers,
  BarChart3,
  Terminal,
} from "lucide-react";

export default function MLPredictInspector() {
  const [isPredicting, setIsPredicting] = useState(false);
  const [prediction, setPrediction] = useState<any>({
    pair_id: "pair_ns25_017_042",
    sub1_id: "sub_ns25_017",
    sub2_id: "sub_ns25_042",
    student_a: "Aarav Sharma (23BCE0101)",
    student_b: "Chirag Reddy (23BCE0142)",
    risk_level: "CRITICAL",
    collusion_probability: 0.942,
    starter_code_discount: 0.12,
    calibrated_score: 0.812,
    features_7d: {
      raw_winnowing_score: 0.86,
      subword_tfidf_similarity: 0.89,
      boilerplate_overlap_ratio: 0.14,
      ast_structural_similarity: 0.98,
      graph_neighborhood_jaccard: 0.75,
      shortest_path_distance: 1,
      shared_bridge_centrality: 0.82,
    },
    explanations: [
      "Extremely high AST structural congruence (0.98) indicates systematic identifier substitution rather than independent implementation.",
      "Subword TF-IDF logic similarity (0.89) confirms identical algorithm sequencing and control-flow branching.",
      "Graph shortest path is 1-hop direct SIMILAR_TO edge within Louvain Cluster C-03 (Bridge node SUB-042).",
      "Starter-code discount applied (-12%) to remove instructor template overlap.",
    ],
    faculty_feedback_status: "AWAITING_REVIEW",
  });

  const runPrediction = () => {
    setIsPredicting(true);
    setTimeout(() => {
      setIsPredicting(false);
    }, 400);
  };

  return (
    <section className="ml-inspector-section section-frame" style={{ marginTop: "3rem", marginBottom: "3rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "1.5rem" }}>
        <div>
          <span style={{
            fontFamily: "var(--mono)",
            fontSize: "11px",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "var(--primary)",
            background: "rgba(219, 255, 92, 0.08)",
            padding: "4px 10px",
            border: "1px solid rgba(219, 255, 92, 0.25)",
          }}>
            MULTI-MODAL ML PREDICTION &amp; ACTIVE LEARNING
          </span>
          <h2 style={{ fontSize: "clamp(1.5rem, 2.5vw, 2.2rem)", fontWeight: 800, margin: "8px 0 4px" }}>
            ML <span style={{ color: "var(--primary)" }}>predict-pair</span> Response &amp; Explanation
          </h2>
          <p style={{ color: "var(--muted)", margin: 0, fontSize: "14px" }}>
            FastAPI endpoint <code>/api/ml/predict-pair</code> inference output. Combines AST syntax, TF-IDF semantics, and Neo4j graph topology into calibrated risk predictions.
          </p>
        </div>

        <button
          onClick={runPrediction}
          disabled={isPredicting}
          style={{
            background: "var(--primary)",
            color: "#0d0e0c",
            padding: "8px 16px",
            fontSize: "13px",
            fontWeight: 700,
            fontFamily: "var(--mono)",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <RefreshCw size={14} className={isPredicting ? "spin" : ""} />
          {isPredicting ? "Inferencing..." : "Execute /api/ml/predict-pair"}
        </button>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
        gap: "20px",
        background: "var(--card)",
        border: "1px solid var(--line)",
        padding: "24px",
      }}>
        {/* Left: Score & Risk Gauge */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <div>
              <span style={{ fontSize: "11px", fontFamily: "var(--mono)", color: "var(--muted)" }}>
                INFERENCE MODEL
              </span>
              <strong style={{ fontSize: "16px", display: "block" }}>
                Random Forest (7D Multi-Modal)
              </strong>
            </div>
            <span style={{
              fontSize: "12px",
              fontFamily: "var(--mono)",
              fontWeight: 700,
              color: "#ff6b5f",
              background: "rgba(255, 107, 95, 0.15)",
              border: "1px solid #ff6b5f",
              padding: "4px 10px",
            }}>
              RISK: {prediction.risk_level}
            </span>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
            marginBottom: "1.5rem",
          }}>
            <div style={{ padding: "12px", background: "rgba(255, 255, 255, 0.02)", border: "1px solid var(--line)" }}>
              <small style={{ color: "var(--muted)", fontFamily: "var(--mono)", fontSize: "10px", display: "block" }}>
                COLLUSION PROBABILITY
              </small>
              <strong style={{ fontSize: "22px", fontFamily: "var(--mono)", color: "#ff6b5f" }}>
                {(prediction.collusion_probability * 100).toFixed(1)}%
              </strong>
            </div>
            <div style={{ padding: "12px", background: "rgba(255, 255, 255, 0.02)", border: "1px solid var(--line)" }}>
              <small style={{ color: "var(--muted)", fontFamily: "var(--mono)", fontSize: "10px", display: "block" }}>
                CALIBRATED SIMILARITY
              </small>
              <strong style={{ fontSize: "22px", fontFamily: "var(--mono)", color: "var(--primary)" }}>
                {(prediction.calibrated_score * 100).toFixed(1)}%
              </strong>
            </div>
          </div>

          {/* 7D Feature Vector Breakdown */}
          <div>
            <span style={{ fontSize: "11px", fontFamily: "var(--mono)", color: "var(--muted)", display: "block", marginBottom: "8px" }}>
              EXTRACTED 7-DIMENSIONAL FEATURE VECTOR:
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {Object.entries(prediction.features_7d).map(([key, val]: any) => (
                <div key={key} style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "12px",
                  padding: "4px 8px",
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid rgba(255, 255, 255, 0.05)",
                  fontFamily: "var(--mono)",
                }}>
                  <span style={{ color: "var(--muted)" }}>{key}</span>
                  <strong style={{ color: "var(--foreground)" }}>{typeof val === "number" ? val.toFixed(2) : val}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Plain-English Explanations & Raw API Response */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <span style={{ fontSize: "11px", fontFamily: "var(--mono)", color: "var(--primary)", display: "block", marginBottom: "8px" }}>
              EXPLAINABLE AI (XAI) REASONING CHAIN:
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "1.25rem" }}>
              {prediction.explanations.map((exp: string, idx: number) => (
                <div key={idx} style={{
                  display: "flex",
                  gap: "10px",
                  padding: "10px 12px",
                  background: "rgba(255, 255, 255, 0.03)",
                  borderLeft: "3px solid var(--primary)",
                  fontSize: "12px",
                  lineHeight: 1.5,
                }}>
                  <span style={{ fontFamily: "var(--mono)", color: "var(--primary)", fontWeight: 700 }}>
                    0{idx + 1}
                  </span>
                  <span>{exp}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <span style={{ fontSize: "11px", fontFamily: "var(--mono)", color: "var(--muted)", display: "block", marginBottom: "6px" }}>
              RAW JSON PAYLOAD (/api/ml/predict-pair):
            </span>
            <pre style={{
              margin: 0,
              background: "#0a0b09",
              border: "1px solid var(--line)",
              padding: "12px",
              fontSize: "11px",
              fontFamily: "var(--mono)",
              color: "var(--foreground)",
              maxHeight: "180px",
              overflowY: "auto",
            }}>
              {JSON.stringify(prediction, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}
