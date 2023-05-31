/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{vue,js}",
  ],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        lbmgenshin: {
          "primary": "#6D28D9",
          "secondary": "#BE185D",
          "accent": "#FFFFFF",
          "neutral": "#334155",
          "base-100": "#e8e2d7",
          "info": "#3ABFF8",
          "success": "#36D399",
          "warning": "#FBBD23",
          "error": "#F87272",
        },
      },
    ],
  },
}

