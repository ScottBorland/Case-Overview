import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { Node, NodeProps } from '@xyflow/react';
import { useNodeDisplay } from '../contexts/NodeDisplayContext.js';

export type DateHeaderData = { label: string };
type DateHeaderNodeType = Node<DateHeaderData, 'dateHeader'>;

const hidden: React.CSSProperties = {
  opacity: 0,
  width: 0,
  height: 0,
  pointerEvents: 'none',
};

function DateHeaderNode({ data }: NodeProps<DateHeaderNodeType>) {
  const { compact } = useNodeDisplay();
  const label = (data.label ?? '').trim();

  // Explicitly support the special "Ongoing" column (or any other non-date label you add later)
  if (label.toLowerCase().includes('ongoing')) {
    return (
      <div
        style={{
          position: 'relative',
          padding: compact ? '4px 12px' : '8px 28px',
          ...(compact ? { width: '100%', boxSizing: 'border-box' } : {}),
          borderRadius: 999,
          background: '#6b7280',
          color: '#ffffff',
          fontWeight: 500,
          fontSize: compact ? 12 : 18,
          textAlign: 'center',
          border: 'none',
          boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
          minWidth: compact ? 120 : 250,
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
        padding: compact ? '4px 12px' : '8px 28px',
        borderRadius: 999,
        background: '#ffffff',
        border: '1.5px solid #6b7280',
        fontWeight: 700,
        fontSize: compact ? 12 : 18,
        color: '#111827',
        boxShadow: compact ? '0 2px 6px rgba(0,0,0,0.12)' : '0 4px 12px rgba(0,0,0,0.18)',
        whiteSpace: 'nowrap',
        textAlign: 'center',
        ...(compact ? { width: '100%', boxSizing: 'border-box' } : {}),
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
