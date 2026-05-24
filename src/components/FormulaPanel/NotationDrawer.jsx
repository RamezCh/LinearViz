import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, ChevronRight, Book, Hash, Calculator, Grid, ArrowRight, Sigma, Braces } from 'lucide-react';

const NOTATION_CATEGORIES = [
  {
    id: 'vectors',
    title: 'Vectors',
    icon: ArrowRight,
    color: 'var(--color-violet)',
    notations: [
      { symbol: '\\vec{v}', name: 'Vector', description: 'A vector with arrow notation' },
      { symbol: '\\|\\vec{v}\\|', name: 'Magnitude', description: 'Length/norm of vector v' },
      { symbol: '\\hat{v}', name: 'Unit Vector', description: 'Vector with magnitude 1' },
      { symbol: '\\vec{v} \\cdot \\vec{w}', name: 'Dot Product', description: 'Scalar product of two vectors' },
      { symbol: '\\vec{v} \\times \\vec{w}', name: 'Cross Product', description: 'Vector product in 3D' },
      { symbol: 'proj_{\\vec{u}}\\vec{v}', name: 'Projection', description: 'Projection of v onto u' },
      { symbol: '\\vec{0}', name: 'Zero Vector', description: 'Vector with all zero components' },
    ],
  },
  {
    id: 'matrices',
    title: 'Matrices',
    icon: Grid,
    color: 'var(--color-pink)',
    notations: [
      { symbol: '[A]', name: 'Matrix', description: 'A 2D array of numbers' },
      { symbol: 'A^T', name: 'Transpose', description: 'Rows and columns flipped' },
      { symbol: 'A^{-1}', name: 'Inverse', description: 'Matrix inverse satisfying AA⁻¹ = I' },
      { symbol: 'A^*', name: 'Adjugate', description: 'Transpose of cofactor matrix' },
      { symbol: 'A^T A', name: 'Gram Matrix', description: 'Product of transpose and matrix' },
      { symbol: '[I]', name: 'Identity Matrix', description: 'Matrix with 1s on diagonal' },
      { symbol: '[0]', name: 'Zero Matrix', description: 'Matrix with all zeros' },
    ],
  },
  {
    id: 'operations',
    title: 'Operations',
    icon: Calculator,
    color: 'var(--color-cyan)',
    notations: [
      { symbol: '\\det(A) \\text{ or } |A|', name: 'Determinant', description: 'Scalar value from matrix' },
      { symbol: '\\text{tr}(A)', name: 'Trace', description: 'Sum of diagonal elements' },
      { symbol: '\\text{rank}(A)', name: 'Rank', description: 'Number of linearly independent rows/columns' },
      { symbol: '\\text{null}(A)', name: 'Null Space', description: 'Set of vectors mapping to zero' },
      { symbol: '\\text{col}(A)', name: 'Column Space', description: 'Span of matrix columns' },
      { symbol: '\\lambda', name: 'Eigenvalue', description: 'Scalar scaling factor for eigenvector' },
    ],
  },
  {
    id: 'eigen',
    title: 'Eigenvalues & Eigenvectors',
    icon: Sigma,
    color: 'var(--color-amber)',
    notations: [
      { symbol: 'A\\vec{v} = \\lambda\\vec{v}', name: 'Eigen Equation', description: 'Defining equation for eigenvectors' },
      { symbol: '\\det(A - \\lambda I) = 0', name: 'Characteristic Equation', description: 'Used to find eigenvalues' },
      { symbol: '\\text{tr}(A) = \\sum\\lambda_i', name: 'Trace Relation', description: 'Trace equals sum of eigenvalues' },
      { symbol: '\\det(A) = \\prod\\lambda_i', name: 'Determinant Relation', description: 'Determinant equals product of eigenvalues' },
      { symbol: 'E_\\lambda', name: 'Eigenspace', description: 'Set of all eigenvectors for eigenvalue λ' },
    ],
  },
  {
    id: 'decompositions',
    title: 'Decompositions',
    icon: Braces,
    color: 'var(--color-emerald)',
    notations: [
      { symbol: 'A = QR', name: 'QR Decomposition', description: 'Orthogonal times upper triangular' },
      { symbol: 'A = U\\Sigma V^T', name: 'SVD', description: 'Singular Value Decomposition' },
      { symbol: 'A = PDP^{-1}', name: 'Eigendecomposition', description: 'Diagonalization when possible' },
      { symbol: 'A = LU', name: 'LU Decomposition', description: 'Lower times upper triangular' },
      { symbol: 'A = Q\\Lambda Q^T', name: 'Spectral Theorem', description: 'Symmetric matrix decomposition' },
    ],
  },
  {
    id: 'sets',
    title: 'Sets & Spaces',
    icon: Hash,
    color: 'var(--color-accent)',
    notations: [
      { symbol: '\\mathbb{R}^n', name: 'Real n-space', description: 'n-dimensional real vector space' },
      { symbol: '\\mathbb{C}^n', name: 'Complex n-space', description: 'n-dimensional complex vector space' },
      { symbol: '\\mathbb{R}^{m \\times n}', name: 'Matrix Space', description: 'Space of m×n real matrices' },
      { symbol: 'V^\\perp', name: 'Orthogonal Complement', description: 'All vectors orthogonal to V' },
      { symbol: '\\text{span}\\{\\vec{v}_1, ...\\}', name: 'Span', description: 'All linear combinations of vectors' },
    ],
  },
];

