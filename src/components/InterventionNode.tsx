// src/components/InterventionNode.tsx
import { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { Node, NodeProps } from '@xyflow/react';
import { colors, nodeEyebrowTint, nodeTitle, nodeCardGlow, nodeRibbon, nodeRibbonCompact } from '../styles/designTokens.js';
import { useNodeDisplay } from '../contexts/NodeDisplayContext.js';

export type InterventionNodeData = {
  row: Record<string, string | undefined>;
};

type InterventionNodeType = Node<InterventionNodeData, 'intervention'>;

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

  // only treat it as a date if it looks like YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(clean)) return '';

  const d = new Date(clean);
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

function InterventionNode({ data }: NodeProps<InterventionNodeType>) {
  const { compact } = useNodeDisplay();
  const [expanded, setExpanded] = useState(false);
  const row = data.row || {};

  const startRaw = (row['Start Date'] ?? '').toString().trim();
  const endRaw = (row['End Date'] ?? '').toString().trim();

  const started = formatDateLabel(startRaw) || startRaw || '\u2014';
  const ended = formatDateLabel(endRaw) || endRaw || '\u2014';
  const interventionType = (row['Intervention Type'] ?? '').toString().trim() || '\u2014';

  const exclude = new Set([
    'Case Number',
    'Start Date',
    'End Date',
    'Intervention Type',
  ]);

  const keys = Object.keys(row).filter((k) => !exclude.has(k));
  const orderedKeys = keys.sort((a, b) => a.localeCompare(b));

  if (compact) return (
    <div style={{ ...nodeCardGlow(colors.intervention), padding: '7px 10px', width: 180, maxWidth: 180 }}>
      <div style={nodeRibbonCompact(colors.intervention)} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <div style={{ flex: 1 }}>
          <div style={{ ...nodeEyebrowTint(colors.intervention), fontSize: 9 }}>INTERVENTION</div>
          <div style={{ ...nodeTitle, fontSize: 11 }}>{interventionType !== '\u2014' ? interventionType : 'Intervention'}</div>
        </div>
        <button
          style={{ background: 'rgba(0,0,0,0.08)', border: 'none', borderRadius: 3, color: '#000', cursor: 'pointer', padding: '1px 3px', fontSize: 9, lineHeight: 1, flexShrink: 0 }}
          onClick={(e) => { e.stopPropagation(); setExpanded(v => !v); }}
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >{expanded ? '\u25B2' : '\u25BC'}</button>
      </div>
      {expanded && (
        <div style={{ fontSize: 10, borderTop: '1px solid #f0f0f0', marginTop: 4, paddingTop: 4 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr', gap: '3px 6px', marginBottom: 4 }}>
            <div style={{ fontWeight: 700, color: colors.textPrimary }}>Start</div><div>{started}</div>
            <div style={{ fontWeight: 700, color: colors.textPrimary }}>End</div><div>{ended}</div>
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
                  <div>{(row[k] ?? '').toString().trim() || '\u2014'}</div>
                </div>
              ))}
            </div>
          </details>
        </div>
      )}
      <Handle type="target" position={Position.Top} id="top" isConnectable={false} style={hiddenHandleStyle} />
      <Handle type="source" position={Position.Bottom} id="bottom" isConnectable={false} style={hiddenHandleStyle} />
      <Handle type="target" position={Position.Left} id="left" isConnectable={false} style={hiddenHandleStyle} />
      <Handle type="source" position={Position.Right} id="right" isConnectable={false} style={hiddenHandleStyle} />
    </div>
  );

  return (
    <div
      style={{
        ...nodeCardGlow(colors.intervention),
        width: 360,
        minWidth: 360,
        maxWidth: 360,
        whiteSpace: 'normal',
        wordWrap: 'break-word',
        overflowWrap: 'anywhere',
        fontSize: 12.5,
        lineHeight: 1.35,
      }}
    >
      <div style={nodeRibbon(colors.intervention)} />

      {/* Eyebrow */}
      <div style={{ ...nodeEyebrowTint(colors.intervention) }}>
        INTERVENTION
      </div>

      {/* Title */}
      <div style={{ ...nodeTitle, marginBottom: 8 }}>
        {interventionType}
      </div>

      {/* Key dates */}
      <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: '4px 10px', marginBottom: 8, fontSize: 12 }}>
        <div style={{ fontWeight: 700, color: colors.textPrimary }}>Start Date</div>
        <div style={{ color: colors.textPrimary }}>{started}</div>

        <div style={{ fontWeight: 700, color: colors.textPrimary }}>End Date</div>
        <div style={{ color: colors.textPrimary }}>{ended}</div>
      </div>

      {/* Details dropdown */}
      <div style={{ marginTop: 4 }}>
        <details>
          <summary
            style={{ cursor: 'pointer', fontWeight: 700, color: colors.textPrimary, fontSize: 12 }}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            Intervention Details
          </summary>

          <div
            style={{
              marginTop: 8,
              display: 'grid',
              gridTemplateColumns: '120px 1fr',
              gap: '4px 10px',
              fontSize: 12,
            }}
          >
            {orderedKeys.map((k) => {
              const raw = (row[k] ?? '').toString().trim();
              const displayVal = raw || '\u2014';
              const keyLooksDatey = /date|time/i.test(k);
              const formatted = keyLooksDatey ? formatDateLabel(raw) : '';

              return (
                <div key={k} style={{ display: 'contents' }}>
                  <div style={{ fontWeight: 700, color: colors.textPrimary }}>{k}</div>
                  <div style={{ color: colors.textPrimary }}>{formatted || displayVal}</div>
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

export default memo(InterventionNode);
