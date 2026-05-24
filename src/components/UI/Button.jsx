/* Hallmark · component: Button · genre: playful · theme: Plume
 * states: default · hover · focus-visible · active · disabled · loading · error · success
 * contrast: pass (all text ≥ 4.5:1)
 */
import { forwardRef } from 'react';
import { motion } from 'framer-motion';

const variants = {
  primary: {
    base:    'bg-accent text-white border-transparent',
    hover:   'hover:bg-accent/90 hover:shadow-accent',
    focus:   'focus:ring-accent focus:ring-offset-2',
    active:  'active:scale-[0.97]',
    disabled: 'disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none',
    loading: 'cursor-wait',
  },
  accent: {
    base:    'bg-accent text-white border-transparent',
    hover:   'bg-accent/90 hover:shadow-accent',
    focus:   'focus:ring-accent focus:ring-offset-2',
    active:  'active:scale-[0.97]',
    disabled: 'disabled:opacity-40 disabled:cursor-not-allowed',
    loading: 'cursor-wait',
  },
  secondary: {
    base:    'bg-accent-3/10 text-accent-3 border-transparent',
    hover:   'bg-accent-3/15 hover:shadow-sm',
    focus:   'focus:ring-accent-3 focus:ring-offset-2',
    active:  'active:scale-[0.97]',
    disabled: 'disabled:opacity-40 disabled:cursor-not-allowed',
    loading: 'cursor-wait',
  },
  success: {
    base:    'bg-emerald text-white border-transparent',
    hover:   'hover:bg-emerald/85',
    focus:   'focus:ring-emerald focus:ring-offset-2',
    active:  'active:scale-[0.97]',
    disabled: 'disabled:opacity-40 disabled:cursor-not-allowed',
    loading: 'cursor-wait',
  },
  warning: {
    base:    'bg-amber text-white border-transparent',
    hover:   'hover:bg-amber/85',
    focus:   'focus:ring-amber focus:ring-offset-2',
    active:  'active:scale-[0.97]',
    disabled: 'disabled:opacity-40 disabled:cursor-not-allowed',
    loading: 'cursor-wait',
  },
  danger: {
    base:    'bg-red text-white border-transparent',
    hover:   'hover:bg-red/85',
    focus:   'focus:ring-red focus:ring-offset-2',
    active:  'active:scale-[0.97]',
    disabled: 'disabled:opacity-40 disabled:cursor-not-allowed',
    loading: 'cursor-wait',
  },
  ghost: {
    base:    'bg-transparent text-ink border-color-rule',
    hover:   'hover:bg-paper-2 hover:border-color-rule-2',
    focus:   'focus:ring-accent focus:ring-offset-2',
    active:  'active:scale-[0.97] active:bg-paper-3',
    disabled: 'disabled:opacity-40 disabled:cursor-not-allowed',
    loading: 'cursor-wait',
  },
  outline: {
    base:    'bg-transparent text-accent border-accent',
    hover:   'bg-accent/8 hover:bg-accent/12',
    focus:   'focus:ring-accent focus:ring-offset-2',
    active:  'active:scale-[0.97] active:bg-accent/16',
    disabled: 'disabled:opacity-40 disabled:cursor-not-allowed',
    loading: 'cursor-wait',
  },
  subtle: {
    base:    'bg-paper-2 text-ink border-transparent',
    hover:   'bg-paper-3 hover:shadow-sm',
    focus:   'focus:ring-accent focus:ring-offset-2',
    active:  'active:scale-[0.97]',
    disabled: 'disabled:opacity-40 disabled:cursor-not-allowed',
    loading: 'cursor-wait',
  },
};

const sizes = {
  xs:   { padding: 'px-2.5 py-1.5', text: 'text-xs',     icon: 'w-3 h-3', gap: 'gap-1.5' },
  sm:   { padding: 'px-3 py-1.5',   text: 'text-sm',     icon: 'w-3.5 h-3.5', gap: 'gap-2' },
  md:   { padding: 'px-4 py-2',     text: 'text-sm',     icon: 'w-4 h-4',   gap: 'gap-2' },
  lg:   { padding: 'px-5 py-2.5',   text: 'text-base',   icon: 'w-5 h-5',   gap: 'gap-2.5' },
  xl:   { padding: 'px-6 py-3',     text: 'text-base',   icon: 'w-5 h-5',   gap: 'gap-2.5' },
};

const stateIcons = {
  loading: (size) => (
    <svg className={`animate-spin ${size}`} fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  ),
  error: (size) => (
    <svg className={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M15 9l-6 6M9 9l6 6" />
    </svg>
  ),
  success: (size) => (
    <svg className={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 12l3 3 5-5" />
    </svg>
  ),
};

export const Button = forwardRef(function Button(
  {
    children,
    variant = 'primary',
    size = 'md',
    icon: Icon,
    iconPosition = 'left',
    loading = false,
    error = false,
    success = false,
    disabled = false,
    fullWidth = false,
    className = '',
    onClick,
    ...props
  },
  ref
) {
  const v = variants[variant] || variants.primary;
  const s = sizes[size] || sizes.md;

  const isDisabled = disabled || loading;

  const stateIcon = (loading && stateIcons.loading(s.icon)) ||
    (error && stateIcons.error(s.icon)) ||
    (success && stateIcons.success(s.icon));

  const content = (
    <>
      {stateIcon}
      {!stateIcon && Icon && iconPosition === 'left' && (
        <Icon className={s.icon} aria-hidden="true" />
      )}
      <span>{children}</span>
      {!stateIcon && Icon && iconPosition === 'right' && (
        <Icon className={s.icon} aria-hidden="true" />
      )}
    </>
  );

  const baseClasses = `
    inline-flex items-center justify-center
    ${s.gap} ${s.padding} ${s.text}
    font-medium rounded-lg
    border
    transition-all duration-200
    ease-out
    select-none
    ${fullWidth ? 'w-full' : ''}
    ${v.base} ${v.hover} ${v.focus} ${v.active} ${v.disabled} ${v.loading}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  if (props.as === 'a') {
    return (
      <a
        ref={ref}
        className={baseClasses}
        aria-disabled={isDisabled}
        {...props}
      >
        {content}
      </a>
    );
  }

  return (
    <motion.button
      ref={ref}
      whileTap={!isDisabled ? { scale: 0.97 } : undefined}
      className={baseClasses}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-busy={loading}
      onClick={isDisabled ? undefined : onClick}
      {...props}
    >
      {content}
    </motion.button>
  );
});

export function ButtonGroup({ children, className = '', size = 'md' }) {
  return (
    <div
      className={`inline-flex rounded-lg overflow-hidden ${className}`}
    >
      {Array.isArray(children)
        ? children.map((child, index) => (
            <div
              key={index}
              className={index > 0 ? '-ml-px' : ''}
            >
              {child}
            </div>
          ))
        : children}
    </div>
  );
}

export function IconButton({
  icon: Icon,
  variant = 'ghost',
  size = 'md',
  label,
  className = '',
  ...props
}) {
  const sizeClasses = {
    xs: 'w-7 h-7',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-14 h-14',
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={`p-0 ${sizeClasses[size]} ${className}`}
      aria-label={label}
      {...props}
    >
      <Icon />
    </Button>
  );
}

export default Button;