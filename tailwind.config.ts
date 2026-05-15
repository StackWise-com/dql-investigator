import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      colors: {
        slate: {
          950: "#020617",
          900: "#0f172a",
          850: "#0b1221",
          800: "#1e293b",
          700: "#334155",
        },
        // Single accent — desaturated teal/cyan. All other colours are semantic only.
        accent: {
          DEFAULT: "#22b8c8",
          muted: "rgba(34,184,200,0.10)",
          border: "rgba(34,184,200,0.20)",
        },
        // Semantic state colours only (not decoration)
        cyan:    { 400: "#22d3ee", 500: "#06b6d4" },
        emerald: { 400: "#34d399", 500: "#10b981" },
        amber:   { 400: "#fbbf24", 500: "#f59e0b" },
        rose:    { 400: "#fb7185", 500: "#f43f5e" },
        violet:  { 400: "#a78bfa" },
      },
      // Opacity scale: 4 values only
      // subtle=4%  border=8%  hover=12%  strong=20%
      borderOpacity: { subtle: "0.04", border: "0.08", hover: "0.12", strong: "0.20" },
      // Animations — only functional, no glow/pulse on decorative elements
      animation: {
        "fade-in": "fadeIn 0.15s ease-out",
        "slide-up": "slideUp 0.2s ease-out",
        "fade-out": "fadeOut 0.15s ease-in forwards",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeOut: {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      // Consistent shadow — one elevation token
      boxShadow: {
        panel: "0 4px 24px rgba(0,0,0,0.4), 0 1px 4px rgba(0,0,0,0.2)",
      },
    },
  },
  plugins: [],
};

export default config;
