"use client";

import { useEffect, useRef } from "react";

interface WaveformProps {
  isActive: boolean;
  isSpeaking?: boolean;
}

export function Waveform({ isActive, isSpeaking = false }: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const bars = 40;
    const barWidth = width / bars - 2;

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < bars; i++) {
        const amplitude = isActive
          ? isSpeaking
            ? Math.random() * 0.8 + 0.2
            : Math.random() * 0.3 + 0.05
          : 0.02;

        const barHeight = amplitude * height;
        const x = i * (barWidth + 2);
        const y = (height - barHeight) / 2;

        ctx.fillStyle = isActive
          ? isSpeaking
            ? "#C9A84C"
            : "#4A5568"
          : "#1a1a1a";
        ctx.fillRect(x, y, barWidth, barHeight);
      }

      animationRef.current = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animationRef.current);
  }, [isActive, isSpeaking]);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={80}
      className="h-20 w-full max-w-md"
    />
  );
}
