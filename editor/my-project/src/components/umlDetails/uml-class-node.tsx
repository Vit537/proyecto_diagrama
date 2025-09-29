import { memo } from "react";
import { Position } from "@xyflow/react";
import { LabeledHandle } from "@/components/labeled-handle";
import type { UMLClassData } from "@/types/uml";
import "./uml-class-node.css";

export type UMLClassNodeProps = {
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

const UMLClassNode = memo(({ id, data, selected, onClick }: UMLClassNodeProps) => {
  const handleClick = () => {
    onClick?.(id);
  };

  return (
    <div 
      className={`uml-class-node ${selected ? 'selected' : ''}`}
      onClick={handleClick}
    >
      {/* Header with class name */}
      <div className="uml-class-header">
        <h3 className="class-name">{data.className}</h3>
      </div>

      {/* Attributes section */}
      <div className="uml-class-section">
        <div className="section-divider"></div>
        {data.attributes.length > 0 ? (
          data.attributes.map((attr, index) => (
            <div key={index} className="uml-attribute">
              <LabeledHandle
                id={`attr-${attr.name}`}
                title={`${getVisibilitySymbol(attr.visibility)} ${attr.name}: ${attr.type}`}
                type="target"
                position={Position.Left}
                className="attribute-handle"
              />
            </div>
          ))
        ) : (
          <div className="empty-section">No attributes</div>
        )}
      </div>

      {/* Methods section */}
      <div className="uml-class-section">
        <div className="section-divider"></div>
        {data.methods.length > 0 ? (
          data.methods.map((method, index) => (
            <div key={index} className="uml-method">
              <LabeledHandle
                id={`method-${method.name}`}
                title={`${getVisibilitySymbol(method.visibility)} ${method.name}(${method.parameters.map(p => `${p.name}: ${p.type}`).join(', ')}): ${method.returnType}`}
                type="source"
                position={Position.Right}
                className="method-handle"
              />
            </div>
          ))
        ) : (
          <div className="empty-section">No methods</div>
        )}
      </div>

      {/* Connection handles for relationships - Corner and center handles */}
      {/* Top handles */}
      <LabeledHandle
        id="top-left"
        title=""
        type="source"
        position={Position.Top}
        className="connection-handle"
        handleClassName="connection-handle-visible"
        style={{ 
          left: '8px', 
          top: '-6px',
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          backgroundColor: '#dc2626',
          border: '2px solid #ffffff',
          zIndex: 10
        }}
      />
      
      <LabeledHandle
        id="top-center"
        title=""
        type="source"
        position={Position.Top}
        className="connection-handle"
        handleClassName="connection-handle-visible"
        style={{ 
          left: '50%', 
          top: '-6px',
          transform: 'translateX(-50%)',
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          backgroundColor: '#dc2626',
          border: '2px solid #ffffff',
          zIndex: 10
        }}
      />
      
      <LabeledHandle
        id="top-right"
        title=""
        type="source"
        position={Position.Top}
        className="connection-handle"
        handleClassName="connection-handle-visible"
        style={{ 
          right: '8px', 
          top: '-6px',
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          backgroundColor: '#dc2626',
          border: '2px solid #ffffff',
          zIndex: 10
        }}
      />

      {/* Bottom handles */}
      <LabeledHandle
        id="bottom-left"
        title=""
        type="target"
        position={Position.Bottom}
        className="connection-handle"
        handleClassName="connection-handle-visible"
        style={{ 
          left: '8px', 
          bottom: '-6px',
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          backgroundColor: '#dc2626',
          border: '2px solid #ffffff',
          zIndex: 10
        }}
      />
      
      <LabeledHandle
        id="bottom-center"
        title=""
        type="target"
        position={Position.Bottom}
        className="connection-handle"
        handleClassName="connection-handle-visible"
        style={{ 
          left: '50%', 
          bottom: '-6px',
          transform: 'translateX(-50%)',
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          backgroundColor: '#dc2626',
          border: '2px solid #ffffff',
          zIndex: 10
        }}
      />
      
      <LabeledHandle
        id="bottom-right"
        title=""
        type="target"
        position={Position.Bottom}
        className="connection-handle"
        handleClassName="connection-handle-visible"
        style={{ 
          right: '8px', 
          bottom: '-6px',
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          backgroundColor: '#dc2626',
          border: '2px solid #ffffff',
          zIndex: 10
        }}
      />

      {/* Left handles */}
      <LabeledHandle
        id="left-top"
        title=""
        type="target"
        position={Position.Left}
        className="connection-handle"
        handleClassName="connection-handle-visible"
        style={{ 
          top: '8px', 
          left: '-6px',
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          backgroundColor: '#dc2626',
          border: '2px solid #ffffff',
          zIndex: 10
        }}
      />
      
      <LabeledHandle
        id="left-center"
        title=""
        type="target"
        position={Position.Left}
        className="connection-handle"
        handleClassName="connection-handle-visible"
        style={{ 
          top: '50%', 
          left: '-6px',
          transform: 'translateY(-50%)',
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          backgroundColor: '#dc2626',
          border: '2px solid #ffffff',
          zIndex: 10
        }}
      />
      
      <LabeledHandle
        id="left-bottom"
        title=""
        type="target"
        position={Position.Left}
        className="connection-handle"
        handleClassName="connection-handle-visible"
        style={{ 
          bottom: '8px', 
          left: '-6px',
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          backgroundColor: '#dc2626',
          border: '2px solid #ffffff',
          zIndex: 10
        }}
      />

      {/* Right handles */}
      <LabeledHandle
        id="right-top"
        title=""
        type="source"
        position={Position.Right}
        className="connection-handle"
        handleClassName="connection-handle-visible"
        style={{ 
          top: '8px', 
          right: '-6px',
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          backgroundColor: '#dc2626',
          border: '2px solid #ffffff',
          zIndex: 10
        }}
      />
      
      <LabeledHandle
        id="right-center"
        title=""
        type="source"
        position={Position.Right}
        className="connection-handle"
        handleClassName="connection-handle-visible"
        style={{ 
          top: '50%', 
          right: '-6px',
          transform: 'translateY(-50%)',
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          backgroundColor: '#dc2626',
          border: '2px solid #ffffff',
          zIndex: 10
        }}
      />
      
      <LabeledHandle
        id="right-bottom"
        title=""
        type="source"
        position={Position.Right}
        className="connection-handle"
        handleClassName="connection-handle-visible"
        style={{ 
          bottom: '8px', 
          right: '-6px',
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          backgroundColor: '#dc2626',
          border: '2px solid #ffffff',
          zIndex: 10
        }}
      />
    </div>
  );
});

UMLClassNode.displayName = 'UMLClassNode';

export default UMLClassNode;