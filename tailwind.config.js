/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#dce8ff",
          500: "#0f4c81",
          600: "#0e3e6b",
          700: "#0b3055",
          900: "#081e35",
        },
        ink: {
          900: "#0f172a",
          700: "#334155",
          500: "#64748b",
          300: "#cbd5e1",
          100: "#f1f5f9",
          50: "#f8fafc",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
      borderRadius: { md: "10px", lg: "14px", xl: "18px" },
      boxShadow: {
        soft: "0 1px 3px rgba(15,23,42,0.08), 0 8px 24px rgba(15,23,42,0.06)",
        card: "0 1px 2px rgba(15,23,42,0.06), 0 4px 16px rgba(15,23,42,0.05)",
      },
    },
  },
  plugins: [],
}
