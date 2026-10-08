# CollabGuard — Graph-Based Academic Integrity & Code-Collusion Detection

> **Course**: BCSE406L — NoSQL Databases (Winter Semester 2025–26)  
> **Institution**: Vellore Institute of Technology (VIT), Vellore  
> **Student / Author**: Dipanjan Das ([@felix16805](https://github.com/felix16805)) — Reg. No. `23BCE0131` (Batch NS25)  
> **Faculty Guide**: Dr. D. Vivek  

---

## Executive Summary

Standard academic plagiarism detection tools (such as MOSS, JPlag, and Turnitin) compare submissions **pairwise**, reporting similarity scores between two isolated files at a time. This approach fails to detect **indirect collusion networks** — rings of students who share code via intermediaries, split modules across partners, or reuse fragments across different semesters. Because no single pair crosses the alert threshold, these groups evade detection.

**CollabGuard** solves this by modeling student programming submissions as an interconnected **graph**:
- **Students** and **Submissions** are represented as nodes.
- **Pairwise AST similarity scores** (computed via Abstract Syntax Tree normalization and Winnowing fingerprinting) form weighted relationships (`SIMILAR_TO`).
- Native graph traversal algorithms on **Neo4j** (such as **Louvain Community Detection**, Weakly Connected Components, and Shortest-Path analysis) surface collusion rings that would otherwise require prohibitive recursive joins in a relational database.
- Raw submission metadata, full source code, and token fingerprints are stored in **MongoDB** for flexible, schema-less document persistence.
- An **Adaptive Machine Learning Engine** combines AST metrics, TF-IDF semantic embeddings, unsupervised boilerplate filtering, and graph topology features into a self-improving **Random Forest Classifier** with a **Faculty Active Learning Feedback Loop**.

---

## 1. WHY We Did It (Problem Statement & Justification)

### 1.1 The Pairwise Failure Mode
```
[Student A] ──(92% match)──> [Student B]  <-- Caught by traditional MOSS
[Student A] ──(48% match)──> [Student B] ──(52% match)──> [Student C] <-- MISSED by pairwise tools!
```
When students share code indirectly (e.g., Student A shares with Student B, who refactors variables and shares with Student C), neither pair $(A, B)$ nor $(B, C)$ crosses a typical 70% flag threshold. However, in graph space, $A$, $B$, and $C$ form a tightly coupled **connected component** with high clustering density.

### 1.2 Why Polyglot NoSQL?
Relational databases (SQL) require multi-table recursive self-joins to find multi-hop connections, which scale as $O(N^k)$ where $k$ is the hop count. In CollabGuard, we divide responsibilities across two specialized NoSQL paradigms:

| Database | Model | Role in CollabGuard | Justification |
| :--- | :--- | :--- | :--- |
| **MongoDB Atlas / 7.0** | Document Store | Raw `.py` source code, AST token streams, Winnowing fingerprints, batch metadata, faculty feedback | Schema-less flexibility for variable-length code submissions and nested fingerprint arrays; high write throughput. |
| **Neo4j AuraDB / 5.18** | Property Graph Store | `(:Student)`, `(:Submission)`, `[:SUBMITTED]`, `[:SIMILAR_TO {score}]` | Constant-time pointer hopping for graph traversal, native **Louvain Community Detection** (GDS), and shortest path discovery. |

### 1.3 Why Machine Learning & Active Learning?
- **Boilerplate False Positives**: Course instructor starter code (templates, imports, assignment helper functions) inflates raw lexical similarity. ML auto-learns starter code across the class batch and discounts it.
- **Obfuscation Detection**: Students rename variables or swap loops for list comprehensions. Subword semantic embeddings detect logic equivalence beyond syntax.
- **Continuous Improvement**: As professors review flagged clusters and click *"Confirmed Collusion"* or *"Permitted Starter Code"*, the system retrains itself incrementally via active learning.

---

## 2. WHAT We Did (Architecture & Core Features)

```
                            ┌──────────────────────────────────────────────┐
                            │      Next.js 16 Interactive Frontend         │
                            │  (CardNav, GraphBoard, ClusterExplorer, Diffs)│
                            └──────────────────────┬───────────────────────┘
                                                   │ REST API / JSON
                                                   ▼
                            ┌──────────────────────────────────────────────┐
                            │           FastAPI Python Backend             │
                            │ (Auth, Batch Ingestion, Detection, ML, Graph) │
                            └──────┬───────────────────────┬───────────────┘
                                   │                       │
             ┌─────────────────────┴──────┐         ┌──────┴────────────────────┐
             ▼                            ▼         ▼                           ▼
    ┌──────────────────┐        ┌───────────────────────┐             ┌──────────────────┐
    │ AST Tokenizer &  │        │   Multi-Modal ML      │             │  Graph Analytics │
    │ Winnowing Engine │        │ (Random Forest / 7D)  │             │ (Louvain / Path) │
    └────────┬─────────┘        └──────────┬────────────┘             └─────────┬────────┘
             │                             │                                    │
             ▼                             ▼                                    ▼
    ┌───────────────────────────────────────────┐             ┌──────────────────────────────────┐
    │         MongoDB 7.0 (Document Store)      │             │    Neo4j 5.18 (Property Graph)   │
    │  • students        • similarity_pairs     │             │  • (:Student)-[:SUBMITTED]->     │
    │  • submissions     • faculty_feedback     │             │  • (:Submission)-[:SIMILAR_TO]-> │
    │  • batches         • users (bcrypt)       │             │  • Louvain Community Clusters    │
    └───────────────────────────────────────────┘             └──────────────────────────────────┘
```

1. **AST Parsing & Normalization**: Strips comments/docstrings and normalizes variable/function identifiers to eliminate evasion via renaming.
2. **Winnowing Algorithm (MOSS-style)**: $k$-gram hashing ($k=25$) with sliding window minimum selection ($t=10$) for robust, position-aware fingerprinting.
3. **Graph Clustering**: Syncs similarity edges into Neo4j; executes Louvain algorithm to partition students into collusion rings.
4. **4-Tier Machine Learning Engine**:
   - **Tier 1**: Unsupervised Boilerplate & Starter Code Auto-Learner.
   - **Tier 2**: Subword TF-IDF Code Semantic Embedder (logic similarity).
   - **Tier 3**: Graph Structural Embedder (Node2Vec style neighborhood & broker betweenness centrality).
   - **Tier 4**: Adaptive Random Forest Classifier with Active Learning / Faculty Feedback Retraining.
5. **Full REST API**: Clean FastAPI backend with JWT faculty authentication, batch submission endpoints, graph visualization queries, and explainable ML predictions.
6. **Next.js 16 UI**: Dark-mode frontend with dynamic multi-slug routing, animated `CardNav`, interactive graph canvas, and side-by-side code diffs.
7. **Container Orchestration**: Production-ready `docker-compose.yml` for MongoDB, Neo4j (with APOC), FastAPI, and Next.js.

---

## 3. HOW We Did It (Technical Deep-Dive & Mathematical Model)

### 3.1 AST Normalization & Tokenization
Using Python's `ast.NodeTransformer`:
- Function names (except dunders) are mapped to `FUNC_1, FUNC_2, ...`
- Local variables and parameters are mapped to `VAR_1, VAR_2, ...`
- Constants are typed as `CONST:int, CONST:str, ...`
- A lexical fallback tokenizer ensures incomplete code with syntax errors is still processed.

### 3.2 Winnowing Fingerprinting Algorithm
1. Form $k$-grams from normalized tokens $T = [t_1, t_2, \dots, t_N]$ with size $k=25$.
2. Compute deterministic 64-bit SHA-256 rolling hash $h_i = \text{Hash}(t_i, \dots, t_{i+k-1})$.
3. Slide a window of size $t=10$ over hashes $[h_1, \dots, h_m]$. In each window $W_j = [h_j, \dots, h_{j+t-1}]$, select the minimum hash:
   $$f_j = \min(W_j) \quad (\text{rightmost selected on tie})$$
4. Record selected fingerprints with source line ranges $[L_{\text{start}}, L_{\text{end}}]$.
5. Compute similarity metrics:
   $$\text{Jaccard}(A, B) = \frac{|F_A \cap F_B|}{|F_A \cup F_B|}, \quad \text{Containment}(A, B) = \frac{|F_A \cap F_B|}{\min(|F_A|, |F_B|)}$$
   $$\text{Score}(A, B) = 0.4 \times \text{Jaccard}(A, B) + 0.6 \times \text{Containment}(A, B)$$

### 3.3 Multi-Modal 7D Machine Learning Feature Vector
For every submission pair $(i, j)$, an active 7-dimensional feature vector is extracted:
$$\vec{x} = \begin{bmatrix}
x_1: \text{Winnowing Composite Similarity Score} \\
x_2: \text{Token Containment Ratio} \\
x_3: \text{Subword Semantic TF-IDF Cosine Similarity} \\
x_4: \text{Learned Boilerplate Overlap Ratio} \\
x_5: \text{Length Ratio } \min(|T_1|, |T_2|) / \max(|T_1|, |T_2|) \\
x_6: \text{Graph Neighborhood Jaccard Similarity} \\
x_7: \text{Max Betweenness Centrality (Broker Score)}
\end{bmatrix}$$

The **Random Forest Classifier** ($M=30$ estimators, tree depth $d=4$) maps $\vec{x} \to P(\text{Collusion}) \in [0.0, 1.0]$.

### 3.4 Active Learning / Continuous Feedback Loop
$$\text{Faculty Reviews Pair} \xrightarrow{\text{Label } y \in \{0, 1\}} \text{MongoDB } (\texttt{faculty\_feedback}) \xrightarrow{\texttt{POST /api/ml/retrain}} \text{Incremental Model Fit} \to \text{Save } \texttt{.joblib}$$

---

## 4. WHERE We Did It (Project File Structure)

```
nosql-project/
├── docker-compose.yml                  # Multi-container orchestration (Mongo, Neo4j, Backend, Frontend)
├── .gitignore                          # Root ignore for venv, pycache, .next, and environment files
├── README.md                           # Comprehensive documentation (this file)
│
├── collabguard-backend/                # Python FastAPI Backend & ML Engine
│   ├── Dockerfile                      # Production Python 3.11-slim container definition
│   ├── requirements.txt                # FastAPI, Motor, Neo4j, Scikit-learn, NetworkX, Pytest
│   ├── pytest.ini                      # Pytest pythonpath configuration
│   ├── .env.example                    # Sample environment variables
│   │
│   ├── app/
│   │   ├── main.py                     # FastAPI application, CORS, and Lifespan event manager
│   │   ├── core/
│   │   │   ├── config.py               # Pydantic Settings (MongoDB, Neo4j, JWT, Algorithm thresholds)
│   │   │   └── security.py             # Bcrypt password hashing & JWT encoding/validation
│   │   ├── db/
│   │   │   ├── mongodb.py              # Motor async MongoDB client, index creation & fallback
│   │   │   └── neo4j.py                # Async Neo4j Bolt client, Cypher queries & NetworkX fallback
│   │   ├── engine/
│   │   │   ├── tokenizer.py            # AST visitor normalizer & fallback lexical tokenizer
│   │   │   ├── winnowing.py            # Winnowing fingerprinting & Jaccard/containment scoring
│   │   │   └── pipeline.py             # End-to-end analysis orchestration & persistence
│   │   ├── ml/
│   │   │   ├── boilerplate.py          # Tier 1: Unsupervised starter code & template auto-learner
│   │   │   ├── embeddings.py           # Tier 2: Subword TF-IDF semantic vectorizer & cosine similarity
│   │   │   ├── graph_embeddings.py     # Tier 3: Graph topology, neighborhood & broker centrality
│   │   │   ├── classifier.py           # Tier 4: Adaptive Random Forest classifier & explainability
│   │   │   └── feedback.py             # Active Learning faculty feedback collector & retrainer
│   │   ├── routers/
│   │   │   ├── auth.py                 # POST /api/auth/register, /login, GET /me
│   │   │   ├── submissions.py          # POST /api/submissions/batch, GET /batches, GET /batch/{id}
│   │   │   ├── graph.py                # GET /api/graph/{id}, GET /shortest-path
│   │   │   ├── reports.py              # GET /api/reports/{id}, GET /pair/{id1}/{id2}
│   │   │   ├── demo.py                 # POST /api/demo/seed (Seeds Course BCSE406L Batch NS25)
│   │   │   └── ml.py                   # POST /api/ml/predict-pair, /feedback, /retrain, GET /status
│   │   └── schemas/
│   │       ├── auth.py                 # Pydantic schemas for user registration, login, JWT
│   │       ├── submissions.py          # Pydantic schemas for batch uploads & summaries
│   │       └── graph.py                # Pydantic schemas for graph nodes, links & diffs
│   │
│   ├── models/
│   │   └── collusion_classifier.joblib # Serialized Random Forest model weights checkpoint
│   │
│   └── tests/
│       ├── test_detection.py           # AST normalization & Winnowing unit tests
│       ├── test_api.py                 # Integration tests for FastAPI endpoints
│       └── test_ml.py                  # Unit tests for Boilerplate, Embeddings, Classifier & Active Loop
│
└── collabguard-frontend/               # Next.js 16 Frontend Web Application
    ├── Dockerfile                      # Multi-stage production container build (Node 20 Alpine)
    ├── package.json                    # Next.js 16, React 19, Lucide, Framer Motion, Lenis
    ├── app/
    │   ├── layout.tsx                  # Root layout, DM Sans / Geist font setup, metadata
    │   ├── globals.css                 # Dark theme design tokens & animations
    │   ├── apple-nav.css               # CardNav & navigation styles
    │   └── [[...slug]]/
    │       └── page.tsx                # Dynamic slug router (/, /about, /components, /architecture)
    ├── components/
    │   └── features/
    │       ├── ManusOriginal.tsx       # Core interactive presentation & graph explorer shell
    │       ├── NavShell.tsx            # Desktop CardNav + Mobile StaggeredMenu controller
    │       ├── CardNav.tsx             # Interactive floating card navigation bar
    │       ├── StaggeredMenu.tsx       # Mobile slide-out navigation menu
    │       ├── GraphBoard.tsx          # Real-time node/edge graph canvas visualizer
    │       └── ClusterExplorer.tsx     # Louvain cluster inspector with risk tier badges
    └── lib/
        ├── api/
        │   ├── client.ts               # Frontend API client with fallback to mock data
        │   └── types.ts                # TypeScript interfaces and Zod schemas
        └── mock-data.ts                # In-memory graph nodes, edges, and insights
```

---

## 5. Quick Start & Execution Guide

### Option A: Using Docker Compose (Recommended)
Make sure Docker Desktop is running on your machine:
```bash
# 1. Start all 4 containers (MongoDB, Neo4j, Backend, Frontend)
docker compose up --build

# 2. Access services:
# • Frontend:       http://localhost:3000
# • FastAPI Docs:   http://localhost:8000/api/docs
# • Neo4j Browser:  http://localhost:7474 (user: neo4j, pass: collabguard_neo4j_password)
# • MongoDB:        localhost:27017
```

### Option B: Running Locally (Standalone)

#### 1. Backend (FastAPI + Python):
```bash
cd collabguard-backend

# Activate virtual environment
.\venv\Scripts\activate   # Windows
# source venv/bin/activate # Linux / macOS

# Install dependencies (already completed)
pip install -r requirements.txt

# Run test suite (9/9 tests pass)
pytest -v

# Start FastAPI dev server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
*Note: The backend has built-in in-memory fallback stores for both MongoDB and Neo4j, meaning you can develop and test even without running live database daemons!*

#### 2. Frontend (Next.js):
```bash
cd collabguard-frontend

# Install dependencies
npm install

# Run production build validation
npm run build

# Start Next.js development server
npm run dev
# Access at http://localhost:3000
```

---

## 6. Testing & Quality Assurance

The system includes a dedicated unit and integration test suite:

```bash
cd collabguard-backend
.\venv\Scripts\pytest.exe -v
```

### Test Coverage Results:
- `test_student_crud_lifecycle`: Verifies complete polyglot CRUD lifecycle (POST, GET, PUT, DELETE across MongoDB and Neo4j).
- `test_database_indexes_and_explain`: Verifies index catalog and MongoDB `explain('executionStats')` verifying `IXSCAN` stage without in-memory sort.
- `test_nosql_aggregations`: Validates both MongoDB multi-stage aggregation pipelines (`$group`, `$lookup`) and Neo4j multi-hop Cypher aggregations.
- `test_health_endpoint`: Verifies `/api/health` and database driver statuses.
- `test_demo_graph_and_reports`: Validates that Course BCSE406L Batch NS25 demo data populates nodes and Louvain clusters.
- `test_shortest_path_tracing`: Ensures multi-hop indirect collusion chains are correctly solved.
- `test_ast_normalizer_catches_variable_renaming`: Proves variable renaming across functions results in $\ge 90\%$ structural similarity.
- `test_dissimilar_code_yields_low_score`: Proves completely different algorithms score $< 35\%$.
- `test_boilerplate_detector_filters_common_hashes`: Tests frequency-based starter code elimination.
- `test_semantic_embedder_captures_logic_similarity`: Validates subword TF-IDF logic similarity.
- `test_classifier_predicts_risk_with_explanations`: Validates 7D feature extraction and Random Forest predictions.
- `test_ml_api_endpoints`: Tests `/api/ml/predict-pair`, `/feedback`, and the automated `/retrain` active learning loop.

**Result: 12 passed, 0 failures (100% passing across detection, ML, and NoSQL databases)**.

---

## 7. NoSQL Database Operations & Evaluation Deliverables

### 7.1 Database Schema & Collections Design

CollabGuard employs a **Polyglot Persistence Architecture** partitioning data across **MongoDB 7.0** (Document Store) and **Neo4j 5.18** (Labeled Property Graph).

#### A. MongoDB Document Collections

```json
// Collection: students
{
  "_id": ObjectId("67055a40b1297e2c90c74a01"),
  "student_id": "23BCE0131",
  "name": "Dipanjan Das",
  "reg_no": "23BCE0131",
  "batch": "NS25",
  "course_code": "BCSE406L",
  "created_at": "2026-10-08T05:00:00Z"
}

// Collection: submissions
{
  "_id": ObjectId("67055a40b1297e2c90c74a02"),
  "submission_id": "sub_ns25_042",
  "student_id": "23BCE0142",
  "batch_id": "batch_ns25_demo",
  "assignment_id": "ASSIGNMENT_04",
  "code_content": "def dijkstra(graph, start):\n    ...",
  "ast_tokens": ["FUNC_1", "PARAM_1", "PARAM_2", "CONST:int", "LOOP_1"],
  "fingerprints": [842109, 192834, 773194, 912834],
  "token_count": 944,
  "submitted_at": "2026-10-08T05:01:00Z"
}

// Collection: similarity_pairs
{
  "_id": ObjectId("67055a40b1297e2c90c74a03"),
  "batch_id": "batch_ns25_demo",
  "sub1_id": "sub_ns25_017",
  "sub2_id": "sub_ns25_042",
  "sub1_student_id": "23BCE0101",
  "sub2_student_id": "23BCE0142",
  "score": 0.812,
  "overlap_count": 38,
  "computed_at": "2026-10-08T05:02:00Z"
}
```

#### B. Neo4j Labeled Property Graph Schema

```cypher
// Node Labels and Constraints
CREATE CONSTRAINT student_id_unique FOR (s:Student) REQUIRE s.id IS UNIQUE;
CREATE CONSTRAINT submission_id_unique FOR (sub:Submission) REQUIRE sub.id IS UNIQUE;
CREATE INDEX similarity_score_idx FOR ()-[r:SIMILAR_TO]-() ON (r.score);

// Graph Relationship Pattern
(:Student {id: "23BCE0101", name: "Aarav Sharma", reg_no: "23BCE0101"})
   -[:SUBMITTED {timestamp: datetime("2026-10-08T05:00:00Z")}]->
(:Submission {id: "sub_ns25_017", batch_id: "batch_ns25_demo"})
   -[:SIMILAR_TO {score: 0.812, overlap_count: 38, algorithm: "winnowing_ast_v1"}]->
(:Submission {id: "sub_ns25_042", batch_id: "batch_ns25_demo"})
   <-[:SUBMITTED]-
(:Student {id: "23BCE0142", name: "Chirag Reddy", reg_no: "23BCE0142"})
```

---

### 7.2 Implemented Database Operations

#### A. CRUD Operations (REST Endpoints & Dual Persistence)
| Operation | Method & URI | Database Action |
| :--- | :--- | :--- |
| **Create (C)** | `POST /api/nosql/students` | Inserts BSON document into MongoDB `students` collection and creates `(:Student)` node in Neo4j. |
| **Read (R)** | `GET /api/nosql/students` | Queries MongoDB collection with pagination limits; `GET /api/nosql/students/{id}` reads single document by ID. |
| **Update (U)** | `PUT /api/nosql/students/{id}` | Updates document fields in MongoDB (`$set`) and synchronizes node properties in Neo4j. |
| **Delete (D)** | `DELETE /api/nosql/students/{id}` | Removes student document from MongoDB and executes Cypher `MATCH (s:Student {id: $id}) DETACH DELETE s` in Neo4j. |
| **Delete (D)** | `DELETE /api/nosql/submissions/{id}`| Removes submission document from MongoDB. |

#### B. Indexing & Query Execution Optimization
1. **Compound Index**: `idx_pairs_batch_score_compound` on `{"batch_id": 1, "score": -1}` in MongoDB `similarity_pairs`.
   - *Rationale*: Solves frequent query filtering by assignment batch and sorting by similarity score in descending order. Fulfills queries directly via B-Tree index traversal without memory sort buffering.
2. **Unique Index**: `idx_student_id_unique` on `{"student_id": 1}` preventing duplicate records.
3. **Text Search Index**: `idx_submissions_text_search` on `{"filename": "text", "student_name": "text"}` enabling fast full-text lookups.
4. **Neo4j Range Index**: `similarity_score_idx` on `[r:SIMILAR_TO].score` accelerating edge traversals during threshold filtering.

##### Query Execution Plan (`explain('executionStats')`):
- Endpoint: `GET /api/nosql/indexes/explain?batch_id=batch_ns25_demo&min_score=0.60`
- Query Stage: **`IXSCAN`** (Index Scan) $\to$ **`FETCH`** (Document Fetch).
- `totalKeysExamined` = `totalDocsExamined` (optimal 1:1 key-to-document examination ratio).
- **`inMemorySort: false`**: The compound index satisfies sort order directly, eliminating in-memory sorting overhead.
- Latency: $< 2 \text{ ms}$.

#### C. Aggregation Queries

##### 1. MongoDB Multi-Stage Pipeline: Risk Tier Distribution
- **Stages**: `$match` $\to$ `$project` (with `$switch`) $\to$ `$group` $\to$ `$sort`
- Categorizes student pairs into **CRITICAL** ($\ge 0.85$), **HIGH** ($0.75 - 0.85$), **MODERATE** ($0.60 - 0.75$), and **LOW** ($< 0.60$) integrity tiers, computing total counts and average similarity per bucket.

##### 2. MongoDB Multi-Stage Pipeline: Repeat Offender Relational Join
- **Stages**: `$group` $\to$ `$match` $\to$ `$lookup` $\to$ `$unwind` $\to$ `$project` $\to$ `$sort`
- Performs a relational-style join from `similarity_pairs` into `students` collection to uncover students flagged across multiple assignments.

##### 3. Neo4j Cypher Multi-Hop Graph Traversal Aggregation
- **Query**:
```cypher
MATCH (s:Student)-[:SUBMITTED]->(sub:Submission)-[r:SIMILAR_TO]-(otherSub:Submission)<-[:SUBMITTED]-(peer:Student)
WHERE sub.batch_id = $batch_id AND r.score >= 0.60
RETURN s.student_id AS student_id,
       s.name AS name,
       s.reg_no AS reg_no,
       count(DISTINCT peer) AS co_conspirators_count,
       avg(r.score) AS mean_shared_similarity,
       max(r.score) AS max_similarity
ORDER BY co_conspirators_count DESC, mean_shared_similarity DESC;
```
- Traverses indirect collusion routes and aggregates co-conspirators counts and mean similarity across arbitrary hop depths.

---

### 7.3 Working Prototype Demonstration

1. **Faculty Review Dashboard**: Navigate to `http://localhost:3000/components` for the interactive graph canvas, Louvain community explorer, and shortest-path playback.
2. **Interactive NoSQL Operations Visualizer**: Navigate to `http://localhost:3000/database` for live CRUD execution, interactive `explain()` execution plan analyzer, real-time aggregation pipeline inspection, and schema definitions.
3. **API & Database Swagger UI**: Access `http://localhost:8000/api/docs` to test all CRUD, indexing, and aggregation endpoints interactively via Swagger UI.

---

## 8. Faculty & Evaluation Summary
- **Course**: NoSQL Databases (BCSE406L)
- **Batch**: NS25
- **Guide**: Dr. D. Vivek
- **Author**: Dipanjan Das ([@felix16805](https://github.com/felix16805)) — Reg. No. `23BCE0131`
- **Key Takeaway**: Fulfills all BCSE406L requirements by combining **MongoDB's document schema flexibility** with **Neo4j's native graph traversal**, complete **CRUD lifecycles**, **compound indexing with explain plans**, and **multi-stage aggregation pipelines**.

