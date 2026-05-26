import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Gamepad2 } from 'lucide-react';
import { useStore } from '../../store/useStore';
import CompletionToggle from '../../components/UI/CompletionToggle';
import { Button } from '../../components/UI/Button';
import { InlineText } from '../../components/UI/Math';
import { det2x2 } from '../../utils/linalg';
import GameWrapper from '../../components/MiniGame/GameWrapper';
import AreaMatch from '../../games/AreaMatch';

const GRID_EXTENT = 6;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2;

export default function DeterminantsModule() {
  const [mode, setMode] = useState('2x2');
  const [currentStep, setCurrentStep] = useState(0);
  const [showGame, setShowGame] = useState(false);
  const [vectorU, setVectorU] = useState({ x: 2, y: 1 });
  const [vectorV, setVectorV] = useState({ x: 1, y: 2 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const canvasRef = useRef(null);
  const isPanning = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const [svgSize, setSvgSize] = useState({ w: 500, h: 400 });

  const determinant = det2x2([
    [vectorU.x, vectorV.x],
    [vectorU.y, vectorV.y],
  ]);
  const area = Math.abs(determinant);
  const isPositive = determinant >= 0;

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

  const fromCanvas = useCallback((cx, cy) => {
    if (pixelsPerUnit === 0) return { x: 0, y: 0 };
    return {
      x: (cx - svgSize.w / 2 - pan.x) / pixelsPerUnit,
      y: -(cy - svgSize.h / 2 - pan.y) / pixelsPerUnit,
    };
  }, [svgSize.w, svgSize.h, pixelsPerUnit, pan]);

  const zoomIn = () => setZoom(z => Math.min(MAX_ZOOM, z * 1.2));
  const zoomOut = () => setZoom(z => Math.max(MIN_ZOOM, z / 1.2));
  const resetView = () => setPan({ x: 0, y: 0 });

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

  const steps = [
    {
      title: 'Determinant as Signed Area',
      concept: `The parallelogram area formed by vectors $\\mathbf{u} = \\begin{pmatrix}${vectorU.x.toFixed(1)} \\\\ ${vectorU.y.toFixed(1)}\\end{pmatrix}$ and $\\mathbf{v} = \\begin{pmatrix}${vectorV.x.toFixed(1)} \\\\ ${vectorV.y.toFixed(1)}\\end{pmatrix}$ equals $|det| = ${area.toFixed(2)}$. The sign tells us about orientation!`,
      hint: 'Drag the vectors to change the parallelogram. Watch det change!',
      action: 'Drag the vectors to explore',
    },
    {
      title: 'The Formula',
      concept: `For a 2×2 matrix, $\\det = a \\times d - b \\times c$. Here: $\\det = ${vectorU.x.toFixed(1)} \\times ${vectorV.y.toFixed(1)} - ${vectorU.y.toFixed(1)} \\times ${vectorV.x.toFixed(1)} = ${determinant.toFixed(2)}$`,
      hint: 'The diagonal products minus the off-diagonal products.',
      action: 'Look at the formula panel for details',
    },
{
      title: 'When det = 0: Linear Dependence',
      concept: `If $\\det = 0$, the vectors are parallel and lie on the same line. This is called "LINEAR DEPENDENCE."

What does this mean?
• Two vectors are linearly dependent if one can be made by scaling the other
• If $\\mathbf{u} = 2\\mathbf{v}$ or $\\mathbf{v} = 0.5\\mathbf{u}$, they're dependent
• Geometrically: they point in the same (or exactly opposite) direction

Why care?
• The area collapses to zero!
• You can't "span" a 2D space with only 1 direction
• The matrix becomes non-invertible (no inverse exists)`,
      hint: 'Drag vectors to be parallel. The area becomes zero!',
      action: 'Make the vectors parallel (same or opposite direction)',
    },
    {
      title: 'Sign Matters: Orientation',
      concept: isPositive
        ? `Your vectors form a PARALLELOGRAM with $\\det = ${determinant.toFixed(2)} > 0$

What does this mean?
• The parallelogram is counterclockwise (right-handed)
• Imagine your right hand: thumb = u, index = v
• If your palm faces you, it's right-handed
• $\\det > 0$ means the orientation is PRESERVED (no flip)`
        : `Your vectors form a PARALLELOGRAM with $\\det = ${determinant.toFixed(2)} < 0$

What does this mean?
• The parallelogram is clockwise (left-handed)
• $\\det < 0$ means the orientation is FLIPPED
• Like a mirror reflection!`,
      hint: 'Try negative vectors or swap u and v!',
      action: 'Check the parallelogram orientation and hand-ness',
    },
    {
      title: 'Sign Matters',
      concept: isPositive
        ? `Positive $\\det = ${determinant.toFixed(2)}$: The orientation is preserved (counterclockwise from u to v). The parallelogram is "right-handed".`
        : `Negative $\\det = ${determinant.toFixed(2)}$: The orientation is flipped (clockwise from u to v). The parallelogram is "left-handed".`,
      hint: 'The color of the parallelogram indicates the sign.',
      action: 'Check the parallelogram color',
    },
    {
      title: '3×3 Determinants',
      concept: 'For 3×3 matrices, the determinant represents the volume of a parallelepiped. The sign tells us if the basis is right-handed or left-handed.',
      hint: 'Click "3×3 Matrix" to explore cofactor expansion.',
      action: 'Toggle to 3×3 mode to explore further',
    },
  ];

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

  const renderParallelogram = () => {
    const o = toCanvas(0, 0);
    const u = toCanvas(vectorU.x, vectorU.y);
    const v = toCanvas(vectorV.x, vectorV.y);
    const s = toCanvas(vectorU.x + vectorV.x, vectorU.y + vectorV.y);
    return (
      <polygon
        points={`${o.x},${o.y} ${u.x},${u.y} ${s.x},${s.y} ${v.x},${v.y}`}
        fill={isPositive ? 'oklch(52% 0.16 155)' : 'oklch(52% 0.16 25)'}
        fillOpacity="0.2"
        stroke={isPositive ? 'oklch(52% 0.16 155)' : 'oklch(52% 0.16 25)'}
        strokeWidth="2"
        strokeDasharray="6 3"
      />
    );
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Top Control Bar */}
      <div
        className="flex items-center gap-2 px-3 py-2 border-b flex-shrink-0 flex-wrap"
        style={{ backgroundColor: 'var(--color-paper)', borderColor: 'var(--color-rule)' }}
      >
        <div className="flex items-center gap-2">
          <Button
            variant={mode === '2x2' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setMode('2x2')}
          >
            2×2 Matrix
          </Button>
          <Button
            variant={mode === '3x3' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setMode('3x3')}
          >
            3×3 Matrix
          </Button>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          <Button
            variant={showGame ? 'primary' : 'ghost'}
            size="sm"
            icon={Gamepad2}
            onClick={() => setShowGame(!showGame)}
          >
            Mini-Game
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Guided Learning Card */}
        <div
          className="px-4 py-2.5 border-b flex-shrink-0"
          style={{
            background: 'linear-gradient(to right, rgba(75,150,200,0.06), rgba(75,200,150,0.06))',
            borderColor: 'var(--color-rule)',
          }}
        >
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
              <p className="text-xs leading-relaxed" style={{ color: 'var(--color-muted)' }}>
                <InlineText text={steps[currentStep].concept} />
              </p>
            </div>
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

        {/* Canvas + Right Panel */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Main Canvas area */}
          <div className="flex-1 min-h-0 min-w-0 relative">
            {showGame ? (
              <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-paper)' }}>
                <GameWrapper
                  title="Area Match"
                  instructions="Drag the vectors to match the target area"
                  maxAttempts={5}
                  rounds={5}
                  scoring="accuracy"
                >
                  {(props) => <AreaMatch {...props} />}
                </GameWrapper>
              </div>
            ) : mode === '2x2' ? (
              <svg
                ref={canvasRef}
                className="w-full h-full cursor-grab active:cursor-grabbing select-none"
                style={{ backgroundColor: 'var(--color-paper)', display: 'block', touchAction: 'none' }}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {renderGrid()}

                {/* Axis lines */}
                <line x1={0} y1={toCanvas(0, 0).y} x2={svgSize.w} y2={toCanvas(0, 0).y}
                  stroke="var(--color-neutral)" strokeWidth="1.5" opacity="0.4" />
                <line x1={toCanvas(0, 0).x} y1={0} x2={toCanvas(0, 0).x} y2={svgSize.h}
                  stroke="var(--color-neutral)" strokeWidth="1.5" opacity="0.4" />

                {/* Origin */}
                <line x1={toCanvas(0, 0).x - 12} y1={toCanvas(0, 0).y} x2={toCanvas(0, 0).x + 12} y2={toCanvas(0, 0).y}
                  stroke="var(--color-neutral)" strokeWidth="2.5" opacity="0.9" />
                <line x1={toCanvas(0, 0).x} y1={toCanvas(0, 0).y - 12} x2={toCanvas(0, 0).x} y2={toCanvas(0, 0).y + 12}
                  stroke="var(--color-neutral)" strokeWidth="2.5" opacity="0.9" />
                <circle cx={toCanvas(0, 0).x} cy={toCanvas(0, 0).y} r={7} fill="var(--color-accent)" />
                <circle cx={toCanvas(0, 0).x} cy={toCanvas(0, 0).y} r={3.5} fill="var(--color-paper)" />

                {/* Parallelogram */}
                {renderParallelogram()}

                {/* Vectors */}
                {renderArrow(toCanvas(0, 0), toCanvas(vectorU.x, vectorU.y), 'oklch(52% 0.16 25)', 3)}
                {renderArrow(toCanvas(0, 0), toCanvas(vectorV.x, vectorV.y), 'oklch(52% 0.16 155)', 3)}

                {/* Labels */}
                <text x={toCanvas(vectorU.x, vectorU.y).x + 14} y={toCanvas(vectorU.x, vectorU.y).y - 8}
                  fill="oklch(52% 0.16 25)" fontSize="13" fontWeight="700" fontFamily="var(--font-mono)">u</text>
                <text x={toCanvas(vectorV.x, vectorV.y).x + 14} y={toCanvas(vectorV.x, vectorV.y).y - 8}
                  fill="oklch(52% 0.16 155)" fontSize="13" fontWeight="700" fontFamily="var(--font-mono)">v</text>
                <text x={svgSize.w - 14} y={toCanvas(0, 0).y - 10} fill="var(--color-neutral)" fontSize="11" fontWeight="600"
                  fontFamily="var(--font-mono)" textAnchor="end" opacity="0.7">x</text>
                <text x={toCanvas(0, 0).x + 12} y={16} fill="var(--color-neutral)" fontSize="11" fontWeight="600"
                  fontFamily="var(--font-mono)" textAnchor="start" opacity="0.7">y</text>

                {/* Det display */}
                <g transform={`translate(16, ${svgSize.h - 50})`}>
                  <rect x="0" y="0" width="140" height="40" rx="8" fill={isPositive ? 'oklch(52% 0.16 155)' : 'oklch(52% 0.16 25)'} fillOpacity="0.9" />
                  <text x="70" y="16" textAnchor="middle" fill="var(--color-paper)" fontSize="10" fontWeight="600" fontFamily="var(--font-mono)">
                    det = {determinant.toFixed(2)}
                  </text>
                  <text x="70" y="30" textAnchor="middle" fill="var(--color-paper)" fontSize="9" fillOpacity="0.8" fontFamily="var(--font-mono)">
                    Area = {area.toFixed(2)}
                  </text>
                </g>
              </svg>
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-paper)' }}>
                <div className="text-center p-8">
                  <div className="text-6xl mb-4" style={{ color: 'var(--color-muted)' }}>3D</div>
                  <p style={{ color: 'var(--color-muted)' }}>3×3 determinant visualization with parallelepiped</p>
                  <p className="text-sm mt-2" style={{ color: 'var(--color-muted)', opacity: 0.7 }}>Three.js 3D scene would render here</p>
                  <div className="mt-4 p-4 rounded-xl" style={{ backgroundColor: 'var(--color-paper-2)', border: '1px solid var(--color-rule)' }}>
                    <div className="text-xs font-medium mb-2" style={{ color: 'var(--color-neutral)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                      Cofactor Expansion
                    </div>
                    <code className="text-sm font-mono" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-ink)' }}>
                      det(A) = a·M₁₁ - b·M₁₂ + c·M₁₃
                    </code>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel */}
          <div
            className="w-64 lg:w-72 xl:w-80 flex-shrink-0 min-h-0 overflow-y-auto overflow-x-hidden border-l"
            style={{ backgroundColor: 'var(--color-paper)', borderColor: 'var(--color-rule)' }}
          >
            <div className="p-3 space-y-3">
              {/* Vector Controls */}
              {mode === '2x2' && (
                <>
                  <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--color-paper-2)' }}>
                    <div className="text-xs font-medium mb-2" style={{ color: 'var(--color-neutral)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                      Vector u
                    </div>
                    <div className="space-y-2">
                      <div>
                        <label className="text-xs mb-1 block" style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>x₁</label>
                        <input
                          type="range" min={-3} max={3} step={0.1} value={vectorU.x}
                          onChange={(e) => setVectorU(v => ({ ...v, x: parseFloat(e.target.value) }))}
                          className="w-full" style={{ accentColor: 'oklch(52% 0.16 25)', cursor: 'pointer' }}
                        />
                        <div className="text-xs text-right" style={{ color: 'oklch(52% 0.16 25)', fontFamily: 'var(--font-mono)' }}>
                          {vectorU.x.toFixed(1)}
                        </div>
                      </div>
                      <div>
                        <label className="text-xs mb-1 block" style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>y₁</label>
                        <input
                          type="range" min={-3} max={3} step={0.1} value={vectorU.y}
                          onChange={(e) => setVectorU(v => ({ ...v, y: parseFloat(e.target.value) }))}
                          className="w-full" style={{ accentColor: 'oklch(52% 0.16 25)', cursor: 'pointer' }}
                        />
                        <div className="text-xs text-right" style={{ color: 'oklch(52% 0.16 25)', fontFamily: 'var(--font-mono)' }}>
                          {vectorU.y.toFixed(1)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--color-paper-2)' }}>
                    <div className="text-xs font-medium mb-2" style={{ color: 'var(--color-neutral)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                      Vector v
                    </div>
                    <div className="space-y-2">
                      <div>
                        <label className="text-xs mb-1 block" style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>x₂</label>
                        <input
                          type="range" min={-3} max={3} step={0.1} value={vectorV.x}
                          onChange={(e) => setVectorV(v => ({ ...v, x: parseFloat(e.target.value) }))}
                          className="w-full" style={{ accentColor: 'oklch(52% 0.16 155)', cursor: 'pointer' }}
                        />
                        <div className="text-xs text-right" style={{ color: 'oklch(52% 0.16 155)', fontFamily: 'var(--font-mono)' }}>
                          {vectorV.x.toFixed(1)}
                        </div>
                      </div>
                      <div>
                        <label className="text-xs mb-1 block" style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>y₂</label>
                        <input
                          type="range" min={-3} max={3} step={0.1} value={vectorV.y}
                          onChange={(e) => setVectorV(v => ({ ...v, y: parseFloat(e.target.value) }))}
                          className="w-full" style={{ accentColor: 'oklch(52% 0.16 155)', cursor: 'pointer' }}
                        />
                        <div className="text-xs text-right" style={{ color: 'oklch(52% 0.16 155)', fontFamily: 'var(--font-mono)' }}>
                          {vectorV.y.toFixed(1)}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Determinant Display */}
              <div className="p-3 rounded-xl" style={isPositive ? { backgroundColor: 'rgba(75,180,140,0.10)' } : { backgroundColor: 'rgba(220,75,55,0.08)' }}>
                <div className="text-xs font-medium mb-1" style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Determinant
                </div>
                <div className="text-2xl font-bold mb-1" style={{ fontFamily: 'var(--font-mono)', color: isPositive ? 'oklch(52% 0.16 155)' : 'oklch(52% 0.16 25)' }}>
                  det = {determinant.toFixed(2)}
                </div>
                <div className="text-xs" style={{ color: 'var(--color-muted)' }}>
                  Area = {area.toFixed(2)} | {isPositive ? 'Preserved orientation' : 'Flipped orientation'}
                </div>
              </div>

              {/* Geometric Meaning */}
              <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(75,160,195,0.08)', border: '1px solid var(--color-accent)' }}>
                <div className="text-xs font-medium mb-2" style={{ color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Geometric Meaning
                </div>
                <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                  {Math.abs(determinant) < 0.001
                    ? 'Vectors are parallel — linear dependent, det = 0!'
                    : isPositive
                      ? 'Positive det: counterclockwise orientation. Area equals |det|.'
                      : 'Negative det: clockwise orientation (flipped).'}
                </p>
              </div>

              {/* Formula */}
              <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--color-paper-2)' }}>
                <div className="text-xs font-medium mb-2" style={{ color: 'var(--color-neutral)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  Formula
                </div>
                <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--color-paper)' }}>
                  <code className="text-xs font-mono" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-ink)' }}>
                    det = u₁×v₂ - u₂×v₁
                  </code>
                </div>
                <div className="p-2 rounded-lg mt-2" style={{ backgroundColor: 'var(--color-paper)' }}>
                  <code className="text-xs font-mono" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-ink)' }}>
                    = {vectorU.x.toFixed(1)}×{vectorV.y.toFixed(1)} - {vectorU.y.toFixed(1)}×{vectorV.x.toFixed(1)}
                  </code>
                </div>
              </div>

              {/* Hint */}
              <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(200,155,50,0.08)', border: '1px solid oklch(65% 0.10 70)' }}>
                <div className="text-xs font-medium mb-1" style={{ color: 'oklch(65% 0.10 70)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Hint
                </div>
                <p className="text-xs" style={{ color: 'oklch(65% 0.10 70)' }}>
                  {steps[currentStep].hint}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-4 py-2 flex items-center justify-center gap-4 border-t flex-shrink-0"
          style={{ backgroundColor: 'var(--color-paper)', borderColor: 'var(--color-rule)', color: 'var(--color-muted)' }}
        >
          <span className="text-xs">Action: {steps[currentStep].action}</span>
          <span>•</span>
          <CompletionToggle moduleId={4} />
        </div>
      </div>
    </div>
  );
}