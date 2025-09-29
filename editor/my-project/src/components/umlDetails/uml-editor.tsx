import React, { useState, useCallback, useRef, useEffect } from "react";
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
} from "@xyflow/react";
import { useParams } from "react-router-dom";
import { Box, CircularProgress, Typography, Alert } from "@mui/material";
import "@xyflow/react/dist/style.css";

// Context
import { ThemeProvider } from "@/contexts/theme-context";

// Components
import UMLClassNode from "@/components/umlDetails/uml-class-node";
import UMLEdge from "@/components/umlDetails/uml-edge";
import OrthogonalUMLEdge from "@/components/orthogonal-uml-edge";
import ManyToManyEdge from "@/components/many-to-many-edge";
import ImprovedUMLClassNode from "./improved-uml-class-node";
import ImprovedUMLEdge from "./improved-uml-edge";
import { UMLMarkers } from "@/components/umlDetails/uml-markers";
import { UMLToolPanel } from "@/components/umlDetails/uml-tool-panel";
import { UMLClassEditor } from "@/components/umlDetails/uml-class-editor";
import { MultiplicityEditor } from "@/components/multiplicity-editor";
import { UMLToolbar } from "@/components/umlDetails/uml-toolbar";

// Types
import type { UMLClassData, UMLEdgeData, RelationType } from "@/types/uml";
import type { Diagram } from "@/types";
import MainLayout from "../Layout/MainLayout";
import { 
  diagramsAPI, 
  diagramElementsAPI, 
  relationshipsAPI,
  attributesAPI,
  methodsAPI
} from "@/services/api";
import { toast } from "react-toastify";

