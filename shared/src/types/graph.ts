import type { FamilyMember, RelationshipType } from './family.js';

export interface GraphNode {
  id: string;
  data: {
    member: FamilyMember;
    memoryCount: number;
  };
  position: { x: number; y: number };
  type: 'person';
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  data: {
    relationship_type: RelationshipType;
    start_date: string | null;
    end_date: string | null;
  };
  type: 'relationship';
}

export interface TreeData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface TreeLayout {
  width: number;
  height: number;
  nodePositions: Record<string, { x: number; y: number }>;
}
