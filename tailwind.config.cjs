/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{vue,ts}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#135bec",
        "deep-navy": "#0f172a",
        "royal-blue": "#1d4ed8",
        "sky-blue": "#0ea5e9",
        success: "#10b981",
        warning: "#f59e0b",
        error: "#ef4444",
        "background-light": "#f6f6f8",
        "background-dark": "#101622",
      },
      fontFamily: { display: ["Inter", "sans-serif"] },
      borderRadius: {
        DEFAULT: "0.375rem",
        lg: "0.5rem",
        xl: "0.75rem",
        "2xl": "1rem",
        full: "9999px",
      },
    },
  },
  plugins: [require("@tailwindcss/forms"), require("@tailwindcss/container-queries")],
}
