/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--color-primary)',
          50: 'color-mix(in srgb, var(--color-primary) 5%, white)',
          100: 'color-mix(in srgb, var(--color-primary) 10%, white)',
          200: 'color-mix(in srgb, var(--color-primary) 30%, white)',
          300: 'color-mix(in srgb, var(--color-primary) 50%, white)',
          400: 'color-mix(in srgb, var(--color-primary) 70%, white)',
          500: 'var(--color-primary)',
          600: 'color-mix(in srgb, var(--color-primary) 90%, black)',
          700: 'color-mix(in srgb, var(--color-primary) 80%, black)',
          800: 'color-mix(in srgb, var(--color-primary) 70%, black)',
          900: 'color-mix(in srgb, var(--color-primary) 60%, black)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          50: 'color-mix(in srgb, var(--color-accent) 5%, white)',
          100: 'color-mix(in srgb, var(--color-accent) 10%, white)',
          200: 'color-mix(in srgb, var(--color-accent) 30%, white)',
          300: 'color-mix(in srgb, var(--color-accent) 50%, white)',
          400: 'color-mix(in srgb, var(--color-accent) 70%, white)',
          500: 'var(--color-accent)',
          600: 'color-mix(in srgb, var(--color-accent) 90%, black)',
          700: 'color-mix(in srgb, var(--color-accent) 80%, black)',
          800: 'color-mix(in srgb, var(--color-accent) 70%, black)',
          900: 'color-mix(in srgb, var(--color-accent) 60%, black)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
        'slide-up': 'slideUp 0.5s ease-out',
        'fade-in': 'fadeIn 0.3s ease-in',
        'scale-up': 'scaleUp 0.3s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%, 100%': { opacity: 1, boxShadow: '0 0 20px var(--color-primary)' },
          '50%': { opacity: 0.6, boxShadow: '0 0 40px var(--color-primary)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        scaleUp: {
          '0%': { transform: 'scale(0.95)', opacity: 0 },
          '100%': { transform: 'scale(1)', opacity: 1 },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};