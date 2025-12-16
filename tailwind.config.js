/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    screens: {
      'xs': '480px',   // Extra small devices
      'sm': '640px',   // Small devices (default)
      'md': '768px',   // Medium devices (default)
      'lg': '1024px',  // Large devices (default)
      'xl': '1280px',  // Extra large devices (default)
      '2xl': '1536px', // 2x Extra large devices (default)
    },
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
