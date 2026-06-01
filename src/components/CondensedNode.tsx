import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { Node, NodeProps } from '@xyflow/react';

export type CondensedNodeData = {
  colour: string;
  typeLabel: string;
  title: string;
};

type CondensedNodeType = Node<CondensedNodeData, 'condensedCard'>;

const hidden: React.CSSProperties = { opacity: 0, width: 0, height: 0, pointerEvents: 'none' };

function CondensedNode({ data }: NodeProps<CondensedNodeType>) {
  return (
    <div style={{ width: 200, borderRadius: 7, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.12)', border: `1.5px solid ${data.colour}` }}>
      <div style={{
        background: data.colour,
        padding: '5px 10px',
        color: '#ffffff',
        fontWeight: 600,
        fontSize: 11.5,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>
        {data.typeLabel}
      </div>
      <div style={{
        background: '#ffffff',
        padding: '4px 10px',
        fontSize: 11,
        color: '#111827',
        fontWeight: 500,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>
        {data.title || '—'}
      </div>
      <Handle type="target" position={Position.Left} id="left" isConnectable={false} style={hidden} />
      <Handle type="source" position={Position.Right} id="right" isConnectable={false} style={hidden} />
      <Handle type="target" position={Position.Top} id="top" isConnectable={false} style={hidden} />
      <Handle type="source" position={Position.Bottom} id="bottom" isConnectable={false} style={hidden} />
    </div>
  );
}

export default memo(CondensedNode);
