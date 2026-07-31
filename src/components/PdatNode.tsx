import {memo, useState} from 'react'
import {Handle, Position} from '@xyflow/react'
import type {Node, NodeProps} from '@xyflow/react'
import { colors, nodeEyebrow, nodeEyebrowPill, nodeTitle, nodeDot } from '../styles/designTokens.js';
import { useNodeDisplay } from '../contexts/NodeDisplayContext.js';

export type PdatNodeData = {
    row: Record<string, string | undefined>;
}

type PdatNodeType = Node<PdatNodeData, 'pdat'>;

const hiddenHandleStyle: React.CSSProperties = {
    opacity: 0,
    width: 0,
    height: 0,
    pointerEvents: 'none'
};

function formatDateLabel(raw?: string | null): string {
  const s = (raw ?? '').toString().trim();
  if (!s || s === 'NaT' || s === 'Unknown') return '';
  const clean = s.endsWith(' 00:00:00') ? s.slice(0, 10) : s;
  const d = new Date(clean);
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(d);
}

const TEXT_HEAVY_FIELDS: Array<{ key: string; label: string }> = [
  { key: 'qwho_has_been_spoken_to_as_part_of_this_assessment', label: 'Who has been spoken to' },
  { key: 'qwho_will_support_the_child_and_family', label: 'Who will support the child and family' },
  { key: 'qwhat_interventions_will_be_delivered', label: 'What interventions will be delivered' },
  { key: 'qwhat_are_the_childs_additional_needs', label: "What are the child's additional needs" },
  { key: 'qsignificant_relationships', label: 'Significant relationships' },
];

const TEXT_HEAVY_KEYS = new Set(TEXT_HEAVY_FIELDS.map((f) => f.key));

const handles = (
  <>
    <Handle type="target" position={Position.Top} id="top" isConnectable={false} style={hiddenHandleStyle} />
    <Handle type="source" position={Position.Bottom} id="bottom" isConnectable={false} style={hiddenHandleStyle} />
    <Handle type="target" position={Position.Left} id="left" isConnectable={false} style={hiddenHandleStyle} />
    <Handle type="source" position={Position.Right} id="right" isConnectable={false} style={hiddenHandleStyle} />
  </>
);

function PdatNode({data}: NodeProps<PdatNodeType>){
    const { compact } = useNodeDisplay();
    const [expanded, setExpanded] = useState(false);
    const row = data.row || {};

    const startRaw = (row['Start Date'] ?? '').toString().trim();
    const started = formatDateLabel(startRaw) || startRaw || '-';
    const endRaw = (row['End Date'] ?? '').toString().trim();
    const ended = formatDateLabel(endRaw) || endRaw || '-';
    const instanceNo = (row['instance_no'] ?? '').toString().trim();
    const stageLabel = instanceNo ? `Stage ${instanceNo}${instanceNo === '2' ? ' (Review)' : ''}` : 'PDAT';
    const eyebrowLabel = instanceNo ? `PDAT \u00b7 STAGE ${instanceNo}` : 'PDAT';

    const exclude = new Set(['Case Number', 'Start Date', 'End Date', 'instance_no', ...TEXT_HEAVY_KEYS]);
    const keys = Object.keys(row).filter((k) => !exclude.has(k));
    const orderedKeys = keys.sort((a, b) => a.localeCompare(b));

    if (compact) return (
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start' }}>
        <div style={{ ...nodeDot(colors.pdat), width: 7, height: 7, marginRight: 8, marginTop: 6 }} />
        <div style={{
          background: '#fff',
          border: `1.5px solid ${colors.pdatBorder}`,
          borderRadius: 14,
          padding: '6px 10px',
          width: 180,
          maxWidth: 180,
          whiteSpace: 'normal',
          wordWrap: 'break-word',
          boxShadow: '0 1px 2px rgba(0,0,0,.04)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ flex: 1 }}>
              <div style={{ ...nodeEyebrowPill(colors.pdat), fontSize: 9 }}>{eyebrowLabel}</div>
              <div style={{ ...nodeTitle, fontSize: 11 }}>{stageLabel}</div>
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
              {TEXT_HEAVY_FIELDS.map(({ key, label }) => {
                const val = (row[key] ?? '').toString().trim();
                if (!val) return null;
                return (
                  <details key={key}>
                    <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: 10 }}
                      onMouseDown={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                      {label}
                    </summary>
                    <div style={{ marginTop: 2, fontSize: 9 }}>{val}</div>
                  </details>
                );
              })}
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
        </div>
        {handles}
      </div>
    );

    return(
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start' }}>
        <div style={{ ...nodeDot(colors.pdat), marginRight: 8, marginTop: 10 }} />
        <div style={{
          background: '#fff',
          border: `1.5px solid ${colors.pdatBorder}`,
          borderRadius: 14,
          padding: '8px 12px',
          boxShadow: '0 1px 2px rgba(0,0,0,.04)',
          width: 360,
          minWidth: 360,
          maxWidth: 360,
          whiteSpace: 'normal',
          wordWrap: 'break-word',
          overflowWrap: 'anywhere',
          fontSize: 12.5,
          lineHeight: 1.35,
          color: colors.textPrimary,
        }}>
          <div style={{ ...nodeEyebrowPill(colors.pdat) }}>{eyebrowLabel}</div>
          <div style={{ ...nodeTitle, marginTop: 2 }}>{stageLabel}</div>

          <div style={{ display: 'grid', gridTemplateColumns: '190px 1fr', gap: '4px 10px', marginTop: 8, marginBottom: 8 }}>
            <div style={{ fontWeight: 700, fontSize: 11, color: colors.textPrimary }}>Start Date</div>
            <div style={{ fontSize: 12, color: colors.textPrimary }}>{started}</div>
            <div style={{ fontWeight: 700, fontSize: 11, color: colors.textPrimary }}>End Date</div>
            <div style={{ fontSize: 12, color: colors.textPrimary }}>{ended}</div>
          </div>

          {TEXT_HEAVY_FIELDS.map(({ key, label }) => {
            const val = (row[key] ?? '').toString().trim();
            return (
              <div key={key} style={{ marginTop: 8 }}>
                <details>
                  <summary
                    style={{ cursor: 'pointer', fontWeight: 800, color: colors.textPrimary }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {label}
                  </summary>
                  <div style={{ marginTop: 4, fontSize: 12, color: colors.textPrimary }}>{val || '\u2014'}</div>
                </details>
              </div>
            );
          })}

          <div style={{ marginTop: 10 }}>
            <details>
              <summary
                style={{ cursor: 'pointer', fontWeight: 800, color: colors.textPrimary }}
                onMouseDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              >
                Details
              </summary>
              <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: '190px 1fr', gap: '4px 10px' }}>
                {orderedKeys.map((k) => {
                  const raw = (row[k] ?? '').toString().trim();
                  const displayVal = raw || '\u2014';
                  const keyLooksDatey = /date|time/i.test(k);
                  const formatted = keyLooksDatey ? formatDateLabel(raw) : '';
                  return (
                    <div key={k} style={{ display: 'contents' }}>
                      <div style={{ fontWeight: 700, fontSize: 11, color: colors.textPrimary }}>{k}</div>
                      <div style={{ fontSize: 12, color: colors.textPrimary }}>{formatted || displayVal}</div>
                    </div>
                  );
                })}
              </div>
            </details>
          </div>
        </div>
        {handles}
      </div>
    );
}

export default memo(PdatNode);
