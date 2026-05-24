import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import CanvasWrapper from '../components/Canvas/CanvasWrapper.jsx';
import Grid2D from '../components/Canvas/Grid2D.jsx';
import Vector2D from '../components/Canvas/Vector2D.jsx';
import { Slider } from '../components/UI/Slider.jsx';
import { Button } from '../components/UI/Button.jsx';
import { magnitude, add } from '../utils/linalg.js';

const DIFFICULTY_LEVELS = [
  { name: 'Easy', targetRange: 5, gridExtent: 8 },
  { name: 'Medium', targetRange: 8, gridExtent: 10 },
  { name: 'Hard', targetRange: 12, gridExtent: 12 },
];

function generateTarget(level) {
  const range = DIFFICULTY_LEVELS[level].targetRange;
  return [
    Math.round((Math.random() * 2 - 1) * range * 10) / 10,
    Math.round((Math.random() * 2 - 1) * range * 10) / 10,
  ];
}

function generateVectors(target, level) {
  const vec1 = [
    Math.round((Math.random() * 2 - 1) * 6 * 10) / 10,
    Math.round((Math.random() * 2 - 1) * 6 * 10) / 10,
  ];
  const vec2 = [
    Math.round((target[0] - vec1[0] + (Math.random() - 0.5) * 4) * 10) / 10,
    Math.round((target[1] - vec1[1] + (Math.random() - 0.5) * 4) * 10) / 10,
  ];
  return [vec1, vec2];
}

