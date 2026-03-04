import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { Node, NodeProps } from '@xyflow/react';

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

  if (n >= 1 && n <= 7) return mondayFirst[n - 1];
  if (n >= 0 && n <= 6) return mondayFirst[n];

  return s;
}

function MissingEpisodeNode({ data }: NodeProps<MissingEpisodeNodeType>) {
  const row = data.row || {};

  const startRaw = (row['Missing Person Start Date'] || '').trim();
  const endRaw = (row['Missing Person End Date'] || '').trim();

  const started = formatDateLabel(startRaw) || startRaw || '—';
  const ended = formatDateLabel(endRaw) || endRaw || '—';

  const exclude = new Set([
    'Case Number',
    'Missing Person Start Date',
    'Missing Person End Date',
    'CLA End Date',
  ]);

  const keys = Object.keys(row).filter((k) => !exclude.has(k));
  const orderedKeys = keys.sort((a, b) => a.localeCompare(b));

  const completed72 = (row['Completed within 72 hours?'] || '').toLowerCase().includes('yes');

  const background = '#ffffff'; // white background
  const border = completed72 ? 'rgb(22, 163, 74)' : 'rgb(37, 99, 235)'; // green if completed quickly, else blue

  return (
    <div
      style={{
        padding: '10px 12px',
        borderRadius: 10,
        background,
        border: `2px solid ${border}`,
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
        color: '#0b132b',
      }}
    >
      <div style={{ fontWeight: 800, marginBottom: 8, textAlign: 'center', fontSize: 14 }}>
        Missing Episode
      </div>

      {/* Core dates */}
      <div style={{ display: 'grid', gridTemplateColumns: '190px 1fr', gap: '4px 10px', marginBottom: 8 }}>
        <div style={{ fontWeight: 700, opacity: 0.85 }}>Missing Person Start Date</div>
        <div>{started}</div>

        <div style={{ fontWeight: 700, opacity: 0.85 }}>Missing Person End Date</div>
        <div>{ended}</div>
      </div>

      {/* Other fields */}
      {orderedKeys.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '190px 1fr', gap: '4px 10px' }}>
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
                <div style={{ fontWeight: 700, opacity: 0.85 }}>{k}</div>
                <div>{formatted || displayVal}</div>
              </div>
            );
          })}
        </div>
      )}

      <Handle type="target" position={Position.Top} id="top" isConnectable={false} style={hiddenHandleStyle} />
      <Handle type="source" position={Position.Bottom} id="bottom" isConnectable={false} style={hiddenHandleStyle} />
      <Handle type="target" position={Position.Left} id="left" isConnectable={false} style={hiddenHandleStyle} />
      <Handle type="source" position={Position.Right} id="right" isConnectable={false} style={hiddenHandleStyle} />
    </div>
  );
}

export default memo(MissingEpisodeNode);