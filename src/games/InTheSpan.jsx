import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Slider } from '../components/UI/Slider.jsx';
import { Button } from '../components/UI/Button.jsx';
import CanvasWrapper from '../components/Canvas/CanvasWrapper.jsx';
import Grid2D from '../components/Canvas/Grid2D.jsx';
import Vector2D from '../components/Canvas/Vector2D.jsx';
import { add, scalarMultiply } from '../utils/linalg.js';

const ACCENT = 'var(--color-accent)';
const EMERALD = 'oklch(52% 0.16 155)';
const AMBER = 'oklch(65% 0.10 70)';
const RED = 'oklch(52% 0.16 25)';
const VIOLET = 'oklch(50% 0.12 270)';
const CYAN = 'oklch(65% 0.10 195)';

function generateProblem() {
  const u = [Math.round((Math.random() * 4 + 1) * 10) / 10, Math.round((Math.random() * 4 + 1) * 10) / 10];
  const v = [Math.round((Math.random() * 4 + 1) * 10) / 10, Math.round((Math.random() * 4 - 2) * 10) / 10];
  const c1 = Math.round((Math.random() * 4 - 1) * 10) / 10;
  const c2 = Math.round((Math.random() * 4 - 1) * 10) / 10;
  const target = add(scalarMultiply(c1, u), scalarMultiply(c2, v)).map(v => Math.round(v * 10) / 10);
  return { u, v, c1, c2, target, solution: [c1, c2] };
}

function distanceColor(d, threshold1, threshold2) {
  if (d <= threshold1) return EMERALD;
  if (d <= threshold2) return AMBER;
  return RED;
}