export default function VectorTarget({
  onSubmit,
  attempts,
  maxAttempts,
  score,
  gameState,
  setGameState,
  difficulty = 0,
}) {
  const [target, setTarget] = useState([0, 0]);
  const [vectors, setVectors] = useState([[1, 0], [0, 1]]);
  const [originalVec1, setOriginalVec1] = useState([1, 0]);
  const [originalVec2, setOriginalVec2] = useState([0, 1]);
  const [currentVec1, setCurrentVec1] = useState([1, 0]);
  const [currentVec2, setCurrentVec2] = useState([0, 1]);
  const [round, setRound] = useState(1);
  const [hitRadius, setHitRadius] = useState(0.8);
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastDistance, setLastDistance] = useState(0);

  const totalRounds = 5;

  useEffect(() => {
    initializeRound();
  }, []);

  const initializeRound = useCallback(() => {
    const newTarget = generateTarget(difficulty);
    const newVectors = generateVectors(newTarget, difficulty);
    setTarget(newTarget);
    setOriginalVec1(newVectors[0]);
    setOriginalVec2(newVectors[1]);
    setCurrentVec1(newVectors[0]);
    setCurrentVec2(newVectors[1]);
    setShowFeedback(false);
    setHitRadius(DIFFICULTY_LEVELS[difficulty].targetRange / 10);
  }, [difficulty]);

  const sumVector = useMemo(() => {
    return add([currentVec1], [currentVec2])[0];
  }, [currentVec1, currentVec2]);

  const distance = useMemo(() => {
    const dx = sumVector[0] - target[0];
    const dy = sumVector[1] - target[1];
    return Math.sqrt(dx * dx + dy * dy);
  }, [sumVector, target]);

  const scoreForRound = useMemo(() => {
    if (distance <= hitRadius * 0.3) return 100;
    if (distance <= hitRadius) return 80;
    if (distance <= hitRadius * 2) return 50;
    if (distance <= hitRadius * 3) return 20;
    return 0;
  }, [distance, hitRadius]);

  const handleSubmit = () => {
    setLastDistance(distance);
    setShowFeedback(true);
    const points = scoreForRound;

    setTimeout(() => {
      onSubmit(points);
      if (round < totalRounds) {
        setRound((r) => r + 1);
        initializeRound();
      }
    }, 1000);
  };

  const handleVector1Change = (axis, value) => {
    setCurrentVec1((prev) => {
      const newVec = [...prev];
      newVec[axis === 'x' ? 0 : 1] = value;
      return newVec;
    });
  };

  const handleVector2Change = (axis, value) => {
    setCurrentVec2((prev) => {
      const newVec = [...prev];
      newVec[axis === 'x' ? 0 : 1] = value;
      return newVec;
    });
  };

  const getProximityColor = () => {
    if (distance <= hitRadius * 0.3) return '#10b981';
    if (distance <= hitRadius) return '#22c55e';
    if (distance <= hitRadius * 2) return '#f59e0b';
    if (distance <= hitRadius * 3) return '#f97316';
    return '#ef4444';
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--color-paper)' }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="font-semibold" style={{ color: 'var(--color-ink)' }}>Target Point</h4>
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Add vectors to reach the target</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold font-mono" style={{ color: getProximityColor() }}>
              ({target[0].toFixed(1)}, {target[1].toFixed(1)})
            </p>
          </div>
        </div>

        <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-rule)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: getProximityColor() }}
            animate={{ width: `${Math.max(5, 100 - (distance / (hitRadius * 4)) * 100)}%` }}
            transition={{ duration: 0.2 }}
          />
        </div>

        <div className="flex justify-between items-center mt-2 text-xs" style={{ color: 'var(--color-muted)' }}>
          <span>Round {round}/{totalRounds}</span>
          <span>Distance: {distance.toFixed(2)}</span>
        </div>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--color-paper-2)', border: '1px solid var(--color-rule)' }}>
        <CanvasWrapper
          mode="2d"
          gridExtent={DIFFICULTY_LEVELS[difficulty].gridExtent}
          interactive={false}
          className="h-80"
        >
          <svg width="100%" height="100%" className="absolute inset-0">
            <Grid2D showLabels={true} showTicks={true} />

            <motion.g
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              style={{ transformOrigin: 'center' }}
            >
              <circle
                cx={400 + target[0] * 25}
                cy={160 - target[1] * 25}
                r={20}
                fill={getProximityColor()}
                fillOpacity="0.2"
                stroke={getProximityColor()}
                strokeWidth="3"
                strokeDasharray="8 4"
              />
              <circle
                cx={400 + target[0] * 25}
                cy={160 - target[1] * 25}
                r="6"
                fill={getProximityColor()}
              />
            </motion.g>

            <Vector2D
              id="vec1"
              origin={[0, 0]}
              tip={currentVec1}
              color="#3b82f6"
              label="v₁"
              showMagnitude={true}
              draggable={false}
            />

            <Vector2D
              id="vec2"
              origin={currentVec1}
              tip={sumVector}
              color="#8b5cf6"
              label="v₂"
              showMagnitude={true}
              draggable={false}
            />

            <motion.g
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <circle
                cx={400 + sumVector[0] * 25}
                cy={160 - sumVector[1] * 25}
                r="8"
                fill={getProximityColor()}
                stroke="white"
                strokeWidth="2"
              />
            </motion.g>
          </svg>
        </CanvasWrapper>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--color-paper)' }}>
          <h4 className="font-semibold mb-3" style={{ color: 'var(--color-blue)' }}>
            Vector v₁ = ({originalVec1[0].toFixed(1)}, {originalVec1[1].toFixed(1)})
          </h4>
          <div className="space-y-3">
            <Slider
              label="x-component"
              value={currentVec1[0]}
              onChange={(v) => handleVector1Change('x', v)}
              min={-DIFFICULTY_LEVELS[difficulty].targetRange}
              max={DIFFICULTY_LEVELS[difficulty].targetRange}
              step={0.1}
              color="blue"
            />
            <Slider
              label="y-component"
              value={currentVec1[1]}
              onChange={(v) => handleVector1Change('y', v)}
              min={-DIFFICULTY_LEVELS[difficulty].targetRange}
              max={DIFFICULTY_LEVELS[difficulty].targetRange}
              step={0.1}
              color="blue"
            />
          </div>
        </div>

        <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--color-paper)' }}>
          <h4 className="font-semibold mb-3" style={{ color: 'var(--color-violet)' }}>
            Vector v₂ = ({originalVec2[0].toFixed(1)}, {originalVec2[1].toFixed(1)})
          </h4>
          <div className="space-y-3">
            <Slider
              label="x-component"
              value={currentVec2[0]}
              onChange={(v) => handleVector2Change('x', v)}
              min={-DIFFICULTY_LEVELS[difficulty].targetRange}
              max={DIFFICULTY_LEVELS[difficulty].targetRange}
              step={0.1}
              color="violet"
            />
            <Slider
              label="y-component"
              value={currentVec2[1]}
              onChange={(v) => handleVector2Change('y', v)}
              min={-DIFFICULTY_LEVELS[difficulty].targetRange}
              max={DIFFICULTY_LEVELS[difficulty].targetRange}
              step={0.1}
              color="violet"
            />
          </div>
        </div>
      </div>

      {showFeedback && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl p-4"
          style={{
            backgroundColor: scoreForRound >= 80 ? 'var(--color-success-bg)' : scoreForRound >= 50 ? 'var(--color-warning-bg)' : 'var(--color-error-bg)',
            border: '1px solid var(--color-rule)'
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-lg" style={{
                color: scoreForRound >= 80 ? 'var(--color-success)' : scoreForRound >= 50 ? 'var(--color-warning)' : 'var(--color-error)'
              }}>
                {scoreForRound >= 80 ? 'Excellent!' :
                 scoreForRound >= 50 ? 'Good attempt!' :
                 'Keep trying!'}
              </p>
              <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                Your result: ({sumVector[0].toFixed(1)}, {sumVector[1].toFixed(1)})
              </p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-bold font-mono" style={{ color: getProximityColor() }}>
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
          Submit Answer
        </Button>
      </div>
    </div>
  );
}