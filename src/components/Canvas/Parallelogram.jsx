import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useCanvasContext } from './CanvasWrapper';
import { det2x2 } from '../../utils/linalg';

export default function Parallelogram({
  id,
  u = [1, 0],
  v = [0, 1],
  color = '#8b5cf6',
  label = '',
  showArea = true,
  showBorder = true,
  borderColor = null,
  selected = false,
  animated = false,
}) {
  const { worldToScreen, darkMode } = useCanvasContext();

  const screenU = worldToScreen(u);
  const screenV = worldToScreen(v);
  const screenOrigin = worldToScreen([0, 0]);

  const determinant = det2x2([u, v]);

  const displayColor = useMemo(() => {
    if (determinant < 0) {
      return darkMode ? '#f97316' : '#ea580c';
    }
    return color;
  }, [determinant, color, darkMode]);

  const borderDisplayColor = borderColor || displayColor;

  const opacity = 0.4;
  const vertices = [
    { x: screenOrigin.x, y: screenOrigin.y },
    { x: screenU.x, y: screenU.y },
    { x: screenU.x + screenV.x - screenOrigin.x, y: screenU.y + screenV.y - screenOrigin.y },
    { x: screenV.x, y: screenV.y },
  ];

  const pathD = `M ${vertices[0].x} ${vertices[0].y} 
                 L ${vertices[1].x} ${vertices[1].y} 
                 L ${vertices[2].x} ${vertices[2].y} 
                 L ${vertices[3].x} ${vertices[3].y} Z`;

  const centroid = {
    x: (vertices[0].x + vertices[1].x + vertices[2].x + vertices[3].x) / 4,
    y: (vertices[0].y + vertices[1].y + vertices[2].y + vertices[3].y) / 4,
  };

  const area = Math.abs(det2x2([u, v]));
  const areaLabel = `Area: ${area.toFixed(2)}`;

  const labelElement = useMemo(() => {
    if (!label) return null;

    return (
      <motion.g
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <rect
          x={centroid.x - 35}
          y={centroid.y - 30}
          width="70"
          height="24"
          rx="6"
          fill={darkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.95)'}
          stroke={darkMode ? '#334155' : '#e2e8f0'}
          strokeWidth="1"
        />
        <text
          x={centroid.x}
          y={centroid.y - 12}
          fill={displayColor}
          fontSize="12"
          fontWeight="600"
          textAnchor="middle"
        >
          {label}
        </text>
      </motion.g>
    );
  }, [label, centroid, displayColor, darkMode]);

  const areaLabelElement = useMemo(() => {
    if (!showArea) return null;

    return (
      <motion.g
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <rect
          x={centroid.x - 40}
          y={centroid.y - 8}
          width="80"
          height="20"
          rx="4"
          fill={darkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)'}
        />
        <text
          x={centroid.x}
          y={centroid.y + 5}
          fill={darkMode ? '#94a3b8' : '#64748b'}
          fontSize="11"
          textAnchor="middle"
        >
          {areaLabel}
        </text>
      </motion.g>
    );
  }, [showArea, centroid, areaLabel, darkMode]);

  const determinantLabel = useMemo(() => {
    if (!animated) return null;

    return (
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <rect
          x={centroid.x - 50}
          y={centroid.y + 25}
          width="100"
          height="20"
          rx="4"
          fill={determinant < 0
            ? 'rgba(239, 68, 68, 0.1)'
            : 'rgba(34, 197, 94, 0.1)'
          }
          stroke={determinant < 0 ? '#ef4444' : '#22c55e'}
          strokeWidth="1"
        />
        <text
          x={centroid.x}
          y={centroid.y + 38}
          fill={determinant < 0 ? '#ef4444' : '#22c55e'}
          fontSize="10"
          fontWeight="600"
          textAnchor="middle"
        >
          det = {determinant.toFixed(2)}
        </text>
      </motion.g>
    );
  }, [animated, determinant, centroid]);

  return (
    <g className="parallelogram">
      {animated ? (
        <motion.path
          d={pathD}
          fill={displayColor}
          fillOpacity={opacity}
          stroke={showBorder ? borderDisplayColor : 'transparent'}
          strokeWidth={selected ? 3 : 2}
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      ) : (
        <path
          d={pathD}
          fill={displayColor}
          fillOpacity={opacity}
          stroke={showBorder ? borderDisplayColor : 'transparent'}
          strokeWidth={selected ? 3 : 2}
          strokeLinejoin="round"
        />
      )}

      {vertices.map((vertex, index) => (
        <motion.circle
          key={index}
          cx={vertex.x}
          cy={vertex.y}
          r={selected ? 5 : 3}
          fill={displayColor}
          stroke={darkMode ? '#1e293b' : '#fff'}
          strokeWidth="1.5"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: animated ? 0.3 + index * 0.1 : 0, duration: 0.2 }}
        />
      ))}

      {labelElement}
      {areaLabelElement}
      {determinantLabel}
    </g>
  );
}

export function ParallelogramEdge({ start, end, color, dashed = false }) {
  const { worldToScreen, darkMode } = useCanvasContext();

  const screenStart = worldToScreen(start);
  const screenEnd = worldToScreen(end);

  return (
    <line
      x1={screenStart.x}
      y1={screenStart.y}
      x2={screenEnd.x}
      y2={screenEnd.y}
      stroke={color}
      strokeWidth="2"
      strokeDasharray={dashed ? '4 4' : 'none'}
      strokeLinecap="round"
    />
  );
}