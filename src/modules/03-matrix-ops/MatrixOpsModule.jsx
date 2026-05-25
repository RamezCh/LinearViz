import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, X, RotateCcw, Calculator, Play, Pause, SkipForward, Info, Gamepad2 } from 'lucide-react';
import { useStore } from '../../store/useStore';
import CompletionToggle from '../../components/UI/CompletionToggle';
import { Button } from '../../components/UI/Button';
import { add, subtract, multiply, transpose, inverse2x2, identity, det2x2 } from '../../utils/linalg';
import GameWrapper from '../../components/MiniGame/GameWrapper';
import FillTheProduct from '../../games/FillTheProduct';

export default function MatrixOpsModule() {
  const { currentModule } = useStore();
  const [matrixA, setMatrixA] = useState([
    [2, 1],
    [1, 3],
  ]);
  const [matrixB, setMatrixB] = useState([
    [1, -1],
    [2, 1],
  ]);
  const [operation, setOperation] = useState('add');
  const [showGuided, setShowGuided] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [showGame, setShowGame] = useState(false);
  const [animationStep, setAnimationStep] = useState(-1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [inverseSteps, setInverseSteps] = useState([]);
  const [multiplySteps, setMultiplySteps] = useState([]);

  const resultMatrix = useMemo(() => {
    try {
      switch (operation) {
        case 'add':
          return add(matrixA, matrixB);
        case 'subtract':
          return subtract(matrixA, matrixB);
        case 'multiply':
          return multiply(matrixA, matrixB);
        case 'transpose':
          return transpose(matrixA);
        case 'inverse':
          return inverse2x2(matrixA);
        default:
          return null;
      }
    } catch (e) {
      return null;
    }
  }, [matrixA, matrixB, operation]);

  const canInverse = useMemo(() => {
    return det2x2(matrixA) !== 0;
  }, [matrixA]);

  const updateMatrixCell = useCallback((matrix, setMatrix, row, col, value) => {
    const num = parseFloat(value) || 0;
    setMatrix((prev) => {
      const newMatrix = prev.map((r) => [...r]);
      newMatrix[row][col] = num;
      return newMatrix;
    });
  }, []);

  const generateMultiplySteps = useCallback(() => {
    if (operation !== 'multiply') return;
    const steps = [];
    for (let i = 0; i < matrixA.length; i++) {
      for (let j = 0; j < matrixB[0].length; j++) {
        const products = [];
        for (let k = 0; k < matrixA[0].length; k++) {
          products.push({
            aVal: matrixA[i][k],
            bVal: matrixB[k][j],
            aPos: [i, k],
            bPos: [k, j],
          });
        }
        const sum = products.reduce((acc, p) => acc + p.aVal * p.bVal, 0);
        steps.push({ i, j, products, sum, result: sum });
      }
    }
    setMultiplySteps(steps);
  }, [matrixA, matrixB, operation]);

  const generateInverseSteps = useCallback(() => {
    if (operation !== 'inverse') return;
    const I = identity(2);
    const augmented = matrixA.map((row, i) => [...row, ...I[i]]);
    const steps = [{ matrix: augmented.map((r) => [...r]), description: 'Start with [A|I]', highlight: [] }];

    const a = augmented[0][0];
    const b = augmented[0][1];
    const c = augmented[1][0];
    const d = augmented[1][1];

    if (Math.abs(a) > 1e-10) {
      const factor = d - (c * b) / a;
      const scale = 1 / a;
      steps.push({
        matrix: [[1, b / a, scale, 0], [c, d, -c * scale, 1]],
        description: `Divide row 1 by ${a.toFixed(2)} to make pivot 1`,
        highlight: [[0, 0]],
        operation: 'scale',
        row: 0,
        factor: scale,
      });

      const newRow1 = [c, d, -c * scale, 1];
      const newRow0 = [1, b / a, scale, 0];
      steps.push({
        matrix: [[1, b / a, scale, 0], [0, factor, -c * scale * b / a + newRow1[2], -c * scale]],
        description: 'Eliminate below pivot',
        highlight: [[1, 0]],
        operation: 'eliminate',
        row: 1,
        factor: c,
      });

      if (Math.abs(factor) > 1e-10) {
        const scaleFactor = 1 / factor;
        steps.push({
          matrix: [[1, b / a, scale, 0], [0, 1, (newRow1[2]) * scaleFactor, -c * scale * scaleFactor]],
          description: `Scale row 2 by ${factor.toFixed(2)}`,
          highlight: [[1, 1]],
          operation: 'scale',
          row: 1,
          factor: scaleFactor,
        });

        const invDet = 1 / (a * d - b * c);
        steps.push({
          matrix: [[1, 0, (d) * invDet, (-b) * invDet], [0, 1, (-c) * invDet, (a) * invDet]],
          description: 'Back-substitute to get A⁻¹',
          highlight: [],
          operation: 'done',
        });
      }
    }
    setInverseSteps(steps);
  }, [matrixA, operation]);

  useEffect(() => {
    setAnimationStep(-1);
    if (operation === 'multiply') {
      generateMultiplySteps();
    } else if (operation === 'inverse') {
      generateInverseSteps();
    }
  }, [operation, matrixA, matrixB, generateMultiplySteps, generateInverseSteps]);

  const playAnimation = () => setIsAnimating(true);
  const pauseAnimation = () => setIsAnimating(false);
  const stepForward = () => {
    setAnimationStep((prev) => {
      const maxSteps = operation === 'multiply' ? multiplySteps.length : inverseSteps.length;
      return Math.min(prev + 1, maxSteps - 1);
    });
  };
  const resetAnimation = () => {
    setAnimationStep(-1);
    setIsAnimating(false);
  };

  useEffect(() => {
    if (!isAnimating) return;
    const maxSteps = operation === 'multiply' ? multiplySteps.length : inverseSteps.length;
    if (animationStep >= maxSteps - 1) {
      setIsAnimating(false);
      return;
    }
    const timer = setTimeout(() => {
      setAnimationStep((prev) => Math.min(prev + 1, maxSteps - 1));
    }, 1000);
    return () => clearTimeout(timer);
  }, [isAnimating, animationStep, operation, multiplySteps.length, inverseSteps.length]);

  const steps = [
    {
      title: 'Matrix Addition',
      concept: 'Matrix addition adds corresponding elements: each cell in C equals A plus B at that position. The matrices must be the same size!',
      hint: 'Try changing values in matrices A and B to see the result update.',
      action: 'Edit the values in matrices A and B',
    },
    {
      title: 'Matrix Subtraction',
      concept: 'Subtraction works the same way — subtract corresponding elements. A - B tells you how different the matrices are at each position.',
      hint: 'Click "Subtract" to see element-wise subtraction.',
      action: 'Click Subtract and compare to addition',
    },
    {
      title: 'Matrix Multiplication',
      concept: 'Multiplication is more complex: each element C[i][j] is the dot product of row i from A and column j from B. Watch the animation below!',
      hint: 'The animation shows how row × column products sum up.',
      action: 'Watch the dot product animation',
    },
    {
      title: 'Transpose',
      concept: 'The transpose flips the matrix over its diagonal — rows become columns. The (i,j) element of A^T equals the (j,i) element of A.',
      hint: 'A^T swaps row and column positions.',
      action: 'Click Transpose and compare A to Aᵀ',
    },
    {
      title: 'Matrix Inverse',
      concept: 'The inverse A⁻¹ undoes what A does — multiplying A × A⁻¹ gives the identity matrix. Only matrices with non-zero determinant have inverses.',
      hint: 'Watch Gaussian elimination step by step!',
      action: 'Click Inverse and step through elimination',
    },
  ];

  const MatrixGrid = ({ matrix, onChange, editable = true, label }) => (
    <div className="flex flex-col items-center">
      <p className="text-xs font-semibold mb-1" style={{ color: 'var(--color-muted)' }}>{label}</p>
      <div className="grid gap-1">
        {matrix.map((row, i) => (
          <div key={i} className="flex gap-1">
            {row.map((val, j) => (
              <motion.div
                key={`${i}-${j}`}
                whileHover={editable ? { scale: 1.05 } : {}}
                style={{
                  width: 48,
                  height: 48,
                  backgroundColor: 'var(--color-paper)',
                  border: `1.5px solid var(--color-rule)`,
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: editable ? 'pointer' : 'default',
                  transition: 'all 200ms ease-out',
                }}
                onClick={() => {
                  if (editable && onChange) {
                    const newVal = prompt(`Enter value for [${i}][${j}]`, val);
                    if (newVal !== null) onChange(i, j, newVal);
                  }
                }}
              >
                {typeof val === 'number' ? val.toFixed(1) : val}
              </motion.div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );

  const DotProductAnimation = ({ step }) => {
    if (!step) return null;
    return (
      <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(75,160,195,0.06)' }}>
        <p className="text-xs font-medium mb-2 text-center" style={{ color: 'var(--color-ink)' }}>
          Computing C[{step.i}][{step.j}] = Σ A[{step.i},k] × B[k,{step.j}]
        </p>
        <div className="flex justify-center items-center gap-2 mb-3">
          <div className="text-center">
            <p className="text-xs mb-1" style={{ color: 'oklch(50% 0.12 235)' }}>Row {step.i}</p>
            <div className="flex gap-1">
              {step.products.map((p, idx) => (
                <div key={idx} style={{
                  width: 36,
                  height: 36,
                  backgroundColor: 'rgba(80,130,200,0.15)',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  color: 'oklch(50% 0.12 235)',
                }}>
                  {p.aVal.toFixed(1)}
                </div>
              ))}
            </div>
          </div>
          <span className="text-xl font-bold" style={{ color: 'var(--color-muted)' }}>×</span>
          <div className="text-center">
            <p className="text-xs mb-1" style={{ color: 'oklch(65% 0.10 70)' }}>Col {step.j}</p>
            <div className="flex gap-1 flex-col">
              {step.products.map((p, idx) => (
                <div key={idx} style={{
                  width: 36,
                  height: 36,
                  backgroundColor: 'rgba(200,155,50,0.15)',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  color: 'oklch(65% 0.10 70)',
                }}>
                  {p.bVal.toFixed(1)}
                </div>
              ))}
            </div>
          </div>
          <span className="text-xl font-bold" style={{ color: 'var(--color-muted)' }}>=</span>
          <div style={{
            width: 48,
            height: 48,
            backgroundColor: 'var(--color-accent)',
            color: 'var(--color-paper)',
            borderRadius: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-mono)',
            fontSize: '1rem',
            fontWeight: 700,
          }}>
            {step.sum.toFixed(1)}
          </div>
        </div>
        <p className="text-center text-xs" style={{ color: 'var(--color-muted)' }}>
          = {step.products.map(p => `(${p.aVal}×${p.bVal})`).join(' + ')} = <span className="font-bold" style={{ color: 'var(--color-accent)' }}>{step.sum.toFixed(2)}</span>
        </p>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Top Control Bar */}
      <div
        className="flex items-center gap-2 px-3 py-2 border-b flex-shrink-0 flex-wrap"
        style={{
          backgroundColor: 'var(--color-paper)',
          borderColor: 'var(--color-rule)',
        }}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant={operation === 'add' ? 'primary' : 'ghost'}
            size="sm"
            icon={Plus}
            onClick={() => setOperation('add')}
          >
            Add
          </Button>
          <Button
            variant={operation === 'subtract' ? 'primary' : 'ghost'}
            size="sm"
            icon={Minus}
            onClick={() => setOperation('subtract')}
          >
            Subtract
          </Button>
          <Button
            variant={operation === 'multiply' ? 'primary' : 'ghost'}
            size="sm"
            icon={X}
            onClick={() => setOperation('multiply')}
          >
            Multiply
          </Button>
          <Button
            variant={operation === 'transpose' ? 'primary' : 'ghost'}
            size="sm"
            icon={RotateCcw}
            onClick={() => setOperation('transpose')}
          >
            Transpose
          </Button>
          <Button
            variant={operation === 'inverse' ? 'primary' : 'ghost'}
            size="sm"
            icon={Calculator}
            onClick={() => setOperation('inverse')}
            disabled={!canInverse}
            title={!canInverse ? 'Matrix must have non-zero determinant' : ''}
          >
            Inverse
          </Button>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          <Button
            variant={showGuided ? 'primary' : 'ghost'}
            size="sm"
            icon={Info}
            onClick={() => setShowGuided(!showGuided)}
          >
            Learn
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
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Guided Learning Card */}
        {showGuided && (
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
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Left Panel */}
          <div className="flex-1 p-4 overflow-y-auto">
            {showGame ? (
              <GameWrapper
                title="Fill the Product"
                instructions="Given matrices A and B, calculate C = A × B"
                maxAttempts={5}
                rounds={5}
                scoring="accuracy"
                showTimer={true}
                timerDuration={30}
              >
                {(props) => <FillTheProduct {...props} />}
              </GameWrapper>
            ) : (
              <>
                {/* Matrices Display */}
                <div className="flex flex-wrap justify-center items-start gap-4 mb-4">
                  {operation === 'inverse' ? (
                    <div className="flex flex-col items-center gap-4">
                      <MatrixGrid
                        matrix={matrixA}
                        onChange={(i, j, v) => updateMatrixCell(matrixA, setMatrixA, i, j, v)}
                        editable={true}
                        label="A"
                      />
                      <p className="text-xs" style={{ color: 'var(--color-accent)' }}>Click to edit</p>
                    </div>
                  ) : (
                    <>
                      <MatrixGrid
                        matrix={matrixA}
                        onChange={(i, j, v) => updateMatrixCell(matrixA, setMatrixA, i, j, v)}
                        editable={true}
                        label="A"
                      />
                      <div className="flex flex-col items-center justify-center gap-4">
                        <span className="text-3xl font-bold" style={{ color: 'var(--color-muted)' }}>
                          {operation === 'add' ? '+' : operation === 'subtract' ? '−' : operation === 'multiply' ? '×' : operation === 'transpose' ? 'ᵀ' : '⁻¹'}
                        </span>
                        {operation === 'transpose' && (
                          <p className="text-xs" style={{ color: 'var(--color-accent)' }}>A → Aᵀ</p>
                        )}
                        {operation === 'inverse' && (
                          <p className="text-xs" style={{ color: 'var(--color-accent)' }}>A → A⁻¹</p>
                        )}
                      </div>
                      <MatrixGrid
                        matrix={matrixB}
                        onChange={(i, j, v) => updateMatrixCell(matrixB, setMatrixB, i, j, v)}
                        editable={operation !== 'inverse' && operation !== 'transpose'}
                        label="B"
                      />
                    </>
                  )}
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold" style={{ color: 'var(--color-muted)' }}>=</span>
                  </div>
                  <div
                    className="rounded-xl p-4"
                    style={{
                      backgroundColor: 'rgba(75,160,195,0.08)',
                      border: '1.5px solid var(--color-accent)',
                    }}
                  >
                    <MatrixGrid
                      matrix={resultMatrix || [[0, 0], [0, 0]]}
                      editable={false}
                      label="C"
                    />
                  </div>
                </div>

                {/* Animation for Multiply */}
                {operation === 'multiply' && multiplySteps.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-sm" style={{ color: 'var(--color-ink-2)' }}>Step Through</h4>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="xs" onClick={resetAnimation}>Reset</Button>
                        <Button variant="ghost" size="xs" icon={isAnimating ? Pause : Play} onClick={isAnimating ? pauseAnimation : playAnimation}>
                          {isAnimating ? 'Pause' : 'Play'}
                        </Button>
                        <Button variant="ghost" size="xs" icon={SkipForward} onClick={stepForward} disabled={animationStep >= multiplySteps.length - 1}>
                          Step
                        </Button>
                      </div>
                    </div>
                    {animationStep >= 0 && animationStep < multiplySteps.length ? (
                      <div>
                        <DotProductAnimation step={multiplySteps[animationStep]} />
                        <div className="flex justify-center gap-2 mt-4">
                          {multiplySteps.map((_, idx) => (
                            <button
                              key={idx}
                              onClick={() => setAnimationStep(idx)}
                              className="w-3 h-3 rounded-full transition-all"
                              style={{
                                backgroundColor: idx === animationStep ? 'var(--color-accent)' : idx < animationStep ? 'rgba(75,160,195,0.5)' : 'var(--color-rule)',
                                transform: idx === animationStep ? 'scale(1.25)' : 'scale(1)',
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-center py-4" style={{ color: 'var(--color-muted)' }}>
                        Press Play or click Step to see how matrix multiplication works
                      </p>
                    )}
                  </div>
                )}

                {/* Animation for Inverse */}
                {operation === 'inverse' && inverseSteps.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-sm" style={{ color: 'var(--color-ink-2)' }}>Gaussian Elimination</h4>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="xs" onClick={resetAnimation}>Reset</Button>
                        <Button variant="ghost" size="xs" icon={isAnimating ? Pause : Play} onClick={isAnimating ? pauseAnimation : playAnimation}>
                          {isAnimating ? 'Pause' : 'Play'}
                        </Button>
                        <Button variant="ghost" size="xs" icon={SkipForward} onClick={stepForward} disabled={animationStep >= inverseSteps.length - 1}>
                          Step
                        </Button>
                      </div>
                    </div>
                    {inverseSteps.map((step, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{
                          opacity: animationStep >= idx ? 1 : 0.3,
                          x: 0,
                        }}
                        className="p-3 rounded-lg mb-2 cursor-pointer"
                        style={idx === animationStep
                          ? { backgroundColor: 'rgba(80,130,200,0.10)', border: '1.5px solid oklch(50% 0.12 235)' }
                          : { backgroundColor: 'var(--color-paper-2)' }}
                        onClick={() => setAnimationStep(idx)}
                      >
                        <p className="text-xs font-medium mb-2" style={{ color: 'oklch(50% 0.12 235)' }}>
                          Step {idx + 1}: {step.description}
                        </p>
                        <div className="flex justify-center">
                          <div className="flex gap-1">
                            <div className="grid gap-1">
                              {step.matrix.map((row, i) => (
                                <div key={`left-${i}`} className="flex gap-1">
                                  {row.slice(0, 2).map((val, j) => (
                                    <div key={j} style={{
                                      width: 44,
                                      height: 44,
                                      backgroundColor: 'rgba(200,155,50,0.10)',
                                      border: `1.5px solid oklch(65% 0.10 70)`,
                                      borderRadius: '0.5rem',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontFamily: 'var(--font-mono)',
                                      fontSize: '0.875rem',
                                      color: 'var(--color-ink)',
                                    }}>
                                      {typeof val === 'number' ? val.toFixed(2) : val}
                                    </div>
                                  ))}
                                </div>
                              ))}
                            </div>
                            <div className="flex items-center px-1">
                              <span className="text-xl font-bold" style={{ color: 'var(--color-muted)' }}>|</span>
                            </div>
                            <div className="grid gap-1">
                              {step.matrix.map((row, i) => (
                                <div key={`right-${i}`} className="flex gap-1">
                                  {row.slice(2).map((val, j) => (
                                    <div key={j} style={{
                                      width: 44,
                                      height: 44,
                                      backgroundColor: 'rgba(75,160,195,0.08)',
                                      border: `1.5px solid var(--color-accent)`,
                                      borderRadius: '0.5rem',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontFamily: 'var(--font-mono)',
                                      fontSize: '0.875rem',
                                      color: 'var(--color-ink)',
                                    }}>
                                      {typeof val === 'number' ? val.toFixed(2) : val}
                                    </div>
                                  ))}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {!canInverse && operation === 'inverse' && (
                  <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(200,155,50,0.08)', border: '1px solid oklch(65% 0.10 70)' }}>
                    <p className="text-sm text-center" style={{ color: 'oklch(65% 0.10 70)' }}>
                      Matrix is singular (determinant = 0). Inverse does not exist.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right Panel */}
          <div
            className="w-64 lg:w-72 xl:w-80 flex-shrink-0 min-h-0 overflow-y-auto border-l"
            style={{
              backgroundColor: 'var(--color-paper)',
              borderColor: 'var(--color-rule)',
            }}
          >
            <div className="p-3 space-y-3">
              {/* Formula Reference */}
              <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--color-paper-2)' }}>
                <div className="text-xs font-medium mb-2" style={{ color: 'var(--color-neutral)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  Formulas
                </div>
                {operation === 'add' && (
                  <div className="space-y-2">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--color-paper)' }}>
                      <code className="text-xs font-mono" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-ink)' }}>
                        C[i][j] = A[i][j] + B[i][j]
                      </code>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                      Add corresponding elements
                    </p>
                  </div>
                )}
                {operation === 'subtract' && (
                  <div className="space-y-2">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--color-paper)' }}>
                      <code className="text-xs font-mono" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-ink)' }}>
                        C[i][j] = A[i][j] - B[i][j]
                      </code>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                      Subtract corresponding elements
                    </p>
                  </div>
                )}
                {operation === 'multiply' && (
                  <div className="space-y-2">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--color-paper)' }}>
                      <code className="text-xs font-mono" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-ink)' }}>
                        C[i][j] = Σₖ A[i][k] × B[k][j]
                      </code>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                      Row-by-column dot products
                    </p>
                  </div>
                )}
                {operation === 'transpose' && (
                  <div className="space-y-2">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--color-paper)' }}>
                      <code className="text-xs font-mono" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-ink)' }}>
                        (A^T)[i][j] = A[j][i]
                      </code>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                      Flip rows and columns
                    </p>
                  </div>
                )}
                {operation === 'inverse' && (
                  <div className="space-y-2">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--color-paper)' }}>
                      <code className="text-xs font-mono" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-ink)' }}>
                        A⁻¹ = 1/det(A) × [d, -b; -c, a]
                      </code>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                      A × A⁻¹ = I (for det ≠ 0)
                    </p>
                  </div>
                )}
              </div>

              {/* Hint */}
              {showGuided && (
                <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(200,155,50,0.08)', border: '1px solid oklch(65% 0.10 70)' }}>
                  <div className="text-xs font-medium mb-1" style={{ color: 'oklch(65% 0.10 70)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Hint
                  </div>
                  <p className="text-xs" style={{ color: 'oklch(65% 0.10 70)' }}>
                    {steps[currentStep].hint}
                  </p>
                </div>
              )}

              {/* Operation Reference */}
              <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--color-paper-2)' }}>
                <div className="text-xs font-medium mb-2" style={{ color: 'var(--color-neutral)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  Operation
                </div>
                <div className="text-lg font-bold" style={{ color: 'var(--color-accent)', fontFamily: 'var(--font-display)' }}>
                  {operation.charAt(0).toUpperCase() + operation.slice(1)}
                </div>
                <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
                  {steps.findIndex(s => s.title.toLowerCase().startsWith(operation)) >= 0
                    ? steps[steps.findIndex(s => s.title.toLowerCase().startsWith(operation))].action
                    : 'Try different operations'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-4 py-2 flex items-center justify-center gap-4 border-t flex-shrink-0"
          style={{
            backgroundColor: 'var(--color-paper)',
            borderColor: 'var(--color-rule)',
            color: 'var(--color-muted)',
          }}
        >
          <span className="text-xs">
            {showGuided && steps[currentStep] ? `Action: ${steps[currentStep].action}` : 'Try different operations'}
          </span>
          <span>•</span>
          <CompletionToggle moduleId={3} />
        </div>
      </div>
    </div>
  );
}