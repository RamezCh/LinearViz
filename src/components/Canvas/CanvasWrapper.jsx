import { createContext, useContext, useRef, useState, useEffect, useCallback } from 'react';
import { useStore } from '../../store/useStore';

export const CanvasContext = createContext(null);

export function useCanvasContext() {
  const context = useContext(CanvasContext);
  if (!context) {
    throw new Error('useCanvasContext must be used within CanvasWrapper');
  }
  return context;
}

export default function CanvasWrapper({
  children,
  mode = '2d',
  className = '',
  showGrid = true,
  gridSize = 1,
  gridExtent = 10,
  interactive = true,
  onVectorDrag,
  onPointDrag,
}) {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);
  const darkMode = useStore((state) => state.darkMode);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
    };
  }, []);

  const worldToScreen = useCallback(
    (worldPoint) => {
      const { width, height } = dimensions;
      
      if (!width || !height || !worldPoint) {
        return { x: 0, y: 0 };
      }
      
      const centerX = width / 2;
      const centerY = height / 2;
      const scale = Math.min(width, height) / (2 * gridExtent);

      return {
        x: centerX + (worldPoint[0] ?? 0) * scale,
        y: centerY - (worldPoint[1] ?? 0) * scale,
      };
    },
    [dimensions, gridExtent]
  );

  const screenToWorld = useCallback(
    (screenPoint) => {
      const { width, height } = dimensions;
      const centerX = width / 2;
      const centerY = height / 2;
      const scale = Math.min(width, height) / (2 * gridExtent);

      return [
        (screenPoint.x - centerX) / scale,
        -(screenPoint.y - centerY) / scale,
      ];
    },
    [dimensions, gridExtent]
  );

  const handleDragStart = useCallback(
    (type, id, event) => {
      if (!interactive) return;
      setIsDragging(true);
      setDraggedItem({ type, id });

      const handleDragMove = (moveEvent) => {
        const clientX = moveEvent.touches ? moveEvent.touches[0].clientX : moveEvent.clientX;
        const clientY = moveEvent.touches ? moveEvent.touches[0].clientY : moveEvent.clientY;

        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          const screenPoint = {
            x: clientX - rect.left,
            y: clientY - rect.top,
          };
          const worldPoint = screenToWorld(screenPoint);

          if (type === 'vector' && onVectorDrag) {
            onVectorDrag(id, worldPoint, moveEvent);
          } else if (type === 'point' && onPointDrag) {
            onPointDrag(id, worldPoint, moveEvent);
          }
        }
      };

      const handleDragEnd = () => {
        setIsDragging(false);
        setDraggedItem(null);
        document.removeEventListener('mousemove', handleDragMove);
        document.removeEventListener('mouseup', handleDragEnd);
        document.removeEventListener('touchmove', handleDragMove);
        document.removeEventListener('touchend', handleDragEnd);
      };

      document.addEventListener('mousemove', handleDragMove);
      document.addEventListener('mouseup', handleDragEnd);
      document.addEventListener('touchmove', handleDragMove);
      document.addEventListener('touchend', handleDragEnd);
    },
    [interactive, screenToWorld, onVectorDrag, onPointDrag]
  );

  const contextValue = {
    dimensions,
    mode,
    darkMode,
    isDragging,
    draggedItem,
    worldToScreen,
    screenToWorld,
    handleDragStart,
    gridSize,
    gridExtent,
    interactive,
  };

  return (
    <CanvasContext.Provider value={contextValue}>
      <div
        ref={containerRef}
        className={`relative overflow-hidden ${className}`}
        style={{ minHeight: '400px' }}
      >
        {dimensions.width > 0 && dimensions.height > 0 && (
          <>
            {mode === '2d' && children}
          </>
        )}
      </div>
    </CanvasContext.Provider>
  );
}