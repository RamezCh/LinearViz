import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { create } from 'zustand';
import { Button, ButtonGroup } from '../../components/UI/Button';
import { Card } from '../../components/UI/Card';
import { useStore } from '../../store/useStore';
import CompletionToggle from '../../components/UI/CompletionToggle';
import { magnitude, add, scalarMultiply } from '../../utils/linalg';
import InTheSpanGame from '../../games/InTheSpan';
import VectorTarget from '../../games/VectorTarget';
import GameWrapper from '../../components/MiniGame/GameWrapper';

const VECTOR_COLORS = {
  v1: 'oklch(50% 0.12 235)',
  v2: 'oklch(50% 0.12 270)',
  v3: 'oklch(65% 0.10 70)',
  result: 'oklch(52% 0.16 155)',
};

const guidedStepsData = [
  {
    id: 'vs1',
    title: 'What is a Linear Combination?',
    description: 'A linear combination of vectors v₁ and v₂ is a sum of scalar multiples: c₁v₁ + c₂v₂. Drag the sliders to see how c₁ and c₂ affect the result.',
  },
  {
    id: 'vs2',
    title: 'Span of Vectors',
    description: 'The span of {v₁, v₂} is the set of ALL linear combinations. The animated sweep shows many vectors at different c values, filling either a plane (independent) or a line (dependent).',
  },
  {
    id: 'vs3',
    title: 'Linear Independence Test',
    description: 'Vectors are linearly independent if c₁v₁ + c₂v₂ = 0 only when c₁ = c₂ = 0. Drag v₂ to be parallel to v₁ and see the indicator change.',
  },
  {
    id: 'vs4',
    title: 'Basis and Dimension',
    description: 'A basis is a set of independent vectors that span the space. In R², any 2 independent vectors form a basis. Add a 3rd vector to explore!',
  },
];

const useVectorSpacesStore = create((set) => ({
  vectors: { v1: [3, 1], v2: [1, 2], v3: [0, 0] },
  c1: 1,
  c2: 1,
  showV3: false,
  mode: 'guided',
  currentStep: 0,
  showSpan: true,
  showComponents: true,
  showGame: false,
  gameScore: 0,

  setVector: (name, value) => set((state) => ({ vectors: { ...state.vectors, [name]: value } })),
  setC1: (value) => set({ c1: value }),
  setC2: (value) => set({ c2: value }),
  setMode: (mode) => set({ mode }),
  setCurrentStep: (step) => set({ currentStep: step }),
  toggleV3: () => set((state) => ({ showV3: !state.showV3 })),
  toggleSpan: () => set((state) => ({ showSpan: !state.showSpan })),
  toggleComponents: () => set((state) => ({ showComponents: !state.showComponents })),
  toggleGame: () => set((state) => ({ showGame: !state.showGame })),
  addGameScore: (points) => set((state) => ({ gameScore: state.gameScore + points })),
  reset: () => set({ vectors: { v1: [3, 1], v2: [1, 2], v3: [0, 0] }, c1: 1, c2: 1, showV3: false, currentStep: 0, gameScore: 0 }),
}));

