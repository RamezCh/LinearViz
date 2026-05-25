import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Infinity, Check, Gamepad2 } from 'lucide-react';
import { Button } from '../../components/UI/Button';
import { useStore } from '../../store/useStore';
import CompletionToggle from '../../components/UI/CompletionToggle';
import GameWrapper from '../../components/MiniGame/GameWrapper';
import SolveTheSystem from '../../games/SolveTheSystem';

const GRID_EXTENT = 6;
const COLORS = ['oklch(50% 0.12 235)', 'oklch(52% 0.16 155)', 'oklch(65% 0.10 70)'];

export default function SystemsModule() {
  const [numEquations, setNumEquations] = useState(2);
  const [equation1, setEquation1] = useState({ a: 1, b: -1, c: 2 });
  const [equation2, setEquation2] = useState({ a: 2, b: 1, c: 4 });
  const [equation3, setEquation3] = useState({ a: 1, b: 2, c: 3 });
  const [currentStep, setCurrentStep] = useState(0);
  const [showGame, setShowGame] = useState(false);
  const [reductionStep, setReductionStep] = useState(0);

  const equations = [equation1, equation2, equation3].slice(0, numEquations);

  const getLineForEquation = (eq) => {
    if (eq.b === 0 && eq.a === 0) return null;
    if (eq.b === 0) return { type: 'vertical', x: -eq.c / eq.a };
    if (eq.a === 0) return { type: 'horizontal', y: eq.c / eq.b };
    return { type: 'line', slope: -eq.a / eq.b, intercept: eq.c / eq.b };
  };

  const intersection = useMemo(() => {
    if (numEquations < 2) return null;
    const line1 = getLineForEquation(equation1);
    const line2 = getLineForEquation(equation2);
    if (!line1 || !line2) return null;

    if (line1.type === 'vertical' && line2.type !== 'vertical') return { x: line1.x, y: line2.slope * line1.x + line2.intercept };
    if (line2.type === 'vertical' && line1.type !== 'vertical') return { x: line2.x, y: line1.slope * line2.x + line1.intercept };
    if (line1.type === 'horizontal' && line2.type !== 'horizontal') return { x: (line1.y - line2.intercept) / line2.slope, y: line1.y };
    if (line2.type === 'horizontal' && line1.type !== 'horizontal') return { x: (line2.y - line1.intercept) / line1.slope, y: line2.y };
    if (line1.type === 'vertical' && line2.type === 'vertical') return Math.abs(line1.x - line2.x) < 0.001 ? 'coincident' : 'parallel';
    if (line1.type === 'horizontal' && line2.type === 'horizontal') return Math.abs(line1.y - line2.y) < 0.001 ? 'coincident' : 'parallel';

    const det = equation1.a * equation2.b - equation2.a * equation1.b;
    if (Math.abs(det) < 0.001) {
      const ratio1 = equation1.a !== 0 ? equation2.a / equation1.a : equation2.b / equation1.b;
      const ratio2 = equation1.c !== 0 ? equation2.c / equation1.c : equation2.b / equation1.b;
      return Math.abs(ratio1 - ratio2) < 0.001 ? 'coincident' : 'parallel';
    }

    return {
      x: (equation2.c * equation1.b - equation1.c * equation2.b) / det,
      y: (equation1.a * equation2.c - equation2.a * equation1.c) / det,
    };
  }, [equation1, equation2, numEquations]);

  const solutionType = useMemo(() => {
    if (!intersection) return 'unknown';
    if (intersection === 'parallel') return 'none';
    if (intersection === 'coincident') return 'infinite';
    return 'unique';
  }, [intersection]);

  const steps = [
    {
      title: 'One Equation = One Line',
      concept: 'In 2D, each linear equation represents a line. The solution to the system is where the lines intersect!',
      hint: 'Look at the colored lines on the canvas. Each equation is a line.',
      action: 'Observe how equations form lines',
    },
    {
      title: 'Types of Solutions',
      concept: solutionType === 'unique'
        ? `Unique solution at (${intersection?.x.toFixed(2)}, ${intersection?.y.toFixed(2)}) — lines intersect at one point!`
        : solutionType === 'none'
          ? 'No solution — the lines are parallel and never meet!'
          : solutionType === 'infinite'
            ? 'Infinite solutions — the lines are the same!'
            : 'Add 2+ equations to find intersection.',
      hint: 'The badge in the right panel shows the solution type.',
      action: 'Check the solution type badge',
    },
    {
      title: 'Row Reduction Preview',
      concept: 'Gaussian elimination solves systems by eliminating variables row by row. The augmented matrix [A|b] captures the system.',
      hint: 'Look at the augmented matrix in the right panel.',
      action: 'View the augmented matrix format',
    },
    {
      title: 'The Matrix View',
      concept: 'The system Ax = b can be solved using A⁻¹b when det(A) ≠ 0. The matrix captures the entire system!',
      hint: 'The matrix view shows the same system in compact form.',
      action: 'Compare equation and matrix views',
    },
  ];

  const getLinePath = (line, vb) => {
    if (!line || line.type === 'vertical') return `M ${line?.x || 0} ${-vb / 2} L ${line?.x || 0} ${vb / 2}`;
    if (line.type === 'horizontal') return `M ${-vb / 2} ${-line.y} L ${vb / 2} ${-line.y}`;
    return `M ${-vb / 2} ${-(line.slope * (-vb / 2) + line.intercept)} L ${vb / 2} ${-(line.slope * (vb / 2) + line.intercept)}`;
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
            variant={numEquations === 2 ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setNumEquations(2)}
          >
            2 eq.
          </Button>
          <Button
            variant={numEquations === 3 ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setNumEquations(3)}
          >
            3 eq.
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
          <div className="flex-1 min-h-0 min-w-0 relative flex flex-col">
            {showGame ? (
              <div className="flex-1 flex items-center justify-center p-4" style={{ backgroundColor: 'var(--color-paper)' }}>
                <GameWrapper
                  title="Solve the System"
                  instructions="Set up and solve the system of equations"
                  maxAttempts={5}
                  rounds={5}
                  scoring="accuracy"
                >
                  {(props) => <SolveTheSystem {...props} />}
                </GameWrapper>
              </div>
            ) : (
              <>
                {/* Canvas */}
                <div className="flex-1 min-h-0" style={{ backgroundColor: 'var(--color-paper)' }}>
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

                    {/* Lines */}
                    {equations.map((eq, i) => (
                      <motion.path
                        key={i}
                        d={getLinePath(getLineForEquation(eq), 12)}
                        stroke={COLORS[i]}
                        strokeWidth="0.1"
                        strokeDasharray="0.15 0.1"
                        fill="none"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.5, delay: i * 0.1 }}
                      />
                    ))}

                    {/* Intersection point */}
                    {solutionType === 'unique' && intersection && (
                      <motion.g initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300 }}>
                        <circle cx={intersection.x} cy={-intersection.y} r="0.15" fill="oklch(52% 0.16 25)" />
                        <circle cx={intersection.x} cy={-intersection.y} r="0.25" fill="oklch(52% 0.16 25)" opacity="0.3">
                          <animate attributeName="r" values="0.25;0.4;0.25" dur="2s" repeatCount="indefinite" />
                          <animate attributeName="opacity" values="0.3;0.1;0.3" dur="2s" repeatCount="indefinite" />
                        </circle>
                      </motion.g>
                    )}
                  </svg>
                </div>

                {/* Equations info */}
                <div className="p-3 border-t" style={{ borderColor: 'var(--color-rule)', backgroundColor: 'var(--color-paper)' }}>
                  <div className="flex gap-3 flex-wrap">
                    {equations.map((eq, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                        <span style={{ color: 'var(--color-ink-2)', fontFamily: 'var(--font-mono)', fontSize: '0.875rem' }}>
                          {eq.a}x + {eq.b}y = {eq.c}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Right Panel */}
          <div
            className="w-64 lg:w-72 xl:w-80 flex-shrink-0 min-h-0 overflow-y-auto overflow-x-hidden border-l"
            style={{ backgroundColor: 'var(--color-paper)', borderColor: 'var(--color-rule)' }}
          >
            <div className="p-3 space-y-3">
              {/* Solution Status */}
              <div
                className="p-3 rounded-xl"
                style={
                  solutionType === 'unique'
                    ? { backgroundColor: 'rgba(75,180,140,0.10)' }
                    : solutionType === 'none'
                      ? { backgroundColor: 'rgba(220,75,55,0.08)' }
                      : solutionType === 'infinite'
                        ? { backgroundColor: 'rgba(200,155,50,0.08)' }
                        : { backgroundColor: 'var(--color-paper-2)' }
                }
              >
                <div className="flex items-center gap-2 mb-1">
                  {solutionType === 'unique' && <Check className="w-4 h-4" style={{ color: 'oklch(52% 0.16 155)' }} />}
                  {solutionType === 'none' && <AlertCircle className="w-4 h-4" style={{ color: 'oklch(52% 0.16 25)' }} />}
                  {solutionType === 'infinite' && <Infinity className="w-4 h-4" style={{ color: 'oklch(65% 0.10 70)' }} />}
                  <span className="text-xs font-semibold capitalize" style={{ color: 'var(--color-ink)' }}>
                    {solutionType} Solution
                  </span>
                </div>
                {solutionType === 'unique' && intersection && (
                  <p className="text-sm" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-ink)' }}>
                    x = {intersection.x.toFixed(2)}, y = {intersection.y.toFixed(2)}
                  </p>
                )}
                {solutionType === 'none' && (
                  <p className="text-xs" style={{ color: 'var(--color-muted)' }}>Lines are parallel — no intersection</p>
                )}
                {solutionType === 'infinite' && (
                  <p className="text-xs" style={{ color: 'var(--color-muted)' }}>Lines coincide — infinitely many solutions</p>
                )}
              </div>

              {/* Augmented Matrix */}
              <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--color-paper-2)' }}>
                <div className="text-xs font-medium mb-2" style={{ color: 'var(--color-neutral)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  Augmented Matrix [A|b]
                </div>
                <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--color-paper)', fontFamily: 'var(--font-mono)', fontSize: '0.875rem' }}>
                  <div className="flex gap-1 justify-center">
                    <div className="flex flex-col gap-1">
                      {equations.map((eq, i) => (
                        <div key={i} className="flex gap-1">
                          <span className="w-8 text-center">{eq.a.toFixed(1)}</span>
                          <span className="w-8 text-center">{eq.b.toFixed(1)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="w-px mx-1" style={{ backgroundColor: 'var(--color-rule)' }} />
                    <div className="flex flex-col gap-1 justify-center">
                      {equations.map((eq, i) => (
                        <span key={i} className="w-8 text-center">{eq.c.toFixed(1)}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Matrix Form */}
              <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--color-paper-2)' }}>
                <div className="text-xs font-medium mb-2" style={{ color: 'var(--color-neutral)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  Matrix Form: Ax = b
                </div>
                <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--color-paper)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                  <div className="flex gap-1 items-center">
                    <div className="flex flex-col gap-0.5">
                      {equations.map((eq, i) => (
                        <div key={i} className="flex gap-0.5">
                          <span className="w-6 text-center">{eq.a.toFixed(1)}</span>
                          <span className="w-6 text-center">{eq.b.toFixed(1)}</span>
                        </div>
                      ))}
                    </div>
                    <span style={{ color: 'var(--color-muted)' }}>[x]</span>
                    <span style={{ color: 'var(--color-muted)' }}>=</span>
                    <div className="flex flex-col gap-0.5">
                      {equations.map((eq, i) => (
                        <span key={i} className="w-6 text-center">{eq.c.toFixed(1)}</span>
                      ))}
                    </div>
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
          <CompletionToggle moduleId={5} />
        </div>
      </div>
    </div>
  );
}