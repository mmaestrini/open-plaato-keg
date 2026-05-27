/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // "Warm brewery" palette. Values are intentionally accessed via
        // CSS variables (in src/index.css) so we can swap dark/light
        // without re-rendering Tailwind classes.
        bg:           'rgb(var(--bg) / <alpha-value>)',
        'bg-elev':    'rgb(var(--bg-elev) / <alpha-value>)',
        'bg-card':    'rgb(var(--bg-card) / <alpha-value>)',
        'bg-card-h':  'rgb(var(--bg-card-h) / <alpha-value>)',
        border:       'rgb(var(--border) / <alpha-value>)',
        'border-s':   'rgb(var(--border-s) / <alpha-value>)',
        text:         'rgb(var(--text) / <alpha-value>)',
        'text-muted': 'rgb(var(--text-muted) / <alpha-value>)',
        'text-dim':   'rgb(var(--text-dim) / <alpha-value>)',
        accent:       'rgb(var(--accent) / <alpha-value>)',
        'accent-deep':'rgb(var(--accent-deep) / <alpha-value>)',
        success:      'rgb(var(--success) / <alpha-value>)',
        warn:         'rgb(var(--warn) / <alpha-value>)',
      },
      boxShadow: {
        glow: '0 4px 14px var(--accent-glow-css)',
        'glow-lg': '0 8px 28px var(--accent-glow-css)',
      },
      animation: {
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
      },
      keyframes: {
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.45' },
        },
      },
    },
  },
  plugins: [],
}
