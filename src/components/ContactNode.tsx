import {memo, useState} from 'react'
import {Handle, Position} from '@xyflow/react'
import type {Node, NodeProps} from '@xyflow/react'
import { colors, nodeEyebrowTint, nodeTitle, nodeCardGlow, nodeRibbon, nodeRibbonCompact } from '../styles/designTokens.js';
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

const handles = (
  <>
    <Handle type="target" position={Position.Top} id="top" isConnectable={false} style={hiddenHandleStyle} />
    <Handle type="source" position={Position.Bottom} id="bottom" isConnectable={false} style={hiddenHandleStyle} />
    <Handle type="target" position={Position.Left} id="left" isConnectable={false} style={hiddenHandleStyle} />
    <Handle type="source" position={Position.Right} id="right" isConnectable={false} style={hiddenHandleStyle} />
  </>
);

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

    if (compact) return (
      <div style={{ ...nodeCardGlow(colors.contact), padding: '7px 10px', width: 180, maxWidth: 180, whiteSpace: 'normal', wordWrap: 'break-word' }}>
        <div style={nodeRibbonCompact(colors.contact)} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ flex: 1 }}>
            <div style={{ ...nodeEyebrowTint(colors.contact), fontSize: 9 }}>CONTACT</div>
            <div style={{ ...nodeTitle, fontSize: 11 }}>{titleVal}</div>
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
              <div style={{ fontWeight: 700, color: colors.textPrimary }}>Date</div><div>{contactDate}</div>
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
                    <div style={{ fontWeight: 700, color: colors.textPrimary }}>{k}</div>
                    <div>{(row[k] ?? '').toString().trim() || '\u2014'}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {handles}
      </div>
    );

    return(
      <div style={{ ...nodeCardGlow(colors.contact), width: 360, minWidth: 360, maxWidth: 360, whiteSpace: 'normal', wordWrap: 'break-word', overflowWrap: 'anywhere', fontSize: 12.5, lineHeight: 1.35, color: colors.textPrimary }}>
        <div style={nodeRibbon(colors.contact)} />
        <div style={{ ...nodeEyebrowTint(colors.contact) }}>CONTACT</div>
        <div style={{ ...nodeTitle, marginTop: 2 }}>{titleVal}</div>

        <div style={{ display: 'grid', gridTemplateColumns: '190px 1fr', gap: '4px 10px', marginTop: 8, marginBottom: 8 }}>
          <div style={{ fontWeight: 700, fontSize: 11, color: colors.textPrimary }}>Date</div>
          <div style={{ fontSize: 12, color: colors.textPrimary }}>{contactDate}</div>
        </div>

        <div style={{ marginTop: 8 }}>
          <details>
            <summary
              style={{ cursor: 'pointer', fontWeight: 800, color: colors.textPrimary }}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              {NOTES_FIELD.label}
            </summary>
            <div style={{ marginTop: 4, fontSize: 12, color: colors.textPrimary }}>{notesVal || '\u2014'}</div>
          </details>
        </div>

        {orderedKeys.length > 0 && (
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
        )}
        {handles}
      </div>
    );
}

export default memo(ContactNode);
