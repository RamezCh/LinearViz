import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../components/UI/Button.jsx';

function generateDataPoints() {
  const points = [];
  const baseSlope = Math.random() * 1.5 + 0.5;
  const baseIntercept = Math.random() * 2 - 1;
  
  for (let i = 0; i < 5; i++) {
    const x = i * 1.5 + Math.random() * 0.5;
    const y = baseSlope * x + baseIntercept + (Math.random() - 0.5) * 2;
    points.push({ x, y });
  }
  
  return { points, trueSlope: baseSlope, trueIntercept: baseIntercept };
}

function calculateResiduals(points, slope, intercept) {
  return points.map(p => ({ x: p.x, y: p.y, residual: p.y - (slope * p.x + intercept) }));
}

function calculateSSE(residuals) {
  return residuals.reduce((sum, r) => sum + r.residual * r.residual, 0);
}

export default function LeastSquaresFit({ onSubmit, attempts, maxAttempts }) {
  const [data, setData] = useState(null);
  const [slope, setSlope] = useState(1);
  const [intercept, setIntercept] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [round, setRound] = useState(1);
  const [totalRounds] = useState(4);

  useEffect(() => { loadNewProblem(); }, []);

  const loadNewProblem = useCallback(() => {
    const newData = generateDataPoints();
    setData(newData);
    setSlope(newData.trueSlope);
    setIntercept(newData.trueIntercept);
    setShowResult(false);
  }, []);

  const residuals = useMemo(() => {
    if (!data) return [];
    return calculateResiduals(data.points, slope, intercept);
  }, [data, slope, intercept]);

  const sse = useMemo(() => calculateSSE(residuals), [residuals]);

  const trueSSE = useMemo(() => {
    if (!data) return 0;
    return calculateSSE(calculateResiduals(data.points, data.trueSlope, data.trueIntercept));
  }, [data]);

  const scoreForRound = useMemo(() => {
    if (!data || trueSSE === 0) return 0;
    const ratio = sse / trueSSE;
    if (ratio <= 1.05) return 100;
    if (ratio <= 1.2) return 80;
    if (ratio <= 1.5) return 60;
    if (ratio <= 2) return 40;
    if (ratio <= 3) return 20;
    return 0;
  }, [sse, trueSSE, data]);

  const handleSubmit = () => {
    setShowResult(true);
    const points = scoreForRound;
    setTimeout(() => {
      onSubmit(points);
      if (round < totalRounds) {
        setRound(r => r + 1);
        loadNewProblem();
      }
    }, 2000);
  };

  if (!data) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div
        className="rounded-xl p-4"
        style={{ background: 'linear-gradient(to right, var(--color-accent), var(--color-accent-2))', color: 'var(--color-paper)' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-bold text-lg" style={{ fontFamily: 'var(--font-display)' }}>Best Fit Line</h4>
            <p className="text-sm" style={{ opacity: 0.8 }}>Adjust the line to minimize the sum of squared residuals</p>
          </div>
          <div className="text-right">
            <p className="text-sm" style={{ opacity: 0.6 }}>Round</p>
            <p className="text-2xl font-bold font-mono" style={{ fontFamily: 'var(--font-mono)' }}>{round}/{totalRounds}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: 'var(--color-paper)', borderColor: 'var(--color-rule)' }}>
        <svg viewBox="-1 -6 9 12" className="w-full h-64">
          <defs>
            <pattern id="lsf-grid" width="1" height="1" patternUnits="userSpaceOnUse">
              <path d="M 1 0 L 0 0 0 1" fill="none" stroke="var(--color-rule)" strokeWidth="0.05"/>
            </pattern>
          </defs>
          <rect x="-1" y="-6" width="9" height="12" fill="url(#lsf-grid)"/>
          
          <line
            x1="-1" y1={-1 * slope + intercept}
            x2="8" y2={8 * slope + intercept}
            stroke="var(--color-accent)"
            strokeWidth="0.15"
            strokeLinecap="round"
          />
          
          {data.points.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="0.15" fill="var(--color-ink)" />
              <circle cx={p.x} cy={p.y} r="0.25" fill="none" stroke="var(--color-ink)" strokeWidth="0.05" strokeDasharray="0.1 0.05" />
            </g>
          ))}
        </svg>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--color-paper-2)' }}>
          <p className="text-xs mb-2" style={{ color: 'var(--color-muted)' }}>Slope (m)</p>
          <input
            type="range"
            min="-2"
            max="4"
            step="0.05"
            value={slope}
            onChange={(e) => setSlope(parseFloat(e.target.value))}
            className="w-full"
            style={{ accentColor: 'var(--color-accent)' }}
          />
          <p className="text-center font-mono font-bold mt-2" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-ink)' }}>
            m = {slope.toFixed(2)}
          </p>
        </div>
        <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--color-paper-2)' }}>
          <p className="text-xs mb-2" style={{ color: 'var(--color-muted)' }}>Intercept (b)</p>
          <input
            type="range"
            min="-3"
            max="3"
            step="0.05"
            value={intercept}
            onChange={(e) => setIntercept(parseFloat(e.target.value))}
            className="w-full"
            style={{ accentColor: 'var(--color-accent)' }}
          />
          <p className="text-center font-mono font-bold mt-2" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-ink)' }}>
            b = {intercept.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--color-paper-2)' }}>
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold" style={{ color: 'var(--color-ink)' }}>Score</h4>
          <div className="text-right">
            <p className="text-xs" style={{ color: 'var(--color-muted)' }}>SSE Ratio</p>
            <p className="text-lg font-bold font-mono" style={{ fontFamily: 'var(--font-mono)', color: sse / trueSSE <= 1.1 ? 'var(--color-emerald)' : sse / trueSSE <= 1.5 ? 'var(--color-amber)' : 'var(--color-red)' }}>
              {(sse / trueSSE).toFixed(2)}×
            </p>
          </div>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-rule)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: sse / trueSSE <= 1.1 ? 'var(--color-emerald)' : sse / trueSSE <= 1.5 ? 'var(--color-amber)' : 'var(--color-red)' }}
            animate={{ width: `${Math.max(5, Math.min(100, (1 - (sse / trueSSE - 1)) * 100))}%` }}
          />
        </div>
      </div>

      {showResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl p-4 border"
          style={{
            backgroundColor: scoreForRound >= 80 ? 'rgba(75,180,140,0.08)' : scoreForRound >= 50 ? 'rgba(200,155,50,0.08)' : 'rgba(175,90,65,0.08)',
            borderColor: scoreForRound >= 80 ? 'var(--color-emerald)' : scoreForRound >= 50 ? 'var(--color-amber)' : 'var(--color-red)',
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-lg" style={{ color: 'var(--color-ink)' }}>
                {scoreForRound >= 80 ? 'Excellent Fit!' : scoreForRound >= 50 ? 'Good Attempt!' : 'Keep Adjusting!'}
              </p>
              <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                Your line: y = {slope.toFixed(2)}x + {intercept.toFixed(2)}
              </p>
            </div>
            <span className="text-3xl font-bold font-mono" style={{ color: 'var(--color-emerald)', fontFamily: 'var(--font-mono)' }}>
              +{scoreForRound}
            </span>
          </div>
        </motion.div>
      )}

      <div className="flex justify-center">
        <Button variant="primary" size="lg" onClick={handleSubmit} disabled={attempts >= maxAttempts} className="px-8">
          {showResult ? 'Next Round' : 'Submit Answer'}
        </Button>
      </div>
    </div>
  );
}