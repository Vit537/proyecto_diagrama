import React, { useState, useCallback, useRef } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  Controls,
  Background,
  type Node,
  type Edge,
  type Connection,
  ReactFlowProvider,
  ConnectionLineType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// Context
import { ThemeProvider } from '@/contexts/theme-context';

// Components
import UMLClassNode from '@/components/uml-class-node';
import UMLEdge from '@/components/uml-edge';
import OrthogonalUMLEdge from '@/components/orthogonal-uml-edge';
import ManyToManyEdge from '@/components/many-to-many-edge';
import ImprovedUMLClassNode from '@/components/improved-uml-class-node';
import ImprovedUMLEdge from '@/components/improved-uml-edge';
import { UMLMarkers } from '@/components/uml-markers';
import { UMLToolPanel } from '@/components/uml-tool-panel';
import { UMLClassEditor } from '@/components/uml-class-editor';
import { MultiplicityEditor } from '@/components/multiplicity-editor';
import { UMLToolbar } from '@/components/uml-toolbar';

// Types
import type { UMLClassData, UMLEdgeData, RelationType } from '@/types/uml';

// Node and edge types
const nodeTypes = {
  umlClass: UMLClassNode,
  improvedUMLClass: (props: any) => <ImprovedUMLClassNode {...props} onClick={(id: string) => console.log('Clicked node:', id)} />,
};

const edgeTypes = {
  umlEdge: UMLEdge,
  orthogonalEdge: OrthogonalUMLEdge,
  manyToManyEdge: ManyToManyEdge,
  improvedUMLEdge: ImprovedUMLEdge,
};

// Initial nodes and edges - empty canvas
const initialNodes: Node[] = [];

const initialEdges: Edge[] = [];

