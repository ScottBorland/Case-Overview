// src/components/OffenceNode.tsx
import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { Node, NodeProps } from '@xyflow/react';

import { nodeLabelStyle, nodeValueStyle } from '../styles/nodeStyles.js';

export type OffenceNodeData = {
  row: Record<string, string | undefined>;
};

type OffenceNodeType = Node<OffenceNodeData, 'offence'>;

const hiddenHandleStyle: React.CSSProperties = {
  opacity: 0,
  width: 0,
  height: 0,
  pointerEvents: 'none',
};

function formatDateLabel(raw?: string | null): string {
  const s = (raw ?? '').toString().trim();
  if (!s || s === 'NaT' || s === 'Unknown') return '';

  const clean = s.endsWith(' 00:00:00') ? s.slice(0, 10) : s;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(clean)) return '';

  const d = new Date(clean);
  if (isNaN(d.getTime())) return '';

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

function OffenceNode({ data }: NodeProps<OffenceNodeType>) {
  const row = data.row || {};

  const offenceDateRaw = (row['Offence Date'] ?? '').toString().trim();
  const offenceDate = formatDateLabel(offenceDateRaw) || offenceDateRaw || '—';
  const offence = (row['Offence'] ?? '').toString().trim() || '—';
  const plea = (row['Plea'] ?? '').toString().trim() || '—';
  const outcome = (row['Outcome'] ?? '').toString().trim() || '—';

  const exclude = new Set([
    'Case Number',
    'Offence Date',
    'Offence',
    'Plea',
    'Outcome',
  ]);

  const keys = Object.keys(row).filter((k) => !exclude.has(k));
  const orderedKeys = keys.sort((a, b) => a.localeCompare(b));

  return (
    <div
      style={{
        padding: '10px 12px',
        borderRadius: 10,
        background: 'rgba(234, 88, 12, 0.15)',
        border: '2px solid rgb(234, 88, 12)',
        boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
        width: 360,
        minWidth: 360,
        maxWidth: 360,
        whiteSpace: 'normal',
        wordWrap: 'break-word',
        overflowWrap: 'anywhere',
        fontSize: 12.5,
        lineHeight: 1.35,
        position: 'relative',
        color: '#000000',
      }}
    >
      <div style={{ fontWeight: 800, marginBottom: 8, textAlign: 'center', fontSize: 14 }}>
        Offence
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '4px 10px', marginBottom: 8 }}>
        <div style={{ ...nodeLabelStyle, opacity: 0.85 }}>Offence Date</div>
        <div style={nodeValueStyle}>{offenceDate}</div>

        <div style={{ ...nodeLabelStyle, opacity: 0.85 }}>Offence</div>
        <div style={nodeValueStyle}>{offence}</div>

        <div style={{ ...nodeLabelStyle, opacity: 0.85 }}>Plea</div>
        <div style={nodeValueStyle}>{plea}</div>

        <div style={{ ...nodeLabelStyle, opacity: 0.85 }}>Outcome</div>
        <div style={nodeValueStyle}>{outcome}</div>
      </div>

      <div style={{ marginTop: 10 }}>
        <details>
          <summary
            style={{ cursor: 'pointer', fontWeight: 800, color: '#000' }}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            Details
          </summary>

          <div
            style={{
              marginTop: 8,
              display: 'grid',
              gridTemplateColumns: '140px 1fr',
              gap: '4px 10px',
            }}
          >
            {orderedKeys.map((k) => {
              const raw = (row[k] ?? '').toString().trim();
              const displayVal = raw || '—';

              const keyLooksDatey = /date|time/i.test(k);
              const formatted = keyLooksDatey ? formatDateLabel(raw) : '';

              return (
                <div key={k} style={{ display: 'contents' }}>
                  <div style={nodeLabelStyle}>{k}</div>
                  <div style={nodeValueStyle}>{formatted || displayVal}</div>
                </div>
              );
            })}
          </div>
        </details>
      </div>

      <Handle type="target" position={Position.Top} id="top" isConnectable={false} style={hiddenHandleStyle} />
      <Handle type="source" position={Position.Bottom} id="bottom" isConnectable={false} style={hiddenHandleStyle} />
      <Handle type="target" position={Position.Left} id="left" isConnectable={false} style={hiddenHandleStyle} />
      <Handle type="source" position={Position.Right} id="right" isConnectable={false} style={hiddenHandleStyle} />
    </div>
  );
}

export default memo(OffenceNode);