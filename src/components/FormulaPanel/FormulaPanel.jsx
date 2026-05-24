import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FormulaCard } from './FormulaCard';
import { FormulaRenderer } from './FormulaRenderer';
import { LiveValue } from './LiveValue';
import { useFormulaHighlight } from '../../hooks/useFormulaHighlight';
import { modules, getModuleById } from '../../data/modules';
import { Book, ChevronRight, X, Search, Layers } from 'lucide-react';

const FORMULA_TEMPLATES = {
  vectorMagnitude: {
    title: 'Vector Magnitude',
    formula: '\\|\\vec{v}\\| = \\sqrt{v_1^2 + v_2^2 + v_3^2}',
    explanation: 'The magnitude (length) of a vector is the square root of the sum of squares of its components.',
  },
  dotProduct: {
    title: 'Dot Product',
    formula: '\\vec{v} \\cdot \\vec{w} = \\sum_{i=1}^{n} v_i w_i = |v||w|\\cos\\theta',
    explanation: 'The dot product of two vectors equals the sum of products of corresponding components, or the product of magnitudes times cosine of the angle.',
  },
  crossProduct: {
    title: 'Cross Product',
    formula: '\\vec{v} \\times \\vec{w} = \\begin{pmatrix} v_2 w_3 - v_3 w_2 \\\\ v_3 w_1 - v_1 w_3 \\\\ v_1 w_2 - v_2 w_1 \\end{pmatrix}',
    explanation: 'The cross product produces a vector perpendicular to both input vectors. Its magnitude equals |v||w|sin(θ).',
  },
  projection: {
    title: 'Projection',
    formula: 'proj_{\\vec{u}}\\vec{v} = \\frac{\\vec{v} \\cdot \\vec{u}}{\\vec{u} \\cdot \\vec{u}} \\vec{u}',
    explanation: 'The projection of v onto u gives the component of v in the direction of u.',
  },
  matrixMultiplication: {
    title: 'Matrix Multiplication',
    formula: '[AB]_{ij} = \\sum_{k} a_{ik} b_{kj}',
    explanation: 'Element (i,j) of the product matrix equals the dot product of row i of A with column j of B.',
  },
  determinant2x2: {
    title: '2×2 Determinant',
    formula: '\\det\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix} = ad - bc',
    explanation: 'The determinant of a 2×2 matrix equals the product of the main diagonal minus the product of the other diagonal.',
  },
  inverse2x2: {
    title: '2×2 Matrix Inverse',
    formula: 'A^{-1} = \\frac{1}{ad-bc}\\begin{pmatrix} d & -b \\\\ -c & a \\end{pmatrix}',
    explanation: 'The inverse of a 2×2 matrix uses the determinant and swaps/flips elements.',
  },
  eigenEquation: {
    title: 'Eigenvalue Equation',
    formula: 'A\\vec{v} = \\lambda\\vec{v}',
    explanation: 'An eigenvector v of matrix A scaled by eigenvalue λ gives the same result as multiplying v by A.',
  },
  characteristicPolynomial: {
    title: 'Characteristic Polynomial',
    formula: '\\det(A - \\lambda I) = 0',
    explanation: 'Eigenvalues are found by solving this equation, where I is the identity matrix.',
  },
  svd: {
    title: 'Singular Value Decomposition',
    formula: 'A = U \\Sigma V^T',
    explanation: 'Any matrix can be decomposed into orthogonal matrices U and V with a diagonal matrix Σ of singular values.',
  },
  trace: {
    title: 'Trace',
    formula: '\\text{tr}(A) = \\sum_{i} a_{ii}',
    explanation: 'The trace equals the sum of diagonal elements.',
  },
  transpose: {
    title: 'Transpose',
    formula: '(A^T)_{ij} = A_{ji}',
    explanation: 'The transpose flips rows and columns.',
  },
};

