"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Boxes,
  Check,
  ChevronRight,
  CircleDot,
  Clock3,
  Database,
  ExternalLink,
  FileCode2,
  GitBranch,
  Info,
  Layers3,
  Menu,
  Moon,
  Network,
  Pause,
  Pencil,
  Play,
  Rewind,
  RotateCcw,
  ScanSearch,
  Server,
  ShieldCheck,
  Terminal,
  Sun,
  Trash2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Lenis from "lenis";
import NavShell from "./NavShell";
import DatabaseOperations from "./DatabaseOperations";
import LoginPage from "./LoginPage";
import CodeDiffViewer from "./CodeDiffViewer";
import MLPredictInspector from "./MLPredictInspector";

type NodeKind = "student" | "submission" | "assignment";
type RouteKey = "/" | "/about" | "/components" | "/resources" | "/architecture" | "/database" | "/login";
type GraphNode = {
  id: string;
  label: string;
  short: string;
  kind: NodeKind;
  x: number;
  y: number;
  detail: string;
  meta: string;
};
type PathAnnotation = { step: number; timestamp: string };

const routeLabels: Record<RouteKey, string> = {
  "/": "Home",
  "/about": "About",
  "/components": "Components",
  "/resources": "References",
  "/architecture": "Architecture",
  "/database": "NoSQL Database",
  "/login": "Faculty Login",
};

const routeMeta: Record<RouteKey, { title: string; description: string }> = {
  "/": { title: "CollabGuard — See the pattern beyond the pair", description: "CollabGuard maps Python code submissions as a graph to surface indirect collusion rings and provide explainable academic integrity evidence." },
  "/about": { title: "About CollabGuard — Project Brief", description: "Problem statement, scope, objectives, and research framing for the CollabGuard NoSQL polyglot persistence project." },
  "/components": { title: "Components — CollabGuard Faculty Dashboard", description: "Explore the interactive graph, cluster explorer, evidence chains, and system states of the CollabGuard review surface." },
  "/resources": { title: "References — CollabGuard", description: "10 journal and conference papers on code plagiarism detection, graph databases, Winnowing, and community detection algorithms." },
  "/architecture": { title: "Architecture — CollabGuard Data Flow", description: "How React + Next.js, FastAPI, MongoDB Atlas, and Neo4j AuraDB work together in the CollabGuard three-tier polyglot system." },
  "/database": { title: "NoSQL Database Operations — CollabGuard Execution Engine", description: "Live CRUD operations, compound and text indexing with IXSCAN explain plans, multi-stage aggregation pipelines, and JSON document schemas." },
  "/login": { title: "Faculty Login — CollabGuard Academic Portal", description: "Secure token-based authentication for course instructors and evaluators with JWT issuance and bcrypt verification." },
};

const graphNodes: GraphNode[] = [
  { id: "student-a", label: "Student A", short: "A", kind: "student", x: 15, y: 48, detail: "Repeated origin node across three assignment windows.", meta: "student / 03 links" },
  { id: "sub-17", label: "SUB-017", short: "17", kind: "submission", x: 35, y: 24, detail: "AST fingerprint intersects with SUB-042 at 0.81 Winnowing similarity.", meta: "assignment 04 / score 0.81" },
  { id: "sub-42", label: "SUB-042", short: "42", kind: "submission", x: 55, y: 49, detail: "Bridge submission. Connects two otherwise separate collusion pockets.", meta: "assignment 04 / bridge" },
  { id: "student-b", label: "Student B", short: "B", kind: "student", x: 81, y: 32, detail: "Downstream student with a repeated pair signature across assignments.", meta: "student / 04 links" },
  { id: "sub-63", label: "SUB-063", short: "63", kind: "submission", x: 77, y: 75, detail: "Second-hop evidence. Similarity is below the direct pairwise threshold.", meta: "assignment 05 / score 0.62" },
  { id: "assignment-5", label: "ASSIGNMENT 05", short: "05", kind: "assignment", x: 38, y: 82, detail: "Repeated pairing detected across the next assignment window.", meta: "window / 14 days" },
];

const graphEdges = [
  ["student-a", "sub-17"], ["sub-17", "sub-42"], ["sub-42", "student-b"], ["sub-42", "sub-63"], ["student-a", "assignment-5"], ["assignment-5", "sub-63"], ["student-b", "sub-63"],
] as const;

const nodeInsights: Record<string, { owner: string; course: string; lastSeen: string; fingerprint: string; signal: string; connections: string[] }> = {
  "student-a": { owner: "Student A", course: "BCSE406L / Lab 04", lastSeen: "18:41:02", fingerprint: "origin / 03 links", signal: "Repeated origin node across three assignment windows — Louvain places this student at the centre of cluster C-03.", connections: ["SUB-017", "ASSIGNMENT 05"] },
  "sub-17": { owner: "Student A", course: "BCSE406L / Assignment 04", lastSeen: "18:40:18", fingerprint: "AST-91C2 / 81%", signal: "Winnowing k-gram overlap with SUB-042 at 0.81 — above the 0.60 threshold. First direct edge in the collusion chain.", connections: ["Student A", "SUB-042"] },
  "sub-42": { owner: "Student A + Student B", course: "BCSE406L / Assignment 04", lastSeen: "18:42:07", fingerprint: "AST-B7F0 / bridge", signal: "Bridge submission. Neo4j shortest-path traversal places this node on every evidence chain between the A and B evidence pockets.", connections: ["SUB-017", "Student B", "SUB-063"] },
  "student-b": { owner: "Student B", course: "BCSE406L / Lab 04", lastSeen: "18:39:46", fingerprint: "downstream / 04 links", signal: "Downstream student with a repeated pair signature. Not above threshold in any single pair — only visible through multi-hop traversal.", connections: ["SUB-042", "SUB-063"] },
  "sub-63": { owner: "Student B", course: "BCSE406L / Assignment 05", lastSeen: "18:38:11", fingerprint: "AST-44AD / 62%", signal: "Second-hop evidence below the direct pair threshold at 0.62. Invisible to MOSS — visible only because Neo4j traverses the graph.", connections: ["SUB-042", "ASSIGNMENT 05", "Student B"] },
  "assignment-5": { owner: "Cohort / 2026-27", course: "BCSE406L / Assignment 05", lastSeen: "18:37:54", fingerprint: "window / 14 days", signal: "Repeated pairing emerges across the next assignment window — Louvain community detection expands cluster C-03 here.", connections: ["Student A", "SUB-063"] },
};

