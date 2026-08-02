// llmNode.js

import { createNode } from './createNode';

export const LLMNode = createNode({
  title: 'LLM',
  icon: '🤖',
  accent: '#8b5cf6',
  description: 'Runs a large language model over the given prompt.',
  targetHandles: [
    { id: 'system', style: { top: '35%' } },
    { id: 'prompt', style: { top: '65%' } },
  ],
  sourceHandles: [{ id: 'response' }],
});
