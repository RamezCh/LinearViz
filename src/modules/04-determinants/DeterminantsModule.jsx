import { useState } from 'react';
import { motion } from 'framer-motion';
import { Gamepad2 } from 'lucide-react';
import { useStore } from '../../store/useStore';
import CompletionToggle from '../../components/UI/CompletionToggle';
import Grid2D from '../../components/Canvas/Grid2D';
import Vector2D from '../../components/Canvas/Vector2D';
import Parallelogram from '../../components/Canvas/Parallelogram';
import Button from '../../components/UI/Button';
import Slider from '../../components/UI/Slider';
import Card from '../../components/UI/Card';
import { FormulaRenderer } from '../../components/FormulaPanel/FormulaRenderer';
import { TermHighlighter } from '../../components/FormulaPanel/TermHighlighter';
import { det2x2 } from '../../utils/linalg';
import GameWrapper from '../../components/MiniGame/GameWrapper';
import AreaMatch from '../../games/AreaMatch';

export default function DeterminantsModule() {
  const { isGuidedMode, guidedStep, setGuidedStep } = useStore();
  const [mode, setMode] = useState('2x2');
  const [showGame, setShowGame] = useState(false);
  const [vectorU, setVectorU] = useState({ x: 2, y: 1 });
  const [vectorV, setVectorV] = useState({ x: 1, y: 2 });

  const determinant = det2x2([
    [vectorU.x, vectorV.x],
    [vectorU.y, vectorV.y],
  ]);

  const area = Math.abs(determinant);
  const isPositive = determinant >= 0;

  const guidedSteps = [
    { title: 'Determinant as Signed Area', description: 'The parallelogram area formed by two column vectors equals the absolute value of the determinant. The sign tells us about orientation.', formula: '|\\det(A)| = \\text{area of parallelogram}' },
    { title: 'The Formula', description: 'For a 2x2 matrix, det = ad - bc. Watch how each term corresponds to part of the parallelogram.', formula: '\\det\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix} = ad - bc' },
    { title: 'When det = 0', description: 'If the determinant is zero, the vectors are parallel and lie on the same line. The area collapses to zero.', formula: '\\det = 0 \\Rightarrow \\text{vectors are linearly dependent}' },
    { title: 'Sign Matters', description: 'Positive determinant means the orientation is preserved (counterclockwise). Negative means orientation is flipped.', formula: '\\det > 0: \\text{preserved} \\quad \\det < 0: \\text{flipped}' },
  ];

  const render2DCanvas = () => (
    <div className="flex-1 min-h-0 rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--color-paper)' }}>
      <Grid2D>
        <svg width="100%" height="100%" viewBox="-6 -6 12 12" preserveAspectRatio="xMidYMid meet">
          <Parallelogram
            origin={{ x: 0, y: 0 }}
            vectorU={vectorU}
            vectorV={vectorV}
            color={isPositive ? 'oklch(52% 0.16 155)' : 'oklch(52% 0.16 25)'}
            opacity={0.3}
          />
          <Vector2D origin={{ x: 0, y: 0 }} tip={vectorU} color="oklch(52% 0.16 25)" label="u" />
          <Vector2D origin={{ x: 0, y: 0 }} tip={vectorV} color="oklch(52% 0.16 155)" label="v" />
          <text x={vectorU.x + 0.3} y={-vectorU.y} className="text-xs fill-current" style={{ fontFamily: 'var(--font-mono)' }}>
            <tspan fill={isPositive ? 'oklch(52% 0.16 155)' : 'oklch(52% 0.16 25)'}>u = ({vectorU.x.toFixed(1)}, {vectorU.y.toFixed(1)})</tspan>
          </text>
          <text x={vectorV.x + 0.3} y={-vectorV.y} className="text-xs fill-current" style={{ fontFamily: 'var(--font-mono)' }}>
            <tspan fill="oklch(52% 0.16 155)">v = ({vectorV.x.toFixed(1)}, {vectorV.y.toFixed(1)})</tspan>
          </text>
          <text x="-5.5" y="5.5" className="text-sm font-semibold fill-current" style={{ fontFamily: 'var(--font-mono)' }}>
            <tspan x="-5.5" dy="0" fill={isPositive ? 'oklch(52% 0.16 155)' : 'oklch(52% 0.16 25)'}>det = {determinant.toFixed(2)}</tspan>
            <tspan x="-5.5" dy="1.2" fill="var(--color-muted)" fontSize="0.75rem">Area = {area.toFixed(2)}</tspan>
          </text>
        </svg>
      </Grid2D>
    </div>
  );

  const render3DCanvas = () => (
    <div className="flex-1 min-h-0 rounded-lg overflow-hidden flex items-center justify-center" style={{ backgroundColor: 'var(--color-paper)' }}>
      <div className="text-center p-8">
        <div className="text-6xl mb-4" style={{ color: 'var(--color-muted)' }}>3D</div>
        <p style={{ color: 'var(--color-muted)' }}>3×3 determinant visualization with parallelepiped</p>
        <p className="text-sm mt-2" style={{ color: 'var(--color-muted)', opacity: 0.7 }}>Three.js 3D scene would render here</p>
      </div>
    </div>
  );

  const renderCofactorExpansion = () => (
    <div className="mt-4 p-4 rounded-lg" style={{ backgroundColor: 'var(--color-paper-2)' }}>
      <h4 className="font-medium mb-3" style={{ color: 'var(--color-ink)' }}>Cofactor Expansion (3×3)</h4>
      <div className="space-y-2 text-sm">
        {['a', 'b', 'c'].map((name, i) => (
          <div key={name} className="flex items-center gap-2">
            <div className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold" style={{ backgroundColor: ['rgba(220,75,55,0.15)', 'rgba(75,180,140,0.15)', 'rgba(80,130,200,0.15)'][i], color: 'var(--color-ink)' }}>{name}</div>
            <span style={{ color: 'var(--color-muted)' }}>det of 2×2 from removing row 1, col {i + 1}</span>
          </div>
        ))}
        <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--color-rule)' }}>
          <FormulaRenderer expression="\\det(A) = a \\cdot M_{11} - b \\cdot M_{12} + c \\cdot M_{13}" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4">
        <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-display)' }}>Determinants</h2>
        <p style={{ color: 'var(--color-muted)' }}>Discover how determinants measure area scaling and orientation.</p>
      </div>

      {isGuidedMode && guidedSteps[guidedStep] && (
        <Card variant="elevated" className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold" style={{ color: 'var(--color-ink)' }}>Step {guidedStep + 1}: {guidedSteps[guidedStep].title}</h3>
            <span className="text-sm" style={{ color: 'var(--color-muted)' }}>{guidedStep + 1} of {guidedSteps.length}</span>
          </div>
          <p className="mb-4" style={{ color: 'var(--color-muted)' }}>{guidedSteps[guidedStep].description}</p>
          <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--color-paper-2)' }}>
            <FormulaRenderer expression={guidedSteps[guidedStep].formula} displayMode />
          </div>
          <div className="flex gap-2 mt-4">
            <Button variant="secondary" onClick={() => setGuidedStep(Math.max(0, guidedStep - 1))} disabled={guidedStep === 0}>Back</Button>
            <Button variant="primary" onClick={() => setGuidedStep(Math.min(guidedSteps.length - 1, guidedStep + 1))}>{guidedStep === guidedSteps.length - 1 ? 'Done' : 'Next'}</Button>
          </div>
        </Card>
      )}

      <div className="flex gap-2 mb-4">
        <Button variant={mode === '2x2' ? 'primary' : 'outline'} onClick={() => setMode('2x2')}>2×2 Matrix</Button>
        <Button variant={mode === '3x3' ? 'primary' : 'outline'} onClick={() => setMode('3x3')}>3×3 Matrix</Button>
        <Button variant={showGame ? 'primary' : 'ghost'} onClick={() => setShowGame(!showGame)} icon={Gamepad2}>Mini-Game</Button>
      </div>

      {showGame && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1"
        >
          <GameWrapper
            title="Area Match"
            instructions="Drag the vectors to match the target area"
            maxAttempts={5}
            rounds={5}
            scoring="accuracy"
          >
            {(props) => <AreaMatch {...props} />}
          </GameWrapper>
        </motion.div>
      )}

      {!showGame && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
        <Card variant="default" className="flex flex-col">
          <h3 className="font-semibold mb-4" style={{ color: 'var(--color-ink)' }}>Interactive Canvas</h3>
          {mode === '2x2' ? render2DCanvas() : render3DCanvas()}
          {mode === '2x2' && (
            <div className="mt-4 space-y-4">
              {[
                { label: 'u', vec: vectorU, set: setVectorU },
                { label: 'v', vec: vectorV, set: setVectorV },
              ].map(({ label, vec, set: setVec }) => (
                <div key={label}>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-ink-2)' }}>
                    Vector {label} = ({vec.x.toFixed(1)}, {vec.y.toFixed(1)})
                  </label>
                  <div className="flex gap-4">
                    <Slider label={`${label}₁`} min="-3" max="3" step="0.1" value={vec.x} onChange={(v) => setVec({ ...vec, x: parseFloat(v) })} />
                    <Slider label={`${label}₂`} min="-3" max="3" step="0.1" value={vec.y} onChange={(v) => setVec({ ...vec, y: parseFloat(v) })} />
                  </div>
                </div>
              ))}
            </div>
          )}
          {mode === '3x3' && renderCofactorExpansion()}
        </Card>

        <Card variant="default" className="flex flex-col">
          <h3 className="font-semibold mb-4" style={{ color: 'var(--color-ink)' }}>Formula Panel</h3>
          <div className="space-y-4 flex-1 overflow-auto">
            {[
              { title: 'Matrix as Column Vectors', content: `A = \\begin{pmatrix} ${vectorU.x.toFixed(1)} & ${vectorV.x.toFixed(1)} \\\\ ${vectorU.y.toFixed(1)} & ${vectorV.y.toFixed(1)} \\end{pmatrix}` },
              {
                title: 'Determinant Formula',
                content: `\\det(A) = u_1 \\cdot v_2 - u_2 \\cdot v_1 = ${vectorU.x.toFixed(1)} \\cdot ${vectorV.y.toFixed(1)} - ${vectorU.y.toFixed(1)} \\cdot ${vectorV.x.toFixed(1)} = ${determinant.toFixed(2)}`,
              },
            ].map(({ title, content }) => (
              <div key={title}>
                <h4 className="text-sm font-medium mb-2" style={{ color: 'var(--color-ink-2)' }}>{title}</h4>
                <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--color-paper-2)' }}>
                  <FormulaRenderer expression={content} displayMode />
                </div>
              </div>
            ))}

            <div>
              <h4 className="text-sm font-medium mb-2" style={{ color: 'var(--color-ink-2)' }}>Geometric Meaning</h4>
              <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--color-paper-2)' }}>
                <div className="flex items-center gap-4 mb-3">
                  <div className="px-3 py-1 rounded-full text-sm font-medium" style={isPositive ? { backgroundColor: 'rgba(75,180,140,0.12)', color: 'oklch(52% 0.16 155)' } : { backgroundColor: 'rgba(220,75,55,0.08)', color: 'oklch(52% 0.16 25)' }}>
                    {isPositive ? 'Positive det' : 'Negative det'}
                  </div>
                  <div className="text-sm" style={{ color: 'var(--color-muted)' }}>Area = {area.toFixed(2)}</div>
                </div>
                <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                  {Math.abs(determinant) < 0.001
                    ? 'The vectors are parallel! The area is zero because the column vectors are linearly dependent.'
                    : isPositive
                      ? 'The parallelogram has positive (counterclockwise) orientation. Its area equals |det|.'
                      : 'The parallelogram has negative (clockwise) orientation. The sign indicates a flip in orientation.'}
                </p>
              </div>
            </div>

            {Math.abs(determinant) < 0.001 && (
              <div className="rounded-lg p-4" style={{ backgroundColor: 'rgba(200,155,50,0.08)', border: '1px solid oklch(65% 0.10 70)' }}>
                <h4 className="font-medium mb-2" style={{ color: 'oklch(65% 0.10 70)' }}>Special Case: det = 0</h4>
                <p className="text-sm" style={{ color: 'oklch(65% 0.10 70)' }}>
                  When the determinant is zero, the transformation collapses 2D space onto a line. The matrix is not invertible. The column vectors are linearly dependent.
                </p>
                <div className="mt-3 rounded p-2" style={{ backgroundColor: 'rgba(200,155,50,0.12)' }}>
                  <FormulaRenderer expression="\\text{rank}(A) < 2, \\quad A^{-1} \\text{ does not exist}" />
                </div>
              </div>
            )}

            {mode === '3x3' && (
              <div>
                <h4 className="text-sm font-medium mb-2" style={{ color: 'var(--color-ink-2)' }}>3×3 Determinant</h4>
                <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--color-paper-2)' }}>
                  <FormulaRenderer expression="\\det\\begin{pmatrix} a & b & c \\\\ d & e & f \\\\ g & h & i \\end{pmatrix} = a(ei-fh) - b(di-fg) + c(dh-eg)" displayMode />
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
      )}

      <div
        className="px-6 py-2 text-sm flex items-center justify-center gap-4 border-t"
        style={{
          backgroundColor: 'var(--color-paper-2)',
          borderColor: 'var(--color-rule)',
          color: 'var(--color-muted)',
        }}
      >
        <span>Drag vectors to see determinant change</span>
        <span>•</span>
        <CompletionToggle moduleId={4} />
      </div>
    </div>
  );
}