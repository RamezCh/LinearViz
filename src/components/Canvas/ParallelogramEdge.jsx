import { motion } from 'framer-motion';

export default function ParallelogramEdge({ start = { x: 0, y: 0 }, end = { x: 0, y: 0 }, color = '#3b82f6', dashed = false, strokeWidth = 0.05 }) {
  const path = `M ${start?.x ?? 0} ${-start?.y ?? 0} L ${end?.x ?? 0} ${-end?.y ?? 0}`;
  
  if (!start || !end || isNaN(start.x) || isNaN(start.y) || isNaN(end.x) || isNaN(end.y)) {
    return null;
  }
  
  return (
    <motion.path
      d={path}
      stroke={color}
      strokeWidth={strokeWidth}
      fill="none"
      strokeDasharray={dashed ? "0.15 0.1" : undefined}
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.5 }}
    />
  );
}

export { ParallelogramEdge };