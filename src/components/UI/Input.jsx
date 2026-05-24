/* Hallmark · component: Input · genre: playful · theme: Plume
 * states: default · focus · error · disabled
 */
import { forwardRef, useState } from 'react';

export const Input = forwardRef(function Input(
  {
    type = 'text',
    value,
    onChange,
    label,
    placeholder,
    error,
    hint,
    disabled = false,
    required = false,
    min,
    max,
    step,
    size = 'md',
    fullWidth = true,
    prefix = null,
    suffix = null,
    className = '',
    ...props
  },
  ref
) {
  const [isFocused, setIsFocused] = useState(false);

  const sizes = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-3 text-base',
    xl: 'px-6 py-4 text-lg',
  };

  const getBorderColor = () => {
    if (error) return 'oklch(52% 0.160 25)';
    if (isFocused) return 'var(--color-accent)';
    return 'var(--color-rule)';
  };

  return (
    <div className={`${fullWidth ? 'w-full' : 'inline-block'} ${className}`}>
      {label && (
        <label
          className="block text-sm font-medium mb-1"
          style={{ color: 'var(--color-ink-2)' }}
        >
          {label}
          {required && (
            <span style={{ color: 'var(--color-accent)' }} className="ml-1">
              *
            </span>
          )}
        </label>
      )}

      <div className="relative flex items-center">
        {prefix && (
          <span
            className="absolute left-3 pointer-events-none text-sm"
            style={{ color: 'var(--color-muted)' }}
          >
            {prefix}
          </span>
        )}

        <input
          ref={ref}
          type={type}
          value={value}
          onChange={(e) => {
            const newValue =
              type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
            onChange?.(newValue);
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          min={min}
          max={max}
          step={step}
          className={`
            ${sizes[size]}
            ${prefix ? 'pl-8' : ''}
            ${suffix ? 'pr-8' : ''}
            border-2 border-[var(--color-rule)]
            bg-paper
            rounded-lg
            w-full
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors duration-200
            ${type === 'number' ? 'font-mono text-center' : ''}
          `}
          style={{
            color: 'var(--color-ink)',
            backgroundColor: 'var(--color-paper)',
            fontFamily: 'var(--font-body)',
            borderColor: getBorderColor(),
          }}
          {...props}
        />

        {suffix && (
          <span
            className="absolute right-3 pointer-events-none text-sm"
            style={{ color: 'var(--color-muted)' }}
          >
            {suffix}
          </span>
        )}
      </div>

      {(error || hint) && (
        <p
          className="mt-1 text-xs"
          style={error ? { color: '#ef4444' } : { color: 'var(--color-muted)' }}
        >
          {error || hint}
        </p>
      )}
    </div>
  );
});

export function NumberInput({
  value,
  onChange,
  min = -999,
  max = 999,
  step = 0.1,
  size = 'md',
  className = '',
  ...props
}) {
  return (
    <Input
      type="number"
      value={value}
      onChange={(v) => {
        const clamped = Math.max(min, Math.min(max, v));
        onChange?.(clamped);
      }}
      min={min}
      max={max}
      step={step}
      size={size}
      className={className}
      {...props}
    />
  );
}

export function VectorInput({
  dimension = 2,
  value = [],
  onChange,
  className = '',
}) {
  const labels = ['x', 'y', 'z'];

  return (
    <div className={`flex gap-2 items-center ${className}`}>
      <span
        className="font-mono text-sm"
        style={{ color: 'var(--color-muted)' }}
      >
        [
      </span>
      {Array.from({ length: dimension }, (_, i) => (
        <NumberInput
          key={i}
          value={value[i] ?? 0}
          onChange={(v) => {
            const newVector = [...value];
            newVector[i] = v;
            onChange?.(newVector);
          }}
          size="sm"
          className="w-16"
          label={labels[i]}
        />
      ))}
      <span
        className="font-mono text-sm"
        style={{ color: 'var(--color-muted)' }}
      >
        ]
      </span>
    </div>
  );
}

export function MatrixInput({
  rows = 2,
  cols = 2,
  value = [],
  onChange,
  className = '',
}) {
  const matrix =
    value.length === rows && value[0]?.length === cols
      ? value
      : Array.from({ length: rows }, () => Array(cols).fill(0));

  return (
    <div
      className={`inline-grid gap-1 ${className}`}
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 64px))` }}
    >
      {matrix.map((row, i) =>
        row.map((cell, j) => (
          <NumberInput
            key={`${i}-${j}`}
            value={cell}
            onChange={(v) => {
              const newMatrix = matrix.map((r, ii) =>
                r.map((vv, jj) => (ii === i && jj === j ? v : vv))
              );
              onChange?.(newMatrix);
            }}
            size="sm"
            className="w-16 text-center"
          />
        ))
      )}
    </div>
  );
}

export function ColorInput({ value, onChange, className = '' }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-10 h-10 rounded-lg cursor-pointer"
        style={{
          background: 'var(--color-paper)',
          border: '2px solid var(--color-rule)',
        }}
      />
      <Input
        value={value}
        onChange={onChange}
        size="sm"
        className="flex-1"
      />
    </div>
  );
}

export default Input;