export function FormulaPanel({
  currentModuleId = 1,
  className = '',
  showNotationButton = true,
  notationOpen = false,
  onNotationToggle,
  scrollable = true,
}) {
  const { isHighlighted, getActiveTerms, highlights } = useFormulaHighlight();
  const [searchQuery, setSearchQuery] = useState('');

  const currentModule = getModuleById(currentModuleId);

  const moduleFormulas = useMemo(() => {
    if (!currentModule?.guidedSteps) return [];
    return currentModule.guidedSteps.map((step) => ({
      id: step.id,
      title: step.title,
      formula: step.formula,
      explanation: step.description,
      terms: generateTermIds(step.id, step.formula),
    }));
  }, [currentModule]);

  const liveValues = useMemo(() => {
    const values = {};
    highlights.forEach((data, term) => {
      if (data.metadata?.isValue) {
        values[term] = data.value;
      }
    });
    return values;
  }, [highlights]);

  return (
    <div className={`formula-panel h-full flex flex-col ${className}`}>
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--color-rule)' }}>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--color-ink)' }}>
              Formulas
            </h2>
            {showNotationButton && (
              <button
                onClick={onNotationToggle}
                className="p-2 rounded-lg transition-colors"
                style={{ backgroundColor: 'var(--color-paper-2)' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-paper-3)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-paper-2)'}
                aria-label="Open notation reference"
              >
                <Book className="w-5 h-5" style={{ color: 'var(--color-muted)' }} />
              </button>
            )}
          </div>
          {currentModule && (
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
              {currentModule.title} Module
            </p>
          )}
        </div>

        <div className={`flex-1 overflow-y-auto ${scrollable ? 'scrollbar-thin' : ''}`}>
          <div className="p-4 space-y-4">
            {moduleFormulas.map((formula) => (
              <motion.div
                key={formula.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <FormulaCard
                  title={formula.title}
                  formula={formula.formula}
                  explanation={formula.explanation}
                  terms={formula.terms}
                  collapsible={true}
                  defaultOpen={true}
                  variant="default"
                />
              </motion.div>
            ))}

            {Object.keys(liveValues).length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6"
              >
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--color-ink-2)' }}>
                  <Layers className="w-4 h-4" />
                  Live Values
                </h3>
                <div className="grid gap-3">
                  {Object.entries(liveValues).map(([term, value]) => (
                    <div
                      key={term}
                      className="flex items-center justify-between p-3 rounded-lg"
                      style={{ backgroundColor: 'var(--color-paper-2)', border: '1px solid var(--color-rule)' }}
                    >
                      <span className="text-sm font-mono" style={{ color: 'var(--color-ink-2)', fontFamily: 'var(--font-mono)' }}>
                        {term.split(':')[1] || term}
                      </span>
                      <LiveValue
                        value={typeof value === 'number' ? value : parseFloat(value) || 0}
                        precision={3}
                        animated={true}
                      />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function generateTermIds(stepId, formula) {
  const terms = [];

  const vectorMatches = formula.match(/\\vec\{(\w)\}/g) || [];
  vectorMatches.forEach((match) => {
    const vec = match.match(/\\vec\{(\w)\}/)[1];
    terms.push(`vec:${vec}`);
  });

  const matrixMatches = formula.match(/\[([A-Z])\]/g) || [];
  matrixMatches.forEach((match) => {
    const mat = match.match(/\[([A-Z])\]/)[1];
    terms.push(`mx:${mat}`);
  });

  const varMatches = formula.match(/(v|w|u|n|m|a|b|c|d|i|j|k)_?(\d)?/g) || [];
  varMatches.forEach((match) => {
    terms.push(`term:${match.replace(/_(\d)/, '$1')}`);
  });

  terms.push(`val:result`);

  return [...new Set(terms)];
}

export function QuickFormula({ formulaKey, className = '' }) {
  const template = FORMULA_TEMPLATES[formulaKey];

  if (!template) {
    return (
      <div className="text-sm" style={{ color: 'var(--color-red)' }}>
        Unknown formula key: {formulaKey}
      </div>
    );
  }

  return (
    <FormulaCard
      title={template.title}
      formula={template.formula}
      explanation={template.explanation}
      collapsible={true}
      defaultOpen={true}
      className={className}
    />
  );
}

export function FormulaList({ formulas = [], className = '' }) {
  return (
    <div className={`formula-list space-y-4 ${className}`}>
      {formulas.map((formula, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <FormulaCard
            title={formula.title}
            formula={formula.formula}
            explanation={formula.explanation}
            terms={formula.terms || []}
          />
        </motion.div>
      ))}
    </div>
  );
}

export default FormulaPanel;