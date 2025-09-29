import React, { useEffect } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from '@xyflow/react';
import type { UMLEdgeData } from '@/types/uml';
import { useEditableEdge } from '@/hooks/useEditableEdge';
import { ControlPoint } from '@/components/edge-controls/ControlPoint';

export type UMLEdgeProps = EdgeProps & {
  data?: UMLEdgeData;
};

const UMLEdge: React.FC<UMLEdgeProps> = ({
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
    isDragging,
    dragPointId,
    initializeControlPoints,
    handleMouseDown
  } = useEditableEdge(id || 'edge');

  // Inicializar punto de control cuando cambian las coordenadas
  useEffect(() => {
    initializeControlPoints(sourceX, sourceY, targetX, targetY);
  }, [sourceX, sourceY, targetX, targetY, initializeControlPoints]);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature: 0.3
  });

  const getEdgeStyle = () => {
    const relationType = data?.relationType || 'association';
    
    switch (relationType) {
      case 'inheritance':
        return {
          stroke: '#3b82f6',
          strokeWidth: 2,
          strokeDasharray: 'none',
        };
      case 'composition':
        return {
          stroke: '#000000',
          strokeWidth: 2,
          strokeDasharray: 'none',
        };
      case 'aggregation':
        return {
          stroke: '#000000',
          strokeWidth: 2,
          strokeDasharray: 'none',
        };
      case 'association':
      default:
        return {
          stroke: '#000000',
          strokeWidth: 2,
          strokeDasharray: 'none',
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
      default:
        return 'url(#association-marker)';
    }
  };

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={getMarkerEnd()}
        style={getEdgeStyle()}
      />
      
      {/* Puntos de control manipulables - solo mostrar si la edge está seleccionada */}
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
      
      <EdgeLabelRenderer>
        {/* Source multiplicity */}
        {data?.sourceMultiplicity && (
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${sourceX + 20}px,${sourceY - 20}px)`,
              fontSize: 12,
              pointerEvents: 'all',
              background: 'white',
              padding: '2px 4px',
              borderRadius: '2px',
              border: '1px solid #e5e7eb',
            }}
            className="nodrag nopan"
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
              background: 'white',
              padding: '2px 4px',
              borderRadius: '2px',
              border: '1px solid #e5e7eb',
            }}
            className="nodrag nopan"
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
              background: 'white',
              padding: '2px 6px',
              borderRadius: '3px',
              border: '1px solid #e5e7eb',
            }}
            className="nodrag nopan"
          >
            {data.label}
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  );
};

export default UMLEdge;