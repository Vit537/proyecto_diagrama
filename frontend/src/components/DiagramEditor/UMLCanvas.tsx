import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Stage, Layer, Group, Rect, Text, Line } from 'react-konva';
import { Box } from '@mui/material';
import Konva from 'konva';
import { DiagramElement } from '../../types';
import UMLClassNode from './UMLNodes/UMLClassNode';
import UMLInterfaceNode from './UMLNodes/UMLInterfaceNode';
import UMLRelationshipNode from './UMLNodes/UMLRelationshipNode';

interface UMLCanvasProps {
  elements: DiagramElement[];
  selectedElement: DiagramElement | null;
  zoom: number;
  panPosition: { x: number; y: number };
  showGrid: boolean;
  activeTool: string;
  onElementsChange: (elements: DiagramElement[]) => void;
  onElementSelect: (element: DiagramElement | null) => void;
  onZoomChange: (zoom: number) => void;
  onPanChange: (pan: { x: number; y: number }) => void;
}

const UMLCanvas: React.FC<UMLCanvasProps> = ({
  elements,
  selectedElement,
  zoom,
  panPosition,
  showGrid,
  activeTool,
  onElementsChange,
  onElementSelect,
  onZoomChange,
  onPanChange,
}) => {
  const stageRef = useRef<Konva.Stage>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
  const [isDragging, setIsDragging] = useState(false);
  const [nodeDragging, setNodeDragging] = useState(false);
  const [connectionStart, setConnectionStart] = useState<DiagramElement | null>(null);
  const [tempEnd, setTempEnd] = useState<{ x: number; y: number } | null>(null);

  // Memoizar elementos para evitar re-renders innecesarios
  const memoizedElements = useMemo(() => elements, [elements]);

  // Generate unique ID for new elements
  const generateId = () => {
    return `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Resize handler
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const { offsetWidth, offsetHeight } = containerRef.current;
        setStageSize({ width: offsetWidth, height: offsetHeight });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle stage click (create new elements or deselect)
  const handleStageClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    console.log('🎯 Stage click detected, target:', e.target.getClassName(), 'activeTool:', activeTool);
    
    // Solo procesar si no estamos arrastrando
    if (isDragging || nodeDragging) {
      console.log('❌ Stage click ignored - dragging in progress');
      return;
    }

    // Si el click fue en el stage mismo (no en un elemento), deseleccionar
    if (e.target === e.target.getStage()) {
      console.log('✅ Clicked on empty stage, deselecting');
      if (activeTool === 'select') {
        onElementSelect(null);
        return;
      }
    } else {
      // Si el click fue en un elemento, no hacer nada aquí
      // La selección la maneja el elemento mismo
      console.log('➡️ Click was on element, letting element handle it');
      return;
    }

    // Check if we're clicking on an element
    if (e.target !== e.target.getStage()) {
      return;
    }

    // Create new element based on active tool
    const stage = e.target.getStage();
    if (!stage) return;

    const pointerPosition = stage.getPointerPosition();
    if (!pointerPosition) return;

    // Convert screen coordinates to canvas coordinates
    const x = (pointerPosition.x - panPosition.x) / zoom;
    const y = (pointerPosition.y - panPosition.y) / zoom;

    const newElement: DiagramElement = {
      id: generateId(),
      type: activeTool as DiagramElement['type'],
      name: getDefaultElementName(activeTool),
      position: { x, y },
      size: getDefaultElementSize(activeTool),
      data: getDefaultElementData(activeTool),
      style: getDefaultElementStyle(activeTool),
    };

    onElementsChange([...memoizedElements, newElement]);
    onElementSelect(newElement);
  }, [activeTool, memoizedElements, onElementsChange, onElementSelect, panPosition, zoom, isDragging, nodeDragging]);

  // Start connection callback (passed to nodes)
  const startConnection = useCallback((element: DiagramElement, e: Konva.KonvaEventObject<MouseEvent>) => {
    // Only start when active tool is a relationship type
    const relTools = ['association', 'inheritance', 'realization', 'aggregation', 'composition', 'dependency'];
    if (!relTools.includes(activeTool)) return;

    setConnectionStart(element);
    const stage = stageRef.current;
    const pointer = stage?.getPointerPosition();
    if (pointer) {
      setTempEnd({ x: (pointer.x - panPosition.x) / zoom, y: (pointer.y - panPosition.y) / zoom });
    }
  }, [activeTool, panPosition, zoom]);

  // Get default properties for new elements
  const getDefaultElementName = (type: string): string => {
    switch (type) {
      case 'class':
        return 'NuevaClase';
      case 'interface':
        return 'NuevaInterfaz';
      case 'enum':
        return 'NuevaEnum';
      default:
        return 'NuevoElemento';
    }
  };

  const getDefaultElementSize = (type: string) => {
    switch (type) {
      case 'class':
      case 'interface':
        return { width: 200, height: 150 };
      case 'enum':
        return { width: 150, height: 120 };
      default:
        return { width: 100, height: 80 };
    }
  };

  const getDefaultElementData = (type: string) => {
    switch (type) {
      case 'class':
      case 'interface':
        return {
          attributes: [
            { id: 'attr1', name: 'atributo', type: 'String', visibility: 'private' }
          ],
          methods: [
            { id: 'method1', name: 'metodo', returnType: 'void', parameters: [], visibility: 'public' }
          ],
          isAbstract: false,
          isInterface: type === 'interface',
        };
      case 'enum':
        return {
          values: ['VALOR1', 'VALOR2', 'VALOR3'],
        };
      default:
        return {};
    }
  };

  const getDefaultElementStyle = (type: string) => {
    return {
      fill: '#ffffff',
      stroke: '#333333',
      strokeWidth: 2,
      fontSize: 14,
      fontFamily: 'Arial',
    };
  };

  // Handle element updates mejorado - evita actualizaciones innecesarias
  const handleElementUpdate = useCallback((elementId: string, updates: Partial<DiagramElement>) => {
    // Solo actualizar si hay cambios reales
    const currentElement = memoizedElements.find(el => el.id === elementId);
    if (!currentElement) return;

    // Verificar si hay cambios reales
    const hasChanges = Object.keys(updates).some(key => {
      const updateValue = updates[key as keyof DiagramElement];
      const currentValue = currentElement[key as keyof DiagramElement];
      
      if (key === 'position' && updateValue && currentValue) {
        const newPos = updateValue as { x: number; y: number };
        const oldPos = currentValue as { x: number; y: number };
        return Math.abs(newPos.x - oldPos.x) > 0.1 || Math.abs(newPos.y - oldPos.y) > 0.1;
      }
      
      return JSON.stringify(updateValue) !== JSON.stringify(currentValue);
    });

    if (!hasChanges) return;

    const updatedElements = memoizedElements.map(el => {
      if (el.id === elementId) {
        return { ...el, ...updates };
      }
      return el;
    });
    
    onElementsChange(updatedElements);
  }, [memoizedElements, onElementsChange]);

  // Handle element selection
  const handleElementClick = useCallback((element: DiagramElement) => {
    console.log('Element clicked:', element.name, 'Element ID:', element.id, 'activeTool:', activeTool); // Debug log
    
    // Evitar selección durante drag
    if (nodeDragging) {
      console.log('Ignoring click - node is dragging');
      return;
    }

    // Relationship creation flow
    const relTools = ['association', 'inheritance', 'realization', 'aggregation', 'composition', 'dependency'];
    if (relTools.includes(activeTool)) {
      if (!connectionStart) {
        setConnectionStart(element);
        onElementSelect(element);
      } else if (connectionStart.id !== element.id) {
        // create relationship between connectionStart and element
        const startCenter = {
          x: connectionStart.position.x + connectionStart.size.width / 2,
          y: connectionStart.position.y + connectionStart.size.height / 2,
        };
        const endCenter = {
          x: element.position.x + element.size.width / 2,
          y: element.position.y + element.size.height / 2,
        };

        const newRel: DiagramElement = {
          id: generateId(),
          type: 'relationship',
          name: `${connectionStart.name}_${element.name}`,
          position: { x: Math.min(startCenter.x, endCenter.x), y: Math.min(startCenter.y, endCenter.y) },
          size: { width: Math.abs(endCenter.x - startCenter.x), height: Math.abs(endCenter.y - startCenter.y) },
          data: {
            source_id: connectionStart.id,
            target_id: element.id,
            startPoint: startCenter,
            endPoint: endCenter,
            relationshipType: activeTool,
            multiplicityStart: '1',
            multiplicityEnd: '*',
          },
          style: getDefaultElementStyle('relationship'),
        };

        onElementsChange([...memoizedElements, newRel]);
        onElementSelect(newRel);
        setConnectionStart(null);
        setTempEnd(null);
      }
      return;
    }

    // Selección normal
    console.log('Selecting element:', element.name);
    onElementSelect(element);
  }, [activeTool, onElementSelect, connectionStart, memoizedElements, onElementsChange, nodeDragging]);

  // Node drag handlers mejorados
  const handleNodeDragStart = useCallback(() => {
    setNodeDragging(true);
  }, []);

  const handleNodeDragEnd = useCallback(() => {
    setNodeDragging(false);
  }, []);

  // Render element based on type con memoización
  const renderElement = useCallback((element: DiagramElement) => {
    const isSelected = selectedElement?.id === element.id;
    
    if (isSelected) {
      console.log('Rendering selected element:', element.name);
    }
    
    const commonProps = {
      key: element.id,
      element,
      isSelected,
      isLocked: false,
      zoom,
      draggableEnabled: activeTool === 'select',
      onNodeDragStart: handleNodeDragStart,
      onNodeDragEnd: handleNodeDragEnd,
      onUpdate: handleElementUpdate,
      onClick: handleElementClick,
    };

    switch (element.type) {
      case 'class':
        return (
          <UMLClassNode
            {...commonProps}
            isAbstract={false}
            onStartConnection={startConnection}
          />
        );
      case 'interface':
        return (
          <UMLInterfaceNode {...commonProps} />
        );
      case 'relationship':
        return (
          <UMLRelationshipNode {...commonProps} />
        );
      default:
        return null;
    }
  }, [selectedElement, zoom, activeTool, handleNodeDragStart, handleNodeDragEnd, handleElementUpdate, handleElementClick, startConnection]);

  // Handle wheel (zoom) optimizado
  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    
    const stage = e.target.getStage();
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const scaleBy = 1.1;
    const oldZoom = zoom;
    
    let newZoom;
    if (e.evt.deltaY < 0) {
      newZoom = oldZoom * scaleBy;
    } else {
      newZoom = oldZoom / scaleBy;
    }
    
    // Limit zoom
    newZoom = Math.max(0.1, Math.min(3, newZoom));
    
    if (Math.abs(newZoom - oldZoom) > 0.01) { // Solo actualizar si el cambio es significativo
      // Zoom towards pointer
      const newPan = {
        x: pointer.x - (pointer.x - panPosition.x) * (newZoom / oldZoom),
        y: pointer.y - (pointer.y - panPosition.y) * (newZoom / oldZoom),
      };
      
      onZoomChange(newZoom);
      onPanChange(newPan);
    }
  }, [zoom, panPosition, onZoomChange, onPanChange]);

  // Mouse move para conexiones temporales
  const handleStageMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!connectionStart) return;
    const stage = e.target.getStage();
    if (!stage) return;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    setTempEnd({ x: (pointer.x - panPosition.x) / zoom, y: (pointer.y - panPosition.y) / zoom });
  }, [connectionStart, panPosition, zoom]);

  const handleStageMouseUp = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    // If released on stage (not on a node) while creating connection, cancel
    const stage = e.target.getStage();
    if (!stage) return;
    if (e.target === stage && connectionStart) {
      setConnectionStart(null);
      setTempEnd(null);
    }
  }, [connectionStart]);

  // Handle stage drag (pan) mejorado
  const handleStageDragStart = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    if (activeTool !== 'select' || nodeDragging) return;
    setIsDragging(true);
  }, [activeTool, nodeDragging]);

  const handleStageDragMove = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    if (!isDragging || nodeDragging) return;
    onPanChange({ x: e.target.x(), y: e.target.y() });
  }, [isDragging, onPanChange, nodeDragging]);

  const handleStageDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  return (
    <Box
      ref={containerRef}
      sx={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        cursor: activeTool === 'select' ? 'default' : 'crosshair',
        backgroundColor: 'grey.50',
      }}
    >
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        scaleX={zoom}
        scaleY={zoom}
        x={panPosition.x}
        y={panPosition.y}
        draggable={false}
        onClick={handleStageClick}
        onMouseMove={handleStageMouseMove}
        onMouseUp={handleStageMouseUp}
        onWheel={handleWheel}
        onDragStart={handleStageDragStart}
        onDragMove={handleStageDragMove}
        onDragEnd={handleStageDragEnd}
        // Optimizaciones de performance
        listening={true}
        imageSmoothingEnabled={false}
      >
        {/* Main Content Layer */}
        <Layer
          // Optimizaciones adicionales
          clearBeforeDraw={true}
          hitGraphEnabled={false}
        >
          {/* Render all elements con memoización */}
          {memoizedElements.map(renderElement)}
          
          {/* Temporary connection preview */}
          {connectionStart && tempEnd && (
            <Line
              points={[
                connectionStart.position.x + connectionStart.size.width / 2,
                connectionStart.position.y + connectionStart.size.height / 2,
                tempEnd.x,
                tempEnd.y,
              ]}
              stroke="#555"
              strokeWidth={Math.max(1, 2 / zoom)}
              dash={[6 / zoom, 4 / zoom]}
              perfectDrawEnabled={false}
            />
          )}
        </Layer>
      </Stage>

      {/* Static grid background (CSS) */}
      {showGrid && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            backgroundImage: `linear-gradient(to right, rgba(200,200,200,0.6) 1px, transparent 1px), linear-gradient(to bottom, rgba(200,200,200,0.6) 1px, transparent 1px)`,
            backgroundSize: '20px 20px',
            backgroundPosition: '0px 0px',
            zIndex: 0,
          }}
        />
         )}

      {/* UI Overlays */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 16,
          right: 16,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          padding: 1,
          borderRadius: 2,
          fontSize: '0.75rem',
          color: 'text.secondary',
        }}
      >
        Zoom: {Math.round(zoom * 100)}% | Elementos: {elements.length}
      </Box>
    </Box>
  );
};

export default UMLCanvas; 