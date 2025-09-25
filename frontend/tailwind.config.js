/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Palette Decora - Tons verts, marrons et blancs
        primary: {
          50: '#f0f9f4',
          100: '#dcf2e6',
          200: '#bce5d1',
          300: '#8dd1b3',
          400: '#56b890',
          500: '#2d9b6f', // Vert principal
          600: '#227d5a',
          700: '#1d6349',
          800: '#1a503c',
          900: '#164232',
        },
        secondary: {
          50: '#faf7f0',
          100: '#f4ede0',
          200: '#e8d9c1',
          300: '#d9c19a',
          400: '#c9a573',
          500: '#b8945f', // Marron principal
          600: '#9d7a4f',
          700: '#826142',
          800: '#6b5037',
          900: '#58422f',
        },
        gold: {
          50: '#fefdf8',
          100: '#fdf9ed',
          200: '#faf0d6',
          300: '#f6e4b8',
          400: '#f0d491',
          500: '#e8c06a', // Or principal
          600: '#d4a847',
          700: '#b8903a',
          800: '#967332',
          900: '#7a5d2e',
        },
        accent: {
          50: '#f6f7f8',
          100: '#e8ebed',
          200: '#d1d7db',
          300: '#a8b3ba',
          400: '#7d8b95',
          500: '#5a6b76', // Gris accent
          600: '#4a5760',
          700: '#3e4850',
          800: '#363d43',
          900: '#2f3439',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
} 