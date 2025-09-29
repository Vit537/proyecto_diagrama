import React from 'react';
import { Group, Line } from 'react-konva';

interface GridBackgroundProps {
  width: number;
  height: number;
  gridSize: number;
  zoom: number;
}

const GridBackground: React.FC<GridBackgroundProps> = ({
  width,
  height,
  gridSize,
  zoom,
}) => {
  const lines: React.ReactElement[] = [];
  
  // Calculate visible grid based on zoom
  const adjustedGridSize = gridSize;
  const strokeWidth = Math.max(0.5, 1 / zoom);
  const opacity = Math.min(0.3, Math.max(0.1, zoom * 0.3));
  
  // Vertical lines
  for (let x = 0; x <= width; x += adjustedGridSize) {
    lines.push(
      <Line
        key={`v-${x}`}
        points={[x, 0, x, height]}
        stroke="#ddd"
        strokeWidth={strokeWidth}
        opacity={opacity}
      />
    );
  }
  
  // Horizontal lines
  for (let y = 0; y <= height; y += adjustedGridSize) {
    lines.push(
      <Line
        key={`h-${y}`}
        points={[0, y, width, y]}
        stroke="#ddd"
        strokeWidth={strokeWidth}
        opacity={opacity}
      />
    );
  }
  
  // Main axis lines (darker)
  const mainAxisOpacity = Math.min(0.5, Math.max(0.2, zoom * 0.5));
  
  // Vertical center line every 100px
  for (let x = 0; x <= width; x += adjustedGridSize * 5) {
    lines.push(
      <Line
        key={`mv-${x}`}
        points={[x, 0, x, height]}
        stroke="#bbb"
        strokeWidth={strokeWidth * 1.5}
        opacity={mainAxisOpacity}
      />
    );
  }
  
  // Horizontal center line every 100px
  for (let y = 0; y <= height; y += adjustedGridSize * 5) {
    lines.push(
      <Line
        key={`mh-${y}`}
        points={[0, y, width, y]}
        stroke="#bbb"
        strokeWidth={strokeWidth * 1.5}
        opacity={mainAxisOpacity}
      />
    );
  }
  
  return <Group>{lines}</Group>;
};

export default GridBackground;
