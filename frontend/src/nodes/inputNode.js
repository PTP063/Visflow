// inputNode.js

import { createNode } from './createNode';

export const InputNode = createNode({
  title: 'Input',
  icon: '📥',
  accent: '#3b82f6',
  fields: [
    {
      name: 'inputName',
      label: 'Name',
      type: 'text',
      defaultValue: (id) => id.replace('customInput-', 'input_'),
    },
    {
      name: 'inputType',
      label: 'Type',
      type: 'select',
      options: ['Text', 'File'],
      defaultValue: 'Text',
    },
  ],
  sourceHandles: [{ id: 'value' }],
});
