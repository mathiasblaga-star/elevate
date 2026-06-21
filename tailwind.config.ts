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
        navy: "#0A0F1E",
        ink: "#F0EEF9",
        violet: { DEFAULT: "#7C3AED", 600: "#7C3AED", 500: "#8B5CF6" },
        indigo: { DEFAULT: "#6366F1", 400: "#818CF8" },
        cyan: { 300: "#67E8F9" },
        mint: "#10B981",
        amber: "#F59E0B",
        card: "#131929",
        // semantic aliases used across UI primitives
        background: "#0A0F1E",
        foreground: "#F0EEF9",
        muted: "#9CA3AF",
        border: "rgba(255,255,255,0.08)",
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
        glow: "0 8px 30px -8px rgba(124, 58, 237, 0.5)",
        "glow-lg": "0 16px 50px -12px rgba(124, 58, 237, 0.6)",
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
