/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#1B3A6B',
          saffron: '#F4811F',
        },
        gov: {
          success: '#2D7A3A',
          warning: '#D97706',
          danger: '#C0392B',
          info: '#2980B9',
          purple: '#7C3AED',
        },
        // Dark mode palette
        dark: {
          bg: '#0D1117',
          surface: '#161B22',
          elevated: '#1C2333',
          border: '#30363D',
          primary: '#E6EDF3',
          secondary: '#8B949E',
          muted: '#484F58',
        },
        // Light mode palette
        light: {
          bg: '#F5F7FA',
          surface: '#FFFFFF',
          elevated: '#FFFFFF',
          border: '#D0D7DE',
          primary: '#1C2526',
          secondary: '#57606A',
          muted: '#8C959F',
        },
        // Status colors mapping
        status: {
          pending: '#D97706',
          inprogress: '#1B3A6B',
          resolved: '#7C3AED',
          closed: '#2D7A3A',
          reopened: '#C0392B',
        },
        // Zone colors mapping
        zone: {
          north: '#1B3A6B',
          south: '#D97706',
          east: '#7C3AED',
          west: '#F4811F',
          central: '#2D7A3A',
        }
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'sans-serif'],
        sans: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      fontSize: {
        xs: ['11px', '16px'],
        sm: ['13px', '18px'],
        base: ['15px', '22px'],
        lg: ['17px', '24px'],
        xl: ['20px', '28px'],
        '2xl': ['24px', '32px'],
        '3xl': ['30px', '38px'],
        '4xl': ['36px', '44px'],
      },
      borderRadius: {
        'gov': '8px',
        'btn': '6px',
      },
      boxShadow: {
        'gov': '0 1px 3px rgba(0,0,0,0.12)',
      },
      animation: {
        'fade-in': 'fadeIn 150ms ease-out forwards',
        'slide-up': 'slideUp 150ms ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}

