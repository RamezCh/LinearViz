import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, CheckCircle2, Circle, Lock, X, Link2, ChevronLeft } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { modules } from '../../data/modules';

export function Sidebar({ onShowBridge }) {
  const { currentModule, setCurrentModule, sidebarCollapsed, toggleSidebar, isModuleUnlocked, moduleProgress } = useStore();
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleModuleClick = (moduleId) => {
    if (isModuleUnlocked(moduleId)) {
      setCurrentModule(moduleId);
      if (isMobile) setMobileOpen(false);
    }
  };

  if (isMobile) {
    return (
      <>
        <motion.button
          onClick={() => setMobileOpen(true)}
          className="fixed bottom-4 left-4 z-40 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-lg"
          style={{
            backgroundColor: 'var(--color-accent)',
            color: 'var(--color-paper)',
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="font-bold" style={{ fontFamily: 'var(--font-display)' }}>Modules</span>
        </motion.button>

        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileOpen(false)}
                className="fixed inset-0 z-50"
                style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
              />
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="fixed left-0 top-0 bottom-0 z-50 w-72 overflow-hidden flex flex-col"
                style={{ backgroundColor: 'var(--color-paper)', boxShadow: 'var(--shadow-xl)' }}
              >
                <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--color-rule)' }}>
                  <h2 className="font-bold" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-display)' }}>
                    Modules
                  </h2>
                  <button
                    onClick={() => setMobileOpen(false)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ color: 'var(--color-muted)' }}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {modules.map((mod) => (
                    <button
                      key={mod.id}
                      onClick={() => handleModuleClick(mod.id)}
                      className="w-full text-left p-3 rounded-xl transition-all"
                      style={{
                        backgroundColor: currentModule === mod.id ? 'rgba(75,160,195,0.12)' : 'var(--color-paper-2)',
                        borderLeft: currentModule === mod.id ? '3px solid var(--color-accent)' : '3px solid transparent',
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm" style={{ backgroundColor: mod.color || 'var(--color-accent)', color: 'var(--color-paper)', fontFamily: 'var(--font-mono)', opacity: isModuleUnlocked(mod.id) ? 1 : 0.5 }}>
                          {mod.id}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate" style={{ color: 'var(--color-ink)', fontSize: '0.875rem', opacity: isModuleUnlocked(mod.id) ? 1 : 0.5 }}>{mod.title}</p>
                        </div>
                        {!isModuleUnlocked(mod.id) ? (
                          <Lock className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-muted)' }} />
                        ) : moduleProgress[mod.id]?.completed ? (
                          <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--color-emerald)' }} />
                        ) : currentModule === mod.id ? (
                          <ChevronRight className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--color-accent)' }} />
                        ) : (
                          <Circle className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--color-muted)' }} />
                        )}
                      </div>
                    </button>
                  ))}
                  <button
                    onClick={() => { onShowBridge?.(); setMobileOpen(false); }}
                    className="w-full text-left p-3 rounded-xl transition-all mt-4 border-t"
                    style={{ borderColor: 'var(--color-rule)' }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(140, 100, 215, 0.12)' }}>
                        <Link2 className="w-4 h-4" style={{ color: 'var(--color-violet)' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium" style={{ color: 'var(--color-ink)', fontSize: '0.875rem' }}>Concept Map</p>
                        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>See how concepts connect</p>
                      </div>
                    </div>
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </>
    );
  }

  if (sidebarCollapsed) {
    return (
      <div className="w-12 border-r flex-shrink-0 hidden lg:flex flex-col items-center py-3 gap-1"
        style={{ backgroundColor: 'var(--color-paper)', borderColor: 'var(--color-rule)' }}>
        <button
          onClick={toggleSidebar}
          className="w-8 h-8 rounded-lg flex items-center justify-center mb-2"
          style={{ backgroundColor: 'var(--color-paper-2)', color: 'var(--color-muted)' }}
          title="Expand sidebar"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        {modules.map((mod) => (
          <button
            key={mod.id}
            onClick={() => handleModuleClick(mod.id)}
            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs transition-all"
            disabled={!isModuleUnlocked(mod.id)}
            style={{
              backgroundColor: currentModule === mod.id ? mod.color || 'var(--color-accent)' : 'var(--color-paper-2)',
              color: currentModule === mod.id ? 'var(--color-paper)' : (isModuleUnlocked(mod.id) ? 'var(--color-ink)' : 'var(--color-muted)'),
              opacity: isModuleUnlocked(mod.id) ? 1 : 0.5,
            }}
            title={mod.title}
          >
            {mod.id}
          </button>
        ))}
      </div>
    );
  }

  return (
    <aside
      className="w-60 border-r overflow-y-auto flex-shrink-0 hidden lg:block"
      style={{ backgroundColor: 'var(--color-paper)', borderColor: 'var(--color-rule)' }}
    >
      <div className="p-3 space-y-1.5">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-semibold px-2" style={{ color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Modules
          </h2>
          <button
            onClick={toggleSidebar}
            className="w-6 h-6 rounded-lg flex items-center justify-center"
            style={{ color: 'var(--color-muted)' }}
            title="Collapse sidebar"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>
        {modules.map((mod) => (
          <button
            key={mod.id}
            onClick={() => handleModuleClick(mod.id)}
            className="w-full text-left p-2.5 rounded-lg transition-all"
            disabled={!isModuleUnlocked(mod.id)}
            aria-label={`Module ${mod.id}: ${mod.title}${!isModuleUnlocked(mod.id) ? ' (locked)' : ''}`}
            style={{
              backgroundColor: currentModule === mod.id ? 'rgba(75,160,195,0.10)' : 'transparent',
              borderLeft: currentModule === mod.id ? '3px solid var(--color-accent)' : '3px solid transparent',
              opacity: isModuleUnlocked(mod.id) ? 1 : 0.6,
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm" style={{ backgroundColor: mod.color || 'var(--color-accent)', color: 'var(--color-paper)', fontFamily: 'var(--font-mono)', opacity: isModuleUnlocked(mod.id) ? 1 : 0.5 }}>
                {mod.id}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate" style={{ color: 'var(--color-ink)', fontSize: '0.875rem', opacity: isModuleUnlocked(mod.id) ? 1 : 0.5 }}>{mod.title}</p>
              </div>
              {!isModuleUnlocked(mod.id) ? (
                <Lock className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-muted)' }} />
              ) : moduleProgress[mod.id]?.completed ? (
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--color-emerald)' }} />
              ) : currentModule === mod.id ? (
                <ChevronRight className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--color-accent)' }} />
              ) : (
                <Circle className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--color-muted)' }} />
              )}
            </div>
          </button>
        ))}
        <button
          onClick={() => { onShowBridge?.(); }}
          className="w-full text-left p-3 rounded-xl transition-all mt-4 border-t"
          style={{ borderColor: 'var(--color-rule)' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(140, 100, 215, 0.12)' }}>
              <Link2 className="w-4 h-4" style={{ color: 'var(--color-violet)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium" style={{ color: 'var(--color-ink)', fontSize: '0.875rem' }}>Concept Map</p>
              <p className="text-xs" style={{ color: 'var(--color-muted)' }}>See how concepts connect</p>
            </div>
          </div>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;