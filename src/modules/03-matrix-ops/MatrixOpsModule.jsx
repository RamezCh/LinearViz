import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, X, RotateCcw, Calculator, Play, Pause, SkipForward, Info, Gamepad2 } from 'lucide-react';
import { useStore } from '../../store/useStore';
import CompletionToggle from '../../components/UI/CompletionToggle';
import { Button, ButtonGroup } from '../../components/UI/Button';
import { Card } from '../../components/UI/Card';
import { add, subtract, multiply, transpose, inverse2x2, identity, det2x2 } from '../../utils/linalg';
import { GuidedStepper } from '../../components/Shell/GuidedStepper';
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
  const [showGuided, setShowGuided] = useState(false);
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
        steps.push({
          i,
          j,
          products,
          sum,
          result: sum,
        });
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
        matrix: [
          [1, b / a, scale, 0],
          [c, d, -c * scale, 1],
        ],
        description: `Divide row 1 by ${a.toFixed(2)} to make pivot 1`,
        highlight: [[0, 0]],
        operation: 'scale',
        row: 0,
        factor: scale,
      });

      const newRow1 = [c, d, -c * scale, 1];
      const newRow0 = [1, b / a, scale, 0];
      steps.push({
        matrix: [
          [1, b / a, scale, 0],
          [0, factor, -c * scale * b / a + newRow1[2], -c * scale],
        ],
        description: 'Eliminate below pivot',
        highlight: [[1, 0]],
        operation: 'eliminate',
        row: 1,
        factor: c,
      });

      if (Math.abs(factor) > 1e-10) {
        const scaleFactor = 1 / factor;
        steps.push({
          matrix: [
            [1, b / a, scale, 0],
            [0, 1, (newRow1[2]) * scaleFactor, -c * scale * scaleFactor],
          ],
          description: `Scale row 2 by ${factor.toFixed(2)}`,
          highlight: [[1, 1]],
          operation: 'scale',
          row: 1,
          factor: scaleFactor,
        });

        const invDet = 1 / (a * d - b * c);
        steps.push({
          matrix: [
            [1, 0, (d) * invDet, (-b) * invDet],
            [0, 1, (-c) * invDet, (a) * invDet],
          ],
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

  const playAnimation = () => {
    setIsAnimating(true);
  };

  const pauseAnimation = () => {
    setIsAnimating(false);
  };

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

  const getCellColor = (row, col, highlightRows = [], highlightCols = []) => {
    if (highlightRows.includes(row) && highlightCols.includes(col)) return { bg: 'rgba(75,160,195,0.20)', border: 'var(--color-accent)' };
    if (highlightRows.includes(row)) return { bg: 'rgba(80,130,200,0.15)', border: 'oklch(50% 0.12 235)' };
    if (highlightCols.includes(col)) return { bg: 'rgba(200,155,50,0.15)', border: 'oklch(65% 0.10 70)' };
    return { bg: 'var(--color-paper)', border: 'var(--color-rule)' };
  };

  const getAugmentedCellColor = (row, col, highlightCells = []) => {
    if (highlightCells.some(([r, c]) => r === row && c === col)) return { bg: 'rgba(80,130,200,0.15)', border: 'oklch(50% 0.12 235)' };
    if (col < 2) return { bg: 'rgba(200,155,50,0.10)', border: 'oklch(65% 0.10 70)' };
    return { bg: 'rgba(75,160,195,0.08)', border: 'var(--color-accent)' };
  };

  const MatrixGrid = ({ matrix, onChange, editable = true, label, highlightInfo = {}, className = '' }) => (
    <div className={`flex flex-col items-center ${className}`}>
      <p className="text-sm font-semibold mb-2" style={{ color: 'var(--color-ink)' }}>{label}</p>
      <div className="grid gap-1">
        {matrix.map((row, i) => (
          <div key={i} className="flex gap-1">
            {row.map((val, j) => {
              const isHighlightedRow = highlightInfo.rows?.includes(i);
              const isHighlightedCol = highlightInfo.cols?.includes(j);
              const cellColors = isHighlightedRow && isHighlightedCol ? { bg: 'rgba(75,160,195,0.20)', border: 'var(--color-accent)' } :
                                 isHighlightedRow ? { bg: 'rgba(80,130,200,0.15)', border: 'oklch(50% 0.12 235)' } :
                                 isHighlightedCol ? { bg: 'rgba(200,155,50,0.15)', border: 'oklch(65% 0.10 70)' } :
                                 { bg: 'var(--color-paper)', border: 'var(--color-rule)' };
              const isResult = highlightInfo.result?.some(r => r[0] === i && r[1] === j);
              return (
                <motion.div
                  key={`${i}-${j}`}
                  whileHover={editable ? { scale: 1.05 } : {}}
                  style={{
                    width: 48,
                    height: 48,
                    backgroundColor: cellColors.bg,
                    border: isResult ? `2px solid var(--color-accent)` : `1.5px solid ${cellColors.border}`,
                    borderRadius: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: editable ? 'pointer' : 'default',
                    transition: 'all 200ms ease-out',
                  }}
                  onMouseEnter={e => {
                    if (editable) e.currentTarget.style.borderColor = 'var(--color-accent)';
                  }}
                  onMouseLeave={e => {
                    if (editable) e.currentTarget.style.borderColor = cellColors.border;
                  }}
                  onClick={() => {
                    if (editable && highlightInfo.onClick) highlightInfo.onClick(i, j);
                  }}
                >
                  {editable ? (
                    <input
                      type="number"
                      value={val}
                      onChange={(e) => onChange(i, j, e.target.value)}
                      style={{
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'transparent',
                        outline: 'none',
                        textAlign: 'center',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '1.125rem',
                        color: 'var(--color-ink)',
                      }}
                    />
                  ) : (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.125rem', color: 'var(--color-ink)' }}>
                      {typeof val === 'number' ? val.toFixed(1) : val}
                    </span>
                  )}
                </motion.div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );

  const AugmentedMatrix = ({ matrix, highlight = [], label }) => (
    <div className="flex flex-col items-center">
      <p className="text-sm font-semibold mb-2" style={{ color: 'var(--color-ink)' }}>{label}</p>
      <div className="flex gap-1">
        <div className="grid gap-1">
          {matrix.map((row, i) => (
            <div key={`left-${i}`} className="flex gap-1">
              {row.slice(0, 2).map((val, j) => (
                <motion.div
                  key={`${i}-${j}`}
                  style={{
                    width: 48,
                    height: 48,
                    backgroundColor: j === 0 ? 'rgba(200,155,50,0.10)' : 'var(--color-paper)',
                    border: `1.5px solid ${j === 0 ? 'oklch(65% 0.10 70)' : 'var(--color-rule)'}`,
                    borderRadius: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '1.125rem',
                    color: 'var(--color-ink)',
                  }}
                >
                  {typeof val === 'number' ? val.toFixed(2) : val}
                </motion.div>
              ))}
            </div>
          ))}
        </div>
        <div className="flex items-center px-1">
          <span className="text-2xl font-bold" style={{ color: 'var(--color-muted)' }}>|</span>
        </div>
        <div className="grid gap-1">
          {matrix.map((row, i) => (
            <div key={`right-${i}`} className="flex gap-1">
              {row.slice(2).map((val, j) => (
                <motion.div
                  key={`${i}-${j + 2}`}
                  style={{
                    width: 48,
                    height: 48,
                    backgroundColor: i === highlight[0]?.row ? 'rgba(80,130,200,0.15)' : 'rgba(75,160,195,0.08)',
                    border: `1.5px solid ${i === highlight[0]?.row ? 'oklch(50% 0.12 235)' : 'var(--color-accent)'}`,
                    borderRadius: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '1.125rem',
                    color: 'var(--color-ink)',
                  }}
                >
                  {typeof val === 'number' ? val.toFixed(2) : val}
                </motion.div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const DotProductAnimation = ({ step }) => {
    if (!step) return null;
    return (
      <div
        className="rounded-xl p-4 my-4"
        style={{ backgroundColor: 'rgba(75,160,195,0.06)' }}
      >
        <p className="text-sm font-medium mb-3 text-center" style={{ color: 'var(--color-ink)' }}>
          Computing C[{step.i}][{step.j}] = Σ A[{step.i},k] × B[k,{step.j}]
        </p>
        <div className="flex justify-center items-center gap-3 mb-3">
          <div className="text-center">
            <p className="text-xs mb-1" style={{ color: 'oklch(50% 0.12 235)' }}>Row {step.i} of A</p>
            <div className="flex gap-1">
              {step.products.map((p, idx) => (
                <motion.div
                  key={idx}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: idx * 0.2 }}
                  style={{
                    width: 40,
                    height: 40,
                    backgroundColor: 'rgba(80,130,200,0.15)',
                    borderRadius: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    color: 'oklch(50% 0.12 235)',
                  }}
                >
                  {p.aVal.toFixed(1)}
                </motion.div>
              ))}
            </div>
          </div>
          <span className="text-2xl font-bold" style={{ color: 'var(--color-muted)' }}>×</span>
          <div className="text-center">
            <p className="text-xs mb-1" style={{ color: 'oklch(65% 0.10 70)' }}>Col {step.j} of B</p>
            <div className="flex gap-1 flex-col">
              {step.products.map((p, idx) => (
                <motion.div
                  key={idx}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: idx * 0.2 + 0.1 }}
                  style={{
                    width: 40,
                    height: 40,
                    backgroundColor: 'rgba(200,155,50,0.15)',
                    borderRadius: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    color: 'oklch(65% 0.10 70)',
                  }}
                >
                  {p.bVal.toFixed(1)}
                </motion.div>
              ))}
            </div>
          </div>
          <span className="text-2xl font-bold" style={{ color: 'var(--color-muted)' }}>=</span>
          <div className="text-center">
            <p className="text-xs mb-1" style={{ color: 'var(--color-accent)' }}>Products</p>
            <div className="flex gap-1 flex-col">
              {step.products.map((p, idx) => (
                <motion.div
                  key={idx}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: idx * 0.2 + 0.2 }}
                  style={{
                    width: 40,
                    height: 40,
                    backgroundColor: 'rgba(75,160,195,0.20)',
                    borderRadius: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    color: 'var(--color-accent)',
                  }}
                >
                  {(p.aVal * p.bVal).toFixed(1)}
                </motion.div>
              ))}
            </div>
          </div>
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.8 }}
            className="text-2xl font-bold"
            style={{ color: 'var(--color-muted)' }}
          >
            +
          </motion.span>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.9 }}
            style={{
              width: 56,
              height: 56,
              backgroundColor: 'var(--color-accent)',
              color: 'var(--color-paper)',
              borderRadius: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-mono)',
              fontSize: '1.125rem',
              fontWeight: 700,
            }}
          >
            {step.sum.toFixed(1)}
          </motion.div>
        </div>
        <p className="text-center text-sm" style={{ color: 'var(--color-muted)' }}>
          = {(step.products.map(p => `(${p.aVal}×${p.bVal})`)).join(' + ')} = <span className="font-bold" style={{ color: 'var(--color-accent)' }}>{step.sum.toFixed(2)}</span>
        </p>
      </div>
    );
  };

  const OperationSelector = ({ selected, onSelect }) => (
    <div className="flex flex-wrap gap-2 justify-center">
      <Button
        variant={selected === 'add' ? 'primary' : 'ghost'}
        size="sm"
        icon={Plus}
        onClick={() => onSelect('add')}
      >
        Add
      </Button>
      <Button
        variant={selected === 'subtract' ? 'primary' : 'ghost'}
        size="sm"
        icon={Minus}
        onClick={() => onSelect('subtract')}
      >
        Subtract
      </Button>
      <Button
        variant={selected === 'multiply' ? 'primary' : 'ghost'}
        size="sm"
        icon={X}
        onClick={() => onSelect('multiply')}
      >
        Multiply
      </Button>
      <Button
        variant={selected === 'transpose' ? 'primary' : 'ghost'}
        size="sm"
        icon={RotateCcw}
        onClick={() => onSelect('transpose')}
      >
        Transpose
      </Button>
      <Button
        variant={selected === 'inverse' ? 'primary' : 'ghost'}
        size="sm"
        icon={Calculator}
        onClick={() => onSelect('inverse')}
        disabled={!canInverse}
        title={!canInverse ? 'Matrix must have non-zero determinant' : ''}
      >
        Inverse
      </Button>
    </div>
  );

  const FormulaPanel = () => {
    const formatMatrix = (m, name) => {
      if (!m) return '∅';
      return `\\begin{pmatrix} ${m.map(r => r.map(v => typeof v === 'number' ? v.toFixed(2) : v).join(' & ')).join(' \\\\ ')} \\end{pmatrix}`;
    };

    const formulas = useMemo(() => {
      switch (operation) {
        case 'add':
          return [
            {
              title: 'Matrix Addition',
              formula: `${formatMatrix(matrixA, 'A')} + ${formatMatrix(matrixB, 'B')} = ${formatMatrix(resultMatrix, 'C')}`,
              description: 'Add corresponding elements: C[i][j] = A[i][j] + B[i][j]',
            },
            {
              title: 'Element-wise',
              formula: `c_{ij} = a_{ij} + b_{ij}`,
              description: 'Each element in C equals the sum of corresponding elements',
            },
          ];
        case 'subtract':
          return [
            {
              title: 'Matrix Subtraction',
              formula: `${formatMatrix(matrixA, 'A')} - ${formatMatrix(matrixB, 'B')} = ${formatMatrix(resultMatrix, 'C')}`,
              description: 'Subtract corresponding elements: C[i][j] = A[i][j] - B[i][j]',
            },
            {
              title: 'Element-wise',
              formula: `c_{ij} = a_{ij} - b_{ij}`,
              description: 'Each element in C equals the difference of corresponding elements',
            },
          ];
        case 'multiply':
          return [
            {
              title: 'Matrix Multiplication',
              formula: `${formatMatrix(matrixA, 'A')} \\times ${formatMatrix(matrixB, 'B')} = ${formatMatrix(resultMatrix, 'C')}`,
              description: 'Row-by-column dot products',
            },
            {
              title: 'Entry Formula',
              formula: `c_{ij} = \\sum_{k} a_{ik} b_{kj}`,
              description: 'Element (i,j) of C is the dot product of row i of A and column j of B',
            },
          ];
        case 'transpose':
          return [
            {
              title: 'Transpose',
              formula: `(A^T)_{ij} = A_{ji}`,
              description: 'Rows become columns, columns become rows',
            },
            {
              title: 'Example',
              formula: `${formatMatrix(matrixA, 'A')}^T = ${formatMatrix(resultMatrix, 'A^T')}`,
              description: 'The (i,j) element of A^T equals the (j,i) element of A',
            },
          ];
        case 'inverse':
          return [
            {
              title: '2×2 Inverse Formula',
              formula: `A^{-1} = \\frac{1}{ad-bc}\\begin{pmatrix} d & -b \\\\ -c & a \\end{pmatrix}`,
              description: 'For matrix A = [[a,b],[c,d]] with det ≠ 0',
            },
            {
              title: 'Verification',
              formula: `A \\times A^{-1} = I`,
              description: 'A times its inverse equals the identity matrix',
            },
          ];
        default:
          return [];
      }
    }, [operation, matrixA, matrixB, resultMatrix]);

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
                <code className="text-sm font-mono whitespace-pre" style={{ color: 'var(--color-ink)' }}>
                  {f.formula.replace(/\\/g, '').replace(/begin{pmatrix}/g, '[').replace(/end{pmatrix}/g, ']').replace(/\\\\/g, '; ').replace(/&/g, ' ')}
                </code>
              </div>
              <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{f.description}</p>
            </Card>
          </motion.div>
        ))}
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
          <h2 className="text-xl font-bold" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-display)' }}>Matrix Operations</h2>
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
      </div>

      {showGame && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1"
        >
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
        </motion.div>
      )}

      {!showGame && (
      <div className="flex-1 lg:w-1/2 space-y-4 overflow-y-auto">

        <OperationSelector selected={operation} onSelect={setOperation} />

        <Card variant="elevated" className="p-6">
          <div className="flex flex-wrap justify-center items-start gap-6">
            {operation === 'inverse' ? (
              <div className="flex flex-col items-center gap-6">
                <MatrixGrid
                  matrix={matrixA}
                  onChange={(i, j, v) => updateMatrixCell(matrixA, setMatrixA, i, j, v)}
                  editable={true}
                  label="A"
                />
                <p className="text-xs text-center" style={{ color: 'var(--color-muted)' }}>Click to edit values</p>
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
        </Card>

        {operation === 'multiply' && multiplySteps.length > 0 && (
          <Card variant="outline" className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold" style={{ color: 'var(--color-ink-2)' }}>Step Through</h4>
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
                      <motion.button
                        key={idx}
                        whileHover={{ scale: 1.2 }}
                        className="w-3 h-3 rounded-full transition-all"
                        style={{
                          backgroundColor: idx === animationStep
                            ? 'var(--color-accent)'
                            : idx < animationStep
                            ? 'rgba(75,160,195,0.5)'
                            : 'var(--color-rule)',
                          scale: idx === animationStep ? 1.25 : 1,
                        }}
                        onClick={() => setAnimationStep(idx)}
                      />
                    ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-center py-4" style={{ color: 'var(--color-muted)' }}>
                Press Play or click Step to see how matrix multiplication works
              </p>
            )}
          </Card>
        )}

        {operation === 'inverse' && inverseSteps.length > 0 && (
          <Card variant="outline" className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold" style={{ color: 'var(--color-ink-2)' }}>Gaussian Elimination</h4>
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
                className="p-3 rounded-lg mb-3"
                style={idx === animationStep
                  ? { backgroundColor: 'rgba(80,130,200,0.10)', border: '1.5px solid oklch(50% 0.12 235)' }
                  : { backgroundColor: 'var(--color-paper-2)' }}
                onClick={() => setAnimationStep(idx)}
              >
                <p className="text-xs font-medium mb-2" style={{ color: 'oklch(50% 0.12 235)' }}>
                  Step {idx + 1}: {step.description}
                </p>
                <AugmentedMatrix
                  matrix={step.matrix}
                  highlight={step.highlight || []}
                  label=""
                />
              </motion.div>
            ))}
          </Card>
        )}

        {!canInverse && operation === 'inverse' && (
          <div
            className="rounded-xl p-4"
            style={{
              backgroundColor: 'rgba(200,155,50,0.08)',
              border: '1px solid oklch(65% 0.10 70)',
            }}
          >
            <p className="text-sm text-center" style={{ color: 'oklch(65% 0.10 70)' }}>
              Matrix is singular (determinant = 0). Inverse does not exist.
            </p>
          </div>
        )}
      </div>
      )}

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
        <span>Try different operations</span>
        <span>•</span>
        <CompletionToggle moduleId={3} />
      </div>
    </div>
  );
}

