import { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';

export default function TransformGrid({
  matrix = [[1, 0], [0, 1]],
  animProgress = 1,
  showGrid = true,
  showBasis = true,
  showShape = true,
  zoom = 100,
  pan = { x: 0, y: 0 },
  darkMode = true,
  interactive = false,
  onDragEntry,
  dragEntry = null,
  onZoomChange,
  highlightPoint = null,
  showOriginLabel = true,
  overlayMatrix = null,
  overlayLabel = null,
  overlayOpacity = 0.35,
}) {
  const svgRef = useRef(null);
  const [size, setSize] = useState({ w: 900, h: 700 });
  const [hoveredEntry, setHoveredEntry] = useState(null);
  const lastTouchDist = useRef(null);

  useEffect(() => {
    if (!svgRef.current) return;
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setSize({ w: width, h: height });
      }
    });
    observer.observe(svgRef.current);
    return () => observer.disconnect();
  }, []);

  const toCanvas = useCallback((wx, wy) => ({
    x: size.w / 2 + wx * zoom + pan.x,
    y: size.h / 2 - wy * zoom + pan.y,
  }), [size.w, size.h, zoom, pan]);

  const fromCanvas = useCallback((cx, cy) => ({
    x: (cx - size.w / 2 - pan.x) / zoom,
    y: -(cy - size.h / 2 - pan.y) / zoom,
  }), [size.w, size.h, zoom, pan]);

  const handleWheel = useCallback((e) => {
    if (!onZoomChange) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    onZoomChange(delta);
  }, [onZoomChange]);

  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouchDist.current = Math.sqrt(dx * dx + dy * dy);
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!onZoomChange || e.touches.length !== 2 || lastTouchDist.current === null) return;
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    const newDist = Math.sqrt(dx * dx + dy * dy);
    const scale = newDist / lastTouchDist.current;
    onZoomChange(scale);
    lastTouchDist.current = newDist;
  }, [onZoomChange]);

  const handleTouchEnd = useCallback(() => {
    lastTouchDist.current = null;
  }, []);

  const getTransformedPoint = useCallback((px, py, progress = animProgress) => {
    const [a, b] = matrix[0];
    const [c, d] = matrix[1];
    const tx = a * px + b * py;
    const ty = c * px + d * py;
    return {
      x: px + (tx - px) * progress,
      y: py + (ty - py) * progress,
    };
  }, [matrix, animProgress]);

  const det = useMemo(() => {
    return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
  }, [matrix]);

  const gridExtent = useMemo(() => {
    return Math.ceil(Math.max(
      Math.abs(matrix[0][0]) + Math.abs(matrix[0][1]),
      Math.abs(matrix[1][0]) + Math.abs(matrix[1][1])
    )) + 2;
  }, [matrix]);

  const backgroundGridLines = useMemo(() => {
    if (!showGrid) return null;
    const lines = [];
    const extent = Math.max(6, gridExtent);

    for (let i = -extent; i <= extent; i++) {
      const p1 = toCanvas(i, -extent);
      const p2 = toCanvas(i, extent);
      lines.push(
        <line
          key={`vg-${i}`}
          x1={p1.x} y1={p1.y}
          x2={p2.x} y2={p2.y}
          stroke={darkMode ? 'rgba(100,116,139,0.2)' : 'rgba(100,116,139,0.12)'}
          strokeWidth={i === 0 ? 2 : 0.75}
        />
      );

      const q1 = toCanvas(-extent, i);
      const q2 = toCanvas(extent, i);
      lines.push(
        <line
          key={`hg-${i}`}
          x1={q1.x} y1={q1.y}
          x2={q2.x} y2={q2.y}
          stroke={darkMode ? 'rgba(100,116,139,0.2)' : 'rgba(100,116,139,0.12)'}
          strokeWidth={i === 0 ? 2 : 0.75}
        />
      );
    }

    return <g className="background-grid">{lines}</g>;
  }, [showGrid, toCanvas, darkMode, gridExtent]);

  const gridTickLabels = useMemo(() => {
    if (!showGrid) return null;
    const labels = [];
    const extent = Math.max(6, gridExtent);

    for (let i = -extent; i <= extent; i++) {
      if (i === 0) continue;
      const xPos = toCanvas(i, 0);
      const yPos = toCanvas(0, i);

      labels.push(
        <text
          key={`xlabel-${i}`}
          x={xPos.x}
          y={xPos.y + 16}
          fill={darkMode ? 'rgba(100,116,139,0.6)' : 'rgba(100,116,139,0.5)'}
          fontSize={10}
          fontWeight="500"
          textAnchor="middle"
        >
          {i}
        </text>
      );

      labels.push(
        <text
          key={`ylabel-${i}`}
          x={yPos.x - 10}
          y={yPos.y + 4}
          fill={darkMode ? 'rgba(100,116,139,0.6)' : 'rgba(100,116,139,0.5)'}
          fontSize={10}
          fontWeight="500"
          textAnchor="middle"
        >
          {i}
        </text>
      );
    }

    return <g className="grid-labels">{labels}</g>;
  }, [showGrid, toCanvas, gridExtent, darkMode]);

  const transformedGridLines = useMemo(() => {
    if (!showGrid || animProgress === 0) return null;
    const lines = [];
    const extent = Math.max(6, gridExtent);

    for (let i = -extent; i <= extent; i++) {
      const points = [];
      for (let j = -extent; j <= extent; j++) {
        const tp = getTransformedPoint(i, j);
        const p = toCanvas(tp.x, tp.y);
        points.push(`${p.x},${p.y}`);
      }

      lines.push(
        <polyline
          key={`tg-v-${i}`}
          points={points.join(' ')}
          fill="none"
          stroke={darkMode ? 'rgba(99,102,241,0.5)' : 'rgba(99,102,241,0.35)'}
          strokeWidth={i === 0 ? 2 : 1}
        />
      );
    }

    for (let i = -extent; i <= extent; i++) {
      const points = [];
      for (let j = -extent; j <= extent; j++) {
        const tp = getTransformedPoint(j, i);
        const p = toCanvas(tp.x, tp.y);
        points.push(`${p.x},${p.y}`);
      }

      lines.push(
        <polyline
          key={`tg-h-${i}`}
          points={points.join(' ')}
          fill="none"
          stroke={darkMode ? 'rgba(99,102,241,0.5)' : 'rgba(99,102,241,0.35)'}
          strokeWidth={i === 0 ? 2 : 1}
        />
      );
    }

    return <g className="transformed-grid">{lines}</g>;
  }, [showGrid, animProgress, toCanvas, getTransformedPoint, darkMode, gridExtent]);

  const overlayTransformedGrid = useMemo(() => {
    if (!showGrid || !overlayMatrix || overlayOpacity <= 0) return null;
    const lines = [];
    const extent = Math.max(6, Math.ceil(Math.max(
      Math.abs(overlayMatrix[0][0]) + Math.abs(overlayMatrix[0][1]),
      Math.abs(overlayMatrix[1][0]) + Math.abs(overlayMatrix[1][1])
    )) + 2);

    const getOverlayPoint = (px, py) => ({
      x: overlayMatrix[0][0] * px + overlayMatrix[0][1] * py,
      y: overlayMatrix[1][0] * px + overlayMatrix[1][1] * py,
    });

    for (let i = -extent; i <= extent; i++) {
      const points = [];
      for (let j = -extent; j <= extent; j++) {
        const tp = getOverlayPoint(i, j);
        const p = toCanvas(tp.x, tp.y);
        points.push(`${p.x},${p.y}`);
      }

      lines.push(
        <polyline
          key={`overlay-v-${i}`}
          points={points.join(' ')}
          fill="none"
          stroke={`rgba(139, 92, 246, ${overlayOpacity})`}
          strokeWidth={i === 0 ? 2 : 1}
          strokeDasharray={i === 0 ? 'none' : '4 3'}
        />
      );
    }

    for (let i = -extent; i <= extent; i++) {
      const points = [];
      for (let j = -extent; j <= extent; j++) {
        const tp = getOverlayPoint(j, i);
        const p = toCanvas(tp.x, tp.y);
        points.push(`${p.x},${p.y}`);
      }

      lines.push(
        <polyline
          key={`overlay-h-${i}`}
          points={points.join(' ')}
          fill="none"
          stroke={`rgba(139, 92, 246, ${overlayOpacity})`}
          strokeWidth={i === 0 ? 2 : 1}
          strokeDasharray={i === 0 ? 'none' : '4 3'}
        />
      );
    }

    return <g className="overlay-grid">{lines}</g>;
  }, [showGrid, overlayMatrix, overlayOpacity, toCanvas]);

  const overlayBasisVectors = useMemo(() => {
    if (!overlayMatrix || overlayOpacity <= 0) return null;
    const overlayColor = '#8B5CF6';

    const drawArrow = (fromX, fromY, toX, toY, label, labelOffset = -26) => {
      const origin = toCanvas(0, 0);
      const start = toCanvas(fromX, fromY);
      const end = toCanvas(toX, toY);
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const length = Math.sqrt(dx * dx + dy * dy);

      if (length < 10) return null;

      const angle = Math.atan2(dy, dx);
      const headLen = Math.min(14, length * 0.22);
      const headAngle = Math.PI / 6;

      const head1 = { x: end.x - headLen * Math.cos(angle - headAngle), y: end.y - headLen * Math.sin(angle - headAngle) };
      const head2 = { x: end.x - headLen * Math.cos(angle + headAngle), y: end.y - headLen * Math.sin(angle + headAngle) };

      const midX = (start.x + end.x) / 2;
      const midY = (start.y + end.y) / 2;

      return (
        <g opacity={overlayOpacity}>
          <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke={overlayColor} strokeWidth={3} strokeLinecap="round" />
          <polygon points={`${end.x},${end.y} ${head1.x},${head1.y} ${head2.x},${head2.y}`} fill={overlayColor} />
          <rect x={midX - 10} y={midY + labelOffset} width={20} height={18} rx={4} fill={darkMode ? 'rgba(30,41,59,0.9)' : 'rgba(255,255,255,0.9)'} />
          <text x={midX} y={midY + labelOffset + 12} fill={overlayColor} fontSize={11} fontWeight="700" textAnchor="middle">{label}</text>
        </g>
      );
    };

    return (
      <g className="overlay-basis">
        {drawArrow(0, 0, overlayMatrix[0][0], overlayMatrix[1][0], 'î')}
        {drawArrow(0, 0, overlayMatrix[0][1], overlayMatrix[1][1], 'ĵ', -16)}
      </g>
    );
  }, [overlayMatrix, overlayOpacity, toCanvas, darkMode]);

  const originMarker = useMemo(() => {
    const pos = toCanvas(0, 0);
    return (
      <g className="origin-marker">
        <circle cx={pos.x} cy={pos.y} r={6} fill={darkMode ? 'rgba(99,102,241,0.3)' : 'rgba(99,102,241,0.2)'} />
        <circle cx={pos.x} cy={pos.y} r={3} fill={darkMode ? '#6366F1' : '#4F46E5'} />
        {showOriginLabel && (
          <text
            x={pos.x + 12}
            y={pos.y + 16}
            fill={darkMode ? '#94a3b8' : '#64748b'}
            fontSize={10}
            fontWeight="600"
            fontFamily="var(--font-mono)"
          >
            (0, 0)
          </text>
        )}
      </g>
    );
  }, [toCanvas, darkMode, showOriginLabel]);

  const determinantParallelogram = useMemo(() => {
    if (!showBasis) return null;

    const origin = toCanvas(0, 0);
    const iHat = toCanvas(matrix[0][0], matrix[1][0]);
    const jHat = toCanvas(matrix[0][1], matrix[1][1]);

    const parallelogramPoints = `${origin.x},${origin.y} ${iHat.x},${iHat.y} ${iHat.x + jHat.x - origin.x},${iHat.y + jHat.y - origin.y} ${jHat.x},${jHat.y}`;

    const fillColor = det > 0
      ? 'rgba(126, 211, 33, 0.25)'
      : Math.abs(det) < 1e-10
        ? 'rgba(220, 53, 69, 0.08)'
        : 'rgba(220, 53, 69, 0.25)';

    const strokeColor = Math.abs(det) < 1e-10
      ? 'rgba(220, 53, 69, 0.6)'
      : det > 0
        ? 'rgba(126, 211, 33, 0.4)'
        : 'rgba(220, 53, 69, 0.4)';

    return (
      <motion.polygon
        points={parallelogramPoints}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={2}
        strokeDasharray={Math.abs(det) < 1e-10 ? '4 4' : 'none'}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />
    );
  }, [showBasis, toCanvas, matrix, det]);

  const iHatArrow = useMemo(() => {
    if (!showBasis) return null;
    const origin = toCanvas(0, 0);
    const tip = toCanvas(matrix[0][0], matrix[1][0]);

    const dx = tip.x - origin.x;
    const dy = tip.y - origin.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length < 8) return null;

    const angle = Math.atan2(dy, dx);
    const headLen = Math.min(18, length * 0.25);
    const headAngle = Math.PI / 6;

    const head1 = {
      x: tip.x - headLen * Math.cos(angle - headAngle),
      y: tip.y - headLen * Math.sin(angle - headAngle),
    };
    const head2 = {
      x: tip.x - headLen * Math.cos(angle + headAngle),
      y: tip.y - headLen * Math.sin(angle + headAngle),
    };

    const midX = (origin.x + tip.x) / 2;
    const midY = (origin.y + tip.y) / 2;

    return (
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <line
          x1={origin.x} y1={origin.y}
          x2={tip.x} y2={tip.y}
          stroke="#4A90E2"
          strokeWidth={4}
          strokeLinecap="round"
        />
        <polygon
          points={`${tip.x},${tip.y} ${head1.x},${head1.y} ${head2.x},${head2.y}`}
          fill="#4A90E2"
        />
        <rect
          x={midX - 14} y={midY - 22}
          width={28} height={22}
          rx={5}
          fill={darkMode ? 'rgba(30,41,59,0.95)' : 'rgba(255,255,255,0.95)'}
        />
        <text
          x={midX} y={midY - 6}
          fill="#4A90E2"
          fontSize={13}
          fontWeight="700"
          textAnchor="middle"
        >
          î
        </text>
      </motion.g>
    );
  }, [showBasis, toCanvas, matrix, darkMode]);

  const jHatArrow = useMemo(() => {
    if (!showBasis) return null;
    const origin = toCanvas(0, 0);
    const tip = toCanvas(matrix[0][1], matrix[1][1]);

    const dx = tip.x - origin.x;
    const dy = tip.y - origin.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length < 8) return null;

    const angle = Math.atan2(dy, dx);
    const headLen = Math.min(18, length * 0.25);
    const headAngle = Math.PI / 6;

    const head1 = {
      x: tip.x - headLen * Math.cos(angle - headAngle),
      y: tip.y - headLen * Math.sin(angle - headAngle),
    };
    const head2 = {
      x: tip.x - headLen * Math.cos(angle + headAngle),
      y: tip.y - headLen * Math.sin(angle + headAngle),
    };

    const offsetAngle = angle + Math.PI / 2;
    const labelOffset = 30;
    const labelX = origin.x + (tip.x - origin.x) / 2 + labelOffset * Math.cos(offsetAngle);
    const labelY = origin.y + (tip.y - origin.y) / 2 + labelOffset * Math.sin(offsetAngle);

    return (
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <line
          x1={origin.x} y1={origin.y}
          x2={tip.x} y2={tip.y}
          stroke="#7ED321"
          strokeWidth={4}
          strokeLinecap="round"
        />
        <polygon
          points={`${tip.x},${tip.y} ${head1.x},${head1.y} ${head2.x},${head2.y}`}
          fill="#7ED321"
        />
        <rect
          x={labelX - 14} y={labelY - 11}
          width={28} height={22}
          rx={5}
          fill={darkMode ? 'rgba(30,41,59,0.95)' : 'rgba(255,255,255,0.95)'}
        />
        <text
          x={labelX} y={labelY + 5}
          fill="#7ED321"
          fontSize={13}
          fontWeight="700"
          textAnchor="middle"
        >
          ĵ
        </text>
      </motion.g>
    );
  }, [showBasis, toCanvas, matrix, darkMode]);

  const sampleShape = useMemo(() => {
    if (!showShape) return null;

    const unitSquare = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: 1 },
    ];

    const transformedSquare = unitSquare.map(p => {
      const tp = getTransformedPoint(p.x, p.y);
      return toCanvas(tp.x, tp.y);
    });

    const squarePoints = transformedSquare.map(p => `${p.x},${p.y}`).join(' ');

    const arrowBase = { x: 0.3, y: 0.5 };
    const arrowTip = { x: 1.1, y: 0.5 };
    const arrowTransformed = [
      getTransformedPoint(arrowBase.x, arrowBase.y),
      getTransformedPoint(arrowTip.x, arrowTip.y),
    ].map(p => toCanvas(p.x, p.y));

    const dx = arrowTransformed[1].x - arrowTransformed[0].x;
    const dy = arrowTransformed[1].y - arrowTransformed[0].y;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length > 8) {
      const angle = Math.atan2(dy, dx);
      const headLen = Math.min(14, length * 0.25);
      const headAngle = Math.PI / 6;

      const arrowHead = `
        ${arrowTransformed[1].x},${arrowTransformed[1].y}
        ${arrowTransformed[1].x - headLen * Math.cos(angle - headAngle)},${arrowTransformed[1].y - headLen * Math.sin(angle - headAngle)}
        ${arrowTransformed[1].x - headLen * Math.cos(angle + headAngle)},${arrowTransformed[1].y - headLen * Math.sin(angle + headAngle)}
      `;

      return (
        <g>
          <polygon
            points={squarePoints}
            fill="rgba(99,102,241,0.15)"
            stroke="#6366F1"
            strokeWidth={2.5}
          />
          <polyline
            points={`${arrowTransformed[0].x},${arrowTransformed[0].y} ${arrowTransformed[1].x},${arrowTransformed[1].y}`}
            fill="none"
            stroke="#6366F1"
            strokeWidth={2.5}
            strokeLinecap="round"
          />
          <polygon
            points={arrowHead}
            fill="#6366F1"
          />
        </g>
      );
    }

    return (
      <polygon
        points={squarePoints}
        fill="rgba(99,102,241,0.15)"
        stroke="#6366F1"
        strokeWidth={2.5}
      />
    );
  }, [showShape, toCanvas, getTransformedPoint]);

  const highlightedPoint = useMemo(() => {
    if (!highlightPoint) return null;
    const { x, y, label, color = '#F59E0B' } = highlightPoint;
    const pos = toCanvas(x, y);

    return (
      <motion.g
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        <circle cx={pos.x} cy={pos.y} r={12} fill={color} fillOpacity={0.2} />
        <circle cx={pos.x} cy={pos.y} r={8} fill={color} />
        {label && (
          <g>
            <rect
              x={pos.x + 12}
              y={pos.y - 12}
              width={60}
              height={24}
              rx={5}
              fill={darkMode ? 'rgba(30,41,59,0.95)' : 'rgba(255,255,255,0.95)'}
            />
            <text
              x={pos.x + 42}
              y={pos.y + 4}
              fill={color}
              fontSize={12}
              fontWeight="700"
              fontFamily="var(--font-mono)"
              textAnchor="middle"
            >
              ({x.toFixed(1)}, {y.toFixed(1)})
            </text>
          </g>
        )}
      </motion.g>
    );
  }, [highlightPoint, toCanvas, darkMode]);

  const determinantLabel = useMemo(() => {
    if (!showBasis || Math.abs(det) < 1e-10) return null;

    const midX = (matrix[0][0] + matrix[0][1]) / 2;
    const midY = (matrix[1][0] + matrix[1][1]) / 2;
    const canvasPos = toCanvas(midX / 2, midY / 2);

    return (
      <motion.g
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <rect
          x={canvasPos.x - 55}
          y={canvasPos.y - 14}
          width={110}
          height={28}
          rx={6}
          fill={det > 0 ? 'rgba(126,211,33,0.25)' : 'rgba(220,53,69,0.25)'}
          stroke={det > 0 ? 'rgba(126,211,33,0.5)' : 'rgba(220,53,69,0.5)'}
          strokeWidth={1.5}
        />
        <text
          x={canvasPos.x}
          y={canvasPos.y + 6}
          fill={det > 0 ? '#7ED321' : '#DC3749'}
          fontSize={13}
          fontWeight="700"
          fontFamily="var(--font-mono)"
          textAnchor="middle"
        >
          |det| = {Math.abs(det).toFixed(2)}
        </text>
      </motion.g>
    );
  }, [showBasis, toCanvas, matrix, det]);

  const detZeroWarning = useMemo(() => {
    if (!showBasis || Math.abs(det) > 1e-10) return null;

    const center = toCanvas(0, 0);

    return (
      <motion.g
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <rect
          x={center.x - 70}
          y={center.y - 50}
          width={140}
          height={40}
          rx={8}
          fill="rgba(220,53,69,0.15)"
          stroke="#DC3749"
          strokeWidth={2}
        />
        <text
          x={center.x}
          y={center.y - 28}
          fill="#DC3749"
          fontSize={12}
          fontWeight="700"
          textAnchor="middle"
        >
          det = 0
        </text>
        <text
          x={center.x}
          y={center.y - 10}
          fill="#DC3749"
          fontSize={11}
          textAnchor="middle"
        >
          Space is flattened!
        </text>
      </motion.g>
    );
  }, [showBasis, toCanvas, det]);

  const handleMouseDown = useCallback((e) => {
    if (!interactive || !onDragEntry) return;

    e.preventDefault();
    e.stopPropagation();

    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const world = fromCanvas(clientX - rect.left, clientY - rect.top);

    const entries = [
      { row: 0, col: 0, x: 0, y: 0, label: 'a' },
      { row: 0, col: 1, x: 1, y: 0, label: 'b' },
      { row: 1, col: 0, x: 0, y: 1, label: 'c' },
      { row: 1, col: 1, x: 1, y: 1, label: 'd' },
    ];

    const hitRadius = 0.6;
    for (const entry of entries) {
      const dist = Math.sqrt(
        Math.pow(world.x - entry.x, 2) + Math.pow(world.y - entry.y, 2)
      );
      if (dist < hitRadius) {
        onDragEntry(entry.row, entry.col, matrix[entry.row][entry.col], clientY);
        return;
      }
    }
  }, [interactive, onDragEntry, fromCanvas, matrix]);

  const entries = useMemo(() => [
    { row: 0, col: 0, x: 0, y: 0, label: 'a', color: '#4A90E2' },
    { row: 0, col: 1, x: 1, y: 0, label: 'b', color: '#7ED321' },
    { row: 1, col: 0, x: 0, y: 1, label: 'c', color: '#4A90E2' },
    { row: 1, col: 1, x: 1, y: 1, label: 'd', color: '#7ED321' },
  ], []);

  const entryHitAreas = useMemo(() => {
    if (!interactive) return null;

    const zoomFactor = Math.max(0.92, Math.min(1.08, 100 / zoom));
    const baseRadius = Math.round(14 * zoomFactor);
    const fontSize = Math.round(11 * zoomFactor);
    const strokeWidth = 1.5;
    const isHoveredScale = 1.06;

    return (
      <g className="entry-hit-areas">
        {entries.map(entry => {
          const canvasPos = toCanvas(entry.x, entry.y);
          const isHovered = hoveredEntry === entry.label;
          const scale = isHovered ? isHoveredScale : 1;
          return (
            <g
              key={entry.label}
              transform={`translate(${canvasPos.x}, ${canvasPos.y}) scale(${scale})`}
              style={{ cursor: 'grab' }}
              onMouseEnter={() => setHoveredEntry(entry.label)}
              onMouseLeave={() => setHoveredEntry(null)}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDragEntry?.(entry.row, entry.col, matrix[entry.row][entry.col], e.clientY);
              }}
            >
              <circle
                cx={0}
                cy={0}
                r={baseRadius}
                fill={darkMode ? 'rgba(30,41,59,0.92)' : 'rgba(255,255,255,0.95)'}
                stroke={entry.color}
                strokeWidth={strokeWidth}
                style={{ transition: 'r 0.15s ease' }}
              />
              <text
                x={0}
                y={fontSize * 0.4}
                fill={entry.color}
                fontSize={fontSize}
                fontWeight="700"
                fontFamily="var(--font-mono)"
                textAnchor="middle"
                pointerEvents="none"
              >
                {entry.label}
              </text>
            </g>
          );
        })}
      </g>
    );
  }, [interactive, entries, toCanvas, hoveredEntry, zoom, matrix, onDragEntry, darkMode]);

  return (
    <svg
      ref={svgRef}
      width="100%"
      height="100%"
      className="transform-grid"
      onMouseDown={handleMouseDown}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ cursor: interactive ? 'default' : 'inherit', touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none' }}
    >
      {backgroundGridLines}
      {gridTickLabels}
      {overlayTransformedGrid}
      {transformedGridLines}
      {overlayBasisVectors}
      {originMarker}
      {sampleShape}
      {determinantParallelogram}
      {iHatArrow}
      {jHatArrow}
      {highlightedPoint}
      {determinantLabel}
      {detZeroWarning}
      {entryHitAreas}
    </svg>
  );
}