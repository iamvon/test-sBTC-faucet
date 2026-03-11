/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Urbanist", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        cyber: {
          bg: "#070b14",
          panel: "#0f1728",
          line: "#23304a",
          aqua: "#2de2e6",
          pink: "#ff4d9a",
          text: "#d9e4ff",
          muted: "#8ca0c7",
        },
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(45,226,230,0.24), 0 14px 40px rgba(4,12,26,0.45)",
      },
      backgroundImage: {
        "cyber-grid": "linear-gradient(to right, rgba(45,226,230,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(45,226,230,0.05) 1px, transparent 1px)",
      },
      backgroundSize: {
        grid: "30px 30px",
      },
    },
  },
  plugins: [],
};
