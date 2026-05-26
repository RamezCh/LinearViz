import { useState, useMemo } from 'react';
import { RotateCcw, Lightbulb, Eye, EyeOff } from 'lucide-react';

export default function UndoTheTransform({ onComplete, rounds = 5 }) {
  const [currentRound, setCurrentRound] = useState(0);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [hints, setHints] = useState({ det: false, adjugate: false });
  const [completed, setCompleted] = useState(false);
  
  const generateRound = () => {
    const baseA = [
      [Math.round((Math.random() * 3 + 0.5) * 10) / 10, Math.round((Math.random() * 2 - 1) * 10) / 10],
      [Math.round((Math.random() * 2 - 1) * 10) / 10, Math.round((Math.random() * 3 + 0.5) * 10) / 10]
    ];
    return { baseA };
  };
  
  const [round] = useState(() => generateRound());
  const { baseA } = round;
  
  const detA = baseA[0][0] * baseA[1][1] - baseA[0][1] * baseA[1][0];
  
  const inverseMatrix = useMemo(() => {
    if (detA === 0) return null;
    return [
      [baseA[1][1] / detA, -baseA[0][1] / detA],
      [-baseA[1][0] / detA, baseA[0][0] / detA]
    ];
  }, [baseA, detA]);
  
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
    if (!inverseMatrix) return;
    setAttempts(a => a + 1);
    const correct = userAnswer.every((row, i) => 
      row.every((val, j) => Math.abs(val - inverseMatrix[i][j]) < 0.01)
    );
    
    if (correct) {
      const hintPenalty = hints.det ? -1 : 0 + (hints.adjugate ? -1 : 0);
      setScore(s => s + Math.max(0, 2 + hintPenalty));
      if (currentRound < rounds - 1) {
        setTimeout(() => {
          setCurrentRound(c => c + 1);
          setUserAnswer([[null, null], [null, null]]);
          setHints({ det: false, adjugate: false });
        }, 1000);
      } else {
        setCompleted(true);
        onComplete?.({ score: score + Math.max(0, 2 + hints.det ? -1 : 0), attempts: attempts + 1 });
      }
    }
  };
  
  const allFilled = userAnswer.every(row => row.every(v => v !== null));
  
  const revealHint = (type) => {
    setHints(h => ({ ...h, [type]: true }));
  };
  
  if (completed) {
    return (
      <div className="text-center p-6">
        <div className="text-4xl mb-4">🎉</div>
        <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--color-ink)' }}>Module Complete!</h3>
        <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
          You got {score}/{rounds * 2} points with {attempts} total attempts.
        </p>
        <p className="text-xs mt-2" style={{ color: 'var(--color-muted)' }}>
          Full marks for no hints, partial for hints.
        </p>
      </div>
    );
  }
  
  if (detA === 0) {
    return (
      <div className="p-4 text-center">
        <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(220, 75, 55, 0.1)' }}>
          <span className="text-lg font-bold" style={{ color: 'oklch(52% 0.16 25)' }}>
            det = 0 — No inverse exists!
          </span>
          <p className="text-sm mt-2" style={{ color: 'var(--color-muted)' }}>
            This transformation destroys information. Skip this round.
          </p>
          <button
            onClick={() => {
              if (currentRound < rounds - 1) {
                setCurrentRound(c => c + 1);
              } else {
                setCompleted(true);
                onComplete?.({ score, attempts });
              }
            }}
            className="mt-4 px-4 py-2 rounded-lg font-medium"
            style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-paper)' }}
          >
            Next Round
          </button>
        </div>
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
      
      <div className="flex items-center justify-center gap-6 mb-4">
        <div className="text-center">
          <div className="text-xs font-medium mb-2" style={{ color: 'var(--color-neutral)' }}>Original A</div>
          <div className="inline-grid gap-1 p-3 rounded-lg" style={{ backgroundColor: 'var(--color-paper)' }}>
            {baseA.map((row, i) => (
              <div key={i} className="flex gap-1">
                {row.map((val, j) => (
                  <div key={j} className="w-12 h-10 flex items-center justify-center text-sm font-bold rounded"
                    style={{ fontFamily: 'var(--font-mono)', color: j === 0 ? 'oklch(52% 0.16 25)' : 'oklch(52% 0.16 155)', backgroundColor: 'var(--color-paper-2)' }}>
                    {val.toFixed(1)}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex flex-col items-center">
          <div className="text-3xl" style={{ color: 'var(--color-accent)' }}>→</div>
          <div className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>Find A⁻¹</div>
        </div>
        
        <div className="text-center">
          <div className="text-xs font-medium mb-2" style={{ color: 'var(--color-accent)' }}>A⁻¹ = ?</div>
          <div className="inline-grid gap-1 p-3 rounded-lg" style={{ backgroundColor: 'var(--color-paper)' }}>
            {userAnswer.map((row, i) => (
              <div key={i} className="flex gap-1">
                {row.map((val, j) => (
                  <div
                    key={j}
                    className="w-12 h-10 flex items-center justify-center text-sm font-bold rounded border-2 transition-all"
                    style={{ 
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--color-accent)',
                      backgroundColor: 'var(--color-paper-2)',
                      borderColor: val !== null ? (inverseMatrix && Math.abs(val - inverseMatrix[i][j]) < 0.01 ? 'oklch(52% 0.16 155)' : 'oklch(52% 0.16 25)') : 'transparent'
                    }}
                  >
                    {val !== null ? val.toFixed(2) : '?'}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="text-center text-sm mb-4 p-2 rounded-lg" style={{ backgroundColor: 'var(--color-paper-2)', color: 'var(--color-muted)' }}>
        The shape has been transformed by mystery matrix A. Enter A⁻¹ to restore it.
      </div>
      
      <div className="space-y-2 mb-4">
        <button
          onClick={() => revealHint('det')}
          disabled={hints.det}
          className="w-full p-2 rounded-lg text-left transition-all flex items-center justify-between"
          style={{ 
            backgroundColor: hints.det ? 'rgba(200, 155, 50, 0.1)' : 'var(--color-paper-2)',
            color: hints.det ? 'var(--color-ink)' : 'var(--color-muted)'
          }}
        >
          <span className="text-sm">Hint 1: Show det(A)</span>
          {hints.det ? (
            <span className="font-mono font-bold" style={{ color: 'oklch(65% 0.10 70)' }}>det = {detA.toFixed(2)}</span>
          ) : (
            <Eye className="w-4 h-4" />
          )}
        </button>
        
        <button
          onClick={() => revealHint('adjugate')}
          disabled={hints.adjugate}
          className="w-full p-2 rounded-lg text-left transition-all flex items-center justify-between"
          style={{ 
            backgroundColor: hints.adjugate ? 'rgba(200, 155, 50, 0.1)' : 'var(--color-paper-2)',
            color: hints.adjugate ? 'var(--color-ink)' : 'var(--color-muted)'
          }}
        >
          <span className="text-sm">Hint 2: Show adjugate formula</span>
          {hints.adjugate ? (
            <div className="font-mono text-xs" style={{ color: 'oklch(65% 0.10 70)' }}>
              A⁻¹ = (1/det) × [d, -b; -c, a]
            </div>
          ) : (
            <Eye className="w-4 h-4" />
          )}
        </button>
      </div>
      
      <div className="inline-block mb-4 p-3 rounded-lg mx-auto" style={{ backgroundColor: 'var(--color-paper-2)' }}>
        <div className="text-xs font-medium mb-2 text-center" style={{ color: 'var(--color-neutral)' }}>
          Formula (2×2 Inverse):
        </div>
        <div className="text-sm text-center" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-ink)' }}>
          <div>If A = [a b; c d]</div>
          <div style={{ color: 'var(--color-accent)' }}>A⁻¹ = (1/det) × [d -b; -c a]</div>
          <div className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>det = a×d - b×c</div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2 mb-4">
        {[['a', baseA[0][0]], ['b', baseA[0][1]], ['c', baseA[1][0]], ['d', baseA[1][1]]].map(([label, val]) => (
          <div key={label} className="p-2 rounded-lg text-center" style={{ backgroundColor: 'var(--color-paper)' }}>
            <span className="text-xs" style={{ color: 'var(--color-muted)' }}>{label} = </span>
            <span className="font-mono font-bold" style={{ color: 'var(--color-ink)' }}>{val.toFixed(1)}</span>
          </div>
        ))}
      </div>
      
      <div className="inline-grid gap-2 mb-4 p-3 rounded-lg mx-auto" style={{ backgroundColor: 'var(--color-paper-2)', gridTemplateColumns: 'repeat(2, 1fr)' }}>
        {inverseMatrix && [[0,0], [0,1], [1,0], [1,1]].map(([i, j]) => (
          <div key={`${i}-${j}`} className="text-center">
            <input
              type="number"
              step="0.01"
              value={userAnswer[i][j] ?? ''}
              onChange={(e) => handleCellChange(i, j, parseFloat(e.target.value) || 0)}
              className="w-20 h-10 text-center text-sm font-bold rounded border-2 transition-all"
              style={{ 
                fontFamily: 'var(--font-mono)',
                color: 'var(--color-accent)',
                backgroundColor: 'var(--color-paper)',
                borderColor: userAnswer[i][j] !== null ? (inverseMatrix && Math.abs(userAnswer[i][j] - inverseMatrix[i][j]) < 0.01 ? 'oklch(52% 0.16 155)' : 'oklch(52% 0.16 25)') : 'var(--color-rule)'
              }}
              placeholder={`${inverseMatrix[i][j].toFixed(2)}`}
            />
            <div className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
              [{i === 0 ? (j === 0 ? 'd' : '-b') : (j === 0 ? '-c' : 'a')}]/det
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => setUserAnswer([[null, null], [null, null]])}
          className="p-2 rounded-lg transition-all"
          style={{ color: 'var(--color-muted)', backgroundColor: 'var(--color-paper-2)' }}
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <button
          onClick={checkAnswer}
          disabled={!allFilled}
          className="px-6 py-2 rounded-lg font-medium transition-all disabled:opacity-50"
          style={{ backgroundColor: allFilled ? 'var(--color-accent)' : 'var(--color-paper-2)', color: allFilled ? 'var(--color-paper)' : 'var(--color-muted)' }}
        >
          Restore Shape
        </button>
      </div>
    </div>
  );
}