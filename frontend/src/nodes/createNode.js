// createNode.js
// Factory that turns a static config object into a full React node
// component backed by BaseNode. This is the core of the abstraction:
// making a new node type is now a ~10-line config, not a ~40-line component.
// --------------------------------------------------------------------------

import { memo } from 'react';
import { BaseNode } from './BaseNode';

export const createNode = (config) => {
  const NodeComponent = ({ id, data }) => (
    <BaseNode id={id} data={data} config={config} />
  );
  NodeComponent.displayName = config.title || 'CustomNode';

  // ReactFlow renders this component directly (it's what's registered in
  // nodeTypes), so memoizing here — not just inside BaseNode — skips the
  // render call entirely for unaffected nodes, rather than just short-
  // circuiting one level down.
  return memo(NodeComponent, (prev, next) => prev.id === next.id && prev.data === next.data);
};
