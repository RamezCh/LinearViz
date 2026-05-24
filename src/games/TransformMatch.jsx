import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Slider } from '../components/UI/Slider.jsx';
import { Button } from '../components/UI/Button.jsx';
import { multiply } from '../utils/linalg.js';

const PRESET_TRANSFORMATIONS = [
  { name: 'Rotation 90°', matrix: [[0, -1], [1, 0]], color: '#3b82f6' },
  { name: 'Scaling 2x', matrix: [[2, 0], [0, 2]], color: '#10b981' },
  { name: 'Shear X', matrix: [[1, 1], [0, 1]], color: '#f59e0b' },
  { name: 'Reflection', matrix: [[1, 0], [0, -1]], color: '#ec4899' },
  { name: 'Squeeze', matrix: [[2, 0], [0, 0.5]], color: '#8b5cf6' },
];

function generateProblem() {
  const presetIndex = Math.floor(Math.random() * PRESET_TRANSFORMATIONS.length);
  const preset = PRESET_TRANSFORMATIONS[presetIndex];
  
  const shape = [
    { x: -2, y: -1 },
    { x: 2, y: -1 },
    { x: 2, y: 1 },
    { x: -2, y: 1 },
  ];
  
  const targetAfter = shape.map(p => [
    preset.matrix[0][0] * p.x + preset.matrix[0][1] * p.y,
    preset.matrix[1][0] * p.x + preset.matrix[1][1] * p.y,
  ]);
  
  return {
    transformation: preset,
    originalShape: shape,
    targetShape: targetAfter,
    solution: preset.matrix,
  };
}

