import { useStore } from '../../store/useStore';
import { CheckCircle2 } from 'lucide-react';

export function CompletionToggle({ moduleId = null, className = '' }) {
  const { currentModule, moduleProgress, completeCurrentModule, markModuleIncomplete } = useStore();
  const id = moduleId ?? currentModule;
  const isCompleted = moduleProgress[id]?.completed;

  const handleToggle = () => {
    if (isCompleted) {
      markModuleIncomplete(id);
    } else {
      completeCurrentModule();
    }
  };

  return (
    <button
      onClick={handleToggle}
      className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium transition-all ${className}`}
      style={isCompleted
        ? { backgroundColor: 'rgba(220,75,55,0.08)', color: 'var(--color-red)' }
        : { backgroundColor: 'rgba(75,180,140,0.12)', color: 'var(--color-emerald)' }
      }
    >
      <CheckCircle2 className="w-4 h-4" />
      {isCompleted ? 'Mark Incomplete' : 'Complete Module'}
    </button>
  );
}

export default CompletionToggle;