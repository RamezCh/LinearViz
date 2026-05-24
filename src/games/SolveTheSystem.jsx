import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../components/UI/Button.jsx';
import CanvasWrapper from '../components/Canvas/CanvasWrapper.jsx';
import Grid2D from '../components/Canvas/Grid2D.jsx';

const PROBLEMS = [
  {
    wordProblem: "A farmer has chickens and cows. The total number of animals is 30, and they have 74 legs in total. How many chickens and cows are there?",
    equations: "x + y = 30; 2x + 4y = 74",
    solution: [22, 8],
    options: [[22, 8], [18, 12], [20, 10], [24, 6]],
    hint: "Let x = chickens, y = cows. Each chicken has 2 legs, each cow has 4 legs.",
  },
  {
    wordProblem: "A movie theater sells adult tickets for $12 and child tickets for $8. If they sold 45 tickets and earned $460, how many of each type were sold?",
    equations: "x + y = 45; 12x + 8y = 460",
    solution: [25, 20],
    options: [[25, 20], [20, 25], [30, 15], [15, 30]],
    hint: "Let x = adults, y = children. Total tickets and total revenue.",
  },
  {
    wordProblem: "A company produces two products A and B. Each unit of A requires 2 hours of labor and 3 kg of materials. Each unit of B requires 3 hours of labor and 2 kg of materials. With 50 labor hours and 45 kg of materials available, how many units of each can be produced?",
    equations: "2x + 3y ≤ 50; 3x + 2y ≤ 45",
    solution: [10, 10],
    options: [[10, 10], [12, 8], [8, 12], [15, 5]],
    hint: "Let x = product A, y = product B. Check if both constraints are satisfied.",
  },
  {
    wordProblem: "A boat travels downstream in 2 hours and upstream in 3 hours. If the river flows at 2 mph and the boat's speed in still water is constant, find the distance downstream.",
    equations: "(v+2)×2 = (v-2)×3; 2(v+2) = distance",
    solution: [24],
    options: [[24], [20], [28], [18]],
    hint: "Let v = boat speed in still water. Downstream speed = v+2, upstream = v-2.",
  },
];

function rowReduce([a1, b1, c1], [a2, b2, c2]) {
  const det = a1 * b2 - a2 * b1;
  if (Math.abs(det) < 1e-10) return null;

  const x = (c1 * b2 - c2 * b1) / det;
  const y = (a1 * c2 - a2 * c1) / det;
  return [Math.round(x * 10) / 10, Math.round(y * 10) / 10];
}

