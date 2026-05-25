import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { create } from 'zustand';
import { Button } from '../../components/UI/Button';
import { Card } from '../../components/UI/Card';
import { useStore } from '../../store/useStore';
import CompletionToggle from '../../components/UI/CompletionToggle';
import { magnitude, add, scalarMultiply } from '../../utils/linalg';

const VECTOR_COLORS = {
  v1: 'oklch(50% 0.12 235)',
  v2: 'oklch(52% 0.16 155)',
  v3: 'oklch(65% 0.10 70)',
  result: 'oklch(52% 0.16 155)',
};

const useVectorSpacesStore = create((set) => ({
  vectors: { v1: [3, 1], v2: [1, 2], v3: [0, 0] },
  c1: 1,
  c2: 1,
  showV3: false,
  currentStep: 0,
  showSpan: true,
  showComponents: true,
  showGame: false,
  setVector: (name, value) => set((state) => ({ vectors: { ...state.vectors, [name]: value } })),
  setC1: (value) => set({ c1: value }),
  setC2: (value) => set({ c2: value }),
  setCurrentStep: (step) => set({ currentStep: step }),
  toggleV3: () => set((state) => ({ showV3: !state.showV3 })),
  toggleSpan: () => set((state) => ({ showSpan: !state.showSpan })),
  toggleComponents: () => set((state) => ({ showComponents: !state.showComponents })),
  toggleGame: () => set((state) => ({ showGame: !state.showGame })),
  reset: () => set({ vectors: { v1: [3, 1], v2: [1, 2], v3: [0, 0] }, c1: 1, c2: 1, showV3: false, currentStep: 0, showGame: false }),
}));

const steps = [
  {
    title: 'What is a Linear Combination?',
    concept: 'A linear combination of vectors v₁ and v₂ is a sum of scalar multiples: c₁v₁ + c₂v₂. Drag the sliders to see how c₁ and c₂ affect the result.',
    hint: 'Use the sliders below the canvas to change c₁ and c₂ values.',
    action: 'Adjust the scalar sliders',
  },
  {
    title: 'Span of Vectors',
    concept: 'The span of {v₁, v₂} is the set of ALL linear combinations. The grid shows many vectors at different c values, filling either a plane (independent) or a line (dependent).',
    hint: 'Toggle the "Span" checkbox to show/hide the span visualization.',
    action: 'Toggle Span visualization',
  },
  {
    title: 'Linear Independence Test',
    concept: 'Vectors are linearly independent if c₁v₁ + c₂v₂ = 0 only when c₁ = c₂ = 0. Drag v₂ to be parallel to v₁ and see the indicator change.',
    hint: 'Drag v₂ to be parallel to v₁ — the badge should change.',
    action: 'Drag v₂ to be parallel to v₁',
  },
  {
    title: 'Basis and Dimension',
    concept: 'A basis is a set of independent vectors that span the space. In R², any 2 independent vectors form a basis. Add a 3rd vector to explore!',
    hint: 'Click "Add 3rd Vector" to explore redundancy.',
    action: 'Add a 3rd vector',
  },
];

