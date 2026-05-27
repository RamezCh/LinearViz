/* Hallmark · module: Vectors · theme: Plume · layout refinement
 * Uses design system tokens (paper, ink, muted, accent) throughout.
 */
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Plus, Trash2, ZoomIn, ZoomOut, RotateCcw, Move, Edit3, Check, X } from 'lucide-react';
import CompletionToggle from '../../components/UI/CompletionToggle';
import { magnitude, dotProduct, angleBetween } from '../../utils/linalg';
import { InlineText, VectorDisplay } from '../../components/UI/Math';
import katex from 'katex';
import 'katex/dist/katex.min.css';

const MIN_ZOOM = 0.3;
const MAX_ZOOM = 3;
const GRID_EXTENT = 6;

export default function VectorsModule() {
  const [vectors, setVectors] = useState([
    { id: 1, name: 'a', coords: [3, 2], color: 'oklch(52% 0.160 25)' },
    { id: 2, name: 'b', coords: [1, -1], color: 'oklch(52% 0.160 155)' },
  ]);
  const [selectedId, setSelectedId] = useState(1);
  const [currentStep, setCurrentStep] = useState(0);
  const [zoom, setZoom] = useState(1.2);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [showSum, setShowSum] = useState(true);
  const [showAngle, setShowAngle] = useState(true);
  const [learnMode, setLearnMode] = useState(true);
  const [dragging, setDragging] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [sumIds, setSumIds] = useState([1, 2]);
  const [showSumAnimation, setShowSumAnimation] = useState(false);
  const [sumAnimationStep, setSumAnimationStep] = useState(0);
  const [showDotProductViz, setShowDotProductViz] = useState(false);
  const canvasRef = useRef(null);
  const isPanning = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const [svgSize, setSvgSize] = useState({ w: 600, h: 400 });

  // ResizeObserver to track actual SVG pixel dimensions
  useEffect(() => {
    if (!canvasRef.current) return;
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setSvgSize({ w: width, h: height });
        }
      }
    });
    ro.observe(canvasRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!showSumAnimation) {
      if (sumAnimationStep !== 0) setSumAnimationStep(0);
      return;
    }
    if (sumAnimationStep === 0) {
      setSumAnimationStep(1);
      return;
    }
    if (sumAnimationStep >= 3) return;
    const timer = setTimeout(() => setSumAnimationStep(s => s + 1), 1500);
    return () => clearTimeout(timer);
  }, [showSumAnimation, sumAnimationStep]);

  const selectedVec = useMemo(() => vectors.find(v => v.id === selectedId) || null, [vectors, selectedId]);

  // The scale: how many pixels per world-unit
  const pixelsPerUnit = useMemo(() => {
    const minDim = Math.min(svgSize.w, svgSize.h);
    return (minDim / (2 * GRID_EXTENT)) * zoom;
  }, [svgSize.w, svgSize.h, zoom]);

  const toCanvas = useCallback((wx, wy) => {
    return {
      x: svgSize.w / 2 + wx * pixelsPerUnit + pan.x,
      y: svgSize.h / 2 - wy * pixelsPerUnit + pan.y,
    };
  }, [svgSize.w, svgSize.h, pixelsPerUnit, pan]);

  const fromCanvas = useCallback((cx, cy) => {
    if (pixelsPerUnit === 0) return { x: 0, y: 0 };
    return {
      x: (cx - svgSize.w / 2 - pan.x) / pixelsPerUnit,
      y: -(cy - svgSize.h / 2 - pan.y) / pixelsPerUnit,
    };
  }, [svgSize.w, svgSize.h, pixelsPerUnit, pan]);

  const zoomIn = () => setZoom(z => Math.min(MAX_ZOOM, z * 1.2));
  const zoomOut = () => setZoom(z => Math.max(MIN_ZOOM, z / 1.2));

  const addVector = () => {
    const id = Date.now();
    const letters = ['c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k'];
    const blockedColors = [
      'oklch(52% 0.160 25)',   // red (a)
      'oklch(52% 0.160 155)',  // green (b)
      'oklch(58% 0.130 300)',  // purple (sum)
      'oklch(58% 0.120 300)',  // dark purple (sum dark)
    ];
    const availableColors = [
      'oklch(52% 0.160 195)',  // blue
      'oklch(52% 0.160 250)',  // violet
      'oklch(62% 0.140 290)',  // light violet
      'oklch(65% 0.120 70)',   // amber
      'oklch(58% 0.160 220)',  // cyan
      'oklch(52% 0.140 155)',  // emerald
      'oklch(70% 0.100 150)',  // light green
      'oklch(72% 0.130 235)',  // light blue
    ];
    const usedColors = vectors.map(v => v.color);
    const unusedColors = availableColors.filter(c => !usedColors.includes(c));
    const name = letters[vectors.length] || `v${vectors.length + 1}`;
    const color = unusedColors.length > 0 
      ? unusedColors[0] 
      : availableColors[vectors.length % availableColors.length];
    setVectors(prev => [...prev, {
      id,
      name,
      coords: [Math.round((Math.random() * 6 - 3) * 2) / 2, Math.round((Math.random() * 6 - 3) * 2) / 2],
      color,
    }]);
    setSelectedId(id);
  };

  const deleteVector = (id) => {
    if (vectors.length <= 1) return;
    setVectors(prev => prev.filter(v => v.id !== id));
    if (selectedId === id) setSelectedId(vectors.find(v => v.id !== id)?.id || null);
  };

  const startEditing = (vec) => {
    setEditingId(vec.id);
    setEditName(vec.name);
  };

  const saveEdit = () => {
    if (editName && editName.trim() && editName.length <= 2) {
      setVectors(prev => prev.map(v => v.id === editingId ? { ...v, name: editName.trim() } : v));
    }
    setEditingId(null);
  };

  const resetAll = () => {
    setVectors([
      { id: 1, name: 'a', coords: [3, 2], color: 'oklch(52% 0.160 25)' },
      { id: 2, name: 'b', coords: [1, -1], color: 'oklch(52% 0.160 155)' },
    ]);
    setSelectedId(1);
    setSumIds([1, 2]);
    setZoom(1.2);
    setPan({ x: 0, y: 0 });
  };

  // Sync sumIds when vectors are deleted
  useEffect(() => {
    if (vectors.length === 0) return;
    
    // Ensure sumIds only contains existing vectors
    setSumIds(prev => {
      const filtered = prev.filter(id => vectors.some(v => v.id === id));
      if (filtered.length === 0 && vectors.length > 0) {
        return vectors.slice(0, Math.min(2, vectors.length)).map(v => v.id);
      }
      return filtered;
    });
  }, [vectors]);

  const v1 = useMemo(() => {
    if (sumIds.length === 0) return vectors[0] || null;
    return vectors.find(v => v.id === sumIds[0]) || vectors[0] || null;
  }, [vectors, sumIds]);
  
  const v2 = useMemo(() => {
    if (sumIds.length < 2) return vectors[1] || vectors[0] || null;
    return vectors.find(v => v.id === sumIds[1]) || vectors[1] || v1 || null;
  }, [vectors, sumIds, v1]);

  const activeSumVectors = useMemo(() => vectors.filter(v => sumIds.includes(v.id)), [vectors, sumIds]);

  const sumVec = useMemo(() => {
    if (activeSumVectors.length === 0) return null;
    const coords = activeSumVectors.reduce((acc, v) => [acc[0] + v.coords[0], acc[1] + v.coords[1]], [0, 0]);
    return { name: 'Σ', coords, color: 'var(--color-sum)' };
  }, [activeSumVectors]);

  const dotProd = useMemo(() => {
    if (!v1 || !v2) return 0;
    return dotProduct(v1.coords, v2.coords);
  }, [v1, v2]);

  const angle = useMemo(() => {
    if (!v1 || !v2) return 0;
    return angleBetween(v1.coords, v2.coords);
  }, [v1, v2]);

  const mag1 = v1 ? magnitude(v1.coords) : 0;
  const mag2 = v2 ? magnitude(v2.coords) : 0;

  const steps = [
    {
      title: 'What is a vector?',
      concept: 'A vector is a directed arrow — it has both length (magnitude) and direction. Drag the tip of any arrow to change it.',
      hint: 'Drag the tip of the arrow to move it. Notice how the coordinates change.',
      action: 'Drag any vector to move it',
    },
    {
      title: 'Where is the origin?',
      concept: 'Every vector starts at the origin $(0, 0)$ — where the two bold axes cross. The center marker shows you where $(0, 0)$ is on the grid.',
      hint: 'Look for the accent-colored circle at the center.',
      action: 'Find the origin marker at 0, 0',
    },
    {
      title: 'Vector coordinates',
      concept: `A vector is written as $\\begin{pmatrix} x \\\\ y \\end{pmatrix}$ where x is how far right and y is how far up. The vector $${selectedVec?.name || v1?.name || 'a'} = \\begin{pmatrix} ${selectedVec?.coords[0].toFixed(1) || 0} \\\\ ${selectedVec?.coords[1].toFixed(1) || 0} \\end{pmatrix}$ goes ${Math.abs(selectedVec?.coords[0] || 0).toFixed(0)} steps ${(selectedVec?.coords[0] || 0) >= 0 ? 'right' : 'left'} and ${Math.abs(selectedVec?.coords[1] || 0).toFixed(0)} steps ${(selectedVec?.coords[1] || 0) >= 0 ? 'up' : 'down'} from the origin.`,
      hint: 'Select a vector in the legend overlay to see its coordinates.',
      action: 'Select a vector and read its coordinates',
    },
    {
      title: 'What is magnitude?',
      concept: `The magnitude $\\|${v1?.name || 'a'}\\| = \\sqrt{${v1?.coords[0].toFixed(1) || 0}^2 + ${v1?.coords[1].toFixed(1) || 0}^2} \\approx ${mag1.toFixed(1)}$ is the length of the arrow — the straight-line distance from the origin to the tip.`,
      hint: 'The sidebar shows |a| = magnitude for the selected vector.',
      action: 'Read the magnitude in the right sidebar',
    },
    {
      title: 'What is vector addition?',
      concept: `Adding vectors places them tip-to-tail: $${v1?.name || 'a'} + ${v2?.name || 'b'} = \\begin{pmatrix} ${(v1?.coords[0] || 0) + (v2?.coords[0] || 0)} \\\\ ${(v1?.coords[1] || 0) + (v2?.coords[1] || 0)} \\end{pmatrix}$. The purple arrow $(\\Sigma)$ shows their sum.`,
      hint: 'The purple Σ arrow is the sum. The dashed parallelogram shows how tip-to-tail addition works geometrically.',
      action: 'Watch how a + b forms the purple sum arrow',
    },
    {
      title: 'What is the dot product?',
      concept: `$${v1?.name || 'a'} \\cdot ${v2?.name || 'b'} = ${(v1?.coords[0] || 0).toFixed(1)} \\times ${(v2?.coords[0] || 0).toFixed(1)} + ${(v1?.coords[1] || 0).toFixed(1)} \\times ${(v2?.coords[1] || 0).toFixed(1)} = ${dotProd.toFixed(2)}$. Multiply matching coordinates and add!`,
      hint: 'The sidebar shows the full dot product calculation with the component breakdown.',
      action: 'Find the dot product calculation in the right sidebar',
    },
    {
      title: 'What does the dot product tell us?',
      concept: `$${v1?.name || 'a'} \\cdot ${v2?.name || 'b'} = \\|${v1?.name || 'a'}\\| \\times \\|${v2?.name || 'b'}\\| \\times \\cos(\\theta) = ${mag1.toFixed(1)} \\times ${mag2.toFixed(1)} \\times \\cos(${angle.toFixed(0)}^\\circ) = ${dotProd.toFixed(2)}$. The dot product measures how much vectors point in the SAME direction.`,
      hint: 'Drag a vector to see the angle change. Watch the dot product sign change.',
      action: 'Drag vectors to see angle affect dot product sign',
    },
    {
      title: 'Angle interpretation',
      concept: `• Positive: acute angle $(<90^\\circ)$ — similar direction\n• Zero: perpendicular $(90^\\circ)$ — no overlap\n• Negative: obtuse $(>90^\\circ)$ — opposite directions\n• Geometrically: projection of one vector onto another.`,
      hint: 'Watch the indicator in the right panel change as you move vectors.',
      action: 'Check the dot product indicator in the sidebar',
    },
    {
      title: 'Explore freely',
      concept: `You have ${vectors.length} vector${vectors.length > 1 ? 's' : ''}: ${vectors.map(v => `$${v.name}=\\begin{pmatrix}${v.coords[0]},${v.coords[1]}\\end{pmatrix}$`).join(', ')}. Add more, rename them, or watch how they sum together. Experiment!`,
      hint: 'Click + to add a vector, or click a vector name to select and rename it.',
      action: 'Add a third vector with the + button',
    },
  ];

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(z => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z * delta)));
  };

  const handleMouseDown = (e) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      isPanning.current = true;
      lastPos.current = { x: e.clientX, y: e.clientY };
      return;
    }
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const world = fromCanvas(cx, cy);
    const hitRadius = 1.5 / zoom + 0.5;
    let closest = null;
    let minDist = Infinity;
    vectors.forEach(v => {
      const dist = Math.hypot(world.x - v.coords[0], world.y - v.coords[1]);
      if (dist < minDist && dist < hitRadius) {
        minDist = dist;
        closest = v.id;
      }
    });
    setSelectedId(closest ?? selectedId);
    if (closest !== null) {
      setDragging(closest);
    }
  };

  const handleMouseMove = (e) => {
    if (isPanning.current) {
      const dx = e.clientX - lastPos.current.x;
      const dy = e.clientY - lastPos.current.y;
      setPan(p => ({ x: p.x + dx, y: p.y + dy }));
      lastPos.current = { x: e.clientX, y: e.clientY };
      return;
    }
    if (!dragging || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const world = fromCanvas(cx, cy);
    setVectors(prev => prev.map(v =>
      v.id === dragging
        ? { ...v, coords: [Math.round(world.x * 2) / 2, Math.round(world.y * 2) / 2] }
        : v
    ));
  };

  const handleMouseUp = () => {
    isPanning.current = false;
    setDragging(null);
  };

  // ── Rendering helpers ──

  const renderGrid = () => {
    const lines = [];
    const { w, h } = svgSize;
    // How many grid lines we need to cover the visible area
    const visibleExtentX = (w / 2) / pixelsPerUnit + Math.abs(pan.x) / pixelsPerUnit + 1;
    const visibleExtentY = (h / 2) / pixelsPerUnit + Math.abs(pan.y) / pixelsPerUnit + 1;
    const maxExtent = Math.ceil(Math.max(visibleExtentX, visibleExtentY, GRID_EXTENT));

    for (let i = -maxExtent; i <= maxExtent; i++) {
      const pos = toCanvas(i, 0);
      if (pos.x >= 0 && pos.x <= w) {
        lines.push(
          <line key={`v${i}`} x1={pos.x} y1={0} x2={pos.x} y2={h}
            stroke="var(--color-rule)" strokeWidth="1" />
        );
      }
      const posY = toCanvas(0, i);
      if (posY.y >= 0 && posY.y <= h) {
        lines.push(
          <line key={`h${i}`} x1={0} y1={posY.y} x2={w} y2={posY.y}
            stroke="var(--color-rule)" strokeWidth="1" />
        );
      }
    }
    return lines;
  };

  const renderArrow = (from, to, color, width = 3, dashed = false) => {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 3) return null;
    const a = Math.atan2(dy, dx);
    const headLen = Math.min(14, len * 0.3);
    const headAngle = Math.PI / 6;
    return (
      <g>
        <line x1={from.x} y1={from.y} x2={to.x} y2={to.y}
          stroke={color} strokeWidth={width} strokeDasharray={dashed ? '8 4' : undefined} strokeLinecap="round" />
        <polygon
          points={`${to.x},${to.y} ${to.x - headLen * Math.cos(a - headAngle)},${to.y - headLen * Math.sin(a - headAngle)} ${to.x - headLen * Math.cos(a + headAngle)},${to.y - headLen * Math.sin(a + headAngle)}`}
          fill={color} />
      </g>
    );
  };

  const renderSumAnimation = () => {
    if (!showSumAnimation || activeSumVectors.length < 2 || !v1 || !v2) return null;
    
    const origin = toCanvas(0, 0);
    const v1Tip = toCanvas(v1.coords[0], v1.coords[1]);
    const v1AtV2 = toCanvas(v1.coords[0] + v2.coords[0], v1.coords[1] + v2.coords[1]);
    const ghostStart = v1Tip;
    const ghostEnd = v1AtV2;
    const sumTip = toCanvas(sumVec.coords[0], sumVec.coords[1]);

    const v1MidX = (origin.x + v1Tip.x) / 2;
    const v1MidY = (origin.y + v1Tip.y) / 2;
    const v2MidX = (ghostStart.x + ghostEnd.x) / 2;
    const v2MidY = (ghostStart.y + ghostEnd.y) / 2;
    const sumMidX = (origin.x + sumTip.x) / 2;
    const sumMidY = (origin.y + sumTip.y) / 2;

    const getLabelOffset = (dirX, dirY) => {
      if (Math.abs(dirY) > Math.abs(dirX)) {
        return dirY > 0 ? { x: 12, y: 0, anchor: 'start' } : { x: -12, y: 0, anchor: 'end' };
      }
      return dirX > 0 ? { x: 0, y: -25, anchor: 'middle' } : { x: 0, y: 25, anchor: 'middle' };
    };

    const v2Offset = getLabelOffset(v2.coords[0], v2.coords[1]);
    const sumOffset = getLabelOffset(sumVec.coords[0], sumVec.coords[1]);

    return (
      <g>
        {sumAnimationStep >= 0 && (
          <line x1={origin.x} y1={origin.y} x2={v1Tip.x} y2={v1Tip.y}
            stroke={v1.color} strokeWidth="4" strokeLinecap="round" />
        )}

        {sumAnimationStep >= 1 && (
          <g>
            <line x1={ghostStart.x} y1={ghostStart.y} x2={ghostEnd.x} y2={ghostEnd.y}
              stroke={v2.color} strokeWidth="3" strokeLinecap="round" strokeDasharray="6 4" />
            <polygon points={`${ghostEnd.x},${ghostEnd.y} ${ghostEnd.x - 12},${ghostEnd.y + 6} ${ghostEnd.x - 12},${ghostEnd.y - 6}`}
              fill={v2.color} />
            <rect x={v2MidX + v2Offset.x - 28} y={v2MidY + v2Offset.y - 16} width="56" height="32" rx="6"
              fill="var(--color-paper)" stroke={v2.color} strokeWidth="1.5" />
            <text x={v2MidX + v2Offset.x} y={v2MidY + v2Offset.y}
              fontSize="12" fontWeight="700" fontFamily="var(--font-mono)"
              textAnchor={v2Offset.anchor} fill={v2.color}>{v2.name}</text>
          </g>
        )}

        {sumAnimationStep >= 2 && (
          <g>
            {renderArrow(origin, sumTip, 'var(--color-sum)', 5)}
            <rect x={sumMidX + sumOffset.x - 38} y={sumMidY + sumOffset.y - 16} width="76" height="32" rx="6"
              fill="var(--color-paper)" stroke="var(--color-sum)" strokeWidth="1.5" />
            <text x={sumMidX + sumOffset.x} y={sumMidY + sumOffset.y}
              fontSize="11" fontWeight="700" fontFamily="var(--font-mono)"
              textAnchor="middle" fill="var(--color-sum)">{v1.name} + {v2.name}</text>
          </g>
        )}
      </g>
    );
  };

  const renderAngleArc = () => {
    if (!v1 || !v2 || !showAngle || v1.id === v2.id) return null;
    const a1 = Math.atan2(v1.coords[1], v1.coords[0]);
    const a2 = Math.atan2(v2.coords[1], v2.coords[0]);
    let diff = a2 - a1;
    if (diff > Math.PI) diff -= 2 * Math.PI;
    if (diff < -Math.PI) diff += 2 * Math.PI;
    const displayAngle = Math.abs((diff * 180) / Math.PI);
    if (displayAngle < 2) return null;
    const cross = v1.coords[0] * v2.coords[1] - v1.coords[1] * v2.coords[0];
    const largeArc = displayAngle > 180 ? 1 : 0;
    const sweep = cross > 0 ? 0 : 1;
    const midAngle = a1 + diff / 2;
    const origin = toCanvas(0, 0);
    const arcR = pixelsPerUnit * 0.8;
    const labelR = arcR + 20;
    const x1 = origin.x + arcR * Math.cos(a1);
    const y1 = origin.y - arcR * Math.sin(a1);
    const x2 = origin.x + arcR * Math.cos(a2);
    const y2 = origin.y - arcR * Math.sin(a2);
    return (
      <g>
        <path
          d={`M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${arcR.toFixed(1)} ${arcR.toFixed(1)} 0 ${largeArc} ${sweep} ${x2.toFixed(1)} ${y2.toFixed(1)}`}
          fill="none"
          stroke="oklch(65% 0.100 70)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <text
          x={origin.x + labelR * Math.cos(midAngle)}
          y={origin.y - labelR * Math.sin(midAngle)}
          fill="oklch(65% 0.100 70)"
          fontSize="12"
          fontWeight="700"
          textAnchor="middle"
          dominantBaseline="middle"
          fontFamily="var(--font-mono)"
        >
          {displayAngle.toFixed(0)}°
        </text>
      </g>
    );
  };

  const renderParallelogram = () => {
    const active = vectors.filter(v => sumIds.includes(v.id));
    if (!showSum || active.length !== 2 || !sumVec) return null;
    const v1 = active[0], v2 = active[1];
    if (v1.id === v2.id) return null;

    const o = toCanvas(0, 0);
    const a = toCanvas(v1.coords[0], v1.coords[1]);
    const b = toCanvas(v2.coords[0], v2.coords[1]);
    const s = toCanvas(sumVec.coords[0], sumVec.coords[1]);
    const cx = (o.x + a.x + s.x + b.x) / 4;
    const cy = (o.y + a.y + s.y + b.y) / 4;
    return (
      <g>
        <polygon points={`${o.x},${o.y} ${a.x},${a.y} ${s.x},${s.y} ${b.x},${b.y}`}
          fill="var(--color-sum)" fillOpacity="0.08"
          stroke="var(--color-sum)" strokeWidth="1.5" strokeDasharray="6 3" strokeOpacity="0.4" />
        <text x={cx} y={cy} fill="oklch(65% 0.100 70)" fontSize="10" fontWeight="700"
          fontFamily="var(--font-mono)" textAnchor="middle" dominantBaseline="middle"
          opacity="0.7">
          {v1.name} + {v2.name}
        </text>
      </g>
    );
  };

  const renderTipToTailChain = () => {
    if (!showSum) return null;
    const active = vectors.filter(v => sumIds.includes(v.id));
    if (active.length < 3) return null;

    const segments = [];
    let currentPos = [0, 0];
    const startVec = active[0];
    currentPos = [...startVec.coords];
    
    for (let i = 1; i < active.length; i++) {
      const v = active[i];
      const nextPos = [currentPos[0] + v.coords[0], currentPos[1] + v.coords[1]];
      const fromCanvasPos = toCanvas(currentPos[0], currentPos[1]);
      const toCanvasPos = toCanvas(nextPos[0], nextPos[1]);
      
      segments.push(
        <g key={`chain-${v.id}-${i}`}>
          {renderArrow(fromCanvasPos, toCanvasPos, v.color, 2, true)}
          <text
            x={(fromCanvasPos.x + toCanvasPos.x) / 2}
            y={(fromCanvasPos.y + toCanvasPos.y) / 2 - 8}
            fill={v.color}
            fontSize="10"
            fontWeight="700"
            fontFamily="var(--font-mono)"
            textAnchor="middle"
            opacity="0.8"
          >
            {v.name}
          </text>
        </g>
      );
      currentPos = nextPos;
    }
    return segments;
  };

  const renderVector = (vec) => {
    const origin = toCanvas(0, 0);
    const tip = toCanvas(vec.coords[0], vec.coords[1]);
    const isSelected = selectedId === vec.id;
    const dx = tip.x - origin.x;
    const dy = tip.y - origin.y;
    const a = Math.atan2(dy, dx);
    const tx = tip.x + 16;
    const ty = tip.y;
    // Hit area radius in pixels
    const hitR = 18;
    return (
      <g key={vec.id}>
        {renderArrow(origin, tip, vec.color, isSelected ? 4 : 3)}
        {/* Large invisible hit area for dragging */}
        <circle
          cx={tip.x}
          cy={tip.y}
          r={hitR}
          fill="transparent"
          stroke="transparent"
          style={{ cursor: 'move', pointerEvents: 'all' }}
        />
        {/* Label */}
        <text x={tx} y={ty} fill={vec.color} fontSize="13" fontWeight="700"
          fontFamily="var(--font-mono)" dominantBaseline="middle">
          {vec.name}
        </text>
        <text x={tx} y={ty + 15}
          fill="var(--color-muted)" fontSize="9" fontFamily="var(--font-mono)" dominantBaseline="middle">
          [{vec.coords[0].toFixed(1)}, {vec.coords[1].toFixed(1)}]
        </text>
      </g>
    );
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Top Control Bar */}
      <div
        className="flex items-center gap-2 px-3 py-2 border-b flex-shrink-0 flex-wrap"
        style={{
          backgroundColor: 'var(--color-paper)',
          borderColor: 'var(--color-rule)',
        }}
      >
        {/* Zoom controls */}
        <div className="flex items-center gap-1">
          <button onClick={zoomOut}
            className="p-1.5 rounded-lg transition-all duration-150"
            style={{ color: 'var(--color-muted)', backgroundColor: 'transparent' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-paper-2)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            title="Zoom Out">
            <ZoomOut className="w-4 h-4" />
          </button>

          <div
            className="px-2 py-0.5 rounded-lg text-xs font-semibold min-w-[48px] text-center"
            style={{ backgroundColor: 'var(--color-paper-2)', color: 'var(--color-ink)', fontFamily: 'var(--font-mono)' }}
          >
            {Math.round(zoom * 100)}%
          </div>

          <button onClick={zoomIn}
            className="p-1.5 rounded-lg transition-all duration-150"
            style={{ color: 'var(--color-muted)', backgroundColor: 'transparent' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-paper-2)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            title="Zoom In">
            <ZoomIn className="w-4 h-4" />
          </button>

          <button onClick={() => setPan({ x: 0, y: 0 })}
            className="p-1.5 rounded-lg transition-all duration-150"
            style={{ color: 'var(--color-muted)', backgroundColor: 'transparent' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-paper-2)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            title="Reset Position">
            <Move className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1" />

        {/* Quick math display */}
        {activeSumVectors.length > 0 && (
          <div className="hidden lg:flex items-center gap-1.5 text-xs font-mono flex-wrap">
            {activeSumVectors.map((v, idx) => (
              <span key={v.id} className="flex items-center gap-1">
                {idx > 0 && <span className="text-sm font-light mr-1" style={{ color: 'var(--color-muted)' }}>+</span>}
                <span className="font-bold mr-0.5" style={{ color: v.color }}>{v.name}</span>
                <div
                  className="px-2 py-0.5 rounded-lg font-semibold"
                  style={{
                    backgroundColor: 'var(--color-paper-2)',
                    color: v.color,
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  [{v.coords[0].toFixed(1)}, {v.coords[1].toFixed(1)}]
                </div>
              </span>
            ))}
            
            {activeSumVectors.length >= 2 && sumVec && (
              <>
                <span className="text-sm font-light" style={{ color: 'var(--color-muted)' }}>=</span>
                <span className="font-bold text-accent">Σ</span>
                <div
                  className="px-2 py-0.5 rounded-lg font-semibold"
                  style={{
                    backgroundColor: 'var(--color-accent)',
                    color: 'var(--color-paper)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  [{sumVec.coords[0].toFixed(1)}, {sumVec.coords[1].toFixed(1)}]
                </div>
              </>
            )}
          </div>
        )}

        {/* Toggle buttons */}
        <div className="flex items-center gap-1.5">
          <button onClick={() => setLearnMode(!learnMode)}
            className="px-3 py-1 text-xs font-semibold rounded-lg border transition-all duration-150"
            style={learnMode
              ? { backgroundColor: 'var(--color-accent)', color: 'var(--color-paper)', borderColor: 'var(--color-accent)' }
              : { backgroundColor: 'var(--color-paper)', color: 'var(--color-ink-2)', borderColor: 'var(--color-rule)' }
            }
          >
            {learnMode ? '✓ ' : ''}Learn
          </button>

          <button onClick={() => setShowSum(!showSum)}
            className="px-3 py-1 text-xs font-semibold rounded-lg transition-all duration-150 border"
            style={showSum
              ? { backgroundColor: 'var(--color-accent)', color: 'var(--color-paper)', borderColor: 'var(--color-accent)' }
              : { backgroundColor: 'var(--color-paper)', color: 'var(--color-ink-2)', borderColor: 'var(--color-rule)' }
            }
          >
            {showSum ? '✓ ' : ''}Sum
          </button>

          <button onClick={() => setShowAngle(!showAngle)}
            className="px-3 py-1 text-xs font-semibold rounded-lg transition-all duration-150 border"
            style={showAngle
              ? { backgroundColor: 'var(--color-accent)', color: 'var(--color-paper)', borderColor: 'var(--color-accent)' }
              : { backgroundColor: 'var(--color-paper)', color: 'var(--color-ink-2)', borderColor: 'var(--color-rule)' }
            }
          >
            {showAngle ? '✓ ' : ''}Angle
          </button>

          <button onClick={() => {
              if (showSumAnimation) {
                setShowSum(true);
                setShowAngle(true);
                setShowSumAnimation(false);
              } else {
                setShowSum(false);
                setShowAngle(false);
                setShowSumAnimation(true);
              }
            }}
            className="px-3 py-1 text-xs font-semibold rounded-lg transition-all duration-150 border"
            style={showSumAnimation
              ? { backgroundColor: 'var(--color-sum)', color: 'var(--color-paper)', borderColor: 'var(--color-sum)' }
              : { backgroundColor: 'var(--color-paper)', color: 'var(--color-ink-2)', borderColor: 'var(--color-rule)' }
            }
          >
            {showSumAnimation ? '✓ ' : ''}Sum Anim
          </button>
        </div>

        <button onClick={resetAll}
          className="p-1.5 rounded-lg transition-all duration-150"
          style={{ color: 'var(--color-muted)', backgroundColor: 'transparent' }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-paper-2)'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          title="Reset All">
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Guided Learning Card */}
        {learnMode && (
          <div
            className="px-4 py-2.5 border-b flex-shrink-0"
            style={{
              background: 'linear-gradient(to right, rgba(75,150,200,0.06), rgba(75,200,150,0.06))',
              borderColor: 'var(--color-rule)',
            }}
          >
            <div className="flex items-center gap-3 max-w-full">
              {/* Step counter */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{
                    backgroundColor: 'var(--color-accent)',
                    color: 'var(--color-paper)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {currentStep + 1}
                </div>
                <span className="text-xs font-semibold" style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
                  / {steps.length}
                </span>
              </div>

              {/* Vertical divider */}
              <div className="w-px h-8 flex-shrink-0" style={{ backgroundColor: 'var(--color-rule)' }} />

              {/* Step content */}
              <div className="flex-1 min-w-0 overflow-hidden">
                <h3
                  className="text-sm font-bold mb-0.5 truncate"
                  style={{
                    color: 'var(--color-ink)',
                    fontFamily: 'var(--font-display)',
                  }}
                >
                  {steps[currentStep].title}
                </h3>
                <p
                  className="text-xs leading-relaxed"
                  style={{ color: 'var(--color-muted)', whiteSpace: 'pre-line' }}
                >
                  <InlineText text={steps[currentStep].concept} />
                </p>
              </div>

              {/* Nav buttons */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    backgroundColor: currentStep > 0 ? 'var(--color-paper-2)' : 'transparent',
                    color: currentStep > 0 ? 'var(--color-ink)' : 'transparent',
                    cursor: currentStep > 0 ? 'pointer' : 'default',
                  }}
                  disabled={currentStep <= 0}
                >
                  ←
                </button>

                <div className="flex items-center gap-1">
                  {steps.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentStep(i)}
                      className="rounded-full transition-all duration-200"
                      style={{
                        width: currentStep === i ? '10px' : '5px',
                        height: '5px',
                        backgroundColor: currentStep === i ? 'var(--color-accent)' : 'var(--color-rule)',
                        cursor: 'pointer',
                      }}
                    />
                  ))}
                </div>

                <button
                  onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    backgroundColor: currentStep < steps.length - 1 ? 'var(--color-accent)' : 'transparent',
                    color: currentStep < steps.length - 1 ? 'var(--color-paper)' : 'transparent',
                    cursor: currentStep < steps.length - 1 ? 'pointer' : 'default',
                  }}
                  disabled={currentStep >= steps.length - 1}
                >
                  →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Canvas + Right Panel */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Main Canvas area */}
          <div className="flex-1 min-h-0 min-w-0 relative">
            <svg
              ref={canvasRef}
              className="w-full h-full cursor-grab active:cursor-grabbing select-none"
              style={{
                backgroundColor: 'var(--color-paper)',
                display: 'block',
                touchAction: 'none',
              }}
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={(e) => {
                const touch = e.touches[0];
                handleMouseDown({ button: 0, clientX: touch.clientX, clientY: touch.clientY, altKey: false });
              }}
              onTouchMove={(e) => {
                const touch = e.touches[0];
                handleMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
              }}
              onTouchEnd={handleMouseUp}
            >
              {renderGrid()}
              {(() => {
                const origin = toCanvas(0, 0);
                const { w, h } = svgSize;
                return (
                  <g>
                    {/* Extended axis lines */}
                    <line x1={0} y1={origin.y} x2={w} y2={origin.y} stroke="var(--color-neutral)" strokeWidth="1.5" opacity="0.4" />
                    <line x1={origin.x} y1={0} x2={origin.x} y2={h} stroke="var(--color-neutral)" strokeWidth="1.5" opacity="0.4" />
                    {/* Origin crosshair */}
                    <line x1={origin.x - 12} y1={origin.y} x2={origin.x + 12} y2={origin.y} stroke="var(--color-neutral)" strokeWidth="2.5" opacity="0.9" />
                    <line x1={origin.x} y1={origin.y - 12} x2={origin.x} y2={origin.y + 12} stroke="var(--color-neutral)" strokeWidth="2.5" opacity="0.9" />
                    {/* Origin dot */}
                    <circle cx={origin.x} cy={origin.y} r={7} fill="var(--color-accent)" />
                    <circle cx={origin.x} cy={origin.y} r={3.5} fill="var(--color-paper)" />
                    {/* Axis labels */}
                    <text x={w - 14} y={origin.y - 10} fill="var(--color-neutral)" fontSize="11" fontWeight="600"
                      fontFamily="var(--font-mono)" textAnchor="end" opacity="0.7">x</text>
                    <text x={origin.x + 12} y={16} fill="var(--color-neutral)" fontSize="11" fontWeight="600"
                      fontFamily="var(--font-mono)" textAnchor="start" opacity="0.7">y</text>
                    {/* Origin label */}
                    <text
                      x={origin.x + 16}
                      y={origin.y + 20}
                      fill="oklch(52% 0.10 155)"
                      fontSize="10"
                      fontWeight="600"
                      fontFamily="var(--font-mono)"
                      dominantBaseline="auto"
                    >
                      (0, 0)
                    </text>
                  </g>
                );
              })()}
              {renderParallelogram()}
              {renderTipToTailChain()}
              {vectors.map(renderVector)}
              {showSum && sumVec && (() => {
                const sumTip = toCanvas(sumVec.coords[0], sumVec.coords[1]);
                const origin = toCanvas(0, 0);
                return (
                  <g>
                    {renderArrow(origin, sumTip, sumVec.color, 4)}
                    <text
                      x={sumTip.x + 18}
                      y={sumTip.y - 10}
                      fill={sumVec.color} fontSize="14" fontWeight="700" fontFamily="var(--font-mono)"
                    >
                      Σ
                    </text>
                  </g>
                );
              })()}
              {renderAngleArc()}

              {renderSumAnimation()}
            </svg>

            {/* ── Vector Legend Overlay ── */}
            <div
              className="absolute top-3 left-3 rounded-xl overflow-hidden"
              style={{
                backgroundColor: 'color-mix(in oklch, var(--color-paper) 88%, transparent)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid var(--color-rule)',
                boxShadow: 'var(--shadow-md)',
                maxWidth: '220px',
                minWidth: '160px',
              }}
            >
              <div className="px-3 py-2 flex items-center justify-between"
                style={{ borderBottom: '1px solid var(--color-rule)' }}>
                <span className="text-xs font-semibold" style={{
                  color: 'var(--color-neutral)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  fontFamily: 'var(--font-body)',
                }}>
                  Vectors ({vectors.length})
                </span>
                <button onClick={addVector}
                  className="p-1 rounded-md transition-all duration-150 flex items-center justify-center"
                  style={{
                    backgroundColor: 'var(--color-accent)',
                    color: 'var(--color-paper)',
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                  title="Add Vector">
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="px-2 py-1.5 space-y-0.5" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {vectors.map(vec => {
                  const isSelected = selectedId === vec.id;
                  const isInSum = sumIds.includes(vec.id);
                  return (
                    <div
                      key={vec.id}
                      onClick={() => setSelectedId(vec.id)}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-all duration-100"
                      style={{
                        backgroundColor: isSelected ? 'rgba(75,160,195,0.15)' : isInSum ? 'rgba(88,0,150,0.08)' : 'transparent',
                        borderWidth: isInSum ? '1.5px' : '0',
                        borderStyle: 'solid',
                        borderColor: isInSum ? 'var(--color-sum)' : 'transparent',
                      }}
                      onMouseEnter={e => {
                        if (!isSelected && !isInSum) e.currentTarget.style.backgroundColor = 'var(--color-paper-2)';
                      }}
                      onMouseLeave={e => {
                        if (!isSelected && !isInSum) e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      {/* Checkbox for sum inclusion */}
                      <input
                        type="checkbox"
                        checked={sumIds.includes(vec.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          if (sumIds.includes(vec.id)) {
                            if (sumIds.length > 1) {
                              setSumIds(prev => prev.filter(id => id !== vec.id));
                            }
                          } else {
                            setSumIds(prev => [...prev, vec.id]);
                          }
                        }}
                        className="w-3.5 h-3.5 rounded border-gray-300 cursor-pointer flex-shrink-0"
                        style={{ accentColor: 'var(--color-accent)' }}
                        title="Include in Sum Addition"
                      />
                      {/* Color dot */}
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: vec.color }} />
                      {/* Name */}
                      <span className="text-xs font-bold flex-shrink-0" style={{ color: vec.color, fontFamily: 'var(--font-mono)' }}>
                        {vec.name}
                      </span>
                      {/* Coords */}
                      <span className="text-xs flex-1" style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
                        [{vec.coords[0].toFixed(1)}, {vec.coords[1].toFixed(1)}]
                      </span>
                      {/* Delete button */}
                      {vectors.length > 1 && (
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteVector(vec.id); }}
                          className="p-0.5 rounded transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
                          style={{ color: 'oklch(52% 0.140 25)' }}
                          onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.backgroundColor = 'rgba(175,90,65,0.08)'; }}
                          onMouseLeave={e => { e.currentTarget.style.opacity = isSelected ? '0.6' : '0'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                          title="Delete"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
                {/* Sum entry */}
                {showSum && sumVec && vectors.length >= 2 && (
                  <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg border-t mt-1 pt-1.5"
                    style={{ borderColor: 'var(--color-sum)' }}>
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: 'var(--color-sum)' }} />
                    <span className="text-xs font-bold flex-shrink-0" style={{ color: 'var(--color-sum)', fontFamily: 'var(--font-mono)' }}>
                      Σ
                    </span>
                    <span className="text-xs flex-1" style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
                      [{sumVec.coords[0].toFixed(1)}, {sumVec.coords[1].toFixed(1)}]
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="relative flex-shrink-0 border-l" style={{ borderColor: 'var(--color-rule)', backgroundColor: 'var(--color-paper)' }}>
            <div
              className="w-72 lg:w-80 xl:w-96 min-h-0 overflow-y-auto overflow-x-hidden p-3 space-y-3"
              style={{ maxHeight: 'calc(100vh - 100px)' }}
            >

              {/* Selected Vector Details */}
              {selectedVec && (
                <div
                  className="p-3 rounded-xl"
                  style={{ backgroundColor: 'var(--color-paper-2)' }}
                >
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ backgroundColor: selectedVec.color }} />
                      {editingId === selectedVec.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                            className="w-10 px-1.5 py-0.5 text-sm font-bold text-center rounded outline-none"
                            style={{
                              backgroundColor: 'var(--color-paper)',
                              border: '2px solid var(--color-accent)',
                              color: 'var(--color-ink)',
                              fontFamily: 'var(--font-mono)',
                            }}
                            maxLength={2}
                            autoFocus
                          />
                          <button onClick={saveEdit}
                            className="p-1 rounded-lg transition-colors"
                            style={{ backgroundColor: 'oklch(52% 0.120 155)', color: 'var(--color-paper)' }}>
                            <Check className="w-3 h-3" />
                          </button>
                          <button onClick={() => setEditingId(null)}
                            className="p-1 rounded-lg transition-colors"
                            style={{ backgroundColor: 'var(--color-rule)', color: 'var(--color-ink-2)' }}>
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <span className="font-bold text-sm" style={{ color: selectedVec.color, fontFamily: 'var(--font-mono)' }}>
                            {selectedVec.name}
                          </span>
                          <button onClick={() => startEditing(selectedVec)}
                            className="p-1 rounded-lg transition-colors"
                            style={{ color: 'var(--color-muted)' }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-paper-3)'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                            title="Rename">
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                    {vectors.length > 1 && (
                      <button onClick={() => deleteVector(selectedVec.id)}
                        className="p-1 rounded-lg transition-colors"
                        style={{ color: 'oklch(52% 0.140 25)' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(175,90,65,0.08)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                        title="Delete Vector">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div
                    className="text-sm font-mono font-bold text-center py-2 rounded-xl mb-2"
                    style={{
                      backgroundColor: 'var(--color-paper)',
                      color: 'var(--color-ink)',
                      fontFamily: 'var(--font-mono)',
                      border: '1px solid var(--color-rule)',
                    }}
                  >
                    [{selectedVec.coords[0].toFixed(2)}, {selectedVec.coords[1].toFixed(2)}]
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded-xl text-center" style={{ backgroundColor: 'var(--color-paper)' }}>
                      <div className="text-xs mb-0.5" style={{ color: 'var(--color-muted)' }}>|{selectedVec.name}|</div>
                      <div className="font-mono font-semibold text-sm" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-mono)' }}>
                        {magnitude(selectedVec.coords).toFixed(2)}
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: 'var(--color-muted)', fontSize: '0.65rem' }}>magnitude</div>
                    </div>
                    <div className="p-2 rounded-xl text-center" style={{ backgroundColor: 'var(--color-paper)' }}>
                      <div className="text-xs mb-0.5" style={{ color: 'var(--color-muted)' }}>θ</div>
                      <div className="font-mono font-semibold text-sm" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-mono)' }}>
                        {(Math.atan2(selectedVec.coords[1], selectedVec.coords[0]) * 180 / Math.PI).toFixed(0)}°
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: 'var(--color-muted)', fontSize: '0.65rem' }}>direction</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Vector Addition */}
              {activeSumVectors.length >= 1 && (
                <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--color-paper-2)' }}>
                  <div className="font-semibold mb-3 text-xs" style={{ color: 'var(--color-neutral)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                    Vector Addition
                  </div>

                  {/* Vectors displayed side by side with operators */}
                  <div className="flex items-center justify-center gap-2 mb-3">
                    {activeSumVectors.map((v, i) => (
                      <div key={v.id} className="flex items-center gap-2">
                        {i > 0 && (
                          <span className="text-lg font-bold" style={{ color: 'var(--color-accent)' }}>+</span>
                        )}
                        <div className="px-2 py-1.5 rounded-lg" style={{ backgroundColor: 'var(--color-paper)' }}>
                          <VectorDisplay coords={v.coords} name={v.name} color={v.color} />
                        </div>
                      </div>
                    ))}
                    {activeSumVectors.length >= 1 && sumVec && (
                      <>
                        <span className="text-lg font-bold" style={{ color: 'var(--color-accent)' }}>=</span>
                        <div className="px-2 py-1.5 rounded-lg" style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-paper)' }}>
                          <VectorDisplay coords={sumVec.coords} name="" />
                        </div>
                      </>
                    )}
                  </div>

                  {/* Step-by-step calculation */}
                  <div className="text-center py-2 px-3 rounded-lg" style={{ backgroundColor: 'var(--color-paper)', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--color-ink)' }}>
                    <div className="mb-1" style={{ color: 'var(--color-muted)' }}>Add coordinates:</div>
                    <div>
                      x: {activeSumVectors.map((v, i) => (
                        <span key={i}>
                          {i > 0 && <span style={{ color: 'var(--color-accent)' }}> + </span>}
                          <span style={{ color: v.color }}>{v.coords[0].toFixed(1)}</span>
                        </span>
                      ))} <span>= </span>
                      <span style={{ fontWeight: 600 }}>{sumVec?.coords[0].toFixed(2)}</span>
                    </div>
                    <div>
                      y: {activeSumVectors.map((v, i) => (
                        <span key={i}>
                          {i > 0 && <span style={{ color: 'var(--color-accent)' }}> + </span>}
                          <span style={{ color: v.color }}>{v.coords[1].toFixed(1)}</span>
                        </span>
                      ))} <span>= </span>
                      <span style={{ fontWeight: 600 }}>{sumVec?.coords[1].toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Magnitude */}
                  {sumVec && (
                    <div className="text-center text-xs pt-2 border-t" style={{ color: 'var(--color-muted)', borderColor: 'var(--color-rule)' }}>
                      <span dangerouslySetInnerHTML={{ __html: katex.renderToString(`||\\vec{a}+\\vec{b}|| = ${magnitude(sumVec.coords).toFixed(3)}`, { displayMode: false, throwOnError: false }) }} />
                    </div>
                  )}
                </div>
              )}

              {/* Dot Product */}
              {vectors.length >= 2 && v1 && v2 && (
                <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--color-paper-2)' }}>
                  <div className="font-semibold mb-3 text-xs" style={{ color: 'var(--color-neutral)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                    Dot Product
                  </div>

                  {/* Vectors displayed side by side with dot product symbol */}
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <div className="px-2 py-1.5 rounded-lg" style={{ backgroundColor: 'var(--color-paper)' }}>
                      <VectorDisplay coords={v1.coords} name={v1.name} color={v1.color} />
                    </div>
                    <span className="text-lg font-bold" style={{ color: 'var(--color-accent)' }}>
                      <span dangerouslySetInnerHTML={{ __html: katex.renderToString('\\cdot', { displayMode: false, throwOnError: false }) }} />
                    </span>
                    <div className="px-2 py-1.5 rounded-lg" style={{ backgroundColor: 'var(--color-paper)' }}>
                      <VectorDisplay coords={v2.coords} name={v2.name} color={v2.color} />
                    </div>
                    <span className="text-lg font-bold" style={{ color: 'var(--color-accent)' }}>=</span>
                    <div className="px-2 py-1.5 rounded-lg font-mono font-bold" style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-paper)' }}>
                      {dotProd.toFixed(3)}
                    </div>
                  </div>

                  {/* Step-by-step calculation */}
                  <div className="text-center py-2 px-3 rounded-lg" style={{ backgroundColor: 'var(--color-paper)', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--color-ink)' }}>
                    <div className="mb-1" style={{ color: 'var(--color-muted)' }}>Multiply matching components:</div>
                    <div className="mb-0.5">
                      <span style={{ color: v1.color }}>{v1.coords[0].toFixed(1)}</span>
                      <span style={{ color: 'var(--color-accent)' }}> × </span>
                      <span style={{ color: v2.color }}>{v2.coords[0].toFixed(1)}</span>
                      <span> + </span>
                      <span style={{ color: v1.color }}>{v1.coords[1].toFixed(1)}</span>
                      <span style={{ color: 'var(--color-accent)' }}> × </span>
                      <span style={{ color: v2.color }}>{v2.coords[1].toFixed(1)}</span>
                    </div>
                    <div style={{ fontWeight: 600 }}>
                      = a · b = {dotProd.toFixed(3)}
                    </div>
                  </div>

                  {/* Angle indicator */}
                  {dotProd < 0 ? (
                    <div className="text-center text-xs p-1.5 rounded-lg mt-2" style={{ backgroundColor: 'rgba(200,155,50,0.15)', color: 'oklch(65% 0.08 70)' }}>
                      ↓ Obtuse angle ({angle.toFixed(0)}°) — opposite direction
                    </div>
                  ) : Math.abs(dotProd) < 0.001 ? (
                    <div className="text-center text-xs p-1.5 rounded-lg mt-2" style={{ backgroundColor: 'rgba(100,170,195,0.12)', color: 'oklch(52% 0.08 195)' }}>
                      ⊥ Perpendicular ({angle.toFixed(0)}°) — no overlap
                    </div>
                  ) : (
                    <div className="text-center text-xs p-1.5 rounded-lg mt-2" style={{ backgroundColor: 'rgba(75,180,140,0.12)', color: 'oklch(52% 0.08 155)' }}>
                      ↑ Acute angle ({angle.toFixed(0)}°) — similar direction
                    </div>
                  )}

                  {/* Magnitudes */}
                  <div className="text-center text-xs pt-2 border-t" style={{ color: 'var(--color-muted)', borderColor: 'var(--color-rule)' }}>
                    <span dangerouslySetInnerHTML={{ __html: katex.renderToString(`||\\vec{a}|| = ${mag1.toFixed(2)}, ||\\vec{b}|| = ${mag2.toFixed(2)}, angle = ${angle.toFixed(0)} deg`, { displayMode: false, throwOnError: false }) }} />
                  </div>
                </div>
              )}

              {/* Add Vector button in sidebar */}
              <button onClick={addVector}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl transition-all duration-150 border"
                style={{
                  backgroundColor: 'var(--color-accent)',
                  color: 'var(--color-paper)',
                  borderColor: 'var(--color-accent)',
                  boxShadow: 'var(--shadow-accent)',
                }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; e.currentTarget.style.boxShadow = 'none'; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.boxShadow = 'var(--shadow-accent)'; }}>
                <Plus className="w-3.5 h-3.5" />
                Add Vector
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom hint bar */}
      <div
        className="px-4 py-1.5 text-xs flex items-center justify-center gap-3 border-t flex-shrink-0"
        style={{
          backgroundColor: 'var(--color-paper-2)',
          borderColor: 'var(--color-rule)',
          color: 'var(--color-muted)',
        }}
      >
        <span>Drag tip to move</span>
        <span>·</span>
        <span>Scroll to zoom</span>
        <span>·</span>
        <span>Alt+drag to pan</span>
        <span>·</span>
        <span>Click ✏ to rename</span>
        <span>·</span>
        <CompletionToggle />
      </div>
    </div>
  );
}