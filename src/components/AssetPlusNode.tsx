import { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { Node, NodeProps } from '@xyflow/react';
import { colors, nodeCardD2, nodeEyebrow, nodeEyebrowTint, nodeEyebrowD2, nodeEyebrowD2Compact, nodeTitle, nodeTitleDark, nodeTitleD2, nodeTitleD2Dark, nodeCardGlow, nodeRibbon, nodeRibbonCompact } from '../styles/designTokens.js';
import { useNodeDisplay } from '../contexts/NodeDisplayContext.js';

export type AssetPlusNodeData = {
  row: Record<string, string | undefined>;
};

type AssetPlusNodeType = Node<AssetPlusNodeData, 'assetPlus'>;

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

function AssetPlusNode({ data }: NodeProps<AssetPlusNodeType>) {
  const { compact, darkMode, design2 } = useNodeDisplay();
  const [expanded, setExpanded] = useState(false);
  const row = data.row || {};

  const startRaw = (row['Start Date'] ?? '').toString().trim();
  const signedRaw = (row['Signed Date'] ?? '').toString().trim();

  const started = formatDateLabel(startRaw) || startRaw || '-';
  const signed = formatDateLabel(signedRaw) || signedRaw || '-';

  const exclude = new Set(['Case Number', 'Start Date', 'Signed Date', 'YOGRs', 'Rosh judgement']);
  const keys = Object.keys(row).filter((k) => !exclude.has(k));
  const orderedKeys = keys.sort((a, b) => a.localeCompare(b));

  const roshJudgement = (row['Rosh judgement'] ?? '').toString().trim();
  const titleText = roshJudgement ? `ROSH Judgement: ${roshJudgement}` : 'Assessment';

  if (compact) return (
    <div style={{ ...(design2 ? nodeCardD2(colors.assetPlus, darkMode) : nodeCardGlow(colors.assetPlus, darkMode)), padding: '7px 10px', width: 180, maxWidth: 180 }}>
      {!design2 && <div style={nodeRibbonCompact(colors.assetPlus)} />}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <div style={{ flex: 1 }}>
          <div style={design2 ? nodeEyebrowD2Compact(colors.assetPlusText, darkMode) : { ...nodeEyebrowTint(colors.assetPlus, darkMode), fontSize: 9 }}>ASSET PLUS</div>
          <div style={{ ...(design2 ? (darkMode ? nodeTitleD2Dark : nodeTitleD2) : (darkMode ? nodeTitleDark : nodeTitle)), fontSize: 11 }}>{titleText}</div>
        </div>
        <button
          style={{ background: darkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)', border: 'none', borderRadius: 3, color: darkMode ? '#fff' : '#000', cursor: 'pointer', padding: '1px 3px', fontSize: 9, lineHeight: 1, flexShrink: 0 }}
          onClick={(e) => { e.stopPropagation(); setExpanded(v => !v); }}
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >{expanded ? '\u25B2' : '\u25BC'}</button>
      </div>
      {expanded && (
        <div style={{ fontSize: 10, borderTop: `1px solid ${darkMode ? '#333' : '#f0f0f0'}`, marginTop: 4, paddingTop: 4 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr', gap: '3px 6px', marginBottom: 4 }}>
            <div style={{ fontWeight: 700, color: 'inherit' }}>Start</div><div>{started}</div>
            <div style={{ fontWeight: 700, color: 'inherit' }}>Signed</div><div>{signed}</div>
          </div>
          <details>
            <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: 10 }}
              onMouseDown={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
              Details
            </summary>
            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '3px 6px', marginTop: 4 }}>
              {orderedKeys.map((k) => (
                <div key={k} style={{ display: 'contents' }}>
                  <div style={{ fontWeight: 700, color: 'inherit' }}>{k}</div>
                  <div>{(row[k] ?? '').toString().trim() || '\u2014'}</div>
                </div>
              ))}
            </div>
          </details>
        </div>
      )}
      <Handle type="target" position={Position.Top} id="top" isConnectable={false} style={hiddenHandleStyle} />
      <Handle type="source" position={Position.Bottom} id="bottom" isConnectable={false} style={hiddenHandleStyle} />
      <Handle type="target" position={Position.Left} id="left" isConnectable={false} style={hiddenHandleStyle} />
      <Handle type="source" position={Position.Right} id="right" isConnectable={false} style={hiddenHandleStyle} />
    </div>
  );

  return (
    <div
      style={{
        ...(design2 ? nodeCardD2(colors.assetPlus, darkMode) : nodeCardGlow(colors.assetPlus, darkMode)),
        width: 360,
        minWidth: 360,
        maxWidth: 360,
        whiteSpace: 'normal',
        wordWrap: 'break-word',
        overflowWrap: 'anywhere',
        fontSize: 12.5,
        lineHeight: 1.35,
      }}
    >
      {!design2 && <div style={nodeRibbon(colors.assetPlus)} />}

      {/* Eyebrow */}
      <div style={design2 ? { ...nodeEyebrowD2(colors.assetPlusText, darkMode) } : { ...nodeEyebrowTint(colors.assetPlus, darkMode) }}>
        ASSET PLUS
      </div>

      {/* Title */}
      <div style={{ ...(design2 ? (darkMode ? nodeTitleD2Dark : nodeTitleD2) : (darkMode ? nodeTitleDark : nodeTitle)), marginBottom: 8 }}>
        {titleText}
      </div>

      {/* Key dates */}
      <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: '4px 10px', marginBottom: 8, fontSize: 12 }}>
        <div style={{ fontWeight: 700, color: 'inherit' }}>Start Date</div>
        <div style={{ color: 'inherit' }}>{started}</div>

        <div style={{ fontWeight: 700, color: 'inherit' }}>Signed Date</div>
        <div style={{ color: 'inherit' }}>{signed}</div>
      </div>

      {/* Details dropdown */}
      <div style={{ marginTop: 4 }}>
        <details>
          <summary
            style={{ cursor: 'pointer', fontWeight: 700, color: 'inherit', fontSize: 12 }}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            Details
          </summary>

          <div
            style={{
              marginTop: 8,
              display: 'grid',
              gridTemplateColumns: '120px 1fr',
              gap: '4px 10px',
              fontSize: 12,
            }}
          >
            {orderedKeys.map((k) => {
              const raw = (row[k] ?? '').toString().trim();
              const displayVal = raw || '\u2014';
              const keyLooksDatey = /date|time/i.test(k);
              const formatted = keyLooksDatey ? formatDateLabel(raw) : '';

              return (
                <div key={k} style={{ display: 'contents' }}>
                  <div style={{ fontWeight: 700, color: 'inherit' }}>{k}</div>
                  <div style={{ color: 'inherit' }}>{formatted || displayVal}</div>
                </div>
              );
            })}
          </div>
        </details>
      </div>

      <Handle type="target" position={Position.Top} id="top" isConnectable={false} style={hiddenHandleStyle} />
      <Handle type="source" position={Position.Bottom} id="bottom" isConnectable={false} style={hiddenHandleStyle} />
      <Handle type="target" position={Position.Left} id="left" isConnectable={false} style={hiddenHandleStyle} />
      <Handle type="source" position={Position.Right} id="right" isConnectable={false} style={hiddenHandleStyle} />
    </div>
  );
}

export default memo(AssetPlusNode);
