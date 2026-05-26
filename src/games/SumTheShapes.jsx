import { useState, useMemo } from 'react';
import { CheckCircle, XCircle, RotateCcw, Lightbulb } from 'lucide-react';

export default function SumTheShapes({ onComplete, rounds = 5 }) {
  const [currentRound, setCurrentRound] = useState(0);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [completed, setCompleted] = useState(false);
  
  const generateRound = () => {
    const baseA = [
      [Math.round((Math.random() * 2 - 1) * 10) / 10, Math.round((Math.random() * 2 - 1) * 10) / 10],
      [Math.round((Math.random() * 2 - 1) * 10) / 10, Math.round((Math.random() * 2 - 1) * 10) / 10]
    ];
    const baseB = [
      [Math.round((Math.random() * 2 - 1) * 10) / 10, Math.round((Math.random() * 2 - 1) * 10) / 10],
      [Math.round((Math.random() * 2 - 1) * 10) / 10, Math.round((Math.random() * 2 - 1) * 10) / 10]
    ];
    return { baseA, baseB };
  };
  
  const [round] = useState(() => generateRound());
  const { baseA, baseB } = round;
  
  const resultMatrix = useMemo(() => [
    [baseA[0][0] + baseB[0][0], baseA[0][1] + baseB[0][1]],
    [baseA[1][0] + baseB[1][0], baseA[1][1] + baseB[1][1]]
  ], [baseA, baseB]);
  
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
      row.every((val, j) => Math.abs(val - resultMatrix[i][j]) < 0.01)
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
  const allCorrect = userAnswer.every((row, i) => 
    row.every((val, j) => Math.abs(val - resultMatrix[i][j]) < 0.01)
  );
  
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
      
      <div className="flex items-center justify-center gap-8 mb-6">
        <div className="text-center">
          <div className="text-xs font-medium mb-2" style={{ color: 'oklch(52% 0.16 25)' }}>Matrix A</div>
          <div className="inline-grid gap-1 p-2 rounded-lg" style={{ backgroundColor: 'var(--color-paper)' }}>
            {baseA.map((row, i) => (
              <div key={i} className="flex gap-1">
                {row.map((val, j) => (
                  <div key={j} className="w-12 h-8 flex items-center justify-center text-sm font-bold rounded"
                    style={{ fontFamily: 'var(--font-mono)', color: j === 0 ? 'oklch(52% 0.16 25)' : 'oklch(52% 0.16 155)', backgroundColor: 'var(--color-paper-2)' }}>
                    {val.toFixed(1)}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
        
        <div className="text-2xl font-bold" style={{ color: 'var(--color-muted)' }}>+</div>
        
        <div className="text-center">
          <div className="text-xs font-medium mb-2" style={{ color: 'oklch(52% 0.16 155)' }}>Matrix B</div>
          <div className="inline-grid gap-1 p-2 rounded-lg" style={{ backgroundColor: 'var(--color-paper)' }}>
            {baseB.map((row, i) => (
              <div key={i} className="flex gap-1">
                {row.map((val, j) => (
                  <div key={j} className="w-12 h-8 flex items-center justify-center text-sm font-bold rounded"
                    style={{ fontFamily: 'var(--font-mono)', color: j === 0 ? 'oklch(52% 0.16 25)' : 'oklch(52% 0.16 155)', backgroundColor: 'var(--color-paper-2)' }}>
                    {val.toFixed(1)}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
        
        <div className="text-2xl font-bold" style={{ color: 'var(--color-muted)' }}>=</div>
        
        <div className="text-center">
          <div className="text-xs font-medium mb-2" style={{ color: 'var(--color-accent)' }}>A + B = ?</div>
          <div className="inline-grid gap-1 p-2 rounded-lg" style={{ backgroundColor: 'var(--color-paper)' }}>
            {userAnswer.map((row, i) => (
              <div key={i} className="flex gap-1">
                {row.map((val, j) => (
                  <input
                    key={j}
                    type="number"
                    step="0.1"
                    value={val ?? ''}
                    onChange={(e) => handleCellChange(i, j, parseFloat(e.target.value) || 0)}
                    className="w-12 h-8 text-center text-sm font-bold rounded border-2 transition-all"
                    style={{ 
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--color-accent)',
                      backgroundColor: 'var(--color-paper-2)',
                      borderColor: val !== null ? (Math.abs(val - resultMatrix[i][j]) < 0.01 ? 'oklch(52% 0.16 155)' : 'oklch(52% 0.16 25)') : 'transparent'
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {showHint && (
        <div className="p-3 rounded-lg mb-4 text-sm" style={{ backgroundColor: 'rgba(200, 155, 50, 0.08)', color: 'oklch(65% 0.10 70)' }}>
          💡 Hint: Add element by element. c₁₁ = a₁₁ + b₁₁, c₁₂ = a₁₂ + b₁₂, etc.
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