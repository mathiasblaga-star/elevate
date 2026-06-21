import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // jet-black monochrome system
        black: "#0a0a0a",
        surface: "#111111",
        card: "#1a1a1a",
        foreground: "#fafafa",
        muted: "#9ca3af",
        border: "rgba(255,255,255,0.08)",
        background: "#0a0a0a",
        // single accent, driven by --accent CSS var (white by default, user-customisable)
        accent: "rgb(var(--accent) / <alpha-value>)",
        // legacy token names remapped to monochrome so existing classes retheme automatically
        navy: "#0a0a0a",
        ink: "#fafafa",
        violet: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          600: "rgb(var(--accent) / <alpha-value>)",
          500: "rgb(var(--accent) / <alpha-value>)",
        },
        indigo: { DEFAULT: "rgb(var(--accent) / <alpha-value>)", 400: "#a3a3a3" },
        cyan: { 300: "#e5e5e5" },
        mint: "#e5e5e5",
        amber: "#a3a3a3",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        lg: "8px",
        md: "6px",
        sm: "4px",
        xl: "12px",
      },
      boxShadow: {
        // soft, neutral depth — no harsh/coloured shadows
        glow: "0 4px 24px -8px rgba(0,0,0,0.7)",
        "glow-lg": "0 8px 40px -10px rgba(0,0,0,0.8)",
      },
      transitionTimingFunction: {
        liquid: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.5s ease-out both",
        "fade-in-up": "fade-in-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) both",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
