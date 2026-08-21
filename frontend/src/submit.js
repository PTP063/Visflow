// submit.js

import { useState, useEffect, useCallback } from 'react';
import { useStore } from './store';
import { shallow } from 'zustand/shallow';

const selector = (state) => ({
  nodes: state.nodes,
  edges: state.edges,
  setModalData: state.setModalData,
  setToast: state.setToast,
});

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

export const SubmitButton = ({ onResult }) => {
  const { nodes, edges, setModalData, setToast } = useStore(selector, shallow);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (nodes.length === 0) {
      const msg = {
        variant: 'info',
        title: 'Empty Pipeline',
        message: 'Drag a few nodes onto the canvas or load a template before analyzing.',
      };
      if (onResult) onResult(msg);
      else setToast(msg);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/pipelines/parse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes, edges }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with HTTP ${response.status}`);
      }

      const result = await response.json();
      const { num_nodes, num_edges, is_dag, cycle_nodes, topological_order, num_components } = result;

      // Open detailed inspection modal
      setModalData({
        num_nodes,
        num_edges,
        is_dag,
        cycle_nodes,
        topological_order,
        num_components,
        rawPayload: { nodes, edges, analysis: result },
      });

      // Also trigger toast for quick feedback
      const toastPayload = {
        variant: is_dag ? 'success' : 'error',
        title: is_dag ? 'DAG Verification Passed' : 'Cycle Detected',
        rows: [
          { label: 'Nodes', value: num_nodes },
          { label: 'Edges', value: num_edges },
          { label: 'Structure', value: is_dag ? 'Valid DAG ✅' : 'Has Cycles ⚠️' },
        ],
      };
      if (onResult) onResult(toastPayload);
      else setToast(toastPayload);
    } catch (err) {
      const errToast = {
        variant: 'error',
        title: 'Analysis Error',
        message: `Could not connect to backend at ${BACKEND_URL}. (${err.message})`,
      };
      if (onResult) onResult(errToast);
      else setToast(errToast);
    } finally {
      setIsLoading(false);
    }
  }, [nodes, edges, setModalData, setToast, onResult]);

  // Keyboard shortcut: Ctrl+Enter or Cmd+Enter to analyze pipeline
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSubmit]);

  return (
    <div className="submit-bar">
      <button
        className={`submit-button ${isLoading ? 'loading' : ''}`}
        type="button"
        onClick={handleSubmit}
        disabled={isLoading}
        title="Analyze pipeline graph (Ctrl+Enter)"
      >
        {isLoading ? (
          <>
            <span className="submit-spinner"></span>
            <span>Analyzing Graph...</span>
          </>
        ) : (
          <>
            <span className="submit-icon">🚀</span>
            <span>Analyze & Verify Pipeline</span>
            <span className="submit-kbd">Ctrl+↵</span>
          </>
        )}
      </button>
    </div>
  );
};

