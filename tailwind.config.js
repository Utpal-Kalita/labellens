/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0F172A',
        primary: '#172554',
        accent: '#2563EB',
        success: '#16A34A',
        warning: '#D97706',
        surface: '#F8FAFC',
        line: '#E2E8F0',
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
};
