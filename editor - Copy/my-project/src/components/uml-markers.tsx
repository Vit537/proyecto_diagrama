import React from 'react';

export const UMLMarkers: React.FC = () => {
  return (
    <defs>
      {/* Association marker - no marker, just line */}
      <marker
        id="association-marker"
        markerWidth="0"
        markerHeight="0"
        refX="0"
        refY="0"
        orient="auto"
        markerUnits="strokeWidth"
      >
        {/* Empty - no visual marker */}
      </marker>

      {/* Inheritance marker - empty triangle */}
      <marker
        id="inheritance-marker"
        markerWidth="15"
        markerHeight="15"
        refX="12"
        refY="6"
        orient="auto"
        markerUnits="strokeWidth"
      >
        <path
          d="M0,0 L0,12 L12,6 z"
          fill="white"
          stroke="#000000"
          strokeWidth="2"
        />
      </marker>

      {/* Composition marker - filled diamond */}
      <marker
        id="composition-marker"
        markerWidth="15"
        markerHeight="15"
        refX="12"
        refY="6"
        orient="auto"
        markerUnits="strokeWidth"
      >
        <path
          d="M0,6 L6,0 L12,6 L6,12 z"
          // fill="#dc2626"
          // stroke="#dc2626"
          fill="#000000"
          stroke="#000000"
          strokeWidth="1"
        />
      </marker>

      {/* Aggregation marker - empty diamond */}
      <marker
        id="aggregation-marker"
        markerWidth="15"
        markerHeight="15"
        refX="12"
        refY="6"
        orient="auto"
        markerUnits="strokeWidth"
      >
        <path
          d="M0,6 L6,0 L12,6 L6,12 z"
          fill="white"
          // stroke="#16a34a"
          stroke="#000000"
          strokeWidth="2"
        />
      </marker>
    </defs>
  );
};