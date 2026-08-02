"""
VectorShift Pipeline Builder — backend
---------------------------------------
Single responsibility: given a pipeline's nodes/edges, report how big it is
and whether it's a valid DAG. Kept intentionally small — this is the
"simple backend" the assessment describes, not a pipeline execution engine.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

app = FastAPI(title="VectorShift Pipeline Parser")

# Wide-open CORS is fine for a take-home / local dev; a real deployment
# would restrict this to the actual frontend origin(s).
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Pipeline(BaseModel):
    """Raw ReactFlow state. We deliberately accept nodes/edges as loosely
    typed dicts (Dict[str, Any]) rather than a strict schema — the frontend
    node shape evolves independently of this endpoint, and all we actually
    need from each object is its id / source / target."""

    nodes: List[Dict[str, Any]] = Field(default_factory=list)
    edges: List[Dict[str, Any]] = Field(default_factory=list)


class ParseResponse(BaseModel):
    """Matches the schema the assessment specifies exactly
    ({num_nodes, num_edges, is_dag}); cycle_nodes is additive and safe to
    ignore for any consumer that only reads the three required fields."""

    num_nodes: int
    num_edges: int
    is_dag: bool
    cycle_nodes: Optional[List[str]] = None


@app.get('/')
def read_root():
    return {'Ping': 'Pong'}


def find_cycle_nodes(node_ids: List[str], edges: List[Dict[str, Any]]) -> List[str]:
    """Kahn's algorithm (topological sort by repeated removal of in-degree-0
    nodes), O(V + E). Rather than a boolean, this returns the list of nodes
    that could *not* be removed — i.e. the nodes involved in (or downstream
    of) a cycle. An empty list means the graph is a DAG.

    Handles, without special-casing:
      - disconnected subgraphs   (each component's roots just enter the
                                   queue independently; no cross-component
                                   dependency assumed)
      - self-referencing nodes    (a self-loop gives a node in-degree >= 1
                                   from itself, so it can never reach 0)
      - empty pipelines           (node_ids == [] -> nothing to remove ->
                                   trivially a DAG)
      - edges to/from unknown ids (silently ignored — malformed edge data
                                   shouldn't crash graph validation)
    """
    adjacency: Dict[str, List[str]] = {nid: [] for nid in node_ids}
    in_degree: Dict[str, int] = {nid: 0 for nid in node_ids}

    for edge in edges:
        source, target = edge.get('source'), edge.get('target')
        if source not in adjacency or target not in adjacency:
            continue
        adjacency[source].append(target)
        in_degree[target] += 1

    queue = [nid for nid in node_ids if in_degree[nid] == 0]
    removed = set()

    while queue:
        current = queue.pop()
        removed.add(current)
        for neighbor in adjacency[current]:
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)

    # Anything never removed is part of (or downstream of) a cycle.
    # Preserve original node order for a stable, readable response.
    return [nid for nid in node_ids if nid not in removed]


@app.post('/pipelines/parse', response_model=ParseResponse)
def parse_pipeline(pipeline: Pipeline) -> ParseResponse:
    node_ids = [node.get('id') for node in pipeline.nodes]
    stuck_nodes = find_cycle_nodes(node_ids, pipeline.edges)

    return ParseResponse(
        num_nodes=len(pipeline.nodes),
        num_edges=len(pipeline.edges),
        is_dag=len(stuck_nodes) == 0,
        cycle_nodes=stuck_nodes or None,
    )