const evidenceTimeline: Record<string, { time: string; label: string; detail: string; status: string }[]> = {
  "student-a": [
    { time: "18:41:02", label: "Origin observed", detail: "Student A linked to SUB-017 in BCSE406L Assignment 04.", status: "flagged" },
    { time: "17:12:44", label: "Repeated pairing", detail: "Same origin appears again in the prior lab window.", status: "review" },
    { time: "15:08:19", label: "First ingest", detail: "Faculty dataset imported. Student node created in Neo4j.", status: "logged" },
  ],
  "sub-17": [
    { time: "18:40:18", label: "Fingerprint intersect", detail: "Winnowing AST-91C2 overlaps with SUB-042 at 0.81 similarity.", status: "flagged" },
    { time: "18:39:52", label: "Submission scored", detail: "Winnowing pass completed across 1,248 Python AST tokens.", status: "scored" },
    { time: "18:36:10", label: "Source ingested", detail: "Assignment 04 .py file stored in MongoDB submissions collection.", status: "logged" },
  ],
  "sub-42": [
    { time: "18:42:07", label: "Bridge detected", detail: "Shortest-path query surfaces SUB-042 as bridge between A and B pockets.", status: "flagged" },
    { time: "18:41:25", label: "Cluster expanded", detail: "Louvain run adds SUB-042 to C-03, raising confidence to 0.86.", status: "review" },
    { time: "18:37:06", label: "Source ingested", detail: "Assignment 04 .py file stored in MongoDB submissions collection.", status: "logged" },
  ],
  "student-b": [
    { time: "18:39:46", label: "Downstream link", detail: "Student B connected to bridge submission via SIMILAR_TO edge (0.81).", status: "flagged" },
    { time: "17:48:03", label: "Pair repeated", detail: "A similar signature reappeared across the previous assignment window.", status: "review" },
  ],
  "sub-63": [
    { time: "18:38:11", label: "Second hop", detail: "Similarity score 0.62 — below 0.75 direct-pair threshold but above cluster inclusion at 0.60.", status: "review" },
    { time: "18:35:27", label: "Submission scored", detail: "Winnowing fingerprint score computed at 0.62 over 944 tokens.", status: "scored" },
  ],
  "assignment-5": [
    { time: "18:37:54", label: "Window opened", detail: "Assignment 05 cohort window opened. Neo4j SIMILAR_TO edges seeded.", status: "logged" },
    { time: "16:22:14", label: "Pairing repeated", detail: "Student A and Student B signatures recur — cluster confidence rises.", status: "review" },
  ],
};

const methodContent = {
  fingerprint: { label: "01 / Fingerprint", title: "Similarity without the noise.", body: "Python source files are tokenised using the AST module, then fingerprinted with Winnowing (k=5 grams, window=4). This strips formatting noise — variable renames and whitespace cannot hide shared structure. Each computed similarity score becomes a weighted SIMILAR_TO edge in Neo4j.", code: "ast.parse → tokenise → winnow(k=5, w=4) → score" },
  traverse: { label: "02 / Traverse", title: "Follow the trail, not just the pair.", body: "Neo4j's native graph traversal replaces the recursive joins a relational schema would require. A MATCH query can move from a student node, across a bridge submission, and into the Louvain-detected cluster that explains the collusion pattern — all in one Cypher expression.", code: "MATCH p=(s:Student)-[*1..4]-(t:Student)" },
  explain: { label: "03 / Explain", title: "Every flag comes with a path.", body: "The faculty dashboard pairs each Louvain cluster with its shortest-path evidence chain: which submissions are connected, what the Winnowing score is, and what path links the students. As a stretch goal, a RAG pipeline (LangChain + LangGraph) will generate plain-English explanations from this graph evidence.", code: "cluster → shortest_path → evidence_chain → faculty_review" },
};
type MethodKey = keyof typeof methodContent;

function LogoMark() {
  return <span className="logo-mark" aria-hidden="true"><span /><span /><span /></span>;
}

function navigate(path: RouteKey) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function useRoute(): RouteKey {
  const pathname = usePathname();
  const [clientPath, setClientPath] = useState<RouteKey>("/");

  useEffect(() => {
    const handlePop = () => {
      const p = window.location.pathname as RouteKey;
      setClientPath(p in routeLabels ? p : "/");
    };
    handlePop();
    window.addEventListener("popstate", handlePop);
    return () => window.removeEventListener("popstate", handlePop);
  }, []);

  const currentPath = (pathname as RouteKey) in routeLabels ? (pathname as RouteKey) : clientPath;
  return currentPath in routeLabels ? currentPath : "/";
}

function GraphBoard({ onSelect, compact = false, visibleNodeIds, nodes = graphNodes, edges = graphEdges, highlightedNodeIds = [], pathAnnotations = {} }: { onSelect: (node: GraphNode) => void; compact?: boolean; visibleNodeIds?: string[]; nodes?: GraphNode[]; edges?: readonly (readonly [string, string])[]; highlightedNodeIds?: string[]; pathAnnotations?: Record<string, PathAnnotation> }) {
  return <div className={`graph-board ${compact ? "is-compact" : ""}`} aria-label="Interactive CollabGuard graph preview">
    <div className="graph-grid" /><div className="graph-axis graph-axis-x">SEMESTER WINDOW →</div><div className="graph-axis graph-axis-y">RELATIONSHIP DEPTH</div>
    <svg className="graph-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">{edges.map(([fromId, toId]) => { const from = nodes.find((node) => node.id === fromId); const to = nodes.find((node) => node.id === toId); if (!from || !to) return null; const isPathEdge = highlightedNodeIds.includes(fromId) && highlightedNodeIds.includes(toId); return <line key={`${fromId}-${toId}`} x1={from.x} y1={from.y} x2={to.x} y2={to.y} className={`graph-line ${isPathEdge ? "is-path-edge" : ""}`} />; })}</svg>
    <div className="graph-cluster-label">CLUSTER C-03 / 0.86 CONFIDENCE</div>
    {nodes.map((node) => <button className={`graph-node node-${node.kind} node-id-${node.id} ${visibleNodeIds && !visibleNodeIds.includes(node.id) ? "is-muted" : ""} ${highlightedNodeIds.includes(node.id) ? "is-path-node" : ""}`} key={node.id} style={{ left: `${node.x}%`, top: `${node.y}%` }} onClick={() => onSelect(node)} aria-label={`Inspect ${node.label}`}><span className="node-core">{node.short}</span><span className="node-label">{node.label}</span>{pathAnnotations[node.id] && <span className="path-annotation"><b>STEP {String(pathAnnotations[node.id].step).padStart(2, "0")}</b><time>{pathAnnotations[node.id].timestamp}</time></span>}</button>)}
    <div className="graph-legend"><span><i className="legend-dot dot-student" /> student</span><span><i className="legend-dot dot-submission" /> submission</span><span><i className="legend-dot dot-assignment" /> assignment</span></div>
  </div>;
}

function SectionMarker({ children }: { children: React.ReactNode }) { return <span className="section-kicker">/ {children}</span>; }
function PageIntro({ index, eyebrow, title, body }: { index: string; eyebrow: string; title: React.ReactNode; body: string }) { return <section className="page-intro section-frame"><div className="page-intro-top"><SectionMarker>{index} — {eyebrow}</SectionMarker><span className="page-index">{index}</span></div><h1>{title}</h1><p>{body}</p></section>; }

function ScrollStory() {
  const sectionRef = useRef<HTMLElement>(null);
  const [step, setStep] = useState(0);
  const steps = [
    { number: "01", eyebrow: "START WITH A PAIR", title: "Similarity is only the first signal.", body: "A pairwise checker like MOSS sees two submissions and a score. CollabGuard starts there, then asks what else is connected — who else shared this code, across which assignment, and how many hops away." },
    { number: "02", eyebrow: "FIND THE BRIDGE", title: "The middle node changes the question.", body: "A submission that sits between two pockets can be the missing context. Neo4j's shortest-path traversal surfaces bridge nodes that are invisible to any pairwise tool — the student who received and re-shared without ever being directly flagged." },
    { number: "03", eyebrow: "SURFACE THE CLUSTER", title: "The pattern emerges at network scale.", body: "Louvain community detection groups the connected nodes into a case file: cluster confidence, repeated pairs across assignments, and a traversable path a faculty member can inspect and act on." },
  ];
  return <section className="story-section section-frame" ref={sectionRef}><div className="story-copy"><SectionMarker>02 — FOLLOW THE SIGNAL</SectionMarker><h2>From a score<br />to a <span>story.</span></h2><div className="story-steps">{steps.map((item, index) => <motion.div className="story-step-copy" style={{ transition: "none" }} key={item.number} initial={false} animate={{ opacity: step === index ? 1 : 0.3, y: step === index ? 0 : 20, scale: step === index ? 1 : 0.96 }} viewport={{ amount: 0.5, margin: "-30% 0px -30% 0px" }} onViewportEnter={() => setStep(index)} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}><span>{item.number}</span><div><b>{item.eyebrow}</b><h3>{item.title}</h3><p>{item.body}</p></div></motion.div>)}</div></div><div className="story-sticky"><div className={`story-visual story-step-${step}`}><div className="story-visual-head"><span>SCROLL-LINKED GRAPH / C-03</span><span>{String(step + 1).padStart(2, "0")} / 03</span></div><GraphBoard compact onSelect={() => undefined} /><div className="story-caption"><span className="story-caption-mark" />{steps[step].eyebrow}<strong>{step === 0 ? "A ↔ B / 0.81" : step === 1 ? "SUB-042 / BRIDGE NODE" : "CLUSTER C-03 / 0.86"}</strong></div></div></div></section>;
}

