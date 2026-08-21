// PipelineModal.js
// Interactive glassmorphic inspector and DAG analysis modal for Visflow

import { useState } from 'react';

export const PipelineModal = ({ data, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [copied, setCopied] = useState(false);

  if (!data) return null;

  const { num_nodes, num_edges, is_dag, cycle_nodes, topological_order, num_components, rawPayload } = data;

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(rawPayload || data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className={`status-indicator ${is_dag ? 'status-success' : 'status-danger'}`}>
              <span className="status-dot"></span>
              {is_dag ? 'DAG Verified' : 'Cycle Detected'}
            </div>
            <h2 className="modal-title">Pipeline Analysis Report</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="modal-tabs">
          <button
            className={`modal-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            📊 Diagnostics & Stats
          </button>
          {is_dag && topological_order && (
            <button
              className={`modal-tab ${activeTab === 'execution' ? 'active' : ''}`}
              onClick={() => setActiveTab('execution')}
            >
              ⚡ Execution Order ({topological_order.length})
            </button>
          )}
          <button
            className={`modal-tab ${activeTab === 'json' ? 'active' : ''}`}
            onClick={() => setActiveTab('json')}
          >
            📄 Graph JSON
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {activeTab === 'overview' && (
            <div className="overview-tab">
              {/* Metric Cards Grid */}
              <div className="metrics-grid">
                <div className="metric-card">
                  <span className="metric-label">Nodes</span>
                  <span className="metric-value">{num_nodes}</span>
                  <span className="metric-sub">Active components</span>
                </div>
                <div className="metric-card">
                  <span className="metric-label">Edges</span>
                  <span className="metric-value">{num_edges}</span>
                  <span className="metric-sub">Data connections</span>
                </div>
                <div className="metric-card">
                  <span className="metric-label">Subgraphs</span>
                  <span className="metric-value">{num_components ?? 1}</span>
                  <span className="metric-sub">Connected groups</span>
                </div>
                <div className="metric-card">
                  <span className="metric-label">Graph Topology</span>
                  <span className={`metric-value ${is_dag ? 'text-emerald' : 'text-rose'}`}>
                    {is_dag ? 'Acyclic (DAG)' : 'Cyclic ⚠️'}
                  </span>
                  <span className="metric-sub">{is_dag ? 'Safe for execution' : 'Infinite loop risk'}</span>
                </div>
              </div>

              {/* Status Banner */}
              <div className={`status-banner ${is_dag ? 'banner-success' : 'banner-danger'}`}>
                <div className="banner-icon">{is_dag ? '✨' : '⚠️'}</div>
                <div className="banner-text">
                  <h4 className="banner-title">
                    {is_dag
                      ? 'Valid Directed Acyclic Graph (DAG)'
                      : 'Cyclic Dependency Detected'}
                  </h4>
                  <p className="banner-desc">
                    {is_dag
                      ? 'All nodes resolve linearly with no circular loops. This pipeline is mathematically sound and ready to execute.'
                      : 'The pipeline contains circular dependencies that would lead to infinite loops during execution.'}
                  </p>
                </div>
              </div>

              {/* Cycle Warning Details if applicable */}
              {!is_dag && cycle_nodes && cycle_nodes.length > 0 && (
                <div className="cycle-details">
                  <h4 className="section-heading">Culprit Cycle Nodes:</h4>
                  <div className="cycle-chips">
                    {cycle_nodes.map((nodeId) => (
                      <span className="cycle-chip" key={nodeId}>
                        🔴 {nodeId}
                      </span>
                    ))}
                  </div>
                  <p className="cycle-help">
                    💡 Tip: Break the loop by disconnecting one of the return edges feeding into these nodes.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'execution' && is_dag && topological_order && (
            <div className="execution-tab">
              <p className="tab-lead">
                Topological execution order computed via Kahn's algorithm (O(V+E)):
              </p>
              <div className="timeline">
                {topological_order.map((nodeId, index) => (
                  <div className="timeline-item" key={nodeId}>
                    <div className="timeline-badge">{index + 1}</div>
                    <div className="timeline-content">
                      <div className="timeline-header">
                        <span className="timeline-node-id">{nodeId}</span>
                        <span className="timeline-step">Step {index + 1}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'json' && (
            <div className="json-tab">
              <div className="json-controls">
                <span className="json-title">Graph Representation Payload</span>
                <button className="copy-btn" onClick={handleCopyJson}>
                  {copied ? '✅ Copied!' : '📋 Copy JSON'}
                </button>
              </div>
              <pre className="json-viewer">
                {JSON.stringify(rawPayload || { num_nodes, num_edges, is_dag, topological_order }, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
          <button className="btn-primary" onClick={handleCopyJson}>
            {copied ? 'Copied to Clipboard!' : 'Export Pipeline JSON'}
          </button>
        </div>
      </div>
    </div>
  );
};
