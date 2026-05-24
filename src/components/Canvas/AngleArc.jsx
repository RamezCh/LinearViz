import { useMemo, useRef, useEffect } from 'react';
import { motion, animate } from 'framer-motion';
import { useCanvasContext } from './CanvasWrapper';
import { angleBetween } from '../../utils/linalg';

export default function AngleArc({
  id,
  center = [0, 0],
  vector1 = [1, 0],
  vector2 = [1, 1],
  radius = 30,
  minRadius = 10,
  maxRadius = 60,
  color = '#3b82f6',
  label = '',
  showLabel = true,
  showRadians = false,
  animated = false,
  animatedDuration = 500,
  fillOpacity = 0.3,
}) {
  const { worldToScreen, darkMode } = useCanvasContext();
  const angleRef = useRef(0);
  const progressRef = useRef(0);

  const screenCenter = worldToScreen(center);

  const angleDeg = angleBetween(
    [vector1[0] - center[0], vector1[1] - center[1]],
    [vector2[0] - center[0], vector2[1] - center[1]]
  );

  const angleRad = (angleDeg * Math.PI) / 180;

  const startAngle = Math.atan2(
    vector1[1] - center[1],
    vector1[0] - center[0]
  );

  const endAngle = startAngle + angleRad;

  const largeArcFlag = angleDeg > 180 ? 1 : 0;
  const sweepFlag = 1;

  const createArcPath = (startAngleRad, endAngleRad, arcRadius) => {
    const x1 = screenCenter.x + arcRadius * Math.cos(startAngleRad);
    const y1 = screenCenter.y - arcRadius * Math.sin(startAngleRad);
    const x2 = screenCenter.x + arcRadius * Math.cos(endAngleRad);
    const y2 = screenCenter.y - arcRadius * Math.sin(endAngleRad);

    return `M ${x1} ${y1} A ${arcRadius} ${arcRadius} 0 ${largeArcFlag} ${sweepFlag} ${x2} ${y2}`;
  };

  const createSectorPath = (startAngleRad, endAngleRad, arcRadius, innerRadius = 0) => {
    const outerX1 = screenCenter.x + arcRadius * Math.cos(startAngleRad);
    const outerY1 = screenCenter.y - arcRadius * Math.sin(startAngleRad);
    const outerX2 = screenCenter.x + arcRadius * Math.cos(endAngleRad);
    const outerY2 = screenCenter.y - arcRadius * Math.sin(endAngleRad);

    const innerX1 = screenCenter.x + innerRadius * Math.cos(startAngleRad);
    const innerY1 = screenCenter.y - innerRadius * Math.sin(startAngleRad);
    const innerX2 = screenCenter.x + innerRadius * Math.cos(endAngleRad);
    const innerY2 = screenCenter.y - innerRadius * Math.sin(endAngleRad);

    if (innerRadius === 0) {
      return `M ${screenCenter.x} ${screenCenter.y} 
              L ${outerX1} ${outerY1} 
              A ${arcRadius} ${arcRadius} 0 ${largeArcFlag} ${sweepFlag} ${outerX2} ${outerY2} Z`;
    }

    return `M ${innerX1} ${innerY1} 
            L ${outerX1} ${outerY1} 
            A ${arcRadius} ${arcRadius} 0 ${largeArcFlag} ${sweepFlag} ${outerX2} ${outerY2}
            L ${innerX2} ${innerY2}
            A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${-sweepFlag} ${innerX1} ${innerY1} Z`;
  };

  const labelPosition = useMemo(() => {
    const midAngle = startAngle + angleRad / 2;
    const labelRadius = Math.min(maxRadius, Math.max(minRadius, radius * 0.7));
    return {
      x: screenCenter.x + labelRadius * Math.cos(midAngle),
      y: screenCenter.y - labelRadius * Math.sin(midAngle),
    };
  }, [screenCenter, startAngle, angleRad, radius, minRadius, maxRadius]);

  const angleLabel = useMemo(() => {
    const value = showRadians ? angleRad.toFixed(3) : `${angleDeg.toFixed(1)}°`;
    return showLabel ? value : '';
  }, [angleDeg, angleRad, showLabel, showRadians]);

  const angleLabelElement = useMemo(() => {
    if (!showLabel) return null;

    return (
      <motion.g
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: animated ? 0.3 : 0 }}
      >
        <rect
          x={labelPosition.x - 30}
          y={labelPosition.y - 12}
          width="60"
          height="24"
          rx="6"
          fill={darkMode ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)'}
          stroke={darkMode ? '#334155' : '#e2e8f0'}
          strokeWidth="1"
        />
        <text
          x={labelPosition.x}
          y={labelPosition.y + 5}
          fill={color}
          fontSize="13"
          fontWeight="600"
          textAnchor="middle"
        >
          {angleLabel}
        </text>
      </motion.g>
    );
  }, [showLabel, labelPosition, angleLabel, color, darkMode, animated]);

  const dynamicRadius = useMemo(() => {
    const minDim = Math.min(dimensions?.width || 400, dimensions?.height || 400);
    const calculatedRadius = Math.min(
      Math.max(minRadius, radius),
      Math.min(maxRadius, minDim * 0.3)
    );
    return calculatedRadius;
  }, [radius, minRadius, maxRadius]);

  return (
    <g className="angle-arc">
      {animated ? (
        <motion.path
          d={createSectorPath(startAngle, startAngle + angleRad, dynamicRadius, dynamicRadius * 0.3)}
          fill={color}
          fillOpacity={fillOpacity}
          stroke={color}
          strokeWidth="2"
          strokeLinejoin="round"
          initial={{ opacity: 0 }}
          animate={{
            opacity: 1,
            d: createSectorPath(
              startAngle,
              startAngle + angleRad,
              dynamicRadius,
              dynamicRadius * 0.3
            ),
          }}
          transition={{ duration: animatedDuration / 1000, ease: 'easeOut' }}
        />
      ) : (
        <path
          d={createSectorPath(startAngle, startAngle + angleRad, dynamicRadius, dynamicRadius * 0.3)}
          fill={color}
          fillOpacity={fillOpacity}
          stroke={color}
          strokeWidth="2"
          strokeLinejoin="round"
        />
      )}

      {animated ? (
        <>
          <motion.path
            d={createArcPath(startAngle, startAngle + angleRad, dynamicRadius)}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: animatedDuration / 1000, ease: 'easeInOut' }}
          />
          <motion.path
            d={createArcPath(startAngle, startAngle + angleRad, dynamicRadius * 0.3)}
            fill="none"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: animatedDuration / 1000, ease: 'easeInOut' }}
          />
        </>
      ) : (
        <>
          <path
            d={createArcPath(startAngle, startAngle + angleRad, dynamicRadius)}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d={createArcPath(startAngle, startAngle + angleRad, dynamicRadius * 0.3)}
            fill="none"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </>
      )}

      {[0, 1].map((index) => {
        const angle = index === 0 ? startAngle : endAngle;
        const x = screenCenter.x + dynamicRadius * Math.cos(angle);
        const y = screenCenter.y - dynamicRadius * Math.sin(angle);

        return (
          <motion.circle
            key={index}
            cx={x}
            cy={y}
            r={4}
            fill={color}
            stroke={darkMode ? '#1e293b' : '#fff'}
            strokeWidth="1.5"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: animated ? index * 0.1 : 0, duration: 0.2 }}
          />
        );
      })}

      {angleLabelElement}
    </g>
  );
}

export function AngleLabel({
  position,
  text,
  color,
  offset = [0, -20],
  className = '',
}) {
  return (
    <motion.g
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      <rect
        x={position.x + offset[0] - 25}
        y={position.y + offset[1] - 10}
        width="50"
        height="20"
        rx="4"
        fill="rgba(30, 41, 59, 0.9)"
      />
      <text
        x={position.x + offset[0]}
        y={position.y + offset[1] + 4}
        fill={color}
        fontSize="12"
        fontWeight="600"
        textAnchor="middle"
      >
        {text}
      </text>
    </motion.g>
  );
}

export function AngleArcSegment({ startAngle, endAngle, radius, color, animated = false }) {
  const { worldToScreen } = useCanvasContext();
  const screenCenter = worldToScreen([0, 0]);

  const midAngle = startAngle + (endAngle - startAngle) / 2;
  const arcMidX = screenCenter.x + radius * Math.cos(midAngle);
  const arcMidY = screenCenter.y - radius * Math.sin(midAngle);

  const d = `M ${arcMidX} ${arcMidY}`;

  return (
    <g>
      <motion.circle
        cx={arcMidX}
        cy={arcMidY}
        r="3"
        fill={color}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.2 }}
      />
    </g>
  );
}