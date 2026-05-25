import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, SkipForward, Info, Target, Gamepad2 } from 'lucide-react';
import { Button } from '../../components/UI/Button';
import { Card } from '../../components/UI/Card';
import { useStore } from '../../store/useStore';
import CompletionToggle from '../../components/UI/CompletionToggle';
import { projectOnto, dotProduct, normalize } from '../../utils/linalg';

const COLORS = {
  accent: 'oklch(52% 0.12 235)',
  emerald: 'oklch(52% 0.16 155)',
  red: 'oklch(52% 0.16 25)',
  amber: 'oklch(65% 0.10 70)',
  purple: 'oklch(50% 0.12 270)',
};

const steps = [
  {
    title: 'Projection as Shadow',
    concept: 'The projection of b onto W is like casting a shadow. The shadow (projection) lies entirely within subspace W. We calculate it using: proj_W(b) = (b·u / u·u) × u',
    hint: 'Drag the blue vector b to see how its projection changes.',
    action: 'Drag vector b to see projection update',
  },
  {
    title: 'Orthogonal Complement',
    concept: 'The component perpendicular to W is called the orthogonal complement. Together, proj and this component perfectly reconstruct b: b = proj(b) + (b - proj(b))',
    hint: 'Watch the perpendicular component appear. Notice the right angle.',
    action: 'Check the right angle indicator',
  },
  {
    title: 'Gram-Schmidt Process',
    concept: 'Any set of vectors can be made orthogonal using Gram-Schmidt. Each new vector subtracts its projections onto previous ones.',
    hint: 'Use the Gram-Schmidt stepper to see the process unfold.',
    action: 'Step through Gram-Schmidt process',
  },
  {
    title: 'Least Squares',
    concept: 'Least squares finds the best-fit line by projecting data points onto the column space. The line minimizes the perpendicular distance.',
    hint: 'Drag the line to minimize the sum of squared residuals.',
    action: 'Try the Least Squares tab',
  },
];

