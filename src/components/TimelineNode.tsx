import React, { memo } from 'react';
import { useReactFlow } from '@xyflow/react';
import type { Node, NodeProps } from '@xyflow/react';

export type TimelineItem = {
  kind: string;
  title: string;
  row: Record<string, string | undefined>;
  excludeKeys?: string[];
  nodeId?: string;
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

export type TimelineNodeProps = { data: TimelineNodeData; selected?: boolean };

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

export function TimelineContent({ data, navigateTo }: { data: TimelineNodeData; navigateTo?: (nodeId: string | undefined) => void }) {
  const groups = data.groups ?? [];
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        borderRadius: 10,
        background: '#f9fafb',
        border: '1px solid #cbd5e1',
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* Header */}
      <div style={{
        flex: '0 0 auto',
        padding: '8px 12px',
        borderBottom: '1px solid #cbd5e1',
        fontSize: 13,
        fontWeight: 700,
        textAlign: 'center',
        color: '#111827',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      }}>
        Events
      </div>

      {/* Scrollable body */}
      <div style={{ flex: '1 1 auto', overflow: 'auto', padding: '8px 10px', minHeight: 0 }}>
        {groups.length === 0 ? (
          <div style={{ fontSize: 12, color: '#6b7280' }}>No events to show.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {groups.map((g, index) => (
              <div key={g.dateKey}>
                {/* Date label */}
                <div style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#374151',
                  letterSpacing: 0.3,
                  padding: `${index === 0 ? 0 : 10}px 0 4px 0`,
                }}>
                  {formatDateLabel(g.dateKey)}
                </div>

                {/* Items */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingLeft: 8, borderLeft: '2px solid #e2e8f0' }}>
                  {g.items.map((it, idx) => {
                    const exclude = new Set([...(it.excludeKeys ?? [])]);
                    const keys = Object.keys(it.row ?? {})
                      .filter((k) => !exclude.has(k))
                      .sort((a, b) => a.localeCompare(b));

                    let accentColour = '#94a3b8';
                    const kind = it.kind.toLowerCase();
                    if (kind.includes('hazard'))       accentColour = 'rgb(239,68,68)';
                    else if (kind.includes('intervention')) accentColour = 'rgb(22,163,74)';
                    else if (kind.includes('missing'))  accentColour = 'rgb(37,99,235)';
                    else if (kind.includes('offence'))  accentColour = '#EC7A08';
                    else if (kind.includes('asset'))    accentColour = 'rgb(124,58,237)';

                    return (
                      <details
                        key={`${g.dateKey}-${idx}-${it.kind}-${it.title}`}
                        onMouseDown={stop}
                        onPointerDown={stop}
                        onClick={stop}
                        style={{ borderRadius: 5, overflow: 'hidden' }}
                      >
                        <summary
                          style={{
                            cursor: 'pointer',
                            listStyle: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            fontSize: 12,
                            color: '#374151',
                            padding: '3px 6px',
                            borderRadius: 5,
                            userSelect: 'none',
                          }}
                          onClick={(e) => { e.stopPropagation(); navigateTo?.(it.nodeId); }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#f3f4f6')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          <span style={{ width: 7, height: 7, borderRadius: '50%', background: accentColour, flexShrink: 0, display: 'inline-block' }} />
                          <span style={{ color: '#374151', fontSize: 11, fontWeight: 600, flexShrink: 0 }}>{it.kind}</span>
                          <span style={{ color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.title}</span>
                        </summary>

                        <div style={{ padding: '4px 6px 6px 6px', fontSize: 11.5, background: '#ffffff', borderTop: '1px solid #f3f4f6' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: '3px 8px' }}>
                            {keys.map((k) => {
                              const v = (it.row?.[k] ?? '').toString().trim() || '—';
                              return (
                                <React.Fragment key={k}>
                                  <div style={{ fontWeight: 600, color: '#374151' }}>{k}</div>
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

function TimelineNode({ data }: TimelineNodeProps | NodeProps<TimelineNodeType>) {
  const { getNode, setCenter, getZoom } = useReactFlow();

  function navigateTo(nodeId: string | undefined) {
    if (!nodeId) return;
    const node = getNode(nodeId);
    if (!node) return;
    const x = node.position.x + (node.measured?.width ?? 200) / 2;
    const y = node.position.y + (node.measured?.height ?? 100) / 2;
    setCenter(x, y, { duration: 600, zoom: getZoom() }).catch(() => {});
  }

  return <TimelineContent data={data} navigateTo={navigateTo} />;
}

export default memo(TimelineNode);