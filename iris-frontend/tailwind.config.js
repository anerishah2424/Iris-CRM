/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        matrix: {
          navy:      '#0A3D7C',
          blue:      '#1A6FE8',
          lightBlue: '#D6E8FB',
          paleBlue:  '#EEF5FD',
          cyan:      '#00A8C6',
        },
        health: {
          green:  '#0FBD85',
          amber:  '#F5A623',
          red:    '#EF4444',
        },
        body:    '#4A5568',
        muted:   '#94A3B8',
        border:  '#C5D8EF',
        surface: '#F4F8FE',
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
