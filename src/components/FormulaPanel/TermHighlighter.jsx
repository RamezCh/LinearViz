import { useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';

export const HIGHLIGHT_COLORS = {
  default:  { bg: 'rgba(75,160,195,0.12)', border: 'oklch(50% 0.12 235)', text: 'oklch(50% 0.12 235)', glow: 'rgba(75,160,195,0.25)' },
  term:     { bg: 'rgba(75,180,140,0.12)', border: 'oklch(52% 0.16 155)', text: 'oklch(52% 0.16 155)', glow: 'rgba(75,180,140,0.25)' },
  value:    { bg: 'rgba(200,155,50,0.10)', border: 'oklch(65% 0.10 70)',  text: 'oklch(65% 0.10 70)',  glow: 'rgba(200,155,50,0.25)' },
  vector:   { bg: 'rgba(129,100,200,0.12)', border: 'oklch(50% 0.12 270)', text: 'oklch(50% 0.12 270)', glow: 'rgba(129,100,200,0.25)' },
  matrix:   { bg: 'rgba(210,85,140,0.12)', border: 'oklch(65% 0.08 340)', text: 'oklch(65% 0.08 340)', glow: 'rgba(210,85,140,0.25)' },
  operation:{ bg: 'rgba(75,195,195,0.10)', border: 'oklch(65% 0.10 195)', text: 'oklch(65% 0.10 195)', glow: 'rgba(75,195,195,0.25)' },
  result:   { bg: 'rgba(75,180,140,0.10)', border: 'oklch(52% 0.16 155)', text: 'oklch(52% 0.16 155)', glow: 'rgba(75,180,140,0.25)' },
  error:    { bg: 'rgba(220,75,55,0.08)',  border: 'oklch(52% 0.16 25)',  text: 'oklch(52% 0.16 25)',  glow: 'rgba(220,75,55,0.25)' },
  interactive:{ bg: 'rgba(100,100,200,0.10)', border: 'oklch(60% 0.10 250)', text: 'oklch(60% 0.10 250)', glow: 'rgba(100,100,200,0.25)' },
};

const TERM_ID_REGEX = /^(term|val|vec|mx|op|res|err|int):(.+)$/;

export function parseTermId(termId) {
  const match = termId.match(TERM_ID_REGEX);
  if (match) {
    return {
      type: match[1],
      name: match[2],
      category: match[1],
    };
  }
  return {
    type: 'default',
    name: termId,
    category: 'default',
  };
}

export function createTermId(type, name) {
  return `${type}:${name}`;
}

export function TermHighlighter({
  expression,
  activeTerms = [],
  className = '',
  renderFormula,
  highlightMode = 'inline',
  animationEnabled = true,
  onTermClick,
}) {
  const termSet = useMemo(() => new Set(activeTerms), [activeTerms]);

  const getHighlightStyles = useCallback(
    (term) => {
      if (!termSet.has(term)) return null;
      const { type } = parseTermId(term);
      const colors = HIGHLIGHT_COLORS[type] || HIGHLIGHT_COLORS.default;
      return {
        style: {
          backgroundColor: colors.bg,
          borderColor: colors.border,
          color: colors.text,
          borderWidth: '1px',
          borderStyle: 'solid',
          borderRadius: '0.375rem',
        },
        type,
        colors,
      };
    },
    [termSet]
  );

  const highlightParts = useMemo(() => {
    if (!expression || activeTerms.length === 0) return null;

    const parts = [];
    const terms = activeTerms;

    terms.forEach((term) => {
      const styles = getHighlightStyles(term);
      if (styles) {
        parts.push({
          term,
          styles,
          ...styles,
        });
      }
    });

    return parts;
  }, [expression, activeTerms, getHighlightStyles]);

  const shouldHighlight = highlightParts && highlightParts.length > 0;

  const highlightVariants = {
    initial: {
      opacity: 0,
      scale: 0.95,
      y: -4,
    },
    animate: {
      opacity: 1,
      scale: 1,
      y: 0,
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: -4,
    },
  };

  if (!shouldHighlight || !renderFormula) {
    return renderFormula ? (
      <span className={className}>{renderFormula({ termSet })}</span>
    ) : (
      <span className={className}>{expression}</span>
    );
  }

  return (
    <span className={`term-highlighter ${className}`}>
      {activeTerms.map((term, index) => {
        const isHighlighted = termSet.has(term);
        if (!isHighlighted) return null;
        const st = getHighlightStyles(term);
        return (
          <motion.span
            key={term}
            variants={animationEnabled ? highlightVariants : {}}
            initial={animationEnabled ? 'initial' : false}
            animate="animate"
            exit={animationEnabled ? 'exit' : false}
            transition={{ duration: 0.3, ease: 'easeOut', delay: index * 0.05 }}
            onClick={() => onTermClick?.(term)}
            style={{ ...(st?.style || {}), cursor: onTermClick ? 'pointer' : 'default', padding: '0.125rem 0.375rem' }}
          >
            {renderFormula({ termSet, highlightedTerm: term })}
          </motion.span>
        );
      })}
      {!shouldHighlight && renderFormula && renderFormula({ termSet })}
    </span>
  );
}

export function TermHighlightBadge({ term, count = 1, className = '' }) {
  const { type, name } = parseTermId(term);
  const colors = HIGHLIGHT_COLORS[type] || HIGHLIGHT_COLORS.default;

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.2 }}
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${className}`}
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors.text, opacity: 0.6 }} />
      <span>{name}</span>
      {count > 1 && (
        <span className="ml-1" style={{ opacity: 0.6 }}>×{count}</span>
      )}
    </motion.span>
  );
}

export function HighlightedValue({ value, term, className = '' }) {
  const { type } = parseTermId(term || 'value:default');
  const colors = HIGHLIGHT_COLORS[type] || HIGHLIGHT_COLORS.value;

  return (
    <motion.span
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`inline-block px-2 py-1 rounded-lg text-sm ${className}`}
      style={{ backgroundColor: colors.bg, color: colors.text, fontFamily: 'var(--font-mono)' }}
    >
      {value}
    </motion.span>
  );
}

export function useTermHighlight(terms, options = {}) {
  const {
    onHighlight,
    onUnhighlight,
    getColorForTerm,
  } = options;

  const getHighlightState = useCallback(
    (term) => {
      return {
        isHighlighted: terms.includes(term),
        color: getColorForTerm?.(term) || HIGHLIGHT_COLORS.default,
      };
    },
    [terms, getColorForTerm]
  );

  const handleTermClick = useCallback(
    (term) => {
      onHighlight?.(term);
    },
    [onHighlight]
  );

  return {
    getHighlightState,
    handleTermClick,
    activeTerms: terms,
    highlightedCount: terms.length,
  };
}

export default TermHighlighter;