import {memo, useState} from 'react'
import {Handle, Position} from '@xyflow/react'
import type {Node, NodeProps} from '@xyflow/react'
import { nodeLabelStyle, nodeValueStyle } from '../styles/nodeStyles.js';
import { useNodeDisplay } from '../contexts/NodeDisplayContext.js';

export type ContactNodeData = {
    row: Record<string, string | undefined>;
}

type ContactNodeType = Node<ContactNodeData, 'contact'>;

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

const NOTES_FIELD = { key: 'notes', label: 'Notes' };

function ContactNode({data}: NodeProps<ContactNodeType>){
    const { compact } = useNodeDisplay();
    const [expanded, setExpanded] = useState(false);
    const row = data.row || {};

    const contactDateRaw = (row['contact_date'] ?? '').toString().trim();
    const contactDate = formatDateLabel(contactDateRaw) || contactDateRaw || '-';

    // Title: any available title-like field, or fall back to 'Contact'
    const titleFields = ['title', 'Title', 'contact_type', 'Contact Type', 'type', 'Type'];
    const titleVal = titleFields.map(f => (row[f] ?? '').toString().trim()).find(v => v) || 'Contact';

    const exclude = new Set(['Case Number', 'contact_date', NOTES_FIELD.key, 'address_id', 'agency']);
    const orderedKeys = Object.keys(row)
      .filter((k) => !exclude.has(k))
      .sort((a, b) => a.localeCompare(b));

    const notesVal = (row[NOTES_FIELD.key] ?? '').toString().trim();

    const border = 'rgb(16, 185, 129)';

    if (compact) return (
      <div style={{ borderRadius: 8, background: '#ffffff', border: `2px solid ${border}`, overflow: 'hidden', width: 180, maxWidth: 180, boxShadow: '0 1px 4px rgba(0,0,0,0.10)' }}>
        <div style={{ background: border, color: '#ffffff', fontWeight: 700, fontSize: 10, padding: '3px 8px', textAlign: 'center', letterSpacing: 0.2 }}>
          Contact
        </div>
        <div style={{ padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: '#000000', whiteSpace: 'normal', wordWrap: 'break-word' }}>{titleVal}</span>
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
              <div style={{ fontWeight: 700, color: '#000000' }}>Date</div><div>{contactDate}</div>
            </div>
            {notesVal && (
              <details>
                <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: 10 }}
                  onMouseDown={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                  {NOTES_FIELD.label}
                </summary>
                <div style={{ marginTop: 2, fontSize: 9 }}>{notesVal}</div>
              </details>
            )}
            {orderedKeys.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '3px 6px', marginTop: 4 }}>
                {orderedKeys.map((k) => (
                  <div key={k} style={{ display: 'contents' }}>
                    <div style={{ fontWeight: 700, color: '#000000' }}>{k}</div>
                    <div>{(row[k] ?? '').toString().trim() || '—'}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        <Handle type="target" position={Position.Top} id="top" isConnectable={false} style={hiddenHandleStyle} />
        <Handle type="source" position={Position.Bottom} id="bottom" isConnectable={false} style={hiddenHandleStyle} />
        <Handle type="target" position={Position.Left} id="left" isConnectable={false} style={hiddenHandleStyle} />
        <Handle type="source" position={Position.Right} id="right" isConnectable={false} style={hiddenHandleStyle} />
      </div>
    );

    return(
        <div style={{
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
                }}>

      <div style={{
        background: border,
        color: '#ffffff',
        fontWeight: 700,
        fontSize: 13,
        textAlign: 'center',
        padding: '7px 12px',
        letterSpacing: 0.2,
      }}>
        Contact
      </div>

      <div style={{ padding: '10px 12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '190px 1fr', gap: '4px 10px', marginBottom: 8 }}>
          <div style={nodeLabelStyle}>Date</div>
          <div style={{...nodeValueStyle, textAlign: 'center'}}>{contactDate}</div>
        </div>

        <div style={{ marginTop: 8 }}>
          <details>
            <summary
              style={{ cursor: 'pointer', fontWeight: 800, color: '#000' }}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              {NOTES_FIELD.label}
            </summary>
            <div style={{ marginTop: 4, fontSize: 12, color: '#111' }}>{notesVal || '—'}</div>
          </details>
        </div>

        {orderedKeys.length > 0 && (
          <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: '190px 1fr', gap: '4px 10px' }}>
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
        )}
      </div>

      <Handle type="target" position={Position.Top} id="top" isConnectable={false} style={hiddenHandleStyle} />
      <Handle type="source" position={Position.Bottom} id="bottom" isConnectable={false} style={hiddenHandleStyle} />
      <Handle type="target" position={Position.Left} id="left" isConnectable={false} style={hiddenHandleStyle} />
      <Handle type="source" position={Position.Right} id="right" isConnectable={false} style={hiddenHandleStyle} />
    </div>
  );
}

export default memo(ContactNode);
