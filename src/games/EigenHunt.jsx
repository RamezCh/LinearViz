import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/UI/Button.jsx';
import CanvasWrapper from '../components/Canvas/CanvasWrapper.jsx';
import Grid2D from '../components/Canvas/Grid2D.jsx';
import Vector2D from '../components/Canvas/Vector2D.jsx';
import { eigenvalues2x2, eigenvectors2x2, multiply } from '../utils/linalg.js';

function generateProblem() {
  const a = [
    [Math.round((Math.random() * 4 - 2) * 10) / 10, Math.round((Math.random() * 4 - 2) * 10) / 10],
    [Math.round((Math.random() * 4 - 2) * 10) / 10, Math.round((Math.random() * 4 - 2) * 10) / 10],
  ];
  
  const eigs = eigenvalues2x2(a);
  const ev1 = eigenvectors2x2(a, eigs[0].value || eigs[0].re);
  const ev2 = eigenvectors2x2(a, eigs[1]?.value || eigs[1]?.re);
  
  const angle = Math.random() * 360;
  const cos = Math.cos(angle * Math.PI / 180);
  const sin = Math.sin(angle * Math.PI / 180);
  const rotation = [[cos, -sin], [sin, cos]];
  
  const transformedA = multiply(rotation, a);
  
  return {
    originalMatrix: a,
    eigenvalues: eigs,
    eigenvectors: [ev1, ev2],
    transformation: rotation,
    transformedMatrix: transformedA,
  };
}

