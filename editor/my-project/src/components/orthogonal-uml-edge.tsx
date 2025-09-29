import React, { useEffect, useState, useCallback } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from '@xyflow/react';
import type { UMLEdgeData } from '@/types/uml';
import { useEditableEdge } from '@/hooks/useEditableEdge';
import { ControlPoint } from '@/components/edge-controls/ControlPoint';

export type OrthogonalUMLEdgeProps = EdgeProps & {
  data?: UMLEdgeData;
};

interface CustomControlPoint {
  id: string;
  x: number;
  y: number;
  type: 'control' | 'bend';
}

const OrthogonalUMLEdge: React.FC<OrthogonalUMLEdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}) => {
  const {
    controlPoints,
    dragPointId,
    initializeControlPoints,
    handleMouseDown
  } = useEditableEdge(id || 'orthogonal-edge');

  // Estado para puntos de control personalizados
  const [customControlPoints, setCustomControlPoints] = useState<CustomControlPoint[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Inicializar puntos de control cuando cambian las coordenadas
  useEffect(() => {
    initializeControlPoints(sourceX, sourceY, targetX, targetY);
    
    // Crear puntos de control intermedios para permitir manipulación
    const midX = (sourceX + targetX) / 2;
    const midY = (sourceY + targetY) / 2;
    
    setCustomControlPoints([
      {
        id: `${id}-bend-1`,
        x: sourceX + (midX - sourceX) * 0.5,
        y: sourceY,
        type: 'bend'
      },
      {
        id: `${id}-bend-2`,
        x: sourceX + (midX - sourceX) * 0.5,
        y: midY,
        type: 'bend'
      },
      {
        id: `${id}-bend-3`,
        x: midX,
        y: midY,
        type: 'control'
      },
      {
        id: `${id}-bend-4`,
        x: targetX - (targetX - midX) * 0.5,
        y: midY,
        type: 'bend'
      },
      {
        id: `${id}-bend-5`,
        x: targetX - (targetX - midX) * 0.5,
        y: targetY,
        type: 'bend'
      }
    ]);
  }, [sourceX, sourceY, targetX, targetY, initializeControlPoints, id]);

  // Crear el path personalizado usando los puntos de control
  const createCustomPath = useCallback(() => {
    if (customControlPoints.length === 0) {
      return getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
        borderRadius: 0,
        offset: 20,
      });
    }

    // Crear un path ortogonal estricto usando los puntos de control personalizados
    let pathData = `M ${sourceX},${sourceY}`;
    
    // Punto anterior para mantener ortogonalidad
    let prevX = sourceX;
    let prevY = sourceY;
    
    customControlPoints.forEach((point) => {
      // Para mantener ortogonalidad estricta, cada segmento debe ser horizontal o vertical
      if (Math.abs(point.x - prevX) > Math.abs(point.y - prevY)) {
        // Movimiento más horizontal: ir horizontal primero, luego vertical
        if (point.x !== prevX) {
          pathData += ` L ${point.x},${prevY}`;
          prevX = point.x;
        }
        if (point.y !== prevY) {
          pathData += ` L ${point.x},${point.y}`;
          prevY = point.y;
        }
      } else {
        // Movimiento más vertical: ir vertical primero, luego horizontal
        if (point.y !== prevY) {
          pathData += ` L ${prevX},${point.y}`;
          prevY = point.y;
        }
        if (point.x !== prevX) {
          pathData += ` L ${point.x},${point.y}`;
          prevX = point.x;
        }
      }
    });
    
    // Conectar al punto final de manera ortogonal
    if (Math.abs(targetX - prevX) > Math.abs(targetY - prevY)) {
      // Ir horizontal primero
      if (targetX !== prevX) {
        pathData += ` L ${targetX},${prevY}`;
      }
      if (targetY !== prevY) {
        pathData += ` L ${targetX},${targetY}`;
      }
    } else {
      // Ir vertical primero
      if (targetY !== prevY) {
        pathData += ` L ${prevX},${targetY}`;
      }
      if (targetX !== prevX) {
        pathData += ` L ${targetX},${targetY}`;
      }
    }
    
    const labelX = customControlPoints.length > 0 ? 
      customControlPoints[Math.floor(customControlPoints.length / 2)].x : 
      (sourceX + targetX) / 2;
    const labelY = customControlPoints.length > 0 ? 
      customControlPoints[Math.floor(customControlPoints.length / 2)].y : 
      (sourceY + targetY) / 2;
    
    return [pathData, labelX, labelY] as const;
  }, [customControlPoints, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition]);

  const [edgePath, labelX, labelY] = createCustomPath();

  // Manejar el arrastre de puntos de control personalizados
  const handleCustomPointMouseDown = useCallback((pointId: string) => (event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    setIsDragging(true);
    
    // Obtener el punto inicial y la posición inicial del mouse
    const currentPoint = customControlPoints.find(p => p.id === pointId);
    if (!currentPoint) return;
    
    const reactFlowElement = document.querySelector('.react-flow');
    if (!reactFlowElement) return;
    

    const startMouseX = event.clientX;
    const startMouseY = event.clientY;
    const startPointX = currentPoint.x;
    const startPointY = currentPoint.y;
    
    // Cambiar cursor del documento
    document.body.style.cursor = 'crosshair';
    
    let movementDirection: 'horizontal' | 'vertical' | null = null;
    const MOVEMENT_THRESHOLD = 10; // Píxeles para determinar dirección
    
    const handleMouseMove = (e: MouseEvent) => {
      // Calcular el desplazamiento del mouse
      const deltaX = e.clientX - startMouseX;
      const deltaY = e.clientY - startMouseY;
      
      // Determinar la dirección de movimiento si aún no se ha determinado
      if (movementDirection === null && (Math.abs(deltaX) > MOVEMENT_THRESHOLD || Math.abs(deltaY) > MOVEMENT_THRESHOLD)) {
        movementDirection = Math.abs(deltaX) > Math.abs(deltaY) ? 'horizontal' : 'vertical';
      }
      
      // Calcular nueva posición basada en la dirección de movimiento
      let newX = startPointX;
      let newY = startPointY;
      
      if (movementDirection === 'horizontal') {
        // Solo movimiento horizontal
        newX = startPointX + deltaX;
        newY = startPointY; // Mantener Y fija
        document.body.style.cursor = 'ew-resize'; // Cursor horizontal
      } else if (movementDirection === 'vertical') {
        // Solo movimiento vertical
        newX = startPointX; // Mantener X fija
        newY = startPointY + deltaY;
        document.body.style.cursor = 'ns-resize'; // Cursor vertical
      } else {
        // Antes de determinar dirección, mostrar cursor de movimiento
        document.body.style.cursor = 'move';
      }
      
      // Aplicar límites para mantener dentro del área visible
      const flowRect = reactFlowElement.getBoundingClientRect();
      newX = Math.max(10, Math.min(newX, flowRect.width - 10));
      newY = Math.max(10, Math.min(newY, flowRect.height - 10));
      
      setCustomControlPoints(prev => 
        prev.map(point => 
          point.id === pointId ? { ...point, x: newX, y: newY } : point
        )
      );
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.cursor = ''; // Restaurar cursor
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [customControlPoints]);

  // Añadir nuevo punto de control al hacer doble clic en la línea
  const handleEdgeDoubleClick = useCallback((event: React.MouseEvent) => {
    if (!selected) return;
    
    event.stopPropagation();
    const rect = (event.target as Element).closest('.react-flow')?.getBoundingClientRect();
    if (!rect) return;
    
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const newPoint: CustomControlPoint = {
      id: `${id}-custom-${Date.now()}`,
      x,
      y,
      type: 'control'
    };
    
    setCustomControlPoints(prev => [...prev, newPoint]);
  }, [selected, id]);

  const getEdgeStyle = () => {
    const relationType = data?.relationType || 'association';
    const isDark = document.documentElement.classList.contains('dark');
    
    const baseStyle = {
      strokeWidth: 2,
      stroke: selected 
        ? '#3b82f6' 
        : isDark ? '#9ca3af' : '#6b7280',
    };
    
    switch (relationType) {
      case 'inheritance':
        return { 
          ...baseStyle, 
          stroke: selected 
            // ? '#60a5fa' 
            // : isDark ? '#60a5fa' : '#3b82f6' 
            ? '#000000'
            : '#000000'
        };
      case 'composition':
        return { 
          ...baseStyle, 
          stroke: selected 
            ? '#000000' 
            : '#000000' 
        };
      case 'aggregation':
        return { 
          ...baseStyle, 
          stroke: selected 
            ? '#000000' 
            : '#000000' 
        };
      case 'many-to-many':
        return { 
          ...baseStyle, 
          strokeDasharray: '5,5', 
          stroke: selected 
            ? '#c084fc' 
            : isDark ? '#c084fc' : '#9333ea' 
        };
      case 'association':
      default:
        return { 
          ...baseStyle, 
          stroke: selected 
            ? '#000000' 
            : '#000000' 
        };
    }
  };

  const getMarkerEnd = () => {
    const relationType = data?.relationType || 'association';
    
    switch (relationType) {
      case 'inheritance':
        return 'url(#inheritance-marker)';
      case 'composition':
        return 'url(#composition-marker)';
      case 'aggregation':
        return 'url(#aggregation-marker)';
      case 'association':
      case 'many-to-many':
      default:
        return 'url(#association-marker)';
    }
  };

  // Los puntos de control se manejan por el hook useEditableEdge

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={getMarkerEnd()}
        style={getEdgeStyle()}
        onDoubleClick={handleEdgeDoubleClick}
      />
      
      <EdgeLabelRenderer>
        {/* Puntos de control personalizados - solo mostrar cuando está seleccionada */}
        {selected && customControlPoints.map(point => (
          <div
            key={point.id}
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${point.x}px, ${point.y}px)`,
              width: point.type === 'control' ? '12px' : '10px',
              height: point.type === 'control' ? '12px' : '10px',
              backgroundColor: point.type === 'control' ? '#3b82f6' : '#10b981',
              border: '2px solid white',
              borderRadius: '50%',
              cursor: isDragging ? 'crosshair' : 'grab',
              zIndex: 1000,
              pointerEvents: 'all',
              boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
              transition: isDragging ? 'none' : 'all 0.2s ease',
            }}
            className={`${isDragging ? 'scale-125' : 'hover:scale-110'}`}
            onMouseDown={handleCustomPointMouseDown(point.id)}
            onMouseEnter={(e) => {
              if (!isDragging) {
                e.currentTarget.style.cursor = 'grab';
              }
            }}
            title={point.type === 'control' ? 'Arrastrar ortogonalmente (horizontal/vertical)' : 'Punto de curva ortogonal'}
          />
        ))}

        {/* Puntos de control originales del hook */}
        {selected && controlPoints.map(point => (
          <ControlPoint
            key={point.id}
            x={point.x}
            y={point.y}
            id={point.id}
            isActive={dragPointId === point.id}
            onMouseDown={(e) => handleMouseDown(point.id)(e)}
            size={6}
          />
        ))}
        
        {/* Source multiplicity */}
        {data?.sourceMultiplicity && (
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${sourceX + 20}px,${sourceY - 20}px)`,
              fontSize: 12,
              pointerEvents: 'all',
              padding: '2px 4px',
              borderRadius: '2px',
            }}
            className="nodrag nopan bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200"
          >
            {data.sourceMultiplicity}
          </div>
        )}
        
        {/* Target multiplicity */}
        {data?.targetMultiplicity && (
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${targetX - 20}px,${targetY - 20}px)`,
              fontSize: 12,
              pointerEvents: 'all',
              padding: '2px 4px',
              borderRadius: '2px',
            }}
            className="nodrag nopan bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200"
          >
            {data.targetMultiplicity}
          </div>
        )}
        
        {/* Edge label */}
        {data?.label && (
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              fontSize: 12,
              pointerEvents: 'all',
              padding: '2px 6px',
              borderRadius: '3px',
            }}
            className="nodrag nopan bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200"
          >
            {data.label}
          </div>
        )}

        {/* Instrucciones de uso */}
        {selected && (
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY + 40}px)`,
              fontSize: 10,
              pointerEvents: 'none',
              padding: '4px 8px',
              borderRadius: '4px',
              opacity: 0.7,
            }}
            className="bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-800"
          >
            Doble clic para añadir puntos • Arrastra ortogonalmente (horizontal/vertical)
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  );
};

export default OrthogonalUMLEdge;