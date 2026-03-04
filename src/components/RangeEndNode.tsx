import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { Node, NodeProps } from '@xyflow/react';

export type RangeEndData = {
  kind: 'end' | 'ongoing';
};

type RangeEndNodeType = Node<RangeEndData, 'rangeEnd'>;

const hidden: React.CSSProperties = {
  opacity: 0,
  width: 0,
  height: 0,
  pointerEvents: 'none',
};

function RangeEndNode({ data }: NodeProps<RangeEndNodeType>) {
  const isOngoing = data?.kind === 'ongoing';

  const background = isOngoing
    ? 'rgba(220, 252, 231, 1)'  // soft green
    : 'rgba(255, 255, 255, 1)'; // soft red

  const border = isOngoing
    ? 'rgb(22, 163, 74)'
    : 'rgba(70, 71, 71, 1)';

  const label = isOngoing ? 'Ongoing' : 'Hazard Ended';

  return (
    <div
      style={{
        padding: '6px 10px',
        borderRadius: 8,
        background,
        border: `2px solid ${border}`,
        fontSize: 12,
        fontWeight: 700,
        textAlign: 'center',
        color: '#0b132b',
        whiteSpace: 'nowrap',
        pointerEvents: 'none', // end nodes shouldn't be interactive
      }}
      title={label}
    >
      {label}

      {/* Invisible handles so edges attach correctly */}
      <Handle type="target" position={Position.Left} id="left" isConnectable={false} style={hidden} />
      <Handle type="source" position={Position.Right} id="right" isConnectable={false} style={hidden} />
    </div>
  );
}

export default memo(RangeEndNode);