import { useEffect, useRef, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

export function LiveValue({
  value,
  precision = 2,
  unit = '',
  className = '',
  animated = true,
  formatType = 'number',
  showChange = false,
  previousValue = null,
  colorMode = 'auto',
}) {
  const springValue = useSpring(value, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    if (animated) {
      springValue.set(value);
    } else {
      setDisplayValue(value);
    }
  }, [value, animated, springValue]);

  const decimalPlaces = useTransform(springValue, (val) =>
    val.toFixed(precision)
  );

  useEffect(() => {
    if (!animated) return;

    const unsubscribe = decimalPlaces.on('change', (val) => {
      setDisplayValue(parseFloat(val));
    });

    return unsubscribe;
  }, [animated, decimalPlaces]);

  const formatValue = (val) => {
    switch (formatType) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: precision,
          maximumFractionDigits: precision,
        }).format(val);
      case 'percent':
        return `${(val * 100).toFixed(precision)}%`;
      case 'scientific':
        return val.toExponential(precision);
      case 'integer':
        return Math.round(val).toString();
      case 'degrees':
        return `${val.toFixed(precision)}°`;
      default:
        return val.toFixed(precision);
    }
  };

  const change = previousValue !== null ? value - previousValue : 0;
  const changeStyle = {
    color: change > 0 ? 'var(--color-emerald)' : change < 0 ? 'var(--color-red)' : 'var(--color-muted)',
  };

  const getColorStyle = () => {
    if (colorMode === 'auto') {
      if (value > 0) return { color: 'var(--color-emerald)' };
      if (value < 0) return { color: 'var(--color-red)' };
      return { color: 'var(--color-ink)' };
    }
    return { color: colorMode };
  };

  return (
    <motion.span
      initial={animated ? { opacity: 0, scale: 0.9 } : false}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`inline-flex items-baseline gap-1 font-mono ${className}`}
    >
      <span style={getColorStyle()}>
        {animated ? formatValue(displayValue) : formatValue(value)}
      </span>
      {unit && (
        <span className="text-sm" style={{ color: 'var(--color-muted)', fontWeight: 400 }}>
          {unit}
        </span>
      )}
      {showChange && previousValue !== null && (
        <motion.span
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-xs ml-2"
          style={changeStyle}
        >
          {change >= 0 ? '+' : ''}{change.toFixed(precision)}
        </motion.span>
      )}
    </motion.span>
  );
}

export function AnimatedNumber({ value, className = '', ...props }) {
  const springValue = useSpring(0, { stiffness: 100, damping: 30 });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    springValue.set(value);
  }, [value, springValue]);

  useEffect(() => {
    const unsubscribe = springValue.on('change', (val) => {
      setDisplay(Math.round(val));
    });
    return unsubscribe;
  }, [springValue]);

  return <span className={className}>{display}</span>;
}

export function ValueDisplay({ value, label, unit, precision = 2, className = '' }) {
  return (
    <div className={`value-display ${className}`}>
      {label && (
        <span className="block text-xs uppercase tracking-wide mb-1" style={{ color: 'var(--color-muted)', fontWeight: 500 }}>
          {label}
        </span>
      )}
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold font-mono" style={{ color: 'var(--color-ink)' }}>
          {typeof value === 'number' ? value.toFixed(precision) : value}
        </span>
        {unit && (
          <span className="text-sm" style={{ color: 'var(--color-muted)' }}>{unit}</span>
        )}
      </div>
    </div>
  );
}

export function FormulaValue({ formula, value, unit = '', precision = 2, className = '' }) {
  return (
    <div className={`formula-value ${className}`}>
      <div className="text-xs mb-2 font-medium uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>
        Result
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold font-mono" style={{ color: 'var(--color-accent)' }}>
          {typeof value === 'number' ? value.toFixed(precision) : value}
        </span>
        {unit && (
          <span className="text-lg" style={{ color: 'var(--color-muted)' }}>{unit}</span>
        )}
      </div>
      {formula && (
        <div className="mt-2 text-sm" style={{ color: 'var(--color-muted)' }}>
          {formula}
        </div>
      )}
    </div>
  );
}

export function LiveVector({ x, y, z = null, precision = 3, className = '' }) {
  const format = (v) => v.toFixed(precision);

  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`inline-flex items-center gap-1 font-mono ${className}`}
    >
      <span style={{ color: 'var(--color-violet)' }}>
        <span className="text-xs opacity-60">(</span>
        {format(x)}
        <span className="text-xs opacity-60">, </span>
        {format(y)}
        {z !== null && (
          <>
            <span className="text-xs opacity-60">, </span>
            {format(z)}
          </>
        )}
        <span className="text-xs opacity-60">)</span>
      </span>
    </motion.span>
  );
}

export function LiveMatrix({ matrix, precision = 2, className = '' }) {
  const format = (v) => v.toFixed(precision);

  if (!matrix || !Array.isArray(matrix) || !Array.isArray(matrix[0])) {
    return null;
  }

  const rows = matrix.length;
  const cols = matrix[0].length;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`inline-grid gap-1 font-mono ${className}`}
      style={{
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
      }}
    >
      {matrix.map((row, i) =>
        row.map((val, j) => (
          <span
            key={`${i}-${j}`}
            className="px-2 py-1 text-sm text-center"
            style={{ color: 'var(--color-pink)' }}
          >
            {format(val)}
          </span>
        ))
      )}
    </motion.div>
  );
}

export function LiveDeterminant({ value, precision = 2, className = '' }) {
  const isPositive = value >= 0;

  return (
    <motion.div
      initial={{ scale: 0.8 }}
      animate={{ scale: 1 }}
      className={`inline-block p-4 rounded-xl ${className}`}
      style={{ backgroundColor: 'var(--color-paper-2)' }}
    >
      <div className="text-xs mb-2 font-medium uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>
        Determinant
      </div>
      <div className="text-4xl font-bold font-mono" style={{ color: isPositive ? 'var(--color-emerald)' : 'var(--color-red)' }}>
        {typeof value === 'number' ? value.toFixed(precision) : value}
      </div>
      {isPositive && value !== 0 && (
        <div className="mt-2 text-xs" style={{ color: 'var(--color-emerald)' }}>
          Non-singular matrix
        </div>
      )}
      {!isPositive && (
        <div className="mt-2 text-xs" style={{ color: 'var(--color-red)' }}>
          Singular matrix
        </div>
      )}
    </motion.div>
  );
}

export function ValueRange({ min, max, value, precision = 2, className = '' }) {
  const percentage = ((value - min) / (max - min)) * 100;
  const isInRange = value >= min && value <= max;

  return (
    <div className={`value-range ${className}`}>
      <div className="flex justify-between text-xs mb-1">
        <span style={{ color: 'var(--color-muted)' }}>{min.toFixed(precision)}</span>
        <span className="font-mono" style={{ color: 'var(--color-accent)' }}>{value.toFixed(precision)}</span>
        <span style={{ color: 'var(--color-muted)' }}>{max.toFixed(precision)}</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-rule)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: 'var(--color-accent)' }}
          initial={false}
          animate={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
          transition={{ type: 'spring', stiffness: 100 }}
        />
      </div>
    </div>
  );
}

export default LiveValue;