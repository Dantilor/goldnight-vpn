/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#f2ca50',
        'primary-container': '#d4af37',
        surface: '#131313',
        'surface-container-low': '#1c1b1b',
        'surface-container-highest': '#353534',
        'outline-variant': '#4d4635',
        'on-surface-variant': '#d0c5af'
      },
      fontFamily: {
        headline: ['Manrope', 'Inter', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
};
