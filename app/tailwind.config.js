/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper:     '#faf6ef',
        cream:     '#f3ede1',
        creamDeep: '#ebe2cf',
        ink: {
          DEFAULT: '#1a1410',
          soft:    '#4a3f35',
          muted:   '#7a6e60',
        },
        rust:  '#c44a1a',
        moss:  '#4a6b3a',
        amber: '#d99845',
        sky:   '#4a7ba8',
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      borderRadius: { 'xl2': '20px', 'xl3': '24px' },
      animation: {
        'pulse-dot':       'pulse-dot 1.8s ease-in-out infinite',
        'marquee':         'marquee 38s linear infinite',
        'fade-in':         'fadeIn .25s ease',
        'slide-up':        'slideUp .3s ease',
        'slide-in-right':  'slideInRight .35s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        'pulse-dot':   { '0%,100%': { opacity: 1, transform: 'scale(1)' }, '50%': { opacity: 0.45, transform: 'scale(1.35)' } },
        marquee:       { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } },
        fadeIn:        { from: { opacity: 0, transform: 'translateY(10px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        slideUp:       { from: { transform: 'translateY(100%)', opacity: 0.4 }, to: { transform: 'translateY(0)', opacity: 1 } },
        slideInRight:  { from: { transform: 'translateX(110%)', opacity: 0 }, to: { transform: 'translateX(0)', opacity: 1 } },
      },
    },
  },
  plugins: [],
};
