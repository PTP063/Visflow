// textNode.js
// Special-cased (not on the generic factory) because it has two behaviors
// the generic BaseNode doesn't support: auto-resizing to fit content, and
// dynamically generating target handles from {{variable}} tokens in the text.

import { memo, useState, useEffect, useRef, useCallback } from 'react';
import { Handle, Position } from 'reactflow';
import { useStore } from '../store';
import { extractVariables, longestLineWidth } from './textUtils';
import './nodes.css';

const MIN_WIDTH = 220;
const MAX_WIDTH = 460;

const TextNodeImpl = ({ id, data }) => {
  const [currText, setCurrText] = useState(data?.text ?? '{{input}}');
  const [variables, setVariables] = useState(() => extractVariables(currText));
  const textareaRef = useRef(null);
  const updateNodeField = useStore((state) => state.updateNodeField);

  const resizeHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(el.scrollHeight, 40)}px`;
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

  // Width scales to the actual rendered width of the longest line (measured
  // via canvas, not estimated from character count), padded for the
  // textarea's own inset, and clamped so one huge line can't swallow the
  // canvas.
  const width = Math.min(Math.max(MIN_WIDTH, longestLineWidth(currText) + 56), MAX_WIDTH);

  return (
    <div className="node text-node" style={{ width }}>
      {variables.map((varName, i) => (
        <Handle
          key={varName}
          type="target"
          position={Position.Left}
          id={`${id}-${varName}`}
          className="node-handle"
          style={{ top: `${((i + 1) / (variables.length + 1)) * 100}%` }}
        />
      ))}

      <div className="node-header">
        <span className="node-icon">📝</span>
        <span className="node-title">Text</span>
      </div>

      <div className="node-body">
        <label className="node-field">
          <span className="node-field-label">Text</span>
          <textarea
            ref={textareaRef}
            className="node-input node-textarea text-node-textarea"
            value={currText}
            onChange={handleTextChange}
            rows={1}
          />
        </label>
        {variables.length > 0 && (
          <div className="text-node-vars">
            {variables.map((v) => (
              <span className="text-node-var-chip" key={v}>
                {v}
              </span>
            ))}
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} id={`${id}-output`} className="node-handle" />
    </div>
  );
};

// Same reasoning as BaseNode/createNode: ReactFlow re-renders every
// registered node component on canvas interactions, so this only needs to
// re-run when this specific node's own data changes.
export const TextNode = memo(
  TextNodeImpl,
  (prev, next) => prev.id === next.id && prev.data === next.data
);
