import { useState, useMemo } from 'react';
import { CheckCircle, RotateCcw, Lightbulb, Play } from 'lucide-react';

export default function MultiplicationRelay({ onComplete, rounds = 5 }) {
  const [currentRound, setCurrentRound] = useState(0);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [currentCell, setCurrentCell] = useState(0);
  const [animating, setAnimating] = useState(false);
  
  const generateRound = () => {
    const baseA = [
      [Math.round((Math.random() * 2) * 10) / 10, Math.round((Math.random() * 2 - 1) * 10) / 10],
      [Math.round((Math.random() * 2 - 1) * 10) / 10, Math.round((Math.random() * 2) * 10) / 10]
    ];
    const baseB = [
      [Math.round((Math.random() * 2 - 1) * 10) / 10, Math.round((Math.random() * 2) * 10) / 10],
      [Math.round((Math.random() * 2) * 10) / 10, Math.round((Math.random() * 2 - 1) * 10) / 10]
    ];
    return { baseA, baseB };
  };
  
  const [round] = useState(() => generateRound());
  const { baseA, baseB } = round;
  
  const resultMatrix = useMemo(() => [
    [
      baseA[0][0] * baseB[0][0] + baseA[0][1] * baseB[1][0],
      baseA[0][0] * baseB[0][1] + baseA[0][1] * baseB[1][1]
    ],
    [
      baseA[1][0] * baseB[0][0] + baseA[1][1] * baseB[1][0],
      baseA[1][0] * baseB[0][1] + baseA[1][1] * baseB[1][1]
    ]
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
          setCurrentCell(0);
        }, 1000);
      } else {
        setCompleted(true);
        onComplete?.({ score: score + 1, attempts: attempts + 1 });
      }
    }
  };
  
  const allFilled = userAnswer.every(row => row.every(v => v !== null));
  
  const cellFormula = (i, j) => {
    const a1 = baseA[i][0], a2 = baseA[i][1];
    const b1 = baseB[0][j], b2 = baseB[1][j];
    return `${a1.toFixed(1)}×${b1.toFixed(1)} + ${a2.toFixed(1)}×${b2.toFixed(1)} = ${(a1 * b1 + a2 * b2).toFixed(2)}`;
  };
  
  const playAnimation = () => {
    setAnimating(true);
    let cell = 0;
    const interval = setInterval(() => {
      if (cell >= 4) {
        clearInterval(interval);
        setAnimating(false);
        setCurrentCell(0);
      } else {
        setCurrentCell(cell + 1);
        cell++;
      }
    }, 800);
  };
  
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
        <div className="flex items-center gap-2">
          <div className="text-sm" style={{ color: 'var(--color-muted)' }}>Score: {score}</div>
          <button
            onClick={playAnimation}
            className="p-2 rounded-lg transition-all"
            style={{ backgroundColor: 'var(--color-paper-2)', color: 'var(--color-accent)' }}
          >
            <Play className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="flex items-center justify-center gap-4 mb-6">
        <div className="text-center">
          <div className="text-xs font-medium mb-2" style={{ color: 'var(--color-neutral)' }}>A</div>
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
        
        <div className="text-2xl font-bold" style={{ color: 'var(--color-muted)' }}>×</div>
        
        <div className="text-center">
          <div className="text-xs font-medium mb-2" style={{ color: 'var(--color-neutral)' }}>B</div>
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
          <div className="text-xs font-medium mb-2" style={{ color: 'var(--color-accent)' }}>C = A × B</div>
          <div className="inline-grid gap-1 p-2 rounded-lg" style={{ backgroundColor: 'var(--color-paper)' }}>
            {userAnswer.map((row, i) => (
              <div key={i} className="flex gap-1">
                {row.map((val, j) => {
                  const cellIndex = i * 2 + j;
                  const isAnimating = animating && currentCell > cellIndex;
                  const isCurrent = animating && currentCell === cellIndex;
                  return (
                    <div
                      key={j}
                      className="w-12 h-8 flex items-center justify-center text-sm font-bold rounded transition-all"
                      style={{ 
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--color-accent)',
                        backgroundColor: isAnimating ? 'rgba(75, 150, 200, 0.3)' : 'var(--color-paper-2)',
                        border: isCurrent ? '2px solid var(--color-accent)' : 'none',
                        transform: isCurrent ? 'scale(1.1)' : 'scale(1)'
                      }}
                    >
                      {isAnimating ? resultMatrix[i][j].toFixed(1) : '?'}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="text-center text-xs mb-4" style={{ color: 'var(--color-muted)' }}>
        Click any cell to enter your answer. Use hint for formula.
      </div>
      
      <div className="inline-grid gap-2 mb-4 p-3 rounded-lg mx-auto" style={{ backgroundColor: 'var(--color-paper-2)', gridTemplateColumns: 'repeat(2, 1fr)' }}>
        {[[0,0], [0,1], [1,0], [1,1]].map(([i, j]) => (
          <div 
            key={`${i}-${j}`}
            className="p-2 rounded-lg text-center cursor-pointer transition-all"
            style={{
              backgroundColor: userAnswer[i][j] !== null ? (Math.abs(userAnswer[i][j] - resultMatrix[i][j]) < 0.01 ? 'oklch(52% 0.16 155 / 0.15)' : 'oklch(52% 0.16 25 / 0.15)') : 'var(--color-paper)',
              color: 'var(--color-ink)',
              border: userAnswer[i][j] !== null ? `2px solid ${Math.abs(userAnswer[i][j] - resultMatrix[i][j]) < 0.01 ? 'oklch(52% 0.16 155)' : 'oklch(52% 0.16 25)'}` : '2px solid transparent'
            }}
          >
            <div className="text-xs font-mono mb-1">c{i+1}{j+1}</div>
            <input
              type="number"
              step="0.1"
              value={userAnswer[i][j] ?? ''}
              onChange={(e) => handleCellChange(i, j, parseFloat(e.target.value) || 0)}
              className="w-16 h-8 text-center text-sm font-bold rounded border-2 transition-all"
              style={{ 
                fontFamily: 'var(--font-mono)',
                color: 'var(--color-accent)',
                backgroundColor: 'var(--color-paper-2)',
                borderColor: userAnswer[i][j] !== null ? ACCENT_COLOR : 'transparent'
              }}
            />
            {showHint && (
              <div className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
                = {cellFormula(i, j)}
              </div>
            )}
          </div>
        ))}
      </div>
      
      {showHint && (
        <div className="p-3 rounded-lg mb-4 text-sm" style={{ backgroundColor: 'rgba(200, 155, 50, 0.08)', color: 'oklch(65% 0.10 70)' }}>
          💡 Hint: cᵢⱼ = row i of A · column j of B (dot product)
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