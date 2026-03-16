import React, { memo } from 'react';
import { NodeResizer } from '@xyflow/react';
import type { Node, NodeProps } from '@xyflow/react';

export type TimelineItem = {
  kind: string;
  title: string;
  row: Record<string, string | undefined>;
  excludeKeys?: string[];
};

export type TimelineGroup = {
  dateKey: string;
  label: string;
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

function TimelineNode({ data, selected }: NodeProps<TimelineNodeType>) {
  const groups = data.groups ?? [];

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        minWidth: 320,
        minHeight: 260,
        borderRadius: 16,
        background: '#ffffff',
        border: '1px solid #dbe3ea',
        boxShadow: '0 12px 28px rgba(0,0,0,0.16)',
        color: 'black',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={320}
        minHeight={260}
        lineStyle={{ borderColor: '#94a3b8' }}
        handleStyle={{
          width: 10,
          height: 10,
          borderRadius: 999,
          background: '#ffffff',
          border: '1px solid #94a3b8',
        }}
      />

      <div
        style={{
          top: 0,
          zIndex: 2,
          fontWeight: 800,
          fontFamily: 'Arial, sans-serif',
          fontSize: 18,
          textAlign: 'center',
          color: 'black',
          background: '#ffffff',
          padding: '14px 14px 8px 14px',
          flex: '0 0 auto',
        }}
      >
        Timeline
      </div>

      <div
        style={{
          flex: '1 1 auto',
          overflow: 'auto',
          padding: '0 14px 14px 14px',
          minHeight: 0,
        }}
      >
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
                    fontWeight: 550,
                    fontSize: 14,
                    marginBottom: 8,
                    paddingTop: index === 0 ? 0 : 12,
                    borderTop: index === 0 ? 'none' : '1px solid #e5e7eb',
                    color: 'black',
                    background: '#f8fafc',
                    padding: '6px 10px',
                    borderRadius: 8,
                  }}
                >
                  {formatDateLabel(g.dateKey)}
                </div>

                <div
                  style={{
                    borderRadius: 10,
                    border: `1px solid rgba(15, 23, 42, 0.12)`,
                    background: 'white',
                    padding: '8px 10px',
                    borderLeft: `5px solid rgba(15, 23, 42, 0.12)`,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {g.items.map((it, idx) => {
                      const exclude = new Set([...(it.excludeKeys ?? [])]);

                      const keys = Object.keys(it.row ?? {})
                        .filter((k) => !exclude.has(k))
                        .sort((a, b) => a.localeCompare(b));

                      let border = 'black';
                      let background = 'white';

                      const kind = it.kind.toLowerCase();

                      if (kind.includes('hazard')) {
                        border = 'rgba(239,68,68,0.45)';
                        background = 'rgba(239,68,68,0.15)';
                      } else if (kind.includes('intervention')) {
                        border = 'rgba(22,162,74,0.45)';
                        background = 'rgba(22,163,74,0.15)';
                      } else if (kind.includes('missing')) {
                        border = 'rgba(59,130,246,0.45)';
                        background = 'rgba(59,130,246,0.05)';
                      } else if (kind.includes('offence')) {
                        border = 'rgba(234,88,12,0.45)';
                        background = 'rgba(234,88,12,0.15)';
                      } else if (kind.includes('asset')) {
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
                            borderLeft: `5px solid ${border}`,
                          }}
                        >
                          <summary
                            style={{
                              cursor: 'pointer',
                              listStyle: 'none',
                              display: 'flex',
                              alignItems: 'baseline',
                              gap: 4,
                              fontWeight: 500,
                              fontSize: 12.75,
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(TimelineNode);