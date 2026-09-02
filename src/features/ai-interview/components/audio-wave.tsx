"use client";

import React, { useEffect, useState } from "react";

interface AudioWaveProps {
  isActive?: boolean;
  color?: string;
  barCount?: number;
  height?: number;
}

export const AudioWave: React.FC<AudioWaveProps> = ({
  isActive = true,
  color = "#0aa56f",
  barCount = 18,
  height = 28,
}) => {
  const [heights, setHeights] = useState<number[]>(() =>
    Array.from({ length: barCount }, () => Math.random() * 0.4 + 0.2),
  );

  useEffect(() => {
    if (!isActive) {
      setHeights(Array.from({ length: barCount }, () => 0.15));
      return;
    }

    const interval = setInterval(() => {
      setHeights(
        Array.from({ length: barCount }, (_, i) => {
          // Create wave-like animated motion
          const base = Math.sin(Date.now() / 200 + i * 0.5) * 0.35 + 0.5;
          const jitter = Math.random() * 0.3;
          return Math.min(1, Math.max(0.15, base + jitter));
        }),
      );
    }, 100);

    return () => clearInterval(interval);
  }, [isActive, barCount]);

  return (
    <div
      className="flex items-center justify-center gap-[3px] px-2 py-1 select-none"
      style={{ height: `${height}px` }}
      aria-hidden="true"
    >
      {heights.map((h, i) => (
        <span
          key={i}
          className="w-[3px] rounded-full transition-all duration-100 ease-out"
          style={{
            height: `${Math.round(h * height)}px`,
            backgroundColor: color,
            opacity: isActive ? 0.6 + h * 0.4 : 0.3,
          }}
        />
      ))}
    </div>
  );
};
