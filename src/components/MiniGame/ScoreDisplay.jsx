import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ScoreDisplay({
  currentScore = 0,
  maxScore = 100,
  previousScore = null,
  stars = 0,
  showBreakdown = false,
  breakdown = [],
  highScoreKey = 'game_high_score',
  animate = true,
  size = 'md',
  className = '',
}) {
  const [displayScore, setDisplayScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const [scoreChange, setScoreChange] = useState(null);

  const ACCENT = 'var(--color-accent)';
  const EMERALD = 'oklch(52% 0.16 155)';
  const RED = 'oklch(52% 0.16 25)';
  const AMBER = 'oklch(65% 0.10 70)';

  useEffect(() => {
    if (highScoreKey && typeof window !== 'undefined') {
      const stored = localStorage.getItem(highScoreKey);
      if (stored) setHighScore(parseInt(stored, 10));
    }
  }, [highScoreKey]);

  useEffect(() => {
    if (!animate) { setDisplayScore(currentScore); return; }
    const duration = 500;
    const startValue = displayScore;
    const endValue = currentScore;
    const startTime = Date.now();
    const animateScore = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const newValue = Math.round(startValue + (endValue - startValue) * eased);
      setDisplayScore(newValue);
      if (progress < 1) { requestAnimationFrame(animateScore); }
      else { if (highScoreKey && endValue > highScore) { setHighScore(endValue); setIsNewHighScore(true); localStorage.setItem(highScoreKey, endValue.toString()); setTimeout(() => setIsNewHighScore(false), 2000); } }
    };
    requestAnimationFrame(animateScore);
  }, [currentScore, animate, highScoreKey, highScore]);

  useEffect(() => {
    if (previousScore !== null && previousScore !== currentScore) {
      const diff = currentScore - previousScore;
      setScoreChange(diff);
      const timeout = setTimeout(() => setScoreChange(null), 1000);
      return () => clearTimeout(timeout);
    }
  }, [currentScore, previousScore]);

  const percentage = maxScore > 0 ? (displayScore / maxScore) * 100 : 0;
  const sizeConfig = { sm: { container: 'p-3', score: 'text-lg', label: 'text-xs' }, md: { container: 'p-4', score: 'text-2xl', label: 'text-sm' }, lg: { container: 'p-6', score: 'text-4xl', label: 'text-base' } };
  const config = sizeConfig[size];

  return (
    <div className={`${config.container} rounded-xl border ${className}`}
      style={{ backgroundColor: 'var(--color-paper)', borderColor: 'var(--color-rule)' }}>
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className={`${config.label}`} style={{ color: 'var(--color-muted)' }}>Score</p>
            <div className="flex items-baseline gap-2">
              <motion.span key={displayScore} className={`${config.score} font-bold font-mono`}
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-ink)' }}>{displayScore}</motion.span>
              <span className="text-sm" style={{ color: 'var(--color-muted)' }}>/ {maxScore}</span>
            </div>
          </div>
          {stars > 0 && (
            <div className="flex gap-0.5">
              {[1, 2, 3].map((star) => (
                <motion.svg key={star} initial={animate ? { scale: 0, rotate: -180 } : false}
                  animate={animate ? { scale: 1, rotate: 0 } : false}
                  transition={{ delay: star * 0.1, type: 'spring', stiffness: 200 }}
                  className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"
                  style={{ color: star <= stars ? AMBER : 'var(--color-rule)' }}>
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </motion.svg>
              ))}
            </div>
          )}
        </div>
        <div className="h-2 rounded-full overflow-hidden mb-4" style={{ backgroundColor: 'var(--color-paper-2)' }}>
          <motion.div className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${ACCENT}, oklch(50% 0.12 270))` }}
            initial={animate ? { width: 0 } : false} animate={{ width: `${percentage}%` }} transition={{ duration: 0.5, ease: 'easeOut' }} />
        </div>
        <AnimatePresence>
          {scoreChange !== null && (
            <motion.div initial={{ opacity: 0, y: 10, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.8 }}
              className="absolute -top-1 right-0 px-2 py-1 rounded-lg font-bold text-sm"
              style={scoreChange > 0 ? { backgroundColor: 'rgba(75,180,140,0.12)', color: EMERALD } : { backgroundColor: 'rgba(220,75,55,0.08)', color: RED }}>
              {scoreChange > 0 ? '+' : ''}{scoreChange}
            </motion.div>
          )}
        </AnimatePresence>
        {highScoreKey && (
          <div className="flex items-center justify-between text-xs">
            <span style={{ color: 'var(--color-muted)' }}>High Score</span>
            <div className="flex items-center gap-1">
              {isNewHighScore && (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="px-1.5 py-0.5 rounded text-xs font-medium"
                  style={{ backgroundColor: 'rgba(200,155,50,0.15)', color: AMBER }}>NEW!</motion.span>
              )}
              <span className="font-mono font-semibold" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-ink)' }}>{highScore}</span>
            </div>
          </div>
        )}
        {showBreakdown && breakdown.length > 0 && (
          <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--color-rule)' }}>
            <p className="text-xs mb-2" style={{ color: 'var(--color-muted)' }}>Score Breakdown</p>
            <div className="space-y-1.5">
              {breakdown.map((item, index) => (
                <motion.div key={index} initial={animate ? { opacity: 0, x: -10 } : false}
                  animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}
                  className="flex justify-between items-center text-sm">
                  <span style={{ color: 'var(--color-muted)' }}>{item.label}</span>
                  <span className="font-mono font-semibold" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-ink)' }}>{item.points > 0 ? '+' : ''}{item.points}</span>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function MiniScore({ points, label, icon: Icon, className = '' }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${className}`}
      style={{ backgroundColor: 'var(--color-paper)', borderColor: 'var(--color-rule)' }}>
      {Icon && <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(75,160,195,0.08)' }}><Icon className="w-5 h-5" style={{ color: 'var(--color-accent)' }} /></div>}
      <div className="flex-1">
        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{label}</p>
        <p className="text-lg font-bold font-mono" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-ink)' }}>{points}</p>
      </div>
    </motion.div>
  );
}

export function StarRating({ stars = 0, maxStars = 3, size = 'md', animated = true, className = '' }) {
  const sizeMap = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' };
  return (
    <div className={`flex gap-1 ${className}`}>
      {Array.from({ length: maxStars }, (_, i) => i + 1).map((star) => (
        <motion.svg key={star} initial={animated ? { scale: 0, rotate: -180 } : false}
          animate={animated ? { scale: 1, rotate: 0 } : false}
          transition={{ delay: animated ? star * 0.1 : 0, type: 'spring', stiffness: 200 }}
          className={sizeMap[size]} fill="currentColor" viewBox="0 0 20 20"
          style={{ color: star <= stars ? 'oklch(65% 0.10 70)' : 'var(--color-rule)' }}>
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </motion.svg>
      ))}
    </div>
  );
}