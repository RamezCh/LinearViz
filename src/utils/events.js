const listeners = new Set();

export function subscribe(callback) {
  if (typeof callback !== 'function') {
    throw new Error('Callback must be a function');
  }
  listeners.add(callback);
  return () => unsubscribe(callback);
}

export function unsubscribe(callback) {
  listeners.delete(callback);
}

export function emit(event) {
  const timestamp = Date.now();
  const eventData = {
    ...event,
    timestamp,
    id: `${timestamp}-${Math.random().toString(36).substr(2, 9)}`,
  };

  listeners.forEach((listener) => {
    try {
      listener(eventData);
    } catch (error) {
      console.error('Error in highlight event listener:', error);
    }
  });

  return eventData;
}

export function emitTermHighlight(term, value, metadata = {}) {
  return emit({
    type: 'TERM_HIGHLIGHT',
    term,
    value,
    metadata,
  });
}

export function emitValueHighlight(term, value, metadata = {}) {
  return emit({
    type: 'VALUE_HIGHLIGHT',
    term,
    value,
    metadata,
  });
}

export function emitFormulaUpdate(formulaId, renderedLatex, variables = {}) {
  return emit({
    type: 'FORMULA_UPDATE',
    formulaId,
    renderedLatex,
    variables,
  });
}

export function emitStepComplete(stepId, moduleId, data = {}) {
  return emit({
    type: 'STEP_COMPLETE',
    stepId,
    moduleId,
    ...data,
  });
}

export function emitModuleComplete(moduleId, stats = {}) {
  return emit({
    type: 'MODULE_COMPLETE',
    moduleId,
    timestamp: Date.now(),
    stats,
  });
}

class FormulaEventEmitter {
  constructor() {
    this.listeners = new Set();
    this.eventHistory = [];
    this.maxHistorySize = 50;
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.unsubscribe(callback);
  }

  unsubscribe(callback) {
    this.listeners.delete(callback);
  }

  emit(event) {
    const eventData = {
      ...event,
      timestamp: Date.now(),
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    this.eventHistory.push(eventData);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    this.listeners.forEach((listener) => {
      try {
        listener(eventData);
      } catch (error) {
        console.error('Error in formula event listener:', error);
      }
    });

    return eventData;
  }

  getHistory(type = null, limit = null) {
    let history = type
      ? this.eventHistory.filter((e) => e.type === type)
      : this.eventHistory;

    if (limit) {
      history = history.slice(-limit);
    }

    return history;
  }

  clearHistory() {
    this.eventHistory = [];
  }

  highlightTerm(term, value, metadata = {}) {
    return this.emit({
      type: 'TERM_HIGHLIGHT',
      term,
      value,
      metadata,
    });
  }

  highlightValue(term, value, metadata = {}) {
    return this.emit({
      type: 'VALUE_HIGHLIGHT',
      term,
      value,
      metadata: { ...metadata, isValue: true },
    });
  }

  updateFormula(formulaId, latex, variables = {}) {
    return this.emit({
      type: 'FORMULA_UPDATE',
      formulaId,
      latex,
      variables,
    });
  }

  stepComplete(stepId, moduleId, data = {}) {
    return this.emit({
      type: 'STEP_COMPLETE',
      stepId,
      moduleId,
      ...data,
    });
  }

  moduleComplete(moduleId, stats = {}) {
    return this.emit({
      type: 'MODULE_COMPLETE',
      moduleId,
      stats,
    });
  }
}

export const formulaEvents = new FormulaEventEmitter();

export function createHighlightHandler(elementId, term) {
  return (value, metadata = {}) => {
    emitTermHighlight(term, value, { ...metadata, elementId });
  };
}

export function createValueHandler(elementId, term) {
  return (value, metadata = {}) => {
    emitValueHighlight(term, value, { ...metadata, elementId });
  };
}