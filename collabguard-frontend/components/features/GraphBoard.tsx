"use client";
import React from "react";
import { type RouteKey, type GraphNode, type PathAnnotation, graphNodes, graphEdges } from "@/lib/mock-data";

interface GraphBoardProps {
  onSelect: (node: GraphNode) => void;
  compact?: boolean;
  visibleNodeIds?: string[];
  nodes?: GraphNode[];
  edges?: readonly (readonly [string, string])[];
  highlightedNodeIds?: string[];
  pathAnnotations?: Record<string, PathAnnotation>;
}

export function GraphBoard({
  onSelect,
  compact = false,
  visibleNodeIds,
  nodes = graphNodes,
  edges = graphEdges,
  highlightedNodeIds = [],
  pathAnnotations = {}
}: GraphBoardProps) {
  return (
    <div className={`graph-board ${compact ? "is-compact" : ""}`} aria-label="Interactive CollabGuard graph preview">
      <div className="graph-grid" />
      <div className="graph-axis graph-axis-x">SEMESTER WINDOW →</div>
      <div className="graph-axis graph-axis-y">RELATIONSHIP DEPTH</div>
      
      <svg className="graph-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {edges.map(([fromId, toId]) => { 
          const from = nodes.find((node) => node.id === fromId); 
          const to = nodes.find((node) => node.id === toId); 
          if (!from || !to) return null; 
          const isPathEdge = highlightedNodeIds.includes(fromId) && highlightedNodeIds.includes(toId); 
          return (
            <line 
              key={`${fromId}-${toId}`} 
              x1={from.x} 
              y1={from.y} 
              x2={to.x} 
              y2={to.y} 
              className={`graph-line ${isPathEdge ? "is-path-edge" : ""}`} 
            />
          ); 
        })}
      </svg>
      
      <div className="graph-cluster-label">CLUSTER C-03 / 0.86 CONFIDENCE</div>
      
      {nodes.map((node) => (
        <button 
          className={`graph-node node-${node.kind} node-id-${node.id} ${visibleNodeIds && !visibleNodeIds.includes(node.id) ? "is-muted" : ""} ${highlightedNodeIds.includes(node.id) ? "is-path-node" : ""}`} 
          key={node.id} 
          style={{ left: `${node.x}%`, top: `${node.y}%` }} 
          onClick={() => onSelect(node)} 
          aria-label={`Inspect ${node.label}`}
        >
          <span className="node-core">{node.short}</span>
          <span className="node-label">{node.label}</span>
          {pathAnnotations[node.id] && (
            <span className="path-annotation">
              <b>STEP {String(pathAnnotations[node.id].step).padStart(2, "0")}</b>
              <time>{pathAnnotations[node.id].timestamp}</time>
            </span>
          )}
        </button>
      ))}
      
      <div className="graph-legend">
        <span><i className="legend-dot dot-student" /> student</span>
        <span><i className="legend-dot dot-submission" /> submission</span>
        <span><i className="legend-dot dot-assignment" /> assignment</span>
      </div>
    </div>
  );
}
