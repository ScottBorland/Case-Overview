import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { Node, NodeProps } from '@xyflow/react';
import { colors, nodeEyebrowTint, nodeTitle, nodeCardGlow, nodeRibbon, nodeRibbonCompact } from '../styles/designTokens.js';
import { useNodeDisplay } from '../contexts/NodeDisplayContext.js';

export type CraStartNodeData = {
  row: Record<string, string | undefined>;
};

type CraStartNodeType = Node<CraStartNodeData, 'craStart'>;

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

const handles = (
  <>
    <Handle type="target" position={Position.Top} id="top" isConnectable={false} style={hiddenHandleStyle} />
    <Handle type="source" position={Position.Bottom} id="bottom" isConnectable={false} style={hiddenHandleStyle} />
    <Handle type="target" position={Position.Left} id="left" isConnectable={false} style={hiddenHandleStyle} />
    <Handle type="source" position={Position.Right} id="right" isConnectable={false} style={hiddenHandleStyle} />
  </>
);

function CraStartNode({ data }: NodeProps<CraStartNodeType>) {
  const { compact } = useNodeDisplay();
  const row = data.row || {};

  const startedRaw = (row['Start Date'] ?? '').toString().trim();
  const started = formatDateLabel(startedRaw) || startedRaw || '—';

  if (compact) return (
    <div style={{
      ...nodeCardGlow(colors.cra),
      padding: '7px 10px',
      width: 180,
      maxWidth: 180,
      whiteSpace: 'normal',
      wordWrap: 'break-word',
    }}>
      <div style={nodeRibbonCompact(colors.cra)} />
      <div style={{ ...nodeEyebrowTint(colors.cra), fontSize: 9 }}>ROTH ASSESSMENT STARTED</div>
      <div style={{ fontSize: 10, marginTop: 3, color: colors.textPrimary }}>
        <span style={{ fontWeight: 700 }}>Started: </span>{started}
      </div>
      {handles}
    </div>
  );

  return (
    <div style={{
      ...nodeCardGlow(colors.cra),
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
      <div style={nodeRibbon(colors.cra)} />

      <div style={{ ...nodeEyebrowTint(colors.cra) }}>ROTH ASSESSMENT STARTED</div>

      <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '4px 10px', marginTop: 6, fontSize: 12 }}>
        <div style={{ fontWeight: 700, color: colors.textPrimary }}>Start Date</div>
        <div style={{ color: colors.textPrimary }}>{started}</div>
      </div>

      {handles}
    </div>
  );
}

export default memo(CraStartNode);
