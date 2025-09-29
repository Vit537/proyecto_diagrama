import React, { useState, useCallback, memo, useRef } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  useReactFlow,
  type EdgeProps,
} from '@xyflow/react';
import "./improved-uml-styles.css";

interface ControlPoint {
  x: number;
  y: number;
  id: string;
}

interface ImprovedUMLEdgeData {
  relationship?: 'association' | 'inheritance' | 'composition' | 'aggregation' | 'dependency';
  sourceMultiplicity?: string;
  targetMultiplicity?: string;
  label?: string;
  isReconnectable?: boolean;
  customPoints?: ControlPoint[];
}

export type ImprovedUMLEdgeProps = EdgeProps & {
  data?: ImprovedUMLEdgeData;
};

const ImprovedUMLEdge = memo(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style = {},
  data = {},
  selected,
}: ImprovedUMLEdgeProps) => {
  const { setEdges } = useReactFlow();
  const [isDragging, setIsDragging] = useState(false);
  const [dragPointId, setDragPointId] = useState<string | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const edgeRef = useRef<SVGPathElement>(null);

  // Estado para reconexión
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [reconnectionPoint, setReconnectionPoint] = useState<'source' | 'target' | null>(null);
  const [potentialTarget, setPotentialTarget] = useState<string | null>(null);

  // Puntos de control personalizados
  const [customPoints, setCustomPoints] = useState<ControlPoint[]>(
    (data as ImprovedUMLEdgeData)?.customPoints || []
  );

  // Calcular el path ortogonal mejorado
  const calculateOrthogonalPath = useCallback(() => {
    if (customPoints.length === 0) {
      // Path ortogonal básico
      const midX = (sourceX + targetX) / 2;
      const midY = (sourceY + targetY) / 2;
      
      // Decidir si hacer routing horizontal o vertical primero
      const deltaX = Math.abs(targetX - sourceX);
      const deltaY = Math.abs(targetY - sourceY);
      
      if (deltaX > deltaY) {
        // Routing horizontal primero
        return `M ${sourceX} ${sourceY} L ${midX} ${sourceY} L ${midX} ${targetY} L ${targetX} ${targetY}`;
      } else {
        // Routing vertical primero
        return `M ${sourceX} ${sourceY} L ${sourceX} ${midY} L ${targetX} ${midY} L ${targetX} ${targetY}`;
      }
    } else {
      // Path con puntos de control personalizados
      let path = `M ${sourceX} ${sourceY}`;
      customPoints.forEach(point => {
        path += ` L ${point.x} ${point.y}`;
      });
      path += ` L ${targetX} ${targetY}`;
      return path;
    }
  }, [sourceX, sourceY, targetX, targetY, customPoints]);

  const orthogonalPath = calculateOrthogonalPath();
  const edgeData = data as ImprovedUMLEdgeData;

  // Obtener marcadores según el tipo de relación
  const getMarkerEnd = () => {
    switch (edgeData?.relationship) {
      case 'inheritance':
        return 'url(#inheritance-marker)';
      case 'composition':
        return 'url(#composition-marker)';
      case 'aggregation':
        return 'url(#aggregation-marker)';
      case 'dependency':
        return 'url(#dependency-marker)';
      default:
        return 'url(#association-marker)';
    }
  };

  // Manejar click en punto de reconexión
  const handleReconnectionPointMouseDown = useCallback((
    event: React.MouseEvent,
    point: 'source' | 'target'
  ) => {
    event.stopPropagation();
    setIsReconnecting(true);
    setReconnectionPoint(point);
    
    const handleMouseMove = (e: MouseEvent) => {
      // Encontrar nodo bajo el cursor
      const elementsUnderCursor = document.elementsFromPoint(e.clientX, e.clientY);
      const nodeElement = elementsUnderCursor.find(el => 
        el.getAttribute('data-testid') === 'rf__node'
      );
      
      if (nodeElement) {
        const nodeId = nodeElement.getAttribute('data-id');
        setPotentialTarget(nodeId);
      } else {
        setPotentialTarget(null);
      }
    };

    const handleMouseUp = () => {
      if (potentialTarget && potentialTarget !== (point === 'source' ? (id as string).split('-')[0] : (id as string).split('-')[1])) {
        // Realizar la reconexión
        setEdges(edges => edges.map(edge => {
          if (edge.id === id) {
            return {
              ...edge,
              [point]: potentialTarget,
            };
          }
          return edge;
        }));
      }
      
      setIsReconnecting(false);
      setReconnectionPoint(null);
      setPotentialTarget(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [id, setEdges, potentialTarget]);

  // Manejar arrastre de puntos de control
  const handleControlPointMouseDown = useCallback((
    event: React.MouseEvent,
    pointId: string
  ) => {
    event.stopPropagation();
    setIsDragging(true);
    setDragPointId(pointId);

    const handleMouseMove = (e: MouseEvent) => {
      const point = customPoints.find(p => p.id === pointId);
      if (!point) return;

      setCustomPoints(prev => prev.map(p => 
        p.id === pointId 
          ? { ...p, x: e.clientX - 100, y: e.clientY - 100 } // Ajustar por offset del canvas
          : p
      ));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setDragPointId(null);
      
      // Actualizar los datos del edge
      setEdges(edges => edges.map(edge => {
        if (edge.id === id) {
          return {
            ...edge,
            data: {
              ...edge.data,
              customPoints: customPoints
            }
          };
        }
        return edge;
      }));

      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [customPoints, id, setEdges]);

  // Agregar punto de control en doble clic
  const handleDoubleClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    
    const rect = edgeRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const newPoint: ControlPoint = {
      id: `control-${Date.now()}`,
      x: x + rect.left,
      y: y + rect.top
    };

    setCustomPoints(prev => [...prev, newPoint]);
  }, []);

  // Estilo del edge
  const edgeStyle = {
    ...(style || {}),
    stroke: '#000000',
    strokeWidth: selected ? 3 : 2,
    strokeDasharray: edgeData?.relationship === 'dependency' ? '5,5' : 'none',
  };

  // Calcular posición de las etiquetas de multiplicidad
  const labelDistance = 20;
  const sourceAngle = Math.atan2(targetY - sourceY, targetX - sourceX);
  const targetAngle = sourceAngle + Math.PI;

  const sourceLabelX = sourceX + Math.cos(sourceAngle) * labelDistance;
  const sourceLabelY = sourceY + Math.sin(sourceAngle) * labelDistance;
  const targetLabelX = targetX + Math.cos(targetAngle) * labelDistance;
  const targetLabelY = targetY + Math.sin(targetAngle) * labelDistance;

  return (
    <>
      {/* Definir marcadores SVG */}
      <defs>
        <marker
          id="association-marker"
          markerWidth="0"
          markerHeight="0"
          refX="0"
          refY="0"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <polygon points="0,0 0,6 9,3" fill="#000000" />
        </marker>
        
        <marker
          id="inheritance-marker"
          markerWidth="12"
          markerHeight="12"
          refX="10"
          refY="6"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <polygon points="0,0 0,12 10,6" fill="white" stroke="#000000" strokeWidth="2" />
        </marker>
        
        <marker
          id="composition-marker"
          markerWidth="12"
          markerHeight="8"
          refX="10"
          refY="4"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <polygon points="0,4 4,0 8,4 4,8" fill="#000000" />
        </marker>

        <marker
          id="aggregation-marker"
          markerWidth="12"
          markerHeight="8"
          refX="10"
          refY="4"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <polygon points="0,4 4,0 8,4 4,8" fill="white" stroke="#000000" strokeWidth="2" />
        </marker>

        <marker
          id="dependency-marker"
          markerWidth="10"
          markerHeight="10"
          refX="8"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <polygon points="0,0 0,6 9,3" fill="#000000" />
        </marker>
      </defs>

      {/* Path principal del edge */}
      <BaseEdge 
        path={orthogonalPath} 
        style={edgeStyle}
        markerEnd={getMarkerEnd()}
      />

      {/* Path invisible para detección de hover */}
      <path
        ref={edgeRef}
        d={orthogonalPath}
        fill="none"
        stroke="transparent"
        strokeWidth="12"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onDoubleClick={handleDoubleClick}
        style={{ cursor: 'pointer' }}
      />

      <EdgeLabelRenderer>
        {/* Puntos de reconexión */}
        {(selected || isHovering) && edgeData?.isReconnectable !== false && (
          <>
            {/* Punto de reconexión en el source */}
            <div
              style={{
                position: 'absolute',
                transform: `translate(-50%, -50%) translate(${sourceX}px, ${sourceY}px)`,
                pointerEvents: 'all',
              }}
              onMouseDown={(e) => handleReconnectionPointMouseDown(e, 'source')}
            >
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  background: isReconnecting && reconnectionPoint === 'source' ? '#10b981' : '#3b82f6',
                  border: '2px solid white',
                  borderRadius: '50%',
                  cursor: 'grab',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                }}
              />
            </div>

            {/* Punto de reconexión en el target */}
            <div
              style={{
                position: 'absolute',
                transform: `translate(-50%, -50%) translate(${targetX}px, ${targetY}px)`,
                pointerEvents: 'all',
              }}
              onMouseDown={(e) => handleReconnectionPointMouseDown(e, 'target')}
            >
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  background: isReconnecting && reconnectionPoint === 'target' ? '#10b981' : '#3b82f6',
                  border: '2px solid white',
                  borderRadius: '50%',
                  cursor: 'grab',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                }}
              />
            </div>
          </>
        )}

        {/* Puntos de control personalizados */}
        {customPoints.map((point) => (
          <div
            key={point.id}
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${point.x}px, ${point.y}px)`,
              pointerEvents: 'all',
            }}
            onMouseDown={(e) => handleControlPointMouseDown(e, point.id)}
          >
            <div
              style={{
                width: '10px',
                height: '10px',
                background: '#ef4444',
                border: '2px solid white',
                borderRadius: '50%',
                cursor: isDragging && dragPointId === point.id ? 'grabbing' : 'grab',
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                opacity: selected || isHovering ? 1 : 0,
                transition: 'opacity 0.2s ease',
              }}
            />
          </div>
        ))}

        {/* Etiquetas de multiplicidad */}
        {edgeData?.sourceMultiplicity && (
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${sourceLabelX}px, ${sourceLabelY}px)`,
              pointerEvents: 'none',
              background: 'white',
              padding: '2px 4px',
              borderRadius: '3px',
              fontSize: '12px',
              fontWeight: 'bold',
              border: '1px solid #ccc',
            }}
          >
            {edgeData?.sourceMultiplicity}
          </div>
        )}

        {edgeData?.targetMultiplicity && (
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${targetLabelX}px, ${targetLabelY}px)`,
              pointerEvents: 'none',
              background: 'white',
              padding: '2px 4px',
              borderRadius: '3px',
              fontSize: '12px',
              fontWeight: 'bold',
              border: '1px solid #ccc',
            }}
          >
            {edgeData?.targetMultiplicity}
          </div>
        )}

        {/* Etiqueta central */}
        {edgeData?.label && (
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${(sourceX + targetX) / 2}px, ${(sourceY + targetY) / 2 - 15}px)`,
              pointerEvents: 'none',
              background: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 'bold',
              border: '1px solid #ccc',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            {edgeData?.label}
          </div>
        )}

        {/* Indicadores de estado */}
        {isReconnecting && (
          <div
            style={{
              position: 'absolute',
              top: '10px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#10b981',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              pointerEvents: 'none',
              zIndex: 1000,
            }}
          >
            Arrastra hacia un nodo para reconectar
          </div>
        )}

        {potentialTarget && (
          <div
            style={{
              position: 'absolute',
              top: '30px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#3b82f6',
              color: 'white',
              padding: '2px 6px',
              borderRadius: '3px',
              fontSize: '10px',
              pointerEvents: 'none',
              zIndex: 1000,
            }}
          >
            Conectar con: {potentialTarget}
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  );
});

ImprovedUMLEdge.displayName = 'ImprovedUMLEdge';

export default ImprovedUMLEdge;