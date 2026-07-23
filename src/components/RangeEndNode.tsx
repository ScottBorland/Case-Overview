import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { Node, NodeProps } from '@xyflow/react';
import { colors, font, radius } from '../styles/designTokens.js';

export type RangeEndData = {
  kind: 'end' | 'ongoing';
  label?: string;
};

type RangeEndNodeType = Node<RangeEndData, 'rangeEnd'>;

const hidden: React.CSSProperties = {
  opacity: 0,
  width: 0,
  height: 0,
  pointerEvents: 'none',
};

function RangeEndNode({ data }: NodeProps<RangeEndNodeType>) {
  const label = data.label ?? (data.kind === 'ongoing' ? 'Ongoing' : 'Ended');

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
        pointerEvents: 'none',
      }}
      title={label}
    >
      {label}
      <Handle type="target" position={Position.Top} id="top" isConnectable={false} style={hidden} />
      <Handle type="target" position={Position.Left} id="left" isConnectable={false} style={hidden} />
      <Handle type="source" position={Position.Right} id="right" isConnectable={false} style={hidden} />
    </div>
  );
}

export default memo(RangeEndNode);
