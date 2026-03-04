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
          padding: '10px 16px',
          borderRadius: 14,
          background: 'rgb(0, 63, 114)',
          color: 'white',
          fontWeight: 600,
          fontSize: 18,
          textAlign: 'center',
          border: '2px solid rgba(2, 45, 81, 1)',
          minWidth: 250,
          pointerEvents: 'none',
        }}
      >
        {label || '📍 Ongoing'}

        <Handle type="target" position={Position.Left} id="left" isConnectable={false} style={hidden} />
        <Handle type="source" position={Position.Right} id="right" isConnectable={false} style={hidden} />
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
        month: 'short',
        year: 'numeric',
      }).format(d);
    }
  }

  const textToShow = display ? `📅 ${display}` : (label || '(no label)');

  return (
    <div
      style={{
        position: 'relative',
        padding: '10px 16px',
        borderRadius: 14,
        background: 'rgb(0, 63, 114)',
        color: 'white',
        fontWeight: 600,
        fontSize: 18,
        textAlign: 'center',
        border: '2px solid rgba(2, 45, 81, 1)',
        minWidth: 250,
        pointerEvents: 'none',
      }}
    >
      {textToShow}

      <Handle type="target" position={Position.Left} id="left" isConnectable={false} style={hidden} />
      <Handle type="source" position={Position.Right} id="right" isConnectable={false} style={hidden} />
    </div>
  );
}

export default memo(DateHeaderNode);
