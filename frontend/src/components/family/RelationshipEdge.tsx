import { memo, useState } from 'react';
import { BaseEdge, getBezierPath, type EdgeProps } from '@xyflow/react';
import type { RelationshipType } from '@family-memories/shared';

interface RelationshipEdgeData {
  relationship_type: RelationshipType;
  start_date: string | null;
  end_date: string | null;
  [key: string]: unknown;
}

const EDGE_COLORS: Record<RelationshipType, string> = {
  parent: '#10b981',
  spouse: '#fb7185',
  sibling: '#38bdf8',
  step_parent: '#6ee7b7',
  adopted_parent: '#a78bfa',
  partner: '#fda4af',
};

const DASHED_TYPES: RelationshipType[] = ['step_parent', 'adopted_parent'];

const LABEL_MAP: Record<RelationshipType, string> = {
  parent: 'Parent',
  spouse: 'Spouse',
  sibling: 'Sibling',
  step_parent: 'Step-Parent',
  adopted_parent: 'Adopted Parent',
  partner: 'Partner',
};

function RelationshipEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
}: EdgeProps) {
  const [hovered, setHovered] = useState(false);
  const edgeData = data as RelationshipEdgeData;
  const relType = edgeData?.relationship_type ?? 'parent';

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  const color = EDGE_COLORS[relType] ?? '#64748b';
  const isDashed = DASHED_TYPES.includes(relType);

  return (
    <g
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Invisible wider path for easier hover targeting */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
      />

      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: color,
          strokeWidth: hovered ? 3 : 2,
          strokeDasharray: isDashed ? '8 4' : undefined,
          filter: hovered ? `drop-shadow(0 0 6px ${color})` : undefined,
          transition: 'stroke-width 0.2s, filter 0.2s',
        }}
      />

      {isDashed && (
        <BaseEdge
          id={`${id}-animated`}
          path={edgePath}
          style={{
            stroke: color,
            strokeWidth: 2,
            strokeDasharray: '8 4',
            strokeDashoffset: 0,
            animation: 'dash-flow 1s linear infinite',
            opacity: 0.5,
          }}
        />
      )}

      {hovered && (
        <g>
          <rect
            x={labelX - 40}
            y={labelY - 12}
            width={80}
            height={24}
            rx={6}
            fill="#1e293b"
            stroke={color}
            strokeWidth={1}
            opacity={0.95}
          />
          <text
            x={labelX}
            y={labelY + 4}
            textAnchor="middle"
            fontSize={11}
            fontWeight={600}
            fill={color}
          >
            {LABEL_MAP[relType] ?? relType}
          </text>
        </g>
      )}
    </g>
  );
}

export const RelationshipEdge = memo(RelationshipEdgeComponent);
