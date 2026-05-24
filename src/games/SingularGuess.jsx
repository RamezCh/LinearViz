import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../components/UI/Button.jsx';
import { Slider } from '../components/UI/Slider.jsx';
import { svd2x2 } from '../utils/linalg.js';

function generateProblem() {
  const a = [
    [Math.round((Math.random() * 4 - 2) * 10) / 10, Math.round((Math.random() * 4 - 2) * 10) / 10],
    [Math.round((Math.random() * 4 - 2) * 10) / 10, Math.round((Math.random() * 4 - 2) * 10) / 10],
  ];
  
  const rank1Image = [
    [Math.round(a[0][0] * a[0][0] * 100) / 100, Math.round(a[0][0] * a[1][0] * 100) / 100],
    [Math.round(a[0][0] * a[0][1] * 100) / 100, Math.round(a[0][0] * a[1][1] * 100) / 100],
  ];
  
  const fullRank = [
    [Math.round((a[0][0] * a[0][0] + a[0][1] * a[1][0]) * 100) / 100,
     Math.round((a[0][0] * a[0][1] + a[0][1] * a[1][1]) * 100) / 100],
    [Math.round((a[1][0] * a[0][0] + a[1][1] * a[1][0]) * 100) / 100,
     Math.round((a[1][0] * a[0][1] + a[1][1] * a[1][1]) * 100) / 100],
  ];
  
  return {
    originalMatrix: a,
    images: [rank1Image, fullRank],
    correctRanks: [1, 2],
  };
}

function generateImageData(matrix) {
  const data = [];
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      const value = Math.abs(matrix[i][j]);
      const normalized = Math.min(value / 5, 1);
      data.push({
        i, j,
        value,
        brightness: Math.floor(normalized * 255),
        color: `rgb(${Math.floor(normalized * 200)}, ${Math.floor(normalized * 150)}, ${Math.floor(normalized * 255)})`,
      });
    }
  }
  return data;
}

export default function SingularGuess({
  onSubmit,
  attempts,
  maxAttempts,
  score,
  difficulty = 0,
}) {
  const [problem, setProblem] = useState(null);
  const [guesses, setGuesses] = useState([0, 0]);
  const [showResult, setShowResult] = useState(false);
  const [round, setRound] = useState(1);
  const [totalRounds] = useState(4);

  useEffect(() => {
    loadNewProblem();
  }, []);

  const loadNewProblem = useCallback(() => {
    const newProblem = generateProblem();
    const shuffledIndices = [0, 1].sort(() => Math.random() - 0.5);
    
    setProblem({
      ...newProblem,
      shuffledIndices,
      displayOrder: shuffledIndices.map(i => ({
        image: newProblem.images[i],
        rank: newProblem.correctRanks[i],
        position: i,
      })),
    });
    setGuesses([0, 0]);
    setShowResult(false);
  }, []);

  const image1Data = useMemo(() => {
    if (!problem) return [];
    return generateImageData(problem.displayOrder[0].image);
  }, [problem]);

  const image2Data = useMemo(() => {
    if (!problem) return [];
    return generateImageData(problem.displayOrder[1].image);
  }, [problem]);

  const handleGuess = (imageIndex, rank) => {
    setGuesses(prev => {
      const newGuesses = [...prev];
      newGuesses[imageIndex] = rank;
      return newGuesses;
    });
  };

  const scoreForRound = useMemo(() => {
    if (!problem || !showResult) return 0;
    
    const positions = problem.shuffledIndices;
    
    const image1Correct = guesses[0] === problem.correctRanks[positions[0]];
    const image2Correct = guesses[1] === problem.correctRanks[positions[1]];
    
    let baseScore = (image1Correct ? 50 : 0) + (image2Correct ? 50 : 0);
    
    return baseScore;
  }, [problem, guesses, showResult]);

  const handleSubmit = () => {
    setShowResult(true);
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
          background: 'linear-gradient(to right, var(--color-blue), var(--color-violet))',
          color: 'var(--color-paper)',
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-bold text-lg" style={{ fontFamily: 'var(--font-display)' }}>Guess the Rank</h4>
            <p className="text-sm" style={{ opacity: 0.8 }}>
              Determine the rank of each reconstructed image
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm" style={{ opacity: 0.6 }}>Round</p>
            <p className="text-2xl font-bold font-mono" style={{ fontFamily: 'var(--font-mono)' }}>{round}/{totalRounds}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--color-paper-2)' }}>
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="text-center">
            <p className="text-xs mb-1" style={{ color: 'var(--color-muted)' }}>Your Guess</p>
            <p className="text-lg font-bold" style={{ color: 'var(--color-blue)' }}>
              Rank {guesses[0]}
            </p>
          </div>
          <div className="text-2xl" style={{ color: 'var(--color-rule-2)' }}>vs</div>
          <div className="text-center">
            <p className="text-xs mb-1" style={{ color: 'var(--color-muted)' }}>Your Guess</p>
            <p className="text-lg font-bold" style={{ color: 'var(--color-violet)' }}>
              Rank {guesses[1]}
            </p>
          </div>
        </div>

        {showResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-lg p-3"
            style={{
              backgroundColor: scoreForRound === 100 ? 'rgba(75, 160, 140, 0.12)' : 'rgba(175, 90, 65, 0.12)',
            }}
          >
            <p
              className="text-center font-bold"
              style={{ color: scoreForRound === 100 ? 'var(--color-emerald)' : 'var(--color-red)' }}
            >
              {scoreForRound === 100 ? 'Perfect!' : 'Not quite right'}
            </p>
            <p className="text-center text-sm" style={{ color: 'var(--color-muted)' }}>
              Correct answers: Rank {problem.correctRanks[problem.shuffledIndices[0]]} and Rank {problem.correctRanks[problem.shuffledIndices[1]]}
            </p>
          </motion.div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {[0, 1].map((imageIndex) => {
          const displayData = imageIndex === 0 ? image1Data : image2Data;
          const guess = guesses[imageIndex];
          const isCorrect = showResult && guess === problem.displayOrder[imageIndex].rank;
          const isWrong = showResult && guess > 0 && guess !== problem.displayOrder[imageIndex].rank;

          return (
            <motion.div
              key={imageIndex}
              initial={{ opacity: 0, x: imageIndex === 0 ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: imageIndex * 0.1 }}
              className="rounded-xl border-2 transition-colors"
              style={{
                backgroundColor: 'var(--color-paper)',
                borderColor: isCorrect ? 'var(--color-emerald)' : isWrong ? 'var(--color-red)' : 'var(--color-rule)',
              }}
            >
              <div className="p-4 border-b" style={{ borderColor: 'var(--color-rule)' }}>
                <h4 className="font-semibold text-center" style={{ color: 'var(--color-ink)' }}>
                  Image {imageIndex + 1}
                  {showResult && (
                    <span className="ml-2 text-sm" style={{ color: isCorrect ? 'var(--color-emerald)' : 'var(--color-red)' }}>
                      ({isCorrect ? 'Correct!' : `Rank ${problem.displayOrder[imageIndex].rank}`})
                    </span>
                  )}
                </h4>
              </div>

              <div className="p-6 flex justify-center">
                <div className="grid grid-cols-2 gap-1">
                  {displayData.map((pixel, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="w-16 h-16 rounded"
                      style={{ backgroundColor: pixel.color }}
                    />
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-b-xl" style={{ backgroundColor: 'var(--color-paper-2)' }}>
                <p className="text-xs text-center mb-3" style={{ color: 'var(--color-muted)' }}>
                  Is this rank 1 or rank 2?
                </p>
                <div className="flex gap-2">
                  <Button
                    variant={guess === 1 ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => handleGuess(imageIndex, 1)}
                    disabled={showResult}
                    className="flex-1"
                  >
                    Rank 1
                  </Button>
                  <Button
                    variant={guess === 2 ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => handleGuess(imageIndex, 2)}
                    disabled={showResult}
                    className="flex-1"
                  >
                    Rank 2
                  </Button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {!showResult && (
        <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(75, 100, 220, 0.08)' }}>
          <h4 className="font-semibold mb-2" style={{ color: 'var(--color-blue)' }}>
            About Matrix Rank
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm" style={{ color: 'var(--color-muted)' }}>
            <div>
              <p className="font-medium" style={{ color: 'var(--color-blue)' }}>Rank 1 Matrix</p>
              <p>Can be written as uv^T for some vectors u and v. All columns are multiples of each other.</p>
            </div>
            <div>
              <p className="font-medium" style={{ color: 'var(--color-violet)' }}>Rank 2 Matrix</p>
              <p>Full rank for 2x2 matrices. Columns are linearly independent. Span the full 2D space.</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-center">
        <Button
          variant="primary"
          size="lg"
          onClick={handleSubmit}
          disabled={guesses.includes(0) || attempts >= maxAttempts}
          className="px-8"
        >
          Submit Guesses
        </Button>
      </div>
    </div>
  );
}