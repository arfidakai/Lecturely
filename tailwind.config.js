/** @type {import('tailwindcss').Config} */
module.exports = {
  ccontent: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}", // tambahkan ini kalau pakai /src
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      borderRadius: {
        '3xl': '2rem',
        '4xl': '2.5rem',
      },
      boxShadow: {
        '2xl': '0 8px 32px 0 rgba(139, 123, 219, 0.15)',
        'purple': '0 4px 24px 0 rgba(139, 123, 219, 0.20)',
      },
      colors: {
        primary: '#030213',
        secondary: '#8b7bdb',
        accent: '#e9ebef',
        muted: '#ececf0',
        'purple-50': '#f3f0ff',
        'purple-100': '#e5deff',
        'purple-500': '#8b7bdb',
        'purple-600': '#7a6bc9',
      },
    },
  },
  plugins: [],
}
