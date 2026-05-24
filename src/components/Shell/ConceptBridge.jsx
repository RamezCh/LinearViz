import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, CheckCircle2, SkipForward, Link2 } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { modules } from '../../data/modules';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

const bridgeData = {
  '1-2': { concept: 'Vectors as building blocks', connection: 'Matrices are containers for vectors', keyInsight: 'Individual arrows → collections of arrows' },
  '2-3': { concept: 'Transformation area scaling', connection: 'Determinants measure area change', keyInsight: 'Matrix operations → geometric effect' },
  '3-4': { concept: 'Invertibility and area', connection: 'Non-zero det means reversible', keyInsight: 'Area ≠ 0 → invertible' },
  '4-5': { concept: 'Special preserved directions', connection: 'Eigenvectors survive transformations', keyInsight: 'Av = λv' },
  '5-6': { concept: 'Eigen-decomposition view', connection: 'Understand any transformation via eigenvalues', keyInsight: 'Every transform has characteristic directions' },
  '6-7': { concept: 'Perpendicular dropping', connection: 'Projections find closest points', keyInsight: 'Shadow onto a line' },
  '7-8': { concept: 'Orthogonalization via projections', connection: 'Subtract projections to orthogonalize', keyInsight: 'Subtract components = make orthogonal' },
  '8-9': { concept: 'Orthogonal bases power', connection: 'SVD uses orthogonal bases on both sides', keyInsight: 'A = UΣVᵀ' },
};

export default function ConceptBridgePanel({ isOpen, onClose, currentModule }) {
  const { setCurrentModule } = useStore();

  const currentModuleData = modules.find((m) => m.id === currentModule);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.45)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-4xl w-full rounded-2xl overflow-hidden"
          style={{ boxShadow: 'var(--shadow-xl)', backgroundColor: 'var(--color-paper)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 lg:p-8">
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
              <motion.div variants={itemVariants} className="text-center">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Link2 className="w-6 h-6" style={{ color: 'var(--color-accent)' }} />
                  <h2 className="text-2xl lg:text-3xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}>
                    Concept Map
                  </h2>
                </div>
                <p style={{ color: 'var(--color-muted)' }}>
                  {currentModuleData ? `You're in ${currentModuleData.title}. See how all concepts connect.` : 'See how all concepts connect together.'}
                </p>
              </motion.div>

              <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                {modules.slice(0, 9).map((mod) => {
                  const bridge = bridgeData[`${mod.id}-${mod.id + 1}`];
                  return (
                    <motion.div
                      key={mod.id}
                      variants={itemVariants}
                      className="rounded-xl p-3 text-center cursor-pointer transition-all relative"
                      style={{
                        backgroundColor: mod.id === currentModule ? 'rgba(75,160,195,0.15)' : 'var(--color-paper-2)',
                        border: mod.id === currentModule ? '2px solid var(--color-accent)' : '1px solid var(--color-rule)',
                      }}
                      onClick={() => { setCurrentModule(mod.id); onClose(); }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <div className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center font-bold text-lg" style={{ backgroundColor: mod.color, color: 'var(--color-paper)', fontFamily: 'var(--font-mono)' }}>
                        {mod.id}
                      </div>
                      <p className="font-medium text-xs" style={{ color: 'var(--color-ink)' }}>{mod.title}</p>
                      {bridge && mod.id < 9 && (
                        <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--color-muted)', fontSize: '0.65rem' }}>
                          {bridge.concept.split(' ').slice(0, 4).join(' ')}...
                        </p>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {currentModuleData && currentModule < 9 && (
                <motion.div variants={itemVariants} className="rounded-xl p-5" style={{ backgroundColor: 'var(--color-paper-2)' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold" style={{ backgroundColor: currentModuleData.color, color: 'var(--color-paper)', fontFamily: 'var(--font-mono)' }}>
                      {currentModule}
                    </div>
                    <span className="font-semibold" style={{ color: 'var(--color-ink)' }}>{currentModuleData.title}</span>
                  </div>
                  <p className="text-sm mb-4" style={{ color: 'var(--color-muted)' }}>{currentModuleData.description}</p>
                  {bridgeData[`${currentModule}-${currentModule + 1}`] && (
                    <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: 'rgba(75,160,195,0.08)' }}>
                      <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-accent)' }} />
                      <p className="text-sm" style={{ color: 'var(--color-accent)' }}>
                        Next: {bridgeData[`${currentModule}-${currentModule + 1}`]?.concept}
                      </p>
                    </div>
                  )}
                </motion.div>
              )}

              <motion.div variants={itemVariants} className="flex justify-center pt-2">
                <button
                  onClick={onClose}
                  className="px-6 py-3 rounded-xl font-semibold shadow-lg transition-all"
                  style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-paper)' }}
                >
                  Close
                </button>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}