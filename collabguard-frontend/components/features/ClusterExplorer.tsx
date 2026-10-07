"use client";
import React, { useState, useMemo, useEffect } from "react";
import { GraphBoard } from "./GraphBoard";
import { type GraphNode, type PathAnnotation, graphNodes, graphEdges } from "@/lib/mock-data";
import { Pencil, Trash2, X, Rewind, Pause, Play, RotateCcw, ArrowUpRight, Info } from "lucide-react";
import Link from "next/link";

export function ClusterExplorer() {
  type LocalCluster = { id: string; label: string; confidence: number; pairCount: number; bridgeCount: number; nodes: GraphNode[]; edges: readonly (readonly [string, string])[]; note: string };
  type Preset = { id: string; name: string; activeCluster: string; threshold: number; bridgesOnly: boolean };

  const readJson = <T,>(key: string, fallback: T): T => {
    try { 
      if (typeof window === "undefined") return fallback;
      return JSON.parse(localStorage.getItem(key) ?? "null") ?? fallback; 
    } catch { return fallback; }
  };
  
  const savedFilters = useMemo(() => readJson("collabguard-investigation-filters", {} as { activeCluster?: string; threshold?: number; bridgesOnly?: boolean }), []);
  const [activeCluster, setActiveCluster] = useState(savedFilters.activeCluster ?? "C-03");
  const [threshold, setThreshold] = useState(savedFilters.threshold ?? 0.6);
  const [bridgesOnly, setBridgesOnly] = useState(savedFilters.bridgesOnly ?? false);
  const [presets, setPresets] = useState<Preset[]>(() => readJson("collabguard-investigation-presets", [] as Preset[]));
  const [presetName, setPresetName] = useState("");
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null);
  const [editingPresetName, setEditingPresetName] = useState("");
  const [drillOpen, setDrillOpen] = useState(Boolean(savedFilters.activeCluster));
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [pathStep, setPathStep] = useState(0);
  const [speed, setSpeed] = useState(1);

  const localClusters: LocalCluster[] = useMemo(() => [
    { id: "C-03", label: "Bridge ring", confidence: 0.86, pairCount: 4, bridgeCount: 1, nodes: graphNodes, edges: graphEdges, note: "A six-node cluster connected by one bridge submission." },
    { id: "C-02", label: "Repeat pair", confidence: 0.74, pairCount: 2, bridgeCount: 0, nodes: graphNodes.slice(0, 3), edges: graphEdges.slice(0, 2), note: "A repeated pair that resurfaces across assignment windows." },
    { id: "C-04", label: "Second hop", confidence: 0.62, pairCount: 3, bridgeCount: 1, nodes: graphNodes.slice(3), edges: graphEdges.slice(3), note: "A lower-score pocket that becomes meaningful in context." },
  ], []);

  const clusters = localClusters.filter((cluster) => cluster.confidence >= Math.min(threshold, 0.86) - 0.12);
  const selected = clusters.find((cluster) => cluster.id === activeCluster) ?? clusters[0] ?? localClusters[0];
  
  const visibleNodeIds = bridgesOnly ? selected.nodes.filter((node) => node.id === "sub-42").map((node) => node.id) : selected.nodes.map((node) => node.id);
  const pathNodes = selected.id === "C-03" ? ["student-a", "sub-17", "sub-42", "student-b"] : selected.nodes.map((node) => node.id);
  const pathLabels = pathNodes.map((id) => graphNodes.find((node) => node.id === id)?.label ?? id);
  const pathTimes = selected.id === "C-03" ? ["18:41:02", "18:41:18", "18:42:07", "18:42:21"] : pathNodes.map((_, index) => `18:4${index}:0${index + 2}`);
  const highlightedNodeIds = pathNodes.slice(0, pathStep + 1);
  const pathAnnotations = Object.fromEntries(pathNodes.slice(0, pathStep + 1).map((id, index) => [id, { step: index + 1, timestamp: pathTimes[index] }])) as Record<string, PathAnnotation>;
  
  const pathProgress = pathNodes.length > 1 ? (pathStep / (pathNodes.length - 1)) * 100 : 0;

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("collabguard-investigation-filters", JSON.stringify({ activeCluster, threshold, bridgesOnly }));
      localStorage.setItem("collabguard-investigation-presets", JSON.stringify(presets));
    }
  }, [activeCluster, threshold, bridgesOnly, presets]);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      setPathStep((current) => {
        if (current >= pathNodes.length - 1) { setIsPlaying(false); return current; }
        return current + 1;
      });
    }, Math.round(700 / speed));
    return () => window.clearInterval(timer);
  }, [isPlaying, pathNodes.length, speed]);

  const savePreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!presetName.trim()) return;
    const newPreset: Preset = { id: Math.random().toString(36).substring(7), name: presetName.trim(), activeCluster, threshold, bridgesOnly };
    setPresets((p) => [...p, newPreset]);
    setPresetName("");
  };

  const loadPreset = (preset: Preset) => {
    setActiveCluster(preset.activeCluster);
    setThreshold(preset.threshold);
    setBridgesOnly(preset.bridgesOnly);
    setDrillOpen(true);
    setPathStep(0);
    setIsPlaying(false);
  };

  const updatePreset = (id: string, newName: string) => {
    if (!newName.trim()) return;
    setPresets((p) => p.map((preset) => preset.id === id ? { ...preset, name: newName.trim() } : preset));
    setEditingPresetId(null);
  };

  return (
    <section className="cluster-explorer">
      <div className="max-w-6xl mx-auto px-6">
        <div className="explorer-heading">
          <div>
            <h2 className="font-display text-[var(--text-primary)]">Interactive cluster <span>explorer.</span></h2>
          </div>
          <p className="text-[var(--text-secondary)]">Filter nodes by confidence, isolate bridges, and playback the chronological evidence path generated by Neo4j.</p>
        </div>
        
        <div className="preset-strip">
          <div className="preset-heading">
            <small>INVESTIGATION PRESETS</small>
            <form className="preset-create" onSubmit={savePreset}>
              <input type="text" placeholder="Save current filters..." value={presetName} onChange={(e) => setPresetName(e.target.value)} maxLength={32} />
              <button type="submit">SAVE</button>
            </form>
          </div>
          <div className="preset-list">
            {presets.length === 0 ? <span className="preset-empty">No presets saved yet.</span> : presets.map((preset) => (
              <div key={preset.id} className="preset-chip">
                {editingPresetId === preset.id ? (
                  <input type="text" autoFocus value={editingPresetName} onChange={(e) => setEditingPresetName(e.target.value)} onBlur={() => updatePreset(preset.id, editingPresetName)} onKeyDown={(e) => e.key === 'Enter' && updatePreset(preset.id, editingPresetName)} />
                ) : (
                  <button className="preset-load" onClick={() => loadPreset(preset)}>
                    <span>{preset.name}</span>
                    <small>C-{preset.activeCluster} / T-{(preset.threshold * 100).toFixed(0)}% / {preset.bridgesOnly ? "BRIDGES" : "ALL"}</small>
                  </button>
                )}
                <div className="preset-actions">
                  <button onClick={() => { setEditingPresetId(preset.id); setEditingPresetName(preset.name); }} aria-label="Rename preset"><Pencil size={11} /></button>
                  <button onClick={() => setPresets((p) => p.filter((x) => x.id !== preset.id))} aria-label="Delete preset"><Trash2 size={11} /></button>
                </div>
              </div>
            ))}
          </div>
          <div className="data-status is-fetching">
            <i /> MODEL ONLINE — SYNCING GRAPH STATE
          </div>
        </div>

        <div className="filter-bar">
          <div className="filter-group">
            <span className="filter-label">CLUSTER MATCH</span>
            {clusters.map((cluster) => (
              <button key={cluster.id} className={activeCluster === cluster.id ? "is-active" : ""} onClick={() => { setActiveCluster(cluster.id); setDrillOpen(true); setPathStep(0); setIsPlaying(false); }}>
                {cluster.id} <small>{(cluster.confidence * 100).toFixed(0)}%</small>
              </button>
            ))}
          </div>
          
          <div className="filter-group threshold-control">
            <span className="filter-label">MINIMUM PAIRWISE SCORE: <b>{(threshold * 100).toFixed(0)}%</b></span>
            <input type="range" min="0.4" max="0.95" step="0.01" value={threshold} onChange={(e) => setThreshold(parseFloat(e.target.value))} aria-label="Similarity threshold" />
          </div>
          
          <button className={`bridge-toggle ${bridgesOnly ? "is-active" : ""}`} onClick={() => setBridgesOnly((b) => !b)}>
            <div className="toggle-indicator" /> ISOLATE BRIDGE NODES
          </button>
        </div>
        
        <div className="explorer-grid">
          <div className="explorer-graph">
            <GraphBoard onSelect={() => undefined} nodes={selected.nodes} edges={selected.edges} visibleNodeIds={visibleNodeIds} highlightedNodeIds={highlightedNodeIds} pathAnnotations={pathAnnotations} />
            <div className="explorer-foot">
              <span><Info size={13} /> Nodes below threshold are filtered from query.</span>
              <span>LOUVAIN CLUSTER {selected.id}</span>
            </div>
          </div>
          
          {drillOpen && (
            <div className="cluster-drilldown is-open">
              <div className="drill-top">
                <span>INSPECTING — {selected.id}</span>
                <button onClick={() => setDrillOpen(false)} aria-label="Close inspector"><X size={15} /></button>
              </div>
              
              <div className="drill-identity">
                <div className="drill-code">{"{ }"}</div>
                <div>
                  <h3 className="font-display font-semibold text-[var(--text-primary)]">{selected.label}</h3>
                  <span>{selected.note}</span>
                </div>
              </div>
              
              <div className="drill-stats">
                <div><span>CONFIDENCE</span><strong>{(selected.confidence * 100).toFixed(1)}%</strong></div>
                <div><span>FLAGGED PAIRS</span><strong>{String(selected.pairCount).padStart(2, "0")}</strong></div>
                <div><span>BRIDGE NODES</span><strong>{String(selected.bridgeCount).padStart(2, "0")}</strong></div>
              </div>
              
              <div className="playback-panel">
                <div className="playback-top">
                  <strong>EVIDENCE TIMELINE</strong>
                  <div className="speed-control">
                    <span>SPEED:</span>
                    <button className={speed === 0.5 ? "is-active" : ""} onClick={() => setSpeed(0.5)}>0.5x</button>
                    <button className={speed === 1 ? "is-active" : ""} onClick={() => setSpeed(1)}>1.0x</button>
                    <button className={speed === 2 ? "is-active" : ""} onClick={() => setSpeed(2)}>2.0x</button>
                  </div>
                </div>
                
                <input type="range" className="playback-slider" min="0" max={pathNodes.length - 1} value={pathStep} onChange={(e) => { setPathStep(parseInt(e.target.value)); setIsPlaying(false); }} aria-label="Scrub timeline" />
                
                <div className="playback-controls">
                  <button onClick={() => { setPathStep(0); setIsPlaying(false); }} aria-label="Reset to start" title="Reset"><RotateCcw size={13} /></button>
                  <button onClick={() => { setPathStep((p) => Math.max(0, p - 1)); setIsPlaying(false); }} aria-label="Previous step" title="Previous"><Rewind size={13} /></button>
                  <button className="playback-main" onClick={() => { if (pathStep >= pathNodes.length - 1) setPathStep(0); setIsPlaying(!isPlaying); }} aria-label={isPlaying ? "Pause" : "Play"} title={isPlaying ? "Pause playback" : "Start playback"}>
                    {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
                  </button>
                </div>
              </div>
              
              <div className="drill-path">
                <span className="overline text-[var(--muted)]">SHORTEST PATH</span>
                <p>
                  {pathLabels.map((label, idx) => (
                    <React.Fragment key={idx}>
                      <span className={idx <= pathStep ? "is-visited text-[var(--accent)]" : "text-[var(--text-secondary)]"}>{label}</span>
                      {idx < pathLabels.length - 1 && <b className={idx < pathStep ? "text-[var(--accent)]" : "text-[var(--text-secondary)]"}>→</b>}
                    </React.Fragment>
                  ))}
                </p>
              </div>
              
              <div className="drill-actions">
                <Link href={`/analysis/cluster/${selected.id}`} className="button button-primary">
                  <span>Open full report</span>
                  <ArrowUpRight size={14} />
                </Link>
                <button className="text-link">Download JSON <ArrowUpRight size={13} /></button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
