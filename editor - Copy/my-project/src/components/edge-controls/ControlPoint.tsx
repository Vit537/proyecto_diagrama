import React from 'react';

interface ControlPointProps {
  x: number;
  y: number;
  id: string;
  isActive?: boolean;
  onMouseDown: (event: React.MouseEvent, id: string) => void;
  size?: number;
}

export const ControlPoint: React.FC<ControlPointProps> = ({
  x,
  y,
  id,
  isActive = false,
  onMouseDown,
  size = 8
}) => {
  return (
    <circle
      cx={x}
      cy={y}
      r={size}
      fill={isActive ? "#3b82f6" : "#0066cc"}
      stroke="#ffffff"
      strokeWidth={2}
      style={{ 
        cursor: 'grab',
        opacity: 0.9,
        transition: 'all 0.2s ease'
      }}
      className="control-point"
      onMouseDown={(e) => onMouseDown(e, id)}
    />
  );
};