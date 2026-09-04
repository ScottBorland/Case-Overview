import { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { Node, NodeProps } from '@xyflow/react';
import { colors, darkColors, nodeCardD2, nodeEyebrow, nodeEyebrowTint, nodeEyebrowD2, nodeEyebrowD2Compact, nodeTitle, nodeTitleDark, nodeTitleD2, nodeTitleD2Dark, nodeCardGlow, nodeRibbon, nodeRibbonCompact } from '../styles/designTokens.js';
import { useNodeDisplay } from '../contexts/NodeDisplayContext.js';

export type CraNodeData = {
  row: Record<string, string | undefined>;
};

type CraNodeType = Node<CraNodeData, 'cra'>;

const hiddenHandleStyle: React.CSSProperties = {
  opacity: 0,
  width: 0,
  height: 0,
  pointerEvents: 'none',
};

function formatDateLabel(raw?: string | null): string {
  const s = (raw ?? '').toString().trim();
  if (!s || s === 'NaT' || s === 'Unknown') return '';
  const clean = s.endsWith(' 00:00:00') ? s.slice(0, 10) : s;
  const d = new Date(clean);
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(d);
}

const RISK_FIELDS = [
  { key: 'Child Criminal Exploitation Risk', label: 'CCE Risk' },
  { key: 'Child Sexual Exploitation Risk', label: 'CSE Risk' },
  { key: 'Peer on peer/Contextual Risk', label: 'PoP/CR Risk' },
  { key: 'Serious Youth Violence Risk', label: 'SYV Risk' },
  { key: 'Radicalisation Risk', label: 'Rad Risk' },
];

function riskColor(value: string): string {
  const v = value.toLowerCase().trim();
  if (v === 'significant') return '#dc2626';
  if (v === 'moderate') return '#d97706';
  if (v === 'emerging') return '#16a34a';
  return colors.textPrimary;
}

function riskBg(value: string): string {
  const v = value.toLowerCase().trim();
  if (v === 'significant') return 'rgba(220,38,38,0.08)';
  if (v === 'moderate') return 'rgba(217,119,6,0.08)';
  if (v === 'emerging') return 'rgba(22,163,74,0.08)';
  return 'transparent';
}

const handles = (
  <>
    <Handle type="target" position={Position.Top} id="top" isConnectable={false} style={hiddenHandleStyle} />
    <Handle type="source" position={Position.Bottom} id="bottom" isConnectable={false} style={hiddenHandleStyle} />
    <Handle type="target" position={Position.Left} id="left" isConnectable={false} style={hiddenHandleStyle} />
    <Handle type="source" position={Position.Right} id="right" isConnectable={false} style={hiddenHandleStyle} />
  </>
);

function CraNode({ data }: NodeProps<CraNodeType>) {
  const { compact, darkMode, design2 } = useNodeDisplay();
  const [expanded, setExpanded] = useState(false);
  const row = data.row || {};

  const completedRaw = (row['Completed Date'] ?? '').toString().trim();
  const completed = formatDateLabel(completedRaw) || completedRaw || '—';
  const startedRaw = (row['Start Date'] ?? '').toString().trim();
  const started = formatDateLabel(startedRaw) || startedRaw || '—';

  const labelColor = darkMode ? '#fff' : colors.textPrimary;

  const exclude = new Set(['Case Number', 'Completed Date', 'Start Date', ...RISK_FIELDS.map(f => f.key)]);
  const extraKeys = Object.keys(row).filter((k) => !exclude.has(k)).sort((a, b) => a.localeCompare(b));

  if (compact) return (
    <div style={{
      ...(design2 ? nodeCardD2(colors.cra, darkMode) : nodeCardGlow(colors.cra, darkMode)),
      padding: '7px 10px',
      width: 180,
      maxWidth: 180,
      whiteSpace: 'normal',
      wordWrap: 'break-word',
    }}>
      {!design2 && <div style={nodeRibbonCompact(colors.cra)} />}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <div style={{ flex: 1 }}>
          <div style={design2 ? nodeEyebrowD2Compact(colors.craText, darkMode) : { ...nodeEyebrowTint(colors.cra, darkMode), fontSize: 9 }}>ROTH ASSESSMENT COMPLETED</div>
        </div>
        <button
          style={{ background: darkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)', border: 'none', borderRadius: 3, color: darkMode ? '#fff' : '#000', cursor: 'pointer', padding: '1px 3px', fontSize: 9, lineHeight: 1, flexShrink: 0 }}
          onClick={(e) => { e.stopPropagation(); setExpanded(v => !v); }}
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >{expanded ? '\u25B2' : '\u25BC'}</button>
      </div>
      {/* Dates */}
      <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '3px 6px', marginTop: 4, fontSize: 10 }}>
        <div style={{ fontWeight: 700, color: labelColor }}>Start Date</div><div>{started}</div>
        <div style={{ fontWeight: 700, color: labelColor }}>Completed</div><div>{completed}</div>
      </div>
      {/* Risk ratings always visible */}
      <div style={{ marginTop: 4 }}>
        {RISK_FIELDS.map(({ key, label }) => {
          const val = (row[key] ?? '').toString().trim() || 'N/A';
          return (
            <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2px 0' }}>
              <span style={{ fontWeight: 600, fontSize: 9, color: labelColor }}>{label}</span>
              <span style={{
                fontSize: 9,
                fontWeight: 700,
                color: riskColor(val),
                background: riskBg(val),
                borderRadius: 8,
                padding: '1px 5px',
              }}>{val}</span>
            </div>
          );
        })}
      </div>
      {expanded && extraKeys.length > 0 && (
        <div style={{ fontSize: 10, borderTop: `1px solid ${darkMode ? '#333' : '#f0f0f0'}`, marginTop: 4, paddingTop: 4 }}>
          <details>
            <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: 10 }}
              onMouseDown={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
              Details
            </summary>
            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '3px 6px', marginTop: 4 }}>
              {extraKeys.map((k) => (
                <div key={k} style={{ display: 'contents' }}>
                  <div style={{ fontWeight: 700, color: labelColor }}>{k}</div>
                  <div>{(row[k] ?? '').toString().trim() || '\u2014'}</div>
                </div>
              ))}
            </div>
          </details>
        </div>
      )}
      {handles}
    </div>
  );

  return (
    <div style={{
      ...(design2 ? nodeCardD2(colors.cra, darkMode) : nodeCardGlow(colors.cra, darkMode)),
      width: 360,
      minWidth: 360,
      maxWidth: 360,
      whiteSpace: 'normal',
      wordWrap: 'break-word',
      overflowWrap: 'anywhere',
      fontSize: 12.5,
      lineHeight: 1.35,
    }}>
      {!design2 && <div style={nodeRibbon(colors.cra)} />}

      <div style={design2 ? { ...nodeEyebrowD2(colors.craText, darkMode), marginBottom: 8 } : { ...nodeEyebrowTint(colors.cra, darkMode), marginBottom: 8 }}>ROTH ASSESSMENT COMPLETED</div>

      <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '4px 10px', marginBottom: 10, fontSize: 12 }}>
        <div style={{ fontWeight: 700, color: labelColor }}>Start Date</div>
        <div style={{ color: labelColor }}>{started}</div>
        <div style={{ fontWeight: 700, color: labelColor }}>Completed Date</div>
        <div style={{ color: labelColor }}>{completed}</div>
      </div>

      {/* Risk ratings — always visible */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
        {RISK_FIELDS.map(({ key, label }) => {
          const val = (row[key] ?? '').toString().trim() || 'N/A';
          return (
            <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 0' }}>
              <span style={{ fontWeight: 600, fontSize: 12, color: labelColor }}>{label}</span>
              <span style={{
                fontSize: 11,
                fontWeight: 700,
                color: riskColor(val),
                background: riskBg(val),
                borderRadius: 10,
                padding: '2px 8px',
              }}>{val}</span>
            </div>
          );
        })}
      </div>

      {/* Extra fields */}
      {extraKeys.length > 0 && (
        <div style={{ marginTop: 4 }}>
          <details>
            <summary
              style={{ cursor: 'pointer', fontWeight: 700, color: labelColor, fontSize: 12 }}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              Details
            </summary>
            <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: '120px 1fr', gap: '4px 10px', fontSize: 12 }}>
              {extraKeys.map((k) => {
                const raw = (row[k] ?? '').toString().trim();
                const displayVal = raw || '\u2014';
                const formatted = /date|time/i.test(k) ? formatDateLabel(raw) : '';
                return (
                  <div key={k} style={{ display: 'contents' }}>
                    <div style={{ fontWeight: 700, color: labelColor }}>{k}</div>
                    <div style={{ color: labelColor }}>{formatted || displayVal}</div>
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
}

export default memo(CraNode);
