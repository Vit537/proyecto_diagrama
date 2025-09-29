import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Stage, Layer, Group, Rect, Text, Line, Circle } from 'react-konva';
import { Box } from '@mui/material';
import Konva from 'konva';
import { DiagramElement, ActiveUser, ElementLock } from '../../types';
import UMLClassNode from './UMLNodes/UMLClassNode';
import UMLInterfaceNode from './UMLNodes/UMLInterfaceNode';
import UMLRelationshipNode from './UMLNodes/UMLRelationshipNode';
import GridBackground from './GridBackground';
import CursorIndicator from './CursorIndicator';

interface UMLCanvasProps {
  elements: DiagramElement[];
  selectedElement: DiagramElement | null;
  zoom: number;
  panPosition: { x: number; y: number };
  showGrid: boolean;
  activeTool: string;
  // activeUsers: ActiveUser[];
  // elementLocks: ElementLock[];
  onElementsChange: (elements: DiagramElement[]) => void;
  onElementSelect: (element: DiagramElement | null) => void;
  onZoomChange: (zoom: number) => void;
  onPanChange: (pan: { x: number; y: number }) => void;
  // onCursorMove?: (position: { x: number; y: number }) => void;
}

const UMLCanvas: React.FC<UMLCanvasProps> = ({
  elements,
  selectedElement,
  zoom,
  panPosition,
  showGrid,
  activeTool,
  // activeUsers,
  // elementLocks,
  onElementsChange,
  onElementSelect,
  onZoomChange,
  onPanChange,
  // onCursorMove,
}) => {
  const stageRef = useRef<Konva.Stage>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [isCreatingElement, setIsCreatingElement] = useState(false);

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

  // Generate unique ID for new elements
  const generateId = () => {
    return `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Handle mouse move for cursor tracking
  // const handleMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
  //   if (onCursorMove) {
  //     const stage = e.target.getStage();
  //     if (stage) {
  //       const pointerPosition = stage.getPointerPosition();
  //       if (pointerPosition) {
  //         // Convert screen coordinates to canvas coordinates
  //         const canvasX = (pointerPosition.x - panPosition.x) / zoom;
  //         const canvasY = (pointerPosition.y - panPosition.y) / zoom;
  //         onCursorMove({ x: canvasX, y: canvasY });
  //       }
  //     }
  //   }
  // }, [onCursorMove, panPosition, zoom]);

  // Handle stage click (create new elements or deselect)
  const handleStageClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (activeTool === 'select') {
      // Deselect if clicking on empty area
      if (e.target === e.target.getStage()) {
        onElementSelect(null);
      }
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

    onElementsChange([...elements, newElement]);
    onElementSelect(newElement);
  }, [activeTool, elements, onElementsChange, onElementSelect, panPosition, zoom]);

  // Get default properties for new elements
  const getDefaultElementName = (type: string): string => {
    switch (type) {
      case 'class':
        return 'NuevaClase';
      case 'interface':
        return 'NuevaInterfaz';
      case 'abstract_class':
        return 'ClaseAbstracta';
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
      case 'abstract_class':
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
      case 'abstract_class':
        return {
          attributes: [
            { id: 'attr1', name: 'atributo', type: 'String', visibility: 'private' }
          ],
          methods: [
            { id: 'method1', name: 'metodo', returnType: 'void', parameters: [], visibility: 'public' }
          ],
          isAbstract: type === 'abstract_class',
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

  // Handle element updates
  const handleElementUpdate = useCallback((elementId: string, updates: Partial<DiagramElement>) => {
    const updatedElements = elements.map(el => 
      el.id === elementId ? { ...el, ...updates } : el
    );
    onElementsChange(updatedElements);
  }, [elements, onElementsChange]);

  // Handle element selection
  const handleElementClick = useCallback((element: DiagramElement) => {
    if (activeTool === 'select') {
      onElementSelect(element);
    }
  }, [activeTool, onElementSelect]);

  // Handle wheel (zoom)
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
    
    if (newZoom !== oldZoom) {
      // Zoom towards pointer
      const newPan = {
        x: pointer.x - (pointer.x - panPosition.x) * (newZoom / oldZoom),
        y: pointer.y - (pointer.y - panPosition.y) * (newZoom / oldZoom),
      };
      
      onZoomChange(newZoom);
      onPanChange(newPan);
    }
  }, [zoom, panPosition, onZoomChange, onPanChange]);

  // Handle stage drag (pan)
  const handleStageDragStart = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    if (activeTool !== 'select') return;
    setIsDragging(true);
    setDragStartPos({ x: e.target.x(), y: e.target.y() });
  }, [activeTool]);

  const handleStageDragMove = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    if (!isDragging) return;
    onPanChange({ x: e.target.x(), y: e.target.y() });
  }, [isDragging, onPanChange]);

  const handleStageDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Check if element is locked
  // const isElementLocked = (elementId: string) => {
  //   return elementLocks.some(lock => lock.element_id === elementId);
  // };

  // Render element based on type
  const renderElement = (element: DiagramElement) => {
    const isSelected = selectedElement?.id === element.id;
    
    const commonProps = {
      key: element.id,
      element,
      isSelected,
      zoom,
      onUpdate: handleElementUpdate,
      onClick: handleElementClick,
    };

    switch (element.type) {
      case 'class':
      case 'abstract_class':
        return (
          <UMLClassNode
            {...commonProps}
            isAbstract={element.type === 'abstract_class'}
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
  };
      //       isAbstract={element.type === 'abstract_class' || element.data?.isAbstract}
      //     />
      //   );
      // case 'interface':
      //   return <UMLInterfaceNode {...commonProps} />;
      // case 'relationship':
      //   return <UMLRelationshipNode {...commonProps} />;
      // default:
      //   return (
      //     <UMLClassNode
      //       {...commonProps}
      //       isAbstract={false}
      //     />
      //   );
    }
  };

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
        draggable={activeTool === 'select'}
        onClick={handleStageClick}
        // onMouseMove={handleMouseMove}
        onWheel={handleWheel}
        onDragStart={handleStageDragStart}
        onDragMove={handleStageDragMove}
        onDragEnd={handleStageDragEnd}
      >
        {/* Grid Background Layer */}
        {showGrid && (
          <Layer>
            <GridBackground
              width={stageSize.width / zoom}
              height={stageSize.height / zoom}
              gridSize={20}
              zoom={zoom}
            />
          </Layer>
        )}

        {/* Main Content Layer */}
        <Layer>
          {/* Render all elements */}
          {elements.map(renderElement)}
          
          {/* Selection rectangle */}
          {selectedElement && (
            <Group>
              <Rect
                x={selectedElement.position.x - 5}
                y={selectedElement.position.y - 5}
                width={selectedElement.size.width + 10}
                height={selectedElement.size.height + 10}
                stroke="#2196f3"
                strokeWidth={2 / zoom}
                dash={[5 / zoom, 5 / zoom]}
                fill="transparent"
              />
            </Group>
          )}
        </Layer>

        {/* Collaboration Layer (cursors, locks) */}
        <Layer>
          {/* Aquí irían los cursors y locks cuando se implemente colaboración */}
        </Layer>
      </Stage>
                stroke="#1976d2"
                strokeWidth={2 / zoom}
                dash={[5 / zoom, 5 / zoom]}
                fill="transparent"
              />
            </Group>
          )}
        </Layer> */}

        {/* Collaboration Layer (cursors, locks) */}
        {/* <Layer> */}
          {/* Render active user cursors */}
          {/* {activeUsers.map(user => (
            user.cursor_position && (
              <CursorIndicator
                key={user.id}
                user={user}
                position={user.cursor_position}
                zoom={zoom}
              />
            )
          ))} */}
          
          {/* Render element locks */}
          {/* {elementLocks.map(lock => {
            const element = elements.find(el => el.id === lock.element_id);
            if (!element) return null;
            
            return (
              <Group key={lock.element_id}>
                <Circle
                  x={element.position.x + element.size.width + 10}
                  y={element.position.y - 10}
                  radius={8 / zoom}
                  fill="#ff9800"
                  stroke="#f57c00"
                  strokeWidth={2 / zoom}
                />
                <Text
                  x={element.position.x + element.size.width + 25}
                  y={element.position.y - 15}
                  text={`🔒 ${lock.user.first_name || lock.user.email}`}
                  fontSize={12 / zoom}
                  fill="#f57c00"
                />
              </Group>
            );
          })}
        </Layer> */}
      {/* </Stage> */} 

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