export default function VectorSpacesModule() {
  const { vectors, c1, c2, showV3, showSpan, showComponents, currentStep, showGame, setVector, setC1, setC2, setCurrentStep, toggleV3, toggleSpan, toggleComponents, toggleGame, reset } = useVectorSpacesStore();
  const v1 = vectors.v1;
  const v2 = vectors.v2;
  const v3 = vectors.v3;

  const resultVector = useMemo(() => add(scalarMultiply(c1, v1), scalarMultiply(c2, v2)), [v1, v2, c1, c2]);
  const isLinearlyIndependent = useMemo(() => Math.abs(v1[0] * v2[1] - v1[1] * v2[0]) > 0.1, [v1, v2]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Top Control Bar */}
      <div
        className="flex items-center gap-2 px-3 py-2 border-b flex-shrink-0 flex-wrap"
        style={{ backgroundColor: 'var(--color-paper)', borderColor: 'var(--color-rule)' }}
      >
        <div className="flex items-center gap-2">
          <Button variant={showSpan ? 'primary' : 'ghost'} size="sm" onClick={toggleSpan}>
            Span
          </Button>
          <Button variant={showComponents ? 'primary' : 'ghost'} size="sm" onClick={toggleComponents}>
            Components
          </Button>
          <Button variant={showV3 ? 'primary' : 'ghost'} size="sm" onClick={toggleV3}>
            {showV3 ? 'Hide v₃' : 'Add v₃'}
          </Button>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          <Button
            variant={showGame ? 'primary' : 'ghost'}
            size="sm"
            onClick={toggleGame}
          >
            Mini-Game
          </Button>
          <Button variant="ghost" size="sm" onClick={reset}>
            Reset
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
                {steps[currentStep].concept}
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
          {/* Canvas */}
          <div className="flex-1 min-h-0 min-w-0 relative">
            {showGame ? (
              <div className="w-full h-full flex items-center justify-center p-4" style={{ backgroundColor: 'var(--color-paper-2)' }}>
                <Card variant="elevated" className="p-6 text-center">
                  <p style={{ color: 'var(--color-muted)' }}>Mini-game would render here</p>
                </Card>
              </div>
            ) : (
              <div
                className="w-full h-full"
                style={{ backgroundColor: 'var(--color-paper)' }}
              >
                <svg width="100%" height="100%" viewBox="-6 -6 12 12" preserveAspectRatio="xMidYMid meet">
                  {/* Grid */}
                  {Array.from({ length: 13 }).map((_, i) => (
                    <g key={i}>
                      <line x1={i - 6} y1="-6" x2={i - 6} y2="6" stroke="var(--color-rule)" strokeWidth="0.05" />
                      <line x1="-6" y1={i - 6} x2="6" y2={i - 6} stroke="var(--color-rule)" strokeWidth="0.05" />
                    </g>
                  ))}
                  {/* Axes */}
                  <line x1="-6" y1="0" x2="6" y2="0" stroke="var(--color-neutral)" strokeWidth="0.1" />
                  <line x1="0" y1="-6" x2="0" y2="6" stroke="var(--color-neutral)" strokeWidth="0.1" />

                  {/* v1 */}
                  <line x1="0" y1="0" x2={v1[0]} y2={-v1[1]} stroke={VECTOR_COLORS.v1} strokeWidth="0.1" strokeLinecap="round" />
                  <circle cx={v1[0]} cy={-v1[1]} r="0.15" fill={VECTOR_COLORS.v1} />
                  <text x={v1[0] + 0.3} y={-v1[1] - 0.2} fill={VECTOR_COLORS.v1} fontSize="0.3" fontWeight="700" fontFamily="var(--font-mono)">v₁</text>

                  {/* v2 */}
                  <line x1="0" y1="0" x2={v2[0]} y2={-v2[1]} stroke={VECTOR_COLORS.v2} strokeWidth="0.1" strokeLinecap="round" />
                  <circle cx={v2[0]} cy={-v2[1]} r="0.15" fill={VECTOR_COLORS.v2} />
                  <text x={v2[0] + 0.3} y={-v2[1] - 0.2} fill={VECTOR_COLORS.v2} fontSize="0.3" fontWeight="700" fontFamily="var(--font-mono)">v₂</text>

                  {/* v3 */}
                  {showV3 && magnitude(v3) > 0.1 && (
                    <>
                      <line x1="0" y1="0" x2={v3[0]} y2={-v3[1]} stroke={VECTOR_COLORS.v3} strokeWidth="0.1" strokeLinecap="round" />
                      <circle cx={v3[0]} cy={-v3[1]} r="0.15" fill={VECTOR_COLORS.v3} />
                      <text x={v3[0] + 0.3} y={-v3[1] - 0.2} fill={VECTOR_COLORS.v3} fontSize="0.3" fontWeight="700" fontFamily="var(--font-mono)">v₃</text>
                    </>
                  )}

                  {/* Result */}
                  <line x1="0" y1="0" x2={resultVector[0]} y2={-resultVector[1]} stroke={VECTOR_COLORS.result} strokeWidth="0.12" strokeLinecap="round" />
                  <circle cx={resultVector[0]} cy={-resultVector[1]} r="0.18" fill={VECTOR_COLORS.result} />
                  <text x={resultVector[0] + 0.3} y={-resultVector[1] - 0.2} fill={VECTOR_COLORS.result} fontSize="0.3" fontWeight="700" fontFamily="var(--font-mono)">c₁v₁+c₂v₂</text>

                  {/* Status badge */}
                  <g transform="translate(-5.5, 4.5)">
                    <rect x="0" y="0" width="3.5" height="1.2" rx="0.15"
                      fill={isLinearlyIndependent ? 'oklch(52% 0.16 155)' : 'oklch(50% 0.12 270)'}
                      fillOpacity="0.9" />
                    <text x="1.75" y="0.45" textAnchor="middle" fill="var(--color-paper)" fontSize="0.2" fontWeight="600">
                      {isLinearlyIndependent ? 'Independent' : 'Dependent'}
                    </text>
                    <text x="1.75" y="0.85" textAnchor="middle" fill="var(--color-paper)" fontSize="0.15" fillOpacity="0.8">
                      {isLinearlyIndependent ? 'Spans R²' : 'Spans line'}
                    </text>
                  </g>
                </svg>
              </div>
            )}
          </div>

          {/* Right Panel */}
          <div
            className="w-64 lg:w-72 xl:w-80 flex-shrink-0 min-h-0 overflow-y-auto overflow-x-hidden border-l"
            style={{ backgroundColor: 'var(--color-paper)', borderColor: 'var(--color-rule)' }}
          >
            <div className="p-3 space-y-3">
              {/* Result */}
              <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--color-paper-2)' }}>
                <div className="text-xs font-medium mb-2" style={{ color: 'var(--color-neutral)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  Result: c₁v₁ + c₂v₂
                </div>
                <div className="text-xl font-bold font-mono text-center py-2 rounded-lg" style={{ backgroundColor: 'var(--color-paper)', color: 'var(--color-ink)', fontFamily: 'var(--font-mono)' }}>
                  ({resultVector[0].toFixed(2)}, {resultVector[1].toFixed(2)})
                </div>
              </div>

              {/* Scalars */}
              <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--color-paper-2)' }}>
                <div className="text-xs font-medium mb-2" style={{ color: 'var(--color-neutral)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  Scalars
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs mb-1 block" style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>c₁</label>
                    <input type="range" min={-3} max={3} step={0.1} value={c1}
                      onChange={(e) => setC1(Math.round(parseFloat(e.target.value) * 10) / 10)}
                      className="w-full" style={{ accentColor: VECTOR_COLORS.v1, cursor: 'pointer' }} />
                    <div className="text-xs text-right" style={{ color: VECTOR_COLORS.v1, fontFamily: 'var(--font-mono)' }}>
                      {c1.toFixed(1)}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs mb-1 block" style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>c₂</label>
                    <input type="range" min={-3} max={3} step={0.1} value={c2}
                      onChange={(e) => setC2(Math.round(parseFloat(e.target.value) * 10) / 10)}
                      className="w-full" style={{ accentColor: VECTOR_COLORS.v2, cursor: 'pointer' }} />
                    <div className="text-xs text-right" style={{ color: VECTOR_COLORS.v2, fontFamily: 'var(--font-mono)' }}>
                      {c2.toFixed(1)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Vectors */}
              <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--color-paper-2)' }}>
                <div className="text-xs font-medium mb-2" style={{ color: 'var(--color-neutral)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  Vectors
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: VECTOR_COLORS.v1 }} />
                    <span className="text-xs font-mono" style={{ color: 'var(--color-muted)' }}>v₁ = [{v1[0].toFixed(1)}, {v1[1].toFixed(1)}]</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: VECTOR_COLORS.v2 }} />
                    <span className="text-xs font-mono" style={{ color: 'var(--color-muted)' }}>v₂ = [{v2[0].toFixed(1)}, {v2[1].toFixed(1)}]</span>
                  </div>
                  {showV3 && (
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: VECTOR_COLORS.v3 }} />
                      <span className="text-xs font-mono" style={{ color: 'var(--color-muted)' }}>v₃ = [{v3[0].toFixed(1)}, {v3[1].toFixed(1)}]</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Linear Independence */}
              <div className="p-3 rounded-xl" style={isLinearlyIndependent ? { backgroundColor: 'rgba(75,180,140,0.10)' } : { backgroundColor: 'rgba(220,75,55,0.08)' }}>
                <div className="text-xs font-medium mb-1" style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Linear Independence
                </div>
                <div className="text-lg font-bold" style={{ fontFamily: 'var(--font-mono)', color: isLinearlyIndependent ? 'oklch(52% 0.16 155)' : 'oklch(52% 0.16 25)' }}>
                  {isLinearlyIndependent ? 'Independent ✓' : 'Dependent ✗'}
                </div>
                <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
                  {isLinearlyIndependent ? 'v₁ and v₂ span the entire R² plane.' : 'v₁ and v₂ are parallel — span a single line.'}
                </p>
              </div>

              {/* Formulas */}
              <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--color-paper-2)' }}>
                <div className="text-xs font-medium mb-2" style={{ color: 'var(--color-neutral)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  Formulas
                </div>
                <div className="space-y-2">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--color-paper)' }}>
                    <code className="text-xs font-mono" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-ink)' }}>
                      v = c₁v₁ + c₂v₂
                    </code>
                  </div>
                  <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--color-paper)' }}>
                    <code className="text-xs font-mono" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-ink)' }}>
                      det = {((v1[0] * v2[1] - v1[1] * v2[0])).toFixed(2)}
                    </code>
                    <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>det ≠ 0 → Independent</p>
                  </div>
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
          <CompletionToggle moduleId={6} />
        </div>
      </div>
    </div>
  );
}