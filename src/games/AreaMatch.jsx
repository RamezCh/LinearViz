import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import CanvasWrapper from '../components/Canvas/CanvasWrapper.jsx';
import Grid2D from '../components/Canvas/Grid2D.jsx';
import Vector2D from '../components/Canvas/Vector2D.jsx';
import Parallelogram from '../components/Canvas/Parallelogram.jsx';
import { Slider } from '../components/UI/Slider.jsx';
import { Button } from '../components/UI/Button.jsx';
import { det2x2 } from '../utils/linalg.js';

function generateProblem() {
  const u = [
    Math.round((Math.random() * 6 - 1) * 10) / 10,
    Math.round((Math.random() * 6 - 1) * 10) / 10,
  ];
  const v = [
    Math.round((Math.random() * 6 - 1) * 10) / 10,
    Math.round((Math.random() * 6 - 1) * 10) / 10,
  ];
  
  const targetDet = Math.round(det2x2([u, v]) * 10) / 10;
  
  return {
    u,
    v,
    targetDet,
  };
}

export default function AreaMatch({
  onSubmit,
  attempts,
  maxAttempts,
  score,
  difficulty = 0,
}) {
  const [problem, setProblem] = useState(null);
  const [vectorU, setVectorU] = useState([2, 0]);
  const [vectorV, setVectorV] = useState([0, 2]);
  const [showResult, setShowResult] = useState(false);
  const [round, setRound] = useState(1);
  const [totalRounds] = useState(5);

  useEffect(() => {
    loadNewProblem();
  }, []);

  const loadNewProblem = useCallback(() => {
    const newProblem = generateProblem();
    setProblem(newProblem);
    setVectorU(newProblem.u);
    setVectorV(newProblem.v);
    setShowResult(false);
  }, []);

  const currentDet = useMemo(() => {
    return Math.round(det2x2([vectorU, vectorV]) * 10) / 10;
  }, [vectorU, vectorV]);

  const detError = useMemo(() => {
    if (!problem) return 0;
    return Math.abs(currentDet - problem.targetDet);
  }, [currentDet, problem]);

  const scoreForRound = useMemo(() => {
    if (!problem) return 0;
    const error = detError;
    if (error <= 0.1) return 100;
    if (error <= 0.3) return 80;
    if (error <= 0.5) return 60;
    if (error <= 1) return 40;
    if (error <= 2) return 20;
    return 0;
  }, [detError, problem]);

  const handleSubmit = () => {
    setShowResult(true);
    const points = scoreForRound;

    setTimeout(() => {
      onSubmit(points);
      if (round < totalRounds) {
        setRound(r => r + 1);
        loadNewProblem();
      }
    }, 1500);
  };

  if (!problem) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div
        className="rounded-xl p-4"
        style={{
          background: 'linear-gradient(to right, var(--color-violet), var(--color-accent-3))',
          color: 'var(--color-paper)',
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-bold text-lg" style={{ fontFamily: 'var(--font-display)' }}>Match the Area</h4>
            <p className="text-sm" style={{ opacity: 0.8 }}>
              Adjust the column vectors to match the target determinant (area)
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm" style={{ opacity: 0.6 }}>Round</p>
            <p className="text-2xl font-bold font-mono" style={{ fontFamily: 'var(--font-mono)' }}>{round}/{totalRounds}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--color-paper-2)' }}>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="rounded-lg p-3 text-center" style={{ backgroundColor: 'var(--color-paper)' }}>
            <p className="text-xs mb-1" style={{ color: 'var(--color-muted)' }}>Target Area</p>
            <motion.p
              key={problem.targetDet}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              className="text-2xl font-bold font-mono"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-emerald)' }}
            >
              {problem.targetDet.toFixed(1)}
            </motion.p>
          </div>
          <div className="rounded-lg p-3 text-center" style={{ backgroundColor: 'var(--color-paper)' }}>
            <p className="text-xs mb-1" style={{ color: 'var(--color-muted)' }}>Current Area</p>
            <motion.p
              key={currentDet}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              className="text-2xl font-bold font-mono"
              style={{
                fontFamily: 'var(--font-mono)',
                color: detError <= 0.1 ? 'var(--color-emerald)' :
                detError <= 0.5 ? 'var(--color-amber)' : 'var(--color-red)',
              }}
            >
              {currentDet.toFixed(1)}
            </motion.p>
          </div>
          <div className="rounded-lg p-3 text-center" style={{ backgroundColor: 'var(--color-paper)' }}>
            <p className="text-xs mb-1" style={{ color: 'var(--color-muted)' }}>Error</p>
            <p className="text-2xl font-bold font-mono" style={{
              fontFamily: 'var(--font-mono)',
              color: detError <= 0.1 ? 'var(--color-emerald)' :
              detError <= 0.5 ? 'var(--color-amber)' : 'var(--color-red)',
            }}>
              {detError.toFixed(1)}
            </p>
          </div>
        </div>

        <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-rule)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(to right, var(--color-emerald), var(--color-accent))' }}
            animate={{ width: `${Math.max(5, 100 - detError * 20)}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: 'var(--color-paper)', borderColor: 'var(--color-rule)' }}>
        <CanvasWrapper mode="2d" gridExtent={8} interactive={false} className="h-80">
          <svg width="100%" height="100%" className="absolute inset-0">
            <Grid2D showLabels={true} showTicks={true} />

            <Parallelogram
              u={vectorU}
              v={vectorV}
              color="#8b5cf6"
              showArea={true}
              showBorder={true}
              animated={true}
            />

            <Vector2D
              id="u"
              origin={[0, 0]}
              tip={vectorU}
              color="#3b82f6"
              label="u"
              showMagnitude={true}
              draggable={false}
            />

            <Vector2D
              id="v"
              origin={[0, 0]}
              tip={vectorV}
              color="#10b981"
              label="v"
              showMagnitude={true}
              draggable={false}
            />
          </svg>
        </CanvasWrapper>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(75, 100, 220, 0.08)' }}>
          <h4 className="font-semibold mb-3" style={{ color: 'var(--color-blue)' }}>
            Column Vector u = ({problem.u[0].toFixed(1)}, {problem.u[1].toFixed(1)})
          </h4>
          <div className="space-y-3">
            <Slider
              label="x-component"
              value={vectorU[0]}
              onChange={(v) => setVectorU(prev => [v, prev[1]])}
              min={-5}
              max={5}
              step={0.1}
              color="blue"
            />
            <Slider
              label="y-component"
              value={vectorU[1]}
              onChange={(v) => setVectorU(prev => [prev[0], v])}
              min={-5}
              max={5}
              step={0.1}
              color="blue"
            />
          </div>
        </div>

        <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(75, 180, 140, 0.08)' }}>
          <h4 className="font-semibold mb-3" style={{ color: 'var(--color-emerald)' }}>
            Column Vector v = ({problem.v[0].toFixed(1)}, {problem.v[1].toFixed(1)})
          </h4>
          <div className="space-y-3">
            <Slider
              label="x-component"
              value={vectorV[0]}
              onChange={(v) => setVectorV(prev => [v, prev[1]])}
              min={-5}
              max={5}
              step={0.1}
              color="emerald"
            />
            <Slider
              label="y-component"
              value={vectorV[1]}
              onChange={(v) => setVectorV(prev => [prev[0], v])}
              min={-5}
              max={5}
              step={0.1}
              color="emerald"
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--color-paper-2)' }}>
        <div className="flex items-center justify-center gap-4 text-sm">
          <span style={{ color: 'var(--color-ink-2)' }}>Area = det([u, v]) = u₁×v₂ - u₂×v₁</span>
          <span className="font-mono font-semibold" style={{ color: 'var(--color-ink-2)' }}>
            = {vectorU[0].toFixed(1)}×{vectorV[1].toFixed(1)} - {vectorU[1].toFixed(1)}×{vectorV[0].toFixed(1)}
          </span>
          <span className="font-mono font-bold" style={{ color: 'var(--color-accent)' }}>
            = {currentDet.toFixed(1)}
          </span>
        </div>
      </div>

      {showResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl p-4"
          style={{
            backgroundColor: scoreForRound >= 80 ? 'rgba(16, 185, 129, 0.1)' :
                             scoreForRound >= 50 ? 'rgba(245, 158, 11, 0.1)' :
                             'rgba(220, 75, 55, 0.1)',
            borderWidth: 1,
            borderStyle: 'solid',
            borderColor: scoreForRound >= 80 ? 'rgba(16, 185, 129, 0.3)' :
                         scoreForRound >= 50 ? 'rgba(245, 158, 11, 0.3)' :
                         'rgba(220, 75, 55, 0.3)',
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-lg" style={{
                color: scoreForRound >= 80 ? 'var(--color-emerald)' :
                       scoreForRound >= 50 ? 'var(--color-amber)' :
                       'var(--color-red)'
              }}>
                {scoreForRound >= 80 ? 'Perfect Area!' :
                 scoreForRound >= 50 ? 'Close Match!' :
                 'Keep Adjusting!'}
              </p>
              <p className="text-sm" style={{ color: 'var(--color-ink-2)' }}>
                You created: u = ({vectorU[0].toFixed(1)}, {vectorU[1].toFixed(1)}), v = ({vectorV[0].toFixed(1)}, {vectorV[1].toFixed(1)})
              </p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-bold font-mono" style={{ fontFamily: 'var(--font-mono)' }}>
                +{scoreForRound}
              </span>
            </div>
          </div>
        </motion.div>
      )}

      <div className="flex justify-center">
        <Button
          variant="primary"
          size="lg"
          onClick={handleSubmit}
          disabled={attempts >= maxAttempts}
          className="px-8"
        >
          Check Answer
        </Button>
      </div>
    </div>
  );
}