import React, { memo, useState } from "react";
import { Handle, Position } from "@xyflow/react";
import type { UMLClassData } from "@/types/uml";
import "./improved-uml-styles.css";

export type ImprovedUMLClassNodeProps = {
  id: string;
  data: UMLClassData;
  selected?: boolean;
  onClick?: (id: string) => void;
};

const getVisibilitySymbol = (visibility: string) => {
  switch (visibility) {
    case 'public': return '+';
    case 'private': return '-';
    case 'protected': return '#';
    case 'package': return '~';
    default: return '+';
  }
};

const ImprovedUMLClassNode = memo(({ id, data, selected, onClick }: ImprovedUMLClassNodeProps) => {
  const [isHovering, setIsHovering] = useState(false);

  const handleClick = () => {
    onClick?.(id);
  };

  const showHandles = selected || isHovering;
  const handleClassName = `improved-connection-handle ${showHandles ? 'visible' : 'invisible'}`;

  return (
    <div 
      className={`improved-uml-class-node ${selected ? 'selected' : ''}`}
      onClick={handleClick}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Header con el nombre de la clase */}
      <div className="improved-uml-class-header">
        <h3 className="improved-class-name">
          {data.className}
        </h3>
      </div>

      {/* Sección de Atributos */}
      <div className="improved-uml-section">
        {data.attributes.length > 0 ? (
          data.attributes.map((attr, index) => (
            <div key={index} className="improved-uml-item">
              <span>{getVisibilitySymbol(attr.visibility)} {attr.name}: {attr.type}</span>
            </div>
          ))
        ) : (
          <div className="improved-empty-section">
            No attributes
          </div>
        )}
      </div>

      {/* Sección de Métodos */}
      <div className="improved-uml-section">
        {data.methods.length > 0 ? (
          data.methods.map((method, index) => (
            <div key={index} className="improved-uml-item">
              <span>
                {getVisibilitySymbol(method.visibility)} {method.name}({method.parameters.map(p => `${p.name}: ${p.type}`).join(', ')}): {method.returnType}
              </span>
            </div>
          ))
        ) : (
          <div className="improved-empty-section">
            No methods
          </div>
        )}
      </div>

      {/* Handles de Conexión - 3 por lado (25%, 50%, 75%) */}
      
      {/* Handles Superiores */}
      <Handle
        id="top-25"
        type="source"
        position={Position.Top}
        style={{ left: '25%', top: '-6px' }}
        className={handleClassName}
      />
      
      <Handle
        id="top-50"
        type="source"
        position={Position.Top}
        style={{ left: '50%', top: '-6px', transform: 'translateX(-50%)' }}
        className={handleClassName}
      />
      
      <Handle
        id="top-75"
        type="source"
        position={Position.Top}
        style={{ left: '75%', top: '-6px' }}
        className={handleClassName}
      />

      {/* Handles Inferiores */}
      <Handle
        id="bottom-25"
        type="target"
        position={Position.Bottom}
        style={{ left: '25%', bottom: '-6px' }}
        className={handleClassName}
      />
      
      <Handle
        id="bottom-50"
        type="target"
        position={Position.Bottom}
        style={{ left: '50%', bottom: '-6px', transform: 'translateX(-50%)' }}
        className={handleClassName}
      />
      
      <Handle
        id="bottom-75"
        type="target"
        position={Position.Bottom}
        style={{ left: '75%', bottom: '-6px' }}
        className={handleClassName}
      />

      {/* Handles Izquierdos */}
      <Handle
        id="left-25"
        type="target"
        position={Position.Left}
        style={{ top: '25%', left: '-6px' }}
        className={handleClassName}
      />
      
      <Handle
        id="left-50"
        type="target"
        position={Position.Left}
        style={{ top: '50%', left: '-6px', transform: 'translateY(-50%)' }}
        className={handleClassName}
      />
      
      <Handle
        id="left-75"
        type="target"
        position={Position.Left}
        style={{ top: '75%', left: '-6px' }}
        className={handleClassName}
      />

      {/* Handles Derechos */}
      <Handle
        id="right-25"
        type="source"
        position={Position.Right}
        style={{ top: '25%', right: '-6px' }}
        className={handleClassName}
      />
      
      <Handle
        id="right-50"
        type="source"
        position={Position.Right}
        style={{ top: '50%', right: '-6px', transform: 'translateY(-50%)' }}
        className={handleClassName}
      />
      
      <Handle
        id="right-75"
        type="source"
        position={Position.Right}
        style={{ top: '75%', right: '-6px' }}
        className={handleClassName}
      />

      {/* Indicador de que el nodo es seleccionable */}
      {showHandles && (
        <div 
          className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-3 py-1 rounded pointer-events-none opacity-90 z-30"
          style={{ fontSize: '11px' }}
        >
          3 puntos por lado: arrastrar para conectar
        </div>
      )}
    </div>
  );
});

ImprovedUMLClassNode.displayName = 'ImprovedUMLClassNode';

export default ImprovedUMLClassNode;