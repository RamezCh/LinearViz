import { useEffect, useRef, useState, Component, ReactNode } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

class FormulaErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Formula rendering error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="px-4 py-3 rounded-lg" style={{ backgroundColor: 'rgba(220,75,55,0.08)', border: '1px solid rgba(220,75,55,0.2)' }}>
          <p className="text-sm font-mono" style={{ color: 'oklch(52% 0.16 25)', fontFamily: 'var(--font-mono)' }}>
            Invalid LaTeX: {this.state.error?.message || 'Unknown error'}
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

export function FormulaErrorBoundaryWrapper({ children, onError }) {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState(null);

  if (hasError) {
    return (
      <div className="px-4 py-3 rounded-lg" style={{ backgroundColor: 'rgba(220,75,55,0.08)', border: '1px solid rgba(220,75,55,0.2)' }}>
        <p className="text-sm font-mono" style={{ color: 'oklch(52% 0.16 25)', fontFamily: 'var(--font-mono)' }}>
          Invalid LaTeX: {error?.message || 'Unknown error'}
        </p>
      </div>
    );
  }

  return children;
}

export function FormulaRenderer({
  expression,
  displayMode = false,
  className = '',
  errorClassName = 'text-sm px-4 py-3 rounded-lg',
  fontSize = 'auto',
  alignment = 'center',
  throwOnError = false,
}) {
  const containerRef = useRef(null);
  const [error, setError] = useState(null);
  const [html, setHtml] = useState('');

  useEffect(() => {
    if (!expression) {
      setHtml('');
      setError(null);
      return;
    }

    try {
      const rendered = katex.renderToString(expression, {
        displayMode,
        throwOnError,
        errorColor: '#dc2626',
        strict: false,
        trust: true,
        macros: {
          '\\vec': '\\mathbf{#1}',
          '\\R': '\\mathbb{R}',
          '\\N': '\\mathbb{N}',
          '\\Z': '\\mathbb{Z}',
          '\\C': '\\mathbb{C}',
          '\\norm': '\\left\\|#1\\right\\|',
          '\\abs': '\\left|#1\\right|',
          '\\floor': '\\lfloor #1 \\rfloor',
          '\\ceil': '\\lceil #1 \\rceil',
          '\\given': '\\mid',
        },
      });
      setHtml(rendered);
      setError(null);
    } catch (err) {
      setError(err);
      setHtml('');
      if (throwOnError) {
        throw err;
      }
    }
  }, [expression, displayMode, throwOnError]);

  if (error && !throwOnError) {
    return (
      <div className={errorClassName} style={{ backgroundColor: 'rgba(220,75,55,0.08)', border: '1px solid rgba(220,75,55,0.2)' }}>
        <span className="text-xs" style={{ color: 'var(--color-red)', fontFamily: 'var(--font-mono)' }}>
          LaTeX Error: {error.message}
        </span>
      </div>
    );
  }

  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
    auto: '',
  };

  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  return (
    <div
      ref={containerRef}
      className={`formula-renderer ${className}`}
      style={{ fontSize: fontSize !== 'auto' ? fontSize : undefined }}
    >
      <div
        className={`katex-wrapper ${sizeClasses[fontSize] || ''} ${alignClasses[alignment] || ''}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}

export function InlineFormula({ expression, className = '', ...props }) {
  return (
    <FormulaRenderer
      expression={expression}
      displayMode={false}
      className={`inline-formula ${className}`}
      {...props}
    />
  );
}

export function DisplayFormula({ expression, className = '', ...props }) {
  return (
    <div className="display-formula-container my-4">
      <FormulaRenderer
        expression={expression}
        displayMode={true}
        className={`display-formula ${className}`}
        {...props}
      />
    </div>
  );
}

export function FormulaWithLabel({ label, formula, labelPosition = 'top', className = '' }) {
  return (
    <div className={`formula-with-label ${className}`}>
      {label && labelPosition === 'top' && (
        <span className="block text-xs font-medium mb-1 uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>
          {label}
        </span>
      )}
      <DisplayFormula expression={formula} />
      {label && labelPosition === 'bottom' && (
        <span className="block text-xs font-medium mt-1 uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>
          {label}
        </span>
      )}
    </div>
  );
}

export function MultiLineFormula({ lines, className = '' }) {
  return (
    <div className={`multiline-formula ${className}`}>
      {lines.map((line, index) => (
        <div key={index} className="py-1">
          {line.label && (
            <span className="inline-block w-24 text-sm font-mono" style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
              {line.label}
            </span>
          )}
          <span className={line.label ? 'ml-4' : ''}>
            <InlineFormula expression={line.expression} />
          </span>
        </div>
      ))}
    </div>
  );
}

export default FormulaRenderer;