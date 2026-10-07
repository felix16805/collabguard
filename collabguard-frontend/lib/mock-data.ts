export type NodeKind = "student" | "submission" | "assignment";
export type RouteKey = "/" | "/about" | "/components" | "/resources" | "/architecture";

export type GraphNode = {
  id: string;
  label: string;
  short: string;
  kind: NodeKind;
  x: number;
  y: number;
  detail: string;
  meta: string;
};

export type PathAnnotation = { step: number; timestamp: string };

export const routeLabels: Record<RouteKey, string> = {
  "/": "Home",
  "/about": "About",
  "/components": "Components",
  "/resources": "Resources",
  "/architecture": "Architecture",
};

export const routeMeta: Record<RouteKey, { title: string; description: string }> = {
  "/": { title: "CollabGuard — See the pattern beyond the pair", description: "CollabGuard maps code submissions as a graph to surface indirect collusion and explainable academic integrity evidence." },
  "/about": { title: "About CollabGuard — The project brief", description: "Read the problem, scope, objectives, and research framing behind the CollabGuard NoSQL project." },
  "/components": { title: "Components — CollabGuard review surface", description: "Explore the graph nodes, evidence rows, and system states used by the CollabGuard faculty dashboard." },
  "/resources": { title: "Resources — CollabGuard reading room", description: "Selected references for Neo4j, MongoDB, Winnowing, FastAPI, and the CollabGuard relationship model." },
  "/architecture": { title: "Architecture — CollabGuard data flow", description: "See how React, FastAPI, MongoDB, and Neo4j work together in the CollabGuard project architecture." },
};

export const graphNodes: GraphNode[] = [
  { id: "student-a", label: "Student A", short: "A", kind: "student", x: 15, y: 48, detail: "Repeated origin node across three assignment windows.", meta: "student / 03 links" },
  { id: "sub-17", label: "SUB-017", short: "17", kind: "submission", x: 35, y: 24, detail: "AST fingerprint intersects with SUB-042 at 0.81.", meta: "assignment 04 / score 0.81" },
  { id: "sub-42", label: "SUB-042", short: "42", kind: "submission", x: 55, y: 49, detail: "Bridge submission. Connects two otherwise separate pockets.", meta: "assignment 04 / bridge" },
  { id: "student-b", label: "Student B", short: "B", kind: "student", x: 81, y: 32, detail: "Downstream student with a repeated pair signature.", meta: "student / 04 links" },
  { id: "sub-63", label: "SUB-063", short: "63", kind: "submission", x: 77, y: 75, detail: "Second-hop evidence. Similarity is below the pairwise threshold.", meta: "assignment 05 / score 0.62" },
  { id: "assignment-5", label: "ASSIGNMENT 05", short: "05", kind: "assignment", x: 38, y: 82, detail: "Repeated pairing detected across the next assignment window.", meta: "window / 14 days" },
];

export const graphEdges = [
  ["student-a", "sub-17"], ["sub-17", "sub-42"], ["sub-42", "student-b"], ["sub-42", "sub-63"], ["student-a", "assignment-5"], ["assignment-5", "sub-63"], ["student-b", "sub-63"],
] as const;

export const nodeInsights: Record<string, { owner: string; course: string; lastSeen: string; fingerprint: string; signal: string; connections: string[] }> = {
  "student-a": { owner: "Student A", course: "CS-404 / Lab 04", lastSeen: "18:41:02", fingerprint: "origin / 03 links", signal: "Repeated origin across three assignment windows.", connections: ["SUB-017", "ASSIGNMENT 05"] },
  "sub-17": { owner: "Student A", course: "CS-404 / Assignment 04", lastSeen: "18:40:18", fingerprint: "AST-91C2 / 81%", signal: "Shared token windows intersect with SUB-042.", connections: ["Student A", "SUB-042"] },
  "sub-42": { owner: "Student A + Student B", course: "CS-404 / Assignment 04", lastSeen: "18:42:07", fingerprint: "AST-B7F0 / bridge", signal: "Bridge submission connects two otherwise separate pockets.", connections: ["SUB-017", "Student B", "SUB-063"] },
  "student-b": { owner: "Student B", course: "CS-404 / Lab 04", lastSeen: "18:39:46", fingerprint: "downstream / 04 links", signal: "Downstream student with a repeated pair signature.", connections: ["SUB-042", "SUB-063"] },
  "sub-63": { owner: "Student B", course: "CS-404 / Assignment 05", lastSeen: "18:38:11", fingerprint: "AST-44AD / 62%", signal: "Second-hop evidence below the pairwise threshold.", connections: ["SUB-042", "ASSIGNMENT 05", "Student B"] },
  "assignment-5": { owner: "Cohort / 2026-27", course: "CS-404 / Assignment 05", lastSeen: "18:37:54", fingerprint: "window / 14 days", signal: "Repeated pairing emerges in the next assignment window.", connections: ["Student A", "SUB-063"] },
};