function HomePage() {
  const [selectedNodeId, setSelectedNodeId] = useState("sub-42");
  const [activeMethod, setActiveMethod] = useState<MethodKey>("fingerprint");
  const selectedNode = useMemo(() => graphNodes.find((node) => node.id === selectedNodeId) ?? graphNodes[2], [selectedNodeId]);
  return <>
    <section className="home-hero section-frame"><div className="hero-copy"><div className="eyebrow"><span className="eyebrow-rule" /> GRAPH-BASED ACADEMIC INTEGRITY</div><h1>The pattern is <em>bigger</em> than the pair.</h1><p className="hero-lede">CollabGuard models student code submissions as a graph — using Winnowing fingerprinting, AST tokenisation, and Neo4j community detection — so faculty can see the hidden collusion routes that pairwise tools like MOSS cannot surface.</p><div className="hero-actions"><button className="button button-primary" onClick={() => navigate("/components")}>Open the dashboard <ArrowDownRight size={16} /></button><button className="text-link" onClick={() => navigate("/about")}>Read the project brief <ArrowUpRight size={15} /></button></div><div className="hero-stamp"><span>BCSE406L / 01</span><span>NOSQL DATABASE</span><span>2026—27</span></div></div><div className="hero-console"><div className="console-topline"><div><span className="tiny-dot" /> LIVE CASE FILE</div><span>UPDATED 18:42:07</span></div><div className="console-title-row"><div><span className="overline">ACTIVE INVESTIGATION</span><h2>Collusion ring / C-03</h2></div><div className="confidence-score"><strong>0.86</strong><span>Louvain confidence</span></div></div><div className="hero-graph-wrap"><GraphBoard onSelect={(node) => setSelectedNodeId(node.id)} /><div className="console-note"><span className="note-index">01</span><span>Louvain community detection surfaced 6 connected nodes.</span></div></div><div className="selected-evidence"><div className="selected-label">SELECTED NODE</div><div className="selected-node-row"><div><strong>{selectedNode.label}</strong><span>{selectedNode.meta}</span></div><button onClick={() => navigate("/components")}>Inspect <ChevronRight size={15} /></button></div></div></div></section>
    <section className="proof-strip section-frame"><div className="proof-item"><span>01</span><strong>Pairwise tools stop at A ↔ B.</strong><small>CollabGuard traces the entire network around every submission.</small></div><div className="proof-item"><span>02</span><strong>Neo4j keeps relationships queryable.</strong><small>Shortest paths, Louvain clusters, repeated pairs across semesters.</small></div><div className="proof-item"><span>03</span><strong>Evidence stays attached to every flag.</strong><small>Every signal carries a Winnowing score, source file, and graph route.</small></div></section>
    <section className="home-intro section-frame"><div><SectionMarker>01 — THE SIGNAL</SectionMarker><h2>Suspicion is a <span className="accent-underline">relationship</span> problem.</h2></div><div className="intro-copy"><p>Academic plagiarism rarely travels in a straight line. A student can pass a solution through an intermediary who never submits work resembling either party directly — staying below every pairwise threshold while the collusion pattern is unmistakeable at the network level.</p><p>CollabGuard makes the indirect visible: the bridge submission, the repeated pair across assignments, and the shortest path that connects two students over an entire semester — stored in Neo4j and queryable in a single Cypher expression.</p><button className="inline-arrow" onClick={() => navigate("/architecture")}>Explore the system map <ArrowRight size={16} /></button></div></section>
    <ScrollStory />
    <section className="home-method section-frame"><div className="method-intro"><SectionMarker>02 — THE METHOD</SectionMarker><h2>Polyglot by design.<br /><span>Specific by default.</span></h2><p>MongoDB stores the flexible raw material — source files, metadata, faculty accounts. Neo4j stores the relationships that make the material legible — SIMILAR_TO edges weighted by Winnowing score, traversable by Louvain and shortest-path algorithms.</p></div><div className="method-content"><div className="method-tabs">{(Object.keys(methodContent) as MethodKey[]).map((key, index) => <button key={key} className={activeMethod === key ? "is-active" : ""} onClick={() => setActiveMethod(key)}><span>0{index + 1}</span>{methodContent[key].label.split(" / ")[1]}</button>)}</div><div className="method-panel"><div className="method-panel-copy"><span className="overline">{methodContent[activeMethod].label}</span><h3>{methodContent[activeMethod].title}</h3><p>{methodContent[activeMethod].body}</p><div className="method-code"><Terminal size={16} /><code>{methodContent[activeMethod].code}</code></div></div><div className="method-visual"><div className="visual-ring ring-one" /><div className="visual-ring ring-two" /><div className="visual-core"><Network size={28} /><span>GRAPH</span></div><div className="visual-tag tag-top">relationships</div><div className="visual-tag tag-bottom">evidence</div></div></div></div></section>
    <section className="home-next section-frame"><div><SectionMarker>03 — CONTINUE</SectionMarker><h2>Start with the <span>map.</span><br />Stay for the evidence.</h2></div><div className="next-links"><button onClick={() => navigate("/about")}><span>About the project</span><ArrowUpRight size={16} /></button><button onClick={() => navigate("/components")}><span>Faculty dashboard demo</span><ArrowUpRight size={16} /></button><button onClick={() => navigate("/resources")}><span>References (10 papers)</span><ArrowUpRight size={16} /></button></div></section>
  </>;
}

