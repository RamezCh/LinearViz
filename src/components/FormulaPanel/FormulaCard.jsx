import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FormulaRenderer } from './FormulaRenderer';
import { TermHighlighter, createTermId } from './TermHighlighter';
import { useFormulaHighlight } from '../../hooks/useFormulaHighlight';

export function FormulaCard({
  title,
  subtitle,
  formula,
  explanation,
  terms = [],
  collapsible = true,
  defaultOpen = true,
  variant = 'default',
  icon: Icon,
  headerAction,
  footer,
  className = '',
  cardClassName = '',
  onTermClick,
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const { isHighlighted, getActiveTerms } = useFormulaHighlight();

  const activeHighlightedTerms = getActiveTerms().filter((term) =>
    terms.some((t) => term === t || term.startsWith(t))
  );

  const hasActiveHighlights = activeHighlightedTerms.length > 0;

  const variants = {
    default: 'bg-paper border-color-rule',
    elevated: 'bg-paper border-color-rule shadow-xl',
    outline: 'bg-transparent border-2 border-color-rule',
    ghost: 'bg-transparent border-transparent',
    glass: 'backdrop-blur-sm border-color-rule/50',
  };

  const hasHeader = title || subtitle || Icon || headerAction;

  const handleTermClick = (term) => {
    onTermClick?.(term);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`
        rounded-xl border overflow-hidden
        ${variants[variant]}
        ${hasActiveHighlights ? 'ring-2 ring-accent/50' : ''}
        ${className}
      `}
    >
      {hasHeader && (
        <div
          className={`
            flex items-center justify-between
            px-4 py-3
            ${collapsible ? 'border-b border-color-rule cursor-pointer select-none' : ''}
            ${hasActiveHighlights ? 'bg-accent/5' : ''}
            hover:bg-paper-2
            transition-colors duration-200
          `}
          onClick={collapsible ? () => setIsOpen(!isOpen) : undefined}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {Icon && (
              <motion.div
                className={`
                  w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
                  ${hasActiveHighlights ? 'bg-accent/10' : 'bg-accent/5'}
                `}
                animate={hasActiveHighlights ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.5 }}
              >
                <Icon className="w-5 h-5 text-accent" />
              </motion.div>
            )}
            <div className="min-w-0 flex-1">
              {title && (
                <h3 className="font-semibold text-ink truncate">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-sm text-muted truncate">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {headerAction}
            {activeHighlightedTerms.length > 0 && (
              <span className="px-2 py-1 text-xs font-medium bg-accent/10 text-accent rounded-full">
                {activeHighlightedTerms.length} highlighted
              </span>
            )}
            {collapsible && (
              <motion.svg
                className="w-5 h-5 text-muted"
                animate={{ rotate: isOpen ? 180 : 0 }}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M6 9l6 6 6-6" />
              </motion.svg>
            )}
          </div>
        </div>
      )}

      <AnimatePresence initial={false}>
        {(!collapsible || isOpen) && (
          <motion.div
            initial={collapsible ? { height: 0, opacity: 0 } : false}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="p-4"
          >
            <div className={cardClassName}>
              {formula && (
                <div className="mb-4">
                  <TermHighlighter
                    expression={formula}
                    activeTerms={terms.filter(t => isHighlighted(t)).map(t => t)}
                    renderFormula={({ termSet, highlightedTerm }) => (
                      <FormulaRenderer
                        expression={formula}
                        displayMode={true}
                        className="formula-content"
                      />
                    )}
                    animationEnabled={true}
                    onTermClick={handleTermClick}
                  />
                </div>
              )}

              {explanation && (
                <div className="text-sm text-muted leading-relaxed">
                  {explanation}
                </div>
              )}

              {terms.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {terms.map((term) => (
                    <TermIndicator
                      key={term}
                      term={term}
                      isActive={isHighlighted(term)}
                      onClick={() => handleTermClick(term)}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {footer && (
        <div className="px-4 py-3 border-t border-color-rule bg-paper-2 text-muted text-sm">
          {footer}
        </div>
      )}
    </motion.div>
  );
}

export function TermIndicator({ term, isActive, onClick, className = '' }) {
  const colors = {
    term: { active: 'bg-emerald/10 text-emerald border-emerald', inactive: 'bg-paper-2 text-muted border-color-rule' },
    value: { active: 'bg-amber/10 text-amber border-amber', inactive: 'bg-paper-2 text-muted border-color-rule' },
    vector: { active: 'bg-violet/10 text-violet border-violet', inactive: 'bg-paper-2 text-muted border-color-rule' },
    matrix: { active: 'bg-pink/10 text-pink border-pink', inactive: 'bg-paper-2 text-muted border-color-rule' },
  };

  const type = term.split(':')[0];
  const name = term.split(':')[1] || term;
  const colorScheme = colors[type] || colors.term;

  return (
    <motion.button
      initial={false}
      animate={{
        scale: isActive ? 1.05 : 1,
        backgroundColor: isActive ? undefined : undefined,
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        px-3 py-1.5 text-xs font-medium rounded-full
        border transition-all duration-200
        ${isActive ? colorScheme.active : colorScheme.inactive}
        ${onClick ? 'cursor-pointer' : 'cursor-default'}
        ${className}
      `}
    >
      {name}
    </motion.button>
  );
}

export function FormulaStep({ steps = [], currentStep = 0, className = '' }) {
  return (
    <div className={`formula-step-container ${className}`}>
      {steps.map((step, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{
            opacity: index <= currentStep ? 1 : 0.3,
            x: 0,
          }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
          className={`
            flex items-start gap-3 py-2
            ${index === currentStep ? 'border-l-2 border-accent pl-4 -ml-1' : ''}
          `}
        >
          <div className={`
            w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
            ${index < currentStep ? 'bg-emerald text-white' : index === currentStep ? 'bg-accent text-white' : 'bg-paper-2 text-muted'}
          `}>
            {index + 1}
          </div>
          <div className="flex-1">
            <p className={`text-sm ${index <= currentStep ? 'text-ink' : 'text-muted'}`}>
              {step.title}
            </p>
            {step.formula && index <= currentStep && (
              <div className="mt-1">
                <FormulaRenderer expression={step.formula} displayMode={false} />
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export function InteractiveFormulaCard({
  formula,
  variables = {},
  onVariableChange,
  className = '',
}) {
  return (
    <FormulaCard
      title="Interactive Formula"
      formula={formula}
      className={className}
      footer={
        <div className="space-y-2">
          {Object.entries(variables).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-xs font-mono text-muted">
                {key}
              </span>
              <input
                type="number"
                value={value}
                onChange={(e) => onVariableChange?.(key, parseFloat(e.target.value))}
                className="w-24 px-2 py-1 text-sm font-mono bg-paper-2 border border-color-rule text-ink rounded"
              />
            </div>
          ))}
        </div>
      }
    />
  );
}

export default FormulaCard;