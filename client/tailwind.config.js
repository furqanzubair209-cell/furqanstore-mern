/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    screens: {
      xs: "420px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    extend: {
      colors: {
        ink: "#0b0b0f",
        gold: "#c9a45c",
        "gold-light": "#d4b36e",
        "gold-dark": "#b8933f",
      },
      fontFamily: {
        display: ["'Playfair Display'", "serif"],
        sans: ["'Inter'", "sans-serif"],
      },
      animation: {
        fadeIn: "fadeIn 0.5s ease-out both",
        slideUp: "slideUp 0.6s ease-out both",
        scaleIn: "scaleIn 0.3s ease-out both",
        shimmer: "shimmer 1.5s infinite",
        float: "float 3s ease-in-out infinite",
        pulseGlow: "pulseGlow 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