function AboutPage() {
  return <><PageIntro index="01" eyebrow="ABOUT THE PROJECT" title={<>A research prototype for the part pairwise tools <em>cannot see.</em></>} body="CollabGuard is a single-member, faculty-facing demonstration of how polyglot NoSQL persistence — MongoDB for documents, Neo4j for relationships — can turn code similarity scores into explainable collusion evidence. Built for BCSE406L by Dipanjan Das (23BCE0131) under the guidance of Dr. D. Vivek." /><section className="about-story section-frame"><div className="about-lead"><span className="story-number">01</span><h2>The problem is not a score. It is a route.</h2></div><div className="about-copy"><p>At institutional scale, students submit Python lab and assignment code every week. Existing tools such as MOSS can flag that submission A resembles submission B, but they cannot reveal a quiet collusion ring — a group of students who share code indirectly across assignments, sometimes routing through a middleman who is never directly flagged in any single pairwise comparison.</p><p>That is fundamentally a graph problem. CollabGuard models students and submissions as nodes, then stores pairwise Winnowing similarity as weighted SIMILAR_TO edges in Neo4j, so multi-hop traversal, Louvain community detection, and shortest-path explanation become first-class operations — not expensive application-side workarounds.</p><blockquote>"The useful question is not only who resembles whom, but which path makes the pattern visible?"</blockquote></div></section><section className="scope-section section-frame"><div className="scope-head"><SectionMarker>02 — PROJECT SCOPE</SectionMarker><h2>Intentionally narrow.<br /><span>Technically serious.</span></h2></div><div className="scope-grid"><div className="scope-card"><span>01</span><h3>One language</h3><p>Python tokenisation via the <code>ast</code> module and Winnowing-style fingerprinting. Focused enough to evaluate in one semester with a reproducible seeded dataset.</p></div><div className="scope-card"><span>02</span><h3>Simulated dataset</h3><p>150–300 submissions across 8–10 BCSE406L-style assignments with deliberately seeded direct and multi-hop collusion patterns for demonstration and evaluation.</p></div><div className="scope-card"><span>03</span><h3>Research prototype</h3><p>JWT-secured faculty accounts, a demo graph dashboard, and Louvain evidence chains. Explicitly not a production replacement for institutional plagiarism tools.</p></div><div className="scope-card"><span>04</span><h3>Polyglot persistence</h3><p>MongoDB Atlas for flexible document storage (submissions, metadata, accounts). Neo4j AuraDB for the derived similarity graph. Each used for the workload it is best suited to.</p></div></div></section><section className="objectives-section section-frame"><div><SectionMarker>03 — OBJECTIVES</SectionMarker><h2>What the proposal<br /><span>commits to.</span></h2></div><div className="objective-list">{["Design a MongoDB document schema for student submissions, assignment metadata, faculty user accounts, and computed pairwise similarity scores.", "Implement a code-similarity engine (tokenise → fingerprint → score) for Python, based on the Winnowing algorithm used by MOSS.", "Model students and submissions as a Neo4j graph, with Winnowing scores ingested as weighted SIMILAR_TO edges between Submission nodes.", "Implement Cypher graph queries for Louvain community detection, repeated-pair-across-assignments detection, and shortest-path evidence chains.", "Build a faculty-facing dashboard (React + Next.js) with JWT-secured login to review and explain flagged clusters.", "Evaluate and justify the MongoDB + Neo4j polyglot design against a single relational-schema baseline.", "(Stretch goal) Implement an LLM-powered 'explain this cluster' RAG pipeline with LangChain + LangGraph, retrieving Neo4j graph evidence to generate plain-English summaries for faculty."].map((item, i) => <div key={item}><span>0{i + 1}</span><p>{item}</p><Check size={15} /></div>)}</div></section><section className="scope-section section-frame" style={{ borderTop: "1px solid var(--line)" }}><div className="scope-head"><SectionMarker>04 — TEAM</SectionMarker><h2>Single-member.<br /><span>Full-stack delivery.</span></h2></div><div className="team-container"><div className="team-card"><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}><span style={{ color: "var(--primary)", font: "400 11px var(--mono)", letterSpacing: "0.08em" }}>◈ SINGLE DEVELOPER &amp; RESEARCH LEAD</span><span style={{ color: "var(--muted)", font: "400 11px var(--mono)" }}>VIT VELLORE · 2026–27</span></div><h3 style={{ margin: "18px 0 10px", fontSize: "26px", letterSpacing: "-0.04em", color: "var(--foreground)" }}>Dipanjan Das</h3><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginTop: "10px", paddingTop: "14px", borderTop: "1px solid var(--line)" }}><div><span style={{ color: "var(--primary)", font: "400 10px var(--mono)", display: "block", marginBottom: "3px" }}>STUDENT DETAILS</span><strong style={{ fontSize: "14px", color: "var(--foreground)", display: "block" }}>23BCE0131</strong><p style={{ margin: "2px 0 0", color: "var(--muted)", fontSize: "12px" }}>B.Tech Computer Science &amp; Engineering</p></div><div><span style={{ color: "var(--primary)", font: "400 10px var(--mono)", display: "block", marginBottom: "3px" }}>COURSE &amp; BATCH</span><strong style={{ fontSize: "14px", color: "var(--foreground)", display: "block" }}>BCSE406L · NS25</strong><p style={{ margin: "2px 0 0", color: "var(--muted)", fontSize: "12px" }}>NoSQL Databases Capstone Project</p></div><div><span style={{ color: "var(--primary)", font: "400 10px var(--mono)", display: "block", marginBottom: "3px" }}>FACULTY GUIDE</span><strong style={{ fontSize: "14px", color: "var(--foreground)", display: "block" }}>Dr. D. Vivek</strong><p style={{ margin: "2px 0 0", color: "var(--muted)", fontSize: "12px" }}>School of Computer Science &amp; Engineering (SCOPE)</p></div></div><div style={{ marginTop: "12px", paddingTop: "14px", borderTop: "1px solid rgba(255, 255, 255, 0.05)" }}><span style={{ color: "var(--muted)", font: "400 10px var(--mono)", display: "block", marginBottom: "6px" }}>CORE RESPONSIBILITIES</span><p style={{ color: "#b0b4a9", fontSize: "13px", lineHeight: 1.6, margin: 0 }}>Frontend (React + Next.js) · Backend (FastAPI) · Similarity engine (Python AST tokenisation + Winnowing fingerprinting) · Database design &amp; query engineering (MongoDB Atlas + Neo4j AuraDB).</p></div></div></div></section></>;
}

