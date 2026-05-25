import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { RotateCcw, ZoomIn, ZoomOut, Move, Gamepad2, Play } from 'lucide-react';
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
  const [matrix, setMatrix] = useState([2, 1, 1, 2]);
  const [showOriginal, setShowOriginal] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [showGame, setShowGame] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [animProgress, setAnimProgress] = useState(0);
  const canvasRef = useRef(null);
  const isPanning = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const [svgSize, setSvgSize] = useState({ w: 500, h: 400 });
  const animRef = useRef(null);

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

  useEffect(() => {
    if (animating) {
      setAnimProgress(0);
      const startTime = performance.now();
      const duration = 1500;
      const animate = (time) => {
        const elapsed = time - startTime;
        const progress = Math.min(elapsed / duration, 1);
        setAnimProgress(progress);
        if (progress < 1) {
          animRef.current = requestAnimationFrame(animate);
        } else {
          setAnimating(false);
        }
      };
      animRef.current = requestAnimationFrame(animate);
    }
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [animating]);

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
  const reset = () => setMatrix([2, 1, 1, 2]);

  const transform = ([x, y]) => [a * x + b * y, c * x + d * y];
  const transformAnimated = ([x, y], progress) => {
    const ease = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
    return [x * (1 + (a - 1) * ease), y * (1 + (d - 1) * ease)];
  };

  const unitSquare = [[0, 0], [1, 0], [1, 1], [0, 1]];
  const transformedSquare = unitSquare.map(transform);
  const animatedSquare = unitSquare.map(p => transformAnimated(p, animProgress));

  const steps = [
    {
      title: 'What is a Matrix? (Vs. a Vector)',
      concept: `A VECTOR is a single arrow: [3, 2] means "go right 3, up 2". Just one direction.

A MATRIX is a TRANSFORMATION — a machine that takes EVERY point and moves it somewhere new. Think of it as a function f(x) but for geometry.

Your current matrix:
  [${a.toFixed(1)}, ${b.toFixed(1)}]
  [${c.toFixed(1)}, ${d.toFixed(1)}]`,
      hint: 'The light blue square shows where the unit square goes after transformation.',
      action: 'Watch the light blue square — it shows the transformed shape',
    },
    {
      title: 'Meet the Grid\'s Building Blocks',
      concept: `Every point on the grid can be built from TWO special arrows:
• i-hat = [1, 0] — one step RIGHT (the x-direction)
• j-hat = [0, 1] — one step UP (the y-direction)

These aren't at a specific location — they represent the DIRECTIONS of the entire grid. Every horizontal step uses i-hat. Every vertical step uses j-hat.

Together they span (create) the entire 2D plane.`,
      hint: 'The red arrow shows i-hat [1,0] lands at [a, c]. The green arrow shows j-hat [0,1] lands at [b, d].',
      action: 'Find the red i-hat and green j-hat arrows',
    },
    {
      title: 'Matrix Columns Tell You Where Directions Go',
      concept: `The matrix columns answer two questions:
• Column 1 [${a.toFixed(1)}, ${c.toFixed(1)}]: Where does i-hat [1,0] go?
• Column 2 [${b.toFixed(1)}, ${d.toFixed(1)}]: Where does j-hat [0,1] go?

Every other point transforms based on these two arrows. To find (x,y), just do: x×(where i-hat goes) + y×(where j-hat goes)`,
      hint: 'Column 1 = i-hat destination, Column 2 = j-hat destination',
      action: 'Drag "a" slider to move red i-hat, "d" to move green j-hat',
    },
    {
      title: 'What Does the Square Represent?',
      concept: `The light blue square tracks the TRANSFORMED coordinate system. Its corners show where grid points land:
• (1,0) = 1×i-hat → lands at [${a.toFixed(1)}, ${c.toFixed(1)}] = red arrow tip
• (0,1) = 1×j-hat → lands at [${b.toFixed(1)}, ${d.toFixed(1)}] = green arrow tip
• (1,1) = i-hat + j-hat → lands at [${(a+b).toFixed(1)}, ${(c+d).toFixed(1)}]

The square's edges ARE the new i-hat and j-hat!`,
      hint: 'The square edges exactly follow the red and green arrows.',
      action: 'Compare square edges to i-hat and j-hat arrows',
    },
    {
      title: '▶️ Watch Transformation Animate!',
      concept: `Press PLAY to watch the transformation smoothly animate from identity to your current matrix.

You'll see the gray unit square (area = 1) gradually stretch and morph into the light blue transformed square.

The CHANGE in area tells us the determinant!`,
      hint: 'Click PLAY to see the transformation animation',
      action: 'Click the PLAY button to watch the animation',
      hasAnimation: true,
    },
    {
      title: 'What is the Determinant?',
      concept: `The determinant = area of the light blue square

For your current matrix:
  [${a.toFixed(1)}, ${b.toFixed(1)}]
  [${c.toFixed(1)}, ${d.toFixed(1)}]

The light blue square's area equals |det|. Gray square area = 1.

What does det = ${determinant.toFixed(2)} mean for YOUR matrix?`,
      hint: 'The light blue square represents the area after transformation.',
      action: 'Notice how the area of the light blue square compares to gray',
    },
    {
      title: 'How to Calculate the Determinant',
      concept: `Formula: det = a×d - b×c

Step-by-step for your matrix:
  a = ${a.toFixed(1)},  b = ${b.toFixed(1)}
  c = ${c.toFixed(1)},  d = ${d.toFixed(1)}

  Step 1: a × d = ${a.toFixed(1)} × ${d.toFixed(1)} = ${(a*d).toFixed(2)}
  Step 2: b × c = ${b.toFixed(1)} × ${c.toFixed(1)} = ${(b*c).toFixed(2)}
  Step 3: det = ${(a*d).toFixed(2)} - ${(b*c).toFixed(2)} = ${determinant.toFixed(2)}

Interpretation:
• |det| = ${Math.abs(determinant).toFixed(2)} = area scale factor`,
      hint: 'det = (a×d) - (b×c) = area of light blue square',
      action: 'Calculate along: a×d - b×c',
    },
    {
      title: 'What Does the Determinant Mean?',
      concept: `det = ${determinant.toFixed(2)} tells us:

${Math.abs(determinant).toFixed(2)}×  Areas scale by this factor

${determinant >= 0 ? '✓ det > 0: No flip (same orientation)'
  : '↩️ det < 0: FLIP! (mirrored + rotated)\n    Left-handed ↔ Right-handed coordinate system'}

${Math.abs(determinant) < 0.01 ? '⚠️ det ≈ 0: Everything collapses to a line!'
  : determinant === 0 ? '⚠️ det = 0: Collapses to line, CANNOT invert!'
  : '✓ Non-zero det: Transformation can be UNDONE (inverse exists)'}`,
      hint: 'Area scale, orientation flip, and invertibility all from one number!',
      action: 'Check what your determinant value means',
    },
    {
      title: 'Try Some Presets!',
      concept: `Click presets to see common transformations:
• rotate90: i-hat → [0,-1], j-hat → [1,0] — 90° CCW, det = -1
• reflectX: Mirror across x-axis, det = -1 (flip!)
• reflectY: Mirror across y-axis, det = -1 (flip!)
• shear: Parallel lines stay parallel but slanted
• stretch: Stretches one direction, squishes the other

Watch how the light blue square changes with each!`,
      hint: 'Each preset shows a specific type. Watch i-hat and j-hat move!',
      action: 'Click "rotate90" preset — det becomes -1 (flip!)',
    },
    {
      title: 'When det = 0: The Collapse',
      concept: `If det = 0, i-hat and j-hat point in the SAME or EXACTLY OPPOSITE direction. They can no longer define a 2D area — everything collapses to a line.

When det = 0:
• The light blue square becomes a flat line
• Information is LOST — can't undo
• Inverse does NOT exist

Example: Matrix [2, 4; 1, 2] has det = 0 because [2,1] and [4,2] are parallel!`,
      hint: 'Make i-hat and j-hat parallel to see the collapse.',
      action: 'Try: a=2, b=4, c=1, d=2 → det = 0?',
    },
    {
      title: 'The Inverse: How to Undo',
      concept: `If det ≠ 0, an inverse matrix A⁻¹ exists that undoes A:

  A × A⁻¹ = Identity (back to normal)

For 2×2:
       ┌ d  -b ┐
  A⁻¹ = ─── × │     │  (when det ≠ 0)
       det└ -c   a ┘

Why does this work? The inverse sends i-hat and j-hat BACK to their original positions!

✓ det = ${determinant.toFixed(2)} ${determinant !== 0 ? '≠ 0' : '= 0'} → ${determinant !== 0 ? 'Inverse EXISTS' : 'NO inverse (det = 0)'}`,
      hint: 'Only non-zero det has an inverse.',
      action: 'Check if det ≠ 0 in the right panel',
    },
    {
      title: 'Explore and Build Intuition!',
      concept: `Now you understand matrix transformations! The 4 numbers define everything:
• a: i-hat's new x (right-left of red arrow)
• b: j-hat's new x (right-left of green arrow)
• c: i-hat's new y (up-down of red arrow)
• d: j-hat's new y (up-down of green arrow)

Every point (x,y) → (a·x + b·y, c·x + d·y)
The light blue square's area = |det|`,
      hint: 'Experiment with sliders. Try weird combinations!',
      action: 'Drag all sliders to explore transformations',
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

  const renderSquare = (points, fill, stroke, opacity = 0.25) => {
    if (points.length === 0) return null;
    const pathPoints = points.map((p, i) => {
      const cp = toCanvas(p[0], p[1]);
      return i === 0 ? `M ${cp.x} ${cp.y}` : `L ${cp.x} ${cp.y}`;
    }).join(' ') + ' Z';
    return (
      <path d={pathPoints} fill={fill} fillOpacity={opacity} stroke={stroke} strokeWidth="2.5" strokeLinejoin="round" />
    );
  };

  const renderArrow = (from, to, color, width = 3, showLabel = true, labelText = '') => {
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
        {showLabel && (
          <text x={to.x + 14} y={to.y - 8} fill={color} fontSize="13" fontWeight="700" fontFamily="var(--font-mono)">
            {labelText}
          </text>
        )}
      </g>
    );
  };

  const origin = toCanvas(0, 0);
  const iHatDest = animating ? [1 + (a - 1) * animProgress, 0 + (c - 0) * animProgress] : [a, c];
  const jHatDest = animating ? [0 + (b - 0) * animProgress, 1 + (d - 1) * animProgress] : [b, d];
  const iHatPos = toCanvas(iHatDest[0], iHatDest[1]);
  const jHatPos = toCanvas(jHatDest[0], jHatDest[1]);

  const currentSquare = animating ? animatedSquare : transformedSquare;

  const currentStepData = steps[currentStep];

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
          {currentStepData.hasAnimation && (
            <button onClick={() => setAnimating(!animating)} className="p-1.5 rounded-lg transition-all duration-150"
              style={{ color: 'var(--color-paper)', backgroundColor: 'var(--color-accent)' }}
              title={animating ? "Animating..." : "Play Animation"}>
              <Play className="w-4 h-4" />
            </button>
          )}
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
                {currentStepData.title}
              </h3>
              <p className="text-xs leading-relaxed whitespace-pre-line" style={{ color: 'var(--color-muted)' }}>
                {currentStepData.concept}
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
              {showOriginal && !animating && renderSquare(unitSquare, 'var(--color-muted)', 'var(--color-muted)')}
              {showOriginal && animating && renderSquare(unitSquare, 'var(--color-muted)', 'var(--color-muted)', 0.15 + 0.1 * (1 - animProgress))}

              {/* Transformed square */}
              {renderSquare(currentSquare, 'var(--color-accent)', 'var(--color-accent)', animating ? 0.1 + 0.25 * animProgress : 0.25)}

              {/* Area labels */}
              {!animating && (
                <>
                  <text x={origin.x + 50} y={origin.y + 50} fill="var(--color-muted)" fontSize="11" fontFamily="var(--font-mono)" opacity="0.7">Area = 1</text>
                  <text x={origin.x + Math.abs(a + b) * pixelsPerUnit / 2 + 20} y={origin.y - Math.abs(c + d) * pixelsPerUnit / 2} fill="var(--color-accent)" fontSize="11" fontFamily="var(--font-mono)" fontWeight="600">Area = |det| = {Math.abs(determinant).toFixed(2)}</text>
                </>
              )}
              {animating && (
                <text x={origin.x + 50} y={origin.y + 50} fill="var(--color-accent)" fontSize="12" fontFamily="var(--font-mono)" fontWeight="700">
                  Area = {(animProgress * Math.abs(determinant) + (1 - animProgress) * 1).toFixed(2)}
                </text>
              )}

              {/* i-hat arrow */}
              {!animating && renderArrow(origin, iHatPos, 'oklch(52% 0.16 25)', 3, true, `i-hat → [${a.toFixed(1)}, ${c.toFixed(1)}]`)}
              {animating && renderArrow(origin, iHatPos, 'oklch(52% 0.16 25)', 3, true, `i-hat → [${iHatDest[0].toFixed(1)}, ${iHatDest[1].toFixed(1)}]`)}

              {/* j-hat arrow */}
              {!animating && renderArrow(origin, jHatPos, 'oklch(52% 0.16 155)', 3, true, `j-hat → [${b.toFixed(1)}, ${d.toFixed(1)}]`)}
              {animating && renderArrow(origin, jHatPos, 'oklch(52% 0.16 155)', 3, true, `j-hat → [${jHatDest[0].toFixed(1)}, ${jHatDest[1].toFixed(1)}]`)}

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
                  <span className="text-xs" style={{ color: 'var(--color-muted)' }}>Gray = Original (area = 1)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-0.5 rounded-full" style={{ backgroundColor: 'var(--color-accent)' }} />
                  <span className="text-xs" style={{ color: 'var(--color-muted)' }}>Light Blue = Transformed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-0.5 rounded-full" style={{ backgroundColor: 'oklch(52% 0.16 25)' }} />
                  <span className="text-xs" style={{ color: 'var(--color-muted)' }}>Red = i-hat (x-direction)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-0.5 rounded-full" style={{ backgroundColor: 'oklch(52% 0.16 155)' }} />
                  <span className="text-xs" style={{ color: 'var(--color-muted)' }}>Green = j-hat (y-direction)</span>
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
                  <div className="flex flex-col items-center gap-1 text-lg font-bold" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-ink)' }}>
                    <div className="flex items-center gap-2">
                      <span>[</span>
                      <span style={{ color: 'oklch(52% 0.16 25)' }}>{animating ? iHatDest[0].toFixed(1) : a.toFixed(1)}</span>
                      <span style={{ color: 'oklch(52% 0.16 155)' }}>{animating ? jHatDest[0].toFixed(1) : b.toFixed(1)}</span>
                      <span>]</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>&nbsp;</span>
                      <span style={{ color: 'oklch(52% 0.16 25)' }}>{animating ? iHatDest[1].toFixed(1) : c.toFixed(1)}</span>
                      <span style={{ color: 'oklch(52% 0.16 155)' }}>{animating ? jHatDest[1].toFixed(1) : d.toFixed(1)}</span>
                      <span>]</span>
                    </div>
                  </div>
                </div>
                <div className="mt-2 p-2 rounded-lg text-xs space-y-1" style={{ backgroundColor: 'var(--color-paper-2)' }}>
                  <p style={{ color: 'oklch(52% 0.16 25)' }}>▸ Column 1 = i-hat [1,0] → [{animating ? iHatDest[0].toFixed(1) : a.toFixed(1)}, {animating ? iHatDest[1].toFixed(1) : c.toFixed(1)}]</p>
                  <p style={{ color: 'oklch(52% 0.16 155)' }}>▸ Column 2 = j-hat [0,1] → [{animating ? jHatDest[0].toFixed(1) : b.toFixed(1)}, {animating ? jHatDest[1].toFixed(1) : d.toFixed(1)}]</p>
                </div>
              </div>

              {/* Matrix Sliders */}
              <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--color-paper-2)' }}>
                <div className="text-xs font-medium mb-2" style={{ color: 'var(--color-neutral)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  Adjust Matrix Values
                </div>
                <div className="space-y-3">
                  {[
                    { label: 'a = i-hat x', value: matrix[0], idx: 0, col: 'oklch(52% 0.16 25)', tip: 'Move red arrow right/left' },
                    { label: 'b = j-hat x', value: matrix[1], idx: 1, col: 'oklch(52% 0.16 155)', tip: 'Move green arrow right/left' },
                    { label: 'c = i-hat y', value: matrix[2], idx: 2, col: 'oklch(52% 0.16 25)', tip: 'Move red arrow up/down' },
                    { label: 'd = j-hat y', value: matrix[3], idx: 3, col: 'oklch(52% 0.16 155)', tip: 'Move green arrow up/down' },
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

              {/* Determinant Section */}
              <div className="p-3 rounded-xl" style={determinant >= 0 ? { backgroundColor: 'rgba(75,180,140,0.10)' } : { backgroundColor: 'rgba(220,75,55,0.08)' }}>
                <div className="text-xs font-medium mb-1" style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Determinant = Area of Light Blue Square
                </div>
                <div className="text-2xl font-bold" style={{ fontFamily: 'var(--font-mono)', color: determinant >= 0 ? 'oklch(52% 0.16 155)' : 'oklch(52% 0.16 25)' }}>
                  det = {animating ? (1 + (Math.abs(determinant) - 1) * animProgress).toFixed(2) : determinant.toFixed(2)}
                </div>

                {/* Step-by-step calculation */}
                <div className="mt-2 p-2 rounded-lg" style={{ backgroundColor: 'var(--color-paper)', border: '1px solid var(--color-rule)' }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: 'var(--color-ink)' }}>How to Calculate:</p>
                  <p className="text-xs mb-1" style={{ color: 'var(--color-muted)' }}>
                    Formula: det = a×d - b×c
                  </p>
                  <div className="text-xs space-y-0.5" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-muted)' }}>
                    <p>Step 1: a × d</p>
                    <p style={{ color: 'oklch(52% 0.16 25)' }}>&nbsp;&nbsp;{animating ? (1 + (a - 1) * animProgress).toFixed(2) : a.toFixed(1)} × {animating ? (1 + (d - 1) * animProgress).toFixed(2) : d.toFixed(1)} = {animating ? ((1 + (a - 1) * animProgress) * (1 + (d - 1) * animProgress)).toFixed(2) : (a*d).toFixed(2)}</p>
                    <p>Step 2: b × c</p>
                    <p style={{ color: 'oklch(52% 0.16 155)' }}>&nbsp;&nbsp;{animating ? (b * animProgress).toFixed(2) : b.toFixed(1)} × {animating ? c.toFixed(2) : c.toFixed(1)} = {animating ? (b * animProgress * c).toFixed(2) : (b*c).toFixed(2)}</p>
                    <p className="font-semibold" style={{ color: 'var(--color-ink)' }}>Step 3: det = {animating ? ((1 + (a - 1) * animProgress) * (1 + (d - 1) * animProgress)).toFixed(2) : (a*d).toFixed(2)} - {animating ? (b * animProgress * c).toFixed(2) : (b*c).toFixed(2)}</p>
                    <p className="font-bold" style={{ color: 'var(--color-accent)' }}>= {animating ? (1 + (Math.abs(determinant) - 1) * animProgress).toFixed(2) : determinant.toFixed(2)}</p>
                  </div>
                </div>

                <div className="mt-2 text-xs space-y-1" style={{ color: 'var(--color-muted)' }}>
                  <p>📐 Area scale = |det| = {Math.abs(animating ? (1 + (Math.abs(determinant) - 1) * animProgress) : determinant).toFixed(2)}×</p>
                  {Math.abs(determinant) < 0.01
                    ? '⚠️ det ≈ 0: Everything collapses!'
                    : determinant < 0
                      ? '↩️ det < 0: FLIP (orientation reversed)'
                      : '✓ det > 0: Same orientation'}
                </div>
              </div>

              {/* Inverse Formula */}
              <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--color-paper-2)' }}>
                <div className="text-xs font-medium mb-2" style={{ color: 'var(--color-neutral)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  Inverse Formula (if det ≠ 0)
                </div>
                <div className="p-2 rounded-lg text-center" style={{ backgroundColor: 'var(--color-paper)', border: '1px solid var(--color-rule)' }}>
                  <div className="text-sm font-bold" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-ink)' }}>
                    <div>┌ d  -b ┐</div>
                    <div>A⁻¹ = ─── × │     │</div>
                    <div>       det└ -c   a ┘</div>
                  </div>
                </div>
                <p className="text-xs mt-2" style={{ color: 'var(--color-muted)' }}>
                  {determinant !== 0
                    ? `✓ Inverse exists (det = ${determinant.toFixed(2)} ≠ 0)`
                    : '✗ No inverse when det = 0 (info lost)'}
                </p>
              </div>

              {/* Basis Vectors Info */}
              <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--color-paper-2)' }}>
                <div className="text-xs font-medium mb-2" style={{ color: 'var(--color-neutral)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  Where Each Direction Goes
                </div>
                <div className="space-y-2">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--color-paper)' }}>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'oklch(52% 0.16 25)' }} />
                      <span className="text-xs font-semibold" style={{ color: 'oklch(52% 0.16 25)' }}>i-hat = x-direction = [1, 0]</span>
                    </div>
                    <code className="text-xs" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-ink)' }}>
                      → [{animating ? iHatDest[0].toFixed(1) : a.toFixed(1)}, {animating ? iHatDest[1].toFixed(1) : c.toFixed(1)}]
                    </code>
                    <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
                      {animating ? iHatDest[0].toFixed(1) : a.toFixed(1)} right, {animating ? iHatDest[1].toFixed(1) : c.toFixed(1)} up
                    </p>
                  </div>
                  <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--color-paper)' }}>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'oklch(52% 0.16 155)' }} />
                      <span className="text-xs font-semibold" style={{ color: 'oklch(52% 0.16 155)' }}>j-hat = y-direction = [0, 1]</span>
                    </div>
                    <code className="text-xs" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-ink)' }}>
                      → [{animating ? jHatDest[0].toFixed(1) : b.toFixed(1)}, {animating ? jHatDest[1].toFixed(1) : d.toFixed(1)}]
                    </code>
                    <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
                      {animating ? jHatDest[0].toFixed(1) : b.toFixed(1)} right, {animating ? jHatDest[1].toFixed(1) : d.toFixed(1)} up
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
                  {currentStepData.action}
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
          <span className="text-xs">Matrix [{animating ? iHatDest[0].toFixed(1) : a.toFixed(1)}, {animating ? jHatDest[0].toFixed(1) : b.toFixed(1)}; {animating ? iHatDest[1].toFixed(1) : c.toFixed(1)}, {animating ? jHatDest[1].toFixed(1) : d.toFixed(1)}]</span>
          <span>•</span>
          <span className="text-xs">det = {(animating ? (1 + (Math.abs(determinant) - 1) * animProgress) : determinant).toFixed(2)}</span>
          <span>•</span>
          <CompletionToggle moduleId={2} />
        </div>
      </div>
    </div>
  );
}