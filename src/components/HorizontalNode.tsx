import { memo } from 'react';
import { Background, Handle, Position } from '@xyflow/react';
import type { Node, NodeProps } from '@xyflow/react';

export type HorizontalNodeData = {
  decisionType: string;
  outcome: string;
 };
type HorizontalNodeType = Node<HorizontalNodeData, 'horizontal'>;

const hiddenHandleStyle: React.CSSProperties = {
  opacity: 0,
  width: 0,
  height: 0,
  pointerEvents: 'all', // no mouse interactions
};

function HorizontalNode({ data }: NodeProps<HorizontalNodeType>) {

  let background = '#F7F7F7'; // default grey
  let border = '#0b132b';
  let color = '#0b132b';

  if (data.decisionType?.toLowerCase() === 'prevention') {
    background = 'rgba(158, 60, 187, 1)';  // purple
    border = 'rgb(45, 41, 75)';       // darker border variant
    color = 'white';
  } else if(data.decisionType?.toLowerCase() === 'relief') {
    background = 'rgb(236, 122, 8)';
    color = 'black'
  } else if (data.decisionType == 'No application taken, general advice provided') {
    background = 'white';  // purple
    border = 'rgb(30, 157, 139)';       // darker border variant
    color = 'black';
  } else if (data.decisionType == 's.195(8)(a) The customer now has suitable accommodation where there is a reasonable prospect of it being available for 6 months'){
    background = 'white';
    border = 'rgb(105, 190, 40)';
    color = 'black';
  }

  return (
    <div
      style={{
        padding: '10px 12px',
        borderRadius: 10,
        background,
        border: `1px solid ${border}`,
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        minWidth: 220,
        maxWidth: 280,
        whiteSpace: 'normal',
        wordWrap: 'break-word',
        overflowWrap: 'anywhere',
        fontSize: 13,
        lineHeight: 1.35,
        position: 'relative',
        color
      }}
    >
      <div style={{ fontWeight: 'bold', marginBottom: 4, textAlign: 'center' }}>
        {data.decisionType}
      </div>
      <div style={{textAlign: 'center'}}>{data.outcome}</div>


      {/* vertical chain handles (used by your vertical edges) */}
      <Handle type="target" position={Position.Top} id="top" isConnectable={false} style={hiddenHandleStyle} />
      <Handle type="source" position={Position.Bottom} id="bottom" isConnectable={false} style={hiddenHandleStyle} />

      {/* horizontal transition handles (used by your cross-date edges) */}
      <Handle type="target" position={Position.Left} id="left" isConnectable={false} style={hiddenHandleStyle} />
      <Handle type="source" position={Position.Right} id="right" isConnectable={false} style={hiddenHandleStyle} />

    </div>
  );
}

export default memo(HorizontalNode);