function ClusterExplorer() {
  type LocalCluster = { id: string; label: string; confidence: number; pairCount: number; bridgeCount: number; nodes: GraphNode[]; edges: readonly (readonly [string, string])[]; note: string };
  type Preset = { id: string; name: string; activeCluster: string; threshold: number; bridgesOnly: boolean };
  const readJson = <T,>(key: string, fallback: T): T => {
    try { return JSON.parse(localStorage.getItem(key) ?? "null") ?? fallback; } catch { return fallback; }
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
    { id: "C-03", label: "Bridge ring", confidence: 0.86, pairCount: 4, bridgeCount: 1, nodes: graphNodes, edges: graphEdges, note: "A six-node Louvain cluster connected by one bridge submission (SUB-042). Highest confidence collusion pattern in the seeded dataset." },
    { id: "C-02", label: "Repeat pair", confidence: 0.74, pairCount: 2, bridgeCount: 0, nodes: graphNodes.slice(0, 3), edges: graphEdges.slice(0, 2), note: "A direct repeated pair that resurfaces across BCSE406L assignment windows. No bridge — the same two students, twice." },
    { id: "C-04", label: "Second hop", confidence: 0.62, pairCount: 3, bridgeCount: 1, nodes: graphNodes.slice(3), edges: graphEdges.slice(3), note: "A lower-score pocket at 0.62 — below direct-pair threshold, visible only through Neo4j multi-hop traversal." },
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
    localStorage.setItem("collabguard-investigation-filters", JSON.stringify({ activeCluster, threshold, bridgesOnly }));
    localStorage.setItem("collabguard-investigation-presets", JSON.stringify(presets));
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
  const chooseCluster = (id: string) => { setActiveCluster(id); setDrillOpen(true); setPathStep(0); setIsPlaying(false); };
  const savePreset = () => {
    const name = presetName.trim() || `Investigation ${presets.length + 1}`;
    setPresets((current) => [...current, { id: `${Date.now()}`, name, activeCluster, threshold, bridgesOnly }]);
    setPresetName("");
  };
  const loadPreset = (preset: Preset) => { setActiveCluster(preset.activeCluster); setThreshold(preset.threshold); setBridgesOnly(preset.bridgesOnly); setDrillOpen(true); setPathStep(0); setIsPlaying(false); };
  const renamePreset = (preset: Preset) => { const name = editingPresetName.trim(); if (!name) return; setPresets((current) => current.map((item) => item.id === preset.id ? { ...item, name } : item)); setEditingPresetId(null); setEditingPresetName(""); };
  const deletePreset = (id: string) => { setPresets((current) => current.filter((preset) => preset.id !== id)); if (editingPresetId === id) setEditingPresetId(null); };
  const togglePlayback = () => { if (pathStep >= pathNodes.length - 1) { setPathStep(0); setIsPlaying(true); return; } setIsPlaying((current) => !current); };
  const rewindPlayback = () => { setIsPlaying(false); setPathStep((current) => Math.max(0, current - 1)); };
  const replayPlayback = () => { setPathStep(0); setIsPlaying(true); };
  return <section className="cluster-explorer section-frame"><div className="explorer-heading"><div><SectionMarker>03 — CLUSTER EXPLORER</SectionMarker><h2>Filter the signal.<br /><span>Open the case.</span></h2></div><p>Seeded demo data mirrors the future Neo4j Cypher query shape. Move from a semester-wide Louvain graph down into the specific cluster that deserves faculty review.</p></div><div className="filter-bar"><div className="filter-group"><span className="filter-label">CLUSTER</span>{clusters.map((cluster) => <button key={cluster.id} className={activeCluster === cluster.id ? "is-active" : ""} onClick={() => chooseCluster(cluster.id)}>{cluster.id}<small>{cluster.confidence.toFixed(2)}</small></button>)}</div><label className="threshold-control"><span className="filter-label">MIN SCORE <b>{threshold.toFixed(2)}</b></span><input type="range" min="0.5" max="0.9" step="0.01" value={threshold} onChange={(event) => setThreshold(Number(event.target.value))} /></label><button className={`bridge-toggle ${bridgesOnly ? "is-active" : ""}`} onClick={() => setBridgesOnly((current) => !current)}><span className="toggle-indicator" /> bridge nodes only</button><span className="data-status"><i /> FRONTEND DEMO</span></div><div className="preset-strip"><div className="preset-heading"><span className="filter-label">SAVED INVESTIGATIONS</span><small>{presets.length} preset{presets.length === 1 ? "" : "s"}</small></div><div className="preset-create"><input value={presetName} onChange={(event) => setPresetName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") savePreset(); }} placeholder="Name this filter combination" aria-label="Preset name" /><button onClick={savePreset}>Save preset</button></div><div className="preset-list">{presets.length ? presets.map((preset) => <div className="preset-chip" key={preset.id}>{editingPresetId === preset.id ? <input autoFocus value={editingPresetName} onChange={(event) => setEditingPresetName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") renamePreset(preset); if (event.key === "Escape") setEditingPresetId(null); }} aria-label={`Rename ${preset.name}`} /> : <button className="preset-load" onClick={() => loadPreset(preset)}><span>{preset.name}</span><small>{preset.activeCluster} · {preset.threshold.toFixed(2)}{preset.bridgesOnly ? " · bridges" : ""}</small></button>}<div className="preset-actions">{editingPresetId === preset.id ? <button onClick={() => renamePreset(preset)} aria-label="Save preset name">Save</button> : <button onClick={() => { setEditingPresetId(preset.id); setEditingPresetName(preset.name); }} aria-label={`Rename ${preset.name}`}><Pencil size={12} /></button>}<button onClick={() => deletePreset(preset.id)} aria-label={`Delete ${preset.name}`}><Trash2 size={12} /></button></div></div>) : <span className="preset-empty">Save a named investigation to restore it later.</span>}</div></div><div className="explorer-grid"><div className="explorer-graph"><GraphBoard onSelect={() => undefined} nodes={selected.nodes} edges={selected.edges} visibleNodeIds={visibleNodeIds} highlightedNodeIds={highlightedNodeIds} pathAnnotations={pathAnnotations} /><div className="explorer-foot"><span><i className="status-light" /> {selected.nodes.length} nodes in view</span><span>threshold ≥ {threshold.toFixed(2)} · seeded session data</span></div></div><div className={`cluster-drilldown ${drillOpen ? "is-open" : ""}`} key={`${activeCluster}-${threshold}-${bridgesOnly}`}><div className="drill-top"><span>CLUSTER DETAIL</span><button onClick={() => setDrillOpen(false)} aria-label="Close cluster detail"><X size={15} /></button></div><div className="drill-identity"><div className="drill-code">{selected.id}</div><div><h3>{selected.label}</h3><span>{selected.note}</span></div></div><div className="drill-stats"><div><span>CONFIDENCE</span><strong>{selected.confidence.toFixed(2)}</strong></div><div><span>NODES</span><strong>{String(selected.nodes.length).padStart(2, "0")}</strong></div><div><span>PAIRS</span><strong>{String(selected.pairCount).padStart(2, "0")}</strong></div></div><div className="drill-path"><span className="filter-label">REVIEW PATH</span><p>{pathLabels.map((node, index) => <span className={index <= pathStep ? "is-visited" : ""} key={`${node}-${index}`}>{index > 0 && <b>→</b>} {node}</span>)}</p></div><div className="playback-panel"><div className="playback-top"><span className="filter-label">SHORTEST-PATH PLAYBACK</span><strong>STEP {String(pathStep + 1).padStart(2, "00")} / {String(pathNodes.length).padStart(2, "00")} · {pathTimes[pathStep]}</strong></div><input className="playback-slider" type="range" min="0" max={Math.max(0, pathNodes.length - 1)} step="1" value={pathStep} onChange={(event) => { setIsPlaying(false); setPathStep(Number(event.target.value)); }} aria-label="Scrub shortest path timeline" /><div className="playback-track"><span style={{ width: `${pathProgress}%` }} /></div><div className="playback-controls"><button onClick={rewindPlayback} aria-label="Rewind one path step" title="Rewind one step"><Rewind size={14} /></button><button className="playback-main" onClick={togglePlayback} aria-label={isPlaying ? "Pause playback" : "Play playback"} title={isPlaying ? "Pause" : pathStep >= pathNodes.length - 1 ? "Replay" : "Play"}>{isPlaying ? <Pause size={14} /> : pathStep >= pathNodes.length - 1 ? <RotateCcw size={14} /> : <Play size={14} />}</button><button onClick={replayPlayback} aria-label="Replay path from the start" title="Replay"><RotateCcw size={14} /></button><div className="speed-control"><span>speed</span>{[0.5, 1, 1.5, 2].map((value) => <button key={value} className={speed === value ? "is-active" : ""} onClick={() => setSpeed(value)}>{value}×</button>)}</div></div></div><div className="drill-actions"><button className="button button-primary" onClick={() => navigate("/architecture")}>View data flow <ArrowUpRight size={15} /></button></div></div></div><div className="data-warning"><Info size={14} /> Frontend-only demo: the Neo4j AuraDB and FastAPI backend are implemented separately. This dashboard shows the seeded simulation data.</div></section>;
}

