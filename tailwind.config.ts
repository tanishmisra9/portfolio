import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "rgb(var(--bg-rgb) / <alpha-value>)",
        fg: "rgb(var(--fg-rgb) / <alpha-value>)",
        danger: "rgb(var(--danger-rgb) / <alpha-value>)",
        muted: "var(--muted)",
        dim: "var(--dim)",
        surface: "var(--surface)",
        "surface-strong": "var(--surface-strong)",
        border: "var(--border)",
        "border-strong": "var(--border-strong)",
        "hover-outline": "var(--hover-outline)",
      },
      fontFamily: {
        sans: [
          "var(--font-poppins)",
          '"YD Gothic"',
          "var(--font-inter-punct)",
          "var(--font-inter)",
          "system-ui",
          "sans-serif",
        ],
        display: ["var(--font-poppins)", "var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-space-mono)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
