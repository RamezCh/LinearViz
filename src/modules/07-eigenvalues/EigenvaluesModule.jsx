import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, Sparkles, Gamepad2 } from 'lucide-react';
import { Button } from '../../components/UI/Button';
import { useStore } from '../../store/useStore';
import CompletionToggle from '../../components/UI/CompletionToggle';
import { Card } from '../../components/UI/Card';
import { InlineText } from '../../components/UI/Math';
import { eigenvalues2x2, eigenvectors2x2, det2x2 } from '../../utils/linalg';

function applyTransformation(v, A) {
  return [A[0][0] * v[0] + A[0][1] * v[1], A[1][0] * v[0] + A[1][1] * v[1]];
}

const steps = [
  {
    title: 'What are Eigenvalues?',
    concept: `An EIGENVALUE $\\lambda$ and its EIGENVECTOR $\\mathbf{v}$ have a special relationship:
$A \\times \\mathbf{v} = \\lambda \\times \\mathbf{v}$

Translation: When matrix A transforms eigenvector $\\mathbf{v}$, the result stays in the SAME DIRECTION as $\\mathbf{v}$ — it only stretches or squishes!

Example: If $\\mathbf{v} = \\begin{pmatrix}1 \\\\ 0\\end{pmatrix}$ is an eigenvector with $\\lambda = 2$, then $A \\times [1,0] = 2 \\times [1,0] = [2, 0]$

The eigenvector doesn't change direction — just length!`,
    hint: 'The AMBER lines show eigenvector directions. Vectors ON these lines stay on them after transformation.',
    action: 'Find the amber eigenvector lines on the canvas',
  },
  {
    title: 'The Characteristic Equation',
    concept: `How do we FIND eigenvalues?

Step 1: Start with $A \\times \\mathbf{v} = \\lambda \\times \\mathbf{v}$
Step 2: Rearrange to $(A - \\lambda I) \\times \\mathbf{v} = 0$
Step 3: For non-zero $\\mathbf{v}$, we need $\\det(A - \\lambda I) = 0$

This is the CHARACTERISTIC EQUATION — solve for $\\lambda$!

For 2×2: $\\det(A - \\lambda I) = 0$ gives a quadratic in $\\lambda$`,
    hint: 'Click "Compute Eigenvalues" button to see step-by-step.',
    action: 'Click the Compute button to see derivation',
  },
  {
    title: 'Trace and Determinant Relationship',
    concept: `For 2×2 matrices, eigenvalues have special properties:
• $\\lambda_1 + \\lambda_2 = \\text{TRACE}(A) = a + d$ (sum of diagonal)
• $\\lambda_1 \\times \\lambda_2 = \\text{DET}(A)$

These shortcuts let you CHECK your answers!

For your matrix:
$\\text{tr}(A) = ${trace.toFixed(2)}$
$\\det(A) = ${determinant.toFixed(2)}$`,
    hint: 'The right panel shows tr(A) = ' + trace.toFixed(2) + ' and det(A) = ' + determinant.toFixed(2) + '.',
    action: 'Check the Matrix Info panel for trace and det',
  },
  {
    title: 'What Do Eigenvalues Tell Us?',
    concept: `Your eigenvalues: $\\lambda_1 = ${eigenvalues?.[0]?.value?.toFixed(2) || '?'}$, $\\lambda_2 = ${eigenvalues?.[1]?.value?.toFixed(2) || '?'}$

• $|\\lambda| > 1$: Stretches in that direction
• $|\\lambda| < 1$: Squishes in that direction
• $\\lambda < 0$: Includes a flip (reflection)
• $\\lambda = 1$ or $-1$: Just rotates or reflects

The AMBER vectors show the eigenvector directions on the canvas!`,
    hint: 'Drag vectors on the amber lines — they stay on their lines after transformation.',
    action: 'Drag vectors on eigenvector lines to see the invariance',
  },
  {
    title: 'Complex Eigenvalues',
    concept: `If discriminant $(tr^2 - 4 \\times \\det) < 0$, we get COMPLEX eigenvalues.

This means the transformation includes ROTATION — no real eigenvector lines exist!

Example: Rotation by $90^\\circ$ $\\begin{pmatrix}0 & -1 \\\\ 1 & 0\\end{pmatrix}$
• Every vector rotates!
• No vector stays on its line
• Eigenvalues $= i$ and $-i$ (complex!)`,
    hint: 'Try a rotation matrix: a=0, b=-1, c=1, d=0 → complex eigenvalues.',
    action: 'Try rotation matrix [0, -1, 1, 0]',
  },
];

