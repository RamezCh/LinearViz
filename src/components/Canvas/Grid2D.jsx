import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useCanvasContext } from './CanvasWrapper';

export default function Grid2D({ showLabels = true, showTicks = true }) {
  const { dimensions, darkMode, gridSize, gridExtent, worldToScreen, handleDragStart } =
    useCanvasContext();

  const { width, height } = dimensions;
  const centerX = width / 2;
  const centerY = height / 2;
  const scale = Math.min(width, height) / (2 * gridExtent);

  const gridLines = useMemo(() => {
    const lines = [];

    for (let i = -gridExtent; i <= gridExtent; i++) {
      if (i === 0) continue;

      const xPos = centerX + i * scale;
      const yPos = centerY - i * scale;

      lines.push(
        <line
          key={`vgrid-${i}`}
          x1={xPos}
          y1={0}
          x2={xPos}
          y2={height}
          stroke={darkMode ? '#334155' : '#e2e8f0'}
          strokeWidth="1"
        />
      );

      lines.push(
        <line
          key={`hgrid-${i}`}
          x1={0}
          y1={yPos}
          x2={width}
          y2={yPos}
          stroke={darkMode ? '#334155' : '#e2e8f0'}
          strokeWidth="1"
        />
      );
    }

    return lines;
  }, [centerX, centerY, scale, width, height, darkMode, gridExtent]);

  const axisLines = useMemo(() => {
    const strokeColor = darkMode ? '#94a3b8' : '#475569';
    const tickColor = darkMode ? '#64748b' : '#94a3b8';
    const tickLength = 8;

    return (
      <>
        <line
          x1={0}
          y1={centerY}
          x2={width}
          y2={centerY}
          stroke={strokeColor}
          strokeWidth="2"
          markerEnd="url(#arrowhead)"
        />
        <line
          x1={centerX}
          y1={height}
          x2={centerX}
          y2={0}
          stroke={strokeColor}
          strokeWidth="2"
          markerEnd="url(#arrowhead)"
        />
        {showTicks &&
          Array.from({ length: gridExtent * 2 + 1 }, (_, i) => i - gridExtent).map((i) => {
            const xTick = centerX + i * scale;
            const yTick = centerY - i * scale;

            return (
              <g key={`ticks-${i}`}>
                <line
                  x1={xTick}
                  y1={centerY - tickLength / 2}
                  x2={xTick}
                  y2={centerY + tickLength / 2}
                  stroke={tickColor}
                  strokeWidth="1"
                />
                <line
                  x1={centerX - tickLength / 2}
                  y1={yTick}
                  x2={centerX + tickLength / 2}
                  y2={yTick}
                  stroke={tickColor}
                  strokeWidth="1"
                />
              </g>
            );
          })}
      </>
    );
  }, [centerX, centerY, width, height, scale, darkMode, gridExtent, showTicks]);

  const labels = useMemo(() => {
    if (!showLabels) return null;
    const labelColor = darkMode ? '#cbd5e1' : '#475569';
    const labelFontSize = 12;
    const labelOffset = 15;

    return (
      <>
        <text
          x={width - labelOffset}
          y={centerY - labelOffset}
          fill={labelColor}
          fontSize={labelFontSize}
          fontWeight="500"
          textAnchor="middle"
        >
          x
        </text>
        <text
          x={centerX + labelOffset}
          y={labelOffset + 5}
          fill={labelColor}
          fontSize={labelFontSize}
          fontWeight="500"
          textAnchor="middle"
        >
          y
        </text>
        {Array.from({ length: gridExtent + 1 }, (_, i) => i).map((i) => {
          if (i === 0) return null;
          const xPos = centerX + i * scale;
          const yPos = centerY - i * scale;

          return (
            <g key={`labels-${i}`}>
              <text
                x={xPos}
                y={centerY + labelOffset + 4}
                fill={labelColor}
                fontSize={10}
                textAnchor="middle"
              >
                {i}
              </text>
              <text
                x={centerX - labelOffset}
                y={yPos + 4}
                fill={labelColor}
                fontSize={10}
                textAnchor="middle"
              >
                {i}
              </text>
              {i !== 0 && (
                <>
                  <text
                    x={centerX - i * scale}
                    y={centerY + labelOffset + 4}
                    fill={labelColor}
                    fontSize={10}
                    textAnchor="middle"
                  >
                    {-i}
                  </text>
                  <text
                    x={centerX - labelOffset}
                    y={centerY + i * scale + 4}
                    fill={labelColor}
                    fontSize={10}
                    textAnchor="middle"
                  >
                    {-i}
                  </text>
                </>
              )}
            </g>
          );
        })}
      </>
    );
  }, [showLabels, width, centerX, centerY, scale, darkMode, gridExtent]);

  const handleClick = (event) => {
    if (!handleDragStart) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const screenPoint = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
    const worldPoint = [
      (screenPoint.x - centerX) / scale,
      -(screenPoint.y - centerY) / scale,
    ];
    handleDragStart('point', 'new', event);
  };

  return (
    <svg
      width={width}
      height={height}
      className="absolute inset-0"
      onClick={handleClick}
      style={{ cursor: 'crosshair' }}
    >
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon
            points="0 0, 10 3.5, 0 7"
            fill={darkMode ? '#94a3b8' : '#475569'}
          />
        </marker>
        <marker
          id="origin-dot"
          markerWidth="6"
          markerHeight="6"
          refX="3"
          refY="3"
        >
          <circle cx="3" cy="3" r="2" fill={darkMode ? '#94a3b8' : '#475569'} />
        </marker>
      </defs>

      {gridLines}

      {axisLines}

      <circle
        cx={centerX}
        cy={centerY}
        r="4"
        fill={darkMode ? '#94a3b8' : '#475569'}
      />

      {labels}
    </svg>
  );
}

export function GridOverlay({ opacity = 0.3 }) {
  const { dimensions, darkMode, gridExtent } = useCanvasContext();
  const { width, height } = dimensions;

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        opacity,
        backgroundImage: `
          linear-gradient(${darkMode ? 'rgba(100, 116, 139, 0.1)' : 'rgba(71, 85, 105, 0.1)'} 1px, transparent 1px),
          linear-gradient(90deg, ${darkMode ? 'rgba(100, 116, 139, 0.1)' : 'rgba(71, 85, 105, 0.1)'} 1px, transparent 1px)
        `,
        backgroundSize: `${width / (gridExtent * 2)}px ${height / (gridExtent * 2)}px`,
      }}
    />
  );
}