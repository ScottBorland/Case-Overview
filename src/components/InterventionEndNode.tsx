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
  const isOngoing = text.toLowerCase() === 'ongoing';

  const accentColour = isOngoing ? '#9ca3af' : 'rgb(22, 163, 74)';

  return (
    <div
      style={{
        borderRadius: 12,
        background: '#ffffff',
        border: `2px solid ${accentColour}`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
        minWidth: 180,
        maxWidth: 220,
        whiteSpace: 'normal',
        wordWrap: 'break-word',
        overflowWrap: 'anywhere',
        overflow: 'hidden',
      }}
    >
      <div style={{
        background: isOngoing ? '#f3f4f6' : 'rgb(22, 163, 74)',
        color: isOngoing ? '#374151' : '#ffffff',
        fontWeight: 700,
        fontSize: 12.5,
        textAlign: 'center',
        padding: '7px 10px',
        letterSpacing: 0.2,
      }}>
        {text}
      </div>
      <Handle type="target" position={Position.Top} id="top" isConnectable={false} style={hidden} />
      <Handle type="target" position={Position.Left} id="left" isConnectable={false} style={hidden} />
      <Handle type="source" position={Position.Right} id="right" isConnectable={false} style={hidden} />
    </div>
  );
}

export default memo(InterventionEndNode);