// Node and edge types
const nodeTypes = {
  umlClass: UMLClassNode,
  improvedUMLClass: (props: any) => (
    <ImprovedUMLClassNode
      {...props}
      onClick={(id: string) => console.log("Clicked node:", id)}
    />
  ),
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
  const { diagramId } = useParams<{ diagramId: string }>();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedTool, setSelectedTool] = useState<string>("select");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [isClassEditorOpen, setIsClassEditorOpen] = useState(false);
  const [isMultiplicityEditorOpen, setIsMultiplicityEditorOpen] =
    useState(false);
  const [selectedNodes, setSelectedNodes] = useState<Node[]>([]);
  const [selectedEdges, setSelectedEdges] = useState<Edge[]>([]);
  const [diagram, setDiagram] = useState<Diagram | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  // Load diagram data when diagramId changes
  useEffect(() => {
    const loadDiagram = async () => {
      if (!diagramId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Obtener datos del diagrama
        const response = await diagramsAPI.get(diagramId);
        setDiagram(response);
        
        // Cargar canvas_data si existe
        if (response.canvas_data && response.canvas_data.nodes && response.canvas_data.edges) {
          setNodes(response.canvas_data.nodes || []);
          setEdges(response.canvas_data.edges || []);
        }
        
        toast.success(`Diagrama "${response.name}" cargado correctamente`);
      } catch (error) {
        console.error('Error loading diagram:', error);
        setError('Error al cargar el diagrama');
        toast.error('Error al cargar el diagrama');
      } finally {
        setLoading(false);
      }
    };

    loadDiagram();
  }, [diagramId, setNodes, setEdges]);

  // Handle keyboard events for deletion
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Delete") {
        // if (event.key === 'Delete' || event.key === 'Backspace') {
        // Delete selected nodes
        if (selectedNodes.length > 0) {
          const nodeIdsToDelete = selectedNodes.map((node) => node.id);
          setNodes((nodes) =>
            nodes.filter((node) => !nodeIdsToDelete.includes(node.id))
          );
          setEdges((edges) =>
            edges.filter(
              (edge) =>
                !nodeIdsToDelete.includes(edge.source) &&
                !nodeIdsToDelete.includes(edge.target)
            )
          );
          setSelectedNodes([]);
        }

        // Delete selected edges
        if (selectedEdges.length > 0) {
          const edgeIdsToDelete = selectedEdges.map((edge) => edge.id);
          setEdges((edges) =>
            edges.filter((edge) => !edgeIdsToDelete.includes(edge.id))
          );
          setSelectedEdges([]);
        }
      }
    },
    [selectedNodes, selectedEdges, setNodes, setEdges]
  );

  // Add event listener for keyboard events
  React.useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  // Handle selection changes
  const onSelectionChange = useCallback(
    ({ nodes, edges }: { nodes: Node[]; edges: Edge[] }) => {
      setSelectedNodes(nodes);
      setSelectedEdges(edges);
    },
    []
  );

  // Handle node click
  const handleNodeClick = useCallback(
    (nodeId: string) => {
      if (selectedTool === "select") {
        setSelectedNodeId(nodeId);
        setIsClassEditorOpen(true);
      }
    },
    [selectedTool]
  );

  // Handle edge click
  const handleEdgeClick = useCallback(
    (edge: Edge) => {
      if (selectedTool === "select") {
        setSelectedEdgeId(edge.id);
        setIsMultiplicityEditorOpen(true);
      }
    },
    [selectedTool]
  );

  // Handle connection
  const onConnect = useCallback(
    (params: Connection) => {
      if (selectedTool !== "select" && selectedTool !== "class") {
        if (selectedTool === "many-to-many") {
          // Create intermediate table for many-to-many relationship
          const sourceNode = nodes.find((n) => n.id === params.source);
          const targetNode = nodes.find((n) => n.id === params.target);

          if (sourceNode && targetNode) {
            const intermediateTableId = `intermediate-${params.source}-${
              params.target
            }-${Date.now()}`;
            const sourceData = sourceNode.data as UMLClassData;
            const targetData = targetNode.data as UMLClassData;

            // Create intermediate table
            const intermediateTable: Node = {
              id: intermediateTableId,
              type: "improvedUMLClass",
              position: {
                x: (sourceNode.position.x + targetNode.position.x) / 2,
                y: (sourceNode.position.y + targetNode.position.y) / 2 - 80,
              },
              data: {
                className: `${sourceData.className}_${targetData.className}`,
                attributes: [
                  {
                    name: `${sourceData.className.toLowerCase()}Id`,
                    type: "String",
                    visibility: "private",
                  },
                  {
                    name: `${targetData.className.toLowerCase()}Id`,
                    type: "String",
                    visibility: "private",
                  },
                ],
                methods: [],
              } as UMLClassData,
            };

            setNodes((nds) => [...nds, intermediateTable]);

            // Create main many-to-many edge with segmented line to intermediate table
            const manyToManyEdge = {
              id: `many-to-many-${params.source}-${
                params.target
              }-${Date.now()}`,
              source: params.source!,
              target: params.target!,
              type: "manyToManyEdge",
              data: {
                relationType: "many-to-many" as RelationType,
                sourceLabel: "*",
                targetLabel: "*",
                label: "many-to-many",
                intermediateTableId: intermediateTableId,
                intermediateTablePosition: {
                  x: (sourceNode.position.x + targetNode.position.x) / 2,
                  y: (sourceNode.position.y + targetNode.position.y) / 2 - 80,
                },
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
            type: "improvedUMLEdge",
            data: {
              relationship: selectedTool as
                | "association"
                | "inheritance"
                | "composition"
                | "aggregation"
                | "dependency",
              sourceMultiplicity:
                selectedTool === "association" ? "1" : undefined,
              targetMultiplicity:
                selectedTool === "association" ? "1" : undefined,
              isReconnectable: true,
            },
          };
          setEdges((eds) => addEdge(newEdge, eds));
        }
        setSelectedTool("select");
      }
    },
    [selectedTool, setEdges, nodes, setNodes]
  );

  // Add new class
  const handleAddClass = useCallback(() => {
    const newNode: Node = {
      id: `class-${Date.now()}`,
      type: "improvedUMLClass",
      position: { x: Math.random() * 300 + 100, y: Math.random() * 300 + 100 },
      data: {
        className: "NewClass",
        attributes: [],
        methods: [],
      } as UMLClassData,
    };
    setNodes((nds) => [...nds, newNode]);
    setSelectedTool("select");
  }, [setNodes]);

  // Save class data
  const handleSaveClass = useCallback(
    (classData: UMLClassData) => {
      if (selectedNodeId) {
        setNodes((nds) =>
          nds.map((node) =>
            node.id === selectedNodeId ? { ...node, data: classData } : node
          )
        );
      }
      setSelectedNodeId(null);
    },
    [selectedNodeId, setNodes]
  );

  // Save edge data
  const handleSaveEdge = useCallback(
    (edgeData: UMLEdgeData) => {
      if (selectedEdgeId) {
        setEdges((eds) =>
          eds.map((edge) =>
            edge.id === selectedEdgeId ? { ...edge, data: edgeData } : edge
          )
        );
      }
      setSelectedEdgeId(null);
    },
    [selectedEdgeId, setEdges]
  );

  // Save diagram to JSON file
  const handleSave = useCallback(() => {
    const diagramData = {
      nodes,
      edges,
      timestamp: new Date().toISOString(),
    };

    const dataStr = JSON.stringify(diagramData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `uml-diagram-${
      new Date().toISOString().split("T")[0]
    }.json`;
    link.click();

    URL.revokeObjectURL(url);
  }, [nodes, edges]);

  // Save diagram to database
  const handleSaveToDatabase = useCallback(async () => {
    if (!diagram || !diagramId) {
      toast.error('No hay diagrama para guardar');
      return;
    }

    try {
      setLoading(true);
      
      // 1. Actualizar el diagrama con canvas_data
      const diagramData = {
        nodes,
        edges,
        timestamp: new Date().toISOString(),
      };

      await diagramsAPI.update(diagramId, {
        canvas_data: diagramData,
      });

      // 2. Guardar elementos del diagrama
      const savedElements = new Map(); // Para mapear IDs de ReactFlow con IDs de BD
      
      for (const node of nodes) {
        if (node.type === 'improvedUMLClass') {
          console.log("entra al improvedUMLClass");
          
          // Preparar datos del elemento
          const elementData = {
            name: node.data?.className || `Class_${node.id}`,
            element_type: 'class',
            diagram: diagramId,
            position_x: node.position.x,
            position_y: node.position.y,
            width: node.measured?.width || node.width || 220,
            height: node.measured?.height || node.height || 182,
            color: '#FFFFFF',
            properties: {
              reactflow_id: node.id,
              selected: node.selected || false,
              dragging: node.dragging || false
            },
          };

          try {
            const savedElement = await diagramElementsAPI.create(elementData);
            savedElements.set(node.id, savedElement.id);

            console.log("se crea el elemento");

            // 3. Guardar atributos del elemento
            if (node.data?.attributes && Array.isArray(node.data.attributes)) {
              console.log("entra a los atributos");
              for (let i = 0; i < node.data.attributes.length; i++) {
                const attr = node.data.attributes[i];
                const attributeData = {
                  element: savedElement.id,
                  name: attr.name || `attribute_${i}`,
                  data_type: attr.type || 'string',
                  visibility: (attr.visibility === 'private' ? '-' : 
                             attr.visibility === 'protected' ? '#' : 
                             attr.visibility === 'package' ? '~' : '+') as '-' | '#' | '~' | '+',
                  order: i,
                };
                await attributesAPI.addAttribute(attributeData);
              }
              console.log("se crea el atributo");
            }
            
            // 4. Guardar métodos del elemento
            if (node.data?.methods && Array.isArray(node.data.methods)) {
              console.log("entra a los metodos");
              for (let i = 0; i < node.data.methods.length; i++) {
                const method = node.data.methods[i];
                const methodData = {
                  element: savedElement.id,
                  name: method.name || `method_${i}`,
                  return_type: method.returnType || 'void',
                  visibility: (method.visibility === 'private' ? '-' : 
                             method.visibility === 'protected' ? '#' : 
                             method.visibility === 'package' ? '~' : '+') as '-' | '#' | '~' | '+',
                  parameters: method.parameters || [],
                  order: i,
                };
                await methodsAPI.addMethod(methodData);
              }
              console.log("se crea los metodos");
            }
            
          } catch (elementError) {
            console.warn(`Error saving element ${elementData.name}:`, elementError);
          }
        }
      }
      console.log("llega aqui antes de las relaciones");
      // 5. Guardar relaciones
      // console.log("savedElements map:", savedElements);
      console.log("relacion :", edges);
      for (const edge of edges) {
        if (savedElements.has(edge.source) && savedElements.has(edge.target)) {
          console.log("entra al if de la relacion");
          const relationshipType = (edge.data?.relationship || edge.data?.relationType || 'association') as string;
          const validRelationshipTypes = ['inheritance', 'realization', 'composition', 'aggregation', 'association', 'dependency', 'one_to_one', 'one_to_many', 'many_to_many', 'foreign_key'];
          
          const relationshipData = {
            diagram: diagramId,
            source_element: savedElements.get(edge.source),
            target_element: savedElements.get(edge.target),
            relationship_type: validRelationshipTypes.includes(relationshipType) ? relationshipType as any : 'association',
            name: (edge.data?.label || '') as string,
            source_multiplicity: (edge.data?.sourceMultiplicity || edge.data?.sourceLabel || '') as string,
            target_multiplicity: (edge.data?.targetMultiplicity || edge.data?.targetLabel || '') as string,
            is_navigable: true,
            line_style: 'solid' as 'solid' | 'dashed' | 'dotted',
            color: '#000000',
            properties: {
              reactflow_id: edge.id,
              sourceHandle: edge.sourceHandle,
              targetHandle: edge.targetHandle,
              type: edge.type,
              selected: edge.selected || false
            },
          };

          try {
            console.log(`entra la relacion correctamente`);
            await relationshipsAPI.createRelationship(relationshipData);
          } catch (relationError) {
            console.warn(`Error saving relationship ${edge.id}:`, relationError);
          }
        }
      }
      
      toast.success('Diagrama guardado completamente en la base de datos');
    } catch (error) {
      console.error('Error saving to database:', error);
      toast.error('Error al guardar en la base de datos');
    } finally {
      setLoading(false);
    }
  }, [nodes, edges, diagram, diagramId, setLoading]);

  // Load diagram from database
  const handleLoadFromDatabase = useCallback(async () => {
    if (!diagramId) {
      toast.error('No hay ID de diagrama para cargar');
      return;
    }

    try {
      setLoading(true);
      
      // 1. Cargar elementos del diagrama desde la base de datos
      const elementsData = await diagramElementsAPI.list(diagramId);
      const relationshipsData = await relationshipsAPI.getRelationships(diagramId);

      // 2. Convertir elementos de BD a nodos de ReactFlow
      const reconstructedNodes: Node[] = elementsData.map((element: any) => ({
        id: element.properties?.reactflow_id || element.id,
        type: 'improvedUMLClass',
        position: {
          x: element.position_x || 0,
          y: element.position_y || 0
        },
        data: {
          className: element.name,
          attributes: element.attributes?.map((attr: any) => ({
            name: attr.name,
            type: attr.data_type,
            visibility: attr.visibility === '+' ? 'public' : 
                       attr.visibility === '-' ? 'private' : 
                       attr.visibility === '#' ? 'protected' : 
                       attr.visibility === '~' ? 'package' : 'public'
          })) || [],
          methods: element.methods?.map((method: any) => ({
            name: method.name,
            returnType: method.return_type,
            parameters: method.parameters || [],
            visibility: method.visibility === '+' ? 'public' : 
                       method.visibility === '-' ? 'private' : 
                       method.visibility === '#' ? 'protected' : 
                       method.visibility === '~' ? 'package' : 'public'
          })) || []
        },
        measured: {
          width: element.width || 220,
          height: element.height || 182
        },
        selected: element.properties?.selected || false,
        dragging: element.properties?.dragging || false
      }));

      // 3. Convertir relaciones de BD a edges de ReactFlow
      const reconstructedEdges: Edge[] = relationshipsData.map((rel: any) => {
        // Encontrar los IDs de ReactFlow de los elementos fuente y destino
        const sourceElement = elementsData.find((el: any) => el.id === rel.source_element);
        const targetElement = elementsData.find((el: any) => el.id === rel.target_element);
        
        const sourceId = sourceElement?.properties?.reactflow_id || rel.source_element;
        const targetId = targetElement?.properties?.reactflow_id || rel.target_element;

        return {
          id: rel.properties?.reactflow_id || rel.id,
          source: sourceId,
          target: targetId,
          sourceHandle: rel.properties?.sourceHandle || 'right-50',
          targetHandle: rel.properties?.targetHandle || 'left-50',
          type: rel.properties?.type || 'improvedUMLEdge',
          data: {
            relationship: rel.relationship_type,
            relationType: rel.relationship_type,
            label: rel.name || '',
            sourceMultiplicity: rel.source_multiplicity || '',
            targetMultiplicity: rel.target_multiplicity || '',
            sourceLabel: rel.source_multiplicity || '',
            targetLabel: rel.target_multiplicity || '',
            isReconnectable: true
          },
          selected: rel.properties?.selected || false
        };
      });

      // 4. Actualizar el estado del ReactFlow
      setNodes(reconstructedNodes);
      setEdges(reconstructedEdges);
      
      toast.success(`Diagrama cargado desde la base de datos (${elementsData.length} elementos, ${relationshipsData.length} relaciones)`);
      
    } catch (error) {
      console.error('Error loading from database:', error);
      toast.error('Error al cargar desde la base de datos');
    } finally {
      setLoading(false);
    }
  }, [diagramId, setNodes, setEdges, setLoading]);

  // Load diagram
  const handleLoad = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
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
            alert(
              "Error loading file. Please ensure it's a valid UML diagram file."
            );
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }, [setNodes, setEdges]);

  const selectedNode = selectedNodeId
    ? nodes.find((n) => n.id === selectedNodeId)
    : null;
  const selectedEdge = selectedEdgeId
    ? edges.find((e) => e.id === selectedEdgeId)
    : null;

  // Show loading state
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          gap: 2,
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" color="text.secondary">
          Cargando diagrama...
        </Typography>
      </Box>
    );
  }

  // Show error state
  if (error) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          gap: 2,
          p: 3,
        }}
      >
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Typography variant="body1" color="text.secondary" textAlign="center">
          No se pudo cargar el diagrama. Verifica que el ID del diagrama sea válido.
        </Typography>
      </Box>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <UMLToolbar 
        onSave={handleSave} 
        onLoad={handleLoad} 
        onSaveToDatabase={handleSaveToDatabase}
        onLoadFromDatabase={handleLoadFromDatabase}
        diagramName={diagram?.name} 
      />

      <div className="flex-1 flex">
        <UMLToolPanel
          selectedTool={selectedTool}
          onToolSelect={setSelectedTool}
          onAddClass={handleAddClass}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
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
            className={`bg-blue-50/20 ${
              selectedEdges.length > 0 ? "selecting-edge" : ""
            }`}
            connectionLineType={ConnectionLineType.Bezier}
            snapGrid={[15, 15]}
            snapToGrid={true}
            edgesReconnectable={true}
            reconnectRadius={20}
            panOnDrag={selectedEdges.length === 0}
            selectionOnDrag={false}
          >
            <Controls />
            <Background color="#3b82f6" className="opacity-10" />
            <svg
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                pointerEvents: "none",
              }}
            >
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
  // <ThemeProvider>
  //   <ReactFlowProvider>

  //     <UMLEditor />
  //   </ReactFlowProvider>
  // </ThemeProvider>
  <ThemeProvider>
    <ReactFlowProvider>
      <MainLayout>
        <UMLEditor />
      </MainLayout>
    </ReactFlowProvider>
  </ThemeProvider>
);

export default UMLEditorWithProvider;