export const UMLEditor: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedTool, setSelectedTool] = useState<string>('select');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [isClassEditorOpen, setIsClassEditorOpen] = useState(false);
  const [isMultiplicityEditorOpen, setIsMultiplicityEditorOpen] = useState(false);
  const [selectedNodes, setSelectedNodes] = useState<Node[]>([]);
  const [selectedEdges, setSelectedEdges] = useState<Edge[]>([]);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  // Handle keyboard events for deletion
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Delete') {
    // if (event.key === 'Delete' || event.key === 'Backspace') {
      // Delete selected nodes
      if (selectedNodes.length > 0) {
        const nodeIdsToDelete = selectedNodes.map(node => node.id);
        setNodes(nodes => nodes.filter(node => !nodeIdsToDelete.includes(node.id)));
        setEdges(edges => edges.filter(edge => 
          !nodeIdsToDelete.includes(edge.source) && !nodeIdsToDelete.includes(edge.target)
        ));
        setSelectedNodes([]);
      }
      
      // Delete selected edges
      if (selectedEdges.length > 0) {
        const edgeIdsToDelete = selectedEdges.map(edge => edge.id);
        setEdges(edges => edges.filter(edge => !edgeIdsToDelete.includes(edge.id)));
        setSelectedEdges([]);
      }
    }
  }, [selectedNodes, selectedEdges, setNodes, setEdges]);

  // Add event listener for keyboard events
  React.useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Handle selection changes
  const onSelectionChange = useCallback(({ nodes, edges }: { nodes: Node[], edges: Edge[] }) => {
    setSelectedNodes(nodes);
    setSelectedEdges(edges);
  }, []);

  // Handle node click
  const handleNodeClick = useCallback((nodeId: string) => {
    if (selectedTool === 'select') {
      setSelectedNodeId(nodeId);
      setIsClassEditorOpen(true);
    }
  }, [selectedTool]);

  // Handle edge click
  const handleEdgeClick = useCallback((edge: Edge) => {
    if (selectedTool === 'select') {
      setSelectedEdgeId(edge.id);
      setIsMultiplicityEditorOpen(true);
    }
  }, [selectedTool]);



  // Handle connection
  const onConnect = useCallback(
    (params: Connection) => {
      if (selectedTool !== 'select' && selectedTool !== 'class') {
        if (selectedTool === 'many-to-many') {
          // Create intermediate table for many-to-many relationship
          const sourceNode = nodes.find(n => n.id === params.source);
          const targetNode = nodes.find(n => n.id === params.target);
          
          if (sourceNode && targetNode) {
            const intermediateTableId = `intermediate-${params.source}-${params.target}-${Date.now()}`;
            const sourceData = sourceNode.data as UMLClassData;
            const targetData = targetNode.data as UMLClassData;
            
            // Create intermediate table
            const intermediateTable: Node = {
              id: intermediateTableId,
              type: 'improvedUMLClass',
              position: { 
                x: (sourceNode.position.x + targetNode.position.x) / 2, 
                y: (sourceNode.position.y + targetNode.position.y) / 2 - 80 
              },
              data: {
                className: `${sourceData.className}_${targetData.className}`,
                attributes: [
                  { name: `${sourceData.className.toLowerCase()}Id`, type: 'String', visibility: 'private' },
                  { name: `${targetData.className.toLowerCase()}Id`, type: 'String', visibility: 'private' },
                ],
                methods: [],
              } as UMLClassData,
            };
            
            setNodes(nds => [...nds, intermediateTable]);
            
            // Create main many-to-many edge with segmented line to intermediate table
            const manyToManyEdge = {
              id: `many-to-many-${params.source}-${params.target}-${Date.now()}`,
              source: params.source!,
              target: params.target!,
              type: 'manyToManyEdge',
              data: {
                relationType: 'many-to-many' as RelationType,
                sourceLabel: '*',
                targetLabel: '*',
                label: 'many-to-many',
                intermediateTableId: intermediateTableId,
                intermediateTablePosition: {
                  x: (sourceNode.position.x + targetNode.position.x) / 2,
                  y: (sourceNode.position.y + targetNode.position.y) / 2 - 80
                }
              } as UMLEdgeData & { 
                sourceLabel: string; 
                targetLabel: string; 
                intermediateTablePosition: { x: number; y: number };
                intermediateTableId: string;
              },
            };
            
            setEdges((eds) => [...eds, manyToManyEdge]);
          }
        } else {
          const newEdge = {
            ...params,
            type: 'improvedUMLEdge',
            data: {
              relationship: selectedTool as 'association' | 'inheritance' | 'composition' | 'aggregation' | 'dependency',
              sourceMultiplicity: selectedTool === 'association' ? '1' : undefined,
              targetMultiplicity: selectedTool === 'association' ? '1' : undefined,
              isReconnectable: true,
            },
          };
          setEdges((eds) => addEdge(newEdge, eds));
        }
        setSelectedTool('select');
      }
    },
    [selectedTool, setEdges, nodes, setNodes]
  );

  // Add new class
  const handleAddClass = useCallback(() => {
    const newNode: Node = {
      id: `class-${Date.now()}`,
      type: 'improvedUMLClass',
      position: { x: Math.random() * 300 + 100, y: Math.random() * 300 + 100 },
      data: {
        className: 'NewClass',
        attributes: [],
        methods: [],
      } as UMLClassData,
    };
    setNodes((nds) => [...nds, newNode]);
    setSelectedTool('select');
  }, [setNodes]);

  // Save class data
  const handleSaveClass = useCallback((classData: UMLClassData) => {
    if (selectedNodeId) {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === selectedNodeId ? { ...node, data: classData } : node
        )
      );
    }
    setSelectedNodeId(null);
  }, [selectedNodeId, setNodes]);

  // Save edge data
  const handleSaveEdge = useCallback((edgeData: UMLEdgeData) => {
    if (selectedEdgeId) {
      setEdges((eds) =>
        eds.map((edge) =>
          edge.id === selectedEdgeId ? { ...edge, data: edgeData } : edge
        )
      );
    }
    setSelectedEdgeId(null);
  }, [selectedEdgeId, setEdges]);

  // Save diagram
  const handleSave = useCallback(() => {
    const diagramData = {
      nodes,
      edges,
      timestamp: new Date().toISOString(),
    };
    
    const dataStr = JSON.stringify(diagramData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `uml-diagram-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  }, [nodes, edges]);

  // Load diagram
  const handleLoad = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const diagramData = JSON.parse(e.target?.result as string);
            if (diagramData.nodes && diagramData.edges) {
              setNodes(diagramData.nodes);
              setEdges(diagramData.edges);
            }
          } catch (error) {
            alert('Error loading file. Please ensure it\'s a valid UML diagram file.');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }, [setNodes, setEdges]);

  const selectedNode = selectedNodeId ? nodes.find(n => n.id === selectedNodeId) : null;
  const selectedEdge = selectedEdgeId ? edges.find(e => e.id === selectedEdgeId) : null;

  return (
    <div className="h-screen flex flex-col">
      <UMLToolbar onSave={handleSave} onLoad={handleLoad} />
      
      <div className="flex-1 flex">
        <UMLToolPanel
          selectedTool={selectedTool}
          onToolSelect={setSelectedTool}
          onAddClass={handleAddClass}
        />
        
        <div className="flex-1" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_, node) => handleNodeClick(node.id)}
            onEdgeClick={(_, edge) => handleEdgeClick(edge)}
            onSelectionChange={onSelectionChange}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            multiSelectionKeyCode="Shift"
            deleteKeyCode="Delete"
            className={`bg-gray-50 dark:bg-gray-900 ${selectedEdges.length > 0 ? 'selecting-edge' : ''}`}
            connectionLineType={ConnectionLineType.Bezier}
            snapGrid={[15, 15]}
            snapToGrid={true}
            edgesReconnectable={true}
            reconnectRadius={20}
            panOnDrag={selectedEdges.length === 0}
            selectionOnDrag={false}
          >
            <Controls />
            <Background color="#aaa" className="dark:opacity-20" />
            <svg style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
              <UMLMarkers />
            </svg>
          </ReactFlow>
        </div>
      </div>

      {/* Class Editor Modal */}
      {selectedNode && (
        <UMLClassEditor
          isOpen={isClassEditorOpen}
          onClose={() => {
            setIsClassEditorOpen(false);
            setSelectedNodeId(null);
          }}
          classData={selectedNode.data as UMLClassData}
          onSave={handleSaveClass}
        />
      )}

      {/* Multiplicity Editor Modal */}
      {selectedEdge && (
        <MultiplicityEditor
          isOpen={isMultiplicityEditorOpen}
          onClose={() => {
            setIsMultiplicityEditorOpen(false);
            setSelectedEdgeId(null);
          }}
          edgeData={selectedEdge.data as UMLEdgeData}
          onSave={handleSaveEdge}
        />
      )}
    </div>
  );
};

const UMLEditorWithProvider: React.FC = () => (
  <ThemeProvider>
    <ReactFlowProvider>
      <UMLEditor />
    </ReactFlowProvider>
  </ThemeProvider>
);

export default UMLEditorWithProvider;