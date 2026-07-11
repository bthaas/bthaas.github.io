/** @type {import('tailwindcss').Config} */
export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './content/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        marble: '#FAF8F4',
        charcoal: '#1A1A1A',
        muted: '#777777',
        gold: '#D4AF37',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'Helvetica Neue', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
