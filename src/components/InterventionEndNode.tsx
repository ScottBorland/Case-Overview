// src/components/InterventionEndNode.tsx
import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { Node, NodeProps } from '@xyflow/react';

export type InterventionEndData = {
  label: string; // e.g. "Supervision ended"
  kind?: 'end' | 'ongoing'; // optional if you want styling differences later
};

type InterventionEndNodeType = Node<InterventionEndData, 'interventionEnd'>;

const hidden: React.CSSProperties = {
  opacity: 0,
  width: 0,
  height: 0,
  pointerEvents: 'none',
};

function InterventionEndNode({ data }: NodeProps<InterventionEndNodeType>) {
  const text = (data.label || '').trim() || 'Ended';

  return (
    <div
      style={{
        padding: '8px 10px',
        borderRadius: 10,
        background: '#ffffff',
        border: '2px solid rgb(234, 88, 12)', // orange
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        minWidth: 180,
        maxWidth: 220,
        textAlign: 'center',
        fontWeight: 800,
        fontSize: 12.5,
        color: '#0b132b',
        whiteSpace: 'normal',
        wordWrap: 'break-word',
        overflowWrap: 'anywhere',
      }}
    >
      {text}
      <Handle type="target" position={Position.Left} id="left" isConnectable={false} style={hidden} />
      <Handle type="source" position={Position.Right} id="right" isConnectable={false} style={hidden} />
    </div>
  );
}

export default memo(InterventionEndNode);