function ComponentsPage() {
  const [selectedNodeId, setSelectedNodeId] = useState("sub-42");
  const [tab, setTab] = useState("graph");
  const [showHistory, setShowHistory] = useState(false);
  const selectedNode = graphNodes.find((node) => node.id === selectedNodeId) ?? graphNodes[2];
  const selectedInsight = nodeInsights[selectedNode.id] ?? nodeInsights["sub-42"];
  const selectedHistory = evidenceTimeline[selectedNode.id] ?? evidenceTimeline["sub-42"];
  const relatedNodes = graphNodes.filter((node) => selectedInsight.connections.includes(node.label));
  const highlightedNodeIds = [selectedNode.id, ...relatedNodes.map((node) => node.id)];
  const selectNode = (node: GraphNode) => { setSelectedNodeId(node.id); setTab("graph"); setShowHistory(false); };
  return <><PageIntro index="02" eyebrow="COMPONENTS / FACULTY DASHBOARD" title={<>A high-signal review surface for <em>faculty investigators.</em></>} body="These are the working pieces of the CollabGuard faculty dashboard: the Louvain cluster explorer, the evidence-chain graph, the node inspector with Winnowing fingerprint data, and the shortest-path playback panel." /><ClusterExplorer /><section className="components-showcase section-frame"><div className="showcase-header"><div><SectionMarker>04 — GRAPH VIEW</SectionMarker><h2>Evidence is the component.</h2></div><span className="demo-label"><CircleDot size={13} /> CLICK A NODE TO TRACE ITS LINKS</span></div><div className="component-grid"><div className="component-graph"><GraphBoard onSelect={selectNode} highlightedNodeIds={highlightedNodeIds} /></div><aside className="component-inspector"><div className="drawer-head"><span>NODE INSPECTOR / {selectedNode.kind.toUpperCase()}</span><ScanSearch size={17} /></div><div className="drawer-selected"><div className={`drawer-icon kind-${selectedNode.kind}`}>{selectedNode.short}</div><div><h3>{selectedNode.label}</h3><span>{selectedNode.meta}</span></div></div><p className="drawer-detail">{selectedInsight.signal}</p><div className="inspector-meta-grid"><div><span>OWNER / GROUP</span><strong>{selectedInsight.owner}</strong></div><div><span>COURSE WINDOW</span><strong>{selectedInsight.course}</strong></div><div><span>LAST OBSERVED</span><strong>{selectedInsight.lastSeen}</strong></div><div><span>FINGERPRINT</span><strong>{selectedInsight.fingerprint}</strong></div></div><div className="related-connections"><div className="related-heading"><span className="filter-label">RELATED NODES</span><strong>{relatedNodes.length} linked</strong></div>{relatedNodes.length ? <div className="related-list">{relatedNodes.map((node) => <button key={node.id} onClick={() => selectNode(node)}><span className={`related-dot dot-${node.kind}`} />{node.label}<ChevronRight size={13} /></button>)}</div> : <span className="related-empty">No related nodes in the current view.</span>}</div><div className="drawer-metrics"><div><span>WINNOWING SCORE</span><strong>{selectedNode.id === "sub-42" ? "0.81" : selectedNode.id === "sub-17" ? "0.81" : "0.62"}</strong></div><div><span>HOPS AWAY</span><strong>{selectedNode.id === "sub-42" ? "02" : "01"}</strong></div></div><button className={`evidence-toggle ${showHistory ? "is-open" : ""}`} onClick={() => setShowHistory((current) => !current)}><span><Clock3 size={14} /> {showHistory ? "Collapse evidence timeline" : "Expand evidence timeline"}</span><ChevronRight size={14} /></button>{showHistory && <div className="evidence-timeline">{selectedHistory.map((event, index) => <div className="evidence-event" key={`${event.time}-${event.label}`}><div className={`evidence-event-marker ${event.status}`}><span>{String(index + 1).padStart(2, "0")}</span></div><div className="evidence-event-copy"><div><strong>{event.label}</strong><time>{event.time}</time></div><p>{event.detail}</p></div></div>)}</div>}<button className="drawer-action" onClick={() => setTab("evidence")}>Open full evidence chain <ArrowUpRight size={15} /></button></aside></div></section><section className="component-lab section-frame"><div className="lab-tabs">{[["graph", "Graph nodes"], ["evidence", "Evidence row"], ["states", "System states"]].map(([key, label]) => <button key={key} className={tab === key ? "is-active" : ""} onClick={() => setTab(key)}>{label}</button>)}</div>{tab === "graph" && <div className="lab-panel"><div className="token-demo"><div className="token token-student">student</div><div className="token-line" /><div className="token token-submission">submission</div><div className="token-line" /><div className="token token-assignment">assignment</div></div><div><span className="overline">NODE LANGUAGE</span><h3>Three shapes, one readable graph.</h3><p>Shape carries semantic meaning before a faculty member opens the inspector. Circles identify people (Student nodes in Neo4j). Squares identify source artifacts (Submission nodes). Diamonds identify the assignment cohort window.</p></div></div>}{tab === "evidence" && <div className="lab-panel evidence-row-demo"><div className="evidence-row"><span className="row-status" /><strong>SUB-017</strong><span>→</span><strong>SUB-042</strong><span className="row-score">0.81</span><button>inspect <ChevronRight size={15} /></button></div><div className="evidence-row"><span className="row-status row-muted" /><strong>Student A</strong><span>→</span><strong>SUB-063</strong><span className="row-score">0.62</span><button>inspect <ChevronRight size={15} /></button></div><p className="lab-caption">Evidence rows keep the Winnowing score, direction, and action on one line for fast faculty review. The second row is below the direct-pair threshold — surfaced only by Neo4j traversal.</p></div>}{tab === "states" && <div className="lab-panel state-grid"><div><span className="state-dot online" /> <strong>Similarity engine ready</strong><small>Winnowing pipeline warm — awaiting next batch</small></div><div><span className="state-dot warning" /> <strong>Review needed</strong><small>3 Louvain clusters above threshold</small></div><div><span className="state-dot neutral" /> <strong>Ingesting</strong><small>Assignment 05 / 42% tokenised</small></div></div>}</section><CodeDiffViewer /><MLPredictInspector /></>;
}

