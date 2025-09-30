/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f0f4f8',
          100: '#d6e3f0',
          200: '#b8d0e8',
          300: '#8fb4dd',
          400: '#6b96d0',
          500: '#4f7ac2',
          600: '#1e40af',
          700: '#1e3a8a',
          800: '#1e3a8a',
          900: '#1e2a5a',
        },
        gold: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#f59e0b',
          500: '#d97706',
          600: '#b45309',
          700: '#92400e',
          800: '#78350f',
          900: '#451a03',
        }
      }
    },
  },
  plugins: [],
};