"""Neo4j graph database manager: CRUD operations, Cypher aggregations, and community clustering."""
import logging
from typing import Any, Dict, List, Optional
import networkx as nx
from neo4j import AsyncGraphDatabase, AsyncDriver
from app.core.config import settings

logger = logging.getLogger("collabguard.neo4j")


class Neo4jManager:
    driver: Optional[AsyncDriver] = None
    is_connected: bool = False
    _fallback_graph: nx.Graph = nx.Graph()

    async def connect(self):
        """Establish connection with Neo4j Bolt protocol."""
        try:
            logger.info(f"Connecting to Neo4j at {settings.NEO4J_URI}...")
            self.driver = AsyncGraphDatabase.driver(
                settings.NEO4J_URI,
                auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD),
                max_connection_lifetime=30 * 60,
            )
            async with self.driver.session() as session:
                result = await session.run("RETURN 1 AS connected")
                record = await result.single()
                if record and record["connected"] == 1:
                    self.is_connected = True
                    logger.info("Successfully connected to Neo4j AuraDB / Local Daemon.")
                    await self._init_schema()
        except Exception as e:
            self.is_connected = False
            logger.warning(
                f"Could not connect to Neo4j ({e}). Utilizing in-memory NetworkX graph fallback."
            )

    async def _init_schema(self):
        """Create uniqueness constraints and indexes in Neo4j."""
        if not self.is_connected or not self.driver:
            return
        statements = [
            # Uniqueness Constraints
            "CREATE CONSTRAINT student_id_unique IF NOT EXISTS FOR (s:Student) REQUIRE s.id IS UNIQUE",
            "CREATE CONSTRAINT submission_id_unique IF NOT EXISTS FOR (sub:Submission) REQUIRE sub.id IS UNIQUE",
            # Performance Indexes
            "CREATE INDEX student_reg_no_idx IF NOT EXISTS FOR (s:Student) ON (s.reg_no)",
            "CREATE INDEX similarity_score_idx IF NOT EXISTS FOR ()-[r:SIMILAR_TO]-() ON (r.score)",
        ]
        async with self.driver.session() as session:
            for stmt in statements:
                try:
                    await session.run(stmt)
                except Exception as ex:
                    logger.debug(f"Schema statement note: {ex}")

    async def close(self):
        """Close driver connection."""
        if self.driver:
            await self.driver.close()
            self.is_connected = False
            logger.info("Neo4j driver connection closed.")

    # ──────────────────────────────────────────────────────────────────────────
    # 1. Neo4j CRUD Operations (Cypher)
    # ──────────────────────────────────────────────────────────────────────────
    async def create_student(self, student_id: str, name: str, reg_no: str) -> Dict[str, Any]:
        """Cypher CREATE / MERGE student node."""
        node_key = f"student_{student_id}"
        self._fallback_graph.add_node(
            node_key, node_type="student", label=name, reg_no=reg_no, id=student_id
        )

        if self.is_connected and self.driver:
            cypher = """
            MERGE (s:Student {id: $student_id})
            ON CREATE SET s.name = $name, s.reg_no = $reg_no, s.created_at = datetime()
            RETURN s.id AS id, s.name AS name, s.reg_no AS reg_no
            """
            async with self.driver.session() as session:
                res = await session.run(cypher, student_id=student_id, name=name, reg_no=reg_no)
                rec = await res.single()
                if rec:
                    return dict(rec)

        return {"id": student_id, "name": name, "reg_no": reg_no}

    async def get_student(self, student_id: str) -> Optional[Dict[str, Any]]:
        """Cypher MATCH student node."""
        if self.is_connected and self.driver:
            cypher = "MATCH (s:Student {id: $student_id}) RETURN s.id AS id, s.name AS name, s.reg_no AS reg_no"
            async with self.driver.session() as session:
                res = await session.run(cypher, student_id=student_id)
                rec = await res.single()
                if rec:
                    return dict(rec)

        node_key = f"student_{student_id}"
        if self._fallback_graph.has_node(node_key):
            d = self._fallback_graph.nodes[node_key]
            return {"id": student_id, "name": d.get("label", ""), "reg_no": d.get("reg_no", "")}
        return None

    async def update_student(self, student_id: str, properties: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Cypher SET student node properties."""
        node_key = f"student_{student_id}"
        if self._fallback_graph.has_node(node_key):
            self._fallback_graph.nodes[node_key].update(properties)

        if self.is_connected and self.driver:
            cypher = """
            MATCH (s:Student {id: $student_id})
            SET s += $props
            RETURN s.id AS id, s.name AS name, s.reg_no AS reg_no
            """
            async with self.driver.session() as session:
                res = await session.run(cypher, student_id=student_id, props=properties)
                rec = await res.single()
                if rec:
                    return dict(rec)

        return await self.get_student(student_id)

    async def delete_student(self, student_id: str) -> bool:
        """Cypher DETACH DELETE student node and incident relationships."""
        node_key = f"student_{student_id}"
        if self._fallback_graph.has_node(node_key):
            self._fallback_graph.remove_node(node_key)

        if self.is_connected and self.driver:
            cypher = "MATCH (s:Student {id: $student_id}) DETACH DELETE s"
            async with self.driver.session() as session:
                await session.run(cypher, student_id=student_id)
                return True
        return True

    # ──────────────────────────────────────────────────────────────────────────
    # 2. Batch Sync & Graph Construction
    # ──────────────────────────────────────────────────────────────────────────
    async def sync_batch_graph(
        self,
        batch_id: str,
        students: List[Dict[str, Any]],
        submissions: List[Dict[str, Any]],
        similarity_edges: List[Dict[str, Any]],
    ):
        """Populates graph nodes and weighted edges."""
        for s in students:
            self._fallback_graph.add_node(
                f"student_{s['student_id']}",
                node_type="student",
                label=s["name"],
                reg_no=s["reg_no"],
                batch_id=batch_id,
            )
        for sub in submissions:
            sub_key = f"submission_{sub['id']}"
            self._fallback_graph.add_node(
                sub_key,
                node_type="submission",
                label=sub["filename"],
                student_id=sub["student_id"],
                batch_id=batch_id,
            )
            self._fallback_graph.add_edge(
                f"student_{sub['student_id']}",
                sub_key,
                rel_type="SUBMITTED",
                weight=1.0,
            )

        for edge in similarity_edges:
            sub1 = f"submission_{edge['sub1_id']}"
            sub2 = f"submission_{edge['sub2_id']}"
            self._fallback_graph.add_edge(
                sub1,
                sub2,
                rel_type="SIMILAR_TO",
                weight=edge["score"],
                shared_kgrams=edge.get("shared_kgrams", 0),
                batch_id=batch_id,
            )

        if self.is_connected and self.driver:
            try:
                async with self.driver.session() as session:
                    for sub in submissions:
                        query = """
                        MERGE (st:Student {id: $student_id})
                        ON CREATE SET st.name = $student_name, st.reg_no = $reg_no
                        MERGE (sub:Submission {id: $sub_id})
                        SET sub.filename = $filename, sub.batch_id = $batch_id
                        MERGE (st)-[:SUBMITTED]->(sub)
                        """
                        student_info = next(
                            (s for s in students if s["student_id"] == sub["student_id"]),
                            {"name": sub["student_id"], "reg_no": sub["student_id"]},
                        )
                        await session.run(
                            query,
                            student_id=sub["student_id"],
                            student_name=student_info["name"],
                            reg_no=student_info["reg_no"],
                            sub_id=sub["id"],
                            filename=sub["filename"],
                            batch_id=batch_id,
                        )

                    for edge in similarity_edges:
                        edge_query = """
                        MATCH (s1:Submission {id: $sub1_id})
                        MATCH (s2:Submission {id: $sub2_id})
                        MERGE (s1)-[r:SIMILAR_TO]->(s2)
                        SET r.score = $score,
                            r.shared_kgrams = $shared_kgrams,
                            r.batch_id = $batch_id
                        """
                        await session.run(
                            edge_query,
                            sub1_id=edge["sub1_id"],
                            sub2_id=edge["sub2_id"],
                            score=float(edge["score"]),
                            shared_kgrams=int(edge.get("shared_kgrams", 0)),
                            batch_id=batch_id,
                        )
            except Exception as e:
                logger.error(f"Error syncing batch to Neo4j: {e}")

    # ──────────────────────────────────────────────────────────────────────────
    # 3. Cypher Graph Aggregations & Analytics
    # ──────────────────────────────────────────────────────────────────────────
    async def aggregate_collusion_network(self, batch_id: str) -> List[Dict[str, Any]]:
        """
        Cypher Graph Aggregation:
        Surfaces multi-hop student co-conspirators, degree distribution,
        and average collusion strength via relationship traversals.
        """
        if self.is_connected and self.driver:
            cypher = """
            MATCH (s:Student)-[:SUBMITTED]->(sub:Submission)-[r:SIMILAR_TO]-(otherSub:Submission)<-[:SUBMITTED]-(peer:Student)
            WHERE r.batch_id = $batch_id
            RETURN s.id AS student_id,
                   s.name AS student_name,
                   count(DISTINCT peer) AS co_conspirators_count,
                   round(avg(r.score), 4) AS avg_collusion_score,
                   collect(DISTINCT peer.name) AS peer_names
            ORDER BY co_conspirators_count DESC, avg_collusion_score DESC
            """
            async with self.driver.session() as session:
                res = await session.run(cypher, batch_id=batch_id)
                records = [dict(record) async for record in res]
                return records

        # In-memory graph aggregation fallback
        student_peers: Dict[str, Dict[str, Any]] = {}
        for u, v, d in self._fallback_graph.edges(data=True):
            if d.get("rel_type") == "SIMILAR_TO" and d.get("batch_id") == batch_id:
                s1_id = self._fallback_graph.nodes[u].get("student_id")
                s2_id = self._fallback_graph.nodes[v].get("student_id")
                if s1_id and s2_id and s1_id != s2_id:
                    for a, b in [(s1_id, s2_id), (s2_id, s1_id)]:
                        rec = student_peers.setdefault(
                            a,
                            {
                                "student_id": a,
                                "student_name": self._fallback_graph.nodes.get(f"student_{a}", {}).get("label", a),
                                "peers": set(),
                                "scores": [],
                            },
                        )
                        rec["peers"].add(self._fallback_graph.nodes.get(f"student_{b}", {}).get("label", b))
                        rec["scores"].append(d.get("weight", 0.0))

        results = []
        for s_id, data in student_peers.items():
            results.append({
                "student_id": s_id,
                "student_name": data["student_name"],
                "co_conspirators_count": len(data["peers"]),
                "avg_collusion_score": round(sum(data["scores"]) / len(data["scores"]), 4),
                "peer_names": list(data["peers"]),
            })
        results.sort(key=lambda x: (x["co_conspirators_count"], x["avg_collusion_score"]), reverse=True)
        return results

    async def detect_louvain_communities(self, batch_id: str) -> Dict[str, int]:
        """Runs Louvain community detection to group collusion rings."""
        subgraph = nx.Graph()
        for u, v, data in self._fallback_graph.edges(data=True):
            if data.get("rel_type") == "SIMILAR_TO":
                s1 = self._fallback_graph.nodes[u].get("student_id")
                s2 = self._fallback_graph.nodes[v].get("student_id")
                if s1 and s2 and s1 != s2:
                    w = data.get("weight", 0.5)
                    subgraph.add_edge(s1, s2, weight=w)

        if len(subgraph.nodes) == 0:
            return {}

        try:
            communities = nx.community.louvain_communities(
                subgraph, weight="weight", resolution=settings.LOUVAIN_RESOLUTION, seed=42
            )
            node_cluster_map = {}
            for cluster_idx, comm in enumerate(communities):
                for student_id in comm:
                    node_cluster_map[student_id] = cluster_idx
            return node_cluster_map
        except Exception:
            node_cluster_map = {}
            for cluster_idx, comp in enumerate(nx.connected_components(subgraph)):
                for student_id in comp:
                    node_cluster_map[student_id] = cluster_idx
            return node_cluster_map

    async def get_graph_data(self, batch_id: str) -> Dict[str, Any]:
        """Extract node and link data formatted for frontend D3 / ForceGraph."""
        cluster_map = await self.detect_louvain_communities(batch_id)
        nodes = []
        node_seen = set()

        for n, d in self._fallback_graph.nodes(data=True):
            if d.get("batch_id") == batch_id:
                node_seen.add(n)
                cluster_id = None
                if d.get("node_type") == "student":
                    st_id = n.replace("student_", "")
                    cluster_id = cluster_map.get(st_id)
                elif d.get("node_type") == "submission":
                    st_id = d.get("student_id")
                    cluster_id = cluster_map.get(st_id)

                nodes.append({
                    "id": n,
                    "label": d.get("label", n),
                    "type": d.get("node_type", "unknown"),
                    "reg_no": d.get("reg_no", ""),
                    "cluster": cluster_id,
                    "degree": self._fallback_graph.degree(n),
                })

        links = []
        for u, v, d in self._fallback_graph.edges(data=True):
            if u in node_seen and v in node_seen:
                links.append({
                    "source": u,
                    "target": v,
                    "rel_type": d.get("rel_type", "RELATED"),
                    "weight": d.get("weight", 1.0),
                    "score": d.get("weight", 1.0) if d.get("rel_type") == "SIMILAR_TO" else None,
                    "shared_kgrams": d.get("shared_kgrams", 0),
                })

        return {
            "batch_id": batch_id,
            "nodes": nodes,
            "links": links,
            "total_nodes": len(nodes),
            "total_edges": len(links),
        }

    async def find_shortest_path(self, student_a_id: str, student_b_id: str) -> Optional[List[str]]:
        """Find the shortest collusion transmission path between two students."""
        node_a = f"student_{student_a_id}"
        node_b = f"student_{student_b_id}"
        if self._fallback_graph.has_node(node_a) and self._fallback_graph.has_node(node_b):
            try:
                return nx.shortest_path(self._fallback_graph, source=node_a, target=node_b)
            except nx.NetworkXNoPath:
                return None
        return None


neo4j_manager = Neo4jManager()
