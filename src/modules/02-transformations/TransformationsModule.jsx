import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { RotateCcw, ZoomIn, ZoomOut, Move, Gamepad2 } from 'lucide-react';
import { Button } from '../../components/UI/Button';
import { CompletionToggle } from '../../components/UI/CompletionToggle';
import GameWrapper from '../../components/MiniGame/GameWrapper';
import TransformMatch from '../../games/TransformMatch';

const GRID_EXTENT = 6;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2.5;

const PRESETS = {
  identity: [1, 0, 0, 1],
  rotate90:  [0, -1, 1, 0],
  reflectX:  [1, 0, 0, -1],
  reflectY:  [-1, 0, 0, 1],
  shear:     [1, 0.5, 0, 1],
  stretch:   [2, 0, 0, 0.5],
};

export default function TransformationsModule() {
  const [matrix, setMatrix] = useState([1, 0, 0, 1]);
  const [showOriginal, setShowOriginal] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [showGame, setShowGame] = useState(false);
  const canvasRef = useRef(null);
  const isPanning = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const [svgSize, setSvgSize] = useState({ w: 500, h: 400 });

  const a = matrix[0], b = matrix[1], c = matrix[2], d = matrix[3];
  const determinant = a * d - b * c;

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

  const pixelsPerUnit = useMemo(() => {
    const minDim = Math.min(svgSize.w, svgSize.h);
    return (minDim / (2 * GRID_EXTENT)) * zoom;
  }, [svgSize.w, svgSize.h, zoom]);

  const toCanvas = useCallback((wx, wy) => ({
    x: svgSize.w / 2 + wx * pixelsPerUnit + pan.x,
    y: svgSize.h / 2 - wy * pixelsPerUnit + pan.y,
  }), [svgSize.w, svgSize.h, pixelsPerUnit, pan]);

  const zoomIn = () => setZoom(z => Math.min(MAX_ZOOM, z * 1.2));
  const zoomOut = () => setZoom(z => Math.max(MIN_ZOOM, z / 1.2));
  const resetView = () => setPan({ x: 0, y: 0 });
  const reset = () => setMatrix([1, 0, 0, 1]);

  const transform = ([x, y]) => [a * x + b * y, c * x + d * y];

  const unitSquare = [
    [0, 0], [1, 0], [1, 1], [0, 1],
  ];
  const transformedSquare = unitSquare.map(transform);

  const steps = [
    {
      title: 'What is a Matrix Transformation?',
      concept: `A matrix transformation is a FUNCTION that takes every point in the plane and moves it to a new location. The 2×2 matrix [${a.toFixed(1)}, ${b.toFixed(1)}; ${c.toFixed(1)}, ${d.toFixed(1)}] tells it exactly where to send each point.\n\nEvery input point (x, y) becomes output (${a.toFixed(1)}×x + ${b.toFixed(1)}×y, ${c.toFixed(1)}×x + ${d.toFixed(1)}×y)`,
      hint: 'The purple square shows where the unit square goes after transformation. Watch it change as you adjust sliders!',
      action: 'Watch the purple square — it shows the transformed shape',
    },
    {
      title: 'Meet i-hat and j-hat',
      concept: `In the standard grid, i-hat = [1, 0] points RIGHT and j-hat = [0, 1] points UP. These are the "building blocks" of the grid.\n\nAfter transformation:\n• i-hat → [${a.toFixed(1)}, ${c.toFixed(1)}] (the red arrow)\n• j-hat → [${b.toFixed(1)}, ${d.toFixed(1)}] (the green arrow)\n\nThe matrix COLUMNS tell you where these basis vectors land!`,
      hint: 'The red arrow shows i-hat\'s new position. The green arrow shows j-hat\'s new position.',
      action: 'Find the red i-hat and green j-hat arrows on the canvas',
    },
    {
      title: 'The Matrix IS the Transformation',
      concept: `The matrix [${a.toFixed(1)}, ${b.toFixed(1)}; ${c.toFixed(1)}, ${d.toFixed(1)}] means:\n• Column 1 [${a.toFixed(1)}, ${c.toFixed(1)}]: Where does i-hat go? Where does the RIGHT direction go?\n• Column 2 [${b.toFixed(1)}, ${d.toFixed(1)}]: Where does j-hat go? Where does the UP direction go?\n\nALL other points transform based on these two arrows!`,
      hint: 'Changing matrix value "a" moves the red i-hat arrow. Changing "d" moves the green j-hat arrow.',
      action: 'Drag the "a" slider and watch the red i-hat arrow move',
    },
    {
      title: 'What Does the Square Represent?',
      concept: `The purple square shows the unit square [0,0] to [1,1] AFTER transformation. Its corners are:\n• (0,0) stays at origin\n• (1,0) moves to (${transformedSquare[1][0].toFixed(1)}, ${transformedSquare[1][1].toFixed(1)}) = i-hat\n• (1,1) moves to (${transformedSquare[2][0].toFixed(1)}, ${transformedSquare[2][1].toFixed(1)})\n• (0,1) moves to (${transformedSquare[3][0].toFixed(1)}, ${transformedSquare[3][1].toFixed(1)}) = j-hat\n\nThe square is your transformed coordinate system!`,
      hint: 'The square\'s edges align with the red and green i-hat/j-hat arrows.',
      action: 'Compare the square edges to i-hat and j-hat arrows',
    },
    {
      title: 'Try Some Presets!',
      concept: `Click the preset buttons to see common transformations:\n• rotate90: Rotates everything 90° counterclockwise\n• reflectX: Flips across the x-axis (top becomes bottom)\n• reflectY: Flips across the y-axis (left becomes right)\n• shear: Slants horizontally — parallel lines stay parallel\n• stretch: Stretches in one direction, squishes in another`,
      hint: 'Each preset shows a specific type of transformation. Watch how the square changes!',
      action: 'Click the "rotate90" preset button',
    },
    {
      title: 'The Determinant = Area Scaling',
      concept: `The determinant det = ${determinant.toFixed(2)} tells you how much areas change:\n• If det = 1: Areas stay the same size\n• If det = 2: Areas double\n• If det = 0.5: Areas halve\n• If det = 0: Everything collapses to a line or point!\n• If det < 0: Orientation flips (things that were counterclockwise are now clockwise)`,
      hint: 'Compare the original gray square to the purple square. Their area ratio ≈ |det|.',
      action: 'Toggle "Original" off to compare areas',
    },
    {
      title: 'Orientation Flip (det < 0)',
      concept: `When det < 0 (your det = ${determinant.toFixed(2)}), the transformation includes a "flip" — like a mirror reflection combined with rotation.\n\nThis is why some transformations seem "backwards". The matrix has changed the "handedness" of the coordinate system!`,
      hint: 'Watch when det goes negative — the gray and purple squares appear on opposite sides.',
      action: 'Drag a slider to make det go negative',
    },
    {
      title: 'Zero Determinant = Collapse',
      concept: `If you make det = 0, the entire 2D plane collapses onto a line (or point). The purple square shrinks to a line segment.\n\nThis happens when i-hat and j-hat point in the SAME or EXACTLY OPPOSITE direction — they can\'t define a 2D area anymore!`,
      hint: 'Make i-hat parallel to j-hat by setting the right slider values.',
      action: 'Try to make the purple square flat (det → 0)',
    },
    {
      title: 'Inverse Transformations',
      concept: `When det ≠ 0, there exists an "undo" transformation called the inverse matrix. Applying the inverse brings everything back to where it started.\n\nFor 2×2: A⁻¹ = 1/det × [d, -b; -c, a]\n\nThis only works if det ≠ 0! When det = 0, the transformation collapses and can't be undone.`,
      hint: 'The right panel shows the current determinant value.',
      action: 'Check if det ≠ 0 in the right panel',
    },
    {
      title: 'Explore Freely!',
      concept: `Now you understand matrix transformations! The 4 numbers in the matrix define everything:\n• a = where does the RIGHT direction (x-axis) go horizontally?\n• b = where does the UP direction (y-axis) go horizontally?\n• c = where does the RIGHT direction (x-axis) go vertically?\n• d = where does the UP direction (y-axis) go vertically?`,
      hint: 'Experiment with the sliders to build intuition. Try weird combinations!',
      action: 'Experiment with the matrix sliders',
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
    }
  };

  const handleMouseMove = (e) => {
    if (isPanning.current) {
      const dx = e.clientX - lastPos.current.x;
      const dy = e.clientY - lastPos.current.y;
      setPan(p => ({ x: p.x + dx, y: p.y + dy }));
      lastPos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseUp = () => { isPanning.current = false; };

  const renderGrid = () => {
    const lines = [];
    const { w, h } = svgSize;
    const visibleExtentX = (w / 2) / pixelsPerUnit + Math.abs(pan.x) / pixelsPerUnit + 1;
    const visibleExtentY = (h / 2) / pixelsPerUnit + Math.abs(pan.y) / pixelsPerUnit + 1;
    const maxExtent = Math.ceil(Math.max(visibleExtentX, visibleExtentY, GRID_EXTENT));

    for (let i = -maxExtent; i <= maxExtent; i++) {
      const pos = toCanvas(i, 0);
      if (pos.x >= 0 && pos.x <= w) {
        lines.push(<line key={`v${i}`} x1={pos.x} y1={0} x2={pos.x} y2={h} stroke="var(--color-rule)" strokeWidth="1" />);
      }
      const posY = toCanvas(0, i);
      if (posY.y >= 0 && posY.y <= h) {
        lines.push(<line key={`h${i}`} x1={0} y1={posY.y} x2={w} y2={posY.y} stroke="var(--color-rule)" strokeWidth="1" />);
      }
    }
    return lines;
  };

  const renderSquare = (points, fill, stroke, label) => {
    if (points.length === 0) return null;
    const pathPoints = points.map((p, i) => {
      const cp = toCanvas(p[0], p[1]);
      return i === 0 ? `M ${cp.x} ${cp.y}` : `L ${cp.x} ${cp.y}`;
    }).join(' ') + ' Z';
    return (
      <path d={pathPoints} fill={fill} fillOpacity="0.25" stroke={stroke} strokeWidth="2.5" strokeLinejoin="round" />
    );
  };

  const renderArrow = (from, to, color, width = 3) => {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 5) return null;
    const angle = Math.atan2(dy, dx);
    const headLen = Math.min(14, len * 0.3);
    const headAngle = Math.PI / 6;
    return (
      <g>
        <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={color} strokeWidth={width} strokeLinecap="round" />
        <polygon
          points={`${to.x},${to.y} ${to.x - headLen * Math.cos(angle - headAngle)},${to.y - headLen * Math.sin(angle - headAngle)} ${to.x - headLen * Math.cos(angle + headAngle)},${to.y - headLen * Math.sin(angle + headAngle)}`}
          fill={color} />
      </g>
    );
  };

  const iHat = toCanvas(a, c);
  const jHat = toCanvas(b, d);
  const origin = toCanvas(0, 0);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Top Control Bar */}
      <div
        className="flex items-center gap-2 px-3 py-2 border-b flex-shrink-0 flex-wrap"
        style={{ backgroundColor: 'var(--color-paper)', borderColor: 'var(--color-rule)' }}
      >
        {/* Zoom controls */}
        <div className="flex items-center gap-1">
          <button onClick={zoomOut} className="p-1.5 rounded-lg transition-all duration-150"
            style={{ color: 'var(--color-muted)', backgroundColor: 'transparent' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-paper-2)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'} title="Zoom Out">
            <ZoomOut className="w-4 h-4" />
          </button>
          <div className="px-2 py-0.5 rounded-lg text-xs font-semibold min-w-[48px] text-center"
            style={{ backgroundColor: 'var(--color-paper-2)', color: 'var(--color-ink)', fontFamily: 'var(--font-mono)' }}>
            {Math.round(zoom * 100)}%
          </div>
          <button onClick={zoomIn} className="p-1.5 rounded-lg transition-all duration-150"
            style={{ color: 'var(--color-muted)', backgroundColor: 'transparent' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-paper-2)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'} title="Zoom In">
            <ZoomIn className="w-4 h-4" />
          </button>
          <button onClick={resetView} className="p-1.5 rounded-lg transition-all duration-150"
            style={{ color: 'var(--color-muted)', backgroundColor: 'transparent' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-paper-2)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'} title="Reset Position">
            <Move className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1" />

        {/* Presets */}
        <div className="hidden lg:flex items-center gap-1.5">
          {Object.entries(PRESETS).map(([key, vals]) => {
            const isActive = JSON.stringify(vals) === JSON.stringify(matrix);
            return (
              <button key={key} onClick={() => setMatrix([...vals])}
                className="px-2.5 py-1 text-xs font-medium rounded-lg transition-all duration-150 border"
                style={isActive
                  ? { backgroundColor: 'var(--color-accent)', color: 'var(--color-paper)', borderColor: 'var(--color-accent)' }
                  : { backgroundColor: 'var(--color-paper)', color: 'var(--color-ink-2)', borderColor: 'var(--color-rule)' }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'var(--color-paper-2)'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'var(--color-paper)'; }}>
                {key}
              </button>
            );
          })}
        </div>

        {/* Toggle buttons */}
        <div className="flex items-center gap-1.5">
          <button onClick={() => setShowOriginal(!showOriginal)}
            className="px-3 py-1 text-xs font-semibold rounded-lg transition-all duration-150 border"
            style={showOriginal
              ? { backgroundColor: 'var(--color-accent)', color: 'var(--color-paper)', borderColor: 'var(--color-accent)' }
              : { backgroundColor: 'var(--color-paper)', color: 'var(--color-ink-2)', borderColor: 'var(--color-rule)' }}>
            {showOriginal ? '✓ ' : ''}Original
          </button>
          <Button variant={showGame ? 'primary' : 'ghost'} size="sm" icon={Gamepad2} onClick={() => setShowGame(!showGame)}>
            Mini-Game
          </Button>
          <button onClick={reset} className="p-1.5 rounded-lg transition-all duration-150"
            style={{ color: 'var(--color-muted)', backgroundColor: 'transparent' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-paper-2)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'} title="Reset Matrix">
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Guided Learning Card */}
        <div
          className="px-4 py-3 border-b flex-shrink-0"
          style={{ background: 'linear-gradient(to right, rgba(75,150,200,0.06), rgba(75,200,150,0.06))', borderColor: 'var(--color-rule)' }}>
          <div className="flex items-center gap-3 max-w-full">
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-paper)', fontFamily: 'var(--font-mono)' }}>
                {currentStep + 1}
              </div>
              <span className="text-xs font-semibold" style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
                / {steps.length}
              </span>
            </div>
            <div className="w-px h-8 flex-shrink-0" style={{ backgroundColor: 'var(--color-rule)' }} />
            <div className="flex-1 min-w-0 overflow-hidden">
              <h3 className="text-sm font-bold mb-0.5 truncate" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-display)' }}>
                {steps[currentStep].title}
              </h3>
              <p className="text-xs leading-relaxed whitespace-pre-line" style={{ color: 'var(--color-muted)' }}>
                {steps[currentStep].concept}
              </p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
                style={{ backgroundColor: currentStep > 0 ? 'var(--color-paper-2)' : 'transparent', color: currentStep > 0 ? 'var(--color-ink)' : 'transparent', cursor: currentStep > 0 ? 'pointer' : 'default' }}
                disabled={currentStep <= 0}>←</button>
              <div className="flex items-center gap-1">
                {steps.map((_, i) => (
                  <button key={i} onClick={() => setCurrentStep(i)} className="rounded-full transition-all duration-200"
                    style={{ width: currentStep === i ? '10px' : '5px', height: '5px', backgroundColor: currentStep === i ? 'var(--color-accent)' : 'var(--color-rule)', cursor: 'pointer' }} />
                ))}
              </div>
              <button onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
                style={{ backgroundColor: currentStep < steps.length - 1 ? 'var(--color-accent)' : 'transparent', color: currentStep < steps.length - 1 ? 'var(--color-paper)' : 'transparent', cursor: currentStep < steps.length - 1 ? 'pointer' : 'default' }}
                disabled={currentStep >= steps.length - 1}>→</button>
            </div>
          </div>
        </div>

        {/* Canvas + Right Panel */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Main Canvas */}
          <div className="flex-1 min-h-0 min-w-0 relative">
            <svg ref={canvasRef} className="w-full h-full cursor-grab active:cursor-grabbing select-none"
              style={{ backgroundColor: 'var(--color-paper)', display: 'block', touchAction: 'none' }}
              onWheel={handleWheel} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
              {renderGrid()}

              {/* Axes */}
              <line x1={0} y1={origin.y} x2={svgSize.w} y2={origin.y} stroke="var(--color-neutral)" strokeWidth="1.5" opacity="0.4" />
              <line x1={origin.x} y1={0} x2={origin.x} y2={svgSize.h} stroke="var(--color-neutral)" strokeWidth="1.5" opacity="0.4" />

              {/* Origin marker */}
              <line x1={origin.x - 12} y1={origin.y} x2={origin.x + 12} y2={origin.y} stroke="var(--color-neutral)" strokeWidth="2.5" opacity="0.9" />
              <line x1={origin.x} y1={origin.y - 12} x2={origin.x} y2={origin.y + 12} stroke="var(--color-neutral)" strokeWidth="2.5" opacity="0.9" />
              <circle cx={origin.x} cy={origin.y} r={7} fill="var(--color-accent)" />
              <circle cx={origin.x} cy={origin.y} r={3.5} fill="var(--color-paper)" />

              {/* Original unit square (faded) */}
              {showOriginal && renderSquare(unitSquare, 'var(--color-muted)', 'var(--color-muted)', 'Original')}

              {/* Transformed square */}
              {renderSquare(transformedSquare, 'var(--color-accent)', 'var(--color-accent)', 'Transformed')}

              {/* i-hat arrow */}
              {renderArrow(origin, iHat, 'oklch(52% 0.16 25)', 3)}
              <text x={iHat.x + 14} y={iHat.y - 8} fill="oklch(52% 0.16 25)" fontSize="13" fontWeight="700" fontFamily="var(--font-mono)">
                i-hat → [{a.toFixed(1)}, {c.toFixed(1)}]
              </text>

              {/* j-hat arrow */}
              {renderArrow(origin, jHat, 'oklch(52% 0.16 155)', 3)}
              <text x={jHat.x + 14} y={jHat.y - 8} fill="oklch(52% 0.16 155)" fontSize="13" fontWeight="700" fontFamily="var(--font-mono)">
                j-hat → [{b.toFixed(1)}, {d.toFixed(1)}]
              </text>

              {/* Axis labels */}
              <text x={svgSize.w - 14} y={origin.y - 10} fill="var(--color-neutral)" fontSize="11" fontWeight="600" fontFamily="var(--font-mono)" textAnchor="end" opacity="0.7">x</text>
              <text x={origin.x + 12} y={16} fill="var(--color-neutral)" fontSize="11" fontWeight="600" fontFamily="var(--font-mono)" opacity="0.7">y</text>

              {/* Origin label */}
              <text x={origin.x + 16} y={origin.y + 20} fill="var(--color-muted)" fontSize="10" fontWeight="600" fontFamily="var(--font-mono)">(0, 0)</text>
            </svg>

            {/* Legend */}
            <div className="absolute top-3 left-3 rounded-xl overflow-hidden"
              style={{ backgroundColor: 'color-mix(in oklch, var(--color-paper) 92%, transparent)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid var(--color-rule)', boxShadow: 'var(--shadow-md)' }}>
              <div className="px-3 py-2" style={{ borderBottom: '1px solid var(--color-rule)' }}>
                <span className="text-xs font-semibold" style={{ color: 'var(--color-neutral)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Legend</span>
              </div>
              <div className="px-3 py-2 space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-0.5 rounded-full" style={{ backgroundColor: 'var(--color-muted)' }} />
                  <span className="text-xs" style={{ color: 'var(--color-muted)' }}>Gray = Original unit square</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-0.5 rounded-full" style={{ backgroundColor: 'var(--color-accent)' }} />
                  <span className="text-xs" style={{ color: 'var(--color-muted)' }}>Purple = Transformed square</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-0.5 rounded-full" style={{ backgroundColor: 'oklch(52% 0.16 25)' }} />
                  <span className="text-xs" style={{ color: 'var(--color-muted)' }}>Red = i-hat (x-axis)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-0.5 rounded-full" style={{ backgroundColor: 'oklch(52% 0.16 155)' }} />
                  <span className="text-xs" style={{ color: 'var(--color-muted)' }}>Green = j-hat (y-axis)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="w-64 lg:w-72 xl:w-80 flex-shrink-0 min-h-0 overflow-y-auto overflow-x-hidden border-l"
            style={{ backgroundColor: 'var(--color-paper)', borderColor: 'var(--color-rule)' }}>
            <div className="p-3 space-y-3">
              {/* Matrix Display */}
              <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--color-paper-2)' }}>
                <div className="text-xs font-medium mb-2" style={{ color: 'var(--color-neutral)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  Matrix = [i-hat | j-hat]
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--color-paper)' }}>
                  <div className="flex items-center justify-center gap-2 text-lg font-bold" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-ink)' }}>
                    <span>[</span>
                    <span style={{ color: 'oklch(52% 0.16 25)' }}>{a.toFixed(1)}</span>
                    <span style={{ color: 'oklch(52% 0.16 155)' }}>{b.toFixed(1)}</span>
                    <span style={{ color: 'var(--color-muted)' }}>;</span>
                    <span style={{ color: 'oklch(52% 0.16 25)' }}>{c.toFixed(1)}</span>
                    <span style={{ color: 'oklch(52% 0.16 155)' }}>{d.toFixed(1)}</span>
                    <span>]</span>
                  </div>
                </div>
                <div className="mt-2 p-2 rounded-lg" style={{ backgroundColor: 'var(--color-paper-2)' }}>
                  <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                    Column 1 = where i-hat goes<br />
                    Column 2 = where j-hat goes
                  </p>
                </div>
              </div>

              {/* Matrix Sliders */}
              <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--color-paper-2)' }}>
                <div className="text-xs font-medium mb-2" style={{ color: 'var(--color-neutral)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  Adjust Matrix Values
                </div>
                <div className="space-y-3">
                  {[
                    { label: 'a = i-hat x', value: matrix[0], idx: 0, col: 'oklch(52% 0.16 25)', tip: 'Move i-hat horizontally' },
                    { label: 'b = j-hat x', value: matrix[1], idx: 1, col: 'oklch(52% 0.16 155)', tip: 'Move j-hat horizontally' },
                    { label: 'c = i-hat y', value: matrix[2], idx: 2, col: 'oklch(52% 0.16 25)', tip: 'Move i-hat vertically' },
                    { label: 'd = j-hat y', value: matrix[3], idx: 3, col: 'oklch(52% 0.16 155)', tip: 'Move j-hat vertically' },
                  ].map(({ label, value, idx, col, tip }) => (
                    <div key={label}>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs" style={{ color: col, fontFamily: 'var(--font-mono)' }}>{label}</label>
                        <span className="text-xs" style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>{tip}</span>
                      </div>
                      <input type="range" min={-3} max={3} step={0.1} value={value}
                        onChange={(e) => { const m = [...matrix]; m[idx] = parseFloat(e.target.value); setMatrix(m); }}
                        className="w-full" style={{ accentColor: col, cursor: 'pointer' }} />
                      <div className="text-xs text-right mt-0.5" style={{ color: col, fontFamily: 'var(--font-mono)' }}>{value.toFixed(1)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Determinant */}
              <div className="p-3 rounded-xl" style={determinant >= 0 ? { backgroundColor: 'rgba(75,180,140,0.10)' } : { backgroundColor: 'rgba(220,75,55,0.08)' }}>
                <div className="text-xs font-medium mb-1" style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Determinant = Area Scale
                </div>
                <div className="text-2xl font-bold" style={{ fontFamily: 'var(--font-mono)', color: determinant >= 0 ? 'oklch(52% 0.16 155)' : 'oklch(52% 0.16 25)' }}>
                  det = {determinant.toFixed(2)}
                </div>
                <div className="mt-2 text-xs" style={{ color: 'var(--color-muted)' }}>
                  {Math.abs(determinant) < 0.01
                    ? '⚠️ Everything collapses to a line!'
                    : determinant < 0
                      ? '↩️ Orientation is flipped'
                      : `📐 Area scaled by ${Math.abs(determinant).toFixed(2)}×`}
                </div>
              </div>

              {/* Basis Vectors Info */}
              <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--color-paper-2)' }}>
                <div className="text-xs font-medium mb-2" style={{ color: 'var(--color-neutral)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  Where Each Arrow Goes
                </div>
                <div className="space-y-2">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--color-paper)' }}>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'oklch(52% 0.16 25)' }} />
                      <span className="text-xs font-semibold" style={{ color: 'oklch(52% 0.16 25)' }}>i-hat (x-axis, right)</span>
                    </div>
                    <code className="text-xs" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-ink)' }}>
                      [{a.toFixed(1)}, {c.toFixed(1)}]
                    </code>
                    <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
                      {a.toFixed(1)} right, {c.toFixed(1)} up
                    </p>
                  </div>
                  <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--color-paper)' }}>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'oklch(52% 0.16 155)' }} />
                      <span className="text-xs font-semibold" style={{ color: 'oklch(52% 0.16 155)' }}>j-hat (y-axis, up)</span>
                    </div>
                    <code className="text-xs" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-ink)' }}>
                      [{b.toFixed(1)}, {d.toFixed(1)}]
                    </code>
                    <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
                      {b.toFixed(1)} right, {d.toFixed(1)} up
                    </p>
                  </div>
                </div>
              </div>

              {/* Hint */}
              <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(200,155,50,0.08)', border: '1px solid oklch(65% 0.10 70)' }}>
                <div className="text-xs font-medium mb-1" style={{ color: 'oklch(65% 0.10 70)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Action
                </div>
                <p className="text-xs" style={{ color: 'oklch(65% 0.10 70)' }}>
                  {steps[currentStep].action}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Game Mode */}
        {showGame && (
          <div className="p-4 border-t" style={{ borderColor: 'var(--color-rule)', backgroundColor: 'var(--color-paper-2)' }}>
            <GameWrapper title="Transform Match" instructions="Given a before and after image, reconstruct the transformation matrix" maxAttempts={5} rounds={5} scoring="accuracy">
              {(props) => <TransformMatch {...props} />}
            </GameWrapper>
          </div>
        )}

        {/* Footer */}
        <div className="px-4 py-2 flex items-center justify-center gap-4 border-t flex-shrink-0"
          style={{ backgroundColor: 'var(--color-paper)', borderColor: 'var(--color-rule)', color: 'var(--color-muted)' }}>
          <span className="text-xs">Matrix [{a.toFixed(1)}, {b.toFixed(1)}; {c.toFixed(1)}, {d.toFixed(1)}]</span>
          <span>•</span>
          <CompletionToggle moduleId={2} />
        </div>
      </div>
    </div>
  );
}