function ResourcesPage() {
  const resources = [
    { index: "01", title: "Menai & Al-Hassoun (2013)", subtitle: "Similarity Detection in Java Programming Assignments", body: "Proc. 5th Int. Conf. on Computer Science and Information Technology. Early foundation for AST-based structural comparison in academic code submissions.", link: "https://doi.org/10.1109/CSIT.2013.6588788" },
    { index: "02", title: "Arora, Maurya & Sharma (2021)", subtitle: "Application of Java Relationship Graphs to Plagiarism Detection — A Neo4j Approach", body: "Proc. ICSIM, Yokohama, Japan, pp. 1–6. Demonstrates using Neo4j graph database for code relationship modelling — a direct precedent for CollabGuard's graph design.", link: "https://doi.org/10.1145/3451471.3451479" },
    { index: "03", title: "Tyagi, Arora & Sharma (2022)", subtitle: "Application of Java Relationship Graphs for Plagiarism Detection in Java Projects", body: "ICT Systems and Sustainability, Springer, pp. 761–772. Extends the JRG Neo4j approach; establishes that graph-native queries outperform relational joins for this class of problem.", link: "https://link.springer.com/chapter/10.1007/978-981-16-5987-4_77" },
    { index: "04", title: "Cheers & Lin (2020)", subtitle: "A Novel Graph-Based Program Representation for Java Code Plagiarism Detection", body: "Proc. ICSIM, pp. 115–122. Proposes program dependency graphs as similarity evidence, informing CollabGuard's node-and-edge model for Submission and Student entities.", link: "https://doi.org/10.1145/3382791.3382802" },
    { index: "05", title: "Maertens et al. (2022)", subtitle: "Dolos: Language-Agnostic Plagiarism Detection in Source Code", body: "Journal of Computer Assisted Learning, vol. 38, no. 4, pp. 1046–1061. The state-of-the-art in Winnowing-based fingerprinting; provides the scoring baseline CollabGuard's similarity engine targets.", link: "https://doi.org/10.1111/jcal.12662" },
    { index: "06", title: "Ljubovic & Pajic (2020)", subtitle: "Plagiarism Detection Using Feature Extraction From Ultra-Fine-Grained Repositories", body: "IEEE Access, vol. 8, pp. 96505–96514. Feature-extraction approach that informs CollabGuard's Python AST tokenisation pipeline design.", link: "https://doi.org/10.1109/ACCESS.2020.2997017" },
    { index: "07", title: "Tian et al. (2015)", subtitle: "Software Plagiarism Detection With Birthmarks Based on Dynamic Key Instruction Sequences", body: "IEEE Trans. Software Engineering, vol. 41, no. 12, pp. 1217–1235. Dynamic birthmark techniques — context for why static AST fingerprinting is the appropriate baseline for CollabGuard's scope.", link: "https://doi.org/10.1109/TSE.2015.2428236" },
    { index: "08", title: "Mason (2019)", subtitle: "Variations on a Theme: Academic Integrity and Program Code", body: "Proc. 21st Australasian Computing Education Conf., pp. 56–63. Establishes the faculty-judgement framing that shapes CollabGuard's design principle: detection supports faculty, never replaces it.", link: "https://doi.org/10.1145/3286960.3286975" },
    { index: "09", title: "Blondel et al. (2008)", subtitle: "Fast Unfolding of Communities in Large Networks (Louvain Method)", body: "Journal of Statistical Mechanics: Theory and Experiment. The foundational paper for the Louvain community detection algorithm used by Neo4j GDS to identify collusion clusters in CollabGuard.", link: "https://doi.org/10.1088/1742-5468/2008/10/P10008" },
    { index: "10", title: "Review: Similarity Detection for Academic Source Code", subtitle: "Summarising Attribute-Based and Structure-Based Detection Approaches", body: "A survey of attribute-based (token counting) and structure-based (AST, PDG) plagiarism detection methods, motivating the Winnowing fingerprinting choice for CollabGuard's similarity engine.", link: "https://ieeexplore.ieee.org" },
  ];
  return <><PageIntro index="03" eyebrow="REFERENCES / READING ROOM" title={<>The ten papers behind the <em>relationship model.</em></>} body="The 10 required journal and conference references that ground the CollabGuard proposal — spanning Neo4j graph models, Winnowing fingerprinting, Louvain community detection, and the pedagogical case for explainable academic integrity tooling." /><section className="resources-section section-frame"><div className="resources-head"><SectionMarker>01 — REFERENCE INDEX</SectionMarker><span>10 required sources / BCSE406L proposal</span></div><div className="resource-list">{resources.map(({ index, title, subtitle, body, link }) => <a className="resource-row" href={link} target="_blank" rel="noreferrer" key={index}><span className="resource-index">{index}</span><div><h3>{title}</h3><em style={{ fontSize: "0.78em", opacity: 0.7, display: "block", marginBottom: "0.35em" }}>{subtitle}</em><p>{body}</p></div><span className="resource-link">{link.replace("https://", "")}<ExternalLink size={14} /></span></a>)}</div></section><section className="reading-note section-frame"><div><SectionMarker>02 — DESIGN NOTE</SectionMarker><h2>Polyglot persistence is not a compromise here.</h2></div><p>References [2], [3], and [4] each establish that graph-native databases outperform relational schemas for the traversal and community-detection workloads that CollabGuard requires. References [5] and [6] ground the Winnowing similarity engine choice. Reference [9] provides the Louvain algorithm that Neo4j GDS implements. Together they justify why MongoDB + Neo4j is the structurally appropriate stack — not a fashionable choice.</p></section></>;
}

function ArchitectureDiagram() {
  return <div className="architecture-diagram"><div className="diagram-layer diagram-ui"><span className="diagram-tag">01 / FACULTY USER</span><div className="diagram-box"><ShieldCheck size={20} /><div><strong>React + Next.js Dashboard</strong><small>JWT login · Louvain cluster graph · submission browser · evidence-chain viewer · shortest-path playback</small></div></div></div><div className="diagram-arrow">↓ <span>REST / JSON (FastAPI)</span></div><div className="diagram-layer diagram-api"><span className="diagram-tag">02 / SERVICE LAYER</span><div className="diagram-box"><Server size={20} /><div><strong>Python FastAPI (Uvicorn)</strong><small>JWT auth middleware · submission ingestion · AST tokenisation + Winnowing similarity engine · Neo4j Cypher graph query service</small></div></div><div className="api-pills"><span>AST tokenisation</span><span>Winnowing fingerprinting</span><span>Louvain / GDS</span><span>Shortest-path Cypher</span><span>RAG explanation / stretch</span></div></div><div className="diagram-arrow">↓ <span>polyglot persistence</span></div><div className="diagram-databases"><div className="diagram-layer database-box"><span className="diagram-tag">03A / DOCUMENT STORE</span><div className="diagram-box"><Database size={20} /><div><strong>MongoDB Atlas</strong><small>students · submissions (raw .py source + metadata) · pairwise scores · faculty_users (bcrypt hashes)</small></div></div></div><div className="diagram-layer database-box"><span className="diagram-tag">03B / GRAPH STORE</span><div className="diagram-box"><Network size={20} /><div><strong>Neo4j AuraDB + GDS</strong><small>(Student)-[:SUBMITTED]→(Submission)-[:SIMILAR_TO {"{"}score{"}"}]→(Submission) · Louvain · shortest_path</small></div></div></div></div></div>;
}

function ArchitecturePage() {
  return <><PageIntro index="04" eyebrow="ARCHITECTURE / DATA FLOW" title={<>Two stores. One <em>explainable system.</em></>} body="CollabGuard follows a three-tier architecture with a polyglot persistence layer: MongoDB Atlas for flexible document storage (raw submissions, metadata, faculty accounts) and Neo4j AuraDB for the derived similarity graph (SIMILAR_TO relationships, Louvain clusters, shortest-path evidence chains)." /><section className="architecture-page section-frame"><div className="architecture-page-head"><div><SectionMarker>01 — SYSTEM DIAGRAM</SectionMarker><h2>From submission<br /><span>to signal.</span></h2></div><div className="architecture-note"><Info size={16} /><p>A faculty member uploads a Python submission via the React + Next.js dashboard. The FastAPI backend tokenises it with Python's <code>ast</code> module, runs Winnowing fingerprinting, computes pairwise scores against prior submissions, stores the source document in MongoDB, and writes SIMILAR_TO edges to Neo4j. The dashboard then queries Neo4j for Louvain clusters and shortest-path evidence.</p></div></div><ArchitectureDiagram /></section><section className="data-flow section-frame"><div><SectionMarker>02 — WHY TWO DATABASES</SectionMarker><h2>Each store used for the<br /><span>workload it is built for.</span></h2></div><div className="flow-list"><div><span>01</span><h3>MongoDB: flexible at ingest</h3><p>Submissions arrive as heterogeneous Python source files with varying metadata. MongoDB's schema-less document model accepts them as whole records without a migration — ideal for raw ingestion, faculty account documents, and per-submission score storage.</p></div><div><span>02</span><h3>Neo4j: weighted at comparison</h3><p>Winnowing scores become SIMILAR_TO edge weights between Submission nodes. Neo4j's native graph model stores these relationships without the JOIN tables and recursive CTEs a relational schema would require for the same traversal queries.</p></div><div><span>03</span><h3>GDS: traversable at review</h3><p>Neo4j Graph Data Science runs Louvain community detection and Dijkstra shortest-path in-database, across the full SIMILAR_TO edge set, returning cluster membership and evidence chains in a single Cypher query — not a chain of application-side iterations.</p></div></div></section><section className="data-flow section-frame" style={{ borderTop: "1px solid var(--line)" }}><div><SectionMarker>03 — TECHNOLOGY STACK</SectionMarker><h2>The full<br /><span>component list.</span></h2></div><div className="flow-list"><div><span>FE</span><h3>React + Next.js (App Router)</h3><p>Faculty-facing dashboard — JWT login, Louvain cluster graph, submission browser, evidence-chain viewer, shortest-path playback. Deployed to Vercel.</p></div><div><span>BE</span><h3>Python FastAPI + Uvicorn</h3><p>REST API — submission ingestion, similarity engine (Python ast + Winnowing), JWT middleware, Neo4j Cypher query service. Deployed to Render or Railway.</p></div><div><span>DB1</span><h3>MongoDB Atlas (free tier)</h3><p>Collections: students, submissions (raw source + metadata), pairwise_scores, faculty_users (bcrypt-hashed passwords). Schema-less ingest, whole-document reads.</p></div><div><span>DB2</span><h3>Neo4j AuraDB + GDS (free tier)</h3><p>Node labels: Student, Submission. Relationship types: SUBMITTED, SIMILAR_TO {"{"}score{"}"}, FLAGGED_WITH. Algorithms: Louvain, Dijkstra shortest path.</p></div><div><span>★</span><h3>(Stretch) LangChain + LangGraph RAG</h3><p>Retrieves the Neo4j evidence chain for a flagged Louvain cluster and generates a plain-English summary for faculty review via an LLM API (OpenAI or similar).</p></div></div></section><section className="architecture-footer section-frame"><button className="button button-primary" onClick={() => navigate("/components")}>See the interface layer <ArrowRight size={16} /></button><span>ARCHITECTURE / BCSE406L REVIEW 1 / 2026—27</span></section></>;
}

