const plugin = require('tailwindcss/plugin');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        arabic: ['var(--font-cairo)', 'sans-serif'],
      },
      colors: {
        category: {
          alkali: '#f43f5e',
          alkaline: '#fb923c',
          transition: '#f59e0b',
          'post-transition': '#eab308',
          metalloid: '#84cc16',
          nonmetal: '#06b6d4',
          halogen: '#3b82f6',
          noble: '#a855f7',
          lanthanide: '#ec4899',
          actinide: '#10b981',
        },
        quantum: {
          dark: '#030712',
          card: 'rgba(15, 23, 42, 0.75)',
          border: 'rgba(255, 255, 255, 0.1)',
          cyan: '#06b6d4',
          glow: 'rgba(6, 182, 212, 0.5)',
          gold: '#facc15',
          crimson: '#ef4444',
          sky: '#38bdf8',
          violet: '#8b5cf6',
          emerald: '#10b981',
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 12s linear infinite',
        // Used by several panels and modals (were previously undefined, so they did nothing)
        fadeIn: 'fadeIn 0.25s ease-out both',
        'fade-in': 'fadeIn 0.25s ease-out both',
        slideInRight: 'slideInEnd 0.3s ease-out both',
        slideUp: 'slideUp 0.28s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideInEnd: { from: { opacity: '0', transform: 'translateX(24px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        slideUp: { from: { transform: 'translateY(100%)' }, to: { transform: 'translateY(0)' } },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [
    // `coarse:` — finger input (phones/tablets): larger tap targets without changing the desktop look
    // `can-hover:` — real hover devices only, so hover effects don't stick after a tap
    plugin(({ addVariant }) => {
      addVariant('coarse', '@media (pointer: coarse)');
      addVariant('can-hover', '@media (hover: hover)');
    }),
  ],
}
