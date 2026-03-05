import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { Node, NodeProps } from '@xyflow/react';

import { getHazardColourFromTitle } from '../utils/hazardColours.js';

import { nodeLabelStyle } from '../styles/nodeStyles.js';
import { nodeValueStyle } from '../styles/nodeStyles.js';

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


function HazardNode({ data }: NodeProps<HazardNodeType>) {
  const row = data.row || {};

  const hazardType = (row['Hazard Type'] || '').trim();
  const title = hazardType || 'Hazard';

  const borderColour = getHazardColourFromTitle(title)

  const background = 
    borderColour === 'rgb(185, 28, 28)'
    ? 'rgba(254, 226, 226, 1)'
    : borderColour === 'rgb(180, 83, 9)'
    ? 'rgba(254, 243, 199, 1)'
    : borderColour === 'rgb(22, 163, 74)'
    ? 'rgba(220, 252, 231, 1)'
    : '#F7F7F7';

const border = borderColour;
const color = '#000000';

  // Dates (formatted)
  const startedRaw = (row['Date Hazard Started'] || '').trim();
  const endedRaw = (row['Date Hazard Ended'] || '').trim();
  const reviewRaw = (row['Review Date'] || '').trim();

  const started = formatDateLabel(startedRaw) || startedRaw || '—';
  const ended = formatDateLabel(endedRaw) || endedRaw || '—';
  const review = formatDateLabel(reviewRaw) || reviewRaw || '—';

  // Details (dropdown)
  const details = (row['Hazard Details'] || '').trim();

  // Fields to show (excluding Hazard + Case Number, per your request)
  // Also exclude Hazard Details because we render it in the dropdown.
  const EXCLUDE = new Set([
    'Hazard',
    'Case Number',
    'Hazard Details',
  ]);

  // Put the key fields first, then show the rest.
  const preferredOrder = [
    'Hazard Status',
    'Hazard Type (groups)',
    'Date Hazard Started',
    'Date Hazard Ended',
    'Review Date',
  ];

  const keys = Object.keys(row).filter((k) => !EXCLUDE.has(k));

  // Remove the date fields from the generic list so we don’t render them twice
  const dateKeys = new Set(['Date Hazard Started', 'Date Hazard Ended', 'Review Date']);
  const otherKeys = keys.filter((k) => !dateKeys.has(k));

  const orderedOtherKeys = [
    ...preferredOrder.filter((k) => otherKeys.includes(k)),
    ...otherKeys.filter((k) => !preferredOrder.includes(k)).sort((a, b) => a.localeCompare(b)),
  ];

  return (
    <div
    onMouseDown={() => console.log('hazard mousedown')}
      style={{
        padding: '10px 12px',
        borderRadius: 10,
        background,
        border: `2px solid ${border}`,
        boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
        minWidth: 320,
        maxWidth: 480,
        whiteSpace: 'normal',
        wordWrap: 'break-word',
        overflowWrap: 'anywhere',
        fontSize: 12.5,
        lineHeight: 1.35,
        position: 'relative',
        color,
      }}
    >
      {/* Title = Hazard Type */}
      <div style={{ fontWeight: 800, marginBottom: 8, textAlign: 'center', fontSize: 14, color: "#000000"}}>
        {title}
      </div>

      {/* Dates block (always visible) */}
      <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '4px 10px', marginBottom: 8 }}>
        <div style={nodeLabelStyle }>Date Hazard Started</div>
        <div>{started}</div>

        <div style={nodeLabelStyle}>Date Hazard Ended</div>
        <div>{ended}</div>

        <div style={nodeLabelStyle}>Review Date</div>
        <div>{review}</div>
      </div>

      {/* Other fields */}
      {orderedOtherKeys.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '4px 10px' }}>
          {orderedOtherKeys.map((k) => {
            const val = (row[k] ?? '').toString().trim() || '—';
            return (
              <div key={k} style={{ display: 'contents' }}>
                <div style={ nodeValueStyle }>{k}</div>
                <div>{val}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Hazard Details dropdown */}
      <div style={{ marginTop: 10 }}>
        <details>
          <summary
            style={{ cursor: 'pointer', fontWeight: 700 }}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            >
            Hazard Details
        </summary>
          <div style={{ marginTop: 6 }}>
            {details || '—'}
          </div>
        </details>
      </div>

      {/* Handles */}
      <Handle type="target" position={Position.Top} id="top" isConnectable={false} style={hiddenHandleStyle} />
      <Handle type="source" position={Position.Bottom} id="bottom" isConnectable={false} style={hiddenHandleStyle} />
      <Handle type="target" position={Position.Left} id="left" isConnectable={false} style={hiddenHandleStyle} />
      <Handle type="source" position={Position.Right} id="right" isConnectable={false} style={hiddenHandleStyle} />
    </div>
  );
}

export default memo(HazardNode);