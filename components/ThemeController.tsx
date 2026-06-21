"use client";

import { useEffect } from "react";

export function applyTheme(theme: string) {
  const el = document.documentElement;
  el.classList.remove("theme-oled", "theme-dark");
  el.classList.add(theme === "dark" ? "theme-dark" : "theme-oled");
}

export function applyAccent(hex: string) {
  const n = parseInt(hex.replace("#", ""), 16);
  if (Number.isNaN(n)) return;
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  document.documentElement.style.setProperty("--accent", `${r} ${g} ${b}`);
}

/** Applies the user's saved theme + accent on mount (and whenever they change). */
export function ThemeController({ theme, accent }: { theme: string; accent: string }) {
  useEffect(() => {
    applyTheme(theme);
    applyAccent(accent);
  }, [theme, accent]);
  return null;
}
