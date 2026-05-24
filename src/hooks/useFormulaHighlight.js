import { useEffect, useState, useCallback } from 'react';
import { subscribe, unsubscribe } from '../utils/events';

export function useFormulaHighlight() {
  const [highlights, setHighlights] = useState(new Map());
  const [recentEvents, setRecentEvents] = useState([]);

  useEffect(() => {
    const handleEvent = (event) => {
      if (event.type === 'TERM_HIGHLIGHT' || event.type === 'VALUE_HIGHLIGHT') {
        setHighlights((prev) => {
          const next = new Map(prev);
          next.set(event.term, {
            value: event.value,
            type: event.type,
            timestamp: event.timestamp,
            id: event.id,
            metadata: event.metadata,
          });
          return next;
        });

        setRecentEvents((prev) => [...prev.slice(-9), event]);

        if (event.metadata?.duration && event.metadata.duration > 0) {
          const timeoutId = setTimeout(() => {
            setHighlights((prev) => {
              const next = new Map(prev);
              if (next.get(event.term)?.id === event.id) {
                next.delete(event.term);
              }
              return next;
            });
          }, event.metadata.duration);

          return () => clearTimeout(timeoutId);
        }
      }
    };

    const unsubscribeFn = subscribe(handleEvent);
    return unsubscribeFn;
  }, []);

  const getHighlight = useCallback((term) => {
    return highlights.get(term);
  }, [highlights]);

  const isHighlighted = useCallback((term) => {
    return highlights.has(term);
  }, [highlights]);

  const clearHighlight = useCallback((term) => {
    setHighlights((prev) => {
      const next = new Map(prev);
      next.delete(term);
      return next;
    });
  }, []);

  const clearAllHighlights = useCallback(() => {
    setHighlights(new Map());
  }, []);

  const getActiveTerms = useCallback(() => {
    return Array.from(highlights.keys());
  }, [highlights]);

  const getHighlightsByType = useCallback((type) => {
    const result = {};
    highlights.forEach((value, key) => {
      if (value.type === type) {
        result[key] = value;
      }
    });
    return result;
  }, [highlights]);

  return {
    highlights,
    recentEvents,
    getHighlight,
    isHighlighted,
    clearHighlight,
    clearAllHighlights,
    getActiveTerms,
    getHighlightsByType,
    termHighlight: (term, value, metadata = {}) => ({
      type: 'TERM_HIGHLIGHT',
      term,
      value,
      metadata,
    }),
    valueHighlight: (term, value, metadata = {}) => ({
      type: 'VALUE_HIGHLIGHT',
      term,
      value,
      metadata: { ...metadata, isValue: true },
    }),
  };
}

export function useHighlightValue(term, defaultValue = null) {
  const { isHighlighted, getHighlight } = useFormulaHighlight();
  const [value, setValue] = useState(defaultValue);

  const highlight = useCallback((newValue, metadata = {}) => {
    setValue(newValue);
  }, []);

  return {
    value,
    setValue: highlight,
    isHighlighted: isHighlighted(term),
    highlightData: getHighlight(term),
  };
}

export function useMultiHighlight(terms) {
  const [values, setValues] = useState(
    terms.reduce((acc, term) => {
      acc[term] = null;
      return acc;
    }, {})
  );

  useEffect(() => {
    const handleEvent = (event) => {
      if ((event.type === 'TERM_HIGHLIGHT' || event.type === 'VALUE_HIGHLIGHT') &&
          terms.includes(event.term)) {
        setValues((prev) => ({
          ...prev,
          [event.term]: event.value,
        }));
      }
    };

    const unsubscribeFn = subscribe(handleEvent);
    return unsubscribeFn;
  }, [terms]);

  const setTermValue = useCallback((term, value) => {
    if (terms.includes(term)) {
      setValues((prev) => ({ ...prev, [term]: value }));
    }
  }, [terms]);

  return {
    values,
    setTermValue,
    setMultipleValues: setValues,
  };
}

export function useHighlightAnimation(term, baseClassName = 'transition-all duration-300') {
  const { isHighlighted, getHighlight } = useFormulaHighlight();
  const [animationClass, setAnimationClass] = useState('');

  useEffect(() => {
    if (isHighlighted(term)) {
      setAnimationClass('animate-pulse-glow');
    } else {
      setAnimationClass('');
    }
  }, [isHighlighted(term), term]);

  return {
    animationClass,
    isActive: isHighlighted(term),
    highlightData: getHighlight(term),
    baseClassName,
    combinedClassName: `${baseClassName} ${animationClass}`,
  };
}