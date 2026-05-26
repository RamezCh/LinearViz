import { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { det2x2, transpose, inverse2x2, multiply } from '../../utils/linalg';

export default function MatrixGrid({
  matrixA = [[1, 0], [0, 1]],
  matrixB = [[1, 0], [0, 1]],
  operation = 'multiply',
  highlightCell = null,
  highlightRow = null,
  highlightCol = null,
  animProgress = 1,
  showGeometry = true,
  zoom = 40,
  pan = { x: 0, y: 0 },
  darkMode = true,
  interactive = false,
  onDragEntry,
}) {
  const containerRef = useRef(null);
  const [size, setSize] = useState({ w: 1000, h: 500 });
  const [transposeAnim, setTransposeAnim] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setSize({ w: width, h: height });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (operation === 'transpose') {
      const duration = 600;
      const start = performance.now();
      const animate = (now) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setTransposeAnim(eased);
        if (progress < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    } else {
      setTransposeAnim(0);
    }
  }, [operation, matrixA]);

  const toCanvas = useCallback((wx, wy, offsetX = 0) => ({
    x: size.w / 2 + offsetX + wx * zoom + pan.x,
    y: size.h / 2 - wy * zoom + pan.y,
  }), [size.w, size.h, zoom, pan]);

  const getTransformedPoint = useCallback((px, py, matrix, progress = 1) => {
    const [a, b] = matrix[0];
    const [c, d] = matrix[1];
    const tx = a * px + b * py;
    const ty = c * px + d * py;
    return {
      x: px + (tx - px) * progress,
      y: py + (ty - py) * progress,
    };
  }, []);

  const renderGridLines = useCallback((matrix, offsetX, tint, showBasis = false) => {
    if (!showGeometry) return null;

    const lines = [];
    const extent = 4;

    for (let i = -extent; i <= extent; i++) {
      const points = [];
      for (let j = -extent; j <= extent; j++) {
        const tp = getTransformedPoint(i, j, matrix);
        const p = toCanvas(tp.x, tp.y, offsetX);
        points.push(`${p.x},${p.y}`);
      }
      lines.push(
        <polyline
          key={`v-${i}-${offsetX}`}
          points={points.join(' ')}
          fill="none"
          stroke={tint}
          strokeWidth={i === 0 ? 1.5 : 0.5}
        />
      );
    }

    for (let i = -extent; i <= extent; i++) {
      const points = [];
      for (let j = -extent; j <= extent; j++) {
        const tp = getTransformedPoint(j, i, matrix);
        const p = toCanvas(tp.x, tp.y, offsetX);
        points.push(`${p.x},${p.y}`);
      }
      lines.push(
        <polyline
          key={`h-${i}-${offsetX}`}
          points={points.join(' ')}
          fill="none"
          stroke={tint}
          strokeWidth={i === 0 ? 1.5 : 0.5}
        />
      );
    }

    return <g className={`grid-${offsetX}`}>{lines}</g>;
  }, [showGeometry, getTransformedPoint, toCanvas]);

  const resultMatrix = useMemo(() => {
    try {
      if (operation === 'add') {
        return [
          [matrixA[0][0] + matrixB[0][0], matrixA[0][1] + matrixB[0][1]],
          [matrixA[1][0] + matrixB[1][0], matrixA[1][1] + matrixB[1][1]],
        ];
      } else if (operation === 'multiply') {
        return multiply(matrixA, matrixB);
      }
      return null;
    } catch {
      return null;
    }
  }, [matrixA, matrixB, operation]);

  const renderAdditionMode = () => {
    const offsetA = -size.w / 4;
    const offsetB = size.w / 4;
    const tintA = darkMode ? 'rgba(74,144,226,0.3)' : 'rgba(74,144,226,0.2)';
    const tintB = darkMode ? 'rgba(126,211,33,0.3)' : 'rgba(126,211,33,0.2)';
    const tintResult = darkMode ? 'rgba(139,92,246,0.3)' : 'rgba(139,92,246,0.2)';

    return (
      <g>
        {renderGridLines(matrixA, offsetA, tintA)}
        {renderGridLines(matrixB, offsetB, tintB)}
        {resultMatrix && renderGridLines(resultMatrix, 0, tintResult)}

        <text
          x={offsetA}
          y={-size.h / 2 + 30}
          fill={darkMode ? '#94a3b8' : '#64748b'}
          fontSize={14}
          fontWeight="600"
          textAnchor="middle"
        >
          A
        </text>
        <text
          x={offsetB}
          y={-size.h / 2 + 30}
          fill={darkMode ? '#94a3b8' : '#64748b'}
          fontSize={14}
          fontWeight="600"
          textAnchor="middle"
        >
          B
        </text>
        {resultMatrix && (
          <text
            x={0}
            y={-size.h / 2 + 30}
            fill={darkMode ? '#94a3b8' : '#64748b'}
            fontSize={14}
            fontWeight="600"
            textAnchor="middle"
          >
            A + B
          </text>
        )}

        <text
          x={0}
          y={0}
          fill={darkMode ? '#E2E8F0' : '#334155'}
          fontSize={48}
          fontWeight="700"
          textAnchor="middle"
          dominantBaseline="middle"
          opacity={0.3}
        >
          +
        </text>
      </g>
    );
  };

  const renderMultiplicationMode = () => {
    const offsetA = -size.w / 4;
    const offsetB = size.w / 4;
    const tintA = darkMode ? 'rgba(74,144,226,0.3)' : 'rgba(74,144,226,0.2)';
    const tintB = darkMode ? 'rgba(126,211,33,0.3)' : 'rgba(126,211,33,0.2)';
    const tintResult = darkMode ? 'rgba(139,92,246,0.3)' : 'rgba(139,92,246,0.2)';

    return (
      <g>
        {renderGridLines(matrixA, offsetA, tintA)}
        {renderGridLines(matrixB, offsetB, tintB)}
        {resultMatrix && renderGridLines(resultMatrix, 0, tintResult)}

        <text
          x={offsetA}
          y={-size.h / 2 + 30}
          fill={darkMode ? '#94a3b8' : '#64748b'}
          fontSize={14}
          fontWeight="600"
          textAnchor="middle"
        >
          A
        </text>
        <text
          x={offsetB}
          y={-size.h / 2 + 30}
          fill={darkMode ? '#94a3b8' : '#64748b'}
          fontSize={14}
          fontWeight="600"
          textAnchor="middle"
        >
          B
        </text>
        {resultMatrix && (
          <text
            x={0}
            y={-size.h / 2 + 30}
            fill={darkMode ? '#94a3b8' : '#64748b'}
            fontSize={14}
            fontWeight="600"
            textAnchor="middle"
          >
            C = AB
          </text>
        )}

        <text
          x={0}
          y={0}
          fill={darkMode ? '#E2E8F0' : '#334155'}
          fontSize={48}
          fontWeight="700"
          textAnchor="middle"
          dominantBaseline="middle"
          opacity={0.3}
        >
          ×
        </text>

        <AnimatePresence>
          {highlightCell && (
            <motion.g
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              {highlightRow !== null && (
                <rect
                  x={offsetA - zoom * 2}
                  y={-zoom * 2 + (highlightRow - 1) * zoom}
                  width={zoom * 4}
                  height={zoom}
                  fill="rgba(74,144,226,0.25)"
                  rx={4}
                />
              )}
              {highlightCol !== null && (
                <rect
                  x={offsetB - zoom / 2 + (highlightCol - 1) * zoom}
                  y={-zoom * 2}
                  width={zoom}
                  height={zoom * 4}
                  fill="rgba(126,211,33,0.25)"
                  rx={4}
                />
              )}

              {highlightRow !== null && highlightCol !== null && resultMatrix && (
                <rect
                  x={-zoom / 2 + (highlightCol - 1) * zoom}
                  y={-zoom / 2 + (highlightRow - 1) * zoom}
                  width={zoom}
                  height={zoom}
                  fill="rgba(139,92,246,0.3)"
                  stroke="#8B5CF6"
                  strokeWidth={2}
                  rx={4}
                />
              )}
            </motion.g>
          )}
        </AnimatePresence>

        {highlightRow !== null && highlightCol !== null && (
          <g>
            <rect
              x={offsetA + 10}
              y={-size.h / 2 + 50}
              width={120}
              height={24}
              rx={4}
              fill={darkMode ? 'rgba(30,41,59,0.9)' : 'rgba(255,255,255,0.9)'}
            />
            <text
              x={offsetA + 70}
              y={-size.h / 2 + 66}
              fill="#4A90E2"
              fontSize={10}
              textAnchor="middle"
            >
              Row {highlightRow + 1} of A
            </text>
            <rect
              x={offsetB + 10}
              y={-size.h / 2 + 50}
              width={120}
              height={24}
              rx={4}
              fill={darkMode ? 'rgba(30,41,59,0.9)' : 'rgba(255,255,255,0.9)'}
            />
            <text
              x={offsetB + 70}
              y={-size.h / 2 + 66}
              fill="#7ED321"
              fontSize={10}
              textAnchor="middle"
            >
              Col {highlightCol + 1} of B
            </text>
          </g>
        )}
      </g>
    );
  };

  const renderTransposeMode = () => {
    const cellSize = 60;
    const startX = size.w / 2 - cellSize;
    const startY = size.h / 2 - cellSize;

    const renderMatrix = (m, offsetX = 0, offsetY = 0, isSource = true) => (
      <g transform={`translate(${offsetX}, ${offsetY})`}>
        {[0, 1].map(row =>
          [0, 1].map(col => {
            const value = m[row][col];
            const isDiagonal = row === col;

            const fromRow = isSource ? col : row;
            const fromCol = isSource ? row : col;
            const fromValue = m[fromRow][fromCol];

            const x = col * cellSize;
            const y = row * cellSize;

            const arcX = isDiagonal ? x : col * cellSize;
            const arcY = isDiagonal ? y : row * cellSize;

            const finalX = isDiagonal ? x : row * cellSize;
            const finalY = isDiagonal ? y : col * cellSize;

            const progress = isDiagonal ? 1 : transposeAnim;
            const displayX = x + (finalX - x) * progress;
            const displayY = y + (finalY - y) * progress;

            return (
              <g key={`cell-${row}-${col}`}>
                <motion.rect
                  x={displayX}
                  y={displayY}
                  width={cellSize - 4}
                  height={cellSize - 4}
                  rx={8}
                  fill={isDiagonal ? 'rgba(245,158,11,0.3)' : 'rgba(99,102,241,0.15)'}
                  stroke={isDiagonal ? '#F59E0B' : '#6366F1'}
                  strokeWidth={isDiagonal ? 2 : 1}
                  initial={false}
                  animate={{
                    opacity: isDiagonal ? 1 : (isSource ? 1 : progress),
                  }}
                />
                <text
                  x={displayX + cellSize / 2 - 2}
                  y={displayY + cellSize / 2 + 5}
                  fill={isDiagonal ? '#F59E0B' : '#6366F1'}
                  fontSize={18}
                  fontWeight="600"
                  textAnchor="middle"
                >
                  {value.toFixed(1)}
                </text>
              </g>
            );
          })
        )}
      </g>
    );

    return (
      <g>
        <text
          x={startX - 50}
          y={startY + cellSize + 5}
          fill={darkMode ? '#94a3b8' : '#64748b'}
          fontSize={16}
          fontWeight="600"
          textAnchor="middle"
        >
          A
        </text>
        {renderMatrix(matrixA, startX, startY)}

        <text
          x={startX + cellSize * 2 + 50}
          y={startY + cellSize + 5}
          fill={darkMode ? '#94a3b8' : '#64748b'}
          fontSize={16}
          fontWeight="600"
          textAnchor="middle"
        >
          A<sup>T</sup>
        </text>
        {renderMatrix(transpose(matrixA), startX + cellSize * 2, startY, false)}
      </g>
    );
  };

  const renderInverseMode = () => {
    const detA = det2x2(matrixA);
    const isSingular = Math.abs(detA) < 1e-10;

    let matrixAInv = null;
    try {
      matrixAInv = inverse2x2(matrixA);
    } catch {
      matrixAInv = null;
    }

    const offsetA = -size.w / 4;
    const offsetInv = size.w / 4;
    const tintA = isSingular
      ? 'rgba(220,53,69,0.3)'
      : darkMode ? 'rgba(74,144,226,0.3)' : 'rgba(74,144,226,0.2)';
    const tintInv = isSingular
      ? 'rgba(220,53,69,0.3)'
      : darkMode ? 'rgba(126,211,33,0.3)' : 'rgba(126,211,33,0.2)';

    return (
      <g>
        {renderGridLines(matrixA, offsetA, tintA)}
        {matrixAInv && renderGridLines(matrixAInv, offsetInv, tintInv)}

        <text
          x={offsetA}
          y={-size.h / 2 + 30}
          fill={isSingular ? '#DC3749' : (darkMode ? '#94a3b8' : '#64748b')}
          fontSize={14}
          fontWeight="600"
          textAnchor="middle"
        >
          A
        </text>
        <text
          x={offsetInv}
          y={-size.h / 2 + 30}
          fill={isSingular ? '#DC3749' : (darkMode ? '#94a3b8' : '#64748b')}
          fontSize={14}
          fontWeight="600"
          textAnchor="middle"
        >
          A⁻¹
        </text>

        {isSingular && (
          <g>
            <rect
              x={size.w / 2 - 80}
              y={size.h / 2 - 40}
              width={160}
              height={50}
              rx={8}
              fill="rgba(220,53,69,0.15)"
              stroke="#DC3749"
              strokeWidth={1.5}
            />
            <text
              x={size.w / 2}
              y={size.h / 2 - 15}
              fill="#DC3749"
              fontSize={12}
              fontWeight="600"
              textAnchor="middle"
            >
              det(A) = 0
            </text>
            <text
              x={size.w / 2}
              y={size.h / 2 + 2}
              fill="#DC3749"
              fontSize={11}
              textAnchor="middle"
            >
              No inverse exists
            </text>
          </g>
        )}

        {!isSingular && matrixAInv && (
          <g>
            <rect
              x={size.w / 2 - 60}
              y={-size.h / 2 + 55}
              width={120}
              height={30}
              rx={6}
              fill={darkMode ? 'rgba(30,41,59,0.9)' : 'rgba(255,255,255,0.9)'}
            />
            <text
              x={size.w / 2}
              y={-size.h / 2 + 75}
              fill="#10B981"
              fontSize={12}
              fontWeight="600"
              textAnchor="middle"
            >
              det = {detA.toFixed(2)}
            </text>
          </g>
        )}
      </g>
    );
  };

  const renderMode = () => {
    switch (operation) {
      case 'add':
        return renderAdditionMode();
      case 'multiply':
        return renderMultiplicationMode();
      case 'transpose':
        return renderTransposeMode();
      case 'inverse':
        return renderInverseMode();
      default:
        return null;
    }
  };

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        minHeight: '400px',
        position: 'relative',
      }}
    >
      <svg
        width="100%"
        height="100%"
        className="matrix-grid"
        style={{ display: 'block' }}
      >
        {renderMode()}
      </svg>
    </div>
  );
}