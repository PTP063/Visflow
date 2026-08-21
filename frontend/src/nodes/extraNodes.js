// extraNodes.js
// Five additional node types, each defined in just a few lines thanks to
// the createNode/BaseNode abstraction — demonstrating how cheap it is to
// add new node types once the shared shell exists.

import { createNode } from './createNode';

export const FilterNode = createNode({
  title: 'Filter',
  icon: '🔍',
  accent: '#f59e0b',
  fields: [
    { name: 'condition', label: 'Condition', type: 'text', defaultValue: 'value > 0', placeholder: 'e.g. value > 0' },
  ],
  targetHandles: [{ id: 'input' }],
  sourceHandles: [{ id: 'output' }],
});

export const MathNode = createNode({
  title: 'Math',
  icon: '➗',
  accent: '#ef4444',
  fields: [
    {
      name: 'operation',
      label: 'Operation',
      type: 'select',
      options: ['Add', 'Subtract', 'Multiply', 'Divide'],
      defaultValue: 'Add',
    },
  ],
  targetHandles: [
    { id: 'a', style: { top: '35%' } },
    { id: 'b', style: { top: '65%' } },
  ],
  sourceHandles: [{ id: 'result' }],
});

export const APINode = createNode({
  title: 'API Request',
  icon: '🌐',
  accent: '#06b6d4',
  fields: [
    { name: 'url', label: 'URL', type: 'text', defaultValue: 'https://api.example.com', placeholder: 'https://...' },
    {
      name: 'method',
      label: 'Method',
      type: 'select',
      options: ['GET', 'POST', 'PUT', 'DELETE'],
      defaultValue: 'GET',
    },
  ],
  targetHandles: [{ id: 'params' }],
  sourceHandles: [{ id: 'response' }],
});


export const TimerNode = createNode({
  title: 'Delay',
  icon: '⏱️',
  accent: '#a855f7',
  fields: [{ name: 'seconds', label: 'Seconds', type: 'number', defaultValue: 1 }],
  targetHandles: [{ id: 'input' }],
  sourceHandles: [{ id: 'output' }],
});

export const NoteNode = createNode({
  title: 'Note',
  icon: '🗒️',
  accent: '#64748b',
  fields: [
    {
      name: 'note',
      label: '',
      type: 'textarea',
      defaultValue: 'Leave a note for collaborators...',
    },
  ],
});