export default function SolveTheSystem({
  onSubmit,
  attempts,
  maxAttempts,
  score,
  difficulty = 0,
}) {
  const [problem, setProblem] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showVisual, setShowVisual] = useState(false);
  const [round, setRound] = useState(1);
  const [totalRounds] = useState(5);

  useEffect(() => {
    loadNewProblem();
  }, []);

  const loadNewProblem = useCallback(() => {
    const index = Math.floor(Math.random() * PROBLEMS.length);
    setProblem(PROBLEMS[index]);
    setSelectedAnswer(null);
    setShowVisual(false);
  }, []);

  const isCorrect = useMemo(() => {
    if (!selectedAnswer || !problem) return false;
    if (problem.solution.length === 1) {
      return Math.abs(selectedAnswer[0] - problem.solution[0]) < 0.5;
    }
    return (
      Math.abs(selectedAnswer[0] - problem.solution[0]) < 0.5 &&
      Math.abs(selectedAnswer[1] - problem.solution[1]) < 0.5
    );
  }, [selectedAnswer, problem]);

  const scoreForRound = useMemo(() => {
    if (!problem) return 0;
    if (isCorrect) {
      return 100;
    }
    
    if (selectedAnswer) {
      let distError = 0;
      if (problem.solution.length === 1) {
        distError = Math.abs(selectedAnswer[0] - problem.solution[0]);
      } else {
        distError = Math.sqrt(
          Math.pow(selectedAnswer[0] - problem.solution[0], 2) +
          Math.pow(selectedAnswer[1] - problem.solution[1], 2)
        );
      }
      
      if (distError <= 2) return 30;
      if (distError <= 5) return 10;
    }
    
    return 0;
  }, [isCorrect, selectedAnswer, problem]);

  const handleSubmit = () => {
    setShowVisual(true);
    const points = scoreForRound;

    setTimeout(() => {
      onSubmit(points);
      if (round < totalRounds) {
        setRound(r => r + 1);
        loadNewProblem();
      }
    }, 2000);
  };

  if (!problem) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div
        className="rounded-xl p-4"
        style={{
          background: 'linear-gradient(to right, rgba(220,75,55,0.15), rgba(220,75,55,0.25))',
          color: 'var(--color-paper)',
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-bold text-lg" style={{ color: 'var(--color-paper)' }}>Solve the System</h4>
            <p className="text-sm" style={{ color: 'var(--color-paper)', opacity: 0.8 }}>
              Translate the word problem into equations and find the solution
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm" style={{ color: 'var(--color-paper)', opacity: 0.6 }}>Round</p>
            <p className="text-2xl font-bold font-mono" style={{ color: 'var(--color-paper)' }}>{round}/{totalRounds}</p>
          </div>
        </div>
      </div>

      <motion.div
        key={problem.wordProblem}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="rounded-xl p-6"
        style={{ backgroundColor: 'var(--color-paper-2)', border: '1px solid var(--color-rule)' }}
      >
        <div className="flex items-start gap-3 mb-4">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: 'color-mix(in srgb, var(--color-accent) 20%, transparent)' }}
          >
            <span className="font-bold" style={{ color: 'var(--color-accent)' }}>Q</span>
          </div>
          <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            {problem.wordProblem}
          </p>
        </div>

        <div
          className="rounded-lg p-4 mb-4"
          style={{ backgroundColor: 'color-mix(in srgb, var(--color-text-primary) 5%, var(--color-bg-primary))', border: '1px solid var(--color-rule)' }}
        >
          <p className="text-xs uppercase tracking-wide mb-2" style={{ color: 'var(--color-text-muted)' }}>
            Hint
          </p>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {problem.hint}
          </p>
        </div>
      </motion.div>

      <div
        className="rounded-xl p-4"
        style={{ backgroundColor: 'color-mix(in srgb, var(--color-text-primary) 5%, var(--color-bg-primary))', border: '1px solid var(--color-rule)' }}
      >
        <p className="text-sm mb-3" style={{ color: 'var(--color-text-secondary)' }}>
          Set up the system of equations and solve:
        </p>
        <div
          className="rounded-lg p-4 font-mono text-center"
          style={{ backgroundColor: 'var(--color-paper-2)', border: '1px solid var(--color-rule)' }}
        >
          <p className="text-lg" style={{ color: 'var(--color-text-primary)' }}>
            {problem.equations.split(';').map((eq, i) => (
              <span key={i}>
                {eq.trim()}
                {i < problem.equations.split(';').length - 1 && <br/>}
              </span>
            ))}
          </p>
        </div>
      </div>

      <div>
        <p className="text-sm font-medium mb-3" style={{ color: 'var(--color-text-secondary)' }}>
          Select the correct solution:
        </p>
        <div className="grid grid-cols-2 gap-3">
          {problem.options.map((option, index) => {
            const isSelected = selectedAnswer === option;
            const isCorrectOption = option === problem.solution;

            const buttonStyle = () => {
              if (showVisual && isCorrectOption) {
                return { borderColor: 'var(--color-success)', backgroundColor: 'color-mix(in srgb, var(--color-success) 10%, var(--color-bg-primary))' };
              }
              if (showVisual && isSelected && !isCorrectOption) {
                return { borderColor: 'var(--color-error)', backgroundColor: 'color-mix(in srgb, var(--color-error) 10%, var(--color-bg-primary))' };
              }
              if (isSelected) {
                return { borderColor: 'var(--color-accent)', backgroundColor: 'color-mix(in srgb, var(--color-accent) 10%, var(--color-bg-primary))' };
              }
              return { borderColor: 'var(--color-rule)' };
            };

            return (
              <motion.button
                key={index}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedAnswer(option)}
                disabled={showVisual}
                className="p-4 rounded-xl border-2 text-left transition-all"
                style={buttonStyle()}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                    style={isSelected
                      ? { backgroundColor: 'var(--color-accent)', color: 'var(--color-on-accent)' }
                      : { backgroundColor: 'var(--color-bg-muted)', color: 'var(--color-text-muted)' }
                    }
                  >
                    {String.fromCharCode(65 + index)}
                  </div>
                  <div>
                    {option.length === 1 ? (
                      <p className="font-mono font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                        x = {option[0]}
                      </p>
                    ) : (
                      <>
                        <p className="font-mono font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                          x = {option[0]}, y = {option[1]}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {showVisual && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="rounded-xl overflow-hidden"
          style={{ backgroundColor: 'var(--color-paper-2)', border: '1px solid var(--color-rule)' }}
        >
          <div
            className="p-4 border-b"
            style={{ backgroundColor: 'color-mix(in srgb, var(--color-success) 10%, var(--color-bg-primary))', borderColor: 'var(--color-success)' }}
          >
            <p className="font-semibold" style={{ color: 'var(--color-success)' }}>
              Visual Verification
            </p>
          </div>
          <div className="h-64">
            <CanvasWrapper mode="2d" gridExtent={15} interactive={false} className="h-full">
              <svg width="100%" height="100%" className="absolute inset-0">
                <Grid2D showLabels={true} showTicks={true} />
                
                {problem.solution.length === 2 && (
                  <>
                    <circle
                      cx={400 + problem.solution[0] * 20}
                      cy={200 - problem.solution[1] * 20}
                      r="12"
                      fill="#10b981"
                      stroke="white"
                      strokeWidth="3"
                    />
                    <text
                      x={400 + problem.solution[0] * 20}
                      y={200 - problem.solution[1] * 20 - 20}
                      textAnchor="middle"
                      fill="#10b981"
                      fontSize="12"
                      fontWeight="bold"
                    >
                      ({problem.solution[0]}, {problem.solution[1]})
                    </text>
                  </>
                )}
              </svg>
            </CanvasWrapper>
          </div>
          <div
            className="p-4 text-center"
            style={{ backgroundColor: 'color-mix(in srgb, var(--color-text-primary) 5%, var(--color-bg-primary))', borderTop: '1px solid var(--color-rule)' }}
          >
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {isCorrect
                ? 'Your answer satisfies the equations!'
                : `Correct answer: ${problem.solution.length === 1 ? `x = ${problem.solution[0]}` : `x = ${problem.solution[0]}, y = ${problem.solution[1]}`}`
              }
            </p>
          </div>
        </motion.div>
      )}

      {showVisual && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl p-4"
          style={{
            backgroundColor: isCorrect
              ? 'color-mix(in srgb, var(--color-success) 10%, var(--color-bg-primary))'
              : 'color-mix(in srgb, var(--color-error) 10%, var(--color-bg-primary))',
            border: `1px solid ${isCorrect ? 'var(--color-success)' : 'var(--color-error)'}`,
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-lg" style={{ color: isCorrect ? 'var(--color-success)' : 'var(--color-error)' }}>
                {isCorrect ? 'Correct!' : 'Incorrect'}
              </p>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                {isCorrect
                  ? 'Great job solving the system!'
                  : `The solution is x = ${problem.solution[0]}${problem.solution[1] !== undefined ? `, y = ${problem.solution[1]}` : ''}`
                }
              </p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-bold font-mono">
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
          disabled={!selectedAnswer || attempts >= maxAttempts}
          className="px-8"
        >
          Check Answer
        </Button>
      </div>
    </div>
  );
}