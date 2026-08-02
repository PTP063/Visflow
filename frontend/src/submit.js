// submit.js

import { useStore } from './store';
import { shallow } from 'zustand/shallow';

const selector = (state) => ({
  nodes: state.nodes,
  edges: state.edges,
});

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

export const SubmitButton = ({ onResult }) => {
  const { nodes, edges } = useStore(selector, shallow);

  const handleSubmit = async () => {
    if (nodes.length === 0) {
      onResult({
        variant: 'info',
        title: 'Nothing to submit',
        message: 'Drag a few nodes onto the canvas before submitting your pipeline.',
      });
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/pipelines/parse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes, edges }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const result = await response.json();
      const { num_nodes, num_edges, is_dag } = result;

      onResult({
        variant: is_dag ? 'success' : 'error',
        title: 'Pipeline Analysis',
        rows: [
          { label: 'Nodes', value: num_nodes },
          { label: 'Edges', value: num_edges },
          { label: 'Forms a DAG', value: is_dag ? 'Yes ✅' : 'No ❌' },
        ],
      });
    } catch (err) {
      onResult({
        variant: 'error',
        title: 'Could not analyze pipeline',
        message: `Is the backend running at ${BACKEND_URL}? (${err.message})`,
      });
    }
  };

  return (
    <div className="submit-bar">
      <button className="submit-button" type="button" onClick={handleSubmit}>
        Submit Pipeline
      </button>
    </div>
  );
};
