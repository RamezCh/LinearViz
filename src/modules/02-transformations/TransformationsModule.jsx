import { useState } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, Eye, EyeOff, ChevronLeft, ChevronRight, Gamepad2 } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { Button } from '../../components/UI/Button';
import GameWrapper from '../../components/MiniGame/GameWrapper';
import TransformMatch from '../../games/TransformMatch';
import CompletionToggle from '../../components/UI/CompletionToggle';

const PRESETS = {
  identity: [1, 0, 0, 1],
  rotate90:  [0, -1, 1, 0],
  reflectX:  [1, 0, 0, -1],
  reflectY:  [-1, 0, 0, 1],
  shear:     [1, 0.5, 0, 1],
  stretch:   [2, 0, 0, 0.5],
};

const CANVAS_SIZE = 480;
const GRID_EXTENT = 6;

export default function TransformationsModule() {
  const [matrix, setMatrix] = useState([1, 0, 0, 1]);
  const [showOriginal, setShowOriginal] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showGame, setShowGame] = useState(false);
  const { currentModule } = useStore();

  const a = matrix[0], b = matrix[1], c = matrix[2], d = matrix[3];
  const determinant = a * d - b * c;

  const toCanvas = (wx, wy) => ({
    x: CANVAS_SIZE / 2 + wx * (CANVAS_SIZE / (2 * GRID_EXTENT)),
    y: CANVAS_SIZE / 2 - wy * (CANVAS_SIZE / (2 * GRID_EXTENT)),
  });

  const transform = ([x, y]) => [a * x + b * y, c * x + d * y];

  const originalSquare = [
    [0, 0], [1, 0], [1, 1], [0, 1],
    [0.2, 0.2], [0.4, 0.2], [0.6, 0.2], [0.8, 0.2],
    [0.2, 0.4], [0.8, 0.4],
  ];
  const transformedSquare = originalSquare.map(transform);

  const renderGrid = () => {
    const lines = [];
    const scale = CANVAS_SIZE / (2 * GRID_EXTENT);
    const center = CANVAS_SIZE / 2;
    const color = 'var(--color-rule)';

    for (let i = -GRID_EXTENT; i <= GRID_EXTENT; i++) {
      if (i === 0) continue;
      lines.push(
        <line key={`v${i}`} x1={center + i * scale} y1={0} x2={center + i * scale} y2={CANVAS_SIZE}
          stroke={color} strokeWidth="1" />,
        <line key={`h${i}`} x1={0} y1={center + i * scale} x2={CANVAS_SIZE} y2={center + i * scale}
          stroke={color} strokeWidth="1" />
      );
    }
    return lines;
  };

  const renderPolygon = (points, fill, stroke) => {
    const path = points.map((p, i) => {
      const cp = toCanvas(p[0], p[1]);
      return `${i === 0 ? 'M' : 'L'}${cp.x},${cp.y}`;
    }).join(' ') + ' Z';
    return <path d={path} fill={fill} fillOpacity="0.3" stroke={stroke} strokeWidth="2" strokeLinejoin="round" />;
  };

  const renderArrow = (from, to, color, width = 2) => {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 5) return null;

    const angle = Math.atan2(dy, dx);
    const headLen = 10;
    const headAngle = Math.PI / 6;

    return (
      <g>
        <line x1={from.x} y1={from.y} x2={to.x} y2={to.y}
          stroke={color} strokeWidth={width} strokeLinecap="round" />
        <polygon
          points={`${to.x},${to.y} ${to.x - headLen * Math.cos(angle - headAngle)},${to.y - headLen * Math.sin(angle - headAngle)} ${to.x - headLen * Math.cos(angle + headAngle)},${to.y - headLen * Math.sin(angle + headAngle)}`}
          fill={color} />
      </g>
    );
  };

  const reset = () => setMatrix([1, 0, 0, 1]);

  const iHat = toCanvas(a, c);
  const jHat = toCanvas(b, d);
  const origin = { x: CANVAS_SIZE / 2, y: CANVAS_SIZE / 2 };

  const steps = [
    { title: 'Identity Matrix',  desc: 'The identity matrix leaves all vectors unchanged.' },
    { title: 'Basis Vectors',    desc: 'Columns of the matrix show where i-hat and j-hat land.' },
    { title: 'Transformation',   desc: 'All points transform according to the matrix rule.' },
    { title: 'Determinant',      desc: `det = ${determinant.toFixed(2)} — the area scaling factor` },
  ];

  const activePreset = Object.entries(PRESETS).find(
    ([, vals]) => JSON.stringify(vals) === JSON.stringify(matrix)
  )?.[0];

  return (
    <div className="h-full flex flex-col">
      {/* Top bar */}
      <div
        className="px-4 py-2.5 border-b"
        style={{ backgroundColor: 'var(--color-paper)', borderColor: 'var(--color-rule)' }}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            className="p-1.5 rounded-lg transition-all duration-150 disabled:opacity-30"
            style={{ color: 'var(--color-muted)' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-paper-2)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5 px-1">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentStep(i)}
                className="rounded-full transition-all duration-200"
                style={{
                  width:  i === currentStep ? 24 : 8,
                  height: 8,
                  backgroundColor: i === currentStep ? 'var(--color-accent)' : 'var(--color-rule)',
                }}
              />
            ))}
          </div>

          <span
            className="text-xs font-medium px-2.5 py-0.5 rounded-full"
            style={{
              backgroundColor: 'rgba(75,160,195,0.12)',
              color: 'var(--color-accent)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {currentStep + 1}/{steps.length}
          </span>

          <div className="flex-1">
            <h3
              className="text-sm font-semibold"
              style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-display)' }}
            >
              {steps[currentStep]?.title}
            </h3>
          </div>

          <button
            onClick={reset}
            className="p-1.5 rounded-lg transition-all duration-150"
            style={{ color: 'var(--color-muted)' }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = 'var(--color-paper-2)';
              e.currentTarget.style.color = 'var(--color-ink)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--color-muted)';
            }}
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowOriginal(!showOriginal)}
            className="p-1.5 rounded-lg transition-all duration-150"
            style={showOriginal
              ? { backgroundColor: 'var(--color-accent)', color: 'var(--color-paper)' }
              : {
                  color: 'var(--color-muted)',
                }}
            onMouseEnter={e => {
              if (!showOriginal) e.currentTarget.style.backgroundColor = 'var(--color-paper-2)';
            }}
            onMouseLeave={e => {
              if (!showOriginal) e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {showOriginal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>

          <div className="h-5 w-px" style={{ backgroundColor: 'var(--color-rule)' }} />

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

      {/* Main content */}
      <div className="flex-1 flex min-h-0">
        {/* Canvas */}
        <div className="flex-1 p-4 flex items-center justify-center min-h-0">
          <svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}`}
            preserveAspectRatio="xMidYMid meet"
            className="rounded-2xl"
            style={{
              backgroundColor: 'var(--color-paper)',
              boxShadow: 'var(--shadow-lg)',
              border: '1px solid var(--color-rule)',
            }}
          >
            {renderGrid()}

            <line x1={CANVAS_SIZE/2} y1={0} x2={CANVAS_SIZE/2} y2={CANVAS_SIZE}
              stroke="var(--color-ink-2)" strokeWidth="2" />
            <line x1={0} y1={CANVAS_SIZE/2} x2={CANVAS_SIZE} y2={CANVAS_SIZE/2}
              stroke="var(--color-ink-2)" strokeWidth="2" />

            {showOriginal && (
              <motion.g initial={{ opacity: 0 }} animate={{ opacity: 0.35 }}>
                {renderPolygon(originalSquare, 'var(--color-muted)', 'var(--color-muted)')}
              </motion.g>
            )}

            {renderPolygon(transformedSquare, 'var(--color-accent)', 'var(--color-accent)')}

            {renderArrow(origin, iHat, 'oklch(52% 0.16 25)', 3)}
            {renderArrow(origin, jHat, 'oklch(52% 0.16 155)', 3)}

            <text x={iHat.x + 16} y={iHat.y - 4}
              fill="oklch(52% 0.16 25)" fontSize="14" fontWeight="700"
              fontFamily="var(--font-mono)">i'</text>
            <text x={jHat.x + 16} y={jHat.y - 4}
              fill="oklch(52% 0.16 155)" fontSize="14" fontWeight="700"
              fontFamily="var(--font-mono)">j'</text>
            <text x={origin.x - 18} y={origin.y + 18}
              fill="var(--color-muted)" fontSize="14"
              fontFamily="var(--font-mono)">0</text>
          </svg>
        </div>

        {/* Controls panel */}
        <div
          className="w-80 p-4 border-l flex flex-col gap-4 overflow-y-auto"
          style={{ backgroundColor: 'var(--color-paper)', borderColor: 'var(--color-rule)' }}
        >
          <h3
            className="text-base font-bold"
            style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-display)' }}
          >
            Matrix Controls
          </h3>

          {/* Presets */}
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(PRESETS).map(([key, vals]) => {
              const isActive = JSON.stringify(vals) === JSON.stringify(matrix);
              return (
                <button
                  key={key}
                  onClick={() => setMatrix([...vals])}
                  className="px-2 py-1.5 text-xs font-medium rounded-lg transition-all duration-150"
                  style={isActive
                    ? { backgroundColor: 'var(--color-accent)', color: 'var(--color-paper)' }
                    : {
                        backgroundColor: 'var(--color-paper-2)',
                        color: 'var(--color-muted)',
                        border: '1px solid var(--color-rule)',
                      }}
                  onMouseEnter={e => {
                    if (!isActive) e.currentTarget.style.backgroundColor = 'var(--color-paper-3)';
                  }}
                  onMouseLeave={e => {
                    if (!isActive) e.currentTarget.style.backgroundColor = 'var(--color-paper-2)';
                  }}
                >
                  {key}
                </button>
              );
            })}
          </div>

          {/* Matrix display */}
          <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--color-paper-2)', border: '1px solid var(--color-rule)' }}>
            <div
              className="flex items-center justify-center gap-4 text-2xl font-bold"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-ink)' }}
            >
              <span>[</span>
              <span style={{ color: 'oklch(52% 0.16 25)' }}>{a.toFixed(1)}</span>
              <span style={{ color: 'oklch(52% 0.16 25)' }}>{b.toFixed(1)}</span>
              <span style={{ color: 'var(--color-muted)' }}>;</span>
              <span style={{ color: 'oklch(52% 0.16 155)' }}>{c.toFixed(1)}</span>
              <span style={{ color: 'oklch(52% 0.16 155)' }}>{d.toFixed(1)}</span>
              <span>]</span>
            </div>
          </div>

          {/* Sliders */}
          <div className="space-y-3">
            {[
              { label: 'a (i-hat x)', value: matrix[0], idx: 0, col: 'oklch(52% 0.16 25)' },
              { label: 'b (j-hat x)', value: matrix[1], idx: 1, col: 'oklch(52% 0.16 25)' },
              { label: 'c (i-hat y)', value: matrix[2], idx: 2, col: 'oklch(52% 0.16 155)' },
              { label: 'd (j-hat y)', value: matrix[3], idx: 3, col: 'oklch(52% 0.16 155)' },
            ].map(({ label, value, idx, col }) => (
              <div key={label}>
                <label
                  className="text-xs mb-1.5 block"
                  style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}
                >
                  {label}
                </label>
                <input
                  type="range"
                  min={-3}
                  max={3}
                  step={0.1}
                  value={value}
                  onChange={(e) => {
                    const m = [...matrix];
                    m[idx] = parseFloat(e.target.value);
                    setMatrix(m);
                  }}
                  className="w-full"
                  style={{
                    accentColor: col,
                    cursor: 'pointer',
                  }}
                />
              </div>
            ))}
          </div>

          {/* Determinant */}
          <div
            className="p-4 rounded-xl"
            style={determinant >= 0
              ? { backgroundColor: 'rgba(75,180,140,0.10)' }
              : { backgroundColor: 'rgba(220,75,55,0.08)' }}
          >
            <div
              className="text-xs mb-1 font-medium"
              style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}
            >
              Determinant
            </div>
            <div
              className="text-2xl font-bold mb-1"
              style={{ fontFamily: 'var(--font-mono)', color: determinant >= 0 ? 'oklch(52% 0.16 155)' : 'oklch(52% 0.16 25)' }}
            >
              det = {determinant.toFixed(2)}
            </div>
            <div className="text-xs" style={{ color: 'var(--color-muted)', lineHeight: 'var(--lh-relaxed)' }}>
              {Math.abs(determinant) < 0.01
                ? 'Area collapses to 0!'
                : determinant < 0
                  ? 'Orientation flipped'
                  : `Area scaled by ${Math.abs(determinant).toFixed(2)}×`}
            </div>
          </div>

          {/* Basis vector reference */}
          <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--color-paper-2)', border: '1px solid var(--color-rule)' }}>
            <div className="text-xs font-medium mb-2" style={{ color: 'var(--color-neutral)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Basis Vectors
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'oklch(52% 0.16 25)' }} />
                <span className="text-xs font-mono" style={{ color: 'var(--color-muted)' }}>i-hat → [{a.toFixed(2)}, {c.toFixed(2)}]</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'oklch(52% 0.16 155)' }} />
                <span className="text-xs font-mono" style={{ color: 'var(--color-muted)' }}>j-hat → [{b.toFixed(2)}, {d.toFixed(2)}]</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Game Mode */}
      {showGame && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="p-4"
        >
          <GameWrapper
            title="Transform Match"
            instructions="Given a before and after image, reconstruct the transformation matrix"
            maxAttempts={5}
            rounds={5}
            scoring="accuracy"
          >
            {(props) => <TransformMatch {...props} />}
          </GameWrapper>
        </motion.div>
      )}

      {/* Hint */}
      <div
        className="px-6 py-2 text-sm flex items-center justify-center gap-4 border-t"
        style={{
          backgroundColor: 'var(--color-paper-2)',
          borderColor: 'var(--color-rule)',
          color: 'var(--color-muted)',
        }}
      >
        <span>{steps[currentStep]?.desc}</span>
        <CompletionToggle moduleId={2} />
      </div>
    </div>
  );
}