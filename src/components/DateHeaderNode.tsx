import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { Node, NodeProps } from '@xyflow/react';

export type DateHeaderData = { label: string };
type DateHeaderNodeType = Node<DateHeaderData, 'dateHeader'>;

const hidden: React.CSSProperties = {
  opacity: 0,
  width: 0,
  height: 0,
  pointerEvents: 'none',
};

function DateHeaderNode({ data }: NodeProps<DateHeaderNodeType>) {
  const label = (data.label ?? '').trim();

  // Explicitly support the special "Ongoing" column (or any other non-date label you add later)
  if (label.toLowerCase().includes('ongoing')) {
    return (
      <div
        style={{
          position: 'relative',
          padding: '10px 28px',
          borderRadius: 999,
          background: '#1e293b',
          color: '#ffffff',
          fontWeight: 700,
          fontSize: 22,
          textAlign: 'center',
          border: '2px solid #1e293b',
          boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
          minWidth: 250,
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
        }}
      >
        {label || '📍 Ongoing'}

        <Handle type="target" position={Position.Left} id="left" isConnectable={false} style={hidden} />
        <Handle type="source" position={Position.Right} id="right" isConnectable={false} style={hidden} />
        <Handle type="target" position={Position.Top} id="top" isConnectable={false} style={hidden} />
        <Handle type="source" position={Position.Bottom} id="bottom" isConnectable={false} style={hidden} />
      </div>
    );
  }

  // Date formatting path
  const raw = label.replace('📅 ', '').trim();
  const clean = raw.endsWith(' 00:00:00') ? raw.slice(0, 10) : raw;

  let display = '';
  if (clean && clean !== 'NaT' && clean !== 'Unknown') {
    const d = new Date(clean);
    if (!isNaN(d.getTime())) {
      display = new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }).format(d);
    }
  }

  const textToShow = display ? `📅 ${display}` : (label || '(no label)');

  return (
    <div
      style={{
        padding: '10px 28px',
        borderRadius: 999,
        background: '#ffffff',
        border: '2px solid #1e293b',
        fontWeight: 700,
        fontSize: 22,
        color: '#000000',
        boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
        whiteSpace: 'nowrap',
      }}
    >
      {textToShow}

      <Handle type="target" position={Position.Left} id="left" isConnectable={false} style={hidden} />
      <Handle type="source" position={Position.Right} id="right" isConnectable={false} style={hidden} />
      <Handle type="source" position={Position.Bottom} id="bottom" isConnectable={false} style={hidden} />
    </div>
  );
}

export default memo(DateHeaderNode);
