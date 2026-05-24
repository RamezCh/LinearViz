/* Hallmark · component: Layout · genre: playful · theme: Plume
 * states: default · dark mode
 */
import { useStore } from '../../store/useStore';
import { motion } from 'framer-motion';

export function Layout({ children }) {
  const { darkMode } = useStore();

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        backgroundColor: 'var(--color-paper)',
        color: 'var(--color-ink)',
        transition: 'background-color 300ms var(--ease-out), color 300ms var(--ease-out)',
      }}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="flex-1 flex flex-col min-h-0"
      >
        {children}
      </motion.div>
    </div>
  );
}

export default Layout;