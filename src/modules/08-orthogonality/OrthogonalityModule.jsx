import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, SkipForward, ChevronRight, Info, Target, Gamepad2 } from 'lucide-react';
import { Button } from '../../components/UI/Button';
import { Card } from '../../components/UI/Card';
import { useStore } from '../../store/useStore';
import CompletionToggle from '../../components/UI/CompletionToggle';
import GameWrapper from '../../components/MiniGame/GameWrapper';
import { projectOnto, dotProduct, normalize } from '../../utils/linalg';
import LeastSquaresFit from '../../games/LeastSquaresFit';

const CANVAS_SIZE = 400;
const GRID_SIZE = 40;

const ACCENT = 'oklch(52% 0.12 235)';
const EMERALD = 'oklch(52% 0.16 155)';
const RED = 'oklch(52% 0.16 25)';
const AMBER = 'oklch(65% 0.10 70)';
const PURPLE = 'oklch(50% 0.12 270)';

function toCanvasCoords(x, y, cx = CANVAS_SIZE / 2, cy = CANVAS_SIZE / 2, scale = 20) {
  return { x: cx + x * scale, y: cy - y * scale };
}

function fromCanvasCoords(cx, cy, scale = 20) {
  return { x: (cx - CANVAS_SIZE / 2) / scale, y: (CANVAS_SIZE / 2 - cy) / scale };
}

function drawGrid(ctx, scale = 20) {
  const centerX = CANVAS_SIZE / 2;
  const centerY = CANVAS_SIZE / 2;

  ctx.strokeStyle = 'var(--color-rule)';
  ctx.lineWidth = 1;

  for (let x = 0; x <= CANVAS_SIZE; x += scale) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, CANVAS_SIZE);
    ctx.stroke();
  }

  for (let y = 0; y <= CANVAS_SIZE; y += scale) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(CANVAS_SIZE, y);
    ctx.stroke();
  }

  ctx.strokeStyle = 'var(--color-muted)';
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.moveTo(0, centerY);
  ctx.lineTo(CANVAS_SIZE, centerY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(centerX, 0);
  ctx.lineTo(centerX, CANVAS_SIZE);
  ctx.stroke();
}

function drawAxisLabels(ctx) {
  ctx.fillStyle = 'var(--color-neutral)';
  ctx.font = '12px monospace';
  ctx.textAlign = 'center';

  for (let i = -10; i <= 10; i++) {
    if (i === 0) continue;
    const pos = toCanvasCoords(i, 0);
    ctx.fillText(i.toString(), pos.x, CANVAS_SIZE / 2 + 20);
  }

  ctx.textAlign = 'left';
  for (let i = -10; i <= 10; i++) {
    if (i === 0) continue;
    const pos = toCanvasCoords(0, i);
    ctx.fillText(i.toString(), CANVAS_SIZE / 2 + 8, pos.y + 4);
  }
}

