// src/components/VerticalGuideEdge.tsx
// Always draws a perfectly vertical dotted line from the source handle downward,
// ignoring any horizontal offset between source and target.
import type { EdgeProps } from '@xyflow/react';

export default function VerticalGuideEdge({ sourceX, sourceY, targetY, style }: EdgeProps) {
  const d = `M ${sourceX} ${sourceY} L ${sourceX} ${targetY}`;
  return (
    <path
      d={d}
      fill="none"
      style={style}
    />
  );
}