function Footer() { return <footer className="site-footer section-frame"><div className="footer-brand"><LogoMark /><span>COLLABGUARD</span></div><p>Graph-based academic integrity detection. Built for BCSE406L by Dipanjan Das (23BCE0131) · VIT Vellore · 2026–27.</p><span className="footer-note">NOSQL DATABASE PROJECT / FRONTEND PROTOTYPE / PROPOSAL REVIEW 1</span></footer>; }

function DevRefreshNotice() {
  return null;
}

function FacultyAuthGate({ onNavigate }: { onNavigate: (path: RouteKey) => void }) {
  const quickLoginGuide = () => {
    const user = {
      id: "fac_guide_session",
      email: "faculty@vit.ac.in",
      name: "Faculty Guide",
      department: "School of Computer Science and Engineering (SCOPE)",
      course_code: "BCSE406L",
      role: "faculty",
    };
    localStorage.setItem("collabguard_user", JSON.stringify(user));
    localStorage.setItem("collabguard_token", "jwt_guide_session_verified");
    window.dispatchEvent(new Event("auth_changed"));
  };

  return (
    <section className="section-frame" style={{ paddingTop: "4.5rem", paddingBottom: "6rem", textAlign: "center", maxWidth: "680px", margin: "0 auto" }}>
      <div style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "64px",
        height: "64px",
        borderRadius: "50%",
        background: "rgba(255, 107, 95, 0.1)",
        border: "1px solid rgba(255, 107, 95, 0.3)",
        color: "#ff6b5f",
        marginBottom: "1.5rem",
      }}>
        <ShieldCheck size={32} />
      </div>
      <span style={{
        display: "block",
        fontFamily: "var(--mono)",
        fontSize: "11px",
        letterSpacing: "0.15em",
        textTransform: "uppercase",
        color: "#ff6b5f",
        marginBottom: "0.5rem",
      }}>
        ACADEMIC INTEGRITY ACCESS CONTROL · COURSE BCSE406L
      </span>
      <h1 style={{ fontSize: "clamp(1.8rem, 3vw, 2.6rem)", fontWeight: 800, margin: "0 0 1rem", letterSpacing: "-0.02em" }}>
        Faculty Authorization <span style={{ color: "var(--primary)" }}>Required</span>
      </h1>
      <p style={{ color: "var(--muted)", fontSize: "15px", lineHeight: 1.6, margin: "0 0 2rem" }}>
        The collusion graph explorer, AST code diffs, and NoSQL query engine contain sensitive student examination data. Access is restricted to authenticated faculty members, course guides, and evaluators.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxWidth: "380px", margin: "0 auto" }}>
        <button
          onClick={() => onNavigate("/login")}
          style={{
            background: "var(--primary)",
            color: "#0d0e0c",
            padding: "12px 20px",
            fontWeight: 700,
            fontSize: "13px",
            fontFamily: "var(--mono)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          <span>Sign In with Faculty Account (JWT)</span>
          <ArrowRight size={16} />
        </button>

        <button
          onClick={quickLoginGuide}
          style={{
            background: "rgba(255, 255, 255, 0.04)",
            color: "var(--foreground)",
            border: "1px solid var(--line)",
            padding: "10px 18px",
            fontWeight: 600,
            fontSize: "12px",
            fontFamily: "var(--mono)",
          }}
        >
          1-Click Authenticate as Faculty Guide
        </button>

        <button
          onClick={() => onNavigate("/")}
          style={{
            background: "transparent",
            color: "var(--muted)",
            padding: "8px",
            fontSize: "12px",
            fontFamily: "var(--mono)",
          }}
        >
          &larr; Return to Home Page
        </button>
      </div>
    </section>
  );
}

function App() {
  const path = useRoute();
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      try {
        setIsLoggedIn(Boolean(localStorage.getItem("collabguard_user")));
      } catch {
        setIsLoggedIn(false);
      }
    };
    checkAuth();
    window.addEventListener("storage", checkAuth);
    window.addEventListener("auth_changed", checkAuth);
    return () => {
      window.removeEventListener("storage", checkAuth);
      window.removeEventListener("auth_changed", checkAuth);
    };
  }, []);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      touchMultiplier: 2,
    });
    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    return () => lenis.destroy();
  }, []);
  useEffect(() => {
    const savedTheme = localStorage.getItem("collabguard-theme") as "dark" | "light" | null;
    if (savedTheme) setTheme(savedTheme);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("collabguard-theme", theme);
  }, [theme]);
  useEffect(() => {
    document.title = routeMeta[path].title;
    const description = document.querySelector('meta[name="description"]');
    description?.setAttribute("content", routeMeta[path].description);
  }, [path]);

  const isFacultyProtected = path === "/components" || path === "/database";
  const page =
    path === "/" ? (
      <HomePage />
    ) : path === "/about" ? (
      <AboutPage />
    ) : path === "/resources" ? (
      <ResourcesPage />
    ) : path === "/architecture" ? (
      <ArchitecturePage />
    ) : path === "/login" ? (
      <LoginPage onNavigate={navigate} />
    ) : isFacultyProtected && !isLoggedIn ? (
      <FacultyAuthGate onNavigate={navigate} />
    ) : path === "/components" ? (
      <ComponentsPage />
    ) : path === "/database" ? (
      <DatabaseOperations />
    ) : (
      <HomePage />
    );

  return <div className="site-shell"><NavShell navigate={navigate} theme={theme} onToggleTheme={() => setTheme((current) => current === "dark" ? "light" : "dark")} /><DevRefreshNotice /><main className="page-stage" key={path}>{page}</main><Footer /></div>;
}

export default App;
