// outputNode.js

import { createNode } from './createNode';

export const OutputNode = createNode({
  title: 'Output',
  icon: '📤',
  accent: '#10b981',
  fields: [
    {
      name: 'outputName',
      label: 'Name',
      type: 'text',
      defaultValue: (id) => id.replace('customOutput-', 'output_'),
    },
    {
      name: 'outputType',
      label: 'Type',
      type: 'select',
      options: ['Text', 'Image'],
      defaultValue: 'Text',
    },
  ],
  targetHandles: [{ id: 'value' }],
});
