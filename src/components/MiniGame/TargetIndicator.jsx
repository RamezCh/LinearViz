import { useMemo } from 'react';
import { motion } from 'framer-motion';

export default function TargetIndicator({
  position = [0, 0],
  hitRadius = 0.5,
  currentPosition = null,
  showProximity = true,
  mode = 'static',
  color = '#3b82f6',
  animated = true,
  className = '',
}) {
  const proximity = useMemo(() => {
    if (!currentPosition || !showProximity) return null;
    const dx = currentPosition[0] - position[0];
    const dy = currentPosition[1] - position[1];
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance <= hitRadius * 0.5) return { level: 'perfect', color: '#10b981', label: 'Perfect!' };
    if (distance <= hitRadius) return { level: 'close', color: '#f59e0b', label: 'Close!' };
    if (distance <= hitRadius * 2) return { level: 'near', color: '#3b82f6', label: 'Near' };
    return { level: 'miss', color: '#ef4444', label: 'Miss' };
  }, [currentPosition, position, hitRadius, showProximity]);

  return (
    <g className={className}>
      <motion.circle
        cx={position[0]}
        cy={-position[1]}
        r={hitRadius * 2}
        fill="transparent"
        stroke={proximity?.color || color}
        strokeWidth="2"
        strokeDasharray={mode === 'pulse' ? '8 4' : 'none'}
        opacity="0.3"
        animate={animated ? { scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] } : {}}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.circle
        cx={position[0]}
        cy={-position[1]}
        r={hitRadius}
        fill={proximity?.color || color}
        fillOpacity="0.2"
        stroke={proximity?.color || color}
        strokeWidth="2"
        animate={animated ? { scale: [1, 1.05, 1] } : {}}
        transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.circle
        cx={position[0]}
        cy={-position[1]}
        r="4"
        fill={proximity?.color || color}
        animate={animated ? { scale: [1, 1.2, 1] } : {}}
        transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
      />

      {proximity && showProximity && (
        <g>
          <motion.g
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <rect
              x={position[0] - 40}
              y={-position[1] - 40}
              width="80"
              height="24"
              rx="6"
              fill="rgba(0,0,0,0.8)"
            />
            <text
              x={position[0]}
              y={-position[1] - 23}
              fill={proximity.color}
              fontSize="12"
              fontWeight="600"
              textAnchor="middle"
            >
              {proximity.label}
            </text>
          </motion.g>

          <motion.line
            x1={currentPosition[0]}
            y1={-currentPosition[1]}
            x2={position[0]}
            y2={-position[1]}
            stroke={proximity.color}
            strokeWidth="1"
            strokeDasharray="4 4"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            opacity="0.5"
          />
        </g>
      )}
    </g>
  );
}

export function HitZone({
  center = [0, 0],
  radius = 1,
  color = '#3b82f6',
  filled = false,
  className = '',
}) {
  return (
    <g className={className}>
      <circle
        cx={center[0]}
        cy={-center[1]}
        r={radius}
        fill={filled ? color : 'transparent'}
        fillOpacity={filled ? 0.2 : 0}
        stroke={color}
        strokeWidth="2"
        strokeDasharray="6 3"
      />
    </g>
  );
}

export function ProximityRing({
  position = [0, 0],
  distance = 0,
  maxDistance = 5,
  color = '#3b82f6',
  animated = true,
  className = '',
}) {
  const opacity = Math.max(0.1, 1 - distance / maxDistance);
  const ringRadius = distance;

  return (
    <motion.g className={className}>
      <motion.circle
        cx={position[0]}
        cy={-position[1]}
        r={ringRadius}
        fill="transparent"
        stroke={color}
        strokeWidth="2"
        opacity={animated ? [opacity, opacity * 0.5, opacity] : opacity}
        animate={animated ? { r: [ringRadius, ringRadius + 0.1, ringRadius] } : {}}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </motion.g>
  );
}

export function TargetPulse({
  position = [0, 0],
  color = '#3b82f6',
  speed = 1,
  className = '',
}) {
  return (
    <g className={className}>
      {[1, 2, 3].map((ring) => (
        <motion.circle
          key={ring}
          cx={position[0]}
          cy={-position[1]}
          r={ring * 0.5}
          fill="transparent"
          stroke={color}
          strokeWidth="2"
          initial={{ scale: 0.5, opacity: 0.8 }}
          animate={{
            scale: [0.5, 2],
            opacity: [0.8, 0],
          }}
          transition={{
            duration: 2 / speed,
            repeat: Infinity,
            delay: (ring - 1) * (0.5 / speed),
            ease: 'easeOut',
          }}
        />
      ))}
    </g>
  );
}