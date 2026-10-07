"""Demo dataset seeder for Course BCSE406L NoSQL Database Project."""
from fastapi import APIRouter
from app.engine.pipeline import run_analysis_pipeline

router = APIRouter(prefix="/demo", tags=["Demo & Seeding"])

SAMPLE_SUBMISSIONS = [
    {
        "id": "sub_dijkstra_01",
        "student_id": "21BCE1001",
        "student_name": "Aarav Sharma",
        "reg_no": "21BCE1001",
        "filename": "dijkstra_aarav.py",
        "code": '''import heapq

def dijkstra(graph, start):
    distances = {node: float('infinity') for node in graph}
    distances[start] = 0
    priority_queue = [(0, start)]
    visited = set()

    while priority_queue:
        current_distance, current_node = heapq.heappop(priority_queue)

        if current_node in visited:
            continue
        visited.add(current_node)

        for neighbor, weight in graph[current_node].items():
            distance = current_distance + weight
            if distance < distances[neighbor]:
                distances[neighbor] = distance
                heapq.heappush(priority_queue, (distance, neighbor))

    return distances
'''
    },
    {
        "id": "sub_dijkstra_02",
        "student_id": "21BCE1042",
        "student_name": "Rohan Verma",
        "reg_no": "21BCE1042",
        "filename": "shortest_path_rohan.py",
        "code": '''import heapq

def compute_shortest_paths(network_map, source_vertex):
    # Variable renaming and modified comments
    min_dist = {vertex: float('infinity') for vertex in network_map}
    min_dist[source_vertex] = 0
    pq = [(0, source_vertex)]
    seen_nodes = set()

    while pq:
        curr_dist, curr_vertex = heapq.heappop(pq)

        if curr_vertex in seen_nodes:
            continue
        seen_nodes.add(curr_vertex)

        for adj_node, edge_cost in network_map[curr_vertex].items():
            new_path_len = curr_dist + edge_cost
            if new_path_len < min_dist[adj_node]:
                min_dist[adj_node] = new_path_len
                heapq.heappush(pq, (new_path_len, adj_node))

    return min_dist
'''
    },
    {
        "id": "sub_dijkstra_03",
        "student_id": "21BCE1098",
        "student_name": "Ananya Iyer",
        "reg_no": "21BCE1098",
        "filename": "dijkstra_ananya.py",
        "code": '''import heapq

def run_dijkstra(g, root):
    costs = {n: float('inf') for n in g}
    costs[root] = 0
    h = [(0, root)]
    closed = set()

    while len(h) > 0:
        c, u = heapq.heappop(h)
        if u in closed:
            continue
        closed.add(u)
        for v, w in g[u].items():
            alt = c + w
            if alt < costs[v]:
                costs[v] = alt
                heapq.heappush(h, (alt, v))
    return costs
'''
    },
    {
        "id": "sub_dijkstra_04",
        "student_id": "21BCE1155",
        "student_name": "Karthik Raja",
        "reg_no": "21BCE1155",
        "filename": "graph_traversal.py",
        "code": '''import heapq

def dijkstra(graph, start_vertex):
    shortest_paths = {vertex: float('inf') for vertex in graph}
    shortest_paths[start_vertex] = 0
    pqueue = [(0, start_vertex)]
    
    while pqueue:
        dist, node = heapq.heappop(pqueue)
        if dist > shortest_paths[node]:
            continue
        for neighbor, weight in graph[node].items():
            tentative = dist + weight
            if tentative < shortest_paths[neighbor]:
                shortest_paths[neighbor] = tentative
                heapq.heappush(pqueue, (tentative, neighbor))
    return shortest_paths
'''
    },
    {
        "id": "sub_dijkstra_05",
        "student_id": "21BCE1204",
        "student_name": "Pooja Hegde",
        "reg_no": "21BCE1204",
        "filename": "path_finder.py",
        "code": '''import heapq

def find_shortest_distance(graph, origin):
    shortest_paths = {vertex: float('inf') for vertex in graph}
    shortest_paths[origin] = 0
    pqueue = [(0, origin)]
    
    while pqueue:
        dist, node = heapq.heappop(pqueue)
        if dist > shortest_paths[node]:
            continue
        for neighbor, weight in graph[node].items():
            tentative = dist + weight
            if tentative < shortest_paths[neighbor]:
                shortest_paths[neighbor] = tentative
                heapq.heappush(pqueue, (tentative, neighbor))
    return shortest_paths
'''
    },
    {
        "id": "sub_bfs_06",
        "student_id": "21BCE1340",
        "student_name": "Siddharth Nair",
        "reg_no": "21BCE1340",
        "filename": "bfs_unweighted.py",
        "code": '''from collections import deque

def breadth_first_search(adj_list, start_node):
    visited = {start_node}
    queue = deque([start_node])
    order = []
    
    while queue:
        current = queue.popleft()
        order.append(current)
        for neighbor in sorted(adj_list.get(current, [])):
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append(neighbor)
    return order
'''
    },
    {
        "id": "sub_dfs_07",
        "student_id": "21BCE1412",
        "student_name": "Neha Patel",
        "reg_no": "21BCE1412",
        "filename": "dfs_paths.py",
        "code": '''def depth_first_paths(graph, start, goal, path=None):
    if path is None:
        path = [start]
    if start == goal:
        yield path
    for next_node in set(graph.get(start, [])) - set(path):
        yield from depth_first_paths(graph, next_node, goal, path + [next_node])
'''
    },
]


@router.post("/seed", response_model=dict)
async def seed_demo_data():
    """Seed the database with sample academic dataset (Batch NS25)."""
    batch_id = "batch_ns25_demo"
    assignment_id = "BCSE406L_DA1_GRAPH"

    result = await run_analysis_pipeline(
        batch_id=batch_id,
        assignment_id=assignment_id,
        submissions_raw=SAMPLE_SUBMISSIONS,
        similarity_threshold=0.55,
    )

    return {
        "message": "Demo batch NS25 seeded successfully",
        "batch_id": batch_id,
        "summary": result["batch"],
        "flagged_pairs": result["flagged_pairs"],
        "clusters": result["clusters"],
    }
