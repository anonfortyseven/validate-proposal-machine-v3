/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Bebas Neue"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Modern accent - vibrant red
        accent: {
          DEFAULT: '#e63946',
          secondary: '#d62839',
          glow: 'rgba(230, 57, 70, 0.25)',
          subtle: 'rgba(230, 57, 70, 0.1)',
        },
        // Background scale
        bg: {
          primary: '#0c0c0e',
          secondary: '#121215',
          tertiary: '#18181c',
          elevated: '#1e1e23',
          card: '#25252b',
        },
        // Surface colors
        surface: {
          hover: '#2a2a32',
          active: '#32323a',
          subtle: 'rgba(255, 255, 255, 0.03)',
        },
        // Text colors
        text: {
          primary: '#ffffff',
          secondary: '#b4b4be',
          tertiary: '#7c7c8a',
          muted: '#52525e',
          disabled: '#3f3f4a',
        },
        // Border colors
        border: {
          subtle: 'rgba(255, 255, 255, 0.06)',
          DEFAULT: 'rgba(255, 255, 255, 0.1)',
          strong: 'rgba(255, 255, 255, 0.15)',
          accent: 'rgba(255, 107, 74, 0.4)',
        },
        // Status colors
        status: {
          success: '#4ade80',
          'success-subtle': 'rgba(74, 222, 128, 0.1)',
          warning: '#fbbf24',
          'warning-subtle': 'rgba(251, 191, 36, 0.1)',
          error: '#f87171',
          'error-subtle': 'rgba(248, 113, 113, 0.1)',
          info: '#60a5fa',
        },
        // Legacy support for old color names
        'validate-red': {
          DEFAULT: '#ff6b4a',
          glow: 'rgba(255, 107, 74, 0.25)',
          deep: '#e55a3a',
        },
        // Custom blacks (for backward compatibility)
        'black': {
          DEFAULT: '#0c0c0e',
          pure: '#0c0c0e',
          deep: '#121215',
          warm: '#18181c',
          card: '#25252b',
          elevated: '#1e1e23',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
        'fade-in-up': 'fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in-scale': 'fadeInScale 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-left': 'slideInLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-right': 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-subtle': 'pulseSubtle 2s ease-in-out infinite',
        'spin': 'spin 1s linear infinite',
        'shimmer': 'shimmer 1.5s infinite',
        'bounce-subtle': 'bounceSubtle 2s ease-in-out infinite',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInScale: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        spin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(255, 107, 74, 0.25)' },
          '50%': { boxShadow: '0 0 40px rgba(255, 107, 74, 0.25), 0 0 60px rgba(255, 107, 74, 0.1)' },
        },
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'out-quart': 'cubic-bezier(0.25, 1, 0.5, 1)',
      },
      boxShadow: {
        'sm': '0 1px 2px rgba(0, 0, 0, 0.3)',
        'md': '0 4px 12px rgba(0, 0, 0, 0.4)',
        'lg': '0 8px 24px rgba(0, 0, 0, 0.5)',
        'xl': '0 16px 48px rgba(0, 0, 0, 0.6)',
        'glow': '0 0 40px rgba(255, 107, 74, 0.15)',
        'glow-strong': '0 0 60px rgba(255, 107, 74, 0.25)',
        'inner-light': 'inset 0 1px 0 rgba(255, 255, 255, 0.05)',
      },
      borderRadius: {
        'sm': '6px',
        'DEFAULT': '8px',
        'md': '10px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '20px',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      fontSize: {
        '2xs': ['11px', { lineHeight: '1.5' }],
        'xs': ['12px', { lineHeight: '1.5' }],
        'sm': ['13px', { lineHeight: '1.5' }],
        'base': ['14px', { lineHeight: '1.6' }],
        'lg': ['16px', { lineHeight: '1.5' }],
        'xl': ['20px', { lineHeight: '1.3' }],
        '2xl': ['24px', { lineHeight: '1.2' }],
        '3xl': ['32px', { lineHeight: '1.1' }],
      },
    },
  },
  plugins: [],
}
