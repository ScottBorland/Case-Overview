import React, { memo } from 'react';
import type { Node, NodeProps } from '@xyflow/react';

export type TimelineItem = {
  kind: string;                 // e.g. "Intervention", "Hazard", "AssetPlus"
  title: string;                // short summary shown inline
  row: Record<string, string | undefined>; // full row data for dropdown
  excludeKeys?: string[];        // optional keys to hide in the detail list
};

export type TimelineGroup = {
  dateKey: string;             // normalized YYYY-MM-DD (or "__ONGOING__" if you choose)
  label: string;               // formatted date label
  items: TimelineItem[];
};

export type TimelineNodeData = {
  groups: TimelineGroup[];
};

type TimelineNodeType = Node<TimelineNodeData, 'timelineMovable'>;

function formatDateLabel(raw?: string): string {
  if (!raw || raw === '__ONGOING__') return '📍 Ongoing';

  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;

  const formatted = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);

  return `📅 ${formatted}`;
}

// keeps interactive bits from killing drag
function stop(e: React.SyntheticEvent) {
  e.stopPropagation();
}

function TimelineNode({ data }: NodeProps<TimelineNodeType>) {
  const groups = data.groups ?? [];

  return (
    <div
      style={{
        width: 420,
        maxWidth: 520,
        maxHeight: '70vh',
        overflow: 'auto',
        padding: '12px 12px',
        borderRadius: 14,
        background: 'rgba(255,255,255,0.94)',
        border: '1px solid rgba(15, 23, 42, 0.18)',
        boxShadow: '0 10px 24px rgba(0,0,0,0.18)',
        color: 'black',
        backdropFilter: 'blur(6px)',
      }}
    >
      <div
        style={{
            fontWeight: 700,
            fontFamily: 'Helvetica',
            fontSize: 20,
            marginBottom: 12,
            textAlign: 'center',
            color: 'black',
        }}
        >
        Events
    </div>

      {groups.length === 0 ? (
        <div style={{ fontSize: 12.5, opacity: 0.75 }}>
          No events to show (check your toggles / CSVs).
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {groups.map((g, index) => (
  <div key={g.dateKey} style={{ marginBottom: 14 }}>
              <div
                    style={{
                        fontWeight: 600,
                        fontSize: 15.5,
                        marginBottom: 6,
                        paddingTop: index === 0 ? 0 : 10,
                        borderTop: index === 0 ? 'none' : '1px solid #e2e8f0',
                        textAlign: 'left',
                        color: 'black',

                        background: '#f8fafc',
                        padding: '4px 8px',
                        borderRadius: 6,
                    }}
                    >
                {formatDateLabel(g.dateKey)}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {g.items.map((it, idx) => {
                  const exclude = new Set([
                    ...(it.excludeKeys ?? []),
                  ]);

                  const keys = Object.keys(it.row ?? {})
                    .filter((k) => !exclude.has(k))
                    .sort((a, b) => a.localeCompare(b));

                let border = 'rgba(15,23,42,0.12)';
                let background = 'white';

                const kind = it.kind.toLowerCase();

                if (kind.includes('hazard')) {
                border = 'rgba(239,68,68,0.45)';
                background = 'rgba(239,68,68,0.05)';
                }
                else if (kind.includes('intervention')) {
                border = 'rgba(249,115,22,0.45)';
                background = 'rgba(249,115,22,0.05)';
                }
                else if (kind.includes('missing')) {
                border = 'rgba(59,130,246,0.45)';
                background = 'rgba(59,130,246,0.05)';
                }
                else if (kind.includes('asset')) {
                border = 'rgba(168,85,247,0.45)';
                background = 'rgba(168,85,247,0.05)';
                }

                  return (
                    
                    <details
                      key={`${g.dateKey}-${idx}-${it.kind}-${it.title}`}
                      onMouseDown={stop}
                      onPointerDown={stop}
                      onClick={stop}
                      style={{
                        borderRadius: 10,
                        border: `1px solid ${border}`,
                        background,
                        padding: '8px 10px',
                        borderLeft: `5px solid ${border}`
                    }}
                    >
                      <summary
                            style={{
                                cursor: 'pointer',
                                listStyle: 'none',
                                display: 'flex',
                                alignItems: 'baseline',
                                gap: 4,
                                fontWeight: 600,
                                fontSize: 12.5,
                                color: 'black',
                            }}
                            >
                            <span>{it.kind}</span>
                            <span>-</span>
                            <span>{it.title}</span>
                        </summary>

                      <div style={{ marginTop: 8, fontSize: 12.25 }}>
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '180px 1fr',
                            gap: '4px 10px',
                          }}
                        >
                          {keys.map((k) => {
                            const v = (it.row?.[k] ?? '').toString().trim() || '—';
                            return (
                              <React.Fragment key={k}>
                                <div style={{ fontWeight: 800 }}>{k}</div>
                                <div>{v}</div>
                              </React.Fragment>
                            );
                          })}
                        </div>
                      </div>
                    </details>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default memo(TimelineNode);