import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Infinity, Check, Gamepad2 } from 'lucide-react';
import Grid2D from '../../components/Canvas/Grid2D';
import Button from '../../components/UI/Button';
import Card from '../../components/UI/Card';
import { FormulaRenderer } from '../../components/FormulaPanel/FormulaRenderer';
import { useStore } from '../../store/useStore';
import CompletionToggle from '../../components/UI/CompletionToggle';
import GameWrapper from '../../components/MiniGame/GameWrapper';
import SolveTheSystem from '../../games/SolveTheSystem';

export default function SystemsModule() {
  const { isGuidedMode, guidedStep, setGuidedStep } = useStore();
  const [numEquations, setNumEquations] = useState(2);
  const [equation1, setEquation1] = useState({ a: 1, b: -1, c: 2 });
  const [equation2, setEquation2] = useState({ a: 2, b: 1, c: 4 });
  const [equation3, setEquation3] = useState({ a: 1, b: 2, c: 3 });
  const [reductionStep, setReductionStep] = useState(0);
  const [showGame, setShowGame] = useState(false);

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

  const augmentedMatrix = useMemo(() => equations.map((eq) => [eq.a, eq.b, eq.c]), [equations]);

  const reductionSteps = [
    { label: 'Original', matrix: augmentedMatrix },
    {
      label: 'R2 → R2 - (a₂/a₁)R1',
      matrix: equations.length < 2 ? augmentedMatrix : [
        augmentedMatrix[0],
        [equations[1].a - (equations[1].a / equations[0].a) * equations[0].a,
         equations[1].b - (equations[1].a / equations[0].a) * equations[0].b,
         equations[1].c - (equations[1].a / equations[0].a) * equations[0].c],
      ],
    },
  ];

  const guidedSteps = [
    { title: 'One Equation = One Line', description: 'In 2D, each linear equation represents a line. The solution to the system is where the lines intersect.', formula: 'ax + by = c' },
    { title: 'Types of Solutions', description: 'Systems can have no solution (parallel lines), one solution (intersecting lines), or infinitely many (same line).', formula: 'Unique: det ≠ 0 | Infinite: same line | None: parallel' },
    { title: 'Row Reduction', description: 'We can solve systems by eliminating variables row by row. This is called Gaussian elimination.', formula: 'Augmented matrix: [A|b]' },
    { title: 'The Matrix View', description: 'A system Ax = b can be solved by row-reducing the augmented matrix [A|b] and reading off x.', formula: 'x = A^{-1}b (when det(A) ≠ 0)' },
  ];

  const getLinePath = (line, vb) => {
    if (!line || line.type === 'vertical') return `M ${line?.x || 0} ${-vb / 2} L ${line?.x || 0} ${vb / 2}`;
    if (line.type === 'horizontal') return `M ${-vb / 2} ${-line.y} L ${vb / 2} ${-line.y}`;
    return `M ${-vb / 2} ${-(line.slope * (-vb / 2) + line.intercept)} L ${vb / 2} ${-(line.slope * (vb / 2) + line.intercept)}`;
  };

  const colors = ['oklch(50% 0.12 235)', 'oklch(52% 0.16 155)', 'oklch(65% 0.10 70)'];

  const solutionBadgeStyle = solutionType === 'unique'
    ? { backgroundColor: 'rgba(75,180,140,0.10)', border: '1px solid rgba(75,180,140,0.3)', icon: <Check className="w-4 h-4" style={{ color: 'oklch(52% 0.16 155)' }} /> }
    : solutionType === 'none'
    ? { backgroundColor: 'rgba(220,75,55,0.08)', border: '1px solid rgba(220,75,55,0.25)', icon: <AlertCircle className="w-4 h-4" style={{ color: 'oklch(52% 0.16 25)' }} /> }
    : solutionType === 'infinite'
    ? { backgroundColor: 'rgba(200,155,50,0.08)', border: '1px solid rgba(200,155,50,0.25)', icon: <Infinity className="w-4 h-4" style={{ color: 'oklch(65% 0.10 70)' }} /> }
    : { backgroundColor: 'var(--color-paper-2)', border: '1px solid var(--color-rule)', icon: null };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="mb-3">
        <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-display)' }}>
          Systems of Equations
        </h2>
        <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
          Explore how lines intersect to solve systems — one point, none, or infinite solutions.
        </p>
      </div>

      {isGuidedMode && (
        <Card variant="elevated" className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>
              Step {guidedStep + 1}: {guidedSteps[guidedStep]?.title}
            </h3>
            <span className="text-xs" style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
              {guidedStep + 1}/{guidedSteps.length}
            </span>
          </div>
          <p className="text-sm mb-3" style={{ color: 'var(--color-muted)' }}>
            {guidedSteps[guidedStep]?.description}
          </p>
          <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--color-paper-2)' }}>
            <FormulaRenderer expression={guidedSteps[guidedStep]?.formula || ''} displayMode />
          </div>
          <div className="flex gap-2 mt-3">
            <Button size="sm" variant="secondary" onClick={() => setGuidedStep(Math.max(0, guidedStep - 1))} disabled={guidedStep === 0}>Back</Button>
            <Button size="sm" variant="primary" onClick={() => setGuidedStep(Math.min(guidedSteps.length - 1, guidedStep + 1))}>
              {guidedStep === guidedSteps.length - 1 ? 'Done' : 'Next'}
            </Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
        <Card variant="default" className="flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold" style={{ color: 'var(--color-ink)' }}>Canvas</h3>
            <div className="flex gap-2">
              {[2, 3].map((n) => (
                <Button key={n} size="sm" variant={numEquations === n ? 'primary' : 'outline'} onClick={() => setNumEquations(n)}>{n} eq.</Button>
              ))}
              <Button size="sm" variant={showGame ? 'primary' : 'ghost'} icon={Gamepad2} onClick={() => setShowGame(!showGame)}>Mini-Game</Button>
            </div>
          </div>

          {showGame && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 mt-4"
            >
              <GameWrapper
                title="Solve the System"
                instructions="Set up and solve the system of equations"
                maxAttempts={5}
                rounds={5}
                scoring="accuracy"
              >
                {(props) => <SolveTheSystem {...props} />}
              </GameWrapper>
            </motion.div>
          )}

          {!showGame && (
            <>
            <div className="flex-1 min-h-0 rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--color-paper)' }}>
              <Grid2D>
                <svg width="100%" height="100%" viewBox="-6 -6 12 12" preserveAspectRatio="xMidYMid meet">
                  {equations.map((eq, i) => (
                    <motion.path
                      key={i}
                      d={getLinePath(getLineForEquation(eq), 12)}
                      stroke={colors[i]}
                      strokeWidth="0.08"
                      strokeDasharray="0.2 0.1"
                      fill="none"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.5, delay: i * 0.1 }}
                    />
                  ))}
                  {solutionType === 'unique' && intersection && (
                    <motion.g initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300 }}>
                      <circle cx={intersection.x} cy={-intersection.y} r="0.2" fill="oklch(52% 0.16 25)" />
                      <circle cx={intersection.x} cy={-intersection.y} r="0.3" fill="oklch(52% 0.16 25)" opacity="0.3">
                        <animate attributeName="r" values="0.3;0.5;0.3" dur="2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.3;0.1;0.3" dur="2s" repeatCount="indefinite" />
                      </circle>
                    </motion.g>
                  )}
                  {solutionType === 'none' && (
                    <text x="-2" y="0" fontSize="8" fill="oklch(52% 0.16 25)">No Solution</text>
                  )}
                  {solutionType === 'infinite' && (
                    <text x="-2" y="0" fontSize="8" fill="oklch(52% 0.16 155)">Infinite Solutions</text>
                  )}
                </svg>
              </Grid2D>
            </div>
            <div className="mt-3 space-y-2">
              {equations.map((eq, i) => (
                <div key={i} className="flex gap-2 items-center text-sm">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[i] }} />
                  <span style={{ color: 'var(--color-ink-2)' }}>
                    Eq {i + 1}: {eq.a}x + {eq.b}y = {eq.c}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 p-3 rounded-lg" style={solutionBadgeStyle}>
              <div className="flex items-center gap-2">
                {solutionBadgeStyle.icon}
                <span className="font-medium capitalize" style={{ color: 'var(--color-ink)' }}>{solutionType} Solution</span>
              </div>
              {solutionType === 'unique' && intersection && (
                <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
                  x = {intersection.x.toFixed(2)}, y = {intersection.y.toFixed(2)}
                </p>
              )}
            </div>
            </>
          )}
        </Card>

        <Card variant="default" className="flex flex-col">
          <h3 className="font-semibold mb-3" style={{ color: 'var(--color-ink)' }}>Formula Panel</h3>
          <div className="space-y-3 flex-1 overflow-auto">
            <div>
              <h4 className="text-xs font-medium mb-1" style={{ color: 'var(--color-muted)' }}>Matrix Form</h4>
              <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--color-paper-2)' }}>
                <FormulaRenderer expression={`\\begin{pmatrix} ${equations.map(e => e.a).join(' & ')} \\\\ ${equations.map(e => e.b).join(' & ')} \\end{pmatrix} \\begin{pmatrix} x \\\\ y \\end{pmatrix} = \\begin{pmatrix} ${equations.map(e => e.c).join(' \\\\ ')} \\end{pmatrix}`} displayMode />
              </div>
            </div>
            <div>
              <h4 className="text-xs font-medium mb-1" style={{ color: 'var(--color-muted)' }}>Augmented Matrix [A|b]</h4>
              <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--color-paper-2)', fontFamily: 'var(--font-mono)', fontSize: '0.875rem', color: 'var(--color-ink)' }}>
                <div className="flex gap-1">
                  <div className="flex flex-col gap-1">
                    {equations.map((eq, i) => (
                      <div key={i} className="flex gap-1">
                        <span className="w-6 text-center">{eq.a}</span>
                        <span className="w-6 text-center">{eq.b}</span>
                      </div>
                    ))}
                  </div>
                  <div className="w-px mx-1" style={{ backgroundColor: 'var(--color-rule)' }} />
                  <div className="flex flex-col gap-1">
                    {equations.map((eq, i) => <span key={i} className="w-6 text-center">{eq.c}</span>)}
                  </div>
                </div>
              </div>
            </div>
            {reductionSteps[reductionStep] && (
              <div>
                <h4 className="text-xs font-medium mb-1" style={{ color: 'var(--color-muted)' }}>Row Op: {reductionSteps[reductionStep].label}</h4>
                <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--color-paper-2)', fontFamily: 'var(--font-mono)', fontSize: '0.875rem' }}>
                  <div className="flex gap-1">
                    <div className="flex flex-col gap-1">
                      {reductionSteps[reductionStep].matrix.map((row, i) => (
                        <div key={i} className="flex gap-1">
                          <span className="w-6 text-center" style={{ color: i === 1 && reductionStep > 0 ? 'oklch(50% 0.12 235)' : 'var(--color-ink)' }}>{row[0].toFixed(1)}</span>
                          <span className="w-6 text-center" style={{ color: i === 1 && reductionStep > 0 ? 'oklch(50% 0.12 235)' : 'var(--color-ink)' }}>{row[1].toFixed(1)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="w-px mx-1" style={{ backgroundColor: 'var(--color-rule)' }} />
                    <div className="flex flex-col gap-1">
                      {reductionSteps[reductionStep].matrix.map((row, i) => (
                        <span key={i} className="w-6 text-center" style={{ color: i === 1 && reductionStep > 0 ? 'oklch(65% 0.10 70)' : 'var(--color-ink)' }}>{row[2].toFixed(1)}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 mt-2">
                  <Button size="sm" variant="ghost" onClick={() => setReductionStep(0)} disabled={reductionStep === 0}>Reset</Button>
                  <Button size="sm" variant="outline" onClick={() => setReductionStep(Math.min(reductionSteps.length - 1, reductionStep + 1))} disabled={reductionStep === reductionSteps.length - 1}>Next Step</Button>
                </div>
              </div>
            )}
            <div>
              <h4 className="text-xs font-medium mb-1" style={{ color: 'var(--color-muted)' }}>Solution Vector</h4>
              <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--color-paper-2)' }}>
                {solutionType === 'unique' && intersection ? (
                  <FormulaRenderer expression={`\\vec{x} = \\begin{pmatrix} ${intersection.x.toFixed(2)} \\\\ ${intersection.y.toFixed(2)} \\end{pmatrix}`} displayMode />
                ) : solutionType === 'infinite' ? (
                  <span style={{ color: 'oklch(52% 0.16 155)' }}>Infinitely many solutions</span>
                ) : solutionType === 'none' ? (
                  <span style={{ color: 'oklch(52% 0.16 25)' }}>No solution exists</span>
                ) : (
                  <span className="text-sm" style={{ color: 'var(--color-muted)' }}>Add 2+ equations to solve</span>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div
        className="px-6 py-2 text-sm flex items-center justify-center gap-4 border-t"
        style={{
          backgroundColor: 'var(--color-paper-2)',
          borderColor: 'var(--color-rule)',
          color: 'var(--color-muted)',
        }}
      >
        <span>Lines intersect at the solution</span>
        <span>•</span>
        <CompletionToggle moduleId={5} />
      </div>
    </div>
  );
}