export default function TransformMatch({
  onSubmit,
  attempts,
  maxAttempts,
  score,
  difficulty = 0,
}) {
  const [problem, setProblem] = useState(null);
  const [userMatrix, setUserMatrix] = useState([[1, 0], [0, 1]]);
  const [showResult, setShowResult] = useState(false);
  const [round, setRound] = useState(1);
  const [totalRounds] = useState(5);

  useEffect(() => {
    loadNewProblem();
  }, []);

  const loadNewProblem = useCallback(() => {
    const newProblem = generateProblem();
    setProblem(newProblem);
    setUserMatrix([[1, 0], [0, 1]]);
    setShowResult(false);
  }, []);

  const transformedShape = useMemo(() => {
    if (!problem) return [];
    const { originalShape } = problem;
    return originalShape.map(p => [
      userMatrix[0][0] * p.x + userMatrix[0][1] * p.y,
      userMatrix[1][0] * p.x + userMatrix[1][1] * p.y,
    ]);
  }, [problem, userMatrix]);

  const accuracy = useMemo(() => {
    if (!problem) return 0;
    const { targetShape } = problem;
    
    let totalError = 0;
    for (let i = 0; i < 4; i++) {
      const dx = transformedShape[i][0] - targetShape[i][0];
      const dy = transformedShape[i][1] - targetShape[i][1];
      totalError += Math.sqrt(dx * dx + dy * dy);
    }
    
    return Math.max(0, 100 - totalError * 10);
  }, [problem, transformedShape]);

  const scoreForRound = useMemo(() => {
    if (accuracy >= 95) return 100;
    if (accuracy >= 80) return 80;
    if (accuracy >= 60) return 60;
    if (accuracy >= 40) return 30;
    return 0;
  }, [accuracy]);

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

  const handleMatrixChange = (row, col, value) => {
    setUserMatrix(prev => {
      const newMatrix = prev.map(r => [...r]);
      newMatrix[row][col] = Math.round(value * 100) / 100;
      return newMatrix;
    });
  };

  if (!problem) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div
        className="rounded-xl p-4"
        style={{
          background: 'linear-gradient(to right, var(--color-violet), var(--color-accent-2))',
          color: 'var(--color-paper)',
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-bold text-lg" style={{ fontFamily: 'var(--font-display)' }}>Match the Transformation</h4>
            <p className="text-sm" style={{ opacity: 0.8 }}>
              Adjust the matrix to transform the square to match the target
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm" style={{ opacity: 0.6 }}>Round</p>
            <p className="text-2xl font-bold font-mono" style={{ fontFamily: 'var(--font-mono)' }}>{round}/{totalRounds}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--color-paper-2)' }}>
          <h4 className="font-semibold mb-3" style={{ color: 'var(--color-ink)' }}>Original Shape</h4>
          <svg viewBox="-6 -4 12 8" className="w-full h-48">
            <defs>
              <pattern id="grid1" width="1" height="1" patternUnits="userSpaceOnUse">
                <path d="M 1 0 L 0 0 0 1" fill="none" stroke="#cbd5e1" strokeWidth="0.1"/>
              </pattern>
            </defs>
            <rect x="-6" y="-4" width="12" height="8" fill="url(#grid1)"/>
            <polygon
              points={problem.originalShape.map(p => `${p.x},${p.y}`).join(' ')}
              fill="var(--color-blue)"
              fillOpacity="0.3"
              stroke="var(--color-blue)"
              strokeWidth="0.15"
            />
            <circle cx="0" cy="0" r="0.1" fill="var(--color-blue)"/>
          </svg>
        </div>

        <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--color-paper-2)' }}>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold" style={{ color: 'var(--color-ink)' }}>Target Result</h4>
            <span className="px-2 py-1 rounded text-xs font-medium" style={{ backgroundColor: 'rgba(140, 100, 215, 0.12)', color: 'var(--color-violet)' }}>
              {problem.transformation.name}
            </span>
          </div>
          <svg viewBox="-12 -8 24 16" className="w-full h-48">
            <defs>
              <pattern id="grid2" width="1" height="1" patternUnits="userSpaceOnUse">
                <path d="M 1 0 L 0 0 0 1" fill="none" stroke="var(--color-rule)" strokeWidth="0.1"/>
              </pattern>
            </defs>
            <rect x="-12" y="-8" width="24" height="16" fill="url(#grid2)"/>
            <polygon
              points={problem.targetShape.map(p => `${p.x},${p.y}`).join(' ')}
              fill="var(--color-emerald)"
              fillOpacity="0.3"
              stroke="var(--color-emerald)"
              strokeWidth="0.15"
            />
            <circle cx="0" cy="0" r="0.1" fill="var(--color-emerald)"/>
          </svg>
        </div>
      </div>

      <div className="rounded-xl border p-4" style={{ backgroundColor: 'var(--color-paper)', borderColor: 'var(--color-rule)' }}>
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold" style={{ color: 'var(--color-ink)' }}>Your Transformation Matrix</h4>
          <div className="flex items-center gap-2">
            <span className="text-sm" style={{ color: 'var(--color-muted)' }}>Accuracy:</span>
            <span className="font-bold" style={{
              color: accuracy >= 80 ? 'var(--color-emerald)' :
              accuracy >= 50 ? 'var(--color-amber)' : 'var(--color-red)',
            }}>
              {accuracy.toFixed(0)}%
            </span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-8">
          <div className="text-2xl font-bold" style={{ color: 'var(--color-muted)' }}>A</div>
          
          <div className="grid grid-cols-2 gap-3">
            {[0, 1].map(row => (
              [0, 1].map(col => (
                <div key={`${row}-${col}`} className="w-20">
                  <input
                    type="number"
                    step="0.1"
                    value={userMatrix[row][col]}
                    onChange={(e) => handleMatrixChange(row, col, parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-center text-lg rounded-lg border-2 focus:outline-none"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      backgroundColor: 'var(--color-paper)',
                      borderColor: 'var(--color-rule)',
                      color: 'var(--color-ink)',
                    }}
                  />
                </div>
              ))
            ))}
          </div>
          
          <div className="text-2xl font-bold" style={{ color: 'var(--color-muted)' }}>v</div>
        </div>

        <div className="mt-6">
          <svg viewBox="-8 -5 16 10" className="w-full h-32">
            <defs>
              <pattern id="grid3" width="1" height="1" patternUnits="userSpaceOnUse">
                <path d="M 1 0 L 0 0 0 1" fill="none" stroke="var(--color-rule)" strokeWidth="0.1"/>
              </pattern>
            </defs>
            <rect x="-8" y="-5" width="16" height="10" fill="url(#grid3)"/>
            
            <polygon
              points={transformedShape.map(p => `${p.x},${p.y}`).join(' ')}
              fill={scoreForRound >= 80 ? 'var(--color-emerald)' : scoreForRound >= 50 ? 'var(--color-amber)' : 'var(--color-red)'}
              fillOpacity="0.3"
              stroke={scoreForRound >= 80 ? 'var(--color-emerald)' : scoreForRound >= 50 ? 'var(--color-amber)' : 'var(--color-red)'}
              strokeWidth="0.15"
            />
            
            <polygon
              points={problem.targetShape.map(p => `${p.x},${p.y}`).join(' ')}
              fill="transparent"
              stroke="var(--color-muted)"
              strokeWidth="0.1"
              strokeDasharray="0.2"
            />
            
            <circle cx="0" cy="0" r="0.1" fill="var(--color-muted)"/>
          </svg>
        </div>
      </div>

      {showResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl p-4 border"
          style={{
            backgroundColor: scoreForRound >= 80 ? 'rgba(75, 180, 140, 0.08)' : scoreForRound >= 50 ? 'rgba(200, 155, 50, 0.08)' : 'rgba(175, 90, 65, 0.08)',
            borderColor: scoreForRound >= 80 ? 'var(--color-emerald)' : scoreForRound >= 50 ? 'var(--color-amber)' : 'var(--color-red)',
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-lg" style={{ color: 'var(--color-ink)' }}>
                {scoreForRound >= 80 ? 'Perfect Match!' :
                 scoreForRound >= 50 ? 'Getting Closer!' :
                 'Keep Practicing!'}
              </p>
              <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                Your matrix: [{userMatrix[0].map(v => v.toFixed(1)).join(', ')}]
                [{userMatrix[1].map(v => v.toFixed(1)).join(', ')}]
              </p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-bold font-mono" style={{ color: 'var(--color-emerald)', fontFamily: 'var(--font-mono)' }}>
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
          Submit Matrix
        </Button>
      </div>
    </div>
  );
}