export const evidenceTimeline: Record<string, { time: string; label: string; detail: string; status: string }[]> = {
  "student-a": [
    { time: "18:41:02", label: "Origin observed", detail: "Student A linked to SUB-017 in Assignment 04.", status: "flagged" },
    { time: "17:12:44", label: "Repeated pairing", detail: "Same origin appears again in the prior lab window.", status: "review" },
    { time: "15:08:19", label: "First ingest", detail: "Faculty dataset imported with a stable student identifier.", status: "logged" },
  ],
  "sub-17": [
    { time: "18:40:18", label: "Fingerprint intersect", detail: "AST-91C2 overlaps with SUB-042 at 0.81 similarity.", status: "flagged" },
    { time: "18:39:52", label: "Submission scored", detail: "Winnowing pass completed across 1,248 tokens.", status: "scored" },
    { time: "18:36:10", label: "Source ingested", detail: "Assignment 04 source file stored for comparison.", status: "logged" },
  ],
  "sub-42": [
    { time: "18:42:07", label: "Bridge detected", detail: "Submission connects the A and B evidence pockets.", status: "flagged" },
    { time: "18:41:25", label: "Cluster expanded", detail: "C-03 gained a second-hop relationship through SUB-042.", status: "review" },
    { time: "18:37:06", label: "Source ingested", detail: "Assignment 04 source file stored for comparison.", status: "logged" },
  ],
  "student-b": [
    { time: "18:39:46", label: "Downstream link", detail: "Student B connected to the bridge submission.", status: "flagged" },
    { time: "17:48:03", label: "Pair repeated", detail: "A similar signature reappeared in the previous window.", status: "review" },
  ],
  "sub-63": [
    { time: "18:38:11", label: "Second hop", detail: "Similarity remained below the direct pair threshold.", status: "review" },
    { time: "18:35:27", label: "Submission scored", detail: "Fingerprint score calculated at 0.62.", status: "scored" },
  ],
  "assignment-5": [
    { time: "18:37:54", label: "Window opened", detail: "Assignment 05 cohort window became queryable.", status: "logged" },
    { time: "16:22:14", label: "Pairing repeated", detail: "Student A and Student B signatures recur across windows.", status: "review" },
  ],
};

export const methodContent = {
  fingerprint: { label: "01 / Fingerprint", title: "Similarity without the noise.", body: "Source files are tokenised into stable fingerprints before comparison. Formatting changes do not hide shared structure, and each edge keeps a reason to exist.", code: "tokens → winnow(k=5) → fingerprint → score" },
  traverse: { label: "02 / Traverse", title: "Follow the trail, not just the pair.", body: "Neo4j turns each submission into a traversable piece of evidence. Move from a student to a submission, across a bridge node, and into the cluster that explains the pattern.", code: "MATCH p=(s:Student)-[*1..4]-(t:Student)" },
  explain: { label: "03 / Explain", title: "Every flag comes with a path.", body: "The dashboard pairs a cluster score with the exact nodes, repeated pairs, and shortest path that produced it. Suspicion becomes inspectable evidence.", code: "cluster → evidence chain → faculty review" },
};

export type MethodKey = keyof typeof methodContent;
