/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        'primary-hover': 'var(--color-primary-hover)',
        secondary: 'var(--color-secondary)',
        'secondary-hover': 'var(--color-secondary-hover)',
        accent: 'var(--color-accent)',
        'text-main': 'var(--color-text-main)',
        'text-dim': 'var(--color-text-dim)',
        'bg-main': 'var(--color-bg-main)',
        'bg-light': 'var(--color-bg-light)',
        'bg-lighter': 'var(--color-bg-lighter)',
        'border-color': 'var(--color-border)',
      }
    },
  },
  plugins: [],
}