function CanvasSection() {
  const { vectors, setVector, c1, c2, setC1, setC2, showV3, showSpan, showComponents, currentStep, mode } = useVectorSpacesStore();
  const v1 = vectors.v1;
  const v2 = vectors.v2;
  const v3 = vectors.v3;

  const resultVector = useMemo(() => add(scalarMultiply(c1, v1), scalarMultiply(c2, v2)), [v1, v2, c1, c2]);
  const isLinearlyIndependent = useMemo(() => Math.abs(v1[0] * v2[1] - v1[1] * v2[0]) > 0.1, [v1, v2]);

  const spanVectors = useMemo(() => {
    if (!showSpan) return [];
    const vecs = [];
    const steps = 20;
    for (let i = 0; i <= steps; i++) {
      for (let j = 0; j <= steps; j++) {
        const t1 = (i / steps) * 2 - 1;
        const t2 = (j / steps) * 2 - 1;
        if (Math.abs(t1) < 0.05 || Math.abs(t2) < 0.05) {
          const tip = add(scalarMultiply(t1, v1), scalarMultiply(t2, v2));
          vecs.push({ origin: [0, 0], tip, t1, t2 });
        }
      }
    }
    return vecs;
  }, [v1, v2, showSpan]);

  const [dragging, setDragging] = useState(null);
  const [dragStart, setDragStart] = useState(null);

  const handleMouseDown = useCallback((id) => {
    setDragging(id);
    setDragStart({ x: 0, y: 0 });
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!dragging) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left - rect.width / 2) / 25).toFixed(1);
    const y = (-(e.clientY - rect.top - rect.height / 2) / 25).toFixed(1);
    setVector(dragging, [parseFloat(x), parseFloat(y)]);
  }, [dragging, setVector]);

  const handleMouseUp = useCallback(() => setDragging(null), []);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-3 border-b" style={{ borderColor: 'var(--color-rule)', backgroundColor: 'var(--color-paper)' }}>
        <div className="flex items-center gap-2">
          <ButtonGroup size="sm">
            <Button variant={mode === 'guided' && currentStep >= 0 ? 'primary' : 'ghost'} size="sm">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: VECTOR_COLORS.v1 }} />
              v₁
            </Button>
            <Button variant={mode === 'guided' && currentStep >= 1 ? 'primary' : 'ghost'} size="sm">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: VECTOR_COLORS.v2 }} />
              v₂
            </Button>
            {showV3 && (
              <Button variant="ghost" size="sm">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: VECTOR_COLORS.v3 }} />
                v₃
              </Button>
            )}
          </ButtonGroup>
        </div>
        <div className="flex items-center gap-3 text-sm" style={{ color: 'var(--color-muted)' }}>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={showComponents} onChange={() => useVectorSpacesStore.getState().toggleComponents()}
              className="w-4 h-4 rounded" style={{ accentColor: 'var(--color-accent)' }} />
            Components
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={showSpan} onChange={() => useVectorSpacesStore.getState().toggleSpan()}
              className="w-4 h-4 rounded" style={{ accentColor: 'var(--color-accent)' }} />
            Span
          </label>
        </div>
      </div>

      <div
        className="flex-1 min-h-0 relative cursor-crosshair"
        style={{ backgroundColor: 'var(--color-paper-2)' }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg width="100%" height="100%" className="absolute inset-0">
          <defs>
            <pattern id="vs-grid" width="25" height="25" patternUnits="userSpaceOnUse">
              <path d="M 25 0 L 0 0 0 25" fill="none" stroke="var(--color-rule)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#vs-grid)" />
          <line x1="50%" y1="0" x2="50%" y2="100%" stroke="var(--color-ink-2)" strokeWidth="1" />
          <line x1="0" y1="50%" x2="100%" y2="50%" stroke="var(--color-ink-2)" strokeWidth="1" />

          {showSpan && spanVectors.length > 0 && (
            <g>
              {isLinearlyIndependent ? (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 0.3 }}>
                  {spanVectors.map((v, i) => (
                    <motion.line
                      key={i}
                      x1="50%" y1="50%"
                      x2={`calc(50% + ${v.tip[0] * 25}px)`}
                      y2={`calc(50% - ${v.tip[1] * 25}px)`}
                      stroke="var(--color-muted)"
                      strokeWidth="1"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.25 }}
                      transition={{ duration: 0.2, delay: i * 0.002 }}
                    />
                  ))}
                </motion.g>
              ) : (
                <line
                  x1={`calc(50% - ${v1[0] * 50}px)`} y1={`calc(50% + ${v1[1] * 50}px)`}
                  x2={`calc(50% + ${v1[0] * 50}px)`} y2={`calc(50% - ${v1[1] * 50}px)`}
                  stroke={VECTOR_COLORS.v2}
                  strokeWidth="3"
                  strokeDasharray="8 4"
                  opacity="0.4"
                />
              )}
            </g>
          )}

          {/* v1 */}
          <g onMouseDown={() => handleMouseDown('v1')} style={{ cursor: dragging === 'v1' ? 'grabbing' : 'grab' }}>
            <line x1="50%" y1="50%"
              x2={`calc(50% + ${v1[0] * 25}px)`}
              y2={`calc(50% - ${v1[1] * 25}px)`}
              stroke={VECTOR_COLORS.v1} strokeWidth="2.5" strokeLinecap="round" />
            <circle cx={`calc(50% + ${v1[0] * 25}px)`} cy={`calc(50% - ${v1[1] * 25}px)`}
              r="8" fill={VECTOR_COLORS.v1} stroke="var(--color-paper)" strokeWidth="2" />
            <text
              x={`calc(50% + ${v1[0] * 25 + 12}px)`}
              y={`calc(50% - ${v1[1] * 25}px - 4)`}
              fill={VECTOR_COLORS.v1}
              fontSize="12" fontWeight="700" fontFamily="var(--font-mono)"
            >v₁</text>
          </g>

          {/* v2 */}
          <g onMouseDown={() => handleMouseDown('v2')} style={{ cursor: dragging === 'v2' ? 'grabbing' : 'grab' }}>
            <line x1="50%" y1="50%"
              x2={`calc(50% + ${v2[0] * 25}px)`}
              y2={`calc(50% - ${v2[1] * 25}px)`}
              stroke={VECTOR_COLORS.v2} strokeWidth="2.5" strokeLinecap="round" />
            <circle cx={`calc(50% + ${v2[0] * 25}px)`} cy={`calc(50% - ${v2[1] * 25}px)`}
              r="8" fill={VECTOR_COLORS.v2} stroke="var(--color-paper)" strokeWidth="2" />
            <text
              x={`calc(50% + ${v2[0] * 25 + 12}px)`}
              y={`calc(50% - ${v2[1] * 25}px - 4)`}
              fill={VECTOR_COLORS.v2}
              fontSize="12" fontWeight="700" fontFamily="var(--font-mono)"
            >v₂</text>
          </g>

          {/* v3 */}
          {showV3 && magnitude(v3) > 0.1 && (
            <g>
              <line x1="50%" y1="50%"
                x2={`calc(50% + ${v3[0] * 25}px)`}
                y2={`calc(50% - ${v3[1] * 25}px)`}
                stroke={VECTOR_COLORS.v3} strokeWidth="2.5" strokeLinecap="round" />
              <circle cx={`calc(50% + ${v3[0] * 25}px)`} cy={`calc(50% - ${v3[1] * 25}px)`}
                r="8" fill={VECTOR_COLORS.v3} stroke="var(--color-paper)" strokeWidth="2" />
              <text
                x={`calc(50% + ${v3[0] * 25 + 12}px)`}
                y={`calc(50% - ${v3[1] * 25}px - 4)`}
                fill={VECTOR_COLORS.v3}
                fontSize="12" fontWeight="700" fontFamily="var(--font-mono)"
              >v₃</text>
            </g>
          )}

          {/* Result */}
          <motion.g initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
            <line x1="50%" y1="50%"
              x2={`calc(50% + ${scalarMultiply(c1, v1)[0] * 25}px)`}
              y2={`calc(50% - ${scalarMultiply(c1, v1)[1] * 25}px)`}
              stroke={VECTOR_COLORS.v1} strokeWidth="2" strokeDasharray="4 3" opacity="0.6" />
            <line
              x1={`calc(50% + ${scalarMultiply(c1, v1)[0] * 25}px)`}
              y1={`calc(50% - ${scalarMultiply(c1, v1)[1] * 25}px)`}
              x2={`calc(50% + ${resultVector[0] * 25}px)`}
              y2={`calc(50% - ${resultVector[1] * 25}px)`}
              stroke={VECTOR_COLORS.v2} strokeWidth="2" strokeDasharray="4 3" opacity="0.6" />
            <circle cx={`calc(50% + ${resultVector[0] * 25}px)`} cy={`calc(50% - ${resultVector[1] * 25}px)`}
              r="9" fill={VECTOR_COLORS.result} stroke="var(--color-paper)" strokeWidth="2.5" />
          </motion.g>

          {/* Status badge */}
          <g transform="translate(12, 12)">
            <rect x="0" y="0" width="180" height="52" rx="8"
              fill={isLinearlyIndependent ? 'oklch(52% 0.16 155)' : 'oklch(50% 0.12 270)'}
              fillOpacity="0.9" />
            <text x="90" y="18" textAnchor="middle" fill="var(--color-paper)" fontSize="10" fontWeight="600">
              {isLinearlyIndependent ? '✓ Linearly Independent' : '✗ Linearly Dependent'}
            </text>
            <text x="90" y="36" textAnchor="middle" fill="var(--color-paper)" fontSize="9" fillOpacity="0.8">
              {isLinearlyIndependent ? 'Span = ℝ² (full plane)' : 'Span = line through origin'}
            </text>
          </g>
        </svg>
      </div>

      <div className="p-4 border-t" style={{ borderColor: 'var(--color-rule)', backgroundColor: 'var(--color-paper)' }}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs mb-1.5 block" style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>c₁</label>
            <input type="range" min={-3} max={3} step={0.1} value={c1}
              onChange={(e) => setC1(Math.round(parseFloat(e.target.value) * 10) / 10)}
              className="w-full" style={{ accentColor: VECTOR_COLORS.v1, cursor: 'pointer' }} />
            <span className="text-xs" style={{ color: VECTOR_COLORS.v1, fontFamily: 'var(--font-mono)' }}>{c1.toFixed(1)}</span>
          </div>
          <div>
            <label className="text-xs mb-1.5 block" style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>c₂</label>
            <input type="range" min={-3} max={3} step={0.1} value={c2}
              onChange={(e) => setC2(Math.round(parseFloat(e.target.value) * 10) / 10)}
              className="w-full" style={{ accentColor: VECTOR_COLORS.v2, cursor: 'pointer' }} />
            <span className="text-xs" style={{ color: VECTOR_COLORS.v2, fontFamily: 'var(--font-mono)' }}>{c2.toFixed(1)}</span>
          </div>
        </div>
        <div className="flex items-center justify-between mt-3">
          <span className="text-sm" style={{ color: 'var(--color-muted)' }}>
            Result: <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: VECTOR_COLORS.result }}>
              ({resultVector[0].toFixed(2)}, {resultVector[1].toFixed(2)})
            </span>
          </span>
          <Button variant={showV3 ? 'secondary' : 'outline'} size="sm"
            onClick={() => useVectorSpacesStore.getState().toggleV3()}>
            {showV3 ? 'Remove 3rd Vector' : 'Add 3rd Vector'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function FormulaSection() {
  const { vectors, c1, c2, showV3 } = useVectorSpacesStore();
  const v1 = vectors.v1;
  const v2 = vectors.v2;
  const v3 = vectors.v3;
  const resultVector = useMemo(() => add(scalarMultiply(c1, v1), scalarMultiply(c2, v2)), [v1, v2, c1, c2]);
  const crossProduct = v1[0] * v2[1] - v1[1] * v2[0];
  const isIndependent = Math.abs(crossProduct) > 0.1;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--color-rule)', backgroundColor: 'var(--color-paper)' }}>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-display)' }}>
          Vector Space Formulas
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <Card variant="outline" className="p-4">
          <h4 className="font-semibold mb-2" style={{ color: 'var(--color-ink-2)' }}>Linear Combination</h4>
          <code className="text-sm font-mono block p-3 rounded-lg mb-3 overflow-x-auto"
            style={{ backgroundColor: 'var(--color-paper-2)', fontFamily: 'var(--font-mono)', color: 'var(--color-ink)' }}>
            v = c₁·v₁ + c₂·v₂
          </code>
          <div className="mt-2 space-y-2">
            <div className="flex items-center justify-between p-2 rounded-lg" style={{ backgroundColor: 'var(--color-paper-2)' }}>
              <span className="text-sm" style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
                {c1.toFixed(1)} × ({v1[0].toFixed(1)}, {v1[1].toFixed(1)})
              </span>
              <span style={{ color: 'var(--color-muted)' }}>+</span>
              <span className="text-sm" style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
                {c2.toFixed(1)} × ({v2[0].toFixed(1)}, {v2[1].toFixed(1)})
              </span>
            </div>
            <div className="p-3 rounded-lg text-center" style={{ backgroundColor: 'rgba(75,180,140,0.08)', border: '1px solid oklch(52% 0.16 155)' }}>
              <span className="text-xs" style={{ color: 'oklch(52% 0.16 155)' }}>Result</span>
              <p className="text-xl font-mono font-bold" style={{ fontFamily: 'var(--font-mono)', color: 'oklch(52% 0.16 155)' }}>
                ({resultVector[0].toFixed(2)}, {resultVector[1].toFixed(2)})
              </p>
            </div>
          </div>
        </Card>

        <Card variant="outline" className="p-4">
          <h4 className="font-semibold mb-2" style={{ color: 'var(--color-ink-2)' }}>Span Definition</h4>
