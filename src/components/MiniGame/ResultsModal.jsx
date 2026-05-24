import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../UI/Button';

const ACCENT = 'var(--color-accent)';
const AMBER = 'oklch(65% 0.10 70)';

function StarIcon({ filled, className }) {
  return (
    <motion.svg initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 200 }}
      className={className} fill="currentColor" viewBox="0 0 20 20"
      style={{ color: filled ? AMBER : 'var(--color-rule)' }}>
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </motion.svg>
  );
}

export default function ResultsModal({
  isOpen = false, score = 0, maxScore = 100, stars = 0,
  attempts = 0, maxAttempts = 3, message = '', customFeedback = null,
  onRetry, onContinue, onClose, showConfetti = true, className = '',
}) {
  const [showConf, setShowConf] = useState(false);

  useEffect(() => {
    if (isOpen && showConfetti && stars >= 2) {
      setShowConf(true);
      const timeout = setTimeout(() => setShowConf(false), 3000);
      return () => clearTimeout(timeout);
    }
  }, [isOpen, showConfetti, stars]);

  const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
  const feedback = customFeedback || (stars === 3 ? { title: 'Outstanding!', message: 'You nailed it! Your understanding is excellent.' } : stars === 2 ? { title: 'Great Job!', message: 'You showed solid understanding. Keep it up!' } : stars === 1 ? { title: 'Good Effort!', message: "You're getting there. Practice makes perfect!" } : { title: 'Keep Practicing!', message: 'Review the concepts and try again.' });

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
          {showConf && <Confetti />}
          <motion.div initial={{ scale: 0.8, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }} transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className={`rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden ${className}`}
            style={{ backgroundColor: 'var(--color-paper)' }}>
            <div className="relative h-32 flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${ACCENT}, oklch(50% 0.12 270), oklch(50% 0.12 300))` }}>
              <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }} className="relative">
                <div className="w-24 h-24 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
                  <div className="text-center">
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.4, type: 'spring' }}
                      className="text-4xl font-bold" style={{ color: 'var(--color-paper)', fontFamily: 'var(--font-mono)' }}>{score}</motion.span>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>points</p>
                  </div>
                </div>
              </motion.div>
            </div>
            <div className="p-6">
              <div className="flex justify-center gap-1 mb-4">
                {[1, 2, 3].map((s) => <StarIcon key={s} filled={s <= stars} className="w-10 h-10" />)}
              </div>
              <motion.h3 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                className="text-2xl font-bold text-center mb-2" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-display)' }}>
                {feedback.title}
              </motion.h3>
              <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                className="text-center mb-6" style={{ color: 'var(--color-muted)' }}>
                {feedback.message}
              </motion.p>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                className="rounded-xl p-4 mb-6" style={{ backgroundColor: 'var(--color-paper-2)' }}>
                <div className="flex justify-between items-center mb-3">
                  <span style={{ color: 'var(--color-muted)' }}>Score</span>
                  <span className="text-2xl font-bold font-mono" style={{ fontFamily: 'var(--font-mono)', color: ACCENT }}>{score} / {maxScore}</span>
                </div>
                <div className="flex justify-between items-center mb-3">
                  <span style={{ color: 'var(--color-muted)' }}>Accuracy</span>
                  <span className="text-lg font-semibold" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-mono)' }}>{percentage.toFixed(0)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span style={{ color: 'var(--color-muted)' }}>Attempts Used</span>
                  <span className="text-lg font-semibold" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-mono)' }}>{attempts} / {maxAttempts}</span>
                </div>
              </motion.div>
              <div className="flex gap-3">
                {onRetry && <Button variant="outline" onClick={onRetry} className="flex-1">Try Again</Button>}
                {onContinue && <Button variant="primary" onClick={onContinue} className="flex-1">Continue</Button>}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Confetti() {
  const colors = ['oklch(50% 0.12 235)', 'oklch(50% 0.12 270)', 'oklch(70% 0.12 340)', 'oklch(52% 0.16 155)', 'oklch(65% 0.10 70)', 'oklch(52% 0.16 25)'];
  const pieces = Array.from({ length: 50 }, (_, i) => ({
    id: i, x: Math.random() * 100, delay: Math.random() * 0.5,
    duration: 2 + Math.random() * 2, color: colors[Math.floor(Math.random() * colors.length)],
    rotation: Math.random() * 360, size: 6 + Math.random() * 8,
  }));
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-40">
      {pieces.map((piece) => (
        <motion.div key={piece.id} className="absolute"
          style={{ left: `${piece.x}%`, top: -20, width: piece.size, height: piece.size, backgroundColor: piece.color, borderRadius: Math.random() > 0.5 ? '50%' : '2px', rotate: piece.rotation }}
          initial={{ y: -20, opacity: 1 }} animate={{ y: window?.innerHeight || 800, opacity: [1, 1, 0], rotate: piece.rotation + 720 }}
          transition={{ duration: piece.duration, delay: piece.delay, ease: 'easeIn' }} />
      ))}
    </div>
  );
}

export function MiniResult({ score, label, icon: Icon, delay = 0 }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.8, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay, type: 'spring' }}
      className="flex items-center gap-3 px-4 py-3 rounded-xl border"
      style={{ backgroundColor: 'var(--color-paper)', borderColor: 'var(--color-rule)' }}>
      {Icon && <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(75,160,195,0.08)' }}><Icon className="w-5 h-5" style={{ color: 'var(--color-accent)' }} /></div>}
      <div className="flex-1">
        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{label}</p>
        <p className="text-lg font-bold font-mono" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-ink)' }}>{score}</p>
      </div>
    </motion.div>
  );
}