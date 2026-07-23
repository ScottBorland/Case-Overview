import React, { memo } from 'react';
import { useReactFlow } from '@xyflow/react';
import type { Node, NodeProps } from '@xyflow/react';
import { colors, font } from '../styles/designTokens.js';

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
  if (!raw || raw === '__ONGOING__') return 'Ongoing';

  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

function stop(e: React.SyntheticEvent) {
  e.stopPropagation();
}

function getAccentColour(kind: string): string {
  const k = kind.toLowerCase();
  if (k.includes('hazard'))       return colors.hazardHigh;
  if (k.includes('intervention')) return colors.intervention;
  if (k.includes('missing'))      return colors.missingEpisode;
  if (k.includes('offence'))      return colors.offence;
  if (k.includes('asset'))        return colors.assetPlus;
  if (k.includes('exclusion'))    return colors.exclusion;
  if (k.includes('pdat'))         return colors.pdat;
  if (k.includes('contact'))      return colors.contact;
  return colors.textPrimary;
}

export function TimelineContent({ data, navigateTo }: { data: TimelineNodeData; navigateTo?: (nodeId: string | undefined) => void }) {
  const groups = data.groups ?? [];
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        borderRadius: 10,
        background: colors.sidebarBg,
        border: `1px solid ${colors.borderLight}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxSizing: 'border-box',
        fontFamily: font.family,
      }}
    >
      {/* Header */}
      <div style={{
        flex: '0 0 auto',
        padding: '10px 14px',
        borderBottom: `1px solid ${colors.borderLight}`,
        fontSize: 12.5,
        fontWeight: 700,
        textTransform: 'uppercase' as const,
        letterSpacing: 0.5,
        color: colors.textPrimary,
      }}>
        Events
      </div>

      {/* Scrollable body */}
      <div style={{ flex: '1 1 auto', overflow: 'auto', padding: '10px 14px', minHeight: 0 }}>
        {groups.length === 0 ? (
          <div style={{ fontSize: 12, color: colors.textPrimary }}>No events to show.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {groups.map((g) => (
              <div key={g.dateKey}>
                {/* Date heading */}
                <div style={{
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: colors.textPrimary,
                  marginBottom: 5,
                }}>
                  {formatDateLabel(g.dateKey)}
                </div>

                {/* Items */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingLeft: 2 }}>
                  {g.items.map((it, idx) => {
                    const exclude = new Set([...(it.excludeKeys ?? [])]);
                    const keys = Object.keys(it.row ?? {})
                      .filter((k) => !exclude.has(k))
                      .sort((a, b) => a.localeCompare(b));

                    const accent = getAccentColour(it.kind);

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
                            alignItems: 'baseline',
                            gap: 4,
                            fontSize: 12,
                            color: colors.textPrimary,
                            padding: '2px 4px',
                            borderRadius: 4,
                            userSelect: 'none',
                            lineHeight: 1.4,
                          }}
                          onClick={(e) => { e.stopPropagation(); navigateTo?.(it.nodeId); }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = colors.datePillBg)}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          <span style={{ color: accent, fontWeight: 700, flexShrink: 0, fontSize: 12 }}>{it.kind}</span>
                          <span style={{ color: colors.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.title}</span>
                        </summary>

                        <div style={{ padding: '4px 6px 6px 6px', fontSize: 11.5, background: '#ffffff', borderTop: `1px solid ${colors.borderLight}` }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: '3px 8px' }}>
                            {keys.map((k) => {
                              const v = (it.row?.[k] ?? '').toString().trim() || '—';
                              return (
                                <React.Fragment key={k}>
                                  <div style={{ fontWeight: 600, color: colors.textPrimary }}>{k}</div>
                                  <div style={{ color: colors.textPrimary }}>{v}</div>
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
