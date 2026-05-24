import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../components/UI/Button.jsx';
import { multiply } from '../utils/linalg.js';

function generateProblem() {
  const size = 2;
  const a = [
    [Math.round((Math.random() * 4 - 2) * 10) / 10, Math.round((Math.random() * 4 - 2) * 10) / 10],
    [Math.round((Math.random() * 4 - 2) * 10) / 10, Math.round((Math.random() * 4 - 2) * 10) / 10],
  ];
  const b = [
    [Math.round((Math.random() * 4 - 2) * 10) / 10, Math.round((Math.random() * 4 - 2) * 10) / 10],
    [Math.round((Math.random() * 4 - 2) * 10) / 10, Math.round((Math.random() * 4 - 2) * 10) / 10],
  ];
  
  const c = multiply(a, b);
  
  const numMissing = Math.floor(Math.random() * 3) + 1;
  const missingPositions = [];
  const allPositions = [[0, 0], [0, 1], [1, 0], [1, 1]];
  
  while (missingPositions.length < numMissing) {
    const pos = allPositions[Math.floor(Math.random() * allPositions.length)];
    if (!missingPositions.some(p => p[0] === pos[0] && p[1] === pos[1])) {
      missingPositions.push(pos);
    }
  }
  
  return {
    a,
    b,
    c,
    missingPositions,
  };
}

