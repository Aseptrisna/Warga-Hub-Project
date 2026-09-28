/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        success: { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' },
        warning: { bg: '#fffbeb', text: '#b45309', border: '#fde68a' },
        danger: { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca' },
        info: { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
      },
      borderRadius: {
        DEFAULT: '6px',
        md: '8px',
        lg: '10px',
        xl: '10px',
        '2xl': '10px',
        '3xl': '10px',
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.04)',
        DEFAULT: '0 1px 2px 0 rgb(0 0 0 / 0.04)',
        md: '0 1px 3px 0 rgb(0 0 0 / 0.06)',
        lg: '0 1px 3px 0 rgb(0 0 0 / 0.06)',
        xl: '0 1px 3px 0 rgb(0 0 0 / 0.06)',
      },
    },
  },
  plugins: [],
}
