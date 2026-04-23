/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        coral: {
          50:  '#FFF5F2',
          100: '#FFE6DD',
          200: '#FFCCBB',
          300: '#FFB3AA',
          400: '#FF9988',
          500: '#FF7766',
          600: '#FF6644',
          700: '#FF5533',
        },
        lavender: {
          50:  '#F9F5FF',
          100: '#F0E6FF',
          200: '#E6CCFF',
          300: '#DDBBFF',
          400: '#D4AAFF',
          500: '#CC99FF',
          600: '#BB88FF',
        },
        mint: {
          50:  '#F0FFF9',
          100: '#D9FFEF',
          200: '#CCFFE6',
          300: '#99FFDD',
          400: '#66FFCC',
          500: '#33FFBB',
          600: '#00FFAA',
        },
        gold: {
          50:  '#FFFEF0',
          100: '#FFFCD1',
          200: '#FFFFB3',
          300: '#FFFD99',
          400: '#FFFC80',
          500: '#FFD700',
          600: '#FFC700',
        },
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        body: ['Pretendard', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
