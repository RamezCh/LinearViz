import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Move, Lightbulb, ChevronRight, ChevronLeft } from 'lucide-react';
import TransformGrid from '../../components/Canvas/TransformGrid';
import { Math as LatexMath, MathCard, FormulaRow, MatrixDisplay, Matrix, InlineText } from '../../components/UI/Math';
import {
  rotationMatrix, scaleMatrix, shearMatrix, reflectMatrix,
  det2x2, isInvertible, multiply
} from '../../utils/linalg';

const MIN_ZOOM = 30;
const MAX_ZOOM = 150;
const DEFAULT_ZOOM = 100;

const CONCEPTUAL_STEPS = new Set([0, 1, 4]);
const QUICK_TIP_STEPS = new Set([2, 3, 5, 6, 7, 8]);

const QUICK_TIPS = {
  2: {
    title: 'Rotation Tip',
    tip: 'Use the "Rotate" preset. The angle slider goes from 0° to 360°. Watch the |det| = 1.00 badge stay constant!',
    action: 'Try rotating to 90° — î points up and ĵ points left!',
    presets: ['rotate'],
  },
  3: {
    title: 'Stretch Tip',
    tip: 'Use "Stretch" to scale. Drag sx (horizontal) and sy (vertical). Negative = flip that direction!',
    action: 'Try sx = 2, sy = -1 to see a horizontal stretch with a flip.',
    presets: ['stretch', 'shear'],
  },
  5: {
    title: 'Area Tip',
    tip: 'The shaded parallelogram IS the determinant. Drag any entry and watch its area change in real-time!',
    action: 'Make det = 0 by dragging — everything flattens!',
    presets: [],
  },
  6: {
    title: 'Compose Tip',
    tip: 'Enable "Compose" to see Matrix B. AB = apply B first, then A. Try different B values!',
    action: 'Set B to Rotate 45° and see how AB changes the result.',
    presets: [],
  },
  7: {
    title: 'Order Tip',
    tip: 'AB ≠ BA! Enable Compose and try: A = Rotate, B = Stretch. Now swap them. See the difference?',
    action: 'The final shapes are completely different!',
    presets: [],
  },
  8: {
    title: 'Explore Tip',
    tip: 'You have full control! Drag any of the four entries: a, b, c, d. Or use presets. Experiment freely!',
    action: 'Try combining Rotation + Stretch for interesting effects.',
    presets: ['rotate', 'stretch', 'shear', 'identity'],
  },
};