export default function FillTheProduct({
  onSubmit,
  attempts,
  maxAttempts,
  score,
  timeRemaining,
  timerActive,
}) {
  const [problem, setProblem] = useState(null);
  const [userAnswer, setUserAnswer] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [round, setRound] = useState(1);
  const [totalRounds] = useState(5);
  const [localTimeRemaining, setLocalTimeRemaining] = useState(timeRemaining);

  useEffect(() => {
    loadNewProblem();
  }, []);

  useEffect(() => {
    if (!timerActive) return;
    
    const interval = setInterval(() => {
      setLocalTimeRemaining(prev => {
        if (prev <= 1) {
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerActive]);

  const loadNewProblem = useCallback(() => {
    const newProblem = generateProblem();
    setProblem(newProblem);
    setUserAnswer({});
    setShowResult(false);
    setLocalTimeRemaining(30);
  }, []);

  const handleTimeUp = useCallback(() => {
    const points = calculateScore();
    setShowResult(true);
    setTimeout(() => {
      onSubmit(points);
      if (round < totalRounds) {
        setRound(r => r + 1);
        loadNewProblem();
      }
    }, 1500);
  }, [problem, userAnswer, round, totalRounds, onSubmit, loadNewProblem]);

  const calculateScore = useMemo(() => {
    if (!problem) return 0;
    
    let correct = 0;
    let total = problem.missingPositions.length;
    
    problem.missingPositions.forEach(([row, col]) => {
      const userVal = userAnswer[`${row}-${col}`];
      const correctVal = problem.c[row][col];
      if (Math.abs(parseFloat(userVal) - correctVal) < 0.1) {
        correct++;
      }
    });
    
    const accuracy = correct / total;
    const timeBonus = localTimeRemaining > 0 ? Math.floor(localTimeRemaining / 3) : 0;
    
    return Math.round(accuracy * 100 + timeBonus);
  }, [problem, userAnswer, localTimeRemaining]);

  const handleSubmit = () => {
    setShowResult(true);
    const points = calculateScore();

    setTimeout(() => {
      onSubmit(points);
      if (round < totalRounds) {
        setRound(r => r + 1);
        loadNewProblem();
      }
    }, 1500);
  };

  const handleInputChange = (row, col, value) => {
    setUserAnswer(prev => ({
      ...prev,
      [`${row}-${col}`]: value,
    }));
  };

  if (!problem) return <div>Loading...</div>;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <div
        className="rounded-xl p-4"
        style={{
          background: 'linear-gradient(to right, var(--color-amber), var(--color-accent-3))',
          color: 'var(--color-paper)',
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-bold text-lg" style={{ fontFamily: 'var(--font-display)' }}>Fill the Product</h4>
            <p className="text-sm" style={{ opacity: 0.8 }}>
              Calculate C = A × B and fill in the missing values
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm" style={{ opacity: 0.6 }}>Round</p>
              <p className="text-2xl font-bold font-mono" style={{ fontFamily: 'var(--font-mono)' }}>{round}/{totalRounds}</p>
            </div>
            <motion.div
              className="px-3 py-1.5 rounded-lg"
              animate={localTimeRemaining <= 10 ? { scale: [1, 1.1, 1] } : {}}
              transition={{ repeat: Infinity, duration: 1 }}
              style={{ backgroundColor: localTimeRemaining <= 10 ? 'var(--color-red)' : 'rgba(255,255,255,0.2)' }}
            >
              <span className="font-mono font-bold" style={{ fontFamily: 'var(--font-mono)' }}>
                {formatTime(localTimeRemaining)}
              </span>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4">
        <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(75, 100, 220, 0.08)' }}>
          <p className="text-sm font-medium mb-2 text-center" style={{ color: 'var(--color-blue)' }}>Matrix A</p>
          <div className="grid grid-cols-2 gap-2">
            {problem.a.map((row, i) =>
              row.map((val, j) => (
                <div key={`a-${i}-${j}`}>
                  <input
                    type="number"
                    value={val}
                    readOnly
                    className="w-16 h-12 px-2 text-center text-lg rounded-lg border"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      backgroundColor: 'var(--color-paper)',
                      borderColor: 'var(--color-rule)',
                      color: 'var(--color-ink)',
                    }}
                  />
                </div>
              ))
            )}
          </div>
        </div>

        <div className="text-3xl font-bold" style={{ color: 'var(--color-muted)' }}>×</div>

        <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(140, 100, 215, 0.08)' }}>
          <p className="text-sm font-medium mb-2 text-center" style={{ color: 'var(--color-violet)' }}>Matrix B</p>
          <div className="grid grid-cols-2 gap-2">
            {problem.b.map((row, i) =>
              row.map((val, j) => (
                <div key={`b-${i}-${j}`}>
                  <input
                    type="number"
                    value={val}
                    readOnly
                    className="w-16 h-12 px-2 text-center text-lg rounded-lg border"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      backgroundColor: 'var(--color-paper)',
                      borderColor: 'var(--color-rule)',
                      color: 'var(--color-ink)',
                    }}
                  />
                </div>
              ))
            )}
          </div>
        </div>

        <div className="text-3xl font-bold" style={{ color: 'var(--color-muted)' }}>=</div>

        <div className="rounded-xl p-4 border-2" style={{ backgroundColor: 'rgba(75, 180, 140, 0.08)', borderColor: 'var(--color-emerald)' }}>
          <p className="text-sm font-medium mb-2 text-center" style={{ color: 'var(--color-emerald)' }}>Matrix C</p>
          <div className="grid grid-cols-2 gap-2">
            {problem.c.map((row, i) =>
              row.map((val, j) => {
                const isMissing = problem.missingPositions.some(p => p[0] === i && p[1] === j);
                return (
                  <div key={`c-${i}-${j}`}>
                    {isMissing ? (
                      <motion.input
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        type="number"
                        step="0.1"
                        placeholder="?"
                        value={userAnswer[`${i}-${j}`] || ''}
                        onChange={(e) => handleInputChange(i, j, e.target.value)}
                        className="w-16 h-12 px-2 text-center text-lg rounded-lg border-2 focus:outline-none"
                        style={{
                          fontFamily: 'var(--font-mono)',
                          backgroundColor: 'var(--color-paper)',
                          borderColor: 'var(--color-emerald)',
                          color: 'var(--color-ink)',
                        }}
                      />
                    ) : (
                      <div className="w-16 h-12 px-2 flex items-center justify-center text-lg rounded-lg border" style={{ fontFamily: 'var(--font-mono)', backgroundColor: 'rgba(75, 180, 140, 0.12)', color: 'var(--color-emerald)', borderColor: 'var(--color-emerald)' }}>
                        {val.toFixed(1)}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--color-paper-2)' }}>
        <p className="text-sm mb-2 text-center" style={{ color: 'var(--color-muted)' }}>
          Calculate each entry: C[i,j] = Σ(A[i,k] × B[k,j])
        </p>
        <div className="text-xs space-y-1" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-muted)' }}>
          <p>• C[0,0] = A[0,0]×B[0,0] + A[0,1]×B[1,0]</p>
          <p>• C[0,1] = A[0,0]×B[0,1] + A[0,1]×B[1,1]</p>
          <p>• C[1,0] = A[1,0]×B[0,0] + A[1,1]×B[1,0]</p>
          <p>• C[1,1] = A[1,0]×B[0,1] + A[1,1]×B[1,1]</p>
        </div>
      </div>

      {showResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border p-4"
          style={{ backgroundColor: 'var(--color-paper)', borderColor: 'var(--color-rule)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-bold text-lg" style={{ color: 'var(--color-ink)' }}>Your Answers</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold font-mono" style={{ color: 'var(--color-emerald)', fontFamily: 'var(--font-mono)' }}>+{calculateScore}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {problem.missingPositions.map(([row, col]) => {
              const userVal = userAnswer[`${row}-${col}`];
              const correctVal = problem.c[row][col];
              const isCorrect = userVal && Math.abs(parseFloat(userVal) - correctVal) < 0.1;
              return (
                <div
                  key={`result-${row}-${col}`}
                  className="p-2 rounded-lg text-center border"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    backgroundColor: isCorrect ? 'rgba(75, 180, 140, 0.08)' : 'rgba(175, 90, 65, 0.08)',
                    borderColor: isCorrect ? 'var(--color-emerald)' : 'var(--color-red)',
                    color: isCorrect ? 'var(--color-emerald)' : 'var(--color-red)',
                  }}
                >
                  <span style={{ fontFamily: 'var(--font-mono)' }}>
                    {userVal ? parseFloat(userVal).toFixed(1) : '?'}
                  </span>
                  <span className="text-xs ml-1">/ {correctVal.toFixed(1)}</span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      <div className="flex justify-center">
        <Button
          variant="primary"
          size="lg"
          onClick={handleSubmit}
          disabled={Object.keys(userAnswer).length < problem.missingPositions.length}
          className="px-8"
        >
          Submit Answers
        </Button>
      </div>
    </div>
  );
}