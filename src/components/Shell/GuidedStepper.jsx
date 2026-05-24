import { useStore } from '../../store/useStore';
import { modules } from '../../data/modules';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { useState, useCallback } from 'react';
import katex from 'katex';

function HighlightedFormula({ formula, highlightedTerms = [] }) {
  if (!formula) return null;

  let processedFormula = formula;
  highlightedTerms.forEach((term) => {
    const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedTerm})`, 'g');
    processedFormula = processedFormula.replace(regex, '%%HIGHLIGHT%%$1%%ENDHIGHLIGHT%%');
  });

  const parts = processedFormula.split('%%HIGHLIGHT%%');
  const result = [];

  parts.forEach((part, index) => {
    if (index > 0) {
      result.push(
        <span key={`highlight-${index}`} className="px-1.5 py-0.5 rounded font-semibold transition-all duration-300"
          style={{ backgroundColor: 'rgba(75,160,195,0.25)', color: 'var(--color-accent)' }}>
          {part.split('%%ENDHIGHLIGHT%%')[0]}
        </span>
      );
      const afterHighlight = part.split('%%ENDHIGHLIGHT%%')[1];
      if (afterHighlight) result.push(afterHighlight);
    } else {
      const endParts = part.split('%%ENDHIGHLIGHT%%');
      if (endParts.length > 1) {
        result.push(endParts[0]);
        result.push(
          <span key={`highlight-after-${index}`} className="px-1.5 py-0.5 rounded font-semibold transition-all duration-300"
            style={{ backgroundColor: 'rgba(75,160,195,0.25)', color: 'var(--color-accent)' }}>
            {endParts[1]}
          </span>
        );
      } else {
        result.push(part);
      }
    }
  });

  return (
    <div className="text-center text-xl lg:text-2xl" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-ink)' }}>
      {result}
    </div>
  );
}

export function GuidedStepper() {
  const { currentModule, moduleProgress, updateProgress, markModuleComplete } = useStore();
  const [currentStep, setCurrentStep] = useState(0);

  const moduleData = modules.find((m) => m.id === currentModule);
  const steps = moduleData?.guidedSteps || [];
  const totalSteps = steps.length;
  const stepData = steps[currentStep];
  const isLastStep = currentStep === totalSteps - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = useCallback(() => {
    if (isLastStep) {
      markModuleComplete?.(currentModule);
      updateProgress?.(currentModule, totalSteps, true);
    } else {
      setCurrentStep((prev) => prev + 1);
      updateProgress?.(currentModule, currentStep + 1);
    }
  }, [currentStep, currentModule, isLastStep, totalSteps, updateProgress, markModuleComplete]);

  const handleBack = useCallback(() => {
    if (!isFirstStep) setCurrentStep((prev) => prev - 1);
  }, [isFirstStep]);

  const progressPercent = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0;
  const highlightedTerms = stepData?.formula
    ? [...new Set(stepData.formula.match(/[a-zA-Z_]+/g)?.filter((t) => t.length > 1) || [])]
    : [];

  return (
    <div className="h-full rounded-xl p-5 flex flex-col" style={{ backgroundColor: 'var(--color-paper)' }}>
      <div className="flex items-center justify-between mb-5 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg" style={{ backgroundColor: `${moduleData?.color || 'var(--color-accent)'}20` }}>
            <BookOpen className="w-5 h-5" style={{ color: moduleData?.color || 'var(--color-accent)' }} />
          </div>
          <div>
            <h2 className="font-bold" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-display)' }}>
              {moduleData?.title || 'Module'}
            </h2>
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Guided Learning</p>
          </div>
        </div>
        <div className="px-3 py-1.5 rounded-full text-sm font-medium"
          style={{ backgroundColor: 'var(--color-paper-2)', color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
          {currentStep + 1} / {totalSteps}
        </div>
      </div>

      <div className="h-1.5 rounded-full mb-4 overflow-hidden" style={{ backgroundColor: 'var(--color-paper-2)' }}>
        <motion.div className="h-full rounded-full"
          style={{ backgroundColor: moduleData?.color || 'var(--color-accent)' }}
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="flex-1 rounded-xl p-5 mb-4 min-h-0 overflow-auto"
          style={{ backgroundColor: 'var(--color-paper-2)' }}
        >
          <h3 className="text-lg font-bold mb-2" style={{ color: moduleData?.color || 'var(--color-accent)', fontFamily: 'var(--font-display)' }}>
            {stepData?.title || 'Step Title'}
          </h3>
          <p className="mb-4" style={{ color: 'var(--color-ink-2)', lineHeight: 'var(--lh-relaxed)' }}>
            {stepData?.description || 'Step description will appear here.'}
          </p>
          <div className="p-4 rounded-xl border-2 border-dashed mb-4"
            style={{ borderColor: 'var(--color-rule)', backgroundColor: 'var(--color-paper)' }}>
            <HighlightedFormula formula={stepData?.formula} highlightedTerms={highlightedTerms} />
          </div>
          <div className="flex flex-wrap gap-2">
            {highlightedTerms.map((term, index) => (
              <motion.span key={term}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="px-3 py-1.5 rounded-lg text-sm font-medium"
                style={{ backgroundColor: `${moduleData?.color || 'var(--color-accent)'}20`, color: moduleData?.color || 'var(--color-accent)' }}>
                {term}
              </motion.span>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center gap-3 pt-2">
        <button onClick={handleBack} disabled={isFirstStep}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all"
          style={isFirstStep
            ? { opacity: 0.5, cursor: 'not-allowed', backgroundColor: 'var(--color-paper-2)', color: 'var(--color-muted)' }
            : { backgroundColor: 'var(--color-paper-2)', color: 'var(--color-muted)' }}>
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex-1" />
        <button onClick={handleNext}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-white transition-all hover:opacity-90"
          style={{ backgroundColor: moduleData?.color || 'var(--color-accent)', color: 'var(--color-paper)' }}>
          {isLastStep ? 'Complete' : 'Next'} <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default GuidedStepper;