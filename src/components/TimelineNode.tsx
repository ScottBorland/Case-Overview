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
        borderRadius: 12,
        background: '#ffffff',
        border: '2px solid #006D55',
        boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
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
        handleStyle={{ width: 10, height: 10, borderRadius: 999, background: '#ffffff', border: '1px solid #94a3b8' }}
      />

      {/* Header bar */}
      <div
        style={{
          flex: '0 0 auto',
          background: '#006D55',
          color: '#ffffff',
          fontWeight: 700,
          fontSize: 18,
          textAlign: 'center',
          padding: '10px 14px',
          letterSpacing: 0.2,
        }}
      >
        Timeline
      </div>

      {/* Scrollable body */}
      <div
        style={{
          flex: '1 1 auto',
          overflow: 'auto',
          padding: '10px 12px 12px 12px',
          minHeight: 0,
        }}
      >
        {groups.length === 0 ? (
          <div style={{ fontSize: 12.5, opacity: 0.75 }}>
            No events to show (check your toggles / CSVs).
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {groups.map((g, index) => (
              <div key={g.dateKey}>
                {/* Date group header */}
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: 12.5,
                    marginBottom: 6,
                    paddingTop: index === 0 ? 0 : 10,
                    borderTop: index === 0 ? 'none' : '1px solid #e5e7eb',
                    color: '#006D55',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  {formatDateLabel(g.dateKey)}
                </div>

                {/* Items */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {g.items.map((it, idx) => {
                    const exclude = new Set([...(it.excludeKeys ?? [])]);

                    const keys = Object.keys(it.row ?? {})
                      .filter((k) => !exclude.has(k))
                      .sort((a, b) => a.localeCompare(b));

                    let accentColour = '#64748b';

                    const kind = it.kind.toLowerCase();

                    if (kind.includes('hazard')) {
                      accentColour = 'rgb(239,68,68)';
                    } else if (kind.includes('intervention')) {
                      accentColour = 'rgb(22,163,74)';
                    } else if (kind.includes('missing')) {
                      accentColour = 'rgb(37,99,235)';
                    } else if (kind.includes('offence')) {
                      accentColour = '#EC7A08';
                    } else if (kind.includes('asset')) {
                      accentColour = 'rgb(124,58,237)';
                    }

                    return (
                      <details
                        key={`${g.dateKey}-${idx}-${it.kind}-${it.title}`}
                        onMouseDown={stop}
                        onPointerDown={stop}
                        onClick={stop}
                        style={{
                          borderRadius: 8,
                          border: '1px solid #e5e7eb',
                          background: '#ffffff',
                          borderLeft: `4px solid ${accentColour}`,
                          overflow: 'hidden',
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
                            color: '#111827',
                            padding: '6px 10px',
                          }}
                        >
                          <span style={{ color: accentColour, fontWeight: 700 }}>{it.kind}</span>
                          <span style={{ color: '#9ca3af' }}>—</span>
                          <span>{it.title}</span>
                        </summary>

                        <div style={{ padding: '0 10px 8px 10px', fontSize: 12.25, borderTop: '1px solid #f3f4f6' }}>
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '180px 1fr',
                              gap: '4px 10px',
                              marginTop: 6,
                            }}
                          >
                            {keys.map((k) => {
                              const v = (it.row?.[k] ?? '').toString().trim() || '—';
                              return (
                                <React.Fragment key={k}>
                                  <div style={{ fontWeight: 700, color: '#374151' }}>{k}</div>
                                  <div style={{ color: '#111827' }}>{v}</div>
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
    </div>
  );
}

export default memo(TimelineNode);