export function NotationDrawer({ isOpen, onClose, className = '' }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState(new Set(['vectors']));

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return NOTATION_CATEGORIES;

    const query = searchQuery.toLowerCase();
    return NOTATION_CATEGORIES.map((category) => ({
      ...category,
      notations: category.notations.filter(
        (n) =>
          n.name.toLowerCase().includes(query) ||
          n.symbol.toLowerCase().includes(query) ||
          n.description.toLowerCase().includes(query)
      ),
    })).filter((category) => category.notations.length > 0);
  }, [searchQuery]);

  const toggleCategory = (categoryId) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
            className="fixed inset-0 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={`fixed right-0 top-0 h-full w-96 shadow-2xl z-50 flex flex-col ${className}`}
            style={{ backgroundColor: 'var(--color-paper)' }}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--color-rule)' }}>
              <div className="flex items-center gap-3">
                <Book className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
                <h2 className="text-lg font-semibold" style={{ color: 'var(--color-ink)' }}>
                  Notation Reference
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg transition-colors"
                style={{ backgroundColor: 'transparent' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-paper-2)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                aria-label="Close notation drawer"
              >
                <X className="w-5 h-5" style={{ color: 'var(--color-muted)' }} />
              </button>
            </div>

            <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--color-rule)' }}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-muted)' }} />
                <input
                  type="text"
                  placeholder="Search notation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none"
                  style={{
                    backgroundColor: 'var(--color-paper-2)',
                    borderColor: 'var(--color-rule)',
                    color: 'var(--color-ink)'
                  }}
                  onFocus={(e) => e.currentTarget.style.boxShadow = '0 0 0 2px var(--color-accent)'}
                  onBlur={(e) => e.currentTarget.style.boxShadow = 'none'}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {filteredCategories.map((category) => {
                const Icon = category.icon;
                const isExpanded = expandedCategories.has(category.id);

                return (
                  <div className="border rounded-xl overflow-hidden" style={{ borderColor: 'var(--color-rule)' }}>
                    <button
                      onClick={() => toggleCategory(category.id)}
                      className="w-full flex items-center justify-between px-4 py-3 transition-colors"
                      style={{ backgroundColor: 'var(--color-paper-2)' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-paper-3)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-paper-2)'}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5" style={{ color: category.color }} />
                        <span className="font-medium" style={{ color: 'var(--color-ink)' }}>
                          {category.title}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ color: 'var(--color-muted)', backgroundColor: 'var(--color-paper-2)' }}>
                          {category.notations.length}
                        </span>
                      </div>
                      <motion.svg
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="w-5 h-5"
                        style={{ color: 'var(--color-muted)' }}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path d="M6 9l6 6 6-6" />
                      </motion.svg>
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: 'auto' }}
                          exit={{ height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="p-4 space-y-3">
                            {category.notations.map((notation, index) => (
                              <motion.div
                                key={`${category.id}-${index}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="flex items-start gap-3 p-3 rounded-lg"
                                style={{ backgroundColor: 'var(--color-paper-2)' }}
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="font-mono text-sm mb-1" style={{ color: 'var(--color-ink)' }}>
                                    <MathNotation symbol={notation.symbol} />
                                  </div>
                                  <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                                    {notation.name}: {notation.description}
                                  </p>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}

              {filteredCategories.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-center" style={{ color: 'var(--color-muted)' }}>
                    No notation found for "{searchQuery}"
                  </p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t" style={{ borderColor: 'var(--color-rule)', backgroundColor: 'var(--color-paper-2)' }}>
              <p className="text-xs text-center" style={{ color: 'var(--color-muted)' }}>
                Click on any notation to copy the LaTeX code
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function MathNotation({ symbol }) {
  const [html, setHtml] = useState('');

  useMemo(() => {
    import('katex').then((katex) => {
      try {
        const rendered = katex.renderToString(symbol, {
          displayMode: false,
          throwOnError: false,
        });
        setHtml(rendered);
      } catch (error) {
        setHtml(symbol);
      }
    });
  }, [symbol]);

  return (
    <span
      className="math-notation"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

import { useEffect } from 'react';

export function NotationTooltip({ notation, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 5 }}
      className={`
        absolute z-50 p-3
        border rounded-lg shadow-xl min-w-64
        ${className}
      `}
      style={{
        backgroundColor: 'var(--color-paper)',
        borderColor: 'var(--color-rule)'
      }}
    >
      <div className="font-mono text-lg mb-2" style={{ color: 'var(--color-ink)' }}>
        <MathNotation symbol={notation.symbol} />
      </div>
      <p className="text-sm font-medium" style={{ color: 'var(--color-ink)' }}>
        {notation.name}
      </p>
      <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
        {notation.description}
      </p>
    </motion.div>
  );
}

export function NotationSearch({ onSelect, className = '' }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const q = query.toLowerCase();
    const matches = [];

    NOTATION_CATEGORIES.forEach((category) => {
      category.notations.forEach((notation) => {
        if (
          notation.name.toLowerCase().includes(q) ||
          notation.symbol.toLowerCase().includes(q) ||
          notation.description.toLowerCase().includes(q)
        ) {
          matches.push({
            ...notation,
            category: category.title,
          });
        }
      });
    });

    setResults(matches.slice(0, 5));
  }, [query]);

  return (
    <div className={`notation-search ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-muted)' }} />
        <input
          type="text"
          placeholder="Search notation..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none"
          style={{
            backgroundColor: 'var(--color-paper)',
            borderColor: 'var(--color-rule)',
            color: 'var(--color-ink)'
          }}
          onFocus={(e) => e.currentTarget.style.boxShadow = '0 0 0 2px var(--color-accent)'}
          onBlur={(e) => e.currentTarget.style.boxShadow = 'none'}
        />
      </div>

      {results.length > 0 && (
        <div className="mt-2 border rounded-lg shadow-lg overflow-hidden" style={{ backgroundColor: 'var(--color-paper)', borderColor: 'var(--color-rule)' }}>
          {results.map((result, index) => (
            <button
              key={index}
              onClick={() => onSelect?.(result)}
              className="w-full flex items-start gap-3 px-4 py-3 transition-colors text-left"
              style={{ backgroundColor: 'transparent' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-paper-2)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <MathNotation symbol={result.symbol} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium" style={{ color: 'var(--color-ink)' }}>
                  {result.name}
                </p>
                <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                  {result.category}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default NotationDrawer;