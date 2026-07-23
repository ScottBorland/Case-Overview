import { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { Node, NodeProps } from '@xyflow/react';

import { colors, nodeCardBase, nodeEyebrow, nodeTitle, nodeDot } from '../styles/designTokens.js';
import { getHazardColourFromTitle, getHazardTextColour, getHazardBorderColour, getHazardSeverityLabel } from '../utils/hazardColours.js';
import { useNodeDisplay } from '../contexts/NodeDisplayContext.js';

export type HazardNodeData = {
  row: Record<string, string>;
};

type HazardNodeType = Node<HazardNodeData, 'hazard'>;

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

const detailLabelStyle: React.CSSProperties = {
  fontWeight: 700,
  fontSize: 11,
  color: colors.textPrimary,
};

const detailValueStyle: React.CSSProperties = {
  fontSize: 11,
  color: colors.textPrimary,
};

function HazardNode({ data }: NodeProps<HazardNodeType>) {
  const { compact } = useNodeDisplay();
  const [expanded, setExpanded] = useState(false);
  const row = data.row || {};

  const hazardType = (row['Hazard Type'] || '').trim();
  const title = hazardType || 'Hazard';

  const dotColour = getHazardColourFromTitle(title);
  const eyebrowColour = getHazardTextColour(title);
  const borderColour = getHazardBorderColour(title);
  const severityLabel = getHazardSeverityLabel(title);

  const eyebrowText = severityLabel ? `HAZARD \u00B7 ${severityLabel.toUpperCase()}` : 'HAZARD';

  // Dates (formatted)
  const startedRaw = (row['Date Hazard Started'] || '').trim();
  const endedRaw = (row['Date Hazard Ended'] || '').trim();
  const reviewRaw = (row['Review Date'] || '').trim();

  const started = formatDateLabel(startedRaw) || startedRaw || '\u2014';
  const ended = formatDateLabel(endedRaw) || endedRaw || '\u2014';
  const review = formatDateLabel(reviewRaw) || reviewRaw || '\u2014';

  // Details (dropdown)
  const details = (row['Hazard Details'] || '').trim();

  // Fields to show (excluding Hazard + Case Number + Hazard Details)
  const EXCLUDE = new Set([
    'Hazard',
    'Case Number',
    'Hazard Details',
  ]);

  const preferredOrder = [
    'Hazard Status',
    'Hazard Type (groups)',
  ];

  const keys = Object.keys(row).filter((k) => !EXCLUDE.has(k));
  const dateKeys = new Set(['Date Hazard Started', 'Date Hazard Ended']);
  const otherKeys = keys.filter((k) => !dateKeys.has(k));

  const orderedOtherKeys = [
    ...preferredOrder.filter((k) => otherKeys.includes(k)),
    ...otherKeys.filter((k) => !preferredOrder.includes(k)).sort((a, b) => a.localeCompare(b)),
  ];

  const handles = (
    <>
      <Handle type="target" position={Position.Top} id="top" isConnectable={false} style={hiddenHandleStyle} />
      <Handle type="source" position={Position.Bottom} id="bottom" isConnectable={false} style={hiddenHandleStyle} />
      <Handle type="target" position={Position.Left} id="left" isConnectable={false} style={hiddenHandleStyle} />
      <Handle type="source" position={Position.Right} id="right" isConnectable={false} style={hiddenHandleStyle} />
    </>
  );

  /* ── Compact mode ───────────────────────────────────────────────── */
  if (compact) return (
    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start' }}>
      {/* Dot */}
      <div style={{ ...nodeDot(dotColour), width: 7, height: 7, marginRight: 8, marginTop: 7 }} />

      {/* Card */}
      <div style={{
        ...nodeCardBase,
        padding: '6px 10px',
        border: `1px solid ${borderColour}`,
        width: 180,
        maxWidth: 180,
        whiteSpace: 'normal' as const,
        wordWrap: 'break-word' as const,
      }}>
        <div style={{ ...nodeEyebrow, fontSize: 9, color: eyebrowColour }}>{eyebrowText}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
          <span style={{ ...nodeTitle, fontSize: 11, flex: 1 }}>{title}</span>
          <button
            style={{ background: 'rgba(0,0,0,0.06)', border: 'none', borderRadius: 3, color: colors.textPrimary, cursor: 'pointer', padding: '1px 3px', fontSize: 9, lineHeight: 1, flexShrink: 0 }}
            onClick={(e) => { e.stopPropagation(); setExpanded(v => !v); }}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >{expanded ? '\u25B2' : '\u25BC'}</button>
        </div>
        {expanded && (
          <div style={{ fontSize: 10, borderTop: `1px solid ${borderColour}`, marginTop: 4, paddingTop: 4 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr', gap: '3px 6px', marginBottom: 4 }}>
              <div style={{ fontWeight: 700, color: colors.textPrimary }}>Started</div><div>{started}</div>
              <div style={{ fontWeight: 700, color: colors.textPrimary }}>Ended</div><div>{ended}</div>
            </div>
            <details>
              <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: 10, color: colors.textPrimary }}
                onMouseDown={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                Details
              </summary>
              <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '3px 6px', marginTop: 4 }}>
                {orderedOtherKeys.map((k) => (
                  <div key={k} style={{ display: 'contents' }}>
                    <div style={{ fontWeight: 700, color: colors.textPrimary }}>{k}</div>
                    <div>{(row[k] ?? '').toString().trim() || '\u2014'}</div>
                  </div>
                ))}
                <div style={{ fontWeight: 700, color: colors.textPrimary }}>Hazard Details</div><div>{details || '\u2014'}</div>
                <div style={{ fontWeight: 700, color: colors.textPrimary }}>Review Date</div><div>{review}</div>
              </div>
            </details>
          </div>
        )}
        {handles}
      </div>
    </div>
  );

  /* ── Full mode ──────────────────────────────────────────────────── */
  return (
    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start' }}>
      {/* Dot */}
      <div style={{ ...nodeDot(dotColour), marginRight: 8, marginTop: 11 }} />

      {/* Card */}
      <div style={{
        ...nodeCardBase,
        border: `1px solid ${borderColour}`,
        minWidth: 320,
        maxWidth: 480,
        whiteSpace: 'normal' as const,
        wordWrap: 'break-word' as const,
        overflowWrap: 'anywhere' as const,
      }}>
        {/* Eyebrow */}
        <div style={{ ...nodeEyebrow, color: eyebrowColour }}>{eyebrowText}</div>

        {/* Title */}
        <div style={{ ...nodeTitle, marginTop: 2 }}>{title}</div>

        {/* Dates block */}
        <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '4px 10px', marginTop: 8 }}>
          <div style={detailLabelStyle}>Date Hazard Started</div>
          <div style={detailValueStyle}>{started}</div>

          <div style={detailLabelStyle}>Date Hazard Ended</div>
          <div style={detailValueStyle}>{ended}</div>
        </div>

        {/* Hazard Details dropdown */}
        <div style={{ marginTop: 10 }}>
          <details>
            <summary
              style={{ cursor: 'pointer', fontWeight: 700, color: colors.textPrimary, fontSize: 11 }}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              Hazard Details
            </summary>

            <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: '150px 1fr', gap: '4px 10px' }}>
              {orderedOtherKeys.map((k) => {
                const val = (row[k] ?? '').toString().trim() || '\u2014';
                return (
                  <div key={k} style={{ display: 'contents' }}>
                    <div style={detailLabelStyle}>{k}</div>
                    <div style={detailValueStyle}>{val}</div>
                  </div>
                );
              })}

              <div style={detailLabelStyle}>Hazard Details</div>
              <div style={detailValueStyle}>{details || '\u2014'}</div>

              <div style={detailLabelStyle}>Review Date</div>
              <div style={detailValueStyle}>{review}</div>
            </div>
          </details>
        </div>

        {handles}
      </div>
    </div>
  );
}

export default memo(HazardNode);