export default function OrthogonalityModule() {
  const [activeTab, setActiveTab] = useState('projection');
  const [currentStep, setCurrentStep] = useState(0);
  const [showGame, setShowGame] = useState(false);
  const [gsStep, setGsStep] = useState(0);
  const [gsVector1, setGsVector1] = useState([3, 2]);
  const [gsVector2, setGsVector2] = useState([1.5, 4]);

  const [vectorB, setVectorB] = useState([4, 3]);
  const [subspaceW, setSubspaceW] = useState([1, 0.7]);

  const projection = useMemo(() => projectOnto(vectorB, subspaceW), [vectorB, subspaceW]);
  const orthogonalComponent = useMemo(() => [vectorB[0] - projection[0], vectorB[1] - projection[1]], [vectorB, projection]);

  const gsSteps = useMemo(() => {
    const e1 = normalize(gsVector1);
    const u2 = gsVector2;
    const dotE1U2 = dotProduct(u2, e1);
    const proj = e1.map(v => v * dotE1U2);
    const v2 = [u2[0] - proj[0], u2[1] - proj[1]];
    const e2 = normalize(v2);

    return [
      { vectors: [gsVector1, gsVector2], labels: ['u₁', 'u₂'], description: 'Start with two non-orthogonal vectors' },
      { vectors: [e1, gsVector2], labels: ['e₁', 'u₂'], description: 'e₁ = normalize(u₁)' },
      { vectors: [e1, gsVector2], labels: ['e₁', 'u₂'], subtract: gsVector2, proj, description: `Subtract projection: v₂ = u₂ - (u₂·e₁)e₁` },
      { vectors: [e1, v2], labels: ['e₁', 'v₂'], description: `v₂ = [${v2[0].toFixed(2)}, ${v2[1].toFixed(2)}]` },
      { vectors: [e1, e2], labels: ['e₁', 'e₂'], description: 'e₂ = normalize(v₂)' },
      { vectors: [e1, e2], labels: ['e₁', 'e₂'], description: `Orthogonal: e₁ · e₂ = ${dotProduct(e1, e2).toFixed(2)}` },
    ];
  }, [gsVector1, gsVector2]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Top Control Bar */}
      <div
        className="flex items-center gap-2 px-3 py-2 border-b flex-shrink-0 flex-wrap"
        style={{ backgroundColor: 'var(--color-paper)', borderColor: 'var(--color-rule)' }}
      >
        <div className="flex items-center gap-2">
          <Button
            variant={activeTab === 'projection' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('projection')}
          >
            Projection
          </Button>
          <Button
            variant={activeTab === 'gram-schmidt' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('gram-schmidt')}
          >
            Gram-Schmidt
          </Button>
          <Button
            variant={activeTab === 'game' ? 'primary' : 'ghost'}
            size="sm"
            icon={Gamepad2}
            onClick={() => setActiveTab('game')}
          >
            Game
          </Button>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setVectorB([4, 3])}>
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
          {/* Main Canvas area */}
          <div className="flex-1 min-h-0 min-w-0 relative">
            {/* Projection Tab */}
            {activeTab === 'projection' && (
              <div className="w-full h-full flex flex-col" style={{ backgroundColor: 'var(--color-paper)' }}>
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

                  {/* Subspace W */}
                  <line x1="-6" y1={-6 * (subspaceW[1] / subspaceW[0])} x2="6" y2={6 * (subspaceW[1] / subspaceW[0])}
                    stroke={COLORS.purple} strokeWidth="0.08" strokeDasharray="0.15 0.1" />

                  {/* Vector B */}
                  <line x1="0" y1="0" x2={vectorB[0]} y2={-vectorB[1]} stroke={COLORS.accent} strokeWidth="0.1" strokeLinecap="round" />
                  <circle cx={vectorB[0]} cy={-vectorB[1]} r="0.15" fill={COLORS.accent} />
                  <text x={vectorB[0] + 0.3} y={-vectorB[1] - 0.2} fill={COLORS.accent} fontSize="0.25" fontWeight="700" fontFamily="var(--font-mono)">b</text>

                  {/* Projection */}
                  <line x1="0" y1="0" x2={projection[0]} y2={-projection[1]} stroke={COLORS.emerald} strokeWidth="0.1" strokeLinecap="round" />
                  <circle cx={projection[0]} cy={-projection[1]} r="0.12" fill={COLORS.emerald} />
                  <text x={projection[0] + 0.3} y={-projection[1] - 0.2} fill={COLORS.emerald} fontSize="0.25" fontWeight="700" fontFamily="var(--font-mono)">proj(b)</text>

                  {/* Orthogonal component */}
                  <line x1={projection[0]} y1={-projection[1]} x2={vectorB[0]} y2={-vectorB[1]}
                    stroke={COLORS.amber} strokeWidth="0.06" strokeDasharray="0.1 0.08" />

                  {/* Right angle */}
                  <path d={`M ${projection[0] - 0.3} ${-projection[1]} L ${projection[0] - 0.3} ${-projection[1] - 0.3} L ${projection[0]} ${-projection[1] - 0.3}`}
                    stroke={COLORS.emerald} strokeWidth="0.04" fill="none" />
                </svg>

                {/* Controls */}
                <div className="p-3 border-t" style={{ borderColor: 'var(--color-rule)', backgroundColor: 'var(--color-paper)' }}>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs mb-1 block" style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>b_x</label>
                      <input type="range" min={-5} max={5} step={0.1} value={vectorB[0]}
                        onChange={(e) => setVectorB(v => [parseFloat(e.target.value), v[1]])}
                        className="w-full" style={{ accentColor: COLORS.accent, cursor: 'pointer' }} />
                      <div className="text-xs text-right" style={{ color: COLORS.accent, fontFamily: 'var(--font-mono)' }}>{vectorB[0].toFixed(1)}</div>
                    </div>
                    <div>
                      <label className="text-xs mb-1 block" style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>b_y</label>
                      <input type="range" min={-5} max={5} step={0.1} value={vectorB[1]}
                        onChange={(e) => setVectorB(v => [v[0], parseFloat(e.target.value)])}
                        className="w-full" style={{ accentColor: COLORS.accent, cursor: 'pointer' }} />
                      <div className="text-xs text-right" style={{ color: COLORS.accent, fontFamily: 'var(--font-mono)' }}>{vectorB[1].toFixed(1)}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Gram-Schmidt Tab */}
            {activeTab === 'gram-schmidt' && (
              <div className="w-full h-full flex flex-col" style={{ backgroundColor: 'var(--color-paper)' }}>
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

                  {/* Vector 1 */}
                  <line x1="0" y1="0" x2={gsSteps[gsStep].vectors[0][0]} y2={-gsSteps[gsStep].vectors[0][1]}
                    stroke={COLORS.purple} strokeWidth="0.1" strokeLinecap="round" />
                  <circle cx={gsSteps[gsStep].vectors[0][0]} cy={-gsSteps[gsStep].vectors[0][1]} r="0.15" fill={COLORS.purple} />
                  <text x={gsSteps[gsStep].vectors[0][0] + 0.3} y={-gsSteps[gsStep].vectors[0][1] - 0.2}
                    fill={COLORS.purple} fontSize="0.25" fontWeight="700" fontFamily="var(--font-mono)">{gsSteps[gsStep].labels[0]}</text>

                  {/* Vector 2 */}
                  <line x1="0" y1="0" x2={gsSteps[gsStep].vectors[1][0]} y2={-gsSteps[gsStep].vectors[1][1]}
                    stroke={COLORS.amber} strokeWidth="0.1" strokeLinecap="round" />
                  <circle cx={gsSteps[gsStep].vectors[1][0]} cy={-gsSteps[gsStep].vectors[1][1]} r="0.15" fill={COLORS.amber} />
                  <text x={gsSteps[gsStep].vectors[1][0] + 0.3} y={-gsSteps[gsStep].vectors[1][1] - 0.2}
                    fill={COLORS.amber} fontSize="0.25" fontWeight="700" fontFamily="var(--font-mono)">{gsSteps[gsStep].labels[1]}</text>

                  {/* Projection line */}
                  {gsSteps[gsStep].subtract && gsSteps[gsStep].proj && (
                    <line x1={gsSteps[gsStep].vectors[1][0]} y1={-gsSteps[gsStep].vectors[1][1]}
                      x2={gsSteps[gsStep].proj[0]} y2={-gsSteps[gsStep].proj[1]}
                      stroke={COLORS.red} strokeWidth="0.05" strokeDasharray="0.1 0.08" />
                  )}
                </svg>

                {/* GS Controls */}
                <div className="p-3 border-t" style={{ borderColor: 'var(--color-rule)', backgroundColor: 'var(--color-paper)' }}>
                  <div className="flex justify-center gap-2 mb-2">
                    <Button variant="ghost" size="xs" onClick={() => setGsStep(0)}>Reset</Button>
                    <Button variant="ghost" size="xs" icon={SkipForward} onClick={() => setGsStep(Math.min(gsStep + 1, gsSteps.length - 1))}
                      disabled={gsStep >= gsSteps.length - 1}>Step</Button>
                  </div>
                  <p className="text-xs text-center" style={{ color: 'var(--color-accent)' }}>
                    {gsSteps[gsStep].description}
                  </p>
                </div>
              </div>
            )}

            {/* Game Tab */}
            {activeTab === 'game' && (
              <div className="w-full h-full flex items-center justify-center p-4" style={{ backgroundColor: 'var(--color-paper-2)' }}>
                <Card variant="elevated" className="p-6 text-center">
                  <p style={{ color: 'var(--color-muted)' }}>Game would render here</p>
                  <p className="text-sm mt-2" style={{ color: 'var(--color-muted)', opacity: 0.7 }}>Orthogonality mini-game</p>
                </Card>
              </div>
            )}
          </div>

          {/* Right Panel */}
          <div
            className="w-64 lg:w-72 xl:w-80 flex-shrink-0 min-h-0 overflow-y-auto overflow-x-hidden border-l"
            style={{ backgroundColor: 'var(--color-paper)', borderColor: 'var(--color-rule)' }}
          >
            <div className="p-3 space-y-3">
              {/* Info Card */}
              {activeTab === 'projection' && (
                <>
                  <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--color-paper-2)' }}>
                    <div className="text-xs font-medium mb-2" style={{ color: 'var(--color-neutral)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                      Vector Values
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-xs" style={{ color: 'var(--color-muted)' }}>b</span>
                        <span className="text-xs font-mono" style={{ fontFamily: 'var(--font-mono)', color: COLORS.accent }}>
                          [{vectorB[0].toFixed(2)}, {vectorB[1].toFixed(2)}]
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs" style={{ color: 'var(--color-muted)' }}>proj(b)</span>
                        <span className="text-xs font-mono" style={{ fontFamily: 'var(--font-mono)', color: COLORS.emerald }}>
                          [{projection[0].toFixed(2)}, {projection[1].toFixed(2)}]
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs" style={{ color: 'var(--color-muted)' }}>b·u</span>
                        <span className="text-xs font-mono" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-ink)' }}>
                          {dotProduct(vectorB, normalize(subspaceW)).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--color-paper-2)' }}>
                    <div className="text-xs font-medium mb-2" style={{ color: 'var(--color-neutral)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                      Formulas
                    </div>
                    <div className="space-y-2">
                      <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--color-paper)' }}>
                        <code className="text-xs font-mono" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-ink)' }}>
                          proj_W(b) = (b·u / u·u) × u
                        </code>
                      </div>
                      <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--color-paper)' }}>
                        <code className="text-xs font-mono" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-ink)' }}>
                          b = proj(b) + (b - proj(b))
                        </code>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'gram-schmidt' && (
                <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--color-paper-2)' }}>
                  <div className="text-xs font-medium mb-2" style={{ color: 'var(--color-neutral)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                    Gram-Schmidt
                  </div>
                  <div className="space-y-2">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--color-paper)' }}>
                      <code className="text-xs font-mono" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-ink)' }}>
                        e₁ = normalize(u₁)
                      </code>
                    </div>
                    <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--color-paper)' }}>
                      <code className="text-xs font-mono" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-ink)' }}>
                        v₂ = u₂ - (u₂·e₁)e₁
                      </code>
                    </div>
                    <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--color-paper)' }}>
                      <code className="text-xs font-mono" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-ink)' }}>
                        e₂ = normalize(v₂)
                      </code>
                    </div>
                  </div>
                </div>
              )}

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
          <CompletionToggle moduleId={8} />
        </div>
      </div>
    </div>
  );
}