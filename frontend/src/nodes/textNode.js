// textNode.js
// Auto-resizing prompt/text node with dynamic variable port generation.

import { memo, useState, useEffect, useRef, useCallback } from 'react';
import { Handle, Position } from 'reactflow';
import { useStore } from '../store';
import { extractVariables, longestLineWidth } from './textUtils';
import './nodes.css';

const MIN_WIDTH = 240;
const MAX_WIDTH = 480;

const TextNodeImpl = ({ id, data }) => {
  const [currText, setCurrText] = useState(data?.text ?? '{{input}}');
  const [variables, setVariables] = useState(() => extractVariables(currText));
  const textareaRef = useRef(null);
  const updateNodeField = useStore((state) => state.updateNodeField);
  const deleteNode = useStore((state) => state.deleteNode);

  const resizeHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(el.scrollHeight, 44)}px`;
  }, []);

  useEffect(() => {
    resizeHeight();
  }, [currText, resizeHeight]);

  const handleTextChange = (e) => {
    const value = e.target.value;
    setCurrText(value);
    setVariables(extractVariables(value));
    updateNodeField(id, 'text', value);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    deleteNode(id);
  };

  const width = Math.min(Math.max(MIN_WIDTH, longestLineWidth(currText) + 56), MAX_WIDTH);
  const accentColor = '#ec4899';

  return (
    <div
      className="node text-node"
      style={{ width, '--node-accent': accentColor }}
    >
      {variables.map((varName, i) => (
        <Handle
          key={varName}
          type="target"
          position={Position.Left}
          id={`${id}-${varName}`}
          className="node-handle"
          style={{ top: `${((i + 1) / (variables.length + 1)) * 100}%` }}
          title={`Dynamic Input Port: {{${varName}}}`}
        />
      ))}

      {/* Header */}
      <div className="node-header">
        <div className="node-header-left">
          <span
            className="node-icon"
            style={{ background: `${accentColor}25`, color: accentColor }}
          >
            📝
          </span>
          <span className="node-title">Text / Prompt</span>
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

      <div className="node-body">
        <label className="node-field">
          <div className="node-field-header">
            <span className="node-field-label">Template (Use &#123;&#123;var&#125;&#125; for inputs)</span>
          </div>
          <textarea
            ref={textareaRef}
            className="node-input node-textarea text-node-textarea"
            value={currText}
            onChange={handleTextChange}
            placeholder="Type prompt with {{variables}}..."
            rows={1}
          />
        </label>

        {variables.length > 0 && (
          <div className="text-node-vars">
            <span className="vars-label">Connected Inputs:</span>
            <div className="vars-list">
              {variables.map((v) => (
                <span className="text-node-var-chip" key={v} title={`Port: {{${v}}}`}>
                  <span className="var-bullet">●</span>
                  {v}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        id={`${id}-output`}
        className="node-handle"
        title="Output: Formatted Text"
      />
    </div>
  );
};

export const TextNode = memo(
  TextNodeImpl,
  (prev, next) => prev.id === next.id && prev.data === next.data
);

