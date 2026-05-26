import { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

export function Math({ tex, block = false, className = '', style = {} }) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(tex, {
        displayMode: block,
        throwOnError: false,
        errorColor: '#DC3749',
      });
    } catch (e) {
      return `<span style="color: #DC3749;">${tex}</span>`;
    }
  }, [tex, block]);

  if (block) {
    return (
      <div
        className={`math-block ${className}`}
        style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '12px 16px',
          margin: '8px 0',
          backgroundColor: 'var(--color-paper-2)',
          borderRadius: '8px',
          border: '1px solid var(--color-rule)',
          ...style,
        }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <span
      className={`math-inline ${className}`}
      style={{ display: 'inline', ...style }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export function InlineText({ text, className = '', style = {} }) {
  const html = useMemo(() => {
    const parts = text.split(/(\$[^$]+\$)/g);
    return parts.map((part, i) => {
      if (part.startsWith('$') && part.endsWith('$')) {
        const tex = part.slice(1, -1);
        try {
          return `<span class="math-inline">${katex.renderToString(tex, { displayMode: false, throwOnError: false })}</span>`;
        } catch {
          return part;
        }
      }
      return `<span>${part}</span>`;
    }).join('');
  }, [text]);

  return (
    <span
      className={`inline-text ${className}`}
      style={{ display: 'inline', ...style }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export function MathCard({ title, children, className = '' }) {
  return (
    <div
      className={`math-card ${className}`}
      style={{
        backgroundColor: 'var(--color-paper-2)',
        borderRadius: '10px',
        border: '1px solid var(--color-rule)',
        padding: '12px 16px',
        margin: '8px 0',
      }}
    >
      {title && (
        <div
          style={{
            fontSize: '11px',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--color-muted)',
            marginBottom: '10px',
          }}
        >
          {title}
        </div>
      )}
      {children}
    </div>
  );
}

export function FormulaRow({ label, children }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '13px',
        marginBottom: '6px',
        fontFamily: 'var(--font-mono)',
      }}
    >
      {label && (
        <span style={{ color: 'var(--color-muted)', minWidth: '60px' }}>{label}</span>
      )}
      <span style={{ color: 'var(--color-ink)' }}>{children}</span>
    </div>
  );
}

export function MatrixDisplay({ matrix, highlight = null, className = '' }) {
  if (!matrix || !Array.isArray(matrix) || matrix.length !== 2) return null;

  return (
    <span
      className={`math-inline ${className}`}
      style={{
        display: 'inline',
        fontFamily: 'var(--font-mono)',
        fontSize: '14px',
        fontWeight: '600',
      }}
      dangerouslySetInnerHTML={{
        __html: katex.renderToString(
          `\\begin{pmatrix} ${matrix[0].map((v, j) => `<span style="color: ${highlight === `0${j}` ? '#6366F1' : (j === 0 ? '#4A90E2' : '#7ED321')}">${typeof v === 'number' ? v.toFixed(2) : v}</span>`).join(' & ')} \\\\ ${matrix[1].map((v, j) => `<span style="color: ${highlight === `1${j}` ? '#6366F1' : (j === 0 ? '#4A90E2' : '#7ED321')}">${typeof v === 'number' ? v.toFixed(2) : v}</span>`).join(' & ')} \\end{pmatrix}`,
          { displayMode: false, throwOnError: false }
        )
      }}
    />
  );
}

export function Matrix({ matrix, name = 'M', highlight = null }) {
  if (!matrix || !Array.isArray(matrix) || matrix.length !== 2) return null;

  return (
    <span
      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
      dangerouslySetInnerHTML={{
        __html: katex.renderToString(
          `${name} = \\begin{pmatrix} ${matrix[0].map((v, j) => `<span style="color: ${highlight === `0${j}` ? '#6366F1' : (j === 0 ? '#4A90E2' : '#7ED321')}">${typeof v === 'number' ? v.toFixed(2) : v}</span>`).join(' &amp; ')} \\\\ ${matrix[1].map((v, j) => `<span style="color: ${highlight === `1${j}` ? '#6366F1' : (j === 0 ? '#4A90E2' : '#7ED321')}">${typeof v === 'number' ? v.toFixed(2) : v}</span>`).join(' &amp; ')} \\end{pmatrix}`,
          { displayMode: false, throwOnError: false }
        )
      }}
    />
  );
}