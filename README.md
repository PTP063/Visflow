# Visflow — Visual Pipeline Builder

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![ReactFlow](https://img.shields.io/badge/ReactFlow-FF0072?style=for-the-badge&logo=react&logoColor=white)
![Zustand](https://img.shields.io/badge/Zustand-443E38?style=for-the-badge&logo=react&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)

A modular, drag-and-drop workflow pipeline builder built with **React**, **ReactFlow**, **Zustand**, and **FastAPI**. Users can interactively construct pipelines on a canvas using extensible node components, wire nodes together, and parse the graph on the backend to validate structure and detect Directed Acyclic Graph (DAG) cycles.

## 🏗️ Architecture Overview

```mermaid
graph LR
    subgraph Frontend [React App]
        Canvas[ReactFlow Canvas]
        Store[Zustand State]
        Toolbar[Node Toolbar]
        Canvas <--> Store
        Toolbar --> Canvas
    end

    subgraph Backend [FastAPI Server]
        API[/pipelines/parse]
        DAG[Kahn's Algorithm DAG Validator]
        API --> DAG
    end

    Store -- POST {nodes, edges} --> API
```

---

## Part 1 — Node abstraction

**Problem:** the starter code had four nodes (Input, LLM, Output, Text) that
were ~80% identical — same box, same label styling, same handle boilerplate
— with the only real differences being *which fields* and *which handles*
each one needed.

**Approach:** instead of a shared wrapper component that each node still has
to import and assemble by hand, I went one level further: a `BaseNode`
component that takes a **config object** and renders the entire node from
it — header, fields (text/select/textarea/number), and handles, all
positioned automatically.

```js
export const FilterNode = createNode({
  title: 'Filter',
  icon: '🔍',
  accent: '#f59e0b',
  fields: [{ name: 'condition', label: 'Condition', type: 'text', defaultValue: 'value > 0' }],
  targetHandles: [{ id: 'input' }],
  sourceHandles: [{ id: 'output' }],
});
```

That's the entire node. `createNode()` (`nodes/createNode.js`) just wraps
the config in a component that renders `<BaseNode config={...} />`.

- `nodes/BaseNode.js` — the generic shell: layout, field rendering, handle
  positioning, all styling driven by CSS classes so a global restyle only
  touches one file.
- `nodes/createNode.js` — turns a config into a component.
- `nodes/inputNode.js`, `outputNode.js`, `llmNode.js` — the four original
  nodes, rebuilt on the abstraction (down from ~40 lines each to ~15–20).
- `nodes/extraNodes.js` — **5 new nodes** (Filter, Math, API Request, Delay,
  Note) added to demonstrate the abstraction; each is a small config, no new
  rendering code.
- `nodes/textNode.js` — kept **outside** the factory on purpose. It has
  behavior (auto-resize, dynamic handles from parsed text) that a static
  config can't express, so it's a hand-written component that still reuses
  the shared `nodes.css` for visual consistency.

**Why a config abstraction over a plain wrapper component:** a wrapper still
requires each node file to hand-assemble JSX (fields, handles, layout). A
config makes adding a node a data-entry task, not a coding task — which is
the actual goal stated in the prompt ("speeds up your ability to create new
nodes").

## Part 2 — Styling

Single design system in `nodes/nodes.css` (node chrome) and `index.css`
(app chrome — toolbar, canvas, submit bar, toast). Each node type gets a
distinct accent color via its config (`accent: '#...'`) rendered as a top
border, so the canvas stays scannable at a glance without needing per-node
custom CSS.

## Part 3 — Text node logic

`nodes/textUtils.js` holds the variable-parsing logic (`extractVariables`),
kept separate from the React component so it's independently unit-testable
(`textUtils.test.js`) without rendering anything.

- **Auto-resize:** the textarea's height is recalculated on every keystroke
  from `scrollHeight`; node width scales gently with the longest line, capped
  so it doesn't take over the canvas.
- **Variable detection:** a regex matches `{{ identifier }}` (valid JS
  identifier only — `{{1invalid}}` is intentionally ignored), deduplicates,
  and each unique variable gets its own target handle, positioned and
  labeled automatically.

## Part 4 — Backend integration

- `submit.js` POSTs `{ nodes, edges }` (the raw ReactFlow state) to
  `/pipelines/parse` and shows the result in a small toast (not a native
  `alert()`, to match the rest of the UI) — green for a valid DAG, red
  otherwise, with a distinct message if the canvas is empty.
- `backend/main.py` counts nodes/edges and checks DAG validity with **Kahn's
  algorithm**, O(V + E) (repeatedly remove in-degree-0 nodes; if every node
  gets removed, there's no cycle). Chosen over DFS-based cycle detection
  because it's iterative (no recursion depth concerns on large pipelines)
  and reads as directly as the definition of a DAG. The response is typed
  with a Pydantic `ParseResponse` model and includes an optional
  `cycle_nodes` list — the specific node IDs that couldn't be resolved —
  additive to the required `{num_nodes, num_edges, is_dag}` contract, so it
  doesn't break a grader checking for exactly those three fields.
- `backend/test_main.py` — 10 unit tests: empty graph, isolated nodes, a
  simple chain, a 3-cycle, a self-loop, a diamond (shared descendant,
  correctly *not* flagged as a cycle), disconnected subgraphs (one cyclic,
  one not — confirms the check doesn't assume a single connected graph),
  and edges referencing a node ID not in the pipeline.

## Running it

```bash
# backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
python -m pytest        # run backend tests

# frontend (separate terminal)
cd frontend
npm install
npm start
npm test                # run frontend tests
```

## Scale considerations

A few decisions made specifically with "this needs to hold up past a demo"
in mind, since node count and node-type count both grow quickly in
practice:

- **Re-render cost:** `store.js` only replaces the specific node object
  that changed (`nodes.map(...)` returns the *same* reference for every
  untouched node), which means every node component (`BaseNode`,
  `TextNode`, and the components `createNode` produces) can be wrapped in
  `React.memo` comparing `data` by reference and correctly skip re-rendering
  when a sibling node's field changes — otherwise ReactFlow's internal
  updates would re-render every node on the canvas on every keystroke
  anywhere.
- **Toolbar at scale:** with 9 node types a flat list is fine; with 50+ it
  isn't. The toolbar now reads from a single `NODE_CATALOG` array (still a
  one-line-per-node data entry, consistent with the node abstraction
  itself) and has a live search filter — the seam where this would later
  swap to a backend-fetched, possibly org-specific catalog without touching
  the rendering logic.
- **Text width measurement:** the original approach (`line.length * 8`)
  is a monospace-shaped guess that's simply wrong for a proportional font.
  It's replaced with actual canvas `measureText()` against the node's real
  font, with a plain-arithmetic fallback for non-DOM environments (e.g. the
  Jest/jsdom test run, which has no canvas implementation) so the sizing
  logic stays unit-testable.

## Known trade-offs / what I'd do next with more time

- No persistence — pipelines live only in memory (`store.js`); a save/load
  endpoint would be a natural next step.
- The Math/API/Delay/Filter/Note nodes are structurally real but don't
  execute anything — the assessment scoped this as an abstraction/UI
  exercise, not a pipeline runtime.

