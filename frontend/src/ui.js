// ui.js
// Displays the drag-and-drop canvas with dark glassmorphic styling and empty state helper

import { useState, useRef, useCallback } from 'react';
import ReactFlow, { Controls, Background, MiniMap } from 'reactflow';
import { useStore } from './store';
import { shallow } from 'zustand/shallow';
import { InputNode } from './nodes/inputNode';
import { LLMNode } from './nodes/llmNode';
import { OutputNode } from './nodes/outputNode';
import { TextNode } from './nodes/textNode';
import { FilterNode, MathNode, APINode, TimerNode, NoteNode } from './nodes/extraNodes';
import { PIPELINE_TEMPLATES } from './templates';

import 'reactflow/dist/style.css';

const gridSize = 20;
const proOptions = { hideAttribution: true };

const nodeTypes = {
  customInput: InputNode,
  llm: LLMNode,
  customOutput: OutputNode,
  text: TextNode,
  filter: FilterNode,
  math: MathNode,
  api: APINode,
  timer: TimerNode,
  note: NoteNode,
};

const getNodeColor = (node) => {
  switch (node.type) {
    case 'customInput':
      return '#3b82f6';
    case 'customOutput':
      return '#10b981';
    case 'llm':
      return '#8b5cf6';
    case 'text':
      return '#ec4899';
    case 'filter':
      return '#f59e0b';
    case 'math':
      return '#ef4444';
    case 'api':
      return '#06b6d4';
    case 'timer':
      return '#a855f7';
    case 'note':
      return '#64748b';
    default:
      return '#6366f1';
  }
};

const selector = (state) => ({
  nodes: state.nodes,
  edges: state.edges,
  getNodeID: state.getNodeID,
  addNode: state.addNode,
  onNodesChange: state.onNodesChange,
  onEdgesChange: state.onEdgesChange,
  onConnect: state.onConnect,
  loadTemplate: state.loadTemplate,
  setToast: state.setToast,
});

export const PipelineUI = () => {
  const reactFlowWrapper = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const {
    nodes,
    edges,
    getNodeID,
    addNode,
    onNodesChange,
    onEdgesChange,
    onConnect,
    loadTemplate,
    setToast,
  } = useStore(selector, shallow);

  const getInitNodeData = (nodeID, type) => {
    return { id: nodeID, nodeType: `${type}` };
  };

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      if (!reactFlowInstance) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      if (event?.dataTransfer?.getData('application/reactflow')) {
        const appData = JSON.parse(event.dataTransfer.getData('application/reactflow'));
        const type = appData?.nodeType;

        if (!type) return;

        const position = reactFlowInstance.project({
          x: event.clientX - reactFlowBounds.left,
          y: event.clientY - reactFlowBounds.top,
        });

        const nodeID = getNodeID(type);
        const newNode = {
          id: nodeID,
          type,
          position,
          data: getInitNodeData(nodeID, type),
        };

        addNode(newNode);
      }
    },
    [reactFlowInstance, getNodeID, addNode]
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const handleLoadDemo = (template) => {
    loadTemplate(template);
    setToast({
      variant: 'success',
      title: 'Template Loaded',
      message: `Loaded ${template.name}`,
    });
  };

  return (
    <div className="pipeline-canvas" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onInit={setReactFlowInstance}
        nodeTypes={nodeTypes}
        proOptions={proOptions}
        snapGrid={[gridSize, gridSize]}
        connectionLineType="smoothstep"
        connectionLineStyle={{ stroke: '#818cf8', strokeWidth: 2 }}
        fitView
      >
        <Background color="#1e293b" gap={gridSize} size={1.5} />
        <Controls className="custom-flow-controls" />
        <MiniMap
          pannable
          zoomable
          nodeColor={getNodeColor}
          className="custom-minimap"
          maskColor="rgba(9, 13, 22, 0.7)"
        />
      </ReactFlow>

      {/* Empty State Onboarding Card */}
      {nodes.length === 0 && (
        <div className="canvas-empty-state">
          <div className="empty-state-card">
            <div className="empty-icon-wrap">
              <span className="empty-icon">⚡</span>
            </div>
            <h3 className="empty-title">Start Building Your Pipeline</h3>
            <p className="empty-subtitle">
              Drag components from the top toolbar onto the canvas, or jumpstart with a pre-configured template:
            </p>
            <div className="empty-templates">
              {PIPELINE_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.id}
                  className="empty-template-btn"
                  onClick={() => handleLoadDemo(tmpl)}
                  type="button"
                >
                  <span className="empty-template-name">{tmpl.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

