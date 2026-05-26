import { useState } from 'react';
import { CheckCircle, RotateCcw, Lightbulb } from 'lucide-react';

export default function MirrorIt({ onComplete, rounds = 5 }) {
  const [currentRound, setCurrentRound] = useState(0);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [completed, setCompleted] = useState(false);
  
  const generateRound = () => {
    const matrix = [
      [Math.round((Math.random() * 4 - 2) * 10) / 10, Math.round((Math.random() * 4 - 2) * 10) / 10],
      [Math.round((Math.random() * 4 - 2) * 10) / 10, Math.round((Math.random() * 4 - 2) * 10) / 10]
    ];
    return { matrix };
  };
  
  const [round] = useState(() => generateRound());
  const { matrix } = round;
  
  const transposeMatrix = [
    [matrix[0][0], matrix[1][0]],
    [matrix[0][1], matrix[1][1]]
  ];
  
  const [userAnswer, setUserAnswer] = useState([
    [null, null],
    [null, null]
  ]);
  
  const handleCellChange = (i, j, value) => {
    const newAnswer = [...userAnswer];
    newAnswer[i][j] = value;
    setUserAnswer(newAnswer);
  };
  
  const checkAnswer = () => {
    setAttempts(a => a + 1);
    const correct = userAnswer.every((row, i) => 
      row.every((val, j) => Math.abs(val - transposeMatrix[i][j]) < 0.01)
    );
    
    if (correct) {
      setScore(s => s + 1);
      if (currentRound < rounds - 1) {
        setTimeout(() => {
          setCurrentRound(c => c + 1);
          setUserAnswer([[null, null], [null, null]]);
          setShowHint(false);
        }, 1000);
      } else {
        setCompleted(true);
        onComplete?.({ score: score + 1, attempts: attempts + 1 });
      }
    }
  };
  
  const allFilled = userAnswer.every(row => row.every(v => v !== null));
  
  const diagonalIndices = [[0, 0], [1, 1]];
  
  if (completed) {
    return (
      <div className="text-center p-6">
        <div className="text-4xl mb-4">🎉</div>
        <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--color-ink)' }}>Module Complete!</h3>
        <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
          You got {score}/{rounds} correct with {attempts} total attempts.
        </p>
      </div>
    );
  }
  
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm font-medium" style={{ color: 'var(--color-ink)' }}>
          Round {currentRound + 1} of {rounds}
        </div>
        <div className="text-sm" style={{ color: 'var(--color-muted)' }}>
          Score: {score}
        </div>
      </div>
      
      <div className="flex items-center justify-center gap-6 mb-6">
        <div className="text-center">
          <div className="text-xs font-medium mb-2" style={{ color: 'var(--color-neutral)' }}>A</div>
          <div className="inline-grid gap-1 p-3 rounded-lg" style={{ backgroundColor: 'var(--color-paper)' }}>
            {matrix.map((row, i) => (
              <div key={i} className="flex gap-1">
                {row.map((val, j) => (
                  <div key={j} className="w-12 h-10 flex items-center justify-center text-sm font-bold rounded"
                    style={{ 
                      fontFamily: 'var(--font-mono)', 
                      color: 'var(--color-ink)',
                      backgroundColor: 'var(--color-paper-2)'
                    }}>
                    {val.toFixed(1)}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex flex-col items-center">
          <div className="text-3xl" style={{ color: 'var(--color-accent)' }}>→</div>
          <div className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>Mirror</div>
        </div>
        
        <div className="text-center">
          <div className="text-xs font-medium mb-2" style={{ color: 'var(--color-accent)' }}>A<sup>T</sup></div>
          <div className="inline-grid gap-1 p-3 rounded-lg" style={{ backgroundColor: 'var(--color-paper)' }}>
            {userAnswer.map((row, i) => (
              <div key={i} className="flex gap-1">
                {row.map((val, j) => {
                  const isDiagonal = diagonalIndices.some(([di, dj]) => di === i && dj === j);
                  return (
                    <input
                      key={j}
                      type="number"
                      step="0.1"
                      value={val ?? ''}
                      onChange={(e) => handleCellChange(i, j, parseFloat(e.target.value) || 0)}
                      disabled={isDiagonal}
                      className="w-12 h-10 text-center text-sm font-bold rounded border-2 transition-all"
                      style={{ 
                        fontFamily: 'var(--font-mono)',
                        color: isDiagonal ? 'oklch(65% 0.12 70)' : 'var(--color-accent)',
                        backgroundColor: isDiagonal ? 'oklch(65% 0.12 70 / 0.2)' : (val !== null ? 'var(--color-paper-2)' : 'var(--color-paper-2)'),
                        borderColor: val !== null ? (Math.abs(val - transposeMatrix[i][j]) < 0.01 ? 'oklch(52% 0.16 155)' : 'oklch(52% 0.16 25)') : 'transparent',
                        cursor: isDiagonal ? 'not-allowed' : 'text'
                      }}
                      placeholder={isDiagonal ? val?.toFixed(1) : '?'}
                    />
                  );
                })}
              </div>
            ))}
          </div>
          {diagonalIndices.map(([i, j]) => (
            <div key={`${i}-${j}`} className="text-xs mt-1" style={{ color: 'oklch(65% 0.12 70)' }}>
              Locked: {matrix[i][j].toFixed(1)}
            </div>
          ))}
        </div>
      </div>
      
      <div className="text-center text-sm mb-4 p-2 rounded-lg" style={{ backgroundColor: 'var(--color-paper-2)', color: 'var(--color-muted)' }}>
        Drag each entry to its correct transposed position. Diagonal entries are locked.
      </div>
      
      <div className="inline-block mb-4 p-3 rounded-lg mx-auto" style={{ backgroundColor: 'var(--color-paper-2)' }}>
        <div className="text-xs font-medium mb-2 text-center" style={{ color: 'var(--color-neutral)' }}>
          Hint: What goes where?
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-muted)' }}>
          <div>A[0][0] → A<sup>T</sup>[0][0]</div>
          <div>A[0][1] → A<sup>T</sup>[1][0]</div>
          <div>A[1][0] → A<sup>T</sup>[0][1]</div>
          <div>A[1][1] → A<sup>T</sup>[1][1]</div>
        </div>
      </div>
      
      {showHint && (
        <div className="p-3 rounded-lg mb-4 text-sm" style={{ backgroundColor: 'rgba(200, 155, 50, 0.08)', color: 'oklch(65% 0.10 70)' }}>
          💡 Hint: Transpose swaps rows and columns. Think of it like folding over the diagonal.
        </div>
      )}
      
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => setShowHint(!showHint)}
          className="p-2 rounded-lg transition-all"
          style={{ color: 'var(--color-muted)', backgroundColor: 'var(--color-paper-2)' }}
        >
          <Lightbulb className="w-4 h-4" />
        </button>
        <button
          onClick={checkAnswer}
          disabled={!allFilled}
          className="px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50"
          style={{ backgroundColor: allFilled ? 'var(--color-accent)' : 'var(--color-paper-2)', color: allFilled ? 'var(--color-paper)' : 'var(--color-muted)' }}
        >
          Check Answer
        </button>
        <button
          onClick={() => setUserAnswer([[null, null], [null, null]])}
          className="p-2 rounded-lg transition-all"
          style={{ color: 'var(--color-muted)', backgroundColor: 'var(--color-paper-2)' }}
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}