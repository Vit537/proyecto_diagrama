import React from 'react';
import { Group, Circle, Text, Path } from 'react-konva';
import { ActiveUser } from '../../types';

interface CursorIndicatorProps {
  user: ActiveUser;
  position: { x: number; y: number };
  zoom: number;
}

const CursorIndicator: React.FC<CursorIndicatorProps> = ({
  user,
  position,
  zoom,
}) => {
  // Generate a consistent color based on user ID
  const getUserColor = (userId: string) => {
    const colors = [
      '#1976d2', '#d32f2f', '#388e3c', '#f57c00',
      '#7b1fa2', '#0288d1', '#f57c00', '#5d4037'
    ];
    const index = userId.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  const color = user.color || getUserColor(user.id);
  const cursorSize = 20 / zoom;
  const textSize = 12 / zoom;
  const userName = user.first_name || user.email.split('@')[0];

  return (
    <Group
      x={position.x}
      y={position.y}
    >
      {/* Cursor Arrow */}
      <Path
        data="M0 0 L0 16 L4 12 L7 18 L10 16 L7 10 L12 10 Z"
        fill={color}
        stroke="white"
        strokeWidth={2 / zoom}
        scale={{
          x: 1 / zoom,
          y: 1 / zoom,
        }}
      />
      
      {/* User Name Label */}
      <Group
        x={cursorSize + 5}
        y={-5}
      >
        {/* Background */}
        <Text
          text={userName}
          fontSize={textSize}
          fontFamily="Arial"
          fill="white"
          stroke={color}
          strokeWidth={3 / zoom}
          padding={4 / zoom}
        />
        
        {/* Text */}
        <Text
          text={userName}
          fontSize={textSize}
          fontFamily="Arial"
          fill={color}
          padding={4 / zoom}
        />
      </Group>
      
      {/* Pulse Animation Circle */}
      <Circle
        x={5 / zoom}
        y={5 / zoom}
        radius={3 / zoom}
        fill={color}
        opacity={0.5}
      />
    </Group>
  );
};

export default CursorIndicator;
