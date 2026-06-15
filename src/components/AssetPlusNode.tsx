import {memo, useState} from 'react'
import {Handle, Position} from '@xyflow/react'
import type {Node, NodeProps} from '@xyflow/react'
import { nodeLabelStyle, nodeValueStyle } from '../styles/nodeStyles.js';
import { useNodeDisplay } from '../contexts/NodeDisplayContext.js';

export type AssetPlusNodeData = {
    row: Record<string, string | undefined>;
}

type AssetPlusNodeType = Node<AssetPlusNodeData, 'assetPlus'>;

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

function AssetPlusNode({data}: NodeProps<AssetPlusNodeType>){
    const { compact } = useNodeDisplay();
    const [expanded, setExpanded] = useState(false);
    const row = data.row || {};

    const startRaw = (row['Start Date'] ?? '').toString().trim();
    const signedRaw = (row['Signed Date'] ?? '').toString().trim();

    const started = formatDateLabel(startRaw) || startRaw || '-';
    const signed = formatDateLabel(signedRaw) || signedRaw || '-';

    const exclude = new Set(['Case Number', 'Start Date', 'Signed Date', 'YOGRs']);
    const keys = Object.keys(row).filter((k) => !exclude.has(k));
    const orderedKeys = keys.sort((a, b) => a.localeCompare(b));

    const border = 'rgb(124, 58, 237)';
    const lightBg = 'rgba(124, 58, 237, 0.15)';
    const yogrs = (row['YOGRs'] ?? '').toString().trim();

    if (compact) return (
      <div style={{ borderRadius: 8, background: '#ffffff', border: `2px solid ${border}`, overflow: 'hidden', width: 180, maxWidth: 180, boxShadow: '0 1px 4px rgba(0,0,0,0.10)' }}>
        <div style={{ background: border, color: '#ffffff', fontWeight: 700, fontSize: 10, padding: '3px 8px', textAlign: 'center', letterSpacing: 0.2 }}>
          Asset Plus
        </div>
        <div style={{ padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: '#000000', whiteSpace: 'normal', wordWrap: 'break-word' }}>{yogrs || 'Assessment'}</span>
          <button
            style={{ background: 'rgba(0,0,0,0.08)', border: 'none', borderRadius: 3, color: '#000', cursor: 'pointer', padding: '1px 3px', fontSize: 9, lineHeight: 1, flexShrink: 0 }}
            onClick={(e) => { e.stopPropagation(); setExpanded(v => !v); }}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >{expanded ? '▲' : '▼'}</button>
        </div>
        {expanded && (
          <div style={{ padding: '0 8px 6px', fontSize: 10, borderTop: '1px solid #f0f0f0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr', gap: '3px 6px', marginTop: 4, marginBottom: 4 }}>
              <div style={{ fontWeight: 700, color: '#000000' }}>Start</div><div>{started}</div>
              <div style={{ fontWeight: 700, color: '#000000' }}>Signed</div><div>{signed}</div>
            </div>
            <details>
              <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: 10 }}
                onMouseDown={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                Details
              </summary>
              <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '3px 6px', marginTop: 4 }}>
                {orderedKeys.map((k) => (
                  <div key={k} style={{ display: 'contents' }}>
                    <div style={{ fontWeight: 700, color: '#000000' }}>{k}</div>
                    <div>{(row[k] ?? '').toString().trim() || '—'}</div>
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

    return(
        <div
            style={{
                borderRadius: 12,
                background: '#ffffff',
                border: `2px solid ${border}`,
                boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
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
                overflow: 'hidden',
                }}
                >

      {/* Header bar */}
      <div style={{
        background: border,
        color: '#ffffff',
        fontWeight: 700,
        fontSize: 13,
        textAlign: 'center',
        padding: '7px 12px',
        letterSpacing: 0.2,
      }}>
        Asset Plus Assessment
      </div>

      {/* Body */}
      <div style={{ padding: '10px 12px' }}>

      {/* Key dates */}
      <div style={{ display: 'grid', gridTemplateColumns: '190px 1fr', gap: '4px 10px', marginBottom: 8 }}>
        <div style={ nodeLabelStyle}>Start Date</div>
        <div style={{...nodeValueStyle, textAlign: 'center'}}>{started}</div>

        <div style={nodeLabelStyle}>Signed Date</div>
        <div style={{...nodeValueStyle, textAlign: 'center'}}>{signed}</div>

        <div style={{ ...nodeLabelStyle}}>YOGRs</div>
        <div
        style={{
            ...nodeValueStyle,
            fontWeight: 600,
            textAlign: 'center',
            fontSize: 14,
            background: 'rgba(168, 85, 247, 0.08)',
            borderRadius: 6,
            padding: '2px 6px'
        }}
        >
        {(row['YOGRs'] ?? '').toString().trim() || '—'}
        </div>
      </div>

      {/* Asset Plus Details dropdown */}
        <div style={{ marginTop: 10 }}>
        <details>
            <summary
            style={{ cursor: 'pointer', fontWeight: 800, color: '#000' }}
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
                gridTemplateColumns: '190px 1fr',
                gap: '4px 10px',
            }}
            >
            {orderedKeys.map((k) => {
                const raw = (row[k] ?? '').toString().trim();
                const displayVal = raw || '—';

                const keyLooksDatey = /date|time/i.test(k);
                const formatted = keyLooksDatey ? formatDateLabel(raw) : '';

                return (
                <div key={k} style={{ display: 'contents' }}>
                    <div style={nodeLabelStyle}>{k}</div>
                    <div style={nodeValueStyle}>{formatted || displayVal}</div>
                </div>
                );
            })}
            </div>
        </details>
        </div>

      </div>{/* end body */}

      <Handle type="target" position={Position.Top} id="top" isConnectable={false} style={hiddenHandleStyle} />
      <Handle type="source" position={Position.Bottom} id="bottom" isConnectable={false} style={hiddenHandleStyle} />
      <Handle type="target" position={Position.Left} id="left" isConnectable={false} style={hiddenHandleStyle} />
      <Handle type="source" position={Position.Right} id="right" isConnectable={false} style={hiddenHandleStyle} />
    </div>
  );
}

export default memo(AssetPlusNode);