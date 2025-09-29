import { useState, useCallback, useRef } from 'react';

interface ControlPoint {
  id: string;
  x: number;
  y: number;
}

interface EditableEdgeState {
  controlPoints: ControlPoint[];
  isDragging: boolean;
  dragPointId: string | null;
  initializeControlPoints: (sourceX: number, sourceY: number, targetX: number, targetY: number) => void;
  updateControlPoint: (id: string, x: number, y: number) => void;
  addControlPoint: (x: number, y: number) => void;
  removeControlPoint: (id: string) => void;
  handleMouseDown: (pointId: string) => (event: React.MouseEvent) => void;
  resetControlPoints: () => void;
}

export const useEditableEdge = (edgeId: string): EditableEdgeState => {
  const [controlPoints, setControlPoints] = useState<ControlPoint[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPointId, setDragPointId] = useState<string | null>(null);
  const isDraggingRef = useRef(false);

  // Inicializar puntos de control basados en las posiciones de origen y destino
  const initializeControlPoints = useCallback((sourceX: number, sourceY: number, targetX: number, targetY: number) => {
    // Solo inicializar si no hay puntos de control ya existentes
    if (controlPoints.length === 0) {
      const midX = (sourceX + targetX) / 2;
      const midY = (sourceY + targetY) / 2;
      
      const initialPoints: ControlPoint[] = [
        {
          id: `${edgeId}-control-center`,
          x: midX,
          y: midY,
        }
      ];
      
      setControlPoints(initialPoints);
    }
  }, [edgeId, controlPoints.length]);

  // Actualizar la posición de un punto de control específico
  const updateControlPoint = useCallback((id: string, x: number, y: number) => {
    setControlPoints(prev => 
      prev.map(point => 
        point.id === id ? { ...point, x, y } : point
      )
    );
  }, []);

  // Añadir un nuevo punto de control
  const addControlPoint = useCallback((x: number, y: number) => {
    const newPoint: ControlPoint = {
      id: `${edgeId}-control-${Date.now()}`,
      x,
      y,
    };
    
    setControlPoints(prev => [...prev, newPoint]);
  }, [edgeId]);

  // Eliminar un punto de control
  const removeControlPoint = useCallback((id: string) => {
    setControlPoints(prev => prev.filter(point => point.id !== id));
  }, []);

  // Resetear todos los puntos de control
  const resetControlPoints = useCallback(() => {
    setControlPoints([]);
  }, []);

  // Manejar el inicio del arrastre de un punto de control
  const handleMouseDown = useCallback((pointId: string) => (event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    
    setIsDragging(true);
    setDragPointId(pointId);
    isDraggingRef.current = true;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      
      // Obtener las coordenadas relativas al contenedor de React Flow
      const reactFlowElement = document.querySelector('.react-flow');
      if (!reactFlowElement) return;
      
      const rect = reactFlowElement.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      updateControlPoint(pointId, x, y);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setDragPointId(null);
      isDraggingRef.current = false;
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [updateControlPoint]);

  return {
    controlPoints,
    isDragging,
    dragPointId,
    initializeControlPoints,
    updateControlPoint,
    addControlPoint,
    removeControlPoint,
    handleMouseDown,
    resetControlPoints,
  };
};