export default function EigenvaluesModule() {
  const { currentModule } = useStore();
  const [matrixA, setMatrixA] = useState([
    [2, 1],
    [1, 2],
  ]);
  const [currentStep, setCurrentStep] = useState(0);
  const [showGame, setShowGame] = useState(false);
  const [computedEigenvalues, setComputedEigenvalues] = useState(null);
  const [showPolynomial, setShowPolynomial] = useState(false);
  const [polynomialStep, setPolynomialStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const trace = matrixA[0][0] + matrixA[1][1];
  const determinant = det2x2(matrixA);

  const eigenvalues = useMemo(() => {
    try {
      return eigenvalues2x2(matrixA);
    } catch (e) {
      return null;
    }
  }, [matrixA]);

  const eigenvecs = useMemo(() => {
    if (!eigenvalues) return [];
    return eigenvalues
      .filter((ev) => !ev.isComplex)
      .map((ev) => {
        try {
          return eigenvectors2x2(matrixA, ev.value);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  }, [eigenvalues, matrixA]);

  const computeEigenvalues = useCallback(() => {
    try {
      const evs = eigenvalues2x2(matrixA);
      setComputedEigenvalues(evs);
      setShowPolynomial(true);
      setPolynomialStep(0);
    } catch (e) {
      setComputedEigenvalues(null);
    }
  }, [matrixA]);

  useEffect(() => {
    if (!showPolynomial || !isAnimating) return;
    if (polynomialStep >= 5) {
      setIsAnimating(false);
      return;
    }
    const timer = setTimeout(() => {
      setPolynomialStep((prev) => prev + 1);
    }, 800);
    return () => clearTimeout(timer);
  }, [showPolynomial, isAnimating, polynomialStep]);

  useEffect(() => {
    setComputedEigenvalues(null);
    setShowPolynomial(false);
    setPolynomialStep(0);
  }, [matrixA]);

  const sampleVectors = useMemo(() => {
    const vectors = [];
    const numVectors = 10;
    for (let i = 0; i < numVectors; i++) {
      const angle = (2 * Math.PI * i) / numVectors;
      const scale = 1.2 + Math.random() * 0.5;
      vectors.push([Math.cos(angle) * scale, Math.sin(angle) * scale]);
    }
    return vectors;
  }, []);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Top Control Bar */}
      <div
        className="flex items-center gap-2 px-3 py-2 border-b flex-shrink-0 flex-wrap"
        style={{ backgroundColor: 'var(--color-paper)', borderColor: 'var(--color-rule)' }}
      >
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            icon={Sparkles}
            onClick={computeEigenvalues}
          >
            Compute
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={RotateCcw}
            onClick={() => setMatrixA([[2, 1], [1, 2]])}
          >
            Reset
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
          <div className="flex-1 min-h-0 min-w-0 relative flex flex-col">
            {/* Canvas */}
            <div
              className="flex-1 min-h-0"
              style={{
                backgroundColor: 'var(--color-paper)',
              }}
            >
              <svg viewBox="-3 -3 6 6" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
                {/* Grid */}
                {Array.from({ length: 13 }).map((_, i) => (
                  <g key={i}>
                    <line x1={i - 6} y1="-3" x2={i - 6} y2="3" stroke="var(--color-rule)" strokeWidth="0.02" />
                    <line x1="-3" y1={i - 6} x2="3" y2={i - 6} stroke="var(--color-rule)" strokeWidth="0.02" />
                  </g>
                ))}
                {/* Axes */}
                <line x1="-3" y1="0" x2="3" y2="0" stroke="var(--color-neutral)" strokeWidth="0.03" />
                <line x1="0" y1="-3" x2="0" y2="3" stroke="var(--color-neutral)" strokeWidth="0.03" />

                {/* Sample vectors */}
                {sampleVectors.map((v, i) => {
                  const Av = applyTransformation(v, matrixA);
                  const isEigen = eigenvecs.some(
                    (ev) => Math.abs(ev[0] * v[1] - ev[1] * v[0]) < 0.1
                  );
                  const color = isEigen ? 'oklch(65% 0.10 70)' : 'var(--color-accent)';

                  return (
                    <g key={i}>
                      <line x1="0" y1="0" x2={v[0]} y2={v[1]} stroke="var(--color-muted)" strokeWidth="0.02" strokeDasharray="0.1 0.05" />
                      <circle cx={v[0]} cy={v[1]} r="0.06" fill="var(--color-muted)" />
                      <line x1="0" y1="0" x2={Av[0]} y2={Av[1]} stroke={color} strokeWidth="0.04" />
                      <circle cx={Av[0]} cy={Av[1]} r="0.08" fill={color} />
                    </g>
                  );
                })}

                {/* Eigenvectors */}
                {eigenvecs.map((ev, i) => {
                  const scaled = ev.map(c => c * 2.5);
                  const scaledNeg = ev.map(c => -c * 2.5);
                  return (
                    <g key={`eigen-${i}`}>
                      <line x1={scaledNeg[0]} y1={scaledNeg[1]} x2={scaled[0]} y2={scaled[1]}
                        stroke="oklch(65% 0.10 70)" strokeWidth="0.06" />
                      <circle cx={scaled[0]} cy={scaled[1]} r="0.1" fill="oklch(65% 0.10 70)" />
                      <path
                        d={`M ${scaledNeg[0]} ${scaledNeg[1]} L ${-scaledNeg[0] * 0.3 - scaledNeg[1] * 0.15} ${-scaledNeg[1] * 0.3 + scaledNeg[0] * 0.15} L ${-scaledNeg[0] * 0.3 + scaledNeg[1] * 0.15} ${-scaledNeg[1] * 0.3 - scaledNeg[0] * 0.15} Z`}
                        fill="oklch(65% 0.10 70)"
                      />
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Eigenvalues display */}
            <div className="p-3 border-t" style={{ borderColor: 'var(--color-rule)', backgroundColor: 'var(--color-paper)' }}>
              <div className="flex gap-4">
                {eigenvalues ? (
                  eigenvalues.map((ev, i) => (
                    <div key={i} className="flex-1 p-2 rounded-lg text-center" style={{ backgroundColor: 'rgba(80,130,200,0.08)' }}>
                      <p className="text-xs" style={{ color: 'oklch(50% 0.12 235)' }}>λ{i + 1}</p>
                      <p className="text-lg font-bold font-mono" style={{ fontFamily: 'var(--font-mono)', color: 'oklch(50% 0.12 235)' }}>
                        {ev.isComplex
                          ? `${ev.re.toFixed(2)} ± ${ev.im.toFixed(2)}i`
                          : ev.value.toFixed(2)}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Click "Compute" to find eigenvalues</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div
            className="w-64 lg:w-72 xl:w-80 flex-shrink-0 min-h-0 overflow-y-auto overflow-x-hidden border-l"
            style={{ backgroundColor: 'var(--color-paper)', borderColor: 'var(--color-rule)' }}
          >
            <div className="p-3 space-y-3">
              {/* Matrix Edit */}
              <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--color-paper-2)' }}>
                <div className="text-xs font-medium mb-2" style={{ color: 'var(--color-neutral)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  Matrix A
                </div>
                <div className="flex gap-1">
                  {[0, 1].map((i) =>
                    [0, 1].map((j) => (
                      <input
                        key={`${i}-${j}`}
                        type="number"
                        step="0.1"
                        value={matrixA[i][j]}
                        onChange={(e) => {
                          const newMatrix = matrixA.map((r) => [...r]);
                          newMatrix[i][j] = parseFloat(e.target.value) || 0;
                          setMatrixA(newMatrix);
                        }}
                        style={{
                          width: 48,
                          height: 40,
                          textAlign: 'center',
                          borderRadius: '0.5rem',
                          border: '1.5px solid var(--color-rule)',
                          backgroundColor: 'var(--color-paper)',
                          color: 'var(--color-ink)',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.875rem',
                          outline: 'none',
                        }}
                      />
                    ))
                  )}
                </div>
              </div>

              {/* Matrix Info */}
              <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--color-paper-2)' }}>
                <div className="text-xs font-medium mb-2" style={{ color: 'var(--color-neutral)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  Matrix Info
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-ink)' }}>
                    <span style={{ color: 'var(--color-muted)' }}>tr(A)</span>
                    <span>{trace.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-ink)' }}>
                    <span style={{ color: 'var(--color-muted)' }}>det(A)</span>
                    <span>{determinant.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Characteristic Polynomial */}
              {showPolynomial && computedEigenvalues && (
                <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--color-paper-2)' }}>
                  <div className="text-xs font-medium mb-2" style={{ color: 'var(--color-neutral)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                    Characteristic Polynomial
                  </div>
                  <div className="space-y-2">
                    {[
                      { label: 'Start', formula: 'det(A - λI) = 0' },
                      { label: 'Compute', formula: `${matrixA[0][0].toFixed(1)} × ${matrixA[1][1].toFixed(1)} - ${matrixA[0][1].toFixed(1)} × ${matrixA[1][0].toFixed(1)} = 0` },
                      { label: 'Simplify', formula: `λ² - ${trace.toFixed(2)}λ + ${determinant.toFixed(2)} = 0` },
                      {
                        label: 'Solve',
                        formula: computedEigenvalues.every((ev) => !ev.isComplex)
                          ? `λ₁ = ${computedEigenvalues[0].value.toFixed(2)}, λ₂ = ${computedEigenvalues[1]?.value.toFixed(2) || 'N/A'}`
                          : 'Complex eigenvalues'
                      },
                    ].slice(0, polynomialStep + 1).map((step, i) => (
                      <div key={i} className="p-2 rounded-lg" style={i === polynomialStep ? { backgroundColor: 'rgba(80,130,200,0.10)', border: '1.5px solid oklch(50% 0.12 235)' } : { backgroundColor: 'var(--color-paper)' }}>
                        <p className="text-xs font-medium mb-0.5" style={{ color: 'oklch(50% 0.12 235)' }}>{step.label}</p>
                        <code className="text-xs font-mono" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-ink)' }}>
                          {step.formula}
                        </code>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button variant="ghost" size="xs" icon={isAnimating ? Pause : Play} onClick={() => setIsAnimating(!isAnimating)}>
                      {isAnimating ? 'Pause' : 'Animate'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Formulas */}
              <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--color-paper-2)' }}>
                <div className="text-xs font-medium mb-2" style={{ color: 'var(--color-neutral)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  Formulas
                </div>
                <div className="space-y-2">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--color-paper)' }}>
                    <code className="text-xs font-mono" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-ink)' }}>
                      Av = λv
                    </code>
                  </div>
                  <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--color-paper)' }}>
                    <code className="text-xs font-mono" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-ink)' }}>
                      det(A - λI) = 0
                    </code>
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
          <CompletionToggle moduleId={7} />
        </div>
      </div>
    </div>
  );
}