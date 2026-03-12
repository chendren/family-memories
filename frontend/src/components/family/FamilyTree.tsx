import { useCallback, useEffect, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeMouseHandler,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { TreeStructure } from '@phosphor-icons/react';
import { useTree } from '@/hooks/useFamilyMembers';
import { PersonNode } from './PersonNode';
import { RelationshipEdge } from './RelationshipEdge';
import { EmptyState } from '@/components/shared/EmptyState';

const nodeTypes = {
  person: PersonNode,
};

const edgeTypes = {
  relationship: RelationshipEdge,
};

interface FamilyTreeProps {
  onNodeClick?: (memberId: string) => void;
}

export function FamilyTree({ onNodeClick }: FamilyTreeProps) {
  const { data: treeResponse, isLoading } = useTree();

  const treeData = treeResponse?.data;
  const graphNodes = treeData?.nodes ?? [];
  const graphEdges = treeData?.edges ?? [];

  const initialNodes: Node[] = useMemo(
    () =>
      graphNodes.map((gn) => ({
        id: gn.id,
        type: 'person',
        position: gn.position,
        data: gn.data,
        draggable: true,
      })),
    [graphNodes]
  );

  const initialEdges: Edge[] = useMemo(
    () =>
      graphEdges.map((ge) => ({
        id: ge.id,
        source: ge.source,
        target: ge.target,
        type: 'relationship',
        data: ge.data,
        animated: false,
      })),
    [graphEdges]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const handleNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      onNodeClick?.(node.id);
    },
    [onNodeClick]
  );

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-cream-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-terracotta-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-walnut-500 font-body">Loading family tree...</span>
        </div>
      </div>
    );
  }

  if (graphNodes.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-cream-50">
        <EmptyState
          icon={<TreeStructure size={56} weight="duotone" />}
          title="No family members yet"
          message="Add your first family member to start building your tree."
        />
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <style>{`
        @keyframes dash-flow {
          to { stroke-dashoffset: -12; }
        }
        .react-flow__attribution { display: none; }
      `}</style>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.1}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        className="bg-cream-50"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="#D4C5B0"
        />
        <Controls
          position="bottom-left"
          className="!bg-white/80 !backdrop-blur-sm !border-sand-200 !rounded-lg !shadow-card [&>button]:!bg-white [&>button]:!border-sand-200 [&>button]:!text-walnut-600 [&>button:hover]:!bg-cream-200"
        />
        <MiniMap
          position="bottom-right"
          className="!bg-white/50 !border-sand-200 !rounded-lg"
          nodeColor="#E07A5F"
          maskColor="rgba(253, 248, 243, 0.7)"
          pannable
          zoomable
        />
      </ReactFlow>
    </div>
  );
}
