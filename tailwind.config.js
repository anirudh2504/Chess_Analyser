/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        midnight: '#06111f',
        panel: '#0a1a2d',
        cyanGlow: '#72d9ff',
        mintGlow: '#31f6a4',
        dangerGlow: '#fb7185',
      },
      boxShadow: {
        glow: '0 0 32px rgba(114, 217, 255, 0.22)',
        mint: '0 0 28px rgba(49, 246, 164, 0.22)',
      },
      fontFamily: {
        display: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