export default function TransformationsModule() {
  const [matrix, setMatrix] = useState([[1, 0], [0, 1]]);
  const [matrixB, setMatrixB] = useState([[1, 0], [0, 1]]);
  const [selectedPreset, setSelectedPreset] = useState('identity');
  const [rotationAngle, setRotationAngle] = useState(45);
  const [scaleX, setScaleX] = useState(2);
  const [scaleY, setScaleY] = useState(1);
  const [shearK, setShearK] = useState(0.5);
  const [currentStep, setCurrentStep] = useState(0);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState(true);
  const [showBasis, setShowBasis] = useState(true);
  const [showShape, setShowShape] = useState(true);
  const [showCompose, setShowCompose] = useState(false);
  const [composeOrder, setComposeOrder] = useState('AB');
  const [composeAnimStep, setComposeAnimStep] = useState(0);
  const [composeViewMode, setComposeViewMode] = useState('preview');
  const [animationPhase, setAnimationPhase] = useState(0);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [learnMode, setLearnMode] = useState(true);
  const [animProgress, setAnimProgress] = useState(1);

  const [quickTipVisible, setQuickTipVisible] = useState(true);
  const [activePresetForTip, setActivePresetForTip] = useState(null);

  const canvasRef = useRef(null);
  const isPanning = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const det = useMemo(() => det2x2(matrix), [matrix]);
  const detB = useMemo(() => det2x2(matrixB), [matrixB]);
  const invertible = useMemo(() => isInvertible(matrix), [matrix]);
  const composedMatrix = useMemo(() => {
    try {
      const result = composeOrder === 'AB' ? multiply(matrix, matrixB) : multiply(matrixB, matrix);
      if (!result || result.length !== 2 || result[0].length !== 2 || result[1].length !== 2) {
        return [[1, 0], [0, 1]];
      }
      const safe = result.map(row => row.map(v => (isFinite(v) ? v : 0)));
      return safe;
    } catch {
      return [[1, 0], [0, 1]];
    }
  }, [matrix, matrixB, composeOrder]);
  const detCompose = useMemo(() => det2x2(composedMatrix), [composedMatrix]);

  const transformType = useMemo(() => {
    const m = matrix;
    const absDet = Math.abs(det2x2(m));
    if (absDet < 1e-10) return 'Singular';
    if (Math.abs(m[0][1] + m[1][0]) < 1e-10 && Math.abs(m[0][1] - m[1][0]) < 1e-10 && Math.abs(m[0][0] - m[1][1]) < 1e-10 && Math.abs(Math.abs(m[0][0]) - 1) < 1e-10) return 'Rotation';
    if (Math.abs(m[0][1]) < 1e-10 && Math.abs(m[1][0]) < 1e-10) return 'Stretch';
    if (Math.abs(m[0][0] - 1) < 1e-10 && Math.abs(m[1][1] - 1) < 1e-10 && (Math.abs(m[0][1]) > 1e-10 || Math.abs(m[1][0]) > 1e-10)) return 'Shear';
    return 'General';
  }, [matrix]);

  const isConceptualStep = CONCEPTUAL_STEPS.has(currentStep);
  const quickTip = QUICK_TIP_STEPS.has(currentStep) ? QUICK_TIPS[currentStep] : null;

  const steps = [
    {
      title: 'Your first transformation',
      concept: 'A matrix moves every point. Take any point $M \\cdot (x, y)$ and it becomes $\\begin{pmatrix} ax + by \\\\ cx + dy \\end{pmatrix}$ — watch the grid bend as thousands of points move at once!',
    },
    {
      title: 'The matrix columns are destinations',
      concept: 'The blue arrow $\\hat{\\iota} = (1,0)$ lands at column 1 = $(a, c)$. The green arrow $\\hat{\\jmath} = (0,1)$ lands at column 2 = $(b, d)$. $M = \\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}$',
    },
    {
      title: 'Spinning without stretching',
      concept: 'A rotation keeps the unit square exactly 1×1 = 1 square unit. det = 1 always. $R(\\theta) = \\begin{pmatrix} \\cos\\theta & -\\sin\\theta \\\\ \\sin\\theta & \\cos\\theta \\end{pmatrix}$',
    },
    {
      title: 'Stretching and flipping',
      concept: 'Scale horizontally by $s_x$ and vertically by $s_y$. Area changes: $|det| = |s_x \\cdot s_y|$. If $s_x$ or $s_y$ is negative, that axis FLIPS! $S = \\begin{pmatrix} s_x & 0 \\\\ 0 & s_y \\end{pmatrix}$',
    },
    {
      title: 'Slanting without squashing',
      concept: 'A shear tilts horizontal lines sideways. The square becomes a parallelogram — but area stays EXACTLY 1. det = 1 always. $\\text{Shear}(k) = \\begin{pmatrix} 1 & k \\\\ 0 & 1 \\end{pmatrix}$',
    },
    {
      title: 'The parallelogram IS the determinant',
      concept: 'The shaded parallelogram between $\\hat{\\iota}$ and $\\hat{\\jmath}$ has area = $|det|$. Drag any entry to watch it grow or shrink. $|M| = ad - bc$',
    },
    {
      title: 'Two steps in one',
      concept: 'AB means: apply B first, then apply A. Enable "Compose" to add Matrix B. $AB \\cdot x = A(B(x))$ — one matrix that does both jobs!',
    },
    {
      title: 'Order matters — a lot!',
      concept: 'Rotate-then-stretch is DIFFERENT from stretch-then-rotate. AB and BA give completely different results. $AB \\neq BA$ (in general)',
    },
    {
      title: 'Your turn — experiment!',
      concept: 'You now have full control. Drag any of the four numbers $a, b, c, d$. Try all the presets. $M = \\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}$',
    },
  ];

  useEffect(() => {
    setQuickTipVisible(true);
    setActivePresetForTip(null);
  }, [currentStep]);

  useEffect(() => {
    setAnimationPhase(0);
    if (!showCompose) {
      setComposeAnimStep(0);
      return;
    }
    setComposeAnimStep(1);
    const timer2 = setTimeout(() => setComposeAnimStep(2), 600);
    return () => {
      clearTimeout(timer2);
    };
  }, [showCompose, matrix, matrixB, composeOrder]);

  const playAnimation = useCallback(() => {
    setAnimationPhase(1);
    setAnimationProgress(0);
    
    const startMatrix = composeOrder === 'AB' ? matrix : matrixB;
    const endMatrix = composedMatrix;
    
    const startTime = performance.now();
    const duration = 1500;
    
    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setAnimationProgress(progress);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setAnimationPhase(2);
        setTimeout(() => {
          setAnimationPhase(0);
          setAnimationProgress(0);
        }, 500);
      }
    };
    
    requestAnimationFrame(animate);
  }, [composeOrder, matrix, matrixB, composedMatrix]);

  const applyPreset = useCallback((preset) => {
    setSelectedPreset(preset);
    setActivePresetForTip(preset);
    const startMatrix = matrix.map(row => [...row]);
    let targetMatrix;

    switch (preset) {
      case 'identity': targetMatrix = [[1, 0], [0, 1]]; break;
      case 'rotate': targetMatrix = rotationMatrix(rotationAngle); break;
      case 'stretch': targetMatrix = scaleMatrix(scaleX, scaleY); break;
      case 'shear': targetMatrix = shearMatrix(shearK); break;
      case 'reflectX': targetMatrix = reflectMatrix('x'); break;
      case 'reflectY': targetMatrix = reflectMatrix('y'); break;
      case 'reflectDiag': targetMatrix = reflectMatrix('y=x'); break;
      default: targetMatrix = [[1, 0], [0, 1]];
    }

    setAnimProgress(0);
    const startTime = performance.now();
    const duration = 400;
    const easeInOut = (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeInOut(progress);

      const interpolated = [
        [startMatrix[0][0] + (targetMatrix[0][0] - startMatrix[0][0]) * eased, startMatrix[0][1] + (targetMatrix[0][1] - startMatrix[0][1]) * eased],
        [startMatrix[1][0] + (targetMatrix[1][0] - startMatrix[1][0]) * eased, startMatrix[1][1] + (targetMatrix[1][1] - startMatrix[1][1]) * eased],
      ];

      setMatrix(interpolated);
      setAnimProgress(eased);

      if (progress < 1) requestAnimationFrame(animate);
      else setAnimProgress(1);
    };

    requestAnimationFrame(animate);
  }, [matrix, rotationAngle, scaleX, scaleY, shearK]);

  const handleZoomChange = useCallback((deltaOrValue) => {
    if (typeof deltaOrValue === 'number' && deltaOrValue > 0.5 && deltaOrValue < 3) {
      setZoom(z => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Math.round(z * deltaOrValue))));
    } else {
      setZoom(z => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z + (deltaOrValue > 0 ? 10 : -10))));
    }
  }, []);

  const handleMatrixEntryChange = useCallback((row, col, value) => {
    setMatrix(prev => {
      const newMatrix = prev.map(r => [...r]);
      newMatrix[row][col] = Math.max(-3, Math.min(3, value));
      return newMatrix;
    });
    setSelectedPreset('custom');
  }, []);

  const handleMatrixBEntryChange = useCallback((row, col, value) => {
    setMatrixB(prev => {
      const newMatrix = prev.map(r => [...r]);
      newMatrix[row][col] = Math.max(-3, Math.min(3, value));
      return newMatrix;
    });
  }, []);

  const isDraggingEntry = useRef(false);
  const dragEntryRef = useRef({ row: 0, col: 0, startY: 0, startValue: 0, isMatrixB: false });

  const handleDragEntry = useCallback((row, col, value, clientY, isMatrixB = false) => {
    isDraggingEntry.current = true;
    dragEntryRef.current = { row, col, startY: clientY, startValue: value, isMatrixB };
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'ns-resize';
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (isPanning.current) {
      const dx = e.clientX - lastPos.current.x;
      const dy = e.clientY - lastPos.current.y;
      setPan(p => ({ x: p.x + dx, y: p.y + dy }));
      lastPos.current = { x: e.clientX, y: e.clientY };
    }
    if (isDraggingEntry.current) {
      e.preventDefault();
      const { row, col, startY, startValue, isMatrixB } = dragEntryRef.current;
      const deltaY = startY - e.clientY;
      const newValue = Math.max(-3, Math.min(3, startValue + deltaY * 0.03));
      if (isMatrixB) {
        handleMatrixBEntryChange(row, col, newValue);
      } else {
        handleMatrixEntryChange(row, col, newValue);
      }
    }
  }, [handleMatrixEntryChange, handleMatrixBEntryChange]);

  const handleMouseUp = useCallback(() => {
    isPanning.current = false;
    isDraggingEntry.current = false;
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
  }, []);

  const handleMouseDown = useCallback((e) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      isPanning.current = true;
      lastPos.current = { x: e.clientX, y: e.clientY };
    }
  }, []);

  const resetAll = useCallback(() => {
    setMatrix([[1, 0], [0, 1]]);
    setMatrixB([[1, 0], [0, 1]]);
    setSelectedPreset('identity');
    setRotationAngle(45);
    setScaleX(2);
    setScaleY(1);
    setShearK(0.5);
    setZoom(DEFAULT_ZOOM);
    setPan({ x: 0, y: 0 });
    setAnimProgress(1);
    setComposeOrder('AB');
    setComposeAnimStep(0);
  }, []);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Top Control Bar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b flex-shrink-0 flex-wrap"
        style={{ backgroundColor: 'var(--color-paper)', borderColor: 'var(--color-rule)' }}>

        {/* Zoom */}
        <div className="flex items-center gap-1">
          <button onClick={() => handleZoomChange(-1)} className="p-1.5 rounded-lg transition-all" style={{ color: 'var(--color-muted)', backgroundColor: 'transparent' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-paper-2)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
            <ZoomOut className="w-4 h-4" />
          </button>
          <input type="range" min={MIN_ZOOM} max={MAX_ZOOM} value={zoom} onChange={e => setZoom(parseInt(e.target.value))} className="w-24 h-2 rounded-lg appearance-none cursor-pointer" style={{ accentColor: 'var(--color-accent)' }} />
          <button onClick={() => handleZoomChange(1)} className="p-1.5 rounded-lg transition-all" style={{ color: 'var(--color-muted)', backgroundColor: 'transparent' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-paper-2)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
            <ZoomIn className="w-4 h-4" />
          </button>
          <div className="px-2 py-0.5 rounded-lg text-xs font-semibold min-w-[48px] text-center" style={{ backgroundColor: 'var(--color-paper-2)', color: 'var(--color-ink)', fontFamily: 'var(--font-mono)' }}>{zoom}px</div>
          <button onClick={() => { setZoom(DEFAULT_ZOOM); setPan({ x: 0, y: 0 }); }} className="p-1.5 rounded-lg transition-all" style={{ color: 'var(--color-muted)', backgroundColor: 'transparent' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-paper-2)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
            <Move className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1" />

        {/* Presets */}
        <div className="hidden lg:flex items-center gap-1 flex-wrap">
          {[
            { key: 'identity', label: 'Identity' },
            { key: 'rotate', label: 'Rotate', tooltip: 'Spins space without stretching' },
            { key: 'stretch', label: 'Stretch', tooltip: 'Scales horizontally or vertically' },
            { key: 'shear', label: 'Shear', tooltip: 'Slants horizontal lines sideways' },
            { key: 'reflectX', label: 'Flip ↑↓', tooltip: 'Reflects over x-axis (top↔bottom)' },
            { key: 'reflectY', label: 'Flip ←→', tooltip: 'Reflects over y-axis (left↔right)' },
            { key: 'reflectDiag', label: 'Flip ↔', tooltip: 'Reflects over the diagonal line y=x' },
          ].map(preset => (
            <button key={preset.key} onClick={() => applyPreset(preset.key)} title={preset.tooltip || preset.label}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg transition-all duration-150"
              style={selectedPreset === preset.key ? { backgroundColor: 'var(--color-accent)', color: 'var(--color-paper)' } : { backgroundColor: 'var(--color-paper-2)', color: 'var(--color-ink-2)' }}>
              {preset.label}
            </button>
          ))}
        </div>

        {/* Toggles */}
        <div className="flex items-center gap-1.5">
          <button onClick={() => setLearnMode(!learnMode)} className="px-3 py-1 text-xs font-semibold rounded-lg border transition-all"
            style={learnMode ? { backgroundColor: 'var(--color-accent)', color: 'var(--color-paper)', borderColor: 'var(--color-accent)' } : { backgroundColor: 'var(--color-paper)', color: 'var(--color-ink-2)', borderColor: 'var(--color-rule)' }}>
            {learnMode ? '✓ ' : ''}Learn
          </button>
          <button onClick={() => setShowCompose(!showCompose)} className="px-3 py-1 text-xs font-semibold rounded-lg border transition-all"
            style={showCompose ? { backgroundColor: 'var(--color-accent)', color: 'var(--color-paper)', borderColor: 'var(--color-accent)' } : { backgroundColor: 'var(--color-paper)', color: 'var(--color-ink-2)', borderColor: 'var(--color-rule)' }}>
            {showCompose ? '✓ ' : ''}Compose
          </button>
        </div>

        <button onClick={resetAll} className="p-1.5 rounded-lg" style={{ color: 'var(--color-muted)', backgroundColor: 'transparent' }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-paper-2)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Step Panel */}
        {learnMode && (
          <div className="px-4 py-2.5 border-b flex-shrink-0"
            style={{ background: 'linear-gradient(to right, rgba(99,102,241,0.06), rgba(139,92,246,0.06))', borderColor: 'var(--color-rule)' }}>
            <div className="flex items-center gap-3 max-w-full">
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-paper)', fontFamily: 'var(--font-mono)' }}>
                  {currentStep + 1}
                </div>
                <span className="text-xs font-semibold" style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>/ {steps.length}</span>
              </div>
              <div className="w-px h-8 flex-shrink-0" style={{ backgroundColor: 'var(--color-rule)' }} />
              <div className="flex-1 min-w-0 overflow-hidden">
                <h3 className="text-sm font-bold mb-0.5 truncate" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-display)' }}>{steps[currentStep].title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--color-muted)' }}>
                  <InlineText text={steps[currentStep].concept} />
                </p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button onClick={() => setCurrentStep(Math.max(0, currentStep - 1))} className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
                  style={{ backgroundColor: currentStep > 0 ? 'var(--color-paper-2)' : 'transparent', color: currentStep > 0 ? 'var(--color-ink)' : 'transparent' }} disabled={currentStep <= 0}>
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-0.5">
                  {steps.map((_, i) => (
                    <button key={i} onClick={() => setCurrentStep(i)} className="rounded-full transition-all" style={{ width: currentStep === i ? 8 : 5, height: currentStep === i ? 8 : 5, backgroundColor: currentStep === i ? 'var(--color-accent)' : 'var(--color-rule)', cursor: 'pointer' }} />
                  ))}
                </div>
                <button onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))} className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
                  style={{ backgroundColor: currentStep < steps.length - 1 ? 'var(--color-accent)' : 'transparent', color: currentStep < steps.length - 1 ? 'var(--color-paper)' : 'transparent' }} disabled={currentStep >= steps.length - 1}>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Tip for preset steps */}
            {quickTip && quickTipVisible && (
              <div className="mt-2 p-3 rounded-xl" style={{ backgroundColor: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}>
                <div className="flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#F59E0B' }} />
                  <div className="flex-1">
                    <div className="font-semibold text-xs mb-1" style={{ color: '#F59E0B' }}>{quickTip.title}</div>
                    <div className="text-xs mb-2" style={{ color: 'var(--color-muted)' }}>{quickTip.tip}</div>
                    <div className="text-xs font-semibold" style={{ color: 'var(--color-ink)' }}>{quickTip.action}</div>
                  </div>
                  <button onClick={() => setQuickTipVisible(false)} className="p-1 rounded-lg" style={{ color: 'var(--color-muted)' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-paper-3)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                    ✕
                  </button>
                </div>
                {quickTip.presets.length > 0 && (
                  <div className="flex items-center gap-1 mt-2">
                    <span className="text-xs" style={{ color: 'var(--color-muted)' }}>Try:</span>
                    {quickTip.presets.map(p => (
                      <button key={p} onClick={() => applyPreset(p)}
                        className="px-2 py-1 text-xs font-semibold rounded-lg transition-all"
                        style={activePresetForTip === p ? { backgroundColor: 'var(--color-accent)', color: 'var(--color-paper)' } : { backgroundColor: 'var(--color-paper-2)', color: 'var(--color-ink)' }}>
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {quickTip && !quickTipVisible && (
              <button onClick={() => setQuickTipVisible(true)} className="mt-2 flex items-center gap-1 text-xs" style={{ color: '#F59E0B' }}>
                <Lightbulb className="w-3 h-3" /> Show Tip
              </button>
            )}
          </div>
        )}

        {/* Canvas + Right Panel */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Main Canvas */}
          <div className="flex-1 min-h-0 min-w-0 relative">
            <div ref={canvasRef} className="w-full h-full select-none" style={{ backgroundColor: 'var(--color-paper)', touchAction: 'none', minHeight: '500px', userSelect: 'none', WebkitUserSelect: 'none' }}
              onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
              {(() => {
                let displayMatrix = showCompose ? composedMatrix : matrix;
                let showOverlay = false;
                
                if (animationPhase === 1) {
                  const startM = composeOrder === 'AB' ? matrix : matrixB;
                  const endM = composedMatrix;
                  const t = animationProgress;
                  const easeT = t * t * (3 - 2 * t);
                  displayMatrix = [
                    [startM[0][0] + (endM[0][0] - startM[0][0]) * easeT, startM[0][1] + (endM[0][1] - startM[0][1]) * easeT],
                    [startM[1][0] + (endM[1][0] - startM[1][0]) * easeT, startM[1][1] + (endM[1][1] - startM[1][1]) * easeT],
                  ];
                  showOverlay = true;
                }
                
                return (
                  <TransformGrid
                    matrix={displayMatrix}
                    animProgress={animProgress}
                    showGrid={showGrid}
                    showBasis={showBasis}
                    showShape={showShape}
                    zoom={zoom}
                    pan={pan}
                    onZoomChange={handleZoomChange}
                    onDragEntry={handleDragEntry}
                    interactive={!showCompose && animationPhase === 0}
                    overlayMatrix={showOverlay ? (composeOrder === 'AB' ? matrix : matrixB) : 0}
                    overlayOpacity={showOverlay ? 0.4 : 0}
                  />
                );
              })()}
            </div>

            {/* Preset Sliders */}
            {selectedPreset === 'rotate' && (
              <div className="absolute top-3 left-3 p-3 rounded-xl max-w-[200px]" style={{ backgroundColor: 'color-mix(in oklch, var(--color-paper) 92%, transparent)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid var(--color-rule)' }}>
                <div className="text-xs font-semibold mb-2" style={{ color: 'var(--color-ink)' }}>Angle</div>
                <input type="range" min="0" max="360" value={rotationAngle} onChange={e => { setRotationAngle(parseInt(e.target.value)); applyPreset('rotate'); }} className="w-full h-2 rounded-lg" style={{ accentColor: 'var(--color-accent)' }} />
                <div className="text-center text-sm font-mono font-semibold mt-1" style={{ color: 'var(--color-accent)' }}>{rotationAngle}°</div>
              </div>
            )}

            {selectedPreset === 'stretch' && (
              <div className="absolute top-3 left-3 p-3 rounded-xl max-w-[200px]" style={{ backgroundColor: 'color-mix(in oklch, var(--color-paper) 92%, transparent)', backdropFilter: 'blur(12px)', border: '1px solid var(--color-rule)' }}>
                <div className="text-xs font-semibold mb-2" style={{ color: 'var(--color-ink)' }}>Stretch</div>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--color-muted)' }}>
                      <span>sx (horizontal)</span><span className="font-mono font-semibold" style={{ color: '#4A90E2' }}>{scaleX.toFixed(1)}</span>
                    </div>
                    <input type="range" min="-2" max="3" step="0.1" value={scaleX} onChange={e => { setScaleX(parseFloat(e.target.value)); applyPreset('stretch'); }} className="w-full h-2 rounded-lg" style={{ accentColor: '#4A90E2' }} />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--color-muted)' }}>
                      <span>sy (vertical)</span><span className="font-mono font-semibold" style={{ color: '#7ED321' }}>{scaleY.toFixed(1)}</span>
                    </div>
                    <input type="range" min="-2" max="3" step="0.1" value={scaleY} onChange={e => { setScaleY(parseFloat(e.target.value)); applyPreset('stretch'); }} className="w-full h-2 rounded-lg" style={{ accentColor: '#7ED321' }} />
                  </div>
                </div>
                <div className="text-xs text-center mt-2" style={{ color: 'var(--color-muted)' }}>det = {(scaleX * scaleY).toFixed(2)}</div>
              </div>
            )}

            {selectedPreset === 'shear' && (
              <div className="absolute top-3 left-3 p-3 rounded-xl max-w-[200px]" style={{ backgroundColor: 'color-mix(in oklch, var(--color-paper) 92%, transparent)', backdropFilter: 'blur(12px)', border: '1px solid var(--color-rule)' }}>
                <div className="text-xs font-semibold mb-2" style={{ color: 'var(--color-ink)' }}>Shear (k)</div>
                <input type="range" min="-2" max="2" step="0.1" value={shearK} onChange={e => { setShearK(parseFloat(e.target.value)); applyPreset('shear'); }} className="w-full h-2 rounded-lg" style={{ accentColor: 'var(--color-accent)' }} />
                <div className="text-center text-sm font-mono font-semibold mt-1" style={{ color: 'var(--color-accent)' }}>k = {shearK.toFixed(1)}</div>
                <div className="text-xs text-center mt-1" style={{ color: 'var(--color-muted)' }}>det = 1.00 (area preserved)</div>
              </div>
            )}

            {/* Compose 3-Panel View */}
            {showCompose && (
              <div className="absolute bottom-3 left-3 right-3 p-4 rounded-xl" style={{ backgroundColor: 'color-mix(in oklch, var(--color-paper) 96%, transparent)', backdropFilter: 'blur(16px)', border: '1px solid var(--color-rule)', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
                {/* Header with Order Toggle and View Controls */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold" style={{ color: 'var(--color-accent)' }}>Compose</span>
                    <div className="flex items-center bg-black/5 rounded-lg p-0.5">
                      <button
                        onClick={() => setComposeOrder('AB')}
                        className="px-2.5 py-1 text-xs font-bold rounded-md transition-all duration-200"
                        style={composeOrder === 'AB' ? { backgroundColor: 'var(--color-accent)', color: 'white' } : { backgroundColor: 'transparent', color: 'var(--color-muted)' }}
                      >
                        A × B
                      </button>
                      <button
                        onClick={() => setComposeOrder('BA')}
                        className="px-2.5 py-1 text-xs font-bold rounded-md transition-all duration-200"
                        style={composeOrder === 'BA' ? { backgroundColor: 'var(--color-accent)', color: 'white' } : { backgroundColor: 'transparent', color: 'var(--color-muted)' }}
                      >
                        B × A
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* View Mode Toggle */}
                    <div className="flex items-center bg-black/5 rounded-lg p-0.5">
                      <button
                        onClick={() => setComposeViewMode('preview')}
                        className="px-2.5 py-1 text-xs font-semibold rounded-md transition-all duration-200"
                        style={composeViewMode === 'preview' ? { backgroundColor: 'var(--color-accent)', color: 'white' } : { backgroundColor: 'transparent', color: 'var(--color-muted)' }}
                      >
                        Preview
                      </button>
                      <button
                        onClick={playAnimation}
                        className="px-2.5 py-1 text-xs font-semibold rounded-md transition-all duration-200 flex items-center gap-1"
                        style={animationPhase > 0 ? { backgroundColor: 'var(--color-accent)', color: 'white' } : { backgroundColor: 'transparent', color: 'var(--color-muted)' }}
                      >
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                        Animate
                      </button>
                    </div>
                    {/* Step Animation Indicator */}
                    <div className="flex items-center gap-2 text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className={`px-2 py-0.5 rounded-full font-semibold transition-all ${composeAnimStep >= 1 ? 'ring-2 ring-offset-1' : ''} ${animationPhase === 1 ? 'animate-pulse' : ''}`}
                          style={{ backgroundColor: 'rgba(139,92,246,0.2)', color: '#8B5CF6', ringColor: '#8B5CF6' }}>
                          {composeOrder === 'AB' ? 'A' : 'B'}
                        </div>
                        <svg className="w-3 h-3" style={{ color: 'var(--color-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                        <div className={`px-2 py-0.5 rounded-full font-semibold transition-all ${composeAnimStep >= 2 ? 'ring-2 ring-offset-1' : ''}`}
                          style={{ backgroundColor: 'rgba(126,211,33,0.2)', color: '#7ED321', ringColor: '#7ED321' }}>
                          AB
                        </div>
                      </div>
                    </div>
                    <div className="text-xs font-mono px-2 py-1 rounded-lg" style={{ backgroundColor: Math.abs(detCompose) < 1e-10 ? 'rgba(220,53,69,0.15)' : detCompose > 0 ? 'rgba(126,211,33,0.15)' : 'rgba(220,53,69,0.15)', color: Math.abs(detCompose) < 1e-10 ? '#DC3749' : detCompose > 0 ? '#7ED321' : '#DC3749' }}>
                      det = {detCompose.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Matrices */}
                <div className="flex items-center justify-center gap-2 text-base font-bold" style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
                  <div className={`px-2 py-1 rounded-lg transition-all duration-300 ${animationPhase === 1 ? 'ring-2 ring-offset-1 ring-purple-500 bg-purple-500/10 scale-110' : ''}`}>
                    <Matrix matrix={composeOrder === 'AB' ? matrix : matrixB} name={composeOrder === 'AB' ? 'A' : 'B'} />
                  </div>
                  <span className="mx-1 text-lg" style={{ color: 'var(--color-muted)' }}>×</span>
                  <Matrix matrix={composeOrder === 'AB' ? matrixB : matrix} name={composeOrder === 'AB' ? 'B' : 'A'} />
                  <span className="mx-2 text-lg" style={{ color: 'var(--color-muted)' }}>=</span>
                  <Matrix matrix={composedMatrix} name="AB" />
                </div>

                {/* B Inputs */}
                <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--color-rule)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold" style={{ color: 'var(--color-accent)' }}>Edit Matrix B</span>
                    <div className="flex gap-1">
                      {[
                        { key: 'identity', label: 'Identity', color: '#6B7280' },
                        { key: 'rotate', label: 'Rotate 45°', color: '#8B5CF6' },
                        { key: 'stretch', label: 'Stretch', color: '#F59E0B' },
                        { key: 'shear', label: 'Shear', color: '#EC4899' },
                      ].map(preset => (
                        <button
                          key={preset.key}
                          onClick={() => {
                            let m;
                            switch (preset.key) {
                              case 'identity': m = [[1, 0], [0, 1]]; break;
                              case 'rotate': m = rotationMatrix(45); break;
                              case 'stretch': m = [[2, 0], [0, 1]]; break;
                              case 'shear': m = shearMatrix(0.5); break;
                              default: m = [[1, 0], [0, 1]];
                            }
                            setMatrixB(m);
                          }}
                          className="px-2 py-1 text-xs font-medium rounded-md transition-all hover:scale-105"
                          style={{ backgroundColor: `${preset.color}15`, color: preset.color, border: `1px solid ${preset.color}30` }}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 max-w-[200px] mx-auto">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold w-4" style={{ color: '#F59E0B' }}>w</span>
                      <input
                        type="number"
                        step="0.1"
                        value={matrixB[0][0].toFixed(2)}
                        onChange={e => handleMatrixBEntryChange(0, 0, parseFloat(e.target.value) || 0)}
                        className="flex-1 px-2 py-1.5 text-sm text-center rounded-lg font-mono outline-none"
                        style={{ backgroundColor: 'var(--color-paper)', border: '1px solid var(--color-rule)', color: '#F59E0B' }}
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold w-4" style={{ color: '#EC4899' }}>x</span>
                      <input
                        type="number"
                        step="0.1"
                        value={matrixB[0][1].toFixed(2)}
                        onChange={e => handleMatrixBEntryChange(0, 1, parseFloat(e.target.value) || 0)}
                        className="flex-1 px-2 py-1.5 text-sm text-center rounded-lg font-mono outline-none"
                        style={{ backgroundColor: 'var(--color-paper)', border: '1px solid var(--color-rule)', color: '#EC4899' }}
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold w-4" style={{ color: '#F59E0B' }}>y</span>
                      <input
                        type="number"
                        step="0.1"
                        value={matrixB[1][0].toFixed(2)}
                        onChange={e => handleMatrixBEntryChange(1, 0, parseFloat(e.target.value) || 0)}
                        className="flex-1 px-2 py-1.5 text-sm text-center rounded-lg font-mono outline-none"
                        style={{ backgroundColor: 'var(--color-paper)', border: '1px solid var(--color-rule)', color: '#F59E0B' }}
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold w-4" style={{ color: '#EC4899' }}>z</span>
                      <input
                        type="number"
                        step="0.1"
                        value={matrixB[1][1].toFixed(2)}
                        onChange={e => handleMatrixBEntryChange(1, 1, parseFloat(e.target.value) || 0)}
                        className="flex-1 px-2 py-1.5 text-sm text-center rounded-lg font-mono outline-none"
                        style={{ backgroundColor: 'var(--color-paper)', border: '1px solid var(--color-rule)', color: '#EC4899' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Formula */}
                <div className="text-xs text-center mt-3 pt-2 border-t" style={{ borderColor: 'var(--color-rule)', color: 'var(--color-muted)' }}>
                  det(A×B) = det(A) × det(B) = {det.toFixed(2)} × {detB.toFixed(2)} = {detCompose.toFixed(2)}
                </div>
              </div>
            )}
          </div>

          {/* Right Panel */}
          <div className="w-64 lg:w-72 flex-shrink-0 min-h-0 overflow-y-auto border-l" style={{ backgroundColor: 'var(--color-paper)', borderColor: 'var(--color-rule)' }}>
            <div className="p-3 space-y-3">
              {/* Matrix with friendly labels */}
              <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--color-paper-2)' }}>
                <div className="font-semibold mb-2 text-xs" style={{ color: 'var(--color-neutral)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Matrix M</div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold w-4" style={{ color: '#4A90E2' }}>a</span>
                    <input type="number" step="0.1" value={matrix[0][0].toFixed(2)} onChange={e => handleMatrixEntryChange(0, 0, parseFloat(e.target.value) || 0)}
                      className="flex-1 px-2 py-1.5 text-sm text-center rounded-lg font-mono outline-none"
                      style={{ backgroundColor: 'var(--color-paper)', border: '1px solid var(--color-rule)', color: '#4A90E2' }} />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold w-4" style={{ color: '#7ED321' }}>b</span>
                    <input type="number" step="0.1" value={matrix[0][1].toFixed(2)} onChange={e => handleMatrixEntryChange(0, 1, parseFloat(e.target.value) || 0)}
                      className="flex-1 px-2 py-1.5 text-sm text-center rounded-lg font-mono outline-none"
                      style={{ backgroundColor: 'var(--color-paper)', border: '1px solid var(--color-rule)', color: '#7ED321' }} />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold w-4" style={{ color: '#4A90E2' }}>c</span>
                    <input type="number" step="0.1" value={matrix[1][0].toFixed(2)} onChange={e => handleMatrixEntryChange(1, 0, parseFloat(e.target.value) || 0)}
                      className="flex-1 px-2 py-1.5 text-sm text-center rounded-lg font-mono outline-none"
                      style={{ backgroundColor: 'var(--color-paper)', border: '1px solid var(--color-rule)', color: '#4A90E2' }} />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold w-4" style={{ color: '#7ED321' }}>d</span>
                    <input type="number" step="0.1" value={matrix[1][1].toFixed(2)} onChange={e => handleMatrixEntryChange(1, 1, parseFloat(e.target.value) || 0)}
                      className="flex-1 px-2 py-1.5 text-sm text-center rounded-lg font-mono outline-none"
                      style={{ backgroundColor: 'var(--color-paper)', border: '1px solid var(--color-rule)', color: '#7ED321' }} />
                  </div>
                </div>
                <div className="text-xs text-center mt-2 flex items-center justify-center gap-1" style={{ color: 'var(--color-muted)' }}>
                  <span>Drag handles ↑↓ to change values</span>
                </div>
              </div>

              {/* Determinant */}
              <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--color-paper-2)' }}>
                <div className="font-semibold mb-1 text-xs" style={{ color: 'var(--color-neutral)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Determinant</div>
                <div className="text-center py-2 rounded-xl font-mono font-bold text-lg"
                  style={{ backgroundColor: Math.abs(det) < 1e-10 ? 'rgba(220,53,69,0.1)' : det > 0 ? 'rgba(126,211,33,0.15)' : 'rgba(220,53,69,0.15)', color: Math.abs(det) < 1e-10 ? '#DC3749' : det > 0 ? '#7ED321' : '#DC3749', border: `2px solid ${Math.abs(det) < 1e-10 ? 'rgba(220,53,69,0.3)' : det > 0 ? 'rgba(126,211,33,0.3)' : 'rgba(220,53,69,0.3)'}` }}>
                  |det| = {Math.abs(det).toFixed(3)}
                </div>
                <div className="text-xs text-center mt-2" style={{ color: 'var(--color-muted)' }}>
                  {Math.abs(det) < 1e-10 ? 'Zero — space is flattened!' : det > 0 ? `Area × ${Math.abs(det).toFixed(2)}` : `Area × ${Math.abs(det).toFixed(2)} + flipped`}
                </div>
              </div>

              {/* Type */}
              <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--color-paper-2)' }}>
                <div className="font-semibold mb-1 text-xs" style={{ color: 'var(--color-neutral)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Type</div>
                <div className="text-center py-2 rounded-xl font-semibold" style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-paper)' }}>{transformType}</div>
              </div>

              {/* Basis Vectors */}
              <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--color-paper-2)' }}>
                <div className="font-semibold mb-2 text-xs" style={{ color: 'var(--color-neutral)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Basis Vectors</div>
                <div className="space-y-1.5 text-sm font-mono">
                  <div className="flex items-center gap-2 p-1.5 rounded-lg" style={{ backgroundColor: 'var(--color-paper)' }}>
                    <span className="font-bold" style={{ color: '#4A90E2' }}>î</span>
                    <span style={{ color: 'var(--color-muted)' }}>→</span>
                    <span style={{ color: 'var(--color-ink)' }}>[{matrix[0][0].toFixed(2)}, {matrix[1][0].toFixed(2)}]</span>
                  </div>
                  <div className="flex items-center gap-2 p-1.5 rounded-lg" style={{ backgroundColor: 'var(--color-paper)' }}>
                    <span className="font-bold" style={{ color: '#7ED321' }}>ĵ</span>
                    <span style={{ color: 'var(--color-muted)' }}>→</span>
                    <span style={{ color: 'var(--color-ink)' }}>[{matrix[0][1].toFixed(2)}, {matrix[1][1].toFixed(2)}]</span>
                  </div>
                </div>
              </div>

              {/* Invertible */}
              <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--color-paper-2)' }}>
                <div className="font-semibold mb-1 text-xs" style={{ color: 'var(--color-neutral)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Invertible</div>
                <div className="text-center py-2 rounded-xl font-semibold"
                  style={{ backgroundColor: invertible ? 'rgba(126,211,33,0.15)' : 'rgba(220,53,69,0.15)', color: invertible ? '#7ED321' : '#DC3749', border: invertible ? '2px solid rgba(126,211,33,0.3)' : '2px solid rgba(220,53,69,0.3)' }}>
                  {invertible ? '✓ Yes' : '✗ No'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom hint bar */}
      <div className="px-4 py-1.5 text-xs flex items-center justify-center gap-3 border-t"
        style={{ backgroundColor: 'var(--color-paper-2)', borderColor: 'var(--color-rule)', color: 'var(--color-muted)' }}>
        <span>Edit a, b, c, d in sidebar</span>
        <span>·</span>
        <span>Scroll to zoom</span>
        <span>·</span>
        <span>Alt+drag to pan</span>
        <span>·</span>
        <span>|det| = area scaling</span>
      </div>
    </div>
  );
}