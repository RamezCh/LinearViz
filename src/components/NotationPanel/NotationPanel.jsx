import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, ChevronRight, Book, Hash, ArrowRight, Equal, Grid2x2, Type, BarChart3 } from 'lucide-react';

const notationCategories = [
  {
    id: 'vectors',
    title: 'Vectors',
    icon: Type,
    terms: [
      { symbol: 'v', name: 'Vector', description: 'An ordered list of numbers representing magnitude and direction', example: 'v = [1, 2, 3]' },
      { symbol: '‖v‖', name: 'Magnitude', description: 'The length of a vector', example: '‖v‖ = √(v₁² + v₂² + ...)' },
      { symbol: 'v̂', name: 'Unit Vector', description: 'A vector with magnitude 1', example: 'v̂ = v / ‖v‖' },
      { symbol: 'u · v', name: 'Dot Product', description: 'Sum of element-wise products', example: 'u · v = u₁v₁ + u₂v₂ + ...' },
      { symbol: 'u × v', name: 'Cross Product', description: 'A vector perpendicular to both u and v (3D)', example: 'u × v = [u₂v₃ - u₃v₂, ...]' },
    ],
  },
  {
    id: 'matrices',
    title: 'Matrices',
    icon: Grid2x2,
    terms: [
      { symbol: 'A', name: 'Matrix', description: 'A 2D array of numbers arranged in rows and columns', example: 'A = [[a, b], [c, d]]' },
      { symbol: 'Aᵀ', name: 'Transpose', description: 'Flip a matrix over its diagonal', example: 'Aᵀ[i][j] = A[j][i]' },
      { symbol: 'A⁻¹', name: 'Inverse', description: 'Matrix that when multiplied gives identity', example: 'AA⁻¹ = I' },
      { symbol: 'det(A)', name: 'Determinant', description: 'A scalar value describing area/volume scaling', example: 'det([[a,b],[c,d]]) = ad-bc' },
      { symbol: 'tr(A)', name: 'Trace', description: 'Sum of diagonal elements', example: 'tr(A) = a + d' },
      { symbol: 'I', name: 'Identity Matrix', description: 'Matrix with 1s on diagonal, 0s elsewhere', example: 'AI = IA = A' },
    ],
  },
  {
    id: 'linear-algebra',
    title: 'Linear Algebra',
    icon: BarChart3,
    terms: [
      { symbol: 'Av = λv', name: 'Eigenvalue Equation', description: 'Definition of eigenvalues and eigenvectors', example: 'λ is eigenvalue, v is eigenvector' },
      { symbol: 'det(A - λI) = 0', name: 'Characteristic Equation', description: 'Used to find eigenvalues', example: 'Solve for λ' },
      { symbol: 'A = UΣVᵀ', name: 'SVD Decomposition', description: 'Singular value decomposition', example: 'U, V are orthogonal, Σ is diagonal' },
      { symbol: 'proj_u(v)', name: 'Projection', description: 'Vector v projected onto u', example: 'proj_u(v) = (v·u / u·u)u' },
      { symbol: 'Span{v₁,v₂}', name: 'Span', description: 'All linear combinations of vectors', example: '{c₁v₁ + c₂v₂ | cᵢ ∈ ℝ}' },
      { symbol: 'dim(V)', name: 'Dimension', description: 'Number of vectors in a basis', example: 'dim(ℝⁿ) = n' },
    ],
  },
  {
    id: 'operations',
    title: 'Operations',
    icon: Equal,
    terms: [
      { symbol: '+', name: 'Addition', description: 'Element-wise matrix/vector addition', example: '[a,b] + [c,d] = [a+c, b+d]' },
      { symbol: '×', name: 'Multiplication', description: 'Row-column dot products', example: 'C = AB → C[i][j] = Σₖ A[i][k]B[k][j]' },
      { symbol: '⊕', name: 'Direct Sum', description: 'Block diagonal concatenation', example: 'A ⊕ B = [[A, 0], [0, B]]' },
      { symbol: '⊗', name: 'Kronecker Product', description: 'Block-wise multiplication', example: 'A ⊗ B produces larger matrix' },
    ],
  },
  {
    id: 'special',
    title: 'Special Sets',
    icon: Hash,
    terms: [
      { symbol: 'ℝⁿ', name: 'Real n-space', description: 'n-dimensional space of real numbers', example: 'ℝ² is the 2D plane' },
      { symbol: 'ℂⁿ', name: 'Complex n-space', description: 'n-dimensional space of complex numbers', example: 'Used for complex eigenvalues' },
      { symbol: '0', name: 'Zero Vector/Matrix', description: 'All elements are zero', example: 'v + 0 = v' },
      { symbol: '∅', name: 'Empty Set', description: 'No elements', example: 'null(A) = {0} if A is invertible' },
    ],
  },
];

