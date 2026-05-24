/* Hallmark · component: Slider · genre: playful · theme: Plume
 * states: default · hover · focus · active · disabled
 */
import { forwardRef } from 'react';
import { motion } from 'framer-motion';

export const Slider = forwardRef(function Slider(
  {
    label,
    value,
    onChange,
    min = 0,
    max = 100,
    step = 1,
    disabled = false,
    showValue = true,
    valueFormatter = (v) => v.toFixed(2),
    color = 'accent',
    size = 'md',
    className = '',
    error = null,
    hint = null,
    ...props
  },
  ref
) {
  const percentage = ((value - min) / (max - min)) * 100;

  const trackColorMap = {
    accent:  'var(--color-accent)',
    blue:    'oklch(62% 0.160 230)',
    violet:  'oklch(62% 0.160 270)',
    emerald: 'oklch(60% 0.160 155)',
    amber:   'oklch(75% 0.130 70)',
  };

  const sizes = {
    sm: { track: 'h-1.5', label: 'text-xs' },
    md: { track: 'h-2',   label: 'text-sm' },
    lg: { track: 'h-2.5', label: 'text-base' },
  };

  const sc = sizes[size];
  const trackColor = trackColorMap[color] || trackColorMap.accent;

  return (
    <div className={`w-full ${className}`}>
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-2">
          {label && (
            <label
              className={`${sc.label} font-medium`}
              style={{ color: 'var(--color-ink-2)' }}
            >
              {label}
            </label>
          )}
          {showValue && (
            <span
              className={`${sc.label} font-mono`}
              style={{
                fontFamily: 'var(--font-mono)',
                color: 'var(--color-muted)',
              }}
            >
              {valueFormatter(value)}
            </span>
          )}
        </div>
      )}

      <div className="relative">
        <div
          className={`absolute top-1/2 -translate-y-1/2 left-0 rounded-full pointer-events-none ${sc.track}`}
          style={{
            width: `${percentage}%`,
            backgroundColor: trackColor,
          }}
        />

        <div
          className={`absolute top-1/2 -translate-y-1/2 left-0 w-full ${sc.track} rounded-full pointer-events-none`}
          style={{ backgroundColor: 'var(--color-rule)' }}
        />

        <input
          ref={ref}
          type="range"
          value={value}
          onChange={(e) => onChange?.(parseFloat(e.target.value))}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className={`
            relative w-full appearance-none bg-transparent cursor-pointer
            focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2
            disabled:opacity-50 disabled:cursor-not-allowed
            ${sc.track}
          `}
          aria-label={label}
          {...props}
        />
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

export function RangeSlider({
  min,
  max,
  value,
  onChange,
  step = 1,
  formatValue,
  color = 'accent',
  size = 'md',
  className = '',
}) {
  return (
    <motion.div
      className={`w-full ${className}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
    >
      <Slider
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        step={step}
        color={color}
        size={size}
        valueFormatter={formatValue}
      />
    </motion.div>
  );
}

export function MultiRangeSlider({ ranges, onChange, className = '' }) {
  return (
    <div className={`space-y-4 ${className}`}>
      {ranges.map((range, index) => (
        <Slider
          key={index}
          label={range.label}
          value={range.value}
          onChange={(v) => onChange?.(index, v)}
          min={range.min}
          max={range.max}
          step={range.step || 1}
          color={range.color || 'accent'}
          size={range.size || 'md'}
          valueFormatter={range.format || ((v) => v.toFixed(2))}
        />
      ))}
    </div>
  );
}

export function SliderWithPresets({
  value,
  onChange,
  presets = [],
  min = 0,
  max = 100,
  step = 1,
  label,
  color = 'accent',
  className = '',
}) {
  return (
    <div className={`space-y-3 ${className}`}>
      <Slider
        label={label}
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        step={step}
        color={color}
      />

      {presets.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {presets.map((preset, index) => (
            <button
              key={index}
              onClick={() => onChange?.(preset.value)}
              className={`
                px-2.5 py-1 text-xs rounded-md
                border transition-colors duration-150
                ${value === preset.value
                  ? 'text-white border-transparent'
                  : 'border-color-rule bg-paper hover:bg-paper-2'
                }
              `}
              style={
                value === preset.value
                  ? { backgroundColor: 'var(--color-accent)', borderColor: 'var(--color-accent)' }
                  : { color: 'var(--color-ink-2)' }
              }
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default Slider;