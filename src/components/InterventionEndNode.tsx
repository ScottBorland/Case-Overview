import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { Node, NodeProps } from '@xyflow/react';
import { colors, font, radius } from '../styles/designTokens.js';

export type InterventionEndData = {
  label: string;
  kind?: 'end' | 'ongoing';
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
        padding: '4px 12px',
        borderRadius: radius.fullPill,
        background: colors.endedPillBg,
        border: `1px solid ${colors.endedPillBorder}`,
        fontSize: 11,
        fontWeight: 600,
        fontFamily: font.family,
        textAlign: 'center',
        color: colors.endedPillText,
        whiteSpace: 'nowrap',
      }}
    >
      {text}
      <Handle type="target" position={Position.Top} id="top" isConnectable={false} style={hidden} />
      <Handle type="target" position={Position.Left} id="left" isConnectable={false} style={hidden} />
      <Handle type="source" position={Position.Right} id="right" isConnectable={false} style={hidden} />
    </div>
  );
}

export default memo(InterventionEndNode);
