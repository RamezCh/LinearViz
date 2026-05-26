import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Move } from 'lucide-react';
import MatrixGrid from '../../components/Canvas/MatrixGrid';
import {
  det2x2, transpose, inverse2x2, multiply, add, subtract, rowReduce
} from '../../utils/linalg';

const MIN_ZOOM = 20;
const MAX_ZOOM = 100;
const DEFAULT_ZOOM = 40;

export default function MatrixOpsModule() {
  const [matrixA, setMatrixA] = useState([[2, 1], [1, 3]]);
  const [matrixB, setMatrixB] = useState([[1, 2], [0, 1]]);
  const [activeOp, setActiveOp] = useState('multiply');
  const [currentStep, setCurrentStep] = useState(0);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [showSteps, setShowSteps] = useState(true);
  const [showGeometry, setShowGeometry] = useState(true);
  const [learnMode, setLearnMode] = useState(true);
  const [highlightCell, setHighlightCell] = useState(null);
  const [highlightRow, setHighlightRow] = useState(null);
  const [highlightCol, setHighlightCol] = useState(null);
  const [gaussSteps, setGaussSteps] = useState([]);
  const [gaussCurrentStep, setGaussCurrentStep] = useState(0);
  const [animProgress, setAnimProgress] = useState(1);
  const [dragging, setDragging] = useState({
    active: false, matrix: 'A', row: 0, col: 0, startY: 0, startVal: 0
  });

  const canvasRef = useRef(null);
  const isPanning = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const detA = useMemo(() => det2x2(matrixA), [matrixA]);
  const detB = useMemo(() => det2x2(matrixB), [matrixB]);
  const isSingularA = useMemo(() => Math.abs(detA) < 1e-10, [detA]);
  const isSingularB = useMemo(() => Math.abs(detB) < 1e-10, [detB]);

  const resultMatrix = useMemo(() => {
    try {
      if (activeOp === 'add') {
        return add(matrixA, matrixB);
      } else if (activeOp === 'multiply') {
        return multiply(matrixA, matrixB);
      }
      return null;
    } catch {
      return null;
    }
  }, [matrixA, matrixB, activeOp]);

  const transposeA = useMemo(() => transpose(matrixA), [matrixA]);
  const transposeB = useMemo(() => transpose(matrixB), [matrixB]);

  const inverseA = useMemo(() => {
    if (isSingularA) return null;
    try {
      return inverse2x2(matrixA);
    } catch {
      return null;
    }
  }, [matrixA, isSingularA]);

  useEffect(() => {
    if (activeOp === 'inverse' && !isSingularA) {
      const augmented = [
        [matrixA[0][0], matrixA[0][1], 1, 0],
        [matrixA[1][0], matrixA[1][1], 0, 1],
      ];
      const result = rowReduce(augmented);
      setGaussSteps(result.steps);
      setGaussCurrentStep(0);
    } else {
      setGaussSteps([]);
      setGaussCurrentStep(0);
    }
  }, [activeOp, matrixA, isSingularA]);

  useEffect(() => {
    if (activeOp === 'multiply') {
      let step = 0;
      const interval = setInterval(() => {
        const row = step % 2;
        const col = Math.floor(step / 2) % 2;
        setHighlightRow(row);
        setHighlightCol(col);
        setHighlightCell({ row, col });
        step++;
        if (step >= 4) {
          clearInterval(interval);
          setTimeout(() => {
            setHighlightCell(null);
            setHighlightRow(null);
            setHighlightCol(null);
          }, 1000);
        }
      }, 800);
      return () => clearInterval(interval);
    }
  }, [activeOp, matrixA, matrixB]);

  const handleDragEntry = useCallback((matrix, row, col, startVal, clientY) => {
    setDragging({ active: true, matrix, row, col, startY: clientY, startVal });
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (isPanning.current) {
      const dx = e.clientX - lastPos.current.x;
      const dy = e.clientY - lastPos.current.y;
      setPan(p => ({ x: p.x + dx, y: p.y + dy }));
      lastPos.current = { x: e.clientX, y: e.clientY };
      return;
    }

    if (!dragging.active) return;

    const deltaY = dragging.startY - e.clientY;
    const newVal = Math.round((dragging.startVal + deltaY * 0.05) * 100) / 100;
    const clampedVal = Math.max(-5, Math.min(5, newVal));

    if (dragging.matrix === 'A') {
      setMatrixA(prev => {
        const newA = prev.map(r => [...r]);
        newA[dragging.row][dragging.col] = clampedVal;
        return newA;
      });
    } else {
      setMatrixB(prev => {
        const newB = prev.map(r => [...r]);
        newB[dragging.row][dragging.col] = clampedVal;
        return newB;
      });
    }
  }, [dragging]);

  const handleMouseUp = useCallback(() => {
    isPanning.current = false;
    setDragging(prev => ({ ...prev, active: false }));
  }, []);

  const handleMouseDown = useCallback((e) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      isPanning.current = true;
      lastPos.current = { x: e.clientX, y: e.clientY };
      return;
    }
  }, []);

  const resetAll = useCallback(() => {
    setMatrixA([[2, 1], [1, 3]]);
    setMatrixB([[1, 2], [0, 1]]);
    setActiveOp('multiply');
    setZoom(DEFAULT_ZOOM);
    setPan({ x: 0, y: 0 });
  }, []);

  const zoomIn = () => setZoom(z => Math.min(MAX_ZOOM, z + 10));
  const zoomOut = () => setZoom(z => Math.max(MIN_ZOOM, z - 10));

  const steps = [
    {
      title: 'Matrices store transformations',
      concept: 'A matrix is a stored transformation — the numbers tell space where to go. A 2×2 matrix transforms the plane by moving every point. The identity matrix [[1,0],[0,1]] does nothing.',
      hint: 'Look at how the grid transforms under each matrix.',
      action: 'Observe how the grid shows transformation effects',
    },
    {
      title: 'Addition: combining effects',
      concept: 'Matrix addition adds corresponding entries: A+B = [[a+e, b+f], [c+g, d+h]]. Each entry combines independently. Scaling by 2 + scaling by 1 = scaling by 3!',
      hint: 'Switch to the Addition tab to see A + B.',
      action: 'Click the Addition tab and observe the result',
    },
    {
      title: 'Why addition is simple',
      concept: 'Each entry adds with no interaction. (A+B)ᵢⱼ = Aᵢⱼ + Bᵢⱼ. It is just element-wise addition. No row-column multiplication, no surprising results.',
      hint: 'The grids show simple additive transformation.',
      action: 'Compare A grid + B grid = (A+B) grid',
    },
    {
      title: 'Multiplication: chaining transforms',
      concept: 'AB means: apply B first, then apply A. The result is one matrix that does both jobs. AB ≠ BA in general — order matters!',
      hint: 'Switch to Multiplication to see the chain.',
      action: 'Click Multiplication and watch the three-panel view',
    },
    {
      title: 'The row × column rule',
      concept: 'Cᵢⱼ = rowᵢ(A) · colⱼ(B) = Σ aᵢₖbₖⱼ. Each result entry is a dot product: multiply matching entries and add them up.',
      hint: 'Watch the highlighted row and column as cells compute.',
      action: 'See the highlighted row and column for each result cell',
    },
    {
      title: 'Order matters: AB ≠ BA',
      concept: 'Rotate-then-shear ≠ shear-then-rotate. AB and BA give different results. Matrix multiplication is NOT commutative (AB ≠ BA in general).',
      hint: 'Compare the results of AB vs BA.',
      action: 'Try AB and BA — they look different!',
    },
    {
      title: 'Transpose: flipping the matrix',
      concept: 'The transpose swaps rows and columns: (Aᵀ)ᵢⱼ = Aⱼᵢ. The diagonal stays fixed. Off-diagonal elements mirror across it. Aᵀᵀ = A always.',
      hint: 'Switch to Transpose and watch the cell migration.',
      action: 'Click Transpose and observe the diagonal cells',
    },
    {
      title: 'Inverse: the undo operation',
      concept: 'A⁻¹ perfectly cancels A. A·A⁻¹ = I. Apply A, apply A⁻¹, and you are exactly where you started. Only exists if det ≠ 0.',
      hint: 'Switch to Inverse to see the inverse matrix.',
      action: 'Click Inverse tab — look for the inverse grid',
    },
    {
      title: 'Computing the inverse: Gauss-Jordan',
      concept: 'We turn [A|I] into [I|A⁻¹] using row operations. Every step is tracked. Whatever happens to the right side IS the inverse!',
      hint: 'Use the Next button to step through Gauss-Jordan.',
      action: 'Step through the Gauss-Jordan reduction',
    },
    {
      title: 'Free exploration',
      concept: `You have two matrices:\nA = [[${matrixA[0][0].toFixed(1)}, ${matrixA[0][1].toFixed(1)}], [${matrixA[1][0].toFixed(1)}, ${matrixA[1][1].toFixed(1)}]]\nB = [[${matrixB[0][0].toFixed(1)}, ${matrixB[0][1].toFixed(1)}], [${matrixB[1][0].toFixed(1)}, ${matrixB[1][1].toFixed(1)}]]\n\nAll four tabs are available. Experiment!`,
      hint: 'Switch between tabs and edit matrix values.',
      action: 'Edit any matrix entry and switch tabs',
    },
  ];

  const tabs = [
    { key: 'add', label: 'Addition', formula: 'A + B' },
    { key: 'multiply', label: 'Multiplication', formula: 'A × B' },
    { key: 'transpose', label: 'Transpose', formula: 'Aᵀ' },
    { key: 'inverse', label: 'Inverse', formula: 'A⁻¹' },
  ];

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
        {/* Zoom controls */}
        <div className="flex items-center gap-1">
          <button onClick={zoomOut}
            className="p-1.5 rounded-lg transition-all duration-150"
            style={{ color: 'var(--color-muted)', backgroundColor: 'transparent' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-paper-2)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            title="Zoom Out">
            <ZoomOut className="w-4 h-4" />
          </button>

          <div
            className="px-2 py-0.5 rounded-lg text-xs font-semibold min-w-[48px] text-center"
            style={{
              backgroundColor: 'var(--color-paper-2)',
              color: 'var(--color-ink)',
              fontFamily: 'var(--font-mono)'
            }}
          >
            {zoom}px
          </div>

          <button onClick={zoomIn}
            className="p-1.5 rounded-lg transition-all duration-150"
            style={{ color: 'var(--color-muted)', backgroundColor: 'transparent' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-paper-2)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            title="Zoom In">
            <ZoomIn className="w-4 h-4" />
          </button>

          <button onClick={() => setPan({ x: 0, y: 0 })}
            className="p-1.5 rounded-lg transition-all duration-150"
            style={{ color: 'var(--color-muted)', backgroundColor: 'transparent' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-paper-2)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            title="Reset Position">
            <Move className="w-4 h-4" />
          </button>
        </div>

        {/* Tab buttons */}
        <div className="flex-1 flex justify-center">
          <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: 'var(--color-paper-3)' }}>
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveOp(tab.key);
                  setCurrentStep(0);
                  setHighlightCell(null);
                  setHighlightRow(null);
                  setHighlightCol(null);
                }}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={
                  activeOp === tab.key
                    ? { backgroundColor: 'var(--color-accent)', color: 'var(--color-paper)' }
                    : { backgroundColor: 'transparent', color: 'var(--color-ink-2)' }
                }
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Toggle buttons */}
        <div className="flex items-center gap-1.5">
          <button onClick={() => setLearnMode(!learnMode)}
            className="px-3 py-1 text-xs font-semibold rounded-lg border transition-all duration-150"
            style={learnMode
              ? { backgroundColor: 'var(--color-accent)', color: 'var(--color-paper)', borderColor: 'var(--color-accent)' }
              : { backgroundColor: 'var(--color-paper)', color: 'var(--color-ink-2)', borderColor: 'var(--color-rule)' }
            }
          >
            {learnMode ? '✓ ' : ''}Learn
          </button>
        </div>

        <button onClick={resetAll}
          className="p-1.5 rounded-lg transition-all duration-150"
          style={{ color: 'var(--color-muted)', backgroundColor: 'transparent' }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-paper-2)'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          title="Reset All">
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Guided Learning Card */}
        {learnMode && (
          <div
            className="px-4 py-2.5 border-b flex-shrink-0"
            style={{
              background: 'linear-gradient(to right, rgba(139,92,246,0.06), rgba(236,72,153,0.06))',
              borderColor: 'var(--color-rule)',
            }}
          >
            <div className="flex items-center gap-3 max-w-full">
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{
                    backgroundColor: 'var(--color-accent)',
                    color: 'var(--color-paper)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {currentStep + 1}
                </div>
                <span className="text-xs font-semibold" style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
                  / {steps.length}
                </span>
              </div>

              <div className="w-px h-8 flex-shrink-0" style={{ backgroundColor: 'var(--color-rule)' }} />

              <div className="flex-1 min-w-0 overflow-hidden">
                <h3
                  className="text-sm font-bold mb-0.5 truncate"
                  style={{
                    color: 'var(--color-ink)',
                    fontFamily: 'var(--font-display)',
                  }}
                >
                  {steps[currentStep].title}
                </h3>
                <p
                  className="text-xs leading-relaxed"
                  style={{ color: 'var(--color-muted)', whiteSpace: 'pre-line' }}
                >
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

        {/* Canvas + Right Panel */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Main Canvas area */}
          <div className="flex-1 min-h-0 min-w-0 relative">
            <div
              ref={canvasRef}
              className="w-full h-full"
              style={{
                backgroundColor: 'var(--color-paper)',
                touchAction: 'none',
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <MatrixGrid
                matrixA={matrixA}
                matrixB={matrixB}
                operation={activeOp}
                highlightCell={highlightCell}
                highlightRow={highlightRow}
                highlightCol={highlightCol}
                animProgress={animProgress}
                showGeometry={showGeometry}
                zoom={zoom}
                pan={pan}
              />
            </div>

            {/* Operation indicator */}
            <div
              className="absolute top-3 left-3 px-3 py-1.5 rounded-lg"
              style={{
                backgroundColor: 'color-mix(in oklch, var(--color-paper) 88%, transparent)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid var(--color-rule)',
                boxShadow: 'var(--shadow-md)',
              }}
            >
              <span className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>
                {tabs.find(t => t.key === activeOp)?.label}
              </span>
            </div>

            {/* Gauss-Jordan steps for inverse */}
            {activeOp === 'inverse' && gaussSteps.length > 0 && (
              <div
                className="absolute bottom-3 left-3 right-3 p-3 rounded-xl max-h-48 overflow-y-auto"
                style={{
                  backgroundColor: 'color-mix(in oklch, var(--color-paper) 92%, transparent)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: '1px solid var(--color-rule)',
                  boxShadow: 'var(--shadow-md)',
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold" style={{ color: 'var(--color-ink)' }}>
                    Gauss-Jordan Reduction
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setGaussCurrentStep(Math.max(0, gaussCurrentStep - 1))}
                      className="px-2 py-0.5 text-xs rounded"
                      style={{ backgroundColor: 'var(--color-paper-2)', color: 'var(--color-ink)' }}
                      disabled={gaussCurrentStep <= 0}
                    >
                      ←
                    </button>
                    <span className="text-xs px-2 py-0.5 font-mono" style={{ color: 'var(--color-muted)' }}>
                      {gaussCurrentStep + 1}/{gaussSteps.length}
                    </span>
                    <button
                      onClick={() => setGaussCurrentStep(Math.min(gaussSteps.length - 1, gaussCurrentStep + 1))}
                      className="px-2 py-0.5 text-xs rounded"
                      style={{ backgroundColor: 'var(--color-paper-2)', color: 'var(--color-ink)' }}
                      disabled={gaussCurrentStep >= gaussSteps.length - 1}
                    >
                      →
                    </button>
                  </div>
                </div>
                {gaussSteps.slice(0, gaussCurrentStep + 1).map((step, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-lg mb-1 text-xs font-mono"
                    style={{
                      backgroundColor: idx === gaussCurrentStep ? 'rgba(139,92,246,0.15)' : 'var(--color-paper)',
                      border: `1px solid ${idx === gaussCurrentStep ? 'rgba(139,92,246,0.3)' : 'var(--color-rule)'}`,
                      color: 'var(--color-ink)',
                    }}
                  >
                    <div className="grid grid-cols-2 gap-1 mb-1">
                      <div>[{step.matrix[0].slice(0, 2).map(n => n.toFixed(2)).join(', ')}]</div>
                      <div>[{step.matrix[0].slice(2).map(n => n.toFixed(2)).join(', ')}]</div>
                      <div>[{step.matrix[1].slice(0, 2).map(n => n.toFixed(2)).join(', ')}]</div>
                      <div>[{step.matrix[1].slice(2).map(n => n.toFixed(2)).join(', ')}]</div>
                    </div>
                    <div style={{ color: 'var(--color-muted)' }}>{step.operation}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Panel */}
          <div
            className="w-64 lg:w-72 xl:w-80 flex-shrink-0 min-h-0 overflow-y-auto overflow-x-hidden border-l"
            style={{
              backgroundColor: 'var(--color-paper)',
              borderColor: 'var(--color-rule)',
            }}
          >
            <div className="p-3 space-y-3">
              {/* Matrix A */}
              <div
                className="p-3 rounded-xl"
                style={{ backgroundColor: 'var(--color-paper-2)' }}
              >
                <div className="font-semibold mb-2 text-xs" style={{ color: 'var(--color-neutral)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  Matrix A
                </div>
                <div className="grid grid-cols-2 gap-1">
                  {matrixA.map((row, i) =>
                    row.map((val, j) => (
                      <input
                        key={`a-${i}-${j}`}
                        type="number"
                        step="0.1"
                        value={val.toFixed(2)}
                        onChange={(e) => {
                          const newVal = parseFloat(e.target.value) || 0;
                          setMatrixA(prev => {
                            const newA = prev.map(r => [...r]);
                            newA[i][j] = newVal;
                            return newA;
                          });
                        }}
                        className="px-2 py-1.5 text-sm text-center rounded-lg font-mono outline-none"
                        style={{
                          backgroundColor: 'var(--color-paper)',
                          border: '1px solid var(--color-rule)',
                          color: 'var(--color-ink)',
                        }}
                      />
                    ))
                  )}
                </div>
                <div className="text-xs text-center mt-2" style={{ color: 'var(--color-muted)' }}>
                  det(A) = {detA.toFixed(3)}
                  <span
                    className="ml-2 px-1.5 py-0.5 rounded text-xs"
                    style={{
                      backgroundColor: isSingularA ? 'rgba(220,53,69,0.15)' : 'rgba(126,211,33,0.15)',
                      color: isSingularA ? '#DC3749' : '#7ED321',
                    }}
                  >
                    {isSingularA ? 'singular' : 'invertible'}
                  </span>
                </div>
              </div>

              {/* Matrix B */}
              <div
                className="p-3 rounded-xl"
                style={{ backgroundColor: 'var(--color-paper-2)' }}
              >
                <div className="font-semibold mb-2 text-xs" style={{ color: 'var(--color-neutral)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  Matrix B
                </div>
                <div className="grid grid-cols-2 gap-1">
                  {matrixB.map((row, i) =>
                    row.map((val, j) => (
                      <input
                        key={`b-${i}-${j}`}
                        type="number"
                        step="0.1"
                        value={val.toFixed(2)}
                        onChange={(e) => {
                          const newVal = parseFloat(e.target.value) || 0;
                          setMatrixB(prev => {
                            const newB = prev.map(r => [...r]);
                            newB[i][j] = newVal;
                            return newB;
                          });
                        }}
                        className="px-2 py-1.5 text-sm text-center rounded-lg font-mono outline-none"
                        style={{
                          backgroundColor: 'var(--color-paper)',
                          border: '1px solid var(--color-rule)',
                          color: 'var(--color-ink)',
                        }}
                      />
                    ))
                  )}
                </div>
                <div className="text-xs text-center mt-2" style={{ color: 'var(--color-muted)' }}>
                  det(B) = {detB.toFixed(3)}
                  <span
                    className="ml-2 px-1.5 py-0.5 rounded text-xs"
                    style={{
                      backgroundColor: isSingularB ? 'rgba(220,53,69,0.15)' : 'rgba(126,211,33,0.15)',
                      color: isSingularB ? '#DC3749' : '#7ED321',
                    }}
                  >
                    {isSingularB ? 'singular' : 'invertible'}
                  </span>
                </div>
              </div>

              {/* Operation Result */}
              <div
                className="p-3 rounded-xl"
                style={{ backgroundColor: 'var(--color-paper-2)' }}
              >
                <div className="font-semibold mb-2 text-xs" style={{ color: 'var(--color-neutral)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  {activeOp === 'add' ? 'A + B' : activeOp === 'multiply' ? 'A × B' : activeOp === 'transpose' ? 'Aᵀ' : 'A⁻¹'}
                </div>

                {(activeOp === 'add' || activeOp === 'multiply') && resultMatrix && (
                  <div
                    className="text-center py-3 rounded-xl font-mono font-bold"
                    style={{
                      backgroundColor: 'rgba(139,92,246,0.15)',
                      color: '#8B5CF6',
                      border: '2px solid rgba(139,92,246,0.3)',
                    }}
                  >
                    <div>[{resultMatrix[0][0].toFixed(2)}, {resultMatrix[0][1].toFixed(2)}]</div>
                    <div>[{resultMatrix[1][0].toFixed(2)}, {resultMatrix[1][1].toFixed(2)}]</div>
                  </div>
                )}

                {activeOp === 'transpose' && (
                  <div
                    className="text-center py-3 rounded-xl font-mono font-bold"
                    style={{
                      backgroundColor: 'rgba(245,158,11,0.15)',
                      color: '#F59E0B',
                      border: '2px solid rgba(245,158,11,0.3)',
                    }}
                  >
                    <div>[{transposeA[0][0].toFixed(2)}, {transposeA[0][1].toFixed(2)}]</div>
                    <div>[{transposeA[1][0].toFixed(2)}, {transposeA[1][1].toFixed(2)}]</div>
                  </div>
                )}

                {activeOp === 'inverse' && (
                  <div>
                    {isSingularA ? (
                      <div
                        className="text-center py-3 rounded-xl font-semibold"
                        style={{
                          backgroundColor: 'rgba(220,53,69,0.15)',
                          color: '#DC3749',
                          border: '2px solid rgba(220,53,69,0.3)',
                        }}
                      >
                        No inverse exists
                        <div className="text-xs mt-1 font-mono" style={{ fontWeight: 'normal' }}>
                          det(A) = 0
                        </div>
                      </div>
                    ) : inverseA && (
                      <div
                        className="text-center py-3 rounded-xl font-mono font-bold"
                        style={{
                          backgroundColor: 'rgba(16,185,129,0.15)',
                          color: '#10B981',
                          border: '2px solid rgba(16,185,129,0.3)',
                        }}
                      >
                        <div>[{inverseA[0][0].toFixed(3)}, {inverseA[0][1].toFixed(3)}]</div>
                        <div>[{inverseA[1][0].toFixed(3)}, {inverseA[1][1].toFixed(3)}]</div>
                        <div className="text-xs mt-2 pt-2 border-t font-normal" style={{ borderColor: 'rgba(16,185,129,0.2)', color: 'var(--color-muted)' }}>
                          A · A⁻¹ = I ✓
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Operation-specific info */}
              {activeOp === 'multiply' && (
                <div
                  className="p-3 rounded-xl"
                  style={{ backgroundColor: 'var(--color-paper-2)' }}
                >
                  <div className="font-semibold mb-2 text-xs" style={{ color: 'var(--color-neutral)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                    Determinant Property
                  </div>
                  <div className="text-xs font-mono p-2 rounded-lg" style={{ backgroundColor: 'var(--color-paper)', color: 'var(--color-muted)' }}>
                    det(AB) = det(A) · det(B)
                  </div>
                  <div className="text-center mt-2">
                    <span className="text-sm font-mono font-semibold" style={{ color: 'var(--color-ink)' }}>
                      {detA.toFixed(2)} × {detB.toFixed(2)} = {(detA * detB).toFixed(2)}
                    </span>
                  </div>
                  {resultMatrix && (
                    <div className="text-center mt-1">
                      <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                        det(AB) = {det2x2(resultMatrix).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {activeOp === 'multiply' && highlightCell && (
                <div
                  className="p-3 rounded-xl"
                  style={{ backgroundColor: 'var(--color-paper-2)' }}
                >
                  <div className="font-semibold mb-2 text-xs" style={{ color: 'var(--color-neutral)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                    Current Cell
                  </div>
                  <div className="text-xs font-mono p-2 rounded-lg" style={{ backgroundColor: 'var(--color-paper)', color: 'var(--color-ink)' }}>
                    C[{highlightCell.row}][{highlightCell.col}] =
                  </div>
                  <div className="text-center mt-2">
                    <div className="text-xs" style={{ color: '#4A90E2' }}>
                      row {highlightCell.row} of A: [{matrixA[highlightCell.row][0].toFixed(1)}, {matrixA[highlightCell.row][1].toFixed(1)}]
                    </div>
                    <div className="text-xs my-1" style={{ color: 'var(--color-muted)' }}>·</div>
                    <div className="text-xs" style={{ color: '#7ED321' }}>
                      col {highlightCell.col} of B: [{matrixB[0][highlightCell.col].toFixed(1)}, {matrixB[1][highlightCell.col].toFixed(1)}]
                    </div>
                  </div>
                  <div className="text-center mt-2 font-mono font-bold" style={{ color: '#8B5CF6' }}>
                    = {resultMatrix?.[highlightCell.row]?.[highlightCell.col].toFixed(2) || '—'}
                  </div>
                </div>
              )}

              {activeOp === 'transpose' && (
                <div
                  className="p-3 rounded-xl"
                  style={{ backgroundColor: 'var(--color-paper-2)' }}
                >
                  <div className="font-semibold mb-2 text-xs" style={{ color: 'var(--color-neutral)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                    Transpose Properties
                  </div>
                  <div className="space-y-2 text-xs font-mono">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--color-paper)', color: 'var(--color-muted)' }}>
                      (Aᵀ)ᵀ = A ✓
                    </div>
                    <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--color-paper)', color: 'var(--color-muted)' }}>
                      (AB)ᵀ = BᵀAᵀ ✓
                    </div>
                    <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--color-paper)', color: 'var(--color-muted)' }}>
                      (A + B)ᵀ = Aᵀ + Bᵀ ✓
                    </div>
                  </div>
                </div>
              )}

              {activeOp === 'inverse' && !isSingularA && (
                <div
                  className="p-3 rounded-xl"
                  style={{ backgroundColor: 'var(--color-paper-2)' }}
                >
                  <div className="font-semibold mb-2 text-xs" style={{ color: 'var(--color-neutral)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                    Inverse Formula
                  </div>
                  <div className="text-xs font-mono p-2 rounded-lg" style={{ backgroundColor: 'var(--color-paper)', color: 'var(--color-muted)' }}>
                    A⁻¹ = (1/det) × adjugate
                  </div>
                  <div className="text-xs font-mono p-2 rounded-lg mt-2" style={{ backgroundColor: 'var(--color-paper)', color: 'var(--color-ink)' }}>
                    adj(A) = [[d, -b], [-c, a]]
                  </div>
                  <div className="text-xs text-center mt-2">
                    <span className="font-semibold" style={{ color: '#10B981' }}>
                      (1/{detA.toFixed(3)}) × adj(A)
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom hint bar */}
      <div
        className="px-4 py-1.5 text-xs flex items-center justify-center gap-3 border-t flex-shrink-0"
        style={{
          backgroundColor: 'var(--color-paper-2)',
          borderColor: 'var(--color-rule)',
          color: 'var(--color-muted)',
        }}
      >
        <span>Click tabs to switch operations</span>
        <span>·</span>
        <span>Edit matrix values above</span>
        <span>·</span>
        <span>Alt+drag to pan</span>
        <span>·</span>
        <span>det(AB) = det(A)·det(B)</span>
      </div>
    </div>
  );
}