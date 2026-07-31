// src/components/OffenceNode.tsx
import { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { Node, NodeProps } from '@xyflow/react';

import { colors, nodeEyebrow, nodeEyebrowPill, nodeTitle, nodeDot } from '../styles/designTokens.js';
import { nodeLabelStyle, nodeValueStyle } from '../styles/nodeStyles.js';
import { useNodeDisplay } from '../contexts/NodeDisplayContext.js';

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
  const { compact } = useNodeDisplay();
  const [expanded, setExpanded] = useState(false);
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

  const handles = (
    <>
      <Handle type="target" position={Position.Top} id="top" isConnectable={false} style={hiddenHandleStyle} />
      <Handle type="source" position={Position.Bottom} id="bottom" isConnectable={false} style={hiddenHandleStyle} />
      <Handle type="target" position={Position.Left} id="left" isConnectable={false} style={hiddenHandleStyle} />
      <Handle type="source" position={Position.Right} id="right" isConnectable={false} style={hiddenHandleStyle} />
    </>
  );

  if (compact) return (
    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start' }}>
      <div style={{ ...nodeDot(colors.offence), width: 7, height: 7, marginRight: 8, marginTop: 8 }} />
      <div style={{
        background: '#fff',
        border: `1.5px solid ${colors.offenceBorder}`,
        borderRadius: 14,
        padding: '6px 10px',
        width: 180,
        maxWidth: 180,
        boxShadow: '0 1px 2px rgba(0,0,0,.04)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ flex: 1 }}>
            <div style={{ ...nodeEyebrowPill(colors.offence), fontSize: 9 }}>OFFENCE</div>
            <div style={{ ...nodeTitle, fontSize: 11, whiteSpace: 'normal', wordWrap: 'break-word' }}>{offence !== '—' ? offence : 'Offence'}</div>
          </div>
          <button
            style={{ background: 'rgba(0,0,0,0.08)', border: 'none', borderRadius: 3, color: '#000', cursor: 'pointer', padding: '1px 3px', fontSize: 9, lineHeight: 1, flexShrink: 0 }}
            onClick={(e) => { e.stopPropagation(); setExpanded(v => !v); }}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >{expanded ? '▲' : '▼'}</button>
        </div>
        {expanded && (
          <div style={{ fontSize: 10, borderTop: '1px solid #f0f0f0', marginTop: 4, paddingTop: 4 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr', gap: '3px 6px', marginBottom: 4 }}>
              <div style={{ fontWeight: 700, color: colors.textPrimary }}>Date</div><div>{offenceDate}</div>
              <div style={{ fontWeight: 700, color: colors.textPrimary }}>Plea</div><div>{plea}</div>
              <div style={{ fontWeight: 700, color: colors.textPrimary }}>Outcome</div><div>{outcome}</div>
            </div>
            <details>
              <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: 10 }}
                onMouseDown={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                Details
              </summary>
              <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '3px 6px', marginTop: 4 }}>
                {orderedKeys.map((k) => (
                  <div key={k} style={{ display: 'contents' }}>
                    <div style={{ fontWeight: 700, color: colors.textPrimary }}>{k}</div>
                    <div>{(row[k] ?? '').toString().trim() || '—'}</div>
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}
        {handles}
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start' }}>
      <div style={{ ...nodeDot(colors.offence), marginRight: 8, marginTop: 12 }} />
      <div
        style={{
          background: '#fff',
          border: `1.5px solid ${colors.offenceBorder}`,
          borderRadius: 14,
          padding: '8px 12px',
          boxShadow: '0 1px 2px rgba(0,0,0,.04)',
          width: 360,
          minWidth: 360,
          maxWidth: 360,
          whiteSpace: 'normal',
          wordWrap: 'break-word',
          overflowWrap: 'anywhere',
          fontSize: 12.5,
          lineHeight: 1.35,
          color: colors.textPrimary,
        }}
      >
        <div style={{ ...nodeEyebrowPill(colors.offence) }}>OFFENCE</div>
        <div style={{ ...nodeTitle, marginBottom: 8 }}>{offence}</div>

        <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '4px 10px', marginBottom: 8 }}>
          <div style={{ ...nodeLabelStyle, opacity: 0.85 }}>Offence Date</div>
          <div style={nodeValueStyle}>{offenceDate}</div>

          <div style={{ ...nodeLabelStyle, opacity: 0.85 }}>Plea</div>
          <div style={nodeValueStyle}>{plea}</div>

          <div style={{ ...nodeLabelStyle, opacity: 0.85 }}>Outcome</div>
          <div style={nodeValueStyle}>{outcome}</div>
        </div>

        <div style={{ marginTop: 10 }}>
          <details>
            <summary
              style={{ cursor: 'pointer', fontWeight: 800, color: colors.textPrimary }}
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

        {handles}
      </div>
    </div>
  );
}

export default memo(OffenceNode);
