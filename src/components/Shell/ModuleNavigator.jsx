import { useStore } from '../../store/useStore';
import { modules, getNextModule, getPreviousModule, isModuleUnlocked } from '../../data/modules';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Lock, CheckCircle2 } from 'lucide-react';

export function ModuleNavigator({ onNavigate }) {
  const { currentModule, moduleProgress, darkMode, setCurrentModule } = useStore();

  const currentModuleData = modules.find((m) => m.id === currentModule);
  const previousModule = getPreviousModule(currentModule);
  const nextModule = getNextModule(currentModule);

  const previousUnlocked = previousModule
    ? isModuleUnlocked(previousModule.id, moduleProgress)
    : false;
  const nextUnlocked = nextModule ? isModuleUnlocked(nextModule.id, moduleProgress) : false;

  const previousProgress = previousModule?.id
    ? moduleProgress[previousModule.id]
    : null;
  const nextProgress = nextModule?.id ? moduleProgress[nextModule.id] : null;

  const currentProgress = moduleProgress[currentModule] || {
    completed: false,
    stepsCompleted: 0,
  };

  const progressPercent =
    (currentProgress.stepsCompleted / (currentModuleData?.guidedSteps?.length || 1)) * 100;

  const handlePrevious = () => {
    if (previousModule && previousUnlocked && onNavigate) {
      onNavigate(previousModule.id);
    } else if (previousModule && previousUnlocked) {
      setCurrentModule(previousModule.id);
    }
  };

  const handleNext = () => {
    if (nextModule && nextUnlocked && onNavigate) {
      onNavigate(nextModule.id);
    } else if (nextModule && nextUnlocked) {
      setCurrentModule(nextModule.id);
    }
  };

  return (
    <div
      className="rounded-xl p-5"
      style={{ backgroundColor: darkMode ? 'var(--color-paper-2)' : 'var(--color-paper)' }}
    >
      <div className="flex items-center justify-between mb-4 gap-3">
        <h3
          className="text-base font-bold"
          style={{ color: darkMode ? 'var(--color-paper)' : 'var(--color-ink)' }}
        >
          Module Navigation
        </h3>
        <div className="text-xs" style={{ color: 'var(--color-muted)' }}>
          {Object.values(moduleProgress).filter((p) => p.completed).length} / {modules.length} complete
        </div>
      </div>

      <div
        className="p-4 rounded-xl mb-4"
        style={{ backgroundColor: darkMode ? 'var(--color-paper-2)' : 'var(--color-paper-2)' }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold"
            style={{ backgroundColor: currentModuleData?.color, color: 'var(--color-paper)' }}
          >
            {currentModule}
          </div>
          <div className="flex-1">
            <h4
              className="font-bold text-lg"
              style={{ color: darkMode ? 'var(--color-paper)' : 'var(--color-ink)' }}
            >
              {currentModuleData?.title}
            </h4>
            <p
              className="text-sm"
              style={{ color: 'var(--color-muted)' }}
            >
              {currentModuleData?.description}
            </p>
          </div>
        </div>

        <div
          className="h-2 rounded-full overflow-hidden"
          style={{ backgroundColor: darkMode ? 'var(--color-paper-3)' : 'var(--color-paper-3)' }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: currentModuleData?.color }}
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        <div className="flex justify-between mt-1.5">
          <span
            className="text-sm"
            style={{ color: 'var(--color-muted)' }}
          >
            {currentProgress.stepsCompleted} / {currentModuleData?.guidedSteps?.length || 0} steps
          </span>
          {currentProgress.completed && (
            <span className="flex items-center gap-1 text-sm" style={{ color: 'var(--color-emerald)' }}>
              <CheckCircle2 className="w-4 h-4" />
              Completed
            </span>
          )}
        </div>
      </div>

      <div className="flex items-stretch gap-3">
        <button
          onClick={handlePrevious}
          disabled={!previousModule || !previousUnlocked}
          className={`flex-1 flex items-center gap-3 p-3 rounded-xl transition-all ${
            !previousModule || !previousUnlocked ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          style={(!previousModule || !previousUnlocked) ? {} : {
            backgroundColor: darkMode ? 'var(--color-paper-2)' : 'var(--color-paper-2)',
          }}
          onMouseEnter={(e) => {
            if (previousModule && previousUnlocked) {
              e.currentTarget.style.backgroundColor = darkMode ? 'var(--color-paper-3)' : 'var(--color-paper-3)';
            }
          }}
          onMouseLeave={(e) => {
            if (previousModule && previousUnlocked) {
              e.currentTarget.style.backgroundColor = darkMode ? 'var(--color-paper-2)' : 'var(--color-paper-2)';
            }
          }}
        >
          {previousModule ? (
            <>
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center font-bold"
                style={{ backgroundColor: previousModule.color, color: 'var(--color-paper)' }}
              >
                {previousModule.id}
              </div>
              <div className="flex-1 text-left">
                <div className="text-xs font-medium" style={{ color: 'var(--color-muted)' }}>
                  Previous
                </div>
                <div
                  className="font-medium"
                  style={{ color: darkMode ? 'var(--color-paper)' : 'var(--color-ink)' }}
                >
                  {previousModule.title}
                </div>
              </div>
              {previousProgress?.completed ? (
                <CheckCircle2 className="w-5 h-5" style={{ color: 'var(--color-emerald)' }} />
              ) : (
                <ChevronLeft className="w-5 h-5" />
              )}
            </>
          ) : (
            <div className="flex-1 text-center" style={{ color: 'var(--color-muted)' }}>No previous module</div>
          )}
        </button>

        <button
          onClick={handleNext}
          disabled={!nextModule || !nextUnlocked}
          className={`flex-1 flex items-center gap-3 p-3 rounded-xl transition-all ${
            !nextModule || !nextUnlocked ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          style={(!nextModule || !nextUnlocked) ? {} : {
            backgroundColor: darkMode ? 'var(--color-paper-2)' : 'var(--color-paper-2)',
          }}
          onMouseEnter={(e) => {
            if (nextModule && nextUnlocked) {
              e.currentTarget.style.backgroundColor = darkMode ? 'var(--color-paper-3)' : 'var(--color-paper-3)';
            }
          }}
          onMouseLeave={(e) => {
            if (nextModule && nextUnlocked) {
              e.currentTarget.style.backgroundColor = darkMode ? 'var(--color-paper-2)' : 'var(--color-paper-2)';
            }
          }}
        >
          {nextModule ? (
            <>
              {nextProgress?.completed ? (
                <CheckCircle2 className="w-5 h-5" style={{ color: 'var(--color-emerald)' }} />
              ) : (
                <ChevronRight className="w-5 h-5" />
              )}
              <div className="flex-1 text-right">
                <div className="text-xs font-medium" style={{ color: 'var(--color-muted)' }}>
                  Next
                </div>
                <div
                  className="font-medium"
                  style={{ color: darkMode ? 'var(--color-paper)' : 'var(--color-ink)' }}
                >
                  {nextModule.title}
                </div>
              </div>
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center font-bold"
                style={{ backgroundColor: nextModule.color, color: 'var(--color-paper)' }}
              >
                {nextModule.id}
              </div>
            </>
          ) : (
            <div className="flex-1 text-center" style={{ color: 'var(--color-muted)' }}>No next module</div>
          )}
        </button>
      </div>

      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {modules.map((module) => {
          const isCompleted = moduleProgress[module.id]?.completed;
          const isCurrent = module.id === currentModule;
          const isUnlocked = isModuleUnlocked(module.id, moduleProgress);

          return (
            <button
              key={module.id}
              onClick={() => {
                if (isUnlocked) {
                  if (onNavigate) onNavigate(module.id);
                  else setCurrentModule(module.id);
                }
              }}
              disabled={!isUnlocked}
              className={`w-10 h-10 rounded-xl font-bold text-sm transition-all ${
                isCurrent ? 'ring-2 ring-offset-2' : ''
              } ${!isUnlocked ? 'cursor-not-allowed' : ''}`}
              style={{
                backgroundColor: isCurrent || isCompleted ? module.color : (isUnlocked ? (darkMode ? 'var(--color-paper-2)' : 'var(--color-paper-3)') : (darkMode ? 'var(--color-paper-2)' : 'var(--color-paper)')),
                color: isCurrent || isCompleted || (isUnlocked && darkMode) ? 'var(--color-paper)' : 'var(--color-ink)',
                opacity: !isUnlocked ? 0.6 : 1,
                '--tw-ring-color': isCurrent ? module.color : undefined,
              }}
              onMouseEnter={(e) => {
                if (isUnlocked && !isCurrent) {
                  e.currentTarget.style.backgroundColor = darkMode ? 'var(--color-paper-3)' : 'var(--color-paper-3)';
                }
              }}
              onMouseLeave={(e) => {
                if (isUnlocked && !isCurrent) {
                  e.currentTarget.style.backgroundColor = isCurrent || isCompleted ? module.color : (isUnlocked ? (darkMode ? 'var(--color-paper-2)' : 'var(--color-paper-3)') : (darkMode ? 'var(--color-paper-2)' : 'var(--color-paper)'));
                }
              }}
            >
              {isUnlocked ? (
                isCompleted ? (
                  <CheckCircle2 className="w-5 h-5 mx-auto" />
                ) : (
                  module.id
                )
              ) : (
                <Lock className="w-4 h-4 mx-auto" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default ModuleNavigator;