export default function InTheSpan({ onSubmit, attempts, maxAttempts, score, difficulty = 0 }) {
  const [problem, setProblem] = useState(null);
  const [userC1, setUserC1] = useState(0);
  const [userC2, setUserC2] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [round, setRound] = useState(1);
  const [totalRounds] = useState(5);

  useEffect(() => { loadNewProblem(); }, []);

  const loadNewProblem = useCallback(() => {
    const p = generateProblem();
    setProblem(p); setUserC1(p.solution[0]); setUserC2(p.solution[1]); setShowResult(false);
  }, []);

  const resultVector = useMemo(() => {
    if (!problem) return [0, 0];
    return add(scalarMultiply(userC1, problem.u), scalarMultiply(userC2, problem.v));
  }, [problem, userC1, userC2]);

  const distance = useMemo(() => {
    if (!problem) return 0;
    const dx = resultVector[0] - problem.target[0];
    const dy = resultVector[1] - problem.target[1];
    return Math.sqrt(dx * dx + dy * dy);
  }, [problem, resultVector]);

  const scoreForRound = useMemo(() => {
    if (distance <= 0.1) return 100;
    if (distance <= 0.3) return 80;
    if (distance <= 0.5) return 60;
    if (distance <= 1) return 40;
    if (distance <= 2) return 20;
    return 0;
  }, [distance]);

  const handleSubmit = () => {
    setShowResult(true);
    setTimeout(() => {
      onSubmit(scoreForRound);
      if (round < totalRounds) { setRound(r => r + 1); loadNewProblem(); }
    }, 1500);
  };

  if (!problem) return <div>Loading...</div>;

  const resultCol = distanceColor(distance, 0.3, 1);
  const distCol = distanceColor(distance, 0.1, 0.5);
  const scoreCol = scoreForRound >= 80 ? EMERALD : scoreForRound >= 50 ? AMBER : RED;

  const resultBgStyle = scoreForRound >= 80 ? { backgroundColor: 'rgba(75,180,140,0.10)', border: '1px solid rgba(75,180,140,0.25)' }
    : scoreForRound >= 50 ? { backgroundColor: 'rgba(200,155,50,0.08)', border: '1px solid rgba(200,155,50,0.2)' }
    : { backgroundColor: 'rgba(220,75,55,0.06)', border: '1px solid rgba(220,75,55,0.15)' };

  return (
    <div className="space-y-6">
      <div className="rounded-xl p-4" style={{ background: `linear-gradient(135deg, ${CYAN}, ${ACCENT})` }}>
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-bold text-lg" style={{ color: 'var(--color-paper)', fontFamily: 'var(--font-display)' }}>Find the Coefficients</h4>
            <p className="text-sm mt-1" style={{ color: 'rgba(248,250,252,0.75)' }}>Find c₁ and c₂ such that c₁v₁ + c₂v₂ = target</p>
          </div>
          <div className="text-right">
            <p className="text-sm" style={{ color: 'rgba(248,250,252,0.55)', fontFamily: 'var(--font-mono)' }}>Round</p>
            <p className="text-2xl font-bold font-mono" style={{ color: 'var(--color-paper)', fontFamily: 'var(--font-mono)' }}>{round}/{totalRounds}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--color-paper-2)' }}>
        <div className="grid grid-cols-3 gap-4 mb-4">
          {[
            { label: 'Target', value: `(${problem.target[0].toFixed(1)}, ${problem.target[1].toFixed(1)})`, color: EMERALD },
            { label: 'Your Result', value: `(${resultVector[0].toFixed(1)}, ${resultVector[1].toFixed(1)})`, color: resultCol },
            { label: 'Distance', value: distance.toFixed(2), color: distCol },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-lg p-3 text-center" style={{ backgroundColor: 'var(--color-paper)', border: '1px solid var(--color-rule)' }}>
              <p className="text-xs mb-1" style={{ color: 'var(--color-muted)' }}>{label}</p>
              <p className="text-lg font-bold font-mono" style={{ fontFamily: 'var(--font-mono)', color }}>{value}</p>
            </div>
          ))}
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-paper-3)' }}>
          <motion.div className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${EMERALD}, ${ACCENT})` }}
            animate={{ width: `${Math.max(5, 100 - distance * 30)}%` }} transition={{ duration: 0.2 }} />
        </div>
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: 'var(--color-paper)', borderColor: 'var(--color-rule)' }}>
        <CanvasWrapper mode="2d" gridExtent={8} interactive={false} className="h-64">
          <svg width="100%" height="100%" className="absolute inset-0">
            <Grid2D showLabels={true} showTicks={true} />
            <motion.circle initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}
              cx={400 + problem.target[0] * 30} cy={128 - problem.target[1] * 30} r="20" fill={EMERALD} fillOpacity="0.15" stroke={EMERALD} strokeWidth="2" />
            <circle cx={400 + problem.target[0] * 30} cy={128 - problem.target[1] * 30} r="6" fill={EMERALD} />
            <text x={400 + problem.target[0] * 30} y={128 - problem.target[1] * 30 - 30} textAnchor="middle" fill={EMERALD} fontSize="11" fontWeight="600">TARGET</text>
            <Vector2D id="u" origin={[0, 0]} tip={problem.u} color={ACCENT} label="v₁" showMagnitude={true} draggable={false} />
            <Vector2D id="v" origin={[0, 0]} tip={problem.v} color={VIOLET} label="v₂" showMagnitude={true} draggable={false} />
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
              <Vector2D id="c1u" origin={[0, 0]} tip={scalarMultiply(userC1, problem.u)} color="rgba(75,160,195,0.7)" label={`${userC1.toFixed(1)}v₁`} showMagnitude={false} draggable={false} />
              <Vector2D id="c2v" origin={scalarMultiply(userC1, problem.u)} tip={resultVector} color="rgba(129,100,200,0.7)" label={`${userC2.toFixed(1)}v₂`} showMagnitude={false} draggable={false} />
              <Vector2D id="result" origin={[0, 0]} tip={resultVector} color={resultCol} label="Result" showMagnitude={false} draggable={false} />
              <circle cx={400 + resultVector[0] * 30} cy={128 - resultVector[1] * 30} r="6" fill={resultCol} stroke="var(--color-paper)" strokeWidth="2" />
            </motion.g>
          </svg>
        </CanvasWrapper>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'c₁', value: userC1, setValue: setUserC1, color: ACCENT, vec: problem.u, name: 'v₁' },
          { label: 'c₂', value: userC2, setValue: setUserC2, color: VIOLET, vec: problem.v, name: 'v₂' },
        ].map(({ label, value, setValue, color, vec }) => (
          <div key={label} className="rounded-xl p-4" style={{ backgroundColor: `${color}10` }}>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold" style={{ color }}>Coefficient {label}</h4>
              <span className="text-2xl font-bold font-mono" style={{ fontFamily: 'var(--font-mono)', color }}>{value.toFixed(1)}</span>
            </div>
            <p className="text-xs mb-3" style={{ color }}>{vec.name} = ({vec[0].toFixed(1)}, {vec[1].toFixed(1)})</p>
            <Slider value={value} onChange={setValue} min={-3} max={3} step={0.1} color="blue" />
            <div className="mt-3 rounded-lg p-2" style={{ backgroundColor: 'var(--color-paper)', border: '1px solid var(--color-rule)' }}>
              <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{label} × {vec.name}</p>
              <p className="text-sm font-mono font-semibold" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-ink)' }}>
                ({(value * vec[0]).toFixed(1)}, {(value * vec[1]).toFixed(1)})
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--color-paper-2)' }}>
        <div className="text-center">
          <p className="text-sm mb-2" style={{ color: 'var(--color-muted)' }}>Current combination:</p>
          <p className="text-lg font-mono font-semibold" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-ink)' }}>
            {userC1.toFixed(1)} × ({problem.u[0].toFixed(1)}, {problem.u[1].toFixed(1)}) + {userC2.toFixed(1)} × ({problem.v[0].toFixed(1)}, {problem.v[1].toFixed(1)})
          </p>
          <p className="text-xl font-mono font-bold mt-2" style={{ fontFamily: 'var(--font-mono)', color: CYAN }}>
            = ({resultVector[0].toFixed(1)}, {resultVector[1].toFixed(1)})
          </p>
        </div>
      </div>

      {showResult && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl p-4">
          <div {...resultBgStyle}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-lg" style={{ color: scoreCol }}>
                  {scoreForRound >= 80 ? 'Perfect Match!' : scoreForRound >= 50 ? 'Almost There!' : 'Keep Trying!'}
                </p>
                <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                  Correct coefficients: {label} = {problem.c1.toFixed(1)}, c₂ = {problem.c2.toFixed(1)}
                </p>
              </div>
              <div className="text-right">
                <span className="text-3xl font-bold font-mono" style={{ fontFamily: 'var(--font-mono)', color: scoreCol }}>+{scoreForRound}</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <div className="flex justify-center">
        <Button variant="primary" size="lg" onClick={handleSubmit} disabled={attempts >= maxAttempts} className="px-8">
          Check Answer
        </Button>
      </div>
    </div>
  );
}