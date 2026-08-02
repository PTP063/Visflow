// toolbar.js

import { useMemo, useState } from 'react';
import { DraggableNode } from './draggableNode';

// Single source of truth for what's in the toolbar. Same philosophy as the
// node abstraction itself: adding a node to the palette is a data entry
// (one line here), not a markup change — this is what keeps the toolbar
// from becoming its own maintenance burden as node types grow past a
// handful.
const NODE_CATALOG = [
  { type: 'customInput', label: 'Input', icon: '📥' },
  { type: 'llm', label: 'LLM', icon: '🤖' },
  { type: 'customOutput', label: 'Output', icon: '📤' },
  { type: 'text', label: 'Text', icon: '📝' },
  { type: 'filter', label: 'Filter', icon: '🔍' },
  { type: 'math', label: 'Math', icon: '➗' },
  { type: 'api', label: 'API Request', icon: '🌐' },
  { type: 'timer', label: 'Delay', icon: '⏱️' },
  { type: 'note', label: 'Note', icon: '🗒️' },
];

export const PipelineToolbar = () => {
  const [query, setQuery] = useState('');

  // Filtering client-side over a static catalog is fine at this scale;
  // once the catalog is fetched/dynamic (e.g. custom org-defined nodes),
  // this is the seam where that would move to a backend search instead.
  const visibleNodes = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return NODE_CATALOG;
    return NODE_CATALOG.filter((n) => n.label.toLowerCase().includes(q));
  }, [query]);

  return (
    <div className="toolbar">
      <div className="toolbar-brand">
        <span className="toolbar-logo">⚡</span>
        <span className="toolbar-title">Pipeline Builder</span>
      </div>

      <input
        className="toolbar-search"
        type="text"
        placeholder="Search nodes..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search node types"
      />

      <div className="toolbar-nodes">
        {visibleNodes.length > 0 ? (
          visibleNodes.map((n) => (
            <DraggableNode key={n.type} type={n.type} label={n.label} icon={n.icon} />
          ))
        ) : (
          <span className="toolbar-empty">No nodes match "{query}"</span>
        )}
      </div>
    </div>
  );
};
