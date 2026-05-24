/* Hallmark · component: navbar · educational math tool · Plume theme
 */
import { Sun, Moon, Book } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '../../store/useStore';

export function Navbar({ onOpenNotation, onOpenBridge }) {
  const { darkMode, toggleDarkMode } = useStore();

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 border-b flex-shrink-0"
      role="navigation"
      aria-label="Main navigation"
      style={{
        height: '3.75rem',
        backgroundColor: 'color-mix(in oklch, var(--color-paper) 92%, transparent)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderColor: 'var(--color-rule)',
      }}
    >
      <div className="h-full flex items-center justify-between w-full px-[14px]">
        <div className="flex items-center gap-3">
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: '1.25rem',
              letterSpacing: '-0.025em',
              color: 'var(--color-ink)',
              lineHeight: 1,
            }}
          >
            LinearVis
          </span>
          <span
            className="hidden sm:inline text-xs font-medium px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: 'oklch(52% 0.04 195)',
              color: 'var(--color-accent)',
              fontFamily: 'var(--font-body)',
              letterSpacing: '0.04em',
            }}
          >
            beta
          </span>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            onClick={onOpenNotation}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200"
            style={{
              backgroundColor: darkMode ? 'var(--color-paper-3)' : 'var(--color-paper-2)',
              color: 'var(--color-accent)',
            }}
            aria-label="Open notation reference"
            title="Notation Reference"
          >
            <Book size={18} strokeWidth={1.75} />
          </motion.button>
          <motion.button
            onClick={toggleDarkMode}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200"
            style={{
              backgroundColor: darkMode ? 'var(--color-paper-3)' : 'var(--color-paper-2)',
              color: 'var(--color-accent)',
            }}
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            title={darkMode ? 'Light mode' : 'Dark mode'}
          >
            <AnimatePresence mode="wait" initial={false}>
              {darkMode ? (
                <motion.span
                  key="moon"
                  initial={{ rotate: -25, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 25, opacity: 0 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Moon size={18} strokeWidth={1.75} />
                </motion.span>
              ) : (
                <motion.span
                  key="sun"
                  initial={{ rotate: 25, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -25, opacity: 0 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Sun size={18} strokeWidth={1.75} />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;