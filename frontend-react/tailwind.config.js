/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        nav:      '#060E20',
        nav2:     '#0A1628',
        primary:  '#2563EB',
        accent:   '#3B82F6',
        cyan:     '#06B6D4',
        page:     '#F0F4FF',
      },
      fontFamily: {
        sans:    ['"Inter"', '"Plus Jakarta Sans"', 'sans-serif'],
        display: ['"Inter"', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        card:       '0 1px 3px rgba(0,0,0,0.06), 0 6px 24px rgba(37,99,235,0.07)',
        'card-hover':'0 4px 12px rgba(0,0,0,0.08), 0 12px 40px rgba(37,99,235,0.14)',
        glow:       '0 0 24px rgba(59,130,246,0.35)',
        'glow-sm':  '0 0 12px rgba(59,130,246,0.25)',
        'glow-green':'0 0 16px rgba(16,185,129,0.3)',
      },
      backgroundImage: {
        'grad-blue':  'linear-gradient(135deg, #1D4ED8 0%, #2563EB 50%, #3B82F6 100%)',
        'grad-green': 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
        'grad-red':   'linear-gradient(135deg, #DC2626 0%, #EF4444 100%)',
        'grad-gold':  'linear-gradient(135deg, #D97706 0%, #F59E0B 100%)',
        'grad-cyan':  'linear-gradient(135deg, #0891B2 0%, #06B6D4 100%)',
        'grad-page':  'linear-gradient(145deg, #EEF2FF 0%, #F0F9FF 50%, #F5F3FF 100%)',
        'grad-card':  'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(248,250,255,0.98) 100%)',
        'grad-nav':   'linear-gradient(180deg, #060E20 0%, #0A1628 100%)',
      },
      animation: {
        'fade-up':     'fadeUp 0.4s ease both',
        'pulse-slow':  'pulse 2.5s cubic-bezier(0.4,0,0.6,1) infinite',
        'glow-pulse':  'glowPulse 2s ease-in-out infinite',
        'slide-in':    'slideIn 0.3s ease both',
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%':   { opacity: '0', transform: 'translateX(-8px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 8px rgba(59,130,246,0.3)' },
          '50%':      { boxShadow: '0 0 20px rgba(59,130,246,0.6)' },
        },
      },
    },
  },
  plugins: [],
}
