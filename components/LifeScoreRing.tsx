"use client";

import { useEffect, useState } from "react";

export function LifeScoreRing({
  score,
  size = 220,
  stroke = 14,
  animate = true,
}: {
  score: number;
  size?: number;
  stroke?: number;
  animate?: boolean;
}) {
  const [shown, setShown] = useState(animate ? 0 : score);

  useEffect(() => {
    if (!animate) return;
    const t = setTimeout(() => setShown(score), 80);
    return () => clearTimeout(t);
  }, [score, animate]);

  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.max(0, Math.min(100, shown)) / 100) * circ;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="ring-glow"
    >
      <defs>
        <linearGradient id="lifeScoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#a3a3a3" />
        </linearGradient>
      </defs>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="url(#lifeScoreGrad)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.22,1,0.36,1)" }}
      />
      <text
        x="50%"
        y="47%"
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-ink font-mono"
        style={{ fontSize: size * 0.26, fontWeight: 700 }}
      >
        {Math.round(shown)}
      </text>
      <text
        x="50%"
        y="63%"
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-muted"
        style={{ fontSize: size * 0.07, letterSpacing: 2 }}
      >
        LIFE SCORE
      </text>
    </svg>
  );
}
