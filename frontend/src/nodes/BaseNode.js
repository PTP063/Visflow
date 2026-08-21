// BaseNode.js
// A generic, configurable node shell with glassmorphic styling, delete support,
// and automatic handle positioning.
// --------------------------------------------------------------------------

import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { useStore } from '../store';
import './nodes.css';

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
      title={`${type === 'target' ? 'Input' : 'Output'}: ${h.id}`}
    />
  ));

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
  const deleteNode = useStore((state) => state.deleteNode);
  validateConfig(config);

  const getValue = (field) => {
    if (data?.[field.name] !== undefined) return data[field.name];
    return typeof field.defaultValue === 'function'
      ? field.defaultValue(id)
      : field.defaultValue;
  };

  const handleChange = (field, rawValue) => {
    const value = field.type === 'number' && rawValue !== '' ? Number(rawValue) : rawValue;
    updateNodeField(id, field.name, value);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    deleteNode(id);
  };

  const targetHandles = config.targetHandles || [];
  const sourceHandles = config.sourceHandles || [];
  const accentColor = config.accent || '#6366f1';

  return (
    <div
      className="node"
      style={{
        width: config.width || 230,
        minHeight: config.height || 'auto',
        '--node-accent': accentColor,
      }}
    >
      <HandleColumn id={id} handles={targetHandles} type="target" position={Position.Left} />

      {/* Node Header */}
      <div className="node-header">
        <div className="node-header-left">
          {config.icon && (
            <span
              className="node-icon"
              style={{ background: `${accentColor}25`, color: accentColor }}
            >
              {config.icon}
            </span>
          )}
          <span className="node-title">{config.title}</span>
        </div>

        <button
          className="node-delete-btn"
          onClick={handleDelete}
          title="Delete node"
          aria-label="Delete node"
          type="button"
        >
          ✕
        </button>
      </div>

      {config.description && <div className="node-description">{config.description}</div>}

      {/* Node Body & Fields */}
      {(config.fields || []).length > 0 && (
        <div className="node-body">
          {config.fields.map((field) => (
            <label className="node-field" key={field.name}>
              {field.label && <span className="node-field-label">{field.label}</span>}
              {field.type === 'select' ? (
                <div className="node-select-wrap">
                  <select
                    className="node-input node-select"
                    value={getValue(field)}
                    onChange={(e) => handleChange(field, e.target.value)}
                  >
                    {field.options.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              ) : field.type === 'textarea' ? (
                <textarea
                  className="node-input node-textarea"
                  value={getValue(field)}
                  placeholder={field.placeholder}
                  onChange={(e) => handleChange(field, e.target.value)}
                  rows={2}
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

export const BaseNode = memo(BaseNodeImpl, (prev, next) => {
  return prev.id === next.id && prev.data === next.data && prev.config === next.config;
});

