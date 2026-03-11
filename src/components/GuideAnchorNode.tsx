import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { Node, NodeProps } from '@xyflow/react';

export type GuideAnchorData = {};
type GuideAnchorNodeType = Node<GuideAnchorData, 'guideAnchor'>;

const hiddenStyle: React.CSSProperties = {
  opacity: 0,
  width: 1,
  height: 1,
  pointerEvents: 'none',
};

function GuideAnchorNode({}: NodeProps<GuideAnchorNodeType>) {
  return (
    <div style={hiddenStyle}>
      <Handle type="target" position={Position.Left} id="left" isConnectable={false} style={hiddenStyle} />
        <Handle type="source" position={Position.Right} id="right" isConnectable={false} style={hiddenStyle} />
        <Handle type="target" position={Position.Top} id="top" isConnectable={false} style={hiddenStyle} />
        <Handle type="source" position={Position.Bottom} id="bottom" isConnectable={false} style={hiddenStyle} />
    </div>
  );
}

export default memo(GuideAnchorNode);