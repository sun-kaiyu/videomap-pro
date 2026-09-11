/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        vm: {
          bg: '#0f1115',
          panel: '#181a20',
          panelHover: '#20232b',
          border: '#2a2d36',
          accent: '#0ea5e9',
          accentHover: '#0284c7',
          text: '#e2e4e9',
          muted: '#8b92a8',
          success: '#22c55e',
          warning: '#f59e0b',
          danger: '#ef4444',
          purple: '#8b5cf6'
        }
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'sans-serif']
      }
    }
  },
  plugins: []
}
