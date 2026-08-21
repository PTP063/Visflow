// store.js

import { createWithEqualityFn } from "zustand/traditional";
import {
    addEdge,
    applyNodeChanges,
    applyEdgeChanges,
    MarkerType,
  } from 'reactflow';
import { wouldCreateCycle } from './graphUtils';

export const useStore = createWithEqualityFn((set, get) => ({
    nodes: [],
    edges: [],
    nodeIDs: {},
    toast: null,
    modalData: null,
    isAnalyzing: false,
    activeCategory: 'all',

    setToast: (toast) => set({ toast }),
    clearToast: () => set({ toast: null }),
    setModalData: (modalData) => set({ modalData }),
    clearModalData: () => set({ modalData: null }),
    setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
    setActiveCategory: (activeCategory) => set({ activeCategory }),

    getNodeID: (type) => {
        const newIDs = {...get().nodeIDs};
        if (newIDs[type] === undefined) {
            newIDs[type] = 0;
        }
        newIDs[type] += 1;
        set({nodeIDs: newIDs});
        return `${type}-${newIDs[type]}`;
    },
    addNode: (node) => {
        set({
            nodes: [...get().nodes, node]
        });
    },
    deleteNode: (nodeId) => {
        set({
            nodes: get().nodes.filter((node) => node.id !== nodeId),
            edges: get().edges.filter(
                (edge) => edge.source !== nodeId && edge.target !== nodeId
            ),
        });
    },
    clearCanvas: () => {
        set({
            nodes: [],
            edges: [],
            nodeIDs: {},
        });
    },
    loadTemplate: (template) => {
        set({
            nodes: template.nodes || [],
            edges: template.edges || [],
            nodeIDs: template.nodeIDs || {},
        });
    },
    onNodesChange: (changes) => {
      set({
        nodes: applyNodeChanges(changes, get().nodes),
      });
    },
    onEdgesChange: (changes) => {
      set({
        edges: applyEdgeChanges(changes, get().edges),
      });
    },
    onConnect: (connection) => {
      const { source, target } = connection;

      if (wouldCreateCycle(source, target, get().edges)) {
        get().setToast({
          variant: 'error',
          title: 'Connection Blocked',
          message: 'That connection would create a cyclic dependency in the pipeline.',
        });
        return;
      }

      set({
        edges: addEdge(
          {
            ...connection,
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#818cf8', strokeWidth: 2 },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              height: 18,
              width: 18,
              color: '#818cf8',
            },
          },
          get().edges
        ),
      });
    },
    updateNodeField: (nodeId, fieldName, fieldValue) => {
      set({
        nodes: get().nodes.map((node) =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, [fieldName]: fieldValue } }
            : node
        ),
      });
    },
  }));

