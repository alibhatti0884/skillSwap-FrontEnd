/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Roboto', 'system-ui', 'sans-serif']
      },
      colors: {
        brand: {
          50: '#eefdf6',
          100: '#d6f9e8',
          500: '#10b981',
          600: '#059669',
          700: '#047857'
        }
      }
    }
  },
  plugins: []
};
