// llmNode.js

import { createNode } from './createNode';

export const LLMNode = createNode({
  title: 'LLM Engine',
  icon: '🤖',
  accent: '#8b5cf6',
  description: 'Inference model for prompt execution & reasoning.',
  fields: [
    {
      name: 'model',
      label: 'Model',
      type: 'select',
      options: ['GPT-4o', 'Claude 3.5 Sonnet', 'Gemini 1.5 Pro', 'Llama 3.1 70B'],
      defaultValue: 'Claude 3.5 Sonnet',
    },
  ],
  targetHandles: [
    { id: 'system', style: { top: '35%' } },
    { id: 'prompt', style: { top: '65%' } },
  ],
  sourceHandles: [{ id: 'response' }],
});

