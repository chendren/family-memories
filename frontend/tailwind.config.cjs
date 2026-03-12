/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['"Source Sans 3"', 'system-ui', 'sans-serif'],
      },
      colors: {
        cream: {
          50: '#FFFDFB',
          100: '#FDF8F3',
          200: '#FAF0E6',
          300: '#F5E6D3',
        },
        sand: {
          100: '#F0E6D6',
          200: '#E8DDD3',
          300: '#D4C5B0',
          400: '#BBA88F',
        },
        walnut: {
          400: '#A08B7A',
          500: '#8C7A6B',
          600: '#6B5B4E',
          700: '#554840',
          800: '#433832',
          900: '#3D2C2E',
        },
        terracotta: {
          50: '#FFF0EB',
          100: '#FFE0D6',
          200: '#FFC4AD',
          300: '#FFA07A',
          400: '#F08060',
          500: '#E07A5F',
          600: '#C4644D',
          700: '#A34F3C',
        },
        sage: {
          50: '#F0F7F3',
          100: '#D4EBE0',
          200: '#B5D9C7',
          300: '#81B29A',
          400: '#6A9A82',
          500: '#548068',
        },
        gold: {
          50: '#FFF8EB',
          100: '#FFECC7',
          200: '#FFDB8F',
          300: '#DDA15E',
          400: '#C58B3F',
          500: '#A67428',
        },
      },
      boxShadow: {
        'card': '0 2px 12px rgba(61, 44, 46, 0.08), 0 1px 3px rgba(61, 44, 46, 0.04)',
        'card-hover': '0 8px 30px rgba(61, 44, 46, 0.12), 0 2px 8px rgba(61, 44, 46, 0.06)',
        'warm': '0 4px 20px rgba(224, 122, 95, 0.15)',
      },
    },
  },
  plugins: [],
};
