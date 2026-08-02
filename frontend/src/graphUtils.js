// graphUtils.js
// Pulled out of store.js so the cycle-prevention check that runs on every
// onConnect can be unit tested without touching Zustand or ReactFlow.

// Returns true if adding an edge source -> target would create a cycle,
// given the edges that already exist in the graph.
export const wouldCreateCycle = (source, target, edges) => {
  if (source === target) return true; // self-loop counts as a cycle

  // adjacency list from the CURRENT graph (before this new edge is added)
  const adjacency = {};
  edges.forEach((edge) => {
    if (!adjacency[edge.source]) adjacency[edge.source] = [];
    adjacency[edge.source].push(edge.target);
  });

  // DFS starting from `target`: if we can reach `source`, the new edge
  // would close a loop back to where it started.
  const visited = new Set();
  const stack = [target];
  while (stack.length > 0) {
    const current = stack.pop();
    if (current === source) return true;
    if (visited.has(current)) continue;
    visited.add(current);
    (adjacency[current] || []).forEach((next) => stack.push(next));
  }
  return false;
};
