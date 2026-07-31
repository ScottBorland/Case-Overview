import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { Node, NodeProps } from '@xyflow/react';
import { useNodeDisplay } from '../contexts/NodeDisplayContext.js';
import { colors, font, radius } from '../styles/designTokens.js';

export type DateHeaderData = {
  label: string;
  originalY?: number;
  categoryColors?: string[];
};
type DateHeaderNodeType = Node<DateHeaderData, 'dateHeader'>;

const hidden: React.CSSProperties = {
  opacity: 0,
  width: 0,
  height: 0,
  pointerEvents: 'none',
};

function DateHeaderNode({ data }: NodeProps<DateHeaderNodeType>) {
  const { compact } = useNodeDisplay();
  const label = (data.label ?? '').trim();
  const catColors = (data as any).categoryColors as string[] | undefined;

  // "Ongoing" column
  if (label.toLowerCase().includes('ongoing')) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div
          style={{
            position: 'relative',
            padding: compact ? '4px 12px' : '6px 14px',
            ...(compact ? { width: '100%', boxSizing: 'border-box' as const } : {}),
            borderRadius: radius.fullPill,
            background: colors.datePillBg,
            color: colors.datePillText,
            fontWeight: 600,
            fontSize: compact ? 11 : 12.5,
            fontFamily: font.family,
            textAlign: 'center',
            minWidth: compact ? 100 : 120,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}
        >
          {label.replace(/📍\s*/, '') || 'Ongoing'}
        </div>
        {/* Category dashes */}
        {catColors && catColors.length > 0 && (
          <div style={{ display: 'flex', gap: 3, marginTop: 3 }}>
            {catColors.map((c, i) => (
              <div key={i} style={{ width: 3, height: compact ? 10 : 14, background: c, borderRadius: 1 }} />
            ))}
          </div>
        )}
        <Handle type="target" position={Position.Left} id="left" isConnectable={false} style={hidden} />
        <Handle type="source" position={Position.Right} id="right" isConnectable={false} style={hidden} />
        <Handle type="target" position={Position.Top} id="top" isConnectable={false} style={hidden} />
        <Handle type="source" position={Position.Bottom} id="bottom" isConnectable={false} style={hidden} />
      </div>
    );
  }

  // Date formatting
  const raw = label.replace('📅 ', '').trim();
  const clean = raw.endsWith(' 00:00:00') ? raw.slice(0, 10) : raw;

  let display = '';
  if (clean && clean !== 'NaT' && clean !== 'Unknown') {
    const d = new Date(clean);
    if (!isNaN(d.getTime())) {
      display = new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(d);
    }
  }

  const textToShow = display || label || '(no label)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div
        style={{
          padding: compact ? '4px 12px' : '6px 14px',
          borderRadius: radius.fullPill,
          background: colors.datePillBg,
          fontWeight: 700,
          fontSize: compact ? 11 : 12.5,
          fontFamily: font.family,
          color: colors.datePillText,
          whiteSpace: 'nowrap',
          textAlign: 'center',
          ...(compact ? { width: '100%', boxSizing: 'border-box' as const } : {}),
        }}
      >
        {textToShow}
      </div>
      {/* Category dashes */}
      {catColors && catColors.length > 0 && (
        <div style={{ display: 'flex', gap: 3, marginTop: 3 }}>
          {catColors.map((c, i) => (
            <div key={i} style={{ width: 3, height: compact ? 10 : 14, background: c, borderRadius: 1 }} />
          ))}
        </div>
      )}
      <Handle type="target" position={Position.Left} id="left" isConnectable={false} style={hidden} />
      <Handle type="source" position={Position.Right} id="right" isConnectable={false} style={hidden} />
      <Handle type="target" position={Position.Top} id="top" isConnectable={false} style={hidden} />
      <Handle type="source" position={Position.Bottom} id="bottom" isConnectable={false} style={hidden} />
    </div>
  );
}

export default memo(DateHeaderNode);
