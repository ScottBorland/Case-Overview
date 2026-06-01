import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { Node, NodeProps } from '@xyflow/react';

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
  const isOngoing = data?.kind === 'ongoing';

  const background = isOngoing
    ? '#f3f4f6'
    : '#ffffff';

  const border = isOngoing
    ? '#9ca3af'
    : 'rgba(70, 71, 71, 1)';

  const label =
  data.label ??
  (data.kind === 'ongoing' ? 'Ongoing' : 'Hazard Ended');

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
      <Handle type="target" position={Position.Top} id="top" isConnectable={false} style={hidden} />
      <Handle type="target" position={Position.Left} id="left" isConnectable={false} style={hidden} />
      <Handle type="source" position={Position.Right} id="right" isConnectable={false} style={hidden} />
    </div>
  );
}

export default memo(RangeEndNode);