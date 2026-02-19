/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#F0F4F8',
          100: '#DFE7F0',
          200: '#BFCFE0',
          300: '#9FB7D0',
          400: '#7F9FC0',
          500: '#143352',
          600: '#0F1F2D',
          700: '#0B1620',
          800: '#050B11',
          900: '#000000',
        },
        neutral: {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
      },
      fontFamily: {
        heading: ['Poppins', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.04)',
        'card': '0 1px 3px rgba(0, 0, 0, 0.05)',
      },
      borderRadius: {
        DEFAULT: '0px',
      },
    },
  },
  plugins: [],
}