const moduleMap = {
  'Vectors': '01',
  'Matrices': '02',
  'Transformations': '02',
  'Determinants': '04',
  'Systems': '05',
  'Vector Spaces': '06',
  'Eigenvalues': '07',
  'Orthogonality': '08',
  'SVD': '09',
};

export default function NotationPanel({ isOpen, onClose }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [expandedTerm, setExpandedTerm] = useState(null);

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return notationCategories;
    
    const query = searchQuery.toLowerCase();
    return notationCategories
      .map(category => ({
        ...category,
        terms: category.terms.filter(
          term =>
            term.symbol.toLowerCase().includes(query) ||
            term.name.toLowerCase().includes(query) ||
            term.description.toLowerCase().includes(query)
        ),
      }))
      .filter(category => category.terms.length > 0);
  }, [searchQuery]);

  const totalTerms = notationCategories.reduce((acc, cat) => acc + cat.terms.length, 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40"
            style={{ backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }}
          />
          
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md overflow-hidden flex flex-col"
            style={{ backgroundColor: 'var(--color-paper)', boxShadow: 'var(--shadow-xl)' }}
          >
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--color-rule)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(75,160,195,0.12)' }}>
                  <Book className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
                </div>
                <div>
                  <h2 className="font-bold" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-display)' }}>
                    Notation Reference
                  </h2>
                  <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                    {totalTerms} notation symbols
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                style={{ color: 'var(--color-muted)' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-paper-2)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b" style={{ borderColor: 'var(--color-rule)' }}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-muted)' }} />
                <input
                  type="text"
                  placeholder="Search notation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                  style={{
                    backgroundColor: 'var(--color-paper-2)',
                    border: '1px solid var(--color-rule)',
                    color: 'var(--color-ink)',
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--color-accent)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--color-rule)'}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {filteredCategories.map((category) => (
                <motion.div
                  key={category.id}
                  layout
                  className="rounded-xl overflow-hidden"
                  style={{ backgroundColor: 'var(--color-paper-2)' }}
                >
                  <button
                    onClick={() => setExpandedCategory(expandedCategory === category.id ? null : category.id)}
                    className="w-full flex items-center justify-between p-4 text-left transition-colors"
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-paper-3)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div className="flex items-center gap-3">
                      <category.icon className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
                      <span className="font-semibold" style={{ color: 'var(--color-ink)' }}>
                        {category.title}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--color-rule)', color: 'var(--color-muted)' }}>
                        {category.terms.length}
                      </span>
                    </div>
                    <motion.div
                      animate={{ rotate: expandedCategory === category.id ? 90 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronRight className="w-5 h-5" style={{ color: 'var(--color-muted)' }} />
                    </motion.div>
                  </button>

                  <AnimatePresence>
                    {expandedCategory === category.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="p-2 space-y-1">
                          {category.terms.map((term) => (
                            <button
                              key={term.symbol}
                              onClick={() => setExpandedTerm(expandedTerm === term.symbol ? null : term.symbol)}
                              className="w-full text-left p-3 rounded-lg transition-all"
                              style={{
                                backgroundColor: expandedTerm === term.symbol ? 'var(--color-paper-3)' : 'transparent',
                              }}
                              onMouseEnter={e => {
                                if (expandedTerm !== term.symbol) e.currentTarget.style.backgroundColor = 'rgba(75,160,195,0.06)';
                              }}
                              onMouseLeave={e => {
                                if (expandedTerm !== term.symbol) e.currentTarget.style.backgroundColor = 'transparent';
                              }}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <code
                                  className="text-base font-bold"
                                  style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-accent)' }}
                                >
                                  {term.symbol}
                                </code>
                                <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                                  {term.name}
                                </span>
                              </div>

                              <AnimatePresence>
                                {expandedTerm === term.symbol && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="pt-2 space-y-2">
                                      <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                                        {term.description}
                                      </p>
                                      <div
                                        className="p-2 rounded-lg text-sm font-mono"
                                        style={{ backgroundColor: 'var(--color-paper)', fontFamily: 'var(--font-mono)', color: 'var(--color-ink)' }}
                                      >
                                        {term.example}
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}

              {filteredCategories.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: 'var(--color-paper-2)' }}>
                    <Search className="w-8 h-8" style={{ color: 'var(--color-muted)' }} />
                  </div>
                  <p className="font-medium" style={{ color: 'var(--color-ink)' }}>
                    No notation found
                  </p>
                  <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                    Try a different search term
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}