function drawVector(ctx, start, end, color = ACCENT, width = 3, label = '', arrowHead = true) {
  const s = toCanvasCoords(start[0], start[1]);
  const e = toCanvasCoords(end[0], end[1]);

  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';

  ctx.beginPath();
  ctx.moveTo(s.x, s.y);
  ctx.lineTo(e.x, e.y);
  ctx.stroke();

  if (arrowHead) {
    const angle = Math.atan2(s.y - e.y, e.x - s.x);
    const headLen = 12;

    ctx.beginPath();
    ctx.moveTo(e.x, e.y);
    ctx.lineTo(e.x - headLen * Math.cos(angle - Math.PI / 6), e.y + headLen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(e.x - headLen * Math.cos(angle + Math.PI / 6), e.y + headLen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
  }

  if (label) {
    const midX = (s.x + e.x) / 2;
    const midY = (s.y + e.y) / 2;
    ctx.fillStyle = color;
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(label, midX, midY - 8);
  }
}

function drawLine(ctx, point, direction, length = 10, color = PURPLE, dashed = false) {
  const p = toCanvasCoords(point[0], point[1]);
  const d = { x: point[0] + direction[0] * length, y: point[1] + direction[1] * length };
  const e = toCanvasCoords(d.x, d.y);

  const negD = { x: point[0] - direction[0] * length, y: point[1] - direction[1] * length };
  const ne = toCanvasCoords(negD.x, negD.y);

  ctx.strokeStyle = color;
  ctx.lineWidth = 2;

  if (dashed) {
    ctx.setLineDash([8, 4]);
  }

  ctx.beginPath();
  ctx.moveTo(ne.x, ne.y);
  ctx.lineTo(e.x, e.y);
  ctx.stroke();

  ctx.setLineDash([]);
}

function drawRightAngle(ctx, corner, v1, v2, size = 15) {
  const c = toCanvasCoords(corner[0], corner[1]);
  const dir1 = normalize(v1);
  const dir2 = normalize(v2);

  const p1 = { x: c.x + dir1[0] * size, y: c.y - dir1[1] * size };
  const p2 = { x: c.x + dir2[0] * size, y: c.y - dir2[1] * size };

  ctx.strokeStyle = EMERALD;
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(c.x, c.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.stroke();

  const corner1 = { x: c.x + dir1[0] * size, y: c.y - dir1[1] * size };
  const corner2 = { x: c.x + dir2[0] * size, y: c.y - dir2[1] * size };

  const midX = (c.x + corner1.x + corner2.x) / 3;
  const midY = (c.y + corner1.y + corner2.y) / 3;

  ctx.fillStyle = EMERALD;
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('90°', midX, midY + 4);
}

export default function OrthogonalityModule({ onHighlight }) {
  const { currentModule } = useStore();
  const [activeTab, setActiveTab] = useState('projection');
  const [showGuided, setShowGuided] = useState(false);
  const [showGame, setShowGame] = useState(false);
  const [guidedStep, setGuidedStep] = useState(0);
  const [animationPhase, setAnimationPhase] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef(null);

  const [vectorB, setVectorB] = useState([4, 3]);
  const [subspaceW, setSubspaceW] = useState([1, 0.7]);
  const [isDragging, setIsDragging] = useState(false);

  const [gsStep, setGsStep] = useState(0);
  const [gsVector1, setGsVector1] = useState([3, 2]);
  const [gsVector2, setGsVector2] = useState([1.5, 4]);

  const [lineParams, setLineParams] = useState({ slope: 1.2, intercept: -0.5 });
  const [lsPoints, setLsPoints] = useState([
    { x: 1, y: 2.5 },
    { x: 2, y: 3.8 },
    { x: 3, y: 4.2 },
    { x: 4, y: 5.5 },
    { x: 5, y: 5.8 },
  ]);
  const [isDraggingLine, setIsDraggingLine] = useState(false);
  const [dragLineStart, setDragLineStart] = useState({ x: 0, y: 0 });

  const projection = useMemo(() => {
    return projectOnto(vectorB, subspaceW);
  }, [vectorB, subspaceW]);

  const orthogonalComponent = useMemo(() => {
    return [vectorB[0] - projection[0], vectorB[1] - projection[1]];
  }, [vectorB, projection]);

  const gsSteps = useMemo(() => {
    const e1 = normalize(gsVector1);
    const u2 = gsVector2;
    const dotE1U2 = dotProduct(u2, e1);
    const proj = e1.map(v => v * dotE1U2);
    const v2 = [u2[0] - proj[0], u2[1] - proj[1]];
    const e2 = normalize(v2);

    return [
      { vectors: [gsVector1, gsVector2], labels: ['u₁', 'u₂'], highlight: [], description: 'Start with two non-orthogonal vectors' },
      { vectors: [gsVector1, gsVector2], labels: ['e₁ = normalize(u₁)', 'u₂'], highlight: [0], description: 'Set e₁ = normalize(u₁)' },
      { vectors: [e1, gsVector2], labels: ['e₁', 'u₂'], highlight: [], description: `e₁ = [${e1[0].toFixed(2)}, ${e1[1].toFixed(2)}]` },
      { vectors: [e1, gsVector2], labels: ['e₁', 'u₂'], highlight: [1], subtract: gsVector2, proj: proj, description: `Subtract projection: u₂ - (u₂·e₁)e₁` },
      { vectors: [e1, v2], labels: ['e₁', 'v₂'], highlight: [], subtract: gsVector2, proj: proj, description: `v₂ = [${v2[0].toFixed(2)}, ${v2[1].toFixed(2)}]` },
      { vectors: [e1, e2], labels: ['e₁', 'e₂'], highlight: [1], description: 'e₂ = normalize(v₂)' },
      { vectors: [e1, e2], labels: ['e₁', 'e₂'], highlight: [], description: `Orthogonal basis: e₁ · e₂ = ${dotProduct(e1, e2).toFixed(2)}` },
    ];
  }, [gsVector1, gsVector2]);

  const leastSquaresResult = useMemo(() => {
    const n = lsPoints.length;
    const sumX = lsPoints.reduce((s, p) => s + p.x, 0);
    const sumY = lsPoints.reduce((s, p) => s + p.y, 0);
    const sumXY = lsPoints.reduce((s, p) => s + p.x * p.y, 0);
    const sumX2 = lsPoints.reduce((s, p) => s + p.x * p.x, 0);

    const denom = n * sumX2 - sumX * sumX;
    if (Math.abs(denom) < 1e-10) return null;

    const slope = (n * sumXY - sumX * sumY) / denom;
    const intercept = (sumY - slope * sumX) / n;

    const residuals = lsPoints.map(p => p.y - (slope * p.x + intercept));
    const ssr = residuals.reduce((s, r) => s + r * r, 0);

    return { slope, intercept, residuals, ssr };
  }, [lsPoints]);

  const currentLineSSR = useMemo(() => {
    const residuals = lsPoints.map(p => {
      const predicted = lineParams.slope * p.x + lineParams.intercept;
      return p.y - predicted;
    });
    return residuals.reduce((s, r) => s + r * r, 0);
  }, [lsPoints, lineParams]);

  useEffect(() => {
    if (!isAnimating) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      return;
    }

    let start = null;
    const duration = 2000;

    const animate = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);

      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimationPhase(Math.floor(eased * 4));

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isAnimating]);

  const handleCanvasMouseDown = useCallback((e) => {
    if (activeTab !== 'projection') return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const vecPos = toCanvasCoords(vectorB[0], vectorB[1]);

    const dist = Math.sqrt(Math.pow(x - vecPos.x, 2) + Math.pow(y - vecPos.y, 2));

    if (dist < 25) {
      setIsDragging(true);
    }
  }, [activeTab, vectorB]);

  const handleCanvasMouseMove = useCallback((e) => {
    if (!isDragging) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const coords = fromCanvasCoords(x, y);

    setVectorB([coords.x, coords.y]);
  }, [isDragging]);

  const handleCanvasMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleLineDragStart = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const coords = fromCanvasCoords(x, y);

    setIsDraggingLine(true);
    setDragLineStart(coords);
  }, []);

  const handleLineDrag = useCallback((e) => {
    if (!isDraggingLine) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const coords = fromCanvasCoords(x, y);

    const dx = coords.x - dragLineStart.x;
    const dy = coords.y - dragLineStart.y;

    const newSlope = lineParams.slope + dy * 0.1;
    const newIntercept = lineParams.intercept + dy * 0.1 + dx * 0.05;

    setLineParams({ slope: Math.max(-5, Math.min(5, newSlope)), intercept: newIntercept });
    setDragLineStart(coords);
  }, [isDraggingLine, dragLineStart, lineParams]);

  const handleLineDragEnd = useCallback(() => {
    setIsDraggingLine(false);
  }, []);

  const resetAnimation = () => {
    setAnimationPhase(0);
    setIsAnimating(false);
    setGsStep(0);
  };

  const ProjectionCanvas = () => (
    <div style={{ position: 'relative' }}>
      <svg
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        style={{
          backgroundColor: 'var(--color-paper)',
          borderRadius: '12px',
          border: '1px solid var(--color-rule)',
          cursor: 'crosshair'
        }}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
      >
        <CanvasContent
          vectorB={vectorB}
          subspaceW={subspaceW}
          projection={projection}
          orthogonal={orthogonalComponent}
          animationPhase={animationPhase}
        />
      </svg>

      <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '8px' }}>
        <Button variant="ghost" size="xs" icon={RotateCcw} onClick={resetAnimation}>
          Reset
        </Button>
        <Button
          variant="ghost"
          size="xs"
          icon={isAnimating ? Pause : Play}
          onClick={() => setIsAnimating(!isAnimating)}
        >
          {isAnimating ? 'Pause' : 'Play'}
        </Button>
      </div>

      <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '16px', height: '4px', backgroundColor: ACCENT, borderRadius: '4px' }} />
            <span style={{ color: 'var(--color-neutral)' }}>Vector b</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '16px', height: '4px', backgroundImage: 'repeating-linear-gradient(90deg, oklch(50% 0.12 270) 0, oklch(50% 0.12 270) 4px, transparent 4px, transparent 8px)' }} />
            <span style={{ color: 'var(--color-neutral)' }}>Subspace W</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '16px', height: '4px', backgroundColor: EMERALD, borderRadius: '4px' }} />
            <span style={{ color: 'var(--color-neutral)' }}>Projection</span>
          </div>
        </div>
        <div style={{ fontSize: '12px', color: 'var(--color-muted)' }}>
          Drag the blue vector tip to move b
        </div>
      </div>
    </div>
  );

  const CanvasContent = ({ vectorB, subspaceW, projection, orthogonal, animationPhase }) => {
    const ctx = useRef(null);

    useEffect(() => {
      const svg = document.querySelector(`svg`);
      ctx.current = document.createElement('canvas').getContext('2d');

      const canvas = document.createElement('canvas');
      canvas.width = CANVAS_SIZE;
      canvas.height = CANVAS_SIZE;
      ctx.current = canvas.getContext('2d');

      drawGrid(ctx.current);

      drawLine(ctx.current, [0, 0], subspaceW, 12, PURPLE, true);

      if (animationPhase >= 1) {
        drawVector(ctx.current, [0, 0], projection, EMERALD, 4, 'proj(b)');
      }

      if (animationPhase >= 2) {
        drawVector(ctx.current, [0, 0], orthogonal, AMBER, 3, 'b - proj(b)');
      }

      if (animationPhase >= 3) {
        drawRightAngle(ctx.current, projection, subspaceW, orthogonal, 20);
      }

      drawVector(ctx.current, [0, 0], vectorB, ACCENT, 3, 'b');

      ctx.current.fillStyle = ACCENT;
      const bPos = toCanvasCoords(vectorB[0], vectorB[1]);
      ctx.current.beginPath();
      ctx.current.arc(bPos.x, bPos.y, 8, 0, Math.PI * 2);
      ctx.current.fill();
      ctx.current.strokeStyle = 'oklch(52% 0.15 235)';
      ctx.current.lineWidth = 2;
      ctx.current.stroke();

      const imageData = ctx.current.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      const existingContent = svg.querySelector('canvas');
      if (existingContent) {
        existingContent.remove();
      }

      const canvasEl = document.createElement('canvas');
      canvasEl.width = CANVAS_SIZE;
      canvasEl.height = CANVAS_SIZE;
      canvasEl.getContext('2d').putImageData(imageData, 0, 0);
      svg.insertBefore(canvasEl, svg.firstChild);

    }, [vectorB, subspaceW, projection, orthogonal, animationPhase]);

    return (
      <>
        <rect x="0" y="0" width={CANVAS_SIZE} height={CANVAS_SIZE} fill="transparent" />
      </>
    );
  };

  const GSVisualization = ({ step }) => {
    const current = gsSteps[step] || gsSteps[0];

    return (
      <div style={{ position: 'relative' }}>
        <svg width={CANVAS_SIZE} height={CANVAS_SIZE} style={{
          backgroundColor: 'var(--color-paper)',
          borderRadius: '12px',
          border: '1px solid var(--color-rule)'
        }}>
          <GridPattern />
          <GSCanvasContent current={current} step={step} />
        </svg>

        <div style={{ marginTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '16px' }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setGsStep(0)}
              disabled={step === 0}
            >
              Reset
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={SkipForward}
              onClick={() => setGsStep(Math.min(step + 1, gsSteps.length - 1))}
              disabled={step >= gsSteps.length - 1}
            >
              Step
            </Button>
          </div>

          <motion.div
            key={step}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              padding: '16px',
              backgroundColor: 'rgba(75,160,195,0.08)',
              borderRadius: '8px',
              textAlign: 'center'
            }}
          >
            <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-accent)' }}>
              {current.description}
            </p>
          </motion.div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
            {gsSteps.map((_, i) => (
              <button
                key={i}
                onClick={() => setGsStep(i)}
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  transition: 'all 0.2s',
                  backgroundColor: i === step ? ACCENT : 'var(--color-rule)',
                  transform: i === step ? 'scale(1.25)' : 'scale(1)'
                }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  };

  const GridPattern = () => (
    <g>
      {Array.from({ length: CANVAS_SIZE / GRID_SIZE + 1 }).map((_, i) => (
        <g key={i}>
          <line
            x1={i * GRID_SIZE}
            y1="0"
            x2={i * GRID_SIZE}
            y2={CANVAS_SIZE}
            stroke="var(--color-rule)"
            strokeWidth="1"
          />
          <line
            x1="0"
            y1={i * GRID_SIZE}
            x2={CANVAS_SIZE}
            y2={i * GRID_SIZE}
            stroke="var(--color-rule)"
            strokeWidth="1"
          />
        </g>
      ))}
      <line x1="0" y1={CANVAS_SIZE / 2} x2={CANVAS_SIZE} y2={CANVAS_SIZE / 2} stroke="var(--color-muted)" strokeWidth="2" />
      <line x1={CANVAS_SIZE / 2} y1="0" x2={CANVAS_SIZE / 2} y2={CANVAS_SIZE} stroke="var(--color-muted)" strokeWidth="2" />
    </g>
  );

  const GSCanvasContent = ({ current, step }) => {
    const [v1, v2] = current.vectors;

    const arrow = (x1, y1, x2, y2, color, label) => {
      const s = toCanvasCoords(x1, y1);
      const e = toCanvasCoords(x2, y2);
      const angle = Math.atan2(s.y - e.y, e.x - s.x);
      const headLen = 10;

      return (
        <g>
          <line x1={s.x} y1={s.y} x2={e.x} y2={e.y} stroke={color} strokeWidth="3" strokeLinecap="round" />
          <polygon
            points={`${e.x},${e.y} ${e.x - headLen * Math.cos(angle - Math.PI / 6)},${e.y + headLen * Math.sin(angle - Math.PI / 6)} ${e.x - headLen * Math.cos(angle + Math.PI / 6)},${e.y + headLen * Math.sin(angle + Math.PI / 6)}`}
            fill={color}
          />
          <text x={(s.x + e.x) / 2} y={(s.y + e.y) / 2 - 10} fill={color} fontSize="12" fontWeight="bold" textAnchor="middle">
            {label}
          </text>
        </g>
      );
    };

    return (
      <>
        {arrow(0, 0, v1[0], v1[1], current.highlight.includes(0) ? ACCENT : PURPLE, current.labels[0])}
        {arrow(0, 0, v2[0], v2[1], current.highlight.includes(1) ? ACCENT : AMBER, current.labels[1])}

        {current.subtract && current.proj && (
          <>
            <line
              x1={toCanvasCoords(v2[0], v2[1]).x}
              y1={toCanvasCoords(v2[0], v2[1]).y}
              x2={toCanvasCoords(current.proj[0], current.proj[1]).x}
              y2={toCanvasCoords(current.proj[0], current.proj[1]).y}
              stroke={RED}
              strokeWidth="2"
              strokeDasharray="4 4"
            />
            <text
              x={(toCanvasCoords(v2[0], v2[1]).x + toCanvasCoords(current.proj[0], current.proj[1]).x) / 2}
              y={(toCanvasCoords(v2[0], v2[1]).y + toCanvasCoords(current.proj[0], current.proj[1]).y) / 2 - 10}
              fill={RED}
              fontSize="10"
            >
              (u₂·e₁)e₁
            </text>
          </>
        )}

        {step >= 3 && step < 5 && current.subtract && current.proj && (
          <text
            x={CANVAS_SIZE / 2}
            y={30}
            fill={EMERALD}
            fontSize="14"
            fontWeight="bold"
            textAnchor="middle"
          >
            v₂ = u₂ - (u₂·e₁)e₁
          </text>
        )}

        {step >= 5 && (
          <g>
            <path
              d={`M ${toCanvasCoords(v1[0], v1[1]).x} ${toCanvasCoords(v1[0], v1[1]).y} 
                  Q ${toCanvasCoords(0, 0).x} ${toCanvasCoords(0, 0).y} 
                  ${toCanvasCoords(v2[0], v2[1]).x} ${toCanvasCoords(v2[0], v2[1]).y}`}
              fill="none"
              stroke={EMERALD}
              strokeWidth="2"
              strokeDasharray="4 4"
            />
            <text x={toCanvasCoords(0, 0).x + 20} y={toCanvasCoords(0, 0).y + 20} fill={EMERALD} fontSize="12">
              90°
            </text>
          </g>
        )}
      </>
    );
  };

  const LSVisualization = () => {
    const lineY = (x) => lineParams.slope * x + lineParams.intercept;

    return (
      <div>
        <svg
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          style={{
            backgroundColor: 'var(--color-paper)',
            borderRadius: '12px',
            border: '1px solid var(--color-rule)',
            cursor: isDraggingLine ? 'grabbing' : 'grab'
          }}
          onMouseDown={handleLineDragStart}
          onMouseMove={handleLineDrag}
          onMouseUp={handleLineDragEnd}
          onMouseLeave={handleLineDragEnd}
        >
          <GridPattern />

          <line
            x1={toCanvasCoords(0, lineY(0)).x}
            y1={toCanvasCoords(0, lineY(0)).y}
            x2={toCanvasCoords(10, lineY(10)).x}
            y2={toCanvasCoords(10, lineY(10)).y}
            stroke={ACCENT}
            strokeWidth="3"
          />

          {lsPoints.map((p, i) => {
            const px = toCanvasCoords(p.x, p.y).x;
            const py = toCanvasCoords(p.x, p.y).y;
            const linePy = toCanvasCoords(p.x, lineY(p.x)).y;
            const residual = p.y - lineY(p.x);

            return (
              <g key={i}>
                <line
                  x1={px}
                  y1={py}
                  x2={px}
                  y2={linePy}
                  stroke={residual > 0 ? AMBER : RED}
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />
                <circle cx={px} cy={py} r="6" fill={PURPLE} />
              </g>
            );
          })}
        </svg>

        <div style={{ marginTop: '16px', padding: '16px', backgroundColor: 'var(--color-paper-2)', borderRadius: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-ink-2)' }}>
                Line: y = {lineParams.slope.toFixed(2)}x + {lineParams.intercept.toFixed(2)}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-ink)' }}>
                SSR = {currentLineSSR.toFixed(2)}
              </p>
            </div>
          </div>

          {leastSquaresResult && (
            <div style={{ paddingTop: '16px', borderTop: '1px solid var(--color-rule)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ fontSize: '14px', color: EMERALD, fontWeight: 500 }}>
                  Best fit: y = {leastSquaresResult.slope.toFixed(2)}x + {leastSquaresResult.intercept.toFixed(2)}
                </p>
                <p style={{ fontSize: '14px', fontFamily: 'var(--font-mono)', color: 'var(--color-muted)' }}>
                  Min SSR = {leastSquaresResult.ssr.toFixed(2)}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLineParams({ slope: leastSquaresResult.slope, intercept: leastSquaresResult.intercept })}
                >
                  Use Best Fit
                </Button>
                <Button variant="ghost" size="sm" icon={RotateCcw} onClick={() => setLineParams({ slope: 1, intercept: 0 })}>
                  Reset
                </Button>
              </div>
            </div>
          )}

          {currentLineSSR < leastSquaresResult?.ssr * 1.01 && currentLineSSR > leastSquaresResult?.ssr * 0.99 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ marginTop: '12px', padding: '8px', backgroundColor: 'rgba(75,180,140,0.08)', borderRadius: '8px', textAlign: 'center' }}
            >
              <p style={{ fontSize: '14px', fontWeight: 500, color: EMERALD }}>
                Near optimal! Drag the line to find the best fit.
              </p>
            </motion.div>
          )}
        </div>
      </div>
    );
  };

  const FormulaPanel = () => (
    <div style={{ height: '100%', overflowY: 'auto', padding: '16px' }}>
      <h3 style={{ fontSize: '18px', fontWeight: 600, fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}>Formulas</h3>

      {activeTab === 'projection' && (
        <>
          <Card variant="outline" style={{ padding: '16px' }}>
            <h4 style={{ fontWeight: 600, fontFamily: 'var(--font-display)', color: 'var(--color-ink)', marginBottom: '8px' }}>Projection Formula</h4>
            <div style={{ padding: '12px', backgroundColor: 'var(--color-paper-2)', borderRadius: '8px', marginBottom: '8px' }}>
              <code style={{ fontSize: '14px', fontFamily: 'var(--font-mono)', color: 'var(--color-ink)' }}>
                proj<sub>W</sub>(b) = (b·u / u·u) u
              </code>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--color-muted)' }}>
              Project vector b onto subspace W spanned by u
            </p>
          </Card>

          <Card variant="outline" style={{ padding: '16px' }}>
            <h4 style={{ fontWeight: 600, fontFamily: 'var(--font-display)', color: 'var(--color-ink)', marginBottom: '8px' }}>Orthogonal Decomposition</h4>
            <div style={{ padding: '12px', backgroundColor: 'var(--color-paper-2)', borderRadius: '8px', marginBottom: '8px' }}>
              <code style={{ fontSize: '14px', fontFamily: 'var(--font-mono)', color: 'var(--color-ink)' }}>
                b = proj<sub>W</sub>(b) + (b - proj<sub>W</sub>(b))
              </code>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--color-muted)' }}>
              Vector b decomposed into parallel and perpendicular components
            </p>
          </Card>

          <Card variant="outline" style={{ padding: '16px' }}>
            <h4 style={{ fontWeight: 600, fontFamily: 'var(--font-display)', color: 'var(--color-ink)', marginBottom: '8px' }}>Orthogonal Complement</h4>
            <div style={{ padding: '12px', backgroundColor: 'var(--color-paper-2)', borderRadius: '8px', marginBottom: '8px' }}>
              <code style={{ fontSize: '14px', fontFamily: 'var(--font-mono)', color: 'var(--color-ink)' }}>
                W<sup>⊥</sup> = {'{'} v ∈ ℝ<sup>n</sup> | v·u = 0 {'}'}
              </code>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--color-muted)' }}>
              All vectors orthogonal to subspace W
            </p>
          </Card>
        </>
      )}

      {activeTab === 'gram-schmidt' && (
        <>
          <Card variant="outline" style={{ padding: '16px' }}>
            <h4 style={{ fontWeight: 600, fontFamily: 'var(--font-display)', color: 'var(--color-ink)', marginBottom: '8px' }}>Gram-Schmidt Process</h4>
            <div style={{ padding: '12px', backgroundColor: 'var(--color-paper-2)', borderRadius: '8px', marginBottom: '8px' }}>
              <code style={{ fontSize: '14px', fontFamily: 'var(--font-mono)', color: 'var(--color-ink)' }}>
                e<sub>1</sub> = normalize(u<sub>1</sub>)
              </code>
            </div>
            <div style={{ padding: '12px', backgroundColor: 'var(--color-paper-2)', borderRadius: '8px', marginBottom: '8px' }}>
              <code style={{ fontSize: '14px', fontFamily: 'var(--font-mono)', color: 'var(--color-ink)' }}>
                v<sub>2</sub> = u<sub>2</sub> - (u<sub>2</sub>·e<sub>1</sub>)e<sub>1</sub>
              </code>
            </div>
            <div style={{ padding: '12px', backgroundColor: 'var(--color-paper-2)', borderRadius: '8px', marginBottom: '8px' }}>
              <code style={{ fontSize: '14px', fontFamily: 'var(--font-mono)', color: 'var(--color-ink)' }}>
                e<sub>2</sub> = normalize(v<sub>2</sub>)
              </code>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--color-muted)' }}>
              Orthogonalize basis vectors step by step
            </p>
          </Card>
        </>
      )}

      {activeTab === 'least-squares' && (
        <>
          <Card variant="outline" style={{ padding: '16px' }}>
            <h4 style={{ fontWeight: 600, fontFamily: 'var(--font-display)', color: 'var(--color-ink)', marginBottom: '8px' }}>Least Squares</h4>
            <div style={{ padding: '12px', backgroundColor: 'var(--color-paper-2)', borderRadius: '8px', marginBottom: '8px' }}>
              <code style={{ fontSize: '14px', fontFamily: 'var(--font-mono)', color: 'var(--color-ink)' }}>
                minimize Σ (y<sub>i</sub> - (mx<sub>i</sub> + b))<sup>2</sup>
              </code>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--color-muted)' }}>
              Minimize sum of squared residuals
            </p>
          </Card>

          <Card variant="outline" style={{ padding: '16px' }}>
            <h4 style={{ fontWeight: 600, fontFamily: 'var(--font-display)', color: 'var(--color-ink)', marginBottom: '8px' }}>Normal Equations</h4>
            <div style={{ padding: '12px', backgroundColor: 'var(--color-paper-2)', borderRadius: '8px', marginBottom: '8px' }}>
              <code style={{ fontSize: '14px', fontFamily: 'var(--font-mono)', color: 'var(--color-ink)' }}>
                A<sup>T</sup>Ax = A<sup>T</sup>b
              </code>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--color-muted)' }}>
              Normal equations for linear regression
            </p>
          </Card>

          <Card variant="outline" style={{ padding: '16px' }}>
            <h4 style={{ fontWeight: 600, fontFamily: 'var(--font-display)', color: 'var(--color-ink)', marginBottom: '8px' }}>Projection Interpretation</h4>
            <div style={{ padding: '12px', backgroundColor: 'var(--color-paper-2)', borderRadius: '8px', marginBottom: '8px' }}>
              <code style={{ fontSize: '14px', fontFamily: 'var(--font-mono)', color: 'var(--color-ink)' }}>
                Least squares solution = proj<sub>col(A)</sub>(b)
              </code>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--color-muted)' }}>
              The solution is the projection of data onto column space
            </p>
          </Card>
        </>
      )}
    </div>
  );

  const GuidedMode = () => {
    const steps = [
      {
        title: 'Projection as Shadow',
        description: 'The projection of b onto W is like casting a shadow. The shadow (projection) lies entirely within subspace W.',
        action: 'Observe how b projects onto W. Drag b and watch the projection update in real-time.',
        visual: 'projection',
      },
      {
        title: 'Orthogonal Complement',
        description: 'The component perpendicular to W is the "error" or remainder. Together, proj and this component reconstruct b.',
        action: 'Watch the perpendicular component appear. Notice the right angle at the projection point.',
        visual: 'projection',
      },
      {
        title: 'Gram-Schmidt Orthogonalization',
        description: 'Any set of vectors can be made orthogonal using Gram-Schmidt. Each new vector subtracts projections onto previous ones.',
        action: 'Step through the process: e₁ = normalize(u₁), then v₂ = u₂ - proj(u₂, e₁), finally e₂ = normalize(v₂).',
        visual: 'gram-schmidt',
      },
      {
        title: 'Least Squares as Projection',
        description: 'Least squares finds the best-fit line by projecting data points onto the column space. The line minimizes perpendicular distance.',
        action: 'Drag the line to minimize the sum of squared residuals. Find where SSR is minimized.',
        visual: 'least-squares',
      },
    ];

    const currentStep = steps[guidedStep];
    const progress = ((guidedStep + 1) / steps.length) * 100;

    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}>Guided Mode: Orthogonality</h2>
          <Button variant="ghost" size="sm" onClick={() => setShowGuided(false)}>
            Exit
          </Button>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--color-muted)', marginBottom: '8px' }}>
            <span>Step {guidedStep + 1} of {steps.length}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <div style={{ height: '8px', backgroundColor: 'var(--color-paper-3)', borderRadius: '9999px', overflow: 'hidden' }}>
            <motion.div
              style={{ height: '100%', background: `linear-gradient(to right, ${ACCENT}, ${PURPLE})` }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        <Card variant="elevated" style={{ flex: 1, marginBottom: '16px' }}>
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'start', gap: '16px', marginBottom: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: '20px', fontWeight: 700, color: 'white' }}>{guidedStep + 1}</span>
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 600, fontFamily: 'var(--font-display)', color: 'var(--color-ink)', marginBottom: '8px' }}>
                  {currentStep.title}
                </h3>
                <p style={{ color: 'var(--color-ink-2)' }}>
                  {currentStep.description}
                </p>
              </div>
            </div>

            <div style={{ padding: '16px', backgroundColor: 'rgba(200,155,50,0.10)', borderRadius: '8px' }}>
              <p style={{ fontSize: '14px', fontWeight: 500, color: AMBER, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ChevronRight style={{ width: '16px', height: '16px' }} />
                {currentStep.action}
              </p>
            </div>
          </div>
        </Card>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button
            variant="ghost"
            onClick={() => setGuidedStep(Math.max(0, guidedStep - 1))}
            disabled={guidedStep === 0}
          >
            Previous
          </Button>

          {guidedStep < steps.length - 1 ? (
            <Button variant="primary" onClick={() => {
              if (currentStep.visual !== activeTab) {
                setActiveTab(currentStep.visual);
              }
              setGuidedStep(guidedStep + 1);
            }}>
              Next
            </Button>
          ) : (
            <Button variant="success" onClick={() => {
              setShowGuided(false);
              setGuidedStep(0);
            }}>
              <CheckCircle2 style={{ width: '16px', height: '16px', marginRight: '8px' }} />
              Complete
            </Button>
          )}
        </div>
      </div>
    );
  };

  const LeastSquaresFit = ({ onSubmit, attempts, maxAttempts }) => {
    const [targetSlope, setTargetSlope] = useState(1.5);
    const [targetIntercept, setTargetIntercept] = useState(1);
    const [userLine, setUserLine] = useState({ slope: 1, intercept: 0 });
    const [showResult, setShowResult] = useState(false);
    const [lastScore, setLastScore] = useState(0);

    const generateTarget = useCallback(() => {
      const newSlope = 0.5 + Math.random() * 2;
      const newIntercept = -1 + Math.random() * 3;
      setTargetSlope(newSlope);
      setTargetIntercept(newIntercept);
      setUserLine({ slope: 1, intercept: 0 });
      setShowResult(false);
    }, []);

    useEffect(() => {
      generateTarget();
    }, []);

    const userSSR = useMemo(() => {
      return lsPoints.reduce((sum, p) => {
        const predicted = userLine.slope * p.x + userLine.intercept;
        return sum + Math.pow(p.y - predicted, 2);
      }, 0);
    }, [userLine, lsPoints]);

    const targetSSR = useMemo(() => {
      return lsPoints.reduce((sum, p) => {
        const predicted = targetSlope * p.x + targetIntercept;
        return sum + Math.pow(p.y - predicted, 2);
      }, 0);
    }, [targetSlope, targetIntercept]);

    const handleDragLine = useCallback((e) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const coords = fromCanvasCoords(x, y);

      const newSlope = Math.max(0.1, Math.min(3, coords.y / coords.x));
      const newIntercept = coords.y - newSlope * coords.x;

      setUserLine({ slope: newSlope, intercept: newIntercept });
    }, []);

    const handleSubmit = () => {
      const ratio = targetSSR / userSSR;
      const accuracy = Math.min(1, ratio);
      const score = Math.round(accuracy * 100);

      setLastScore(score);
      setShowResult(true);

      setTimeout(() => {
        onSubmit(score);
      }, 1000);
    };

    const renderGameContent = () => (
      <div>
        <p style={{ fontSize: '14px', color: 'var(--color-ink-2)', marginBottom: '16px', textAlign: 'center' }}>
          Drag the line to fit the purple points as closely as possible. The closer to the best fit, the higher your score!
        </p>

        <svg
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          style={{
            backgroundColor: 'var(--color-paper)',
            borderRadius: '12px',
            border: '1px solid var(--color-rule)',
            cursor: 'grab'
          }}
          onMouseMove={handleDragLine}
        >
          <GridPattern />

          <line
            x1="0"
            y1={toCanvasCoords(0, userLine.intercept).y}
            x2={CANVAS_SIZE}
            y2={toCanvasCoords(10, userLine.slope * 10 + userLine.intercept).y}
            stroke={ACCENT}
            strokeWidth="4"
          />

          {lsPoints.map((p, i) => (
            <circle
              key={i}
              cx={toCanvasCoords(p.x, p.y).x}
              cy={toCanvasCoords(p.x, p.y).y}
              r="8"
              fill={PURPLE}
            />
          ))}

          <text x="20" y="30" fill={ACCENT} fontSize="14" fontWeight="bold">
            y = {userLine.slope.toFixed(2)}x + {userLine.intercept.toFixed(2)}
          </text>
          <text x="20" y="50" fill="var(--color-neutral)" fontSize="12">
            SSR: {userSSR.toFixed(2)}
          </text>
        </svg>

        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center', gap: '16px' }}>
          <Button variant="ghost" size="sm" onClick={() => setUserLine({ slope: 1, intercept: 0 })}>
            Reset Line
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} disabled={showResult}>
            Submit Guess
          </Button>
        </div>

        {showResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ marginTop: '16px', padding: '16px', backgroundColor: 'rgba(75,180,140,0.08)', borderRadius: '12px', textAlign: 'center' }}
          >
            <p style={{ fontSize: '18px', fontWeight: 700, color: EMERALD }}>
              Score: {lastScore}/100
            </p>
            <p style={{ fontSize: '14px', color: 'oklch(52% 0.12 155)' }}>
              Target best-fit: y = {targetSlope.toFixed(2)}x + {targetIntercept.toFixed(2)}
            </p>
          </motion.div>
        )}
      </div>
    );

    return (
      <GameWrapper
        title="Least Squares Fit"
        instructions="Drag the line to match the data points"
        maxAttempts={maxAttempts}
        scoring="accuracy"
        onRetry={generateTarget}
      >
        {({ onSubmit: gameSubmit, attempts, maxAttempts }) => (
          <div>
            <p style={{ fontSize: '14px', color: 'var(--color-ink-2)', marginBottom: '16px', textAlign: 'center' }}>
              Drag the line to fit the purple points. Find the best-fit line!
            </p>

            <svg
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
              style={{
                backgroundColor: 'var(--color-paper)',
                borderRadius: '12px',
                border: '1px solid var(--color-rule)',
                cursor: 'grab'
              }}
              onMouseMove={handleDragLine}
            >
              <GridPattern />

              <line
                x1="0"
                y1={toCanvasCoords(0, userLine.intercept).y}
                x2={CANVAS_SIZE}
                y2={toCanvasCoords(10, userLine.slope * 10 + userLine.intercept).y}
                stroke={ACCENT}
                strokeWidth="4"
              />

              {lsPoints.map((p, i) => (
                <circle
                  key={i}
                  cx={toCanvasCoords(p.x, p.y).x}
                  cy={toCanvasCoords(p.x, p.y).y}
                  r="8"
                  fill={PURPLE}
                />
              ))}

              <text x="20" y="30" fill={ACCENT} fontSize="14" fontWeight="bold">
                y = {userLine.slope.toFixed(2)}x + {userLine.intercept.toFixed(2)}
              </text>
              <text x="20" y="50" fill="var(--color-neutral)" fontSize="12">
                SSR: {userSSR.toFixed(2)}
              </text>
            </svg>

            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center', gap: '16px' }}>
              <Button variant="ghost" size="sm" onClick={() => setUserLine({ slope: 1, intercept: 0 })}>
                Reset Line
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  const ratio = Math.max(0, 1 - Math.abs(userSSR - targetSSR) / targetSSR);
                  const score = Math.round(ratio * 100);
                  gameSubmit(score);
                  generateTarget();
                }}
              >
                Submit
              </Button>
            </div>
          </div>
        )}
      </GameWrapper>
    );
  };

  if (showGuided) {
    return <GuidedMode />;
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '16px' }}>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}>Orthogonality & Projections</h2>
          <Button
            variant="ghost"
            size="sm"
            icon={Info}
            onClick={() => setShowGuided(true)}
          >
            Guided Mode
          </Button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
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
            variant={activeTab === 'least-squares' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('least-squares')}
          >
            Least Squares
          </Button>
          <Button
            variant={activeTab === 'game' ? 'primary' : 'ghost'}
            size="sm"
            icon={Target}
            onClick={() => setActiveTab('game')}
          >
            Mini-Game
          </Button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {activeTab === 'projection' && (
              <Card variant="elevated" style={{ padding: '24px' }}>
                <ProjectionCanvas />

                <div style={{ marginTop: '16px', padding: '16px', backgroundColor: 'var(--color-paper-2)', borderRadius: '12px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', textAlign: 'center' }}>
                    <div>
                      <p style={{ fontSize: '14px', color: 'var(--color-muted)' }}>Vector b</p>
                      <p style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-ink)' }}>
                        [{vectorB[0].toFixed(1)}, {vectorB[1].toFixed(1)}]
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: '14px', color: 'var(--color-muted)' }}>proj(b)</p>
                      <p style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: EMERALD }}>
                        [{projection[0].toFixed(1)}, {projection[1].toFixed(1)}]
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: '14px', color: 'var(--color-muted)' }}>||b||²</p>
                      <p style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-ink)' }}>
                        {dotProduct(vectorB, vectorB).toFixed(1)}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: '14px', color: 'var(--color-muted)' }}>b·e₁</p>
                      <p style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-ink)' }}>
                        {dotProduct(vectorB, normalize(subspaceW)).toFixed(1)}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {activeTab === 'gram-schmidt' && (
              <Card variant="elevated" style={{ padding: '24px' }}>
                <GSVisualization step={gsStep} />

                <div style={{ marginTop: '16px', padding: '16px', backgroundColor: 'var(--color-paper-2)', borderRadius: '12px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', textAlign: 'center' }}>
                    <div>
                      <p style={{ fontSize: '14px', color: 'var(--color-muted)' }}>u₁</p>
                      <p style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-ink)' }}>
                        [{gsVector1[0].toFixed(1)}, {gsVector1[1].toFixed(1)}]
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: '14px', color: 'var(--color-muted)' }}>u₂</p>
                      <p style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-ink)' }}>
                        [{gsVector2[0].toFixed(1)}, {gsVector2[1].toFixed(1)}]
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: '14px', color: 'var(--color-muted)' }}>e₁ · e₂</p>
                      <p style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: EMERALD }}>
                        {gsSteps[gsStep]?.vectors
                          ? dotProduct(...gsSteps[gsStep].vectors).toFixed(2)
                          : '-'}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: '14px', color: 'var(--color-muted)' }}>Step {gsStep + 1}</p>
                      <p style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-ink)' }}>
                        of {gsSteps.length}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {activeTab === 'least-squares' && (
              <Card variant="elevated" style={{ padding: '24px' }}>
                <LSVisualization />
              </Card>
            )}

            {activeTab === 'game' && (
              <LeastSquaresFit />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div style={{ width: '320px' }}>
        <FormulaPanel />
      </div>

      <div
        className="px-6 py-2 text-sm flex items-center justify-center gap-4 border-t"
        style={{
          backgroundColor: 'var(--color-paper-2)',
          borderColor: 'rgba(255,255,255,0.08)',
          color: 'var(--color-muted)',
        }}
      >
        <span>Orthogonal = perpendicular</span>
        <span>•</span>
        <CompletionToggle moduleId={8} />
      </div>
    </div>
  );
}