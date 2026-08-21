from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional, Tuple

app = FastAPI(
    title="Visflow Pipeline Engine",
    description="High-performance pipeline parsing and DAG cycle detection engine",
    version="1.1.0"
)

# Wide-open CORS is fine for local dev; a real deployment would restrict this.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Pipeline(BaseModel):
    """Raw ReactFlow state. We accept nodes/edges as loosely typed dicts."""
    nodes: List[Dict[str, Any]] = Field(default_factory=list)
    edges: List[Dict[str, Any]] = Field(default_factory=list)


class ParseResponse(BaseModel):
    """Pipeline analysis response schema.
    Backward-compatible with original assessment contract:
    {num_nodes, num_edges, is_dag}, with additive cycle_nodes and topological_order.
    """
    num_nodes: int
    num_edges: int
    is_dag: bool
    cycle_nodes: Optional[List[str]] = None
    topological_order: Optional[List[str]] = None
    num_components: Optional[int] = None


@app.get('/')
def read_root():
    return {
        'name': 'Visflow Pipeline API',
        'status': 'online',
        'version': '1.1.0',
        'Ping': 'Pong'
    }


@app.get('/health')
def health_check():
    return {
        'status': 'healthy',
        'service': 'visflow-backend',
        'version': '1.1.0',
        'endpoints': ['/pipelines/parse', '/health', '/']
    }


def find_cycle_nodes_and_order(
    node_ids: List[str], edges: List[Dict[str, Any]]
) -> Tuple[List[str], List[str]]:
    """Kahn's algorithm (topological sort by repeated removal of in-degree-0 nodes).
    Time Complexity: O(V + E)
    Returns:
        (cycle_nodes, topological_order)
        - cycle_nodes: list of node IDs that could not be resolved (empty if DAG)
        - topological_order: computed execution sequence if DAG, else empty list
    """
    if not node_ids:
        return [], []

    adjacency: Dict[str, List[str]] = {nid: [] for nid in node_ids}
    in_degree: Dict[str, int] = {nid: 0 for nid in node_ids}

    for edge in edges:
        source, target = edge.get('source'), edge.get('target')
        if source not in adjacency or target not in adjacency:
            continue
        adjacency[source].append(target)
        in_degree[target] += 1

    # Queue of nodes with 0 in-degree
    queue = [nid for nid in node_ids if in_degree[nid] == 0]
    removed_order: List[str] = []
    removed_set = set()

    while queue:
        current = queue.pop(0)  # FIFO for natural order
        removed_order.append(current)
        removed_set.add(current)
        for neighbor in adjacency[current]:
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)

    stuck_nodes = [nid for nid in node_ids if nid not in removed_set]
    topological_order = removed_order if len(stuck_nodes) == 0 else []

    return stuck_nodes, topological_order


def find_cycle_nodes(node_ids: List[str], edges: List[Dict[str, Any]]) -> List[str]:
    """Backward-compatible helper function."""
    stuck_nodes, _ = find_cycle_nodes_and_order(node_ids, edges)
    return stuck_nodes


def count_connected_components(node_ids: List[str], edges: List[Dict[str, Any]]) -> int:
    """Computes number of weakly connected components in the pipeline graph."""
    if not node_ids:
        return 0
    adj: Dict[str, List[str]] = {nid: [] for nid in node_ids}
    for edge in edges:
        s, t = edge.get('source'), edge.get('target')
        if s in adj and t in adj:
            adj[s].append(t)
            adj[t].append(s)

    visited = set()
    components = 0
    for nid in node_ids:
        if nid not in visited:
            components += 1
            stack = [nid]
            visited.add(nid)
            while stack:
                curr = stack.pop()
                for neighbor in adj[curr]:
                    if neighbor not in visited:
                        visited.add(neighbor)
                        stack.append(neighbor)
    return components


@app.post('/pipelines/parse', response_model=ParseResponse)
def parse_pipeline(pipeline: Pipeline) -> ParseResponse:
    node_ids = [node.get('id') for node in pipeline.nodes if node.get('id') is not None]
    stuck_nodes, topo_order = find_cycle_nodes_and_order(node_ids, pipeline.edges)
    num_components = count_connected_components(node_ids, pipeline.edges)
    is_dag = len(stuck_nodes) == 0

    return ParseResponse(
        num_nodes=len(pipeline.nodes),
        num_edges=len(pipeline.edges),
        is_dag=is_dag,
        cycle_nodes=stuck_nodes or None,
        topological_order=topo_order if is_dag and topo_order else None,
        num_components=num_components if pipeline.nodes else 0,
    )

