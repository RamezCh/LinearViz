import { useMemo, useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useCanvasContext } from './CanvasWrapper';
import { magnitude, angleBetween } from '../../utils/linalg';

export default function Vector2D({
  id,
  origin = [0, 0],
  tip = [1, 0],
  color = '#3b82f6',
  label = '',
  showComponents = false,
  showMagnitude = true,
  showAngle = false,
  selected = false,
  draggable = true,
  onDragEnd,
  animated = false,
}) {
  const { worldToScreen, handleDragStart, darkMode, interactive } = useCanvasContext();
  const [localTip, setLocalTip] = useState(tip);
  const [isDraggingTip, setIsDraggingTip] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const animationRef = useRef(null);

  const safeOrigin = Array.isArray(origin) ? origin : [0, 0];
  const safeTip = Array.isArray(localTip) ? localTip : [1, 0];
  
  const screenOrigin = worldToScreen(safeOrigin);
  const screenTip = worldToScreen(safeTip);

  useEffect(() => {
    if (Array.isArray(tip)) {
      setLocalTip(tip);
    }
  }, [tip]);

  useEffect(() => {
    if (animated && !isDraggingTip) {
      let startTime = null;
      const duration = 1000;

      const animate = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);

        const animatedTip = [
          origin[0] + (tip[0] - origin[0]) * eased,
          origin[1] + (tip[1] - origin[1]) * eased,
        ];
        setLocalTip(animatedTip);

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        }
      };

      animationRef.current = requestAnimationFrame(animate);

      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }
  }, [animated, tip, origin, isDraggingTip]);

  const dx = safeTip[0] - safeOrigin[0];
  const dy = safeTip[1] - safeOrigin[1];
  const mag = magnitude([dx, dy]);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  const arrowHeadLength = 12;
  const arrowHeadAngle = Math.PI / 6;
  const lineAngle = Math.atan2(
    (screenTip?.y ?? 0) - (screenOrigin?.y ?? 0),
    (screenTip?.x ?? 0) - (screenOrigin?.x ?? 0)
  );

  const arrowHead1 = {
    x: (screenTip?.x ?? 0) - arrowHeadLength * Math.cos(lineAngle - arrowHeadAngle),
    y: (screenTip?.y ?? 0) - arrowHeadLength * Math.sin(lineAngle - arrowHeadAngle),
  };
  const arrowHead2 = {
    x: (screenTip?.x ?? 0) - arrowHeadLength * Math.cos(lineAngle + arrowHeadAngle),
    y: (screenTip?.y ?? 0) - arrowHeadLength * Math.sin(lineAngle + arrowHeadAngle),
  };

  const handleTipMouseDown = (e) => {
    if (!draggable || !interactive) return;
    e.stopPropagation();
    setIsDraggingTip(true);

    const handleMove = (moveEvent) => {
      const clientX = moveEvent.touches ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const clientY = moveEvent.touches ? moveEvent.touches[0].clientY : moveEvent.clientY;
      const parentRect = e.target.closest('svg').getBoundingClientRect();

      const newScreenTip = {
        x: clientX - parentRect.left,
        y: clientY - parentRect.top,
      };

      const newTip = [
        (newScreenTip.x - screenOrigin.x) * ((localTip[0] - origin[0]) !== 0 || (localTip[1] - origin[1]) !== 0 ? 1 : 1),
        -(newScreenTip.y - screenOrigin.y) * ((localTip[0] - origin[0]) !== 0 || (localTip[1] - origin[1]) !== 0 ? 1 : 1),
      ];

      const scaleX = (screenTip.x - screenOrigin.x) / (localTip[0] - origin[0] || 1);
      const scaleY = -(screenTip.y - screenOrigin.y) / (localTip[1] - origin[1] || 1);
      const avgScale = (Math.abs(scaleX) + Math.abs(scaleY)) / 2;

      const worldDx = (newScreenTip.x - screenOrigin.x);
      const worldDy = -(newScreenTip.y - screenOrigin.y);
      const worldScale = Math.min(width => {
        const w = screenTip.x - screenOrigin.x;
        return w;
      }, screenTip.x - screenOrigin.x !== 0 ? (screenTip.x - screenOrigin.x) / (localTip[0] - origin[0]) : 1);

      const newWorldTip = [
        origin[0] + worldDx / worldScale,
        origin[1] + worldDy / worldScale,
      ];

      setLocalTip(newWorldTip);
    };

    const handleUp = () => {
      setIsDraggingTip(false);
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleUp);
      if (onDragEnd) {
        onDragEnd(id, localTip);
      }
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
    document.addEventListener('touchmove', handleMove);
    document.addEventListener('touchend', handleUp);
  };

  const componentLines = useMemo(() => {
    if (!showComponents || !screenOrigin || !screenTip) return null;

    const componentColor = darkMode ? '#64748b' : '#94a3b8';

    return (
      <g>
        <motion.line
          x1={screenOrigin.x ?? 0}
          y1={screenOrigin.y ?? 0}
          x2={screenTip.x ?? 0}
          y2={screenOrigin.y ?? 0}
          stroke={componentColor}
          strokeWidth="2"
          strokeDasharray="4 4"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
        />
        <motion.line
          x1={screenTip.x ?? 0}
          y1={screenOrigin.y ?? 0}
          x2={screenTip.x ?? 0}
          y2={screenTip.y ?? 0}
          stroke={componentColor}
          strokeWidth="2"
          strokeDasharray="4 4"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
        />
      </g>
    );
  }, [showComponents, screenOrigin, screenTip, darkMode]);

  const labelElement = useMemo(() => {
    if (!screenOrigin || !screenTip) return null;
    if (!label) return null;

    const labelX = ((screenOrigin.x ?? 0) + (screenTip.x ?? 0)) / 2;
    const labelY = ((screenOrigin.y ?? 0) + (screenTip.y ?? 0)) / 2;
    const offset = 20;

    return (
      <motion.g
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <rect
          x={labelX - 20}
          y={labelY - offset - 10}
          width="40"
          height="20"
          rx="4"
          fill={darkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)'}
        />
        <text
          x={labelX}
          y={labelY - offset + 4}
          fill={color}
          fontSize="12"
          fontWeight="600"
          textAnchor="middle"
        >
          {label}
        </text>
      </motion.g>
    );
  }, [label, screenOrigin, screenTip, color, darkMode]);

  const magnitudeLabel = useMemo(() => {
    if (!showMagnitude || mag < 0.01 || !screenOrigin || !screenTip) return null;

    const midX = ((screenOrigin.x ?? 0) + (screenTip.x ?? 0)) / 2;
    const midY = ((screenOrigin.y ?? 0) + (screenTip.y ?? 0)) / 2;
    const offset = 30;

    return (
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <text
          x={midX}
          y={midY}
          fill={darkMode ? '#94a3b8' : '#64748b'}
          fontSize="11"
          textAnchor="middle"
          dominantBaseline="middle"
        >
          |v| = {mag.toFixed(2)}
        </text>
      </motion.g>
    );
  }, [showMagnitude, mag, screenOrigin, screenTip, darkMode]);

  const hoverTarget = useMemo(() => {
    if (!interactive || !draggable || !screenTip) return null;

    const hitRadius = Math.max(20, arrowHeadLength * 2);

    return (
      <motion.circle
        cx={screenTip.x ?? 0}
        cy={screenTip.y ?? 0}
        r={hitRadius}
        fill="transparent"
        cursor={draggable ? 'grab' : 'default'}
        onMouseDown={handleTipMouseDown}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={{ scale: 1.1 }}
        style={{ cursor: isDraggingTip ? 'grabbing' : isHovered ? 'grab' : 'default' }}
      />
    );
  }, [interactive, draggable, screenTip, isDraggingTip, isHovered, handleTipMouseDown]);

  const tipIndicator = useMemo(() => {
    if (!interactive || !screenTip) return null;

    const radius = selected ? 8 : isHovered ? 6 : 5;
    
    return (
      <motion.circle
        cx={screenTip.x ?? 0}
        cy={screenTip.y ?? 0}
        r={radius}
        fill={color}
        stroke={selected ? '#fff' : darkMode ? '#1e293b' : '#fff'}
        strokeWidth={selected ? 2 : 1}
        style={{ cursor: isDraggingTip ? 'grabbing' : 'grab' }}
      />
    );
  }, [interactive, screenTip, color, selected, isHovered, darkMode, isDraggingTip]);

  const line = useMemo(() => {
    if (!screenTip || !screenOrigin) return null;
    
    const length = Math.sqrt(
      Math.pow((screenTip.x ?? 0) - (screenOrigin.x ?? 0), 2) +
      Math.pow((screenTip.y ?? 0) - (screenOrigin.y ?? 0), 2)
    );

    if (length < 1) return null;

    return (
      <motion.line
        x1={screenOrigin.x ?? 0}
        y1={screenOrigin.y ?? 0}
        x2={screenTip.x ?? 0}
        y2={screenTip.y ?? 0}
        stroke={color}
        strokeWidth={selected ? 3 : 2}
        strokeLinecap="round"
        animate={{ strokeWidth: selected ? 3 : 2 }}
        transition={{ duration: 0.15 }}
      />
    );
  }, [screenOrigin, screenTip, color, selected]);

  const arrowHead = useMemo(() => {
    if (!screenTip || !screenOrigin) return null;
    
    const length = Math.sqrt(
      Math.pow((screenTip.x ?? 0) - (screenOrigin.x ?? 0), 2) +
      Math.pow((screenTip.y ?? 0) - (screenOrigin.y ?? 0), 2)
    );

    if (length < arrowHeadLength * 1.5) return null;

    return (
      <motion.polygon
        points={`${screenTip.x ?? 0},${screenTip.y ?? 0} ${arrowHead1.x},${arrowHead1.y} ${arrowHead2.x},${arrowHead2.y}`}
        fill={color}
        animate={{ scale: isHovered ? 1.1 : 1 }}
        style={{ transformOrigin: `${screenTip.x ?? 0}px ${screenTip.y ?? 0}px` }}
      />
    );
  }, [screenTip, arrowHead1, arrowHead2, color, isHovered, screenOrigin]);

  return (
    <g className="vector-2d">
      {componentLines}
      {line}
      {arrowHead}
      {tipIndicator}
      {hoverTarget}
      {labelElement}
      {magnitudeLabel}
    </g>
  );
}