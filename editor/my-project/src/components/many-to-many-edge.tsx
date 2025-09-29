import React from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getStraightPath,
  useReactFlow,
  type EdgeProps,
} from '@xyflow/react';
import type { UMLEdgeData } from '@/types/uml';

export type ManyToManyEdgeProps = EdgeProps & {
  data?: UMLEdgeData & {
    sourceLabel?: string;
    targetLabel?: string;
    intermediateTablePosition?: { x: number; y: number };
    intermediateTableId?: string;
  };
};

const ManyToManyEdge: React.FC<ManyToManyEdgeProps> = ({
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
}) => {
  const { getNodes } = useReactFlow();
  
  // Calcular punto medio para la conexión con la tabla intermedia
  const midX = (sourceX + targetX) / 2;
  const midY = (sourceY + targetY) / 2;
  
  const [edgePath] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

  // Buscar la tabla intermedia real si existe
  const nodes = getNodes();
  const intermediateTableName = data?.intermediateTableId;
  const intermediateTable = nodes.find(node => node.id === intermediateTableName);
  
  // Usar la posición real de la tabla intermedia o una posición por defecto
  const intermediateTablePos = intermediateTable 
    ? { 
        x: intermediateTable.position.x + (intermediateTable.width || 200) / 2, 
        y: intermediateTable.position.y + (intermediateTable.height || 100) / 2 
      }
    : data?.intermediateTablePosition || { x: midX, y: midY - 80 };
  
  const intermediateLinePath = `M ${midX} ${midY} L ${intermediateTablePos.x} ${intermediateTablePos.y}`;

  return (
    <>
      {/* Línea principal de asociación */}
      <BaseEdge 
        path={edgePath}
        style={{
          stroke: '#000000',
          strokeWidth: 2,
        }}
      />
      
      {/* Línea segmentada hacia tabla intermedia */}
      <path
        d={intermediateLinePath}
        style={{
          stroke: '#000000',
          strokeWidth: 2,
          strokeDasharray: '8,4', // Línea segmentada
        }}
      />
      
      {/* Punto de conexión para tabla intermedia */}
      <circle
        cx={intermediateTablePos.x}
        cy={intermediateTablePos.y}
        r={5}
        fill="#000000"
        stroke="#ffffff"
        strokeWidth={2}
      />
      
      {/* Punto medio de la línea principal */}
      <circle
        cx={midX}
        cy={midY}
        r={4}
        fill="#000000"
        stroke="#ffffff"
        strokeWidth={1}
      />
      
      <EdgeLabelRenderer>
        {/* Etiquetas de multiplicidad */}
        {data?.sourceLabel && (
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${sourceX + 20}px,${sourceY - 15}px)`,
              fontSize: 12,
              fontWeight: 'bold',
              pointerEvents: 'all',
              background: 'white',
              padding: '2px 4px',
              borderRadius: '2px',
              border: '1px solid #e5e7eb',
            }}
            className="nodrag nopan"
          >
            {data.sourceLabel}
          </div>
        )}
        
        {data?.targetLabel && (
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${targetX - 20}px,${targetY - 15}px)`,
              fontSize: 12,
              fontWeight: 'bold',
              pointerEvents: 'all',
              background: 'white',
              padding: '2px 4px',
              borderRadius: '2px',
              border: '1px solid #e5e7eb',
            }}
            className="nodrag nopan"
          >
            {data.targetLabel}
          </div>
        )}
        
        {/* Etiqueta de la relación */}
        {data?.label && (
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${midX}px,${midY + 20}px)`,
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

export default ManyToManyEdge;