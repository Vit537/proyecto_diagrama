import { useCallback } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  type FitViewOptions,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const defaultInitialNodes = [
  { id: '1', position: { x: 0, y: 0 }, data: { label: 'table1' } },
  { id: '2', position: { x: 0, y: 100 }, data: { label: 'table2' } },
];

const defaultInitialEdges = [{ id: 'e1-2', source: '1', target: '2' }];

type FlowProps = {
  initialNodes?: any[];
  initialEdges?: any[];
  nodeTypes?: Record<string, any>;
  fitView?: boolean;
  fitViewOptions?: FitViewOptions;
  style?: React.CSSProperties;
};

export function Flow({
  initialNodes = defaultInitialNodes,
  initialEdges = defaultInitialEdges,
  nodeTypes,
  fitView = false,
  fitViewOptions,
  style,
}: FlowProps) {
  const [nodes, _setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback((params: any) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  return (
    <div style={{ width: '100%', height: '600px', ...(style || {}) }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView={fitView}
        fitViewOptions={fitViewOptions}
      >
        <MiniMap />
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
}