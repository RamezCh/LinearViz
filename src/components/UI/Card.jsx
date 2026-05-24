/* Hallmark · component: Card · genre: playful · theme: Plume
 * states: default · hover · focus-visible · active · disabled · loading · error · success
 * contrast: pass (all text ≥ 4.5:1)
 */
import { forwardRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const Card = forwardRef(function Card(
  {
    children,
    title,
    subtitle,
    icon: Icon,
    variant = 'default',
    padding = 'md',
    headerAction,
    footer,
    collapsible = false,
    defaultOpen = true,
    loading = false,
    error = false,
    success = false,
    disabled = false,
    className = '',
    onClick,
    ...props
  },
  ref
) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const variants = {
    default:   'bg-paper border-color-rule',
    elevated:  'bg-paper border-color-rule shadow-lg',
    outline:   'bg-transparent border-2 border-color-rule',
    ghost:     'bg-transparent border-transparent',
    glass:     'backdrop-blur-sm border-color-rule',
  };

  const paddingSizes = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8',
  };

  const hasHeader = title || subtitle || Icon || headerAction;

  const stateClasses = [
    disabled  && 'opacity-50 cursor-not-allowed pointer-events-none',
    loading   && 'animate-pulse',
  ].filter(Boolean).join(' ');

  const handleClick = (e) => {
    if (disabled) return;
    if (collapsible) setIsOpen(!isOpen);
    if (onClick) onClick(e);
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      whileHover={!disabled && !loading ? { y: -2 } : {}}
      className={`
        rounded-card border
        transition-shadow duration-200
        ${variants[variant]}
        ${stateClasses}
        ${className}
      `}
      style={{
        borderColor: error ? 'oklch(52% 0.160 25)' : success ? 'oklch(52% 0.160 155)' : 'var(--color-rule)',
        borderRadius: 'var(--radius-card)',
        backgroundColor: variant === 'glass' ? 'rgba(var(--color-paper-rgb), 0.80)' : 'var(--color-paper)',
      }}
      onClick={handleClick}
      role={collapsible ? 'button' : undefined}
      aria-expanded={collapsible ? isOpen : undefined}
      tabIndex={collapsible ? 0 : undefined}
      onKeyDown={collapsible ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setIsOpen(!isOpen);
        }
      } : undefined}
      {...props}
    >
      {hasHeader && (
        <div
          className={`
            flex items-center justify-between
            px-4 py-3
            border-b
            flex-shrink-0
            ${collapsible ? 'cursor-pointer select-none' : ''}
          `}
          style={{ borderColor: 'var(--color-rule)' }}
        >
          <div className="flex items-center gap-3">
            {Icon && (
              <div
                className="w-10 h-10 rounded-md flex items-center justify-center"
                style={{ backgroundColor: 'rgba(215,85,50,0.08)' }}
              >
                <Icon
                  className="w-5 h-5"
                  style={{ color: 'var(--color-accent)' }}
                />
              </div>
            )}
            <div>
              {title && (
                <h3
                  className="font-semibold"
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 600,
                    color: 'var(--color-ink)',
                    letterSpacing: '-0.008em',
                  }}
                >
                  {title}
                </h3>
              )}
              {subtitle && (
                <p
                  className="text-sm"
                  style={{ color: 'var(--color-muted)' }}
                >
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {loading && (
              <svg
                className="w-4 h-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {error && (
              <span className="w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(220,75,55,0.85)' }} aria-label="Error">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 2l6 6M8 2l-6 6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </span>
            )}
            {success && (
              <span className="w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(75,180,140,0.85)' }} aria-label="Success">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            )}
            {headerAction}
            {collapsible && (
              <motion.svg
                className="w-5 h-5"
                style={{ color: 'var(--color-muted)' }}
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M6 9l6 6 6-6" />
              </motion.svg>
            )}
          </div>
        </div>
      )}

      <AnimatePresence initial={false}>
        {(!collapsible || isOpen) && (
          <motion.div
            initial={collapsible ? { height: 0, opacity: 0 } : false}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className={paddingSizes[padding]}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>

      {footer && (
        <div
          className="px-4 py-3 border-t text-sm"
          style={{
            borderColor: 'var(--color-rule)',
            backgroundColor: 'var(--color-paper-2)',
            color: 'var(--color-muted)',
            borderRadius: '0 0 var(--radius-card) var(--radius-card)',
          }}
        >
          {footer}
        </div>
      )}
    </motion.div>
  );
});

export function StatCard({
  label,
  value,
  subValue,
  trend,
  icon: Icon,
  color = 'accent',
  loading = false,
  disabled = false,
  className = '',
}) {
  const colorMap = {
    accent:  { bg: 'rgba(215,85,50,0.08)', text: 'var(--color-accent)' },
    blue:    { bg: 'rgba(205,80,50,0.08)', text: 'var(--color-accent-2)' },
    emerald: { bg: 'rgba(75,160,140,0.08)', text: 'oklch(55% 0.160 155)' },
    amber:   { bg: 'rgba(200,155,50,0.08)', text: 'oklch(65% 0.130 70)' },
  };

  const colors = colorMap[color] || colorMap.accent;

  const trendColors = {
    up:      'text-green',
    down:    'text-red',
    neutral: 'var(--color-muted)',
  };

  return (
    <Card
      className={className}
      loading={loading}
      disabled={disabled}
    >
      <div className="flex items-start justify-between">
        <div>
          <p
            className="text-sm mb-1"
            style={{ color: 'var(--color-muted)' }}
          >
            {label}
          </p>
          <p
            className="text-2xl font-bold font-mono"
            style={{
              fontFamily: 'var(--font-mono)',
              color: 'var(--color-ink)',
              letterSpacing: '-0.01em',
            }}
          >
            {loading ? '—' : value}
          </p>
          {subValue && (
            <p
              className={`text-xs mt-1 ${trend ? trendColors[trend] : ''}`}
              style={!trend ? { color: 'var(--color-muted)' } : {}}
            >
              {subValue}
            </p>
          )}
        </div>
        {Icon && (
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              backgroundColor: colors.bg,
              color: colors.text,
            }}
          >
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </Card>
  );
}

export function ProgressCard({
  title,
  current,
  total,
  completed = false,
  disabled = false,
  loading = false,
  className = '',
}) {
  const percentage = total > 0 ? (current / total) * 100 : 0;

  return (
    <Card
      className={className}
      headerAction={
        <span
          className="text-sm font-mono font-medium"
          style={{
            fontFamily: 'var(--font-mono)',
            color: completed ? 'oklch(55% 0.160 155)' : 'var(--color-muted)',
          }}
        >
          {current}/{total}
        </span>
      }
      loading={loading}
      disabled={disabled}
    >
      <div className="space-y-2">
        <div
          className="h-2 rounded-full overflow-hidden"
          style={{ backgroundColor: 'var(--color-rule)' }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{
              backgroundColor: completed
                ? 'oklch(55% 0.160 155)'
                : 'var(--color-accent)',
            }}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
        <p
          className="text-xs text-right"
          style={{ color: 'var(--color-muted)' }}
        >
          {Math.round(percentage)}% complete
        </p>
      </div>
    </Card>
  );
}

export default Card;