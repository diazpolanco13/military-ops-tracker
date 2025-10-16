/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'military-bg-primary': '#0f172a',
        'military-bg-secondary': '#1e293b',
        'military-bg-sidebar': '#334155',
        'military-accent-primary': '#3b82f6',
        'military-accent-danger': '#ef4444',
        'military-accent-success': '#10b981',
        'military-accent-warning': '#f59e0b',
        'military-text-primary': '#f1f5f9',
        'military-text-secondary': '#94a3b8',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