<code className="text-sm font-mono block p-3 rounded-lg mb-3 overflow-x-auto"
              style={{ backgroundColor: 'var(--color-paper-2)', fontFamily: 'var(--font-mono)', color: 'var(--color-ink)' }}>
              {'Span{v\u2081, v\u2082} = {c\u2081v\u2081 + c\u2082v\u2082 | c\u2081, c\u2082 \u2208 \u211D}'}
            </code>
          <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(75,160,195,0.06)' }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: isIndependent ? 'oklch(52% 0.16 155)' : 'oklch(50% 0.12 270)' }} />
              <span className="text-sm font-semibold" style={{ color: 'var(--color-ink-2)' }}>
                {isIndependent ? 'Spans ℝ² (full plane)' : 'Spans a line'}
              </span>
            </div>
            <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
              {isIndependent ? 'v₁ and v₂ point in different directions, filling the entire 2D space.' : 'v₁ and v₂ are parallel, so their span is limited to a single line.'}
            </p>
          </div>
        </Card>

        <Card variant="outline" className="p-4">
          <h4 className="font-semibold mb-2" style={{ color: 'var(--color-ink-2)' }}>Linear Independence</h4>
          <code className="text-sm font-mono block p-3 rounded-lg mb-3 overflow-x-auto"
            style={{ backgroundColor: 'var(--color-paper-2)', fontFamily: 'var(--font-mono)', color: 'var(--color-ink)' }}>
            c₁·v₁ + c₂·v₂ = 0 only if c₁ = c₂ = 0
          </code>
          <div className="space-y-2">
            <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--color-paper-2)' }}>
              <p className="text-xs mb-1" style={{ color: 'var(--color-muted)' }}>Determinant (cross product)</p>
              <p className="text-lg font-mono font-bold" style={{ fontFamily: 'var(--font-mono)', color: isIndependent ? 'oklch(52% 0.16 155)' : 'oklch(52% 0.16 25)' }}>
                det = {crossProduct.toFixed(3)}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
                {isIndependent ? 'Non-zero → Independent ✓' : 'Zero → Dependent (parallel) ✗'}
              </p>
            </div>
            {isIndependent && (
              <div className="p-2 rounded-lg text-center" style={{ backgroundColor: 'rgba(75,180,140,0.08)' }}>
                <p className="text-sm font-medium" style={{ color: 'oklch(52% 0.16 155)' }}>
                  These vectors form a basis for ℝ²
                </p>
              </div>
            )}
          </div>
        </Card>

        <Card variant="outline" className="p-4">
          <h4 className="font-semibold mb-2" style={{ color: 'var(--color-ink-2)' }}>Basis & Dimension</h4>
          <code className="text-sm font-mono block p-3 rounded-lg mb-3 overflow-x-auto"
            style={{ backgroundColor: 'var(--color-paper-2)', fontFamily: 'var(--font-mono)', color: 'var(--color-ink)' }}>
            Basis = linearly independent spanning set
          </code>
          <div className="space-y-3">
            <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(75,160,195,0.06)' }}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium" style={{ color: 'var(--color-accent)' }}>Standard Basis</span>
                <span className="text-lg font-mono font-bold" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-accent)' }}>ℝ² has dim = 2</span>
              </div>
              <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
                {'ℝ² = Span{v₁, v₂} where v₁ = (1,0), v₂ = (0,1)'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded-lg text-center" style={{ backgroundColor: 'var(--color-paper-2)' }}>
                <p className="text-xs" style={{ color: 'var(--color-muted)' }}>Basis Vectors</p>
                <p className="text-lg font-mono font-bold" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-ink)' }}>2</p>
              </div>
              <div className="p-2 rounded-lg text-center" style={{ backgroundColor: 'var(--color-paper-2)' }}>
                <p className="text-xs" style={{ color: 'var(--color-muted)' }}>Dimension</p>
                <p className="text-lg font-mono font-bold" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-ink)' }}>2</p>
              </div>
            </div>
          </div>
        </Card>

        {showV3 && (
          <Card variant="outline" className="p-4">
            <h4 className="font-semibold mb-2" style={{ color: 'var(--color-ink-2)' }}>Column Space & Null Space</h4>
            <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(200,155,50,0.08)' }}>
              <p className="text-xs mb-1" style={{ color: 'oklch(65% 0.10 70)' }}>v₃ = ({v3[0].toFixed(1)}, {v3[1].toFixed(1)})</p>
              <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                {magnitude(v3) > 0.1
                  ? isIndependent ? 'Adding v₃ creates redundancy (still span ℝ²)' : 'v₃ is collinear with existing span'
                  : 'v₃ is zero vector (adds no new direction)'}
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

function GuidedStepper() {
  const { currentStep, setCurrentStep, mode, setMode } = useVectorSpacesStore();
  const { setCurrentStep: markComplete } = useStore();
  const isCompleted = currentStep >= steps.length;
  const steps = guidedStepsData;

  const handleNext = () => { if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1); };
  const handlePrevious = () => { if (currentStep > 0) setCurrentStep(currentStep - 1); };
  const handleComplete = () => { setMode('sandbox'); useStore.getState().markModuleComplete?.(6); };

  return (
    <div className="space-y-4 p-4 border-t" style={{ borderColor: 'var(--color-rule)', backgroundColor: 'var(--color-paper)' }}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--color-ink-2)' }}>Guided Steps</h3>
        <Button variant={mode === 'guided' ? 'primary' : 'ghost'} size="sm"
          onClick={() => setMode(mode === 'guided' ? 'sandbox' : 'guided')}>
          {mode === 'guided' ? 'Guided' : 'Sandbox'}
        </Button>
      </div>
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {steps.map((step, index) => (
          <button
            key={step.id}
            onClick={() => mode === 'guided' && setCurrentStep(index)}
            disabled={mode === 'sandbox'}
            className="relative flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all"
            style={index === currentStep && mode === 'guided'
              ? { backgroundColor: 'var(--color-accent)', color: 'var(--color-paper)', boxShadow: `0 0 0 4px rgba(75,160,195,0.25)` }
              : index < currentStep
                ? { backgroundColor: 'oklch(52% 0.16 155)', color: 'var(--color-paper)', cursor: 'default' }
                : { backgroundColor: 'var(--color-rule)', color: 'var(--color-muted)', cursor: mode === 'sandbox' ? 'not-allowed' : 'pointer' }}
          >
            {index < currentStep ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : index + 1}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        {mode === 'guided' && steps[currentStep] && (
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="p-4 rounded-xl"
            style={{ backgroundColor: 'rgba(75,160,195,0.06)', border: '1px solid rgba(75,160,195,0.2)' }}
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-paper)' }}>
                {currentStep + 1}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold mb-1" style={{ color: 'var(--color-ink-2)' }}>{steps[currentStep].title}</h4>
                <p className="text-sm" style={{ color: 'var(--color-muted)' }}>{steps[currentStep].description}</p>
              </div>
            </div>
            <div className="flex justify-between mt-4">
              <Button variant="ghost" size="sm" onClick={handlePrevious} disabled={currentStep === 0}>Previous</Button>
              {currentStep < steps.length - 1 ? (
                <Button variant="primary" size="sm" onClick={handleNext}>Next Step</Button>
              ) : (
                <Button variant="success" size="sm" onClick={handleComplete}>
                  {isCompleted ? 'Continue to Sandbox' : 'Complete & Continue'}
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {mode === 'sandbox' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="p-4 rounded-xl"
          style={{ backgroundColor: 'rgba(75,180,140,0.08)', border: '1px solid rgba(75,180,140,0.2)' }}>
          <p className="text-sm" style={{ color: 'oklch(52% 0.16 155)' }}>
            <span className="font-semibold">Sandbox Mode:</span> Drag vectors, adjust scalars, and explore span and independence on your own.
          </p>
        </motion.div>
      )}
    </div>
  );
}

function MiniGameSection() {
  const { showGame, toggleGame, gameScore, addGameScore } = useVectorSpacesStore();
  const [attempts, setAttempts] = useState(0);
  const [activeGame, setActiveGame] = useState('span');
  const handleGameSubmit = useCallback((points) => { setAttempts((prev) => prev + 1); addGameScore(points); }, [addGameScore]);

  if (!showGame) {
    return (
      <div className="p-4 border-t" style={{ borderColor: 'var(--color-rule)', backgroundColor: 'var(--color-paper)' }}>
        <Button variant="outline" fullWidth onClick={() => { setActiveGame('span'); toggleGame(); }}>
          <GameControllerIcon /> Play Mini-Games
        </Button>
        <p className="text-xs text-center mt-2" style={{ color: 'var(--color-muted)' }}>
          Score: {gameScore} | Attempts: {attempts}
        </p>
      </div>
    );
  }
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="border-t overflow-hidden"
      style={{ borderColor: 'var(--color-rule)', backgroundColor: 'var(--color-paper)' }}>
      <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--color-rule)' }}>
        <div className="flex items-center gap-2">
          <Button
            variant={activeGame === 'span' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setActiveGame('span')}
          >
            Span Game
          </Button>
          <Button
            variant={activeGame === 'target' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setActiveGame('target')}
          >
            Vector Target
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm" style={{ color: 'var(--color-muted)' }}>
            Score: <span style={{ fontWeight: 700, color: 'oklch(52% 0.16 155)' }}>{gameScore}</span>
          </span>
          <Button variant="ghost" size="sm" onClick={toggleGame}>Close</Button>
        </div>
      </div>
      <div className="p-4 max-h-96 overflow-y-auto">
        {activeGame === 'span' ? (
          <GameWrapper
            title="In The Span"
            instructions="Determine if the target vector is in the span of the basis vectors"
            maxAttempts={5}
            rounds={5}
            scoring="accuracy"
          >
            {(props) => <InTheSpanGame onSubmit={handleGameSubmit} attempts={props.attempts} maxAttempts={props.maxAttempts} score={props.score} difficulty={0} />}
          </GameWrapper>
        ) : (
          <GameWrapper
            title="Vector Target"
            instructions="Use linear combinations of vectors to reach the target point"
            maxAttempts={5}
            rounds={5}
            scoring="accuracy"
          >
            {(props) => <VectorTarget {...props} difficulty={0} />}
          </GameWrapper>
        )}
      </div>
    </motion.div>
  );
}

function GameControllerIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="6" width="20" height="12" rx="3" />
      <circle cx="8" cy="12" r="2" />
      <circle cx="16" cy="10" r="1.5" fill="currentColor" />
      <circle cx="18" cy="12" r="1.5" fill="currentColor" />
      <circle cx="16" cy="14" r="1.5" fill="currentColor" />
    </svg>
  );
}

export default function VectorSpacesModule() {
  const { currentModule } = useStore();
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
        <div className="w-full lg:w-1/2 h-1/2 lg:h-full border-r flex flex-col" style={{ borderColor: 'var(--color-rule)' }}>
          <CanvasSection />
        </div>
        <div className="w-full lg:w-1/2 h-1/2 lg:h-full flex flex-col">
          <div className="flex-1 min-h-0 overflow-hidden">
            <FormulaSection />
          </div>
          <div className="border-t" style={{ borderColor: 'var(--color-rule)' }}>
            <GuidedStepper />
            <MiniGameSection />
          </div>
        </div>
      </div>

      <div
        className="px-6 py-2 text-sm flex items-center justify-center gap-4 border-t"
        style={{
          backgroundColor: 'var(--color-paper-2)',
          borderColor: 'var(--color-rule)',
          color: 'var(--color-muted)',
        }}
      >
        <span>Drag vectors to explore span</span>
        <span>•</span>
        <CompletionToggle moduleId={6} />
      </div>
    </div>
  );
}