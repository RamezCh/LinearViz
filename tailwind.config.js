/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: 'var(--color-paper)',
          2: 'var(--color-paper-2)',
          3: 'var(--color-paper-3)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          2: 'var(--color-accent-2)',
          3: 'var(--color-accent-3)',
        },
        ink: {
          DEFAULT: 'var(--color-ink)',
          2: 'var(--color-ink-2)',
        },
        muted: 'var(--color-muted)',
        neutral: 'var(--color-neutral)',
        rule: {
          DEFAULT: 'var(--color-rule)',
          2: 'var(--color-rule-2)',
        },
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e7',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        canvas: {
          grid: '#e5e7eb',
          gridDark: '#374151',
        },
        vector: {
          u: '#ef4444',
          v: '#22c55e',
          w: '#3b82f6',
        },
        formula: {
          highlight: '#fef08a',
          highlightDark: '#a16207',
        },
        emerald: {
          DEFAULT: 'var(--color-emerald)',
        },
        red: {
          DEFAULT: 'var(--color-red)',
        },
        amber: {
          DEFAULT: 'var(--color-amber)',
        },
        blue: {
          DEFAULT: 'var(--color-blue)',
        },
        violet: {
          DEFAULT: 'var(--color-violet)',
        },
        teal: {
          DEFAULT: 'var(--color-teal)',
        },
        green: {
          DEFAULT: 'var(--color-green)',
        },
      },
      fontFamily: {
        display: ['var(--font-display)'],
        sans: ['var(--font-body)'],
        mono: ['var(--font-mono)'],
      },
      fontSize: {
        xs:   'var(--text-xs)',
        sm:   'var(--text-sm)',
        base: 'var(--text-base)',
        md:   'var(--text-md)',
        lg:   'var(--text-lg)',
        xl:   'var(--text-xl)',
        '2xl':'var(--text-2xl)',
        '3xl':'var(--text-3xl)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'slide-in-left': 'slideInLeft 0.3s ease-out',
        'lift': 'lift 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        lift: {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(-2px)' },
        },
      },
    },
  },
  plugins: [],
}