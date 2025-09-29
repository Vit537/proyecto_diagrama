import React, { useState, useEffect } from 'react';
import { Group, Line, Circle, Path, Text } from 'react-konva';
import { DiagramElement } from '../../../types';
import Konva from 'konva';

interface UMLRelationshipNodeProps {
  element: DiagramElement;
  isSelected: boolean;
  isLocked: boolean;
  zoom: number;
  onUpdate: (elementId: string, updates: Partial<DiagramElement>) => void;
  onClick: (element: DiagramElement) => void;
}

const UMLRelationshipNode: React.FC<UMLRelationshipNodeProps> = ({
  element,
  isSelected,
  isLocked,
  zoom,
  onUpdate,
  onClick,
}) => {
  const [isDragging, setIsDragging] = useState(false);

  // Style properties
  const strokeWidth = Math.max(1, 2 / zoom);
  const fontSize = Math.max(8, 12 / zoom);

  // Relationship data
  const startPoint = element.data?.startPoint || element.position;
  const endPoint = element.data?.endPoint || { 
    x: element.position.x + element.size.width, 
    y: element.position.y + element.size.height 
  };
  const relType = element.data?.relationshipType || 'association';
  const label = element.data?.label || '';
  const multiplicityStart = element.data?.multiplicityStart || '';
  const multiplicityEnd = element.data?.multiplicityEnd || '';

  // Calculate line properties
  const points = [startPoint.x, startPoint.y, endPoint.x, endPoint.y];
  const angle = Math.atan2(endPoint.y - startPoint.y, endPoint.x - startPoint.x);
  const midX = (startPoint.x + endPoint.x) / 2;
  const midY = (startPoint.y + endPoint.y) / 2;

  // Colors based on state
  const strokeColor = isSelected ? '#1976d2' : (isLocked ? '#ff9800' : '#333333');
  const fillColor = isSelected ? '#1976d2' : '#333333';

  // Handle drag
  const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    const deltaX = e.target.x() - element.position.x;
    const deltaY = e.target.y() - element.position.y;
    
    onUpdate(element.id, {
      position: { x: e.target.x(), y: e.target.y() },
      data: {
        ...element.data,
        startPoint: { 
          x: startPoint.x + deltaX, 
          y: startPoint.y + deltaY 
        },
        endPoint: { 
          x: endPoint.x + deltaX, 
          y: endPoint.y + deltaY 
        },
      }
    });
  };

  const handleClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    onClick(element);
  };

  // Handle multiplicity change
  const handleMultiplicityChange = (key: 'multiplicityStart' | 'multiplicityEnd', value: string) => {
    onUpdate(element.id, {
      data: {
        ...element.data,
        [key]: value,
      },
    });
  };

  // Update points dynamically when connected classes move
  useEffect(() => {
    if (element.data?.sourceId && element.data?.targetId) {
      const sourceElement = document.getElementById(element.data.sourceId);
      const targetElement = document.getElementById(element.data.targetId);

      if (sourceElement && targetElement) {
        const sourceRect = sourceElement.getBoundingClientRect();
        const targetRect = targetElement.getBoundingClientRect();

        onUpdate(element.id, {
          data: {
            ...element.data,
            startPoint: { x: sourceRect.x + sourceRect.width / 2, y: sourceRect.y + sourceRect.height / 2 },
            endPoint: { x: targetRect.x + targetRect.width / 2, y: targetRect.y + targetRect.height / 2 },
          },
        });
      }
    }
  }, [element.data?.sourceId, element.data?.targetId]);

  // Render different arrow heads based on relationship type
  const renderArrowHead = () => {
    const arrowLength = 15 / zoom;
    const arrowWidth = 8 / zoom;
    
    switch (relType) {
      case 'inheritance':
        // Hollow triangle
        return (
          <Group
            x={endPoint.x}
            y={endPoint.y}
            rotation={(angle * 180) / Math.PI}
          >
            <Path
              data={`M 0 0 L ${-arrowLength} ${-arrowWidth/2} L ${-arrowLength} ${arrowWidth/2} Z`}
              fill="white"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
          </Group>
        );
      
      case 'realization':
        // Hollow triangle with dashed line
        return (
          <Group
            x={endPoint.x}
            y={endPoint.y}
            rotation={(angle * 180) / Math.PI}
          >
            <Path
              data={`M 0 0 L ${-arrowLength} ${-arrowWidth/2} L ${-arrowLength} ${arrowWidth/2} Z`}
              fill="white"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
          </Group>
        );
      
      case 'aggregation':
        // Hollow diamond
        return (
          <Group
            x={startPoint.x}
            y={startPoint.y}
            rotation={(angle * 180) / Math.PI}
          >
            <Path
              data={`M 0 0 L ${arrowLength/2} ${-arrowWidth/2} L ${arrowLength} 0 L ${arrowLength/2} ${arrowWidth/2} Z`}
              fill="white"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
          </Group>
        );
      
      case 'composition':
        // Filled diamond
        return (
          <Group
            x={startPoint.x}
            y={startPoint.y}
            rotation={(angle * 180) / Math.PI}
          >
            <Path
              data={`M 0 0 L ${arrowLength/2} ${-arrowWidth/2} L ${arrowLength} 0 L ${arrowLength/2} ${arrowWidth/2} Z`}
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
          </Group>
        );
      
      case 'association':
      default:
        // Simple arrow
        return (
          <Group
            x={endPoint.x}
            y={endPoint.y}
            rotation={(angle * 180) / Math.PI}
          >
            <Path
              data={`M 0 0 L ${-arrowLength} ${-arrowWidth/2} L ${-arrowLength} ${arrowWidth/2} Z`}
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
          </Group>
        );
    }
  };

  return (
    <Group
      x={element.position.x}
      y={element.position.y}
      draggable={!isLocked}
      onDragMove={handleDragMove}
      onClick={handleClick}
    >
      {/* Main Line */}
      <Line
        points={[
          startPoint.x - element.position.x, 
          startPoint.y - element.position.y,
          endPoint.x - element.position.x, 
          endPoint.y - element.position.y
        ]}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        dash={relType === 'realization' ? [5 / zoom, 5 / zoom] : undefined}
      />

      {/* Arrow Head */}
      <Group x={-element.position.x} y={-element.position.y}>
        {renderArrowHead()}
      </Group>

      {/* Relationship Label */}
      {label && (
        <Text
          x={midX - element.position.x - (label.length * fontSize) / 4}
          y={midY - element.position.y - fontSize - 5}
          text={label}
          fontSize={fontSize}
          fill={strokeColor}
          fontFamily="Arial"
        />
      )}

      {/* Multiplicity Labels */}
      {multiplicityStart && (
        <Text
          x={startPoint.x - element.position.x + 10}
          y={startPoint.y - element.position.y - fontSize - 5}
          text={multiplicityStart}
          fontSize={fontSize * 0.8}
          fill="#666"
          fontFamily="Arial"
          onClick={() => handleMultiplicityChange('multiplicityStart', prompt('Set Start Multiplicity', multiplicityStart) || multiplicityStart)}
        />
      )}

      {multiplicityEnd && (
        <Text
          x={endPoint.x - element.position.x - 20}
          y={endPoint.y - element.position.y - fontSize - 5}
          text={multiplicityEnd}
          fontSize={fontSize * 0.8}
          fill="#666"
          fontFamily="Arial"
          onClick={() => handleMultiplicityChange('multiplicityEnd', prompt('Set End Multiplicity', multiplicityEnd) || multiplicityEnd)}
        />
      )}

      {/* Selection Handles */}
      {isSelected && !isLocked && (
        <Group>
          {/* Start point handle */}
          <Circle
            x={startPoint.x - element.position.x}
            y={startPoint.y - element.position.y}
            radius={4 / zoom}
            fill="#1976d2"
            stroke="white"
            strokeWidth={2 / zoom}
            draggable
            onDragMove={(e) => {
              onUpdate(element.id, {
                data: {
                  ...element.data,
                  startPoint: { 
                    x: e.target.x() + element.position.x, 
                    y: e.target.y() + element.position.y 
                  }
                }
              });
            }}
          />
          
          {/* End point handle */}
          <Circle
            x={endPoint.x - element.position.x}
            y={endPoint.y - element.position.y}
            radius={4 / zoom}
            fill="#1976d2"
            stroke="white"
            strokeWidth={2 / zoom}
            draggable
            onDragMove={(e) => {
              onUpdate(element.id, {
                data: {
                  ...element.data,
                  endPoint: { 
                    x: e.target.x() + element.position.x, 
                    y: e.target.y() + element.position.y 
                  }
                }
              });
            }}
          />
        </Group>
      )}

      {/* Lock indicator */}
      {isLocked && (
        <Group>
          <Circle
            x={midX - element.position.x}
            y={midY - element.position.y}
            radius={8 / zoom}
            fill="#ff9800"
            stroke="#f57c00"
            strokeWidth={2 / zoom}
          />
          <Text
            x={midX - element.position.x - 4}
            y={midY - element.position.y - 4}
            text="🔒"
            fontSize={8}
          />
        </Group>
      )}
    </Group>
  );
};

export default UMLRelationshipNode;
