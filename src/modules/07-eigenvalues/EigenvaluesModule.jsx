import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, Target, Trophy, X, Check, Sparkles, Zap, Info, Gamepad2 } from 'lucide-react';
import { Button } from '../../components/UI/Button';
import { useStore } from '../../store/useStore';
import CompletionToggle from '../../components/UI/CompletionToggle';
import { Card } from '../../components/UI/Card';
import { eigenvalues2x2, eigenvectors2x2, det2x2 } from '../../utils/linalg';
import { GuidedStepper } from '../../components/Shell/GuidedStepper';
import GameWrapper from '../../components/MiniGame/GameWrapper';
import EigenHunt from '../../games/EigenHunt';

function applyTransformation(v, A) {
  return [
    A[0][0] * v[0] + A[0][1] * v[1],
    A[1][0] * v[0] + A[1][1] * v[1],
  ];
}

export default function EigenvaluesModule() {
  const { currentModule } = useStore();
  const [matrixA, setMatrixA] = useState([
    [2, 1],
    [1, 2],
  ]);
  const [showGuided, setShowGuided] = useState(false);
  const [showGame, setShowGame] = useState(false);
  const [computedEigenvalues, setComputedEigenvalues] = useState(null);
  const [showPolynomial, setShowPolynomial] = useState(false);
  const [polynomialStep, setPolynomialStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

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

  const eigenvalues = useMemo(() => {
    try {
      return eigenvalues2x2(matrixA);
    } catch (e) {
      return null;
    }
  }, [matrixA]);

  const trace = matrixA[0][0] + matrixA[1][1];
  const determinant = det2x2(matrixA);

  const updateMatrixCell = useCallback((row, col, value) => {
    const num = parseFloat(value) || 0;
    setMatrixA((prev) => {
      const newMatrix = prev.map((r) => [...r]);
      newMatrix[row][col] = num;
      return newMatrix;
    });
  }, []);

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

  const VectorCanvas = () => (
    <div
      className="relative w-full aspect-square rounded-xl overflow-hidden"
      style={{
        backgroundColor: 'var(--color-paper)',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--color-rule)',
      }}
    >
      <svg
        viewBox="-3 -3 6 6"
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <pattern id="eigen-grid" width="0.5" height="0.5" patternUnits="userSpaceOnUse">
            <path d="M 0.5 0 L 0.5 0.5 M 0 0.5 L 0.5 0.5" stroke="var(--color-rule)" strokeWidth="0.02" />
          </pattern>
          <marker id="eigen-arrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="var(--color-accent)" />
          </marker>
          <marker id="eigen-arrow-gold" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="oklch(65% 0.10 70)" />
          </marker>
        </defs>

        <rect x="-3" y="-3" width="6" height="6" fill="url(#eigen-grid)" />
        <line x1="-3" y1="0" x2="3" y2="0" stroke="var(--color-ink-2)" strokeWidth="0.02" />
        <line x1="0" y1="-3" x2="0" y2="3" stroke="var(--color-ink-2)" strokeWidth="0.02" />

        <g>
          {sampleVectors.map((v, i) => {
            const Av = applyTransformation(v, matrixA);
            const isEigen = eigenvecs.some(
              (ev) => Math.abs(ev[0] * v[1] - ev[1] * v[0]) < 0.1
            );
            const color = isEigen ? 'oklch(65% 0.10 70)' : 'var(--color-accent)';

            return (
              <g key={i}>
                <motion.line
                  initial={{ x1: 0, y1: 0 }}
                  animate={{ x1: v[0], y1: v[1] }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                  stroke="var(--color-muted)"
                  strokeWidth="0.03"
                  strokeDasharray="0.1 0.05"
                />
                <motion.circle
                  cx={v[0]}
                  cy={v[1]}
                  r="0.08"
                  fill="var(--color-muted)"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                />
                <motion.line
                  initial={{ x1: 0, y1: 0, x2: 0, y2: 0 }}
                  animate={{ x2: Av[0], y2: Av[1] }}
                  transition={{ duration: 0.5, delay: 0.3 + i * 0.05 }}
                  stroke={color}
                  strokeWidth="0.05"
                  markerEnd={isEigen ? 'url(#eigen-arrow-gold)' : 'url(#eigen-arrow)'}
                />
                <motion.circle
                  cx={Av[0]}
                  cy={Av[1]}
                  r="0.1"
                  fill={color}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                />
              </g>
            );
          })}
        </g>

        {eigenvecs.map((ev, i) => {
          const scaled = ev.map((c) => c * 2.5);
          const scaledNeg = ev.map((c) => -c * 2.5);
          return (
            <g key={`eigen-${i}`}>
              <motion.line
                x1={scaledNeg[0]}
                y1={scaledNeg[1]}
                x2={scaled[0]}
                y2={scaled[1]}
                stroke="oklch(65% 0.10 70)"
                strokeWidth="0.08"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1 }}
              />
              <motion.circle
                cx={scaled[0]}
                cy={scaled[1]}
                r="0.12"
                fill="oklch(65% 0.10 70)"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5 }}
              />
              <path
                d={`M ${scaledNeg[0]} ${scaledNeg[1]} L ${-scaledNeg[0] * 0.3 - scaledNeg[1] * 0.15} ${-scaledNeg[1] * 0.3 + scaledNeg[0] * 0.15} L ${-scaledNeg[0] * 0.3 + scaledNeg[1] * 0.15} ${-scaledNeg[1] * 0.3 - scaledNeg[0] * 0.15} Z`}
                fill="oklch(65% 0.10 70)"
              />
            </g>
          );
        })}
      </svg>

      {eigenvecs.length > 0 && (
        <div
          className="absolute top-2 right-2 px-3 py-1.5 rounded-lg"
          style={{
            backgroundColor: 'rgba(200,155,50,0.15)',
            border: '1px solid oklch(65% 0.10 70)',
          }}
        >
          <p className="text-xs font-semibold" style={{ color: 'oklch(65% 0.10 70)' }}>
            Eigenvectors (amber)
          </p>
        </div>
      )}
    </div>
  );

  const steps = [
    { label: 'Start', formula: 'det(A - λI) = 0' },
    { label: 'Substitute A', formula: `det([${matrixA[0][0].toFixed(1)} λ; ${matrixA[1][0].toFixed(1)} ${matrixA[1][1].toFixed(1)} - λ]) = 0` },
    { label: 'Compute det', formula: `${matrixA[0][0].toFixed(1)} × ${matrixA[1][1].toFixed(1)} - ${matrixA[0][1].toFixed(1)} × ${matrixA[1][0].toFixed(1)} - λ² = 0` },
    { label: 'Simplify', formula: `λ² - ${trace.toFixed(2)}λ + ${determinant.toFixed(2)} = 0` },
    {
      label: 'Solve',
      formula: computedEigenvalues && !computedEigenvalues.every((ev) => ev.isComplex)
        ? `λ₁ = ${computedEigenvalues[0].value.toFixed(2)}, λ₂ = ${computedEigenvalues[1]?.value.toFixed(2) || 'N/A'}`
        : `λ = (tr(A) ± √Δ) / 2`,
    },
  ];

  const CharacteristicPolynomialAnimation = () => {
    if (!showPolynomial || !computedEigenvalues) return null;
    return (
      <Card variant="outline" className="p-4 mt-4">
        <h4 className="font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--color-ink-2)' }}>
          <Sparkles className="w-4 h-4" style={{ color: 'oklch(65% 0.10 70)' }} />
          Characteristic Polynomial
        </h4>
        <div className="space-y-2">
          {steps.slice(0, polynomialStep + 1).map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-3 rounded-lg"
              style={
                i === polynomialStep
                  ? { backgroundColor: 'rgba(80,130,200,0.10)', border: '1.5px solid oklch(50% 0.12 235)' }
                  : { backgroundColor: 'var(--color-paper-2)' }
              }
            >
              <p className="text-xs font-medium mb-1" style={{ color: 'oklch(50% 0.12 235)' }}>
                {step.label}
              </p>
              <code className="text-sm font-mono" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-ink)' }}>
                {step.formula}
              </code>
            </motion.div>
          ))}
        </div>
        <div className="flex gap-2 mt-4">
          <Button variant="ghost" size="sm" icon={RotateCcw} onClick={() => { setPolynomialStep(0); setIsAnimating(false); }}>
            Reset
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={isAnimating ? Pause : Play}
            onClick={() => setIsAnimating(!isAnimating)}
          >
            {isAnimating ? 'Pause' : 'Animate'}
          </Button>
        </div>
      </Card>
    );
  };

  const FormulaPanel = () => {
    const formulas = [
      { title: 'Eigenvalue Definition', formula: 'Av = λv', description: 'A vector v is an eigenvector if A only scales it (no rotation)' },
      { title: 'Characteristic Equation', formula: 'det(A - λI) = 0', description: 'Set the determinant of (A - λI) to zero to find eigenvalues' },
      { title: 'Characteristic Polynomial', formula: `λ² - ${trace.toFixed(2)}λ + ${determinant.toFixed(2)} = 0`, description: 'Expanding gives trace = tr(A), constant = det(A)' },
      { title: 'Quadratic Formula', formula: 'λ = (tr(A) ± √(tr(A)² - 4det(A))) / 2', description: 'Solve for λ using the quadratic formula' },
      { title: 'Diagonalization', formula: 'A = PDP⁻¹', description: 'D is diagonal with eigenvalues, P has eigenvectors as columns' },
    ];
    return (
      <div className="h-full overflow-y-auto p-4 space-y-4">
        <h3 className="text-lg font-semibold" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-display)' }}>Formulas</h3>
        {formulas.map((f, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card variant="outline" className="p-4">
              <h4 className="font-semibold mb-2" style={{ color: 'var(--color-ink-2)' }}>{f.title}</h4>
              <div className="p-3 rounded-lg mb-2 overflow-x-auto" style={{ backgroundColor: 'var(--color-paper-2)' }}>
                <code className="text-sm font-mono whitespace-pre" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-ink)' }}>
                  {f.formula}
                </code>
              </div>
              <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{f.description}</p>
            </Card>
          </motion.div>
        ))}
      </div>
    );
  };

  const EigenHuntGame = () => {
    const [gameState, setGameState] = useState('playing');
    const [score, setScore] = useState(0);
    const [rounds, setRounds] = useState(0);
    const [userInput, setUserInput] = useState({ lambda1: '', lambda2: '' });
    const [feedback, setFeedback] = useState(null);

    const gameMatrix = useRef([
      [1, 2],
      [3, 1],
    ]);

    const newRound = useCallback(() => {
      const a = Math.floor(Math.random() * 4) - 2;
      const b = Math.floor(Math.random() * 4) - 2;
      const c = Math.floor(Math.random() * 4) - 2;
      const d = Math.floor(Math.random() * 4) - 2;
      gameMatrix.current = [
        [a || 1, b],
        [c, d || 1],
      ];
      setMatrixA(gameMatrix.current);
      setUserInput({ lambda1: '', lambda2: '' });
      setFeedback(null);
      setGameState('playing');
    }, []);

    useEffect(() => {
      newRound();
    }, []);

    const checkAnswer = () => {
      const evs = eigenvalues2x2(gameMatrix.current);
      if (evs.some((e) => e.isComplex)) {
        setFeedback({ correct: false, message: 'Complex eigenvalues — try another!' });
        return;
      }
      const user1 = parseFloat(userInput.lambda1);
      const user2 = parseFloat(userInput.lambda2);
      const [ev1, ev2] = [evs[0].value, evs[1]?.value].sort((a, b) => a - b);
      if (
        (Math.abs(user1 - ev1) < 0.1 && Math.abs(user2 - ev2) < 0.1) ||
        (Math.abs(user1 - ev2) < 0.1 && Math.abs(user2 - ev1) < 0.1)
      ) {
        setScore((s) => s + 1);
        setRounds((r) => r + 1);
        setFeedback({ correct: true, message: 'Correct! Well done!' });
        setTimeout(() => {
          setGameState('next');
          setFeedback(null);
        }, 1500);
      } else {
        setFeedback({
          correct: false,
          message: `Not quite! λ₁=${ev1.toFixed(2)}, λ₂=${ev2.toFixed(2)}`,
        });
        setRounds((r) => r + 1);
      }
    };

    if (gameState === 'start') {
      return (
        <div className="p-6 text-center">
          <Trophy className="w-12 h-12 mx-auto mb-4" style={{ color: 'oklch(65% 0.10 70)' }} />
          <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-display)' }}>EigenHunt</h3>
          <p className="mb-6" style={{ color: 'var(--color-muted)' }}>
            Guess the eigenvalues of the displayed matrix!
          </p>
          <Button variant="primary" size="lg" icon={Play} onClick={() => newRound()}>
            Start Hunt
          </Button>
        </div>
      );
    }

    return (
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold flex items-center gap-2" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-display)' }}>
            <Target className="w-5 h-5" style={{ color: 'oklch(52% 0.16 25)' }} />
            EigenHunt
          </h3>
          <div className="flex gap-4 text-sm">
            <span style={{ color: 'oklch(52% 0.16 155)', fontWeight: 600 }}>Score: {score}</span>
            <span style={{ color: 'var(--color-muted)' }}>Rounds: {rounds}</span>
          </div>
        </div>

        <div className="rounded-xl p-4 mb-4" style={{ backgroundColor: 'var(--color-paper-2)', border: '1px solid var(--color-rule)' }}>
          <p className="text-sm mb-2 text-center" style={{ color: 'var(--color-muted)' }}>
            Guess the eigenvalues of:
          </p>
          <div className="flex justify-center gap-1">
            {gameMatrix.current.map((row, i) => (
              <div key={i} className="flex flex-col gap-1">
                {row.map((val, j) => (
                  <div
                    key={j}
                    className="w-12 h-12 flex items-center justify-center rounded-lg"
                    style={{
                      backgroundColor: 'var(--color-paper)',
                      border: '1.5px solid var(--color-rule)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '1.125rem',
                      color: 'var(--color-ink)',
                    }}
                  >
                    {val}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 mb-4">
          {['lambda1', 'lambda2'].map((key, idx) => (
            <div key={key} className="flex-1">
              <label className="text-xs mb-1 block" style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
                λ{idx + 1}
              </label>
              <input
                type="number"
                step="0.1"
                value={userInput[key]}
                onChange={(e) => setUserInput((prev) => ({ ...prev, [key]: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--color-rule)',
                  backgroundColor: 'var(--color-paper)',
                  color: 'var(--color-ink)',
                  fontFamily: 'var(--font-mono)',
                  outline: 'none',
                }}
                placeholder="0.0"
              />
            </div>
          ))}
        </div>

        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-lg mb-4 text-center"
            style={
              feedback.correct
                ? { backgroundColor: 'rgba(75,180,140,0.12)', color: 'oklch(52% 0.16 155)' }
                : { backgroundColor: 'rgba(220,75,55,0.08)', color: 'oklch(52% 0.16 25)' }
            }
          >
            <div className="flex items-center justify-center gap-2">
              {feedback.correct ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
              <span className="font-medium">{feedback.message}</span>
            </div>
          </motion.div>
        )}

        <div className="flex gap-2">
          <Button variant="ghost" size="sm" icon={RotateCcw} onClick={newRound} className="flex-1">
            New Matrix
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Check}
            onClick={checkAnswer}
            className="flex-1"
            disabled={!userInput.lambda1 || !userInput.lambda2}
          >
            Check
          </Button>
        </div>
      </div>
    );
  };

  if (showGuided) {
    return (
      <div className="h-full">
        <GuidedStepper />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col lg:flex-row gap-4 p-4">
      <div className="flex-1 lg:w-1/2 space-y-4 overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-display)' }}>
            Eigenvalues & Eigenvectors
          </h2>
          <Button
            variant="ghost"
            size="sm"
            icon={Info}
            onClick={() => setShowGuided(true)}
          >
            Guided Mode
          </Button>
          <Button
            variant={showGame ? 'primary' : 'ghost'}
            size="sm"
            icon={Gamepad2}
            onClick={() => setShowGame(!showGame)}
          >
            Mini-Game
          </Button>
        </div>

        {showGame && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 mt-4"
          >
            <GameWrapper
              title="Eigen Hunt"
              instructions="Click on the eigenvectors — vectors that only scale under transformation"
              maxAttempts={5}
              rounds={5}
              scoring="accuracy"
            >
              {(props) => <EigenHunt {...props} />}
            </GameWrapper>
          </motion.div>
        )}

        {!showGame && (
        <div className="grid grid-cols-2 gap-3">
          <Card variant="outline" padding="sm">
            <p className="text-xs mb-1" style={{ color: 'var(--color-muted)' }}>Matrix A</p>
            <div className="flex gap-1">
              {[0, 1].map((i) =>
                [0, 1].map((j) => (
                  <input
                    key={`${i}-${j}`}
                    type="number"
                    value={matrixA[i][j]}
                    onChange={(e) => updateMatrixCell(i, j, e.target.value)}
                    style={{
                      width: 40,
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
          </Card>

          <Card variant="outline" padding="sm">
            <p className="text-xs mb-1" style={{ color: 'var(--color-muted)' }}>Matrix Info</p>
            <div className="space-y-1">
              <div className="flex justify-between text-xs" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-ink)' }}>
                <span style={{ color: 'var(--color-muted)' }}>tr(A)</span>
                <span>{trace.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-ink)' }}>
                <span style={{ color: 'var(--color-muted)' }}>det(A)</span>
                <span>{determinant.toFixed(2)}</span>
              </div>
            </div>
          </Card>
        </div>
        )}

        <VectorCanvas />

        <Card variant="outline" className="p-4">
          <h4 className="font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--color-ink-2)' }}>
            <Zap className="w-4 h-4" style={{ color: 'oklch(65% 0.10 70)' }} />
            Eigenvalues
          </h4>
          {eigenvalues ? (
            <div className="flex gap-4">
              {!eigenvalues.every((e) => e.isComplex) ? (
                eigenvalues.map((ev, i) => (
                  <div key={i} className="flex-1 p-3 rounded-lg text-center" style={{ backgroundColor: 'rgba(80,130,200,0.08)' }}>
                    <p className="text-xs mb-1" style={{ color: 'oklch(50% 0.12 235)' }}>λ{i + 1}</p>
                    <p className="text-xl font-bold font-mono" style={{ fontFamily: 'var(--font-mono)', color: 'oklch(50% 0.12 235)' }}>
                      {ev.isComplex
                        ? `${ev.re.toFixed(2)} ± ${ev.im.toFixed(2)}i`
                        : ev.value.toFixed(2)}
                    </p>
                    {!ev.isComplex && (
                      <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
                        Stretch by {ev.value.toFixed(2)}×
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <div className="flex-1 p-3 rounded-lg text-center" style={{ backgroundColor: 'rgba(200,155,50,0.08)' }}>
                  <p className="text-sm" style={{ color: 'oklch(65% 0.10 70)' }}>
                    Complex eigenvalues (rotation without scaling)
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Unable to compute</p>
          )}
          <Button
            variant="primary"
            size="sm"
            icon={Sparkles}
            onClick={computeEigenvalues}
            className="w-full mt-3"
          >
            Compute Eigenvalues
          </Button>
          <CharacteristicPolynomialAnimation />
        </Card>

        <Card variant="outline">
          <EigenHuntGame />
        </Card>
      </div>

      <div className="lg:w-1/2 lg:max-w-md">
        <FormulaPanel />
      </div>

      <div
        className="px-6 py-2 text-sm flex items-center justify-center gap-4 border-t"
        style={{
          backgroundColor: 'var(--color-paper-2)',
          borderColor: 'var(--color-rule)',
          color: 'var(--color-muted)',
        }}
      >
        <span>Eigenvectors stay on their lines</span>
        <span>•</span>
        <CompletionToggle moduleId={7} />
      </div>
    </div>
  );
}