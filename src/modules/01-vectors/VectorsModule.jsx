/* Hallmark · module: Vectors · theme: Plume · layout refinement
 * Uses design system tokens (paper, ink, muted, accent) throughout.
 */
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Plus, Trash2, ZoomIn, ZoomOut, RotateCcw, Move, Edit3, Check, X } from 'lucide-react';
import CompletionToggle from '../../components/UI/CompletionToggle';
import { magnitude, dotProduct, angleBetween } from '../../utils/linalg';

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
  const [activeId1, setActiveId1] = useState(1);
  const [activeId2, setActiveId2] = useState(2);
  const [sumIds, setSumIds] = useState([1, 2]);
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
    const colors = [
      'oklch(52% 0.160 195)',
      'oklch(52% 0.160 250)',
      'oklch(62% 0.140 290)',
      'oklch(65% 0.120 70)',
      'oklch(52% 0.140 155)',
      'oklch(58% 0.160 220)',
    ];
    const name = letters[vectors.length] || `v${vectors.length + 1}`;
    const color = colors[vectors.length % colors.length];
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
    setActiveId1(1);
    setActiveId2(2);
    setSumIds([1, 2]);
    setZoom(1.2);
    setPan({ x: 0, y: 0 });
  };

  // Sync active math vectors when vectors are deleted or modified
  useEffect(() => {
    if (vectors.length === 0) return;
    
    // Ensure activeId1 points to an existing vector
    const hasV1 = vectors.some(v => v.id === activeId1);
    let nextId1 = activeId1;
    if (!hasV1) {
      nextId1 = vectors[0].id;
      setActiveId1(nextId1);
    }

    // Ensure activeId2 points to an existing vector
    const hasV2 = vectors.some(v => v.id === activeId2);
    if (!hasV2 || activeId2 === nextId1) {
      const remaining = vectors.filter(v => v.id !== nextId1);
      if (remaining.length > 0) {
        setActiveId2(remaining[0].id);
      } else {
        setActiveId2(nextId1);
      }
    }

    // Ensure sumIds only contains existing vectors
    setSumIds(prev => {
      const filtered = prev.filter(id => vectors.some(v => v.id === id));
      if (filtered.length === 0 && vectors.length > 0) {
        return vectors.slice(0, 2).map(v => v.id);
      }
      return filtered;
    });
  }, [vectors, activeId1, activeId2]);

  const v1 = useMemo(() => vectors.find(v => v.id === activeId1) || vectors[0] || null, [vectors, activeId1]);
  const v2 = useMemo(() => vectors.find(v => v.id === activeId2) || vectors[1] || null, [vectors, activeId2]);

  const activeSumVectors = useMemo(() => vectors.filter(v => sumIds.includes(v.id)), [vectors, sumIds]);

  const sumVec = useMemo(() => {
    if (activeSumVectors.length === 0) return null;
    const coords = activeSumVectors.reduce((acc, v) => [acc[0] + v.coords[0], acc[1] + v.coords[1]], [0, 0]);
    return { name: 'Σ', coords, color: 'var(--color-accent)' };
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
      concept: 'Every vector starts at the origin (0, 0) — where the two bold axes cross. The center marker shows you where (0, 0) is on the grid.',
      hint: 'Look for the accent-colored circle at the center.',
      action: 'Find the origin marker at 0, 0',
    },
    {
      title: 'Vector coordinates',
      concept: 'A vector is written as [x, y] where x is how far right and y is how far up. The vector a = [3, 2] goes 3 steps right and 2 steps up from the origin.',
      hint: 'Select a vector in the legend overlay to see its coordinates.',
      action: 'Select a vector and read its coordinates',
    },
    {
      title: 'What is magnitude?',
      concept: `The magnitude |a| = √(3² + 2²) ≈ ${mag1.toFixed(1)} is the length of the arrow — the straight-line distance from the origin to the tip. We use Pythagorean theorem: √(x² + y²).`,
      hint: 'The sidebar shows |a| = magnitude for the selected vector.',
      action: 'Read the magnitude in the right sidebar',
    },
    {
      title: 'What is vector addition?',
      concept: `Adding vectors places them tip-to-tail: a + b = [${v1?.coords[0].toFixed(1) || 0} + ${v2?.coords[0].toFixed(1) || 0}, ${v1?.coords[1].toFixed(1) || 0} + ${v2?.coords[1].toFixed(1) || 0}] = [${sumVec?.coords[0].toFixed(1) || 0}, ${sumVec?.coords[1].toFixed(1) || 0}]. The purple arrow (Σ) shows their sum.`,
      hint: 'The purple Σ arrow is the sum. The dashed parallelogram shows how tip-to-tail addition works geometrically.',
      action: 'Watch how a + b forms the purple sum arrow',
    },
    {
      title: 'What is the dot product?',
      concept: `a · b = ${v1?.coords[0].toFixed(1) || 0} × ${v2?.coords[0].toFixed(1) || 0} + ${v1?.coords[1].toFixed(1) || 0} × ${v2?.coords[1].toFixed(1) || 0} = ${dotProd.toFixed(2)}. Multiply matching coordinates and add: [x₁×x₂] + [y₁×y₂].`,
      hint: 'The sidebar shows the full dot product calculation with the component breakdown.',
      action: 'Find the dot product calculation in the right sidebar',
    },
    {
      title: 'What does the dot product tell us?',
      concept: `a · b = |a| × |b| × cos(θ) = ${mag1.toFixed(1)} × ${mag2.toFixed(1)} × cos(${angle.toFixed(0)}°) = ${dotProd.toFixed(2)}. A positive dot product means an acute angle (<90°); negative means obtuse (>90°); zero means perpendicular.`,
      hint: 'Drag a vector to see the angle change. Watch the dot product sign change.',
      action: 'Drag vectors to see angle affect dot product sign',
    },
    {
      title: 'Explore freely',
      concept: 'Add more vectors, rename them, delete them. Try creating three vectors and watching how they sum together. Experiment!',
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
          fill="var(--color-accent)" fillOpacity="0.08"
          stroke="var(--color-accent)" strokeWidth="1.5" strokeDasharray="6 3" strokeOpacity="0.4" />
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

  const selectedVec = vectors.find(v => v.id === selectedId);

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
                  className="text-xs leading-relaxed line-clamp-2"
                  style={{ color: 'var(--color-muted)' }}
                >
                  {steps[currentStep].concept}
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
                  return (
                    <div
                      key={vec.id}
                      onClick={() => setSelectedId(vec.id)}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-all duration-100"
                      style={{
                        backgroundColor: isSelected ? 'rgba(75,160,195,0.12)' : 'transparent',
                      }}
                      onMouseEnter={e => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--color-paper-2)';
                      }}
                      onMouseLeave={e => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
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
                    style={{ borderColor: 'var(--color-rule)' }}>
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: 'var(--color-accent)' }} />
                    <span className="text-xs font-bold flex-shrink-0" style={{ color: 'var(--color-accent)', fontFamily: 'var(--font-mono)' }}>
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
          <div
            className="w-64 lg:w-72 xl:w-80 flex-shrink-0 min-h-0 overflow-y-auto overflow-x-hidden border-l"
            style={{
              backgroundColor: 'var(--color-paper)',
              borderColor: 'var(--color-rule)',
            }}
          >
            <div className="p-3 space-y-3">

              {/* Target Vector Selector */}
              {vectors.length >= 2 && (
                <div
                  className="p-3 rounded-xl border transition-all duration-150"
                  style={{
                    backgroundColor: 'var(--color-paper-2)',
                    borderColor: 'var(--color-rule)',
                  }}
                >
                  <div className="font-semibold mb-2.5 text-xs" style={{ color: 'var(--color-neutral)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                    Math Target Vectors
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block mb-1 font-medium" style={{ color: 'var(--color-muted)' }}>First Vector</label>
                      <select
                        value={activeId1}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (val === activeId2 && vectors.length > 1) {
                            setActiveId2(activeId1);
                          }
                          setActiveId1(val);
                        }}
                        className="w-full px-2 py-1.5 rounded-lg border outline-none font-semibold cursor-pointer transition-all focus:border-accent"
                        style={{
                          backgroundColor: 'var(--color-paper)',
                          borderColor: 'var(--color-rule)',
                          color: 'var(--color-ink)',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {vectors.map(v => (
                          <option key={v.id} value={v.id} style={{ color: v.color }}>
                            {v.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block mb-1 font-medium" style={{ color: 'var(--color-muted)' }}>Second Vector</label>
                      <select
                        value={activeId2}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (val === activeId1 && vectors.length > 1) {
                            setActiveId1(activeId2);
                          }
                          setActiveId2(val);
                        }}
                        className="w-full px-2 py-1.5 rounded-lg border outline-none font-semibold cursor-pointer transition-all focus:border-accent"
                        style={{
                          backgroundColor: 'var(--color-paper)',
                          borderColor: 'var(--color-rule)',
                          color: 'var(--color-ink)',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {vectors.map(v => (
                          <option key={v.id} value={v.id} style={{ color: v.color }}>
                            {v.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

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

              {/* Addition */}
              {activeSumVectors.length >= 1 && (
                <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--color-paper-2)' }}>
                  <div className="font-semibold mb-1 text-xs" style={{ color: 'var(--color-neutral)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                    Vector Addition
                  </div>
                  <div className="text-xs mb-2.5" style={{ color: 'var(--color-muted)' }}>
                    Add matching coordinates across all active vectors:
                  </div>
                  <div className="space-y-1.5 font-mono text-xs" style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
                    <div className="flex items-center gap-1 flex-wrap">
                      {activeSumVectors.map((v, i) => (
                        <span key={v.id}>
                          {i > 0 && " + "}
                          <span className="font-bold" style={{ color: v.color }}>{v.name}</span>
                        </span>
                      ))}
                    </div>
                    <div className="text-center" style={{ color: 'var(--color-rule-2)' }}>=</div>
                    <div className="leading-relaxed">
                      [{activeSumVectors.map(v => v.coords[0].toFixed(1)).join(' + ')},
                      <br />
                      &nbsp;{activeSumVectors.map(v => v.coords[1].toFixed(1)).join(' + ')}]
                    </div>
                    <div className="text-center" style={{ color: 'var(--color-rule-2)' }}>=</div>
                    <div
                      className="font-bold text-center py-1.5 rounded-xl"
                      style={{
                        backgroundColor: 'var(--color-accent)',
                        color: 'var(--color-paper)',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      [{sumVec?.coords[0].toFixed(2)}, {sumVec?.coords[1].toFixed(2)}]
                    </div>
                    {sumVec && (
                      <div
                        className="text-xs pt-1.5 mt-1.5 border-t"
                        style={{ color: 'var(--color-muted)', borderColor: 'var(--color-rule)', fontFamily: 'var(--font-mono)' }}
                      >
                        |Σ| = √({(sumVec.coords[0] ** 2 + sumVec.coords[1] ** 2).toFixed(2)}) = {magnitude(sumVec.coords).toFixed(3)}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Dot Product */}
              {vectors.length >= 2 && v1 && v2 && (
                <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--color-paper-2)' }}>
                  <div className="font-semibold mb-1 text-xs" style={{ color: 'var(--color-neutral)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                    Dot Product
                  </div>
                  <div className="text-xs mb-2" style={{ color: 'var(--color-muted)' }}>
                    a · b = x₁×x₂ + y₁×y₂
                  </div>
                  <div className="space-y-1.5 font-mono text-xs" style={{ fontFamily: 'var(--font-mono)' }}>
                    <div style={{ color: 'var(--color-muted)' }}>{v1.name} · {v2.name}</div>
                    <div style={{ color: 'var(--color-muted)' }}>{v1.coords[0].toFixed(2)} × {v2.coords[0].toFixed(2)} + {v1.coords[1].toFixed(2)} × {v2.coords[1].toFixed(2)}</div>
                    <div
                      className="font-bold text-center py-1.5 rounded-xl"
                      style={{
                        backgroundColor: 'var(--color-accent)',
                        color: 'var(--color-paper)',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      = {dotProd.toFixed(3)}
                    </div>
                    <div className="text-xs pt-1.5 mt-1.5 border-t" style={{ color: 'var(--color-muted)', borderColor: 'var(--color-rule)', fontFamily: 'var(--font-mono)' }}>
                      <div>= |{v1.name}| × |{v2.name}| × cos(θ)</div>
                      <div>= {mag1.toFixed(2)} × {mag2.toFixed(2)} × cos({angle.toFixed(0)}°)</div>
                    </div>
                    {dotProd < 0 ? (
                      <div className="text-xs p-1.5 rounded-lg" style={{ backgroundColor: 'rgba(200,155,50,0.15)', color: 'oklch(65% 0.08 70)' }}>
                        ↓ Obtuse angle (&gt;90°) — vectors point opposite
                      </div>
                    ) : Math.abs(dotProd) < 0.001 ? (
                      <div className="text-xs p-1.5 rounded-lg" style={{ backgroundColor: 'rgba(100,170,195,0.12)', color: 'oklch(52% 0.08 195)' }}>
                        ⊥ Perpendicular (90°) — no overlap
                      </div>
                    ) : (
                      <div className="text-xs p-1.5 rounded-lg" style={{ backgroundColor: 'rgba(75,180,140,0.12)', color: 'oklch(52% 0.08 155)' }}>
                        ↑ Acute angle (&lt;90°) — similar direction
                      </div>
                    )}
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