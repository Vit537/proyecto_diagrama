import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Group, Rect, Text, Line } from 'react-konva';
import { DiagramElement, ClassAttribute, ClassMethod } from '../../../types';
import Konva from 'konva';

interface UMLClassNodeProps {
  element: DiagramElement;
  isSelected: boolean;
  isLocked: boolean;
  isAbstract: boolean;
  zoom: number;
  draggableEnabled?: boolean;
  onNodeDragStart?: () => void;
  onNodeDragEnd?: () => void;
  onUpdate: (elementId: string, updates: Partial<DiagramElement>) => void;
  onClick: (element: DiagramElement) => void;
  onStartConnection?: (element: DiagramElement, e: Konva.KonvaEventObject<MouseEvent>) => void;
}

const UMLClassNode: React.FC<UMLClassNodeProps> = ({
  element,
  isSelected,
  isLocked,
  isAbstract,
  zoom,
  draggableEnabled = true,
  onUpdate,
  onClick,
  onStartConnection,
  onNodeDragStart,
  onNodeDragEnd,
}) => {
  const groupRef = useRef<Konva.Group>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPosition, setDragStartPosition] = useState<{x: number, y: number} | null>(null);

  // Style properties
  const strokeWidth = Math.max(1, 2 / zoom);
  const fontSize = Math.max(8, (element.style?.fontSize || 14) / zoom);
  const padding = Math.max(4, 8 / zoom);
  const lineHeight = fontSize * 1.2;

  // Colors based on element type and state
  const getColors = () => {
    let fill = element.style?.fill || '#ffffff';
    let stroke = element.style?.stroke || '#333333';
    
    if (isLocked) {
      fill = '#fff3e0';
      stroke = '#ff9800';
    } else if (isSelected) {
      stroke = '#1976d2';
      console.log('Applying selected styles to:', element.name);
    }
    
    if (isAbstract) {
      fill = '#f3e5f5';
    } else if (element.data?.isInterface) {
      fill = '#e8f5e8';
    }
    
    return { fill, stroke };
  };

  const { fill, stroke } = getColors();

  // Calculate heights
  const headerHeight = lineHeight + padding * 2;
  const attributesHeight = element.data?.attributes?.length 
    ? (element.data.attributes.length * lineHeight) + padding * 2 
    : lineHeight + padding;
  const methodsHeight = element.data?.methods?.length 
    ? (element.data.methods.length * lineHeight) + padding * 2 
    : lineHeight + padding;
  
  const totalHeight = headerHeight + attributesHeight + methodsHeight;

  // Handle drag start - Solo marcar el inicio del drag
  const handleDragStart = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true; // Evitar que el evento se propague
    setIsDragging(true);
    setDragStartPosition({ x: e.target.x(), y: e.target.y() });
    
    if (onNodeDragStart) {
      onNodeDragStart();
    }
  }, [onNodeDragStart]);

  // Handle drag move - NO actualizar estado global aquí
  const handleDragMove = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    // No hacer nada aquí - Konva maneja la posición visual automáticamente
    // Esto evita renders innecesarios y conflictos de estado
  }, []);

  // Handle drag end - Solo actualizar estado global al finalizar
  const handleDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    const newX = e.target.x();
    const newY = e.target.y();
    
    // Verificar si realmente se movió el elemento
    const actuallyMoved = dragStartPosition && 
      (Math.abs(newX - dragStartPosition.x) > 1 || Math.abs(newY - dragStartPosition.y) > 1);

    if (onNodeDragEnd) {
      onNodeDragEnd();
    }

    // Solo actualizar posición si realmente se movió
    if (actuallyMoved) {
      onUpdate(element.id, {
        position: { x: newX, y: newY },
      });
    }

    // Resetear estado de drag con un pequeño delay para evitar clicks accidentales
    setTimeout(() => {
      setIsDragging(false);
    }, 50);
    
    setDragStartPosition(null);
  }, [element.id, onUpdate, onNodeDragEnd, dragStartPosition]);

  // Handle click
  const handleClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    console.log('🔥 UMLClassNode click handler called for:', element.name, 'isDragging:', isDragging);
    
    // Evitar click si acabamos de terminar un drag
    if (isDragging) {
      console.log('❌ Click ignored - element is dragging');
      return;
    }
    
    // Prevenir propagación al stage
    e.cancelBubble = true;
    
    console.log('✅ Calling onClick for element:', element.name);
    // Llamar al onClick del elemento
    onClick(element);
  }, [onClick, element, isDragging]);

  // Handle mouse down for connections
  const handleMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    // Solo manejar conexiones si hay callback definido
    if (onStartConnection) {
      onStartConnection(element, e);
    }
  }, [onStartConnection, element]);

  // Format visibility symbols
  const getVisibilitySymbol = (visibility: string) => {
    switch (visibility) {
      case 'public': return '+';
      case 'private': return '-';
      case 'protected': return '#';
      case 'package': return '~';
      default: return '+';
    }
  };

  // Format attribute text
  const formatAttribute = (attr: ClassAttribute) => {
    const symbol = getVisibilitySymbol(attr.visibility);
    const staticIndicator = attr.is_static ? ' {static}' : '';
    return `${symbol} ${attr.name}: ${attr.type}${staticIndicator}`;
  };

  // Format method text
  const formatMethod = (method: ClassMethod) => {
    const symbol = getVisibilitySymbol(method.visibility);
    const params = method.parameters?.map(p => `${p.name}: ${p.type}`).join(', ') || '';
    const abstractIndicator = method.is_abstract ? ' {abstract}' : '';
    const staticIndicator = method.is_static ? ' {static}' : '';
    return `${symbol} ${method.name}(${params}): ${method.return_type}${abstractIndicator}${staticIndicator}`;
  };

  // Debug log para verificar renderizado
  console.log('📦 Rendering UMLClassNode:', element.name, 'at position:', element.position, 'size:', element.size, 'isSelected:', isSelected);

  return (
    <Group
      name={`node_${element.id}`}
      ref={groupRef}
      x={element.position.x}
      y={element.position.y}
      draggable={draggableEnabled && !isLocked}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onTap={handleClick} // Para dispositivos táctiles
      // Asegurar que el grupo capture eventos
      listening={true}
      // Mejorar performance
      perfectDrawEnabled={false}
      shadowForStrokeEnabled={false}
    >
      {/* Main Rectangle */}
      <Rect
        width={element.size.width}
        height={totalHeight}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        cornerRadius={4 / zoom}
        perfectDrawEnabled={false}
        listening={true}
        onClick={handleClick}
      />

      {/* Class Name Header */}
      <Rect
        width={element.size.width}
        height={headerHeight}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        cornerRadius={4 / zoom}
        perfectDrawEnabled={false}
      />

      {/* Stereotype (if interface or abstract) */}
      {element.data?.isInterface && (
        <Text
          x={padding}
          y={padding / 2}
          width={element.size.width - padding * 2}
          text="<<interface>>"
          fontSize={fontSize * 0.8}
          fill="#666"
          align="center"
          fontStyle="italic"
          perfectDrawEnabled={false}
        />
      )}

      {/* Class Name */}
      <Text
        x={padding}
        y={element.data?.isInterface ? padding + fontSize * 0.8 : padding}
        width={element.size.width - padding * 2}
        text={element.name}
        fontSize={fontSize}
        fontFamily={element.style?.fontFamily || 'Arial'}
        fill="#000"
        align="center"
        fontStyle="normal"
        fontWeight="bold"
        perfectDrawEnabled={false}
      />

      {/* Separator line between header and attributes */}
      <Line
        points={[0, headerHeight, element.size.width, headerHeight]}
        stroke={stroke}
        strokeWidth={strokeWidth}
        perfectDrawEnabled={false}
      />

      {/* Attributes Section */}
      <Group y={headerHeight}>
        {element.data?.attributes?.map((attr: ClassAttribute, index: number) => (
          <Text
            key={attr.id}
            x={padding}
            y={padding + index * lineHeight}
            width={element.size.width - padding * 2}
            text={formatAttribute(attr)}
            fontSize={fontSize * 0.9}
            fill="#000"
            fontFamily="monospace"
            perfectDrawEnabled={false}
          />
        )) || (
          <Text
            x={padding}
            y={padding}
            width={element.size.width - padding * 2}
            text="(sin atributos)"
            fontSize={fontSize * 0.8}
            fill="#999"
            fontStyle="italic"
            align="center"
            perfectDrawEnabled={false}
          />
        )}
      </Group>

      {/* Separator line between attributes and methods */}
      <Line
        points={[0, headerHeight + attributesHeight, element.size.width, headerHeight + attributesHeight]}
        stroke={stroke}
        strokeWidth={strokeWidth}
        perfectDrawEnabled={false}
      />

      {/* Methods Section */}
      <Group y={headerHeight + attributesHeight}>
        {element.data?.methods?.map((method: ClassMethod, index: number) => (
          <Text
            key={method.id}
            x={padding}
            y={padding + index * lineHeight}
            width={element.size.width - padding * 2}
            text={formatMethod(method)}
            fontSize={fontSize * 0.9}
            fill="#000"
            fontFamily="monospace"
            fontStyle={method.is_abstract ? 'italic' : 'normal'}
            perfectDrawEnabled={false}
          />
        )) || (
          <Text
            x={padding}
            y={padding}
            width={element.size.width - padding * 2}
            text="(sin métodos)"
            fontSize={fontSize * 0.8}
            fill="#999"
            fontStyle="italic"
            align="center"
            perfectDrawEnabled={false}
          />
        )}
      </Group>

      {/* Resize handles (only when selected and not locked) */}
      {isSelected && !isLocked && (
        <Group>
          {/* Bottom-right resize handle */}
          <Rect
            x={element.size.width - 8}
            y={totalHeight - 8}
            width={8}
            height={8}
            fill="#1976d2"
            stroke="#1565c0"
            strokeWidth={1}
            draggable
            onDragMove={(e) => {
              const newWidth = Math.max(100, e.target.x() + 8);
              const newHeight = Math.max(80, e.target.y() + 8);
              
              // Solo actualizar si hay cambio significativo
              if (Math.abs(newWidth - element.size.width) > 5 || 
                  Math.abs(newHeight - element.size.height) > 5) {
                onUpdate(element.id, {
                  size: { width: newWidth, height: newHeight }
                });
              }
            }}
            perfectDrawEnabled={false}
          />
        </Group>
      )}
    </Group>
  );
};

export default UMLClassNode;