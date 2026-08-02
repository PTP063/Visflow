// BaseNode.js
// A generic, configurable node shell. Every node type is defined by passing
// a config object describing its title, fields, and handles instead of
// hand-writing a full React component + markup + handle positioning.
// --------------------------------------------------------------------------

import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { useStore } from '../store';
import './nodes.css';

/**
 * @param {string} id - reactflow node id
 * @param {object} data - node data (persisted field values live here)
 * @param {object} config
 *   config.title          - string shown in the node header
 *   config.icon           - optional emoji/character shown next to title
 *   config.fields         - array of field descriptors:
 *        { name, label, type: 'text'|'select'|'textarea'|'number', options, defaultValue, placeholder }
 *   config.targetHandles   - array of { id, label, style } left-side (input) handles
 *   config.sourceHandles   - array of { id, label, style } right-side (output) handles
 *   config.width / height  - optional fixed size overrides
 *   config.accent          - optional accent color for the header
 */

// Handles read top-to-bottom from a single list, so both sides share one
// positioning rule instead of duplicating the same math twice.
const evenlySpaced = (index, total) => `${((index + 1) / (total + 1)) * 100}%`;

const HandleColumn = ({ id, handles, type, position }) =>
  handles.map((h, i) => (
    <Handle
      key={h.id}
      type={type}
      position={position}
      id={`${id}-${h.id}`}
      style={h.style || { top: evenlySpaced(i, handles.length) }}
      className="node-handle"
    />
  ));

// Dev-only sanity check — catches a malformed config (e.g. a copy-pasted
// node with no title, or a 'select' field missing its options) at the
// point a new node type is authored, instead of as a silent blank UI.
const validateConfig = (config) => {
  if (process.env.NODE_ENV !== 'development') return;
  if (!config?.title) {
    console.warn('[BaseNode] config is missing a "title".', config);
  }
  (config.fields || []).forEach((field) => {
    if (!field.name) console.warn('[BaseNode] a field is missing "name".', field);
    if (field.type === 'select' && !field.options?.length) {
      console.warn(`[BaseNode] select field "${field.name}" has no options.`);
    }
  });
};

const BaseNodeImpl = ({ id, data, config }) => {
  const updateNodeField = useStore((state) => state.updateNodeField);
  validateConfig(config);

  const getValue = (field) => {
    if (data?.[field.name] !== undefined) return data[field.name];
    return typeof field.defaultValue === 'function'
      ? field.defaultValue(id)
      : field.defaultValue;
  };

  const handleChange = (field, rawValue) => {
    // Number fields store an actual number (or '' mid-edit, e.g. while the
    // user is typing "-" before a digit) rather than the raw input string —
    // otherwise anything reading this field downstream has to re-parse it.
    const value = field.type === 'number' && rawValue !== '' ? Number(rawValue) : rawValue;
    updateNodeField(id, field.name, value);
  };

  const targetHandles = config.targetHandles || [];
  const sourceHandles = config.sourceHandles || [];

  return (
    <div
      className="node"
      style={{
        width: config.width || 220,
        minHeight: config.height || 'auto',
        borderTop: `3px solid ${config.accent || '#6366f1'}`,
      }}
    >
      <HandleColumn id={id} handles={targetHandles} type="target" position={Position.Left} />

      <div className="node-header">
        {config.icon && <span className="node-icon">{config.icon}</span>}
        <span className="node-title">{config.title}</span>
      </div>

      {config.description && <div className="node-description">{config.description}</div>}

      {(config.fields || []).length > 0 && (
        <div className="node-body">
          {config.fields.map((field) => (
            <label className="node-field" key={field.name}>
              {field.label && <span className="node-field-label">{field.label}</span>}
              {field.type === 'select' ? (
                <select
                  className="node-input"
                  value={getValue(field)}
                  onChange={(e) => handleChange(field, e.target.value)}
                >
                  {field.options.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : field.type === 'textarea' ? (
                <textarea
                  className="node-input node-textarea"
                  value={getValue(field)}
                  placeholder={field.placeholder}
                  onChange={(e) => handleChange(field, e.target.value)}
                />
              ) : (
                <input
                  className="node-input"
                  type={field.type || 'text'}
                  value={getValue(field)}
                  placeholder={field.placeholder}
                  onChange={(e) => handleChange(field, e.target.value)}
                />
              )}
            </label>
          ))}
        </div>
      )}

      {config.children}

      <HandleColumn id={id} handles={sourceHandles} type="source" position={Position.Right} />
    </div>
  );
};

// Memoized: ReactFlow re-renders all node components on canvas pan/zoom.
// Since a node's own UI only depends on its own `data`, skipping re-render
// when only sibling nodes changed avoids O(n) wasted renders on canvases
// with many nodes.
export const BaseNode = memo(BaseNodeImpl, (prev, next) => {
  return prev.id === next.id && prev.data === next.data && prev.config === next.config;
});
