/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Playfair Display"', 'Cormorant Garamond', 'Georgia', 'serif'],
        cinzel: ['"Cinzel"', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
      },
      colors: {
        earth: {
          50: '#fbf8f3',
          100: '#f5efe4',
          200: '#e9dcbe',
          300: '#dac293',
          400: '#cca56a',
          500: '#ba8848',
          600: '#a36d3a',
          700: '#835231',
          800: '#6d432d',
          900: '#5c3929',
        },
        moss: {
          DEFAULT: '#384632',
          dark: '#1e261a',
          light: '#53684a'
        }
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        }
      }
    },
  },
  plugins: [],
}
