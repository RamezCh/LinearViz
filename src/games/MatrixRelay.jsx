import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { multiply } from '../utils/linalg.js';

function generateMatrices(difficulty) {
  const matrices = [
    [[[1, 0], [0, 1]], [[1, 1], [0, 1]]],
    [[[2, 1], [1, 1]], [[1, 2], [0, 1]]],
    [[[1, -1], [2, 1]], [[1, 1], [-1, 2]]],
    [[[0, 1], [1, 0]], [[2, 0], [0, 2]]],
    [[[1, 2], [3, 4]], [[0, 1], [1, 0]]],
    [[[2, 0], [0, 2]], [[1, 1], [1, -1]]],
  ];

  const idx = Math.min(difficulty, matrices.length - 1);
  return matrices[idx];
}

export default function MatrixRelay({
  onSubmit,
  attempts,
  maxAttempts,
  score,
  gameState,
  setGameState,
  difficulty = 0,
}) {
  const [matrixA, setMatrixA] = useState([[1, 0], [0, 1]]);
  const [matrixB, setMatrixB] = useState([[1, 0], [0, 1]]);
  const [resultMatrix, setResultMatrix] = useState([[0, 0], [0, 0]]);
  const [userAnswers, setUserAnswers] = useState([[null, null], [null, null]]);
  const [selectedCell, setSelectedCell] = useState({ row: 0, col: 0 });
  const [showFeedback, setShowFeedback] = useState(false);
  const [cellFeedback, setCellFeedback] = useState({});
  const [round, setRound] = useState(1);
  const [totalScore, setTotalScore] = useState(0);
  const [roundAttempts, setRoundAttempts] = useState(0);

  const totalRounds = 5;
  const inputRef = useRef(null);

  const initializeRound = useCallback(() => {
    const [A, B] = generateMatrices(difficulty + Math.floor(round / 2));
    setMatrixA(A);
    setMatrixB(B);
    setResultMatrix(multiply(A, B));
    setUserAnswers([[null, null], [null, null]]);
    setSelectedCell({ row: 0, col: 0 });
    setShowFeedback(false);
    setCellFeedback({});
    setRoundAttempts(0);
  }, [difficulty, round]);

  useEffect(() => {
    initializeRound();
  }, []);

  useEffect(() => {
    if (selectedCell && inputRef.current) {
      inputRef.current.focus();
    }
  }, [selectedCell]);

  const isRoundComplete = useMemo(() => {
    return userAnswers.every(row => row.every(val => val !== null));
  }, [userAnswers]);

  const roundScore = useMemo(() => {
    if (!isRoundComplete) return 0;
    let correct = 0;
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 2; j++) {
        if (Math.abs(userAnswers[i][j] - resultMatrix[i][j]) < 0.001) {
          correct++;
        }
      }
    }
    return correct * 25;
  }, [userAnswers, resultMatrix, isRoundComplete]);

  const getRow = (i) => matrixA[i];
  const getCol = (j) => [matrixB[0][j], matrixB[1][j]];

  const handleSubmit = () => {
    if (!isRoundComplete) return;

    setShowFeedback(true);
    const newFeedback = {};
    let allCorrect = true;

    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 2; j++) {
        const correct = Math.abs(userAnswers[i][j] - resultMatrix[i][j]) < 0.001;
        newFeedback[`${i}-${j}`] = correct ? 'correct' : 'wrong';
        if (!correct) allCorrect = false;
      }
    }
    setCellFeedback(newFeedback);

    const penalty = Math.max(0, (roundAttempts - 1) * 10);
    const points = allCorrect ? Math.max(0, 100 - penalty) : 0;
    setTotalScore(prev => prev + points);

    setTimeout(() => {
      onSubmit(points);
      if (round < totalRounds) {
        setRound(r => r + 1);
        initializeRound();
      }
    }, allCorrect ? 1500 : 2000);
  };

  const handleCellSelect = (i, j) => {
    setSelectedCell({ row: i, col: j });
    setCellFeedback({});
  };

  const handleInputChange = (value) => {
    const parsed = parseFloat(value);
    if (isNaN(parsed)) return;

    const newAnswers = userAnswers.map(row => [...row]);
    newAnswers[selectedCell.row][selectedCell.col] = parsed;
    setUserAnswers(newAnswers);
    setRoundAttempts(prev => prev + 1);

    const correct = Math.abs(parsed - resultMatrix[selectedCell.row][selectedCell.col]) < 0.001;
    setCellFeedback(prev => ({
      ...prev,
      [`${selectedCell.row}-${selectedCell.col}`]: correct ? 'correct' : 'pending'
    }));

    if (correct) {
      const nextRow = selectedCell.row;
      const nextCol = (selectedCell.col + 1) % 2;
      const nextRowActual = nextCol === 0 && selectedCell.row < 1 ? selectedCell.row + 1 : selectedCell.row;
      const nextColActual = nextCol === 0 && selectedCell.row === 1 ? 0 : nextCol;

      if (nextRowActual < 2) {
        setSelectedCell({ row: nextRowActual, col: nextColActual });
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      const nextRow = selectedCell.row;
      const nextCol = (selectedCell.col + 1) % 2;
      const nextRowActual = nextCol === 0 && selectedCell.row < 1 ? selectedCell.row + 1 : selectedCell.row;
      const nextColActual = nextCol === 0 && selectedCell.row === 1 ? 0 : nextCol;

      if (nextRowActual < 2) {
        setSelectedCell({ row: nextRowActual, col: nextColActual });
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--color-paper)' }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="font-semibold" style={{ color: 'var(--color-ink)' }}>
              Matrix Multiplication
            </h4>
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
              Compute C = A × B, one cell at a time
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs" style={{ color: 'var(--color-muted)' }}>Round {round}/{totalRounds}</p>
            <p className="text-lg font-bold font-mono" style={{ color: 'var(--color-accent)' }}>
              Score: {totalScore}
            </p>
          </div>
        </div>

        <div className="flex justify-center gap-2 mb-2">
          {userAnswers.map((row, i) =>
            row.map((val, j) => (
              <motion.div
                key={`indicator-${i}-${j}`}
                className="w-16 h-16 rounded-xl flex items-center justify-center font-mono text-lg font-bold"
                style={{
                  backgroundColor: cellFeedback[`${i}-${j}`] === 'correct'
                    ? 'rgba(16,185,129,0.2)'
                    : cellFeedback[`${i}-${j}`] === 'wrong'
                      ? 'rgba(239,68,68,0.2)'
                      : selectedCell.row === i && selectedCell.col === j
                        ? 'rgba(139,92,246,0.2)'
                        : 'var(--color-paper-2)',
                  color: cellFeedback[`${i}-${j}`] === 'correct'
                    ? '#10b981'
                    : cellFeedback[`${i}-${j}`] === 'wrong'
                      ? '#ef4444'
                      : selectedCell.row === i && selectedCell.col === j
                        ? '#8b5cf6'
                        : 'var(--color-ink)',
                  border: `2px solid ${
                    cellFeedback[`${i}-${j}`] === 'correct'
                      ? '#10b981'
                      : cellFeedback[`${i}-${j}`] === 'wrong'
                        ? '#ef4444'
                        : selectedCell.row === i && selectedCell.col === j
                          ? '#8b5cf6'
                          : 'var(--color-rule)'
                  }`,
                }}
                onClick={() => handleCellSelect(i, j)}
                whileTap={{ scale: 0.95 }}
              >
                {val !== null ? val.toFixed(0) : '?'}
              </motion.div>
            ))
          )}
        </div>

        {isRoundComplete && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-2 rounded-lg"
            style={{
              backgroundColor: roundScore >= 75
                ? 'rgba(16,185,129,0.1)'
                : 'rgba(245,158,11,0.1)',
            }}
          >
            <span className="font-semibold" style={{
              color: roundScore >= 75 ? '#10b981' : '#f59e0b'
            }}>
              {roundScore >= 75 ? 'All correct!' : 'Check for errors'}
            </span>
          </motion.div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl p-3" style={{ backgroundColor: 'var(--color-paper)' }}>
          <h4 className="font-semibold mb-2 text-center text-xs" style={{ color: '#4A90E2' }}>Matrix A</h4>
          <div className="grid grid-cols-2 gap-1">
            {matrixA.map((row, i) =>
              row.map((val, j) => (
                <div
                  key={`a-${i}-${j}`}
                  className="text-center py-2 rounded-lg font-mono font-semibold"
                  style={{ backgroundColor: 'var(--color-paper-2)', color: 'var(--color-ink)' }}
                >
                  {val}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl p-3 flex flex-col items-center justify-center" style={{ backgroundColor: 'var(--color-paper)' }}>
          <span className="text-2xl font-bold" style={{ color: 'var(--color-accent)' }}>×</span>
          <div className="text-xs mt-2" style={{ color: 'var(--color-muted)' }}>
            C = A × B
          </div>
        </div>

        <div className="rounded-xl p-3" style={{ backgroundColor: 'var(--color-paper)' }}>
          <h4 className="font-semibold mb-2 text-center text-xs" style={{ color: '#7ED321' }}>Matrix B</h4>
          <div className="grid grid-cols-2 gap-1">
            {matrixB.map((row, i) =>
              row.map((val, j) => (
                <div
                  key={`b-${i}-${j}`}
                  className="text-center py-2 rounded-lg font-mono font-semibold"
                  style={{ backgroundColor: 'var(--color-paper-2)', color: 'var(--color-ink)' }}
                >
                  {val}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--color-paper-2)' }}>
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1">
            <p className="text-xs mb-1" style={{ color: 'var(--color-muted)' }}>
              Selected: C[{selectedCell.row}][{selectedCell.col}]
            </p>
            <div className="flex gap-2 items-center">
              <div className="px-3 py-1.5 rounded-lg text-sm font-mono" style={{ backgroundColor: '#4A90E2', color: 'white' }}>
                Row {selectedCell.row} of A: [{getRow(selectedCell.row).join(', ')}]
              </div>
              <span className="text-lg font-bold">·</span>
              <div className="px-3 py-1.5 rounded-lg text-sm font-mono" style={{ backgroundColor: '#7ED321', color: 'white' }}>
                Col {selectedCell.col} of B: [{getCol(selectedCell.col).join(', ')}]
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm mb-2" style={{ color: 'var(--color-muted)' }}>
            C[{selectedCell.row}][{selectedCell.col}] = dot product =
          </p>
          <div className="inline-flex items-center gap-2">
            {getRow(selectedCell.row).map((val, i) => (
              <span key={i} className="text-lg font-mono font-semibold" style={{ color: '#4A90E2' }}>
                {val}
              </span>
            ))}
            <span className="text-lg">×</span>
            {getCol(selectedCell.col).map((val, i) => (
              <span key={i} className="text-lg font-mono font-semibold" style={{ color: '#7ED321' }}>
                {val}
              </span>
            ))}
            <span className="text-lg">=</span>
            <input
              ref={inputRef}
              type="number"
              step="1"
              className="w-20 px-3 py-2 text-center text-xl font-mono font-bold rounded-xl outline-none"
              style={{
                backgroundColor: 'var(--color-paper)',
                border: '2px solid var(--color-accent)',
                color: 'var(--color-ink)',
              }}
              value={userAnswers[selectedCell.row][selectedCell.col] ?? ''}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="?"
            />
          </div>
        </div>

        <div className="mt-3 text-center text-xs" style={{ color: 'var(--color-muted)' }}>
          {getRow(selectedCell.row)[0]}×{getCol(selectedCell.col)[0]} + {getRow(selectedCell.row)[1]}×{getCol(selectedCell.col)[1]} = ?
        </div>
      </div>

      {showFeedback && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl p-4"
          style={{
            backgroundColor: roundScore >= 75 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
            border: '1px solid var(--color-rule)'
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-lg" style={{
                color: roundScore >= 75 ? '#10b981' : '#ef4444'
              }}>
                {roundScore >= 75 ? 'Correct!' : 'Check your answers'}
              </p>
              <div className="grid grid-cols-2 gap-2 mt-2 text-sm font-mono">
                <div style={{ color: 'var(--color-ink)' }}>
                  Your C[0][0]: {userAnswers[0][0]?.toFixed(0) || '?'}
                  {cellFeedback['0-0'] === 'wrong' && <span className="ml-1" style={{ color: '#ef4444' }}>✗</span>}
                </div>
                <div style={{ color: 'var(--color-ink)' }}>
                  Your C[0][1]: {userAnswers[0][1]?.toFixed(0) || '?'}
                  {cellFeedback['0-1'] === 'wrong' && <span className="ml-1" style={{ color: '#ef4444' }}>✗</span>}
                </div>
                <div style={{ color: 'var(--color-ink)' }}>
                  Your C[1][0]: {userAnswers[1][0]?.toFixed(0) || '?'}
                  {cellFeedback['1-0'] === 'wrong' && <span className="ml-1" style={{ color: '#ef4444' }}>✗</span>}
                </div>
                <div style={{ color: 'var(--color-ink)' }}>
                  Your C[1][1]: {userAnswers[1][1]?.toFixed(0) || '?'}
                  {cellFeedback['1-1'] === 'wrong' && <span className="ml-1" style={{ color: '#ef4444' }}>✗</span>}
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-3xl font-bold font-mono" style={{ color: roundScore >= 75 ? '#10b981' : '#ef4444' }}>
                +{roundScore}
              </span>
            </div>
          </div>
        </motion.div>
      )}

      <div className="flex justify-center">
        <button
          onClick={handleSubmit}
          disabled={!isRoundComplete || showFeedback}
          className="px-8 py-3 text-sm font-semibold rounded-xl transition-all"
          style={{
            backgroundColor: !isRoundComplete ? 'var(--color-rule)' : showFeedback ? 'var(--color-rule)' : 'var(--color-accent)',
            color: 'var(--color-paper)',
            cursor: !isRoundComplete || showFeedback ? 'not-allowed' : 'pointer',
          }}
        >
          {isRoundComplete ? 'Submit' : 'Fill all cells'}
        </button>
      </div>
    </div>
  );
}