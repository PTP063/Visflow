// toolbar.js

import { useMemo, useState } from 'react';
import { DraggableNode } from './draggableNode';
import { useStore } from './store';
import { shallow } from 'zustand/shallow';
import { PIPELINE_TEMPLATES } from './templates';

const NODE_CATALOG = [
  { type: 'customInput', label: 'Input', icon: '📥', category: 'io', accent: '#3b82f6' },
  { type: 'customOutput', label: 'Output', icon: '📤', category: 'io', accent: '#10b981' },
  { type: 'llm', label: 'LLM', icon: '🤖', category: 'ai', accent: '#8b5cf6' },
  { type: 'text', label: 'Text / Prompt', icon: '📝', category: 'ai', accent: '#ec4899' },
  { type: 'filter', label: 'Filter', icon: '🔍', category: 'logic', accent: '#f59e0b' },
  { type: 'math', label: 'Math', icon: '➗', category: 'logic', accent: '#ef4444' },
  { type: 'api', label: 'API Request', icon: '🌐', category: 'integration', accent: '#06b6d4' },
  { type: 'timer', label: 'Delay', icon: '⏱️', category: 'integration', accent: '#a855f7' },
  { type: 'note', label: 'Note', icon: '🗒️', category: 'util', accent: '#64748b' },
];

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'ai', label: 'AI & Models' },
  { id: 'io', label: 'Data I/O' },
  { id: 'logic', label: 'Logic & Math' },
  { id: 'integration', label: 'Services' },
  { id: 'util', label: 'Notes' },
];

const selector = (state) => ({
  nodes: state.nodes,
  edges: state.edges,
  clearCanvas: state.clearCanvas,
  loadTemplate: state.loadTemplate,
  setToast: state.setToast,
});

export const PipelineToolbar = () => {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [showTemplates, setShowTemplates] = useState(false);
  const { nodes, edges, clearCanvas, loadTemplate, setToast } = useStore(selector, shallow);

  const visibleNodes = useMemo(() => {
    let list = NODE_CATALOG;
    if (activeCategory !== 'all') {
      list = list.filter((n) => n.category === activeCategory);
    }
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (n) => n.label.toLowerCase().includes(q) || n.type.toLowerCase().includes(q)
      );
    }
    return list;
  }, [query, activeCategory]);

  const handleSelectTemplate = (template) => {
    loadTemplate(template);
    setShowTemplates(false);
    setToast({
      variant: 'success',
      title: 'Template Loaded',
      message: `Loaded template: ${template.name}`,
    });
  };

  const handleClear = () => {
    if (nodes.length === 0) return;
    if (window.confirm('Are you sure you want to clear the entire canvas?')) {
      clearCanvas();
      setToast({
        variant: 'info',
        title: 'Canvas Cleared',
        message: 'All nodes and connections have been removed.',
      });
    }
  };

  return (
    <header className="toolbar">
      {/* Top Brand Bar */}
      <div className="toolbar-top">
        <div className="toolbar-brand">
          <div className="brand-badge">
            <span className="toolbar-logo">⚡</span>
          </div>
          <div className="brand-text">
            <div className="brand-title-wrap">
              <span className="toolbar-title">Visflow</span>
              <span className="brand-version">v1.1</span>
            </div>
            <span className="brand-tagline">Visual Workflow & AI Pipeline Builder</span>
          </div>
        </div>

        {/* Live Canvas Stats Pill */}
        <div className="toolbar-stats">
          <div className="stat-pill" title="Current Node Count">
            <span className="stat-icon">🧩</span>
            <span className="stat-label">Nodes:</span>
            <span className="stat-count">{nodes.length}</span>
          </div>
          <div className="stat-pill" title="Current Edge Connections">
            <span className="stat-icon">🔗</span>
            <span className="stat-label">Edges:</span>
            <span className="stat-count">{edges.length}</span>
          </div>
        </div>

        {/* Action Center */}
        <div className="toolbar-actions">
          <div className="template-dropdown-wrap">
            <button
              className="btn-action btn-template"
              onClick={() => setShowTemplates(!showTemplates)}
              type="button"
            >
              <span>✨ Templates</span>
              <span className="dropdown-arrow">{showTemplates ? '▲' : '▼'}</span>
            </button>

            {showTemplates && (
              <div className="template-menu">
                <div className="template-menu-header">Pre-built Workflows</div>
                {PIPELINE_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    className="template-item"
                    onClick={() => handleSelectTemplate(tmpl)}
                    type="button"
                  >
                    <div className="template-item-name">{tmpl.name}</div>
                    <div className="template-item-desc">{tmpl.description}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            className="btn-action btn-clear"
            onClick={handleClear}
            disabled={nodes.length === 0}
            title="Clear canvas"
            type="button"
          >
            🗑️ Clear
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="toolbar-controls">
        <div className="category-tabs">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              className={`category-tab ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.id)}
              type="button"
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="search-wrap">
          <span className="search-icon">🔍</span>
          <input
            className="toolbar-search"
            type="text"
            placeholder="Search nodes..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search node types"
          />
          {query && (
            <button className="search-clear" onClick={() => setQuery('')} aria-label="Clear search">
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Draggable Node Palette */}
      <div className="toolbar-palette">
        {visibleNodes.length > 0 ? (
          visibleNodes.map((n) => (
            <DraggableNode
              key={n.type}
              type={n.type}
              label={n.label}
              icon={n.icon}
              category={n.category}
              accent={n.accent}
            />
          ))
        ) : (
          <div className="toolbar-empty">
            <span>No nodes matching "{query}"</span>
          </div>
        )}
      </div>
    </header>
  );
};

