"use client";

import { useEffect, useState } from "react";
import { getScoreColour } from "@/lib/utils";

interface ScoreRingProps {
  score: number;
  label?: string;
  size?: number;
  strokeWidth?: number;
  color?: string;
  animated?: boolean;
}

export function ScoreRing({
  score,
  label,
  size = 120,
  strokeWidth = 8,
  color,
  animated = true,
}: ScoreRingProps) {
  const [animatedScore, setAnimatedScore] = useState(animated ? 0 : score);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedScore / 100) * circumference;
  const resolvedColor = color ?? getScoreColour(score);

  useEffect(() => {
    if (!animated) {
      setAnimatedScore(score);
      return;
    }
    const timer = setTimeout(() => setAnimatedScore(score), 100);
    return () => clearTimeout(timer);
  }, [score, animated]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-slate/20"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={resolvedColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              transition: animated ? "stroke-dashoffset 800ms ease-out" : "none",
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="font-display font-bold"
            style={{
              color: resolvedColor,
              fontSize: size > 80 ? `${Math.round(size / 4.5)}px` : `${Math.round(size / 3.5)}px`,
            }}
          >
            {animatedScore}
          </span>
        </div>
      </div>
      {label && (
        <span className="text-xs font-medium uppercase tracking-wider text-slate">
          {label}
        </span>
      )}
    </div>
  );
}
