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
      <div className="w-full h-full flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-slate-400">Loading family tree...</span>
        </div>
      </div>
    );
  }

  if (graphNodes.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-950">
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
        className="bg-slate-950"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="#334155"
        />
        <Controls
          position="bottom-left"
          className="!bg-slate-800/80 !backdrop-blur-sm !border-slate-700 !rounded-lg !shadow-xl [&>button]:!bg-slate-800 [&>button]:!border-slate-700 [&>button]:!text-slate-300 [&>button:hover]:!bg-slate-700"
        />
        <MiniMap
          position="bottom-right"
          className="!bg-slate-800/50 !border-slate-700 !rounded-lg"
          nodeColor="#f59e0b"
          maskColor="rgba(15, 23, 42, 0.7)"
          pannable
          zoomable
        />
      </ReactFlow>
    </div>
  );
}
