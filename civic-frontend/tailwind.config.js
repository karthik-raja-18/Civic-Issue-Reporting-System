/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        display: ['Syne', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        civic: {
          50:  '#eefbf4',
          100: '#d6f5e3',
          200: '#b0eaca',
          300: '#7dd9ad',
          400: '#48c08a',
          500: '#25a470',
          600: '#188457',
          700: '#146947',
          800: '#135439',
          900: '#114530',
          950: '#08271d',
        },
        ink: {
          50:  '#f4f6f9',
          100: '#e8ecf2',
          200: '#cfd8e3',
          300: '#a9bac9',
          400: '#7e97ab',
          500: '#5e7991',
          600: '#4b6278',
          700: '#3e5063',
          800: '#364455',
          900: '#303b49',
          950: '#1c2330',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease forwards',
        'slide-up': 'slideUp 0.4s ease forwards',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        slideUp: {
          from: { opacity: 0, transform: 'translateY(16px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
