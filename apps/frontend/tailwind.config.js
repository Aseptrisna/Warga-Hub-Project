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
        // Marketing site palette (warm & local). Swap these to rebrand the landing page.
        desa: {
          cream: '#FAF6EE',
          sand: '#F2EADD',
          line: '#E6DBC8',
          ink: '#1F1B16',
          muted: '#6B6153',
          green: { 50: '#EAF2EC', 100: '#D3E6D9', 500: '#3B8565', 600: '#2A6F52', 700: '#1F5A43', 800: '#174534', 900: '#10332A' },
          clay: { 50: '#FBEEE5', 100: '#F6DCC9', 500: '#C4622D', 600: '#A94F20' },
          gold: '#E9B44C',
        },
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        jakarta: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
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
        lift: '0 24px 48px -20px rgb(31 27 22 / 0.28), 0 2px 6px -2px rgb(31 27 22 / 0.08)',
      },
    },
  },
  plugins: [],
}