export default function EigenHunt({
  onSubmit,
  attempts,
  maxAttempts,
  score,
  difficulty = 0,
}) {
  const [problem, setProblem] = useState(null);
  const [clickedPoints, setClickedPoints] = useState([]);
  const [showEigenvectors, setShowEigenvectors] = useState(false);
  const [showEigenvalues, setShowEigenvalues] = useState(false);
  const [transformationProgress, setTransformationProgress] = useState(0);
  const [round, setRound] = useState(1);
  const [totalRounds] = useState(4);

  useEffect(() => {
    loadNewProblem();
  }, []);

  useEffect(() => {
    if (!problem) return;
    
    const duration = 2000;
    let startTime = null;
    
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setTransformationProgress(progress);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [problem]);

  const loadNewProblem = useCallback(() => {
    const newProblem = generateProblem();
    setProblem(newProblem);
    setClickedPoints([]);
    setShowEigenvectors(false);
    setShowEigenvalues(false);
    setTransformationProgress(0);
  }, []);

  const unitVectors = useMemo(() => {
    const points = [];
    for (let i = -10; i <= 10; i++) {
      for (let j = -10; j <= 10; j++) {
        if (Math.abs(i) > 0.5 && Math.abs(j) > 0.5) {
          const len = Math.sqrt(i * i + j * j);
          if (len < 10) {
            points.push({ x: i / len, y: j / len, length: 1 });
          }
        }
      }
    }
    return points.slice(0, 100);
  }, []);

  const handleCanvasClick = (e) => {
    if (!problem || showEigenvectors) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const canvasX = (x - rect.width / 2) / 20;
    const canvasY = -(y - rect.height / 2) / 20;
    
    const len = Math.sqrt(canvasX * canvasX + canvasY * canvasY);
    if (len < 0.5) return;
    
    const normalizedX = canvasX / len;
    const normalizedY = canvasY / len;
    
    const ev1 = problem.eigenvectors[0];
    const ev2 = problem.eigenvectors[1];
    
    const dot1 = Math.abs(normalizedX * ev1[0] + normalizedY * ev1[1]);
    const dot2 = Math.abs(normalizedX * ev2[0] + normalizedY * ev2[1]);
    
    const isCorrect = dot1 > 0.9 || dot2 > 0.9;
    
    setClickedPoints(prev => [
      ...prev,
      { x: normalizedX, y: normalizedY, len, isCorrect, dot1, dot2 },
    ]);
  };

  const scoreForRound = useMemo(() => {
    if (!problem) return 0;
    
    const correctClicks = clickedPoints.filter(p => p.isCorrect).length;
    const uniqueDirections = new Set();
    
    clickedPoints.forEach(p => {
      if (p.isCorrect) {
        const key1 = `${p.dot1 > p.dot2 ? 0 : 1}`;
        uniqueDirections.add(key1);
      }
    });
    
    if (uniqueDirections.size === 2) return 100;
    if (uniqueDirections.size === 1 && correctClicks >= 2) return 80;
    if (correctClicks >= 1) return 50;
    
    return Math.min(correctClicks * 20, 40);
  }, [clickedPoints, problem]);

  const handleSubmit = () => {
    setShowEigenvectors(true);
    setShowEigenvalues(true);
    const points = scoreForRound;

    setTimeout(() => {
      onSubmit(points);
      if (round < totalRounds) {
        setRound(r => r + 1);
        loadNewProblem();
      }
    }, 3000);
  };

  if (!problem) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div
        className="bg-gradient-to-r from-pink-500 to-rose-600 rounded-xl p-4"
        style={{ backgroundColor: 'var(--color-paper)' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-bold text-lg">Eigenvector Hunt</h4>
            <p className="text-sm" style={{ color: 'var(--color-ink)', opacity: 0.8 }}>
              Click on the canvas to find eigenvector directions
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm" style={{ color: 'var(--color-ink)', opacity: 0.6 }}>Round</p>
            <p className="text-2xl font-bold font-mono">{round}/{totalRounds}</p>
          </div>
        </div>
      </div>

      <div
        className="rounded-xl p-4"
        style={{ backgroundColor: 'var(--color-paper-2)' }}
      >
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div
            className="rounded-lg p-3"
            style={{ backgroundColor: 'var(--color-paper)' }}
          >
            <p className="text-xs mb-1" style={{ color: 'var(--color-muted)' }}>Matrix A</p>
            <div className="font-mono text-sm">
              <div className="flex gap-2">
                <span style={{ color: 'var(--color-ink-2)' }}>{problem.originalMatrix[0][0].toFixed(1)}</span>
                <span style={{ color: 'var(--color-muted)' }}>{problem.originalMatrix[0][1].toFixed(1)}</span>
              </div>
              <div className="flex gap-2">
                <span style={{ color: 'var(--color-muted)' }}>{problem.originalMatrix[1][0].toFixed(1)}</span>
                <span style={{ color: 'var(--color-ink-2)' }}>{problem.originalMatrix[1][1].toFixed(1)}</span>
              </div>
            </div>
          </div>
          <div
            className="rounded-lg p-3"
            style={{ backgroundColor: 'var(--color-paper)' }}
          >
            <p className="text-xs mb-1" style={{ color: 'var(--color-muted)' }}>Eigenvalues</p>
            <div className="font-mono text-sm" style={{ color: 'var(--color-emerald)' }}>
              {problem.eigenvalues[0]?.value !== undefined
                ? `λ₁ = ${problem.eigenvalues[0].value.toFixed(2)}`
                : `λ₁ = ${problem.eigenvalues[0]?.re?.toFixed(2)} + ${problem.eigenvalues[0]?.im?.toFixed(2)}i`}
              {problem.eigenvalues[1]?.value !== undefined && (
                <>, λ₂ = {problem.eigenvalues[1].value.toFixed(2)}</>
              )}
            </div>
          </div>
        </div>

        <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-rule)' }}>
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-pink-500 to-rose-400"
            animate={{ width: `${transformationProgress * 100}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
        <p className="text-xs mt-2 text-center" style={{ color: 'var(--color-muted)' }}>
          Transformation in progress...
        </p>
      </div>

      <div
        className="rounded-xl overflow-hidden"
        style={{ backgroundColor: 'var(--color-paper)', borderColor: 'var(--color-rule)', borderWidth: '1px', borderStyle: 'solid' }}
      >
        <div
          className="p-3 border-b"
          style={{ backgroundColor: 'var(--color-paper-2)', borderColor: 'var(--color-rule)' }}
        >
          <p className="text-sm text-center" style={{ color: 'var(--color-ink-2)' }}>
            Click on eigenvector directions (they don't change direction under transformation)
          </p>
        </div>
        <div className="h-80 relative" onClick={handleCanvasClick}>
          <svg width="100%" height="100%" className="absolute inset-0">
            <rect x="0" y="0" width="100%" height="100%" fill="transparent" />
            
            {clickedPoints.map((point, i) => (
              <motion.circle
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                cx={320 + point.x * 30}
                cy={160 - point.y * 30}
                r={8}
                fill={point.isCorrect ? '#10b981' : 'rgba(220,75,55,0.9)'}
                stroke="white"
                strokeWidth="2"
                opacity="0.8"
              />
            ))}

            {showEigenvectors && (
              <>
                <motion.line
                  x1={320 + problem.eigenvectors[0][0] * -150}
                  y1={160 + problem.eigenvectors[0][1] * 150}
                  x2={320 + problem.eigenvectors[0][0] * 150}
                  y2={160 - problem.eigenvectors[0][1] * 150}
                  stroke="#10b981"
                  strokeWidth="4"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  strokeLinecap="round"
                />
                <motion.line
                  x1={320 + problem.eigenvectors[1][0] * -150}
                  y1={160 + problem.eigenvectors[1][1] * 150}
                  x2={320 + problem.eigenvectors[1][0] * 150}
                  y2={160 - problem.eigenvectors[1][1] * 150}
                  stroke="#3b82f6"
                  strokeWidth="4"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  strokeLinecap="round"
                />
              </>
            )}

            <g opacity="0.2">
              {unitVectors.map((v, i) => (
                <line
                  key={i}
                  x1={320 + v.x * 5}
                  y1={160 - v.y * 5}
                  x2={320 + v.x * point.length * 30 * transformationProgress}
                  y2={160 + v.y * point.length * 30 * transformationProgress}
                  stroke="#94a3b8"
                  strokeWidth="0.5"
                  strokeLinecap="round"
                />
              ))}
            </g>

            <circle cx="320" cy="160" r="4" fill="#64748b" />
          </svg>
        </div>
      </div>

      {showEigenvectors && showEigenvalues && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl p-4"
          style={{ backgroundColor: 'var(--color-paper-2)', borderColor: 'var(--color-emerald)', borderWidth: '1px', borderStyle: 'solid' }}
        >
          <h4 className="font-bold mb-3" style={{ color: 'var(--color-emerald)' }}>
            Eigenvectors Revealed!
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div
              className="rounded-lg p-3"
              style={{ backgroundColor: 'var(--color-paper)' }}
            >
              <p className="text-xs mb-1" style={{ color: 'var(--color-muted)' }}>λ₁ = {problem.eigenvalues[0]?.value?.toFixed(2)}</p>
              <p className="font-mono" style={{ color: 'var(--color-emerald)' }}>
                v₁ = ({problem.eigenvectors[0][0].toFixed(2)}, {problem.eigenvectors[0][1].toFixed(2)})
              </p>
            </div>
            {problem.eigenvalues[1] && (
              <div
                className="rounded-lg p-3"
                style={{ backgroundColor: 'var(--color-paper)' }}
              >
                <p className="text-xs mb-1" style={{ color: 'var(--color-muted)' }}>
                  λ₂ = {problem.eigenvalues[1].value?.toFixed(2) || 'complex'}
                </p>
                <p className="font-mono" style={{ color: 'var(--color-accent)' }}>
                  v₂ = ({problem.eigenvectors[1][0].toFixed(2)}, {problem.eigenvectors[1][1].toFixed(2)})
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {showEigenvectors && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl p-4"
          style={{
            backgroundColor: scoreForRound >= 80 ? 'var(--color-paper-2)' : scoreForRound >= 50 ? 'var(--color-paper-2)' : 'var(--color-paper-2)',
            borderColor: 'var(--color-rule)',
            borderWidth: '1px',
            borderStyle: 'solid',
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-lg" style={{ color: 'var(--color-ink)' }}>
                Score: {scoreForRound}
              </p>
              <p className="text-sm" style={{ color: 'var(--color-ink-2)' }}>
                Found {clickedPoints.filter(p => p.isCorrect).length} eigenvector directions
              </p>
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
          Show Eigenvectors
        </Button>
      </div>
    </div>
  );
}