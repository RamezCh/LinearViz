import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../UI/Button';
import ResultsModal from './ResultsModal';

export default function GameWrapper({
  children,
  title,
  instructions,
  onComplete,
  onNext,
  onRetry,
  maxAttempts = 3,
  showTimer = false,
  timerDuration = 60,
  rounds = 1,
  currentRound = 1,
  scoring = 'accuracy',
  gameState,
  setGameState,
  className = '',
}) {
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(timerDuration);
  const [timerActive, setTimerActive] = useState(showTimer);
  const [roundScore, setRoundScore] = useState(0);
  const [stars, setStars] = useState(0);

  const ACCENT = 'var(--color-accent)';
  const EMERALD = 'oklch(52% 0.16 155)';
  const AMBER = 'oklch(65% 0.10 70)';
  const RED = 'oklch(52% 0.16 25)';

  useEffect(() => {
    if (!showTimer || !timerActive || timeRemaining <= 0) return;
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) { setTimerActive(false); handleTimeUp(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [showTimer, timerActive, timeRemaining]);

  useEffect(() => {
    if (maxAttempts > 0 && attempts >= maxAttempts) setTimerActive(false);
  }, [attempts, maxAttempts]);

  const handleTimeUp = useCallback(() => {
    setShowResults(true);
    if (onComplete) { const finalScore = calculateFinalScore(); onComplete({ score: finalScore, attempts, stars: calculateStars(finalScore), timedOut: true }); }
  }, [attempts, onComplete]);

  const calculateStars = (finalScore) => {
    const maxPossibleScore = scoring === 'accuracy' ? 100 : 50 * maxAttempts * rounds;
    const percentage = finalScore / maxPossibleScore;
    if (percentage >= 0.9) return 3;
    if (percentage >= 0.6) return 2;
    if (percentage > 0) return 1;
    return 0;
  };

  const calculateFinalScore = () => {
    if (scoring === 'accuracy') return Math.max(0, 100 - attempts * 20 - Math.floor((timerDuration - timeRemaining) / 5));
    return score;
  };

  const handleSubmit = (roundPoints) => {
    const points = typeof roundPoints === 'number' ? roundPoints : 0;
    setRoundScore(points);
    setScore((prev) => prev + points);
    setAttempts((prev) => prev + 1);
    if (attempts + 1 >= maxAttempts || (rounds > 1 && currentRound >= rounds)) {
      setTimerActive(false);
      setTimeout(() => {
        setShowResults(true);
        const finalScore = calculateFinalScore() + points;
        setStars(calculateStars(finalScore));
        if (onComplete) onComplete({ score: finalScore, attempts: attempts + 1, stars: calculateStars(finalScore), timedOut: false });
      }, 500);
    }
  };

  const handlePlayAgain = () => {
    setScore(0); setAttempts(0); setShowResults(false); setTimeRemaining(timerDuration);
    setTimerActive(showTimer); setRoundScore(0); setStars(0);
    if (onRetry) onRetry();
  };

  const handleNextGame = () => { if (onNext) onNext(); };

  const formatTime = (seconds) => `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl shadow-xl overflow-hidden ${className}`}
      style={{ backgroundColor: 'var(--color-paper)' }}>
      <div className="px-6 py-4"
        style={{ background: `linear-gradient(135deg, ${ACCENT}, oklch(50% 0.12 270))` }}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--color-paper)', fontFamily: 'var(--font-display)' }}>{title}</h2>
            {instructions && <p className="text-sm mt-1" style={{ color: 'rgba(248,250,252,0.75)' }}>{instructions}</p>}
          </div>
          <div className="flex items-center gap-4">
            {showTimer && (
              <motion.div className="px-3 py-1.5 rounded-lg" animate={timeRemaining <= 10 ? { scale: [1, 1.1, 1] } : {}} transition={{ repeat: Infinity, duration: 1 }}
                style={{ backgroundColor: timeRemaining <= 10 ? RED : 'rgba(255,255,255,0.2)' }}>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-paper)' }}>{formatTime(timeRemaining)}</span>
              </motion.div>
            )}
            {rounds > 1 && (
              <div className="px-3 py-1.5 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                <span style={{ color: 'var(--color-paper)' }}>Round {currentRound}/{rounds}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(75,180,140,0.12)' }}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke={EMERALD} strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs" style={{ color: 'var(--color-muted)' }}>Score</p>
                <p className="text-lg font-bold font-mono" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-ink)' }}>{score}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(200,155,50,0.12)' }}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke={AMBER} strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <div>
                <p className="text-xs" style={{ color: 'var(--color-muted)' }}>Attempts</p>
                <p className="text-lg font-bold font-mono" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-ink)' }}>{attempts}/{maxAttempts}</p>
              </div>
            </div>
          </div>
          <AnimatePresence>
            {roundScore > 0 && (
              <motion.div initial={{ opacity: 0, scale: 0.8, x: 20 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={{ opacity: 0, scale: 0.8, x: 20 }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{ backgroundColor: 'rgba(75,180,140,0.12)' }}>
                <span className="font-bold" style={{ color: EMERALD }}>+{roundScore}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {children({ onSubmit: handleSubmit, attempts, maxAttempts, score, timeRemaining, timerActive, gameState, setGameState })}
      </div>
    </motion.div>
  );
}