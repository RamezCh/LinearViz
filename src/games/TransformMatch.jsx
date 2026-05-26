import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import TransformGrid from '../components/Canvas/TransformGrid.jsx';
import { rotationMatrix, scaleMatrix, shearMatrix, reflectMatrix, multiply } from '../utils/linalg.js';

function generateTarget(difficulty) {
  switch (difficulty) {
    case 0:
      return { matrix: rotationMatrix(Math.floor(Math.random() * 4) * 45 + 30), name: 'Rotation' };
    case 1:
      return {
        matrix: scaleMatrix(
          Math.round((Math.random() * 2 + 0.5) * 10) / 10,
          Math.round((Math.random() * 2 + 0.5) * 10) / 10
        ),
        name: 'Scale'
      };
    case 2:
      return {
        matrix: shearMatrix(Math.round((Math.random() * 1.5 + 0.25) * 10) / 10),
        name: 'Shear'
      };
    case 3:
      return {
        matrix: multiply(rotationMatrix(45), shearMatrix(0.5)),
        name: 'Rotate+Shear'
      };
    case 4:
    default:
      return {
        matrix: [
          [Math.round((Math.random() * 3 - 1) * 10) / 10, Math.round((Math.random() * 2 - 1) * 10) / 10],
          [Math.round((Math.random() * 2 - 1) * 10) / 10, Math.round((Math.random() * 3 - 1) * 10) / 10],
        ],
        name: 'General'
      };
  }
}

export default function TransformMatch({
  onSubmit,
  attempts,
  maxAttempts,
  score,
  gameState,
  setGameState,
  difficulty = 0,
}) {
  const [target, setTarget] = useState([[1, 0], [0, 1]]);
  const [userMatrix, setUserMatrix] = useState([[1, 0], [0, 1]]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastScore, setLastScore] = useState(0);
  const [round, setRound] = useState(1);
  const containerRef = useRef(null);

  const totalRounds = 5;

  useEffect(() => {
    initializeRound();
  }, []);

  const initializeRound = useCallback(() => {
    const newTarget = generateTarget(difficulty);
    setTarget(newTarget.matrix);
    setUserMatrix([[1, 0], [0, 1]]);
    setShowFeedback(false);
  }, [difficulty]);

  const frobeniusError = useMemo(() => {
    let sum = 0;
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 2; j++) {
        sum += Math.pow(target[i][j] - userMatrix[i][j], 2);
      }
    }
    return Math.sqrt(sum);
  }, [target, userMatrix]);

  const scoreForRound = useMemo(() => {
    const error = frobeniusError;
    if (error < 0.1) return 100;
    if (error < 0.3) return 90;
    if (error < 0.5) return 80;
    if (error < 1.0) return 60;
    if (error < 1.5) return 40;
    if (error < 2.0) return 20;
    return Math.max(0, 100 - error * 15);
  }, [frobeniusError]);

  const getProximityColor = () => {
    const error = frobeniusError;
    if (error < 0.1) return '#10b981';
    if (error < 0.3) return '#22c55e';
    if (error < 0.5) return '#84cc16';
    if (error < 1.0) return '#eab308';
    if (error < 1.5) return '#f97316';
    if (error < 2.0) return '#ef4444';
    return '#dc2626';
  };

  const handleSubmit = () => {
    setLastScore(scoreForRound);
    setShowFeedback(true);

    setTimeout(() => {
      onSubmit(scoreForRound);
      if (round < totalRounds) {
        setRound(r => r + 1);
        initializeRound();
      }
    }, 1500);
  };

  const handleMatrixChange = (row, col, value) => {
    setUserMatrix(prev => {
      const newMatrix = prev.map(r => [...r]);
      newMatrix[row][col] = Math.round(value * 100) / 100;
      return newMatrix;
    });
  };

  const matchName = useMemo(() => {
    const names = ['Rotation', 'Scale', 'Shear', 'Compose', 'General'];
    return names[Math.min(difficulty, 4)];
  }, [difficulty]);

  return (
    <div className="space-y-6" ref={containerRef}>
      <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--color-paper)' }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="font-semibold" style={{ color: 'var(--color-ink)' }}>
              Target: {matchName}
            </h4>
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
              Adjust the matrix to match the target transformation
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs" style={{ color: 'var(--color-muted)' }}>Error</p>
            <p className="text-2xl font-bold font-mono" style={{ color: getProximityColor() }}>
              {frobeniusError.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-rule)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: getProximityColor() }}
            animate={{ width: `${Math.max(5, 100 - frobeniusError * 30)}%` }}
            transition={{ duration: 0.2 }}
          />
        </div>

        <div className="flex justify-between items-center mt-2 text-xs" style={{ color: 'var(--color-muted)' }}>
          <span>Round {round}/{totalRounds}</span>
          <span>{scoreForRound >= 80 ? 'Great match!' : scoreForRound >= 50 ? 'Getting closer!' : 'Keep adjusting...'}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--color-paper-2)', border: '1px solid var(--color-rule)' }}>
          <div className="px-3 py-2 border-b" style={{ borderColor: 'var(--color-rule)' }}>
            <span className="text-xs font-semibold" style={{ color: 'var(--color-muted)' }}>Target</span>
          </div>
          <div className="h-64">
            <TransformGrid
              matrix={target}
              animProgress={1}
              showGrid={true}
              showBasis={true}
              showShape={true}
              zoom={35}
              pan={{ x: 0, y: 0 }}
            />
          </div>
          <div className="p-2 text-center font-mono text-xs" style={{ color: 'var(--color-muted)', borderTop: '1px solid var(--color-rule)' }}>
            [{target[0][0].toFixed(2)}, {target[0][1].toFixed(2)}]<br />
            [{target[1][0].toFixed(2)}, {target[1][1].toFixed(2)}]
          </div>
        </div>

        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--color-paper-2)', border: '1px solid var(--color-rule)' }}>
          <div className="px-3 py-2 border-b" style={{ borderColor: 'var(--color-rule)' }}>
            <span className="text-xs font-semibold" style={{ color: 'var(--color-accent)' }}>Your Matrix</span>
          </div>
          <div className="h-64">
            <TransformGrid
              matrix={userMatrix}
              animProgress={1}
              showGrid={true}
              showBasis={true}
              showShape={true}
              zoom={35}
              pan={{ x: 0, y: 0 }}
            />
          </div>
          <div className="p-2 text-center font-mono text-xs" style={{ color: 'var(--color-accent)', borderTop: '1px solid var(--color-rule)' }}>
            [{userMatrix[0][0].toFixed(2)}, {userMatrix[0][1].toFixed(2)}]<br />
            [{userMatrix[1][0].toFixed(2)}, {userMatrix[1][1].toFixed(2)}]
          </div>
        </div>
      </div>

      <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--color-paper)' }}>
        <h4 className="font-semibold mb-3" style={{ color: 'var(--color-ink)' }}>
          Adjust Matrix Entries
        </h4>
        <div className="grid grid-cols-2 gap-4">
          {userMatrix.map((row, i) =>
            row.map((val, j) => (
              <div key={`${i}-${j}`} className="space-y-1">
                <label className="text-xs" style={{ color: 'var(--color-muted)' }}>
                  [{i}][{j}] = {target[i][j].toFixed(2)}
                </label>
                <input
                  type="range"
                  min="-3"
                  max="3"
                  step="0.05"
                  value={userMatrix[i][j]}
                  onChange={(e) => handleMatrixChange(i, j, parseFloat(e.target.value))}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                  style={{ accentColor: 'var(--color-accent)' }}
                />
                <div className="text-center font-mono text-sm font-semibold" style={{ color: 'var(--color-accent)' }}>
                  {userMatrix[i][j].toFixed(2)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showFeedback && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl p-4"
          style={{
            backgroundColor: scoreForRound >= 80 ? 'rgba(16,185,129,0.1)' : scoreForRound >= 50 ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
            border: '1px solid var(--color-rule)'
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-lg" style={{
                color: scoreForRound >= 80 ? '#10b981' : scoreForRound >= 50 ? '#f59e0b' : '#ef4444'
              }}>
                {scoreForRound >= 80 ? 'Perfect match!' :
                 scoreForRound >= 50 ? 'Good attempt!' :
                 'Keep trying!'}
              </p>
              <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                Error: {frobeniusError.toFixed(3)}
              </p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-bold font-mono" style={{ color: getProximityColor() }}>
                +{lastScore.toFixed(0)}
              </span>
            </div>
          </div>
        </motion.div>
      )}

      <div className="flex justify-center">
        <button
          onClick={handleSubmit}
          disabled={attempts >= maxAttempts}
          className="px-8 py-3 text-sm font-semibold rounded-xl transition-all"
          style={{
            backgroundColor: attempts >= maxAttempts ? 'var(--color-rule)' : 'var(--color-accent)',
            color: 'var(--color-paper)',
            cursor: attempts >= maxAttempts ? 'not-allowed' : 'pointer',
          }}
        >
          Check Match
        </button>
      </div>
    </div>
  );
}