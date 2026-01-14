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
      borderRadius: {
        '3xl': '2rem',
        '4xl': '2.5rem',
      },
      boxShadow: {
        '2xl': '0 8px 32px 0 rgba(80, 0, 200, 0.10)',
        'purple': '0 4px 24px 0 rgba(168, 85, 247, 0.15)',
      },
      colors: {
        primary: '#030213',
        secondary: '#9b87f5',
        accent: '#e9ebef',
        muted: '#ececf0',
        'purple-50': '#f5f3ff',
        'purple-100': '#ede9fe',
        'purple-500': '#a855f7',
        'purple-600': '#9333ea',
      },
    },
  },
  plugins: [],
}
