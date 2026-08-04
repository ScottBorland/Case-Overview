import { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { Node, NodeProps } from '@xyflow/react';

import { colors, nodeEyebrowTint, nodeTitle, nodeCardGlow, nodeRibbon, nodeRibbonCompact } from '../styles/designTokens.js';
import { nodeValueStyle } from '../styles/nodeStyles.js';
import { nodeLabelStyle } from '../styles/nodeStyles.js';
import { useNodeDisplay } from '../contexts/NodeDisplayContext.js';

export type MissingEpisodeNodeData = {
  row: Record<string, string>;
};

type MissingEpisodeNodeType = Node<MissingEpisodeNodeData, 'missingEpisode'>;

const hiddenHandleStyle: React.CSSProperties = {
  opacity: 0,
  width: 0,
  height: 0,
  pointerEvents: 'none',
};

function formatDateLabel(raw?: string | null): string {
  if (!raw || raw === 'NaT' || raw === 'Unknown') return '';
  const clean = raw.endsWith(' 00:00:00') ? raw.slice(0, 10) : raw;
  const d = new Date(clean);
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

function formatDayOfWeek(raw?: string | null): string {
  const s = (raw ?? '').toString().trim();
  if (!s) return '';
  if (/[a-zA-Z]/.test(s)) return s;

  const n = Number(s);
  if (!Number.isFinite(n)) return s;

  const mondayFirst = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  if (n >= 1 && n <= 7) return mondayFirst[n - 1] ?? s;
  if (n >= 0 && n <= 6) return mondayFirst[n] ?? s;

  return s;
}

function MissingEpisodeNode({ data }: NodeProps<MissingEpisodeNodeType>) {
  const { compact } = useNodeDisplay();
  const [expanded, setExpanded] = useState(false);
  const row = data.row || {};

  const startRaw = (row['Missing Person Start Date'] || '').trim();
  const endRaw = (row['Missing Person End Date'] || '').trim();
  const reason = (row['REASON'] || '').trim();

  const started = formatDateLabel(startRaw) || startRaw || '—';
  const ended = formatDateLabel(endRaw) || endRaw || '—';

  const exclude = new Set([
    'Case Number',
    'Missing Person Start Date',
    'Missing Person End Date',
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
    <div style={{
      ...nodeCardGlow(colors.missingEpisode),
      padding: '7px 10px',
      width: 180,
      maxWidth: 180,
      whiteSpace: 'normal' as const,
      wordWrap: 'break-word' as const,
    }}>
      <div style={nodeRibbonCompact(colors.missingEpisode)} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <div style={{ flex: 1 }}>
          <div style={{ ...nodeEyebrowTint(colors.missingEpisode), fontSize: 9 }}>MISSING EPISODE</div>
          <div style={{ ...nodeTitle, fontSize: 11 }}>{reason || 'Unknown reason'}</div>
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
            <div style={{ fontWeight: 700, color: colors.textPrimary }}>Start</div><div>{started}</div>
            <div style={{ fontWeight: 700, color: colors.textPrimary }}>End</div><div>{ended}</div>
          </div>
          <details>
            <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: 10 }}
              onMouseDown={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
              Details
            </summary>
            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '3px 6px', marginTop: 4 }}>
              {orderedKeys.map((k) => {
                const raw = (row[k] ?? '').toString().trim();
                let displayVal = raw || '—';
                if (k === 'Day of Week') displayVal = formatDayOfWeek(raw) || displayVal;
                const formatted = /date|time/i.test(k) ? formatDateLabel(raw) : '';
                return (
                  <div key={k} style={{ display: 'contents' }}>
                    <div style={{ fontWeight: 700, color: colors.textPrimary }}>{k}</div>
                    <div>{formatted || displayVal}</div>
                  </div>
                );
              })}
            </div>
          </details>
        </div>
      )}
      {handles}
    </div>
  );

  return (
    <div
      style={{
        ...nodeCardGlow(colors.missingEpisode),
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
      <div style={nodeRibbon(colors.missingEpisode)} />

      {/* Eyebrow */}
      <div style={{ ...nodeEyebrowTint(colors.missingEpisode) }}>
        MISSING EPISODE
      </div>

      {/* Title */}
      <div style={{ ...nodeTitle, marginBottom: 8 }}>
        {reason || 'Unknown reason'}
      </div>

      {/* Core dates */}
      <div style={{ display: 'grid', gridTemplateColumns: '190px 1fr', gap: '4px 10px', marginBottom: 8 }}>
        <div style={{ fontWeight: 700, opacity: 0.85 }}>Missing Person Start Date</div>
        <div>{started}</div>

        <div style={{ fontWeight: 700, opacity: 0.85 }}>Missing Person End Date</div>
        <div>{ended}</div>
      </div>

      {/* Details dropdown */}
      <div style={{ marginTop: 10 }}>
        <details>
          <summary
            style={{ cursor: 'pointer', fontWeight: 800, color: colors.textPrimary }}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            Missing Episode Details
          </summary>

          <div
            style={{
              marginTop: 8,
              display: 'grid',
              gridTemplateColumns: '190px 1fr',
              gap: '4px 10px',
            }}
          >
            {orderedKeys.map((k) => {
              const raw = (row[k] ?? '').toString().trim();
              let displayVal = raw || '—';

              if (k === 'Day of Week') {
                displayVal = formatDayOfWeek(raw) || displayVal;
              }

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
  );
}

export default memo(MissingEpisodeNode);
