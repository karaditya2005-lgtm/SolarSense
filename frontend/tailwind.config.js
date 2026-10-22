/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        solar: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
        slate: {
          850: '#111827',
          925: '#090d16',
          950: '#030712',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
      boxShadow: {
        'solar-sm': '0 2px 8px -2px rgba(16, 185, 129, 0.25)',
        'solar-md': '0 8px 24px -4px rgba(16, 185, 129, 0.30)',
        'solar-lg': '0 12px 36px -6px rgba(16, 185, 129, 0.35)',
      },
    },
  },
  plugins: [],
};
