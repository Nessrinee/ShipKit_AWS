/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body:     ['Exo 2', 'sans-serif'],
        mono:     ['JetBrains Mono', 'monospace'],
      },
      colors: {
        bg:      '#06080b',
        surface: '#090d12',
        card:    '#0d1219',
        border:  '#1e2d3d',
        accent:  '#00ff7f',
        blue:    '#00c8ff',
        yellow:  '#ffe44d',
        muted:   '#3e5a72',
        text:    '#8faec4',
        text2:   '#c4dcea',
        heading: '#dff0ff',
      },
      animation: {
        'fade-up':   'fadeUp 0.6s ease both',
        'blink':     'blink 1s step-end infinite',
        'glow':      'glow 3s ease infinite',
        'pulse-slow':'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        blink: { '50%': { opacity: '0' } },
        glow: {
          '0%,100%': { boxShadow: '0 0 20px rgba(0,255,127,.15)' },
          '50%':      { boxShadow: '0 0 40px rgba(0,255,127,.35)' },
        },
      },
    },
  },
  plugins: [],
};
