/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#A78BFA',
        secondary: '#F3F4F6',
        accent: '#4C1D95',
        background: '#F9FAFB',
        text: '#1F2937',
      },
      borderRadius: {
        'rounded': '12px',
      },
    },
  },
  plugins: [],
};
