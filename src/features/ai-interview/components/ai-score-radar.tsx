"use client";

import React from "react";

import { CompetencyScore } from "../types";

interface AiScoreRadarProps {
  competencies: CompetencyScore[];
  size?: number;
  showLabels?: boolean;
}

export const AiScoreRadar: React.FC<AiScoreRadarProps> = ({
  competencies,
  size = 280,
  showLabels = true,
}) => {
  const center = size / 2;
  const radius = (size - (showLabels ? 80 : 20)) / 2;
  const count = competencies.length;
  if (count < 3) return null;

  const angleStep = (2 * Math.PI) / count;

  // Grid levels (20%, 40%, 60%, 80%, 100%)
  const levels = [0.2, 0.4, 0.6, 0.8, 1.0];

  // Calculate polygon points for each level
  const getPolygonPoints = (levelRatio: number) => {
    return competencies
      .map((_, i) => {
        const angle = i * angleStep - Math.PI / 2;
        const r = radius * levelRatio;
        const x = center + r * Math.cos(angle);
        const y = center + r * Math.sin(angle);
        return `${x},${y}`;
      })
      .join(" ");
  };

  // Calculate points for candidate scores
  const scorePoints = competencies.map((c, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const ratio = Math.min(1, Math.max(0.1, c.score / c.fullMark));
    const r = radius * ratio;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y, str: `${x},${y}`, ...c };
  });

  const scorePolygon = scorePoints.map((p) => p.str).join(" ");

  return (
    <div className="relative flex flex-col items-center justify-center select-none">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
        <defs>
          <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0aa56f" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.30" />
          </linearGradient>
          <filter id="radarGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Background Grid webs */}
        {levels.map((level, idx) => (
          <polygon
            key={idx}
            points={getPolygonPoints(level)}
            fill="none"
            stroke="currentColor"
            className="text-slate-200 dark:text-slate-700/60"
            strokeWidth={idx === levels.length - 1 ? "1.5" : "1"}
            strokeDasharray={idx === levels.length - 1 ? undefined : "3,3"}
          />
        ))}

        {/* Axis lines */}
        {competencies.map((_, i) => {
          const angle = i * angleStep - Math.PI / 2;
          const x2 = center + radius * Math.cos(angle);
          const y2 = center + radius * Math.sin(angle);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={x2}
              y2={y2}
              stroke="currentColor"
              className="text-slate-200 dark:text-slate-700/60"
              strokeWidth="1"
            />
          );
        })}

        {/* Candidate Score Area */}
        <polygon
          points={scorePolygon}
          fill="url(#radarGradient)"
          stroke="#0aa56f"
          strokeWidth="2.5"
          filter="url(#radarGlow)"
          className="transition-all duration-500 ease-out"
        />

        {/* Points on vertices */}
        {scorePoints.map((pt, i) => (
          <circle
            key={i}
            cx={pt.x}
            cy={pt.y}
            r="4.5"
            fill="#ffffff"
            stroke="#0aa56f"
            strokeWidth="2"
            className="transition-all duration-300"
          />
        ))}

        {/* Labels around perimeter */}
        {showLabels &&
          competencies.map((c, i) => {
            const angle = i * angleStep - Math.PI / 2;
            const labelRadius = radius + 22;
            const lx = center + labelRadius * Math.cos(angle);
            const ly = center + labelRadius * Math.sin(angle);

            // Alignment based on angle quadrant
            let textAnchor: "middle" | "start" | "end" = "middle";
            if (Math.abs(Math.cos(angle)) > 0.3) {
              textAnchor = Math.cos(angle) > 0 ? "start" : "end";
            }

            return (
              <g key={i} className="text-xs font-semibold">
                <text
                  x={lx}
                  y={ly}
                  textAnchor={textAnchor}
                  dominantBaseline="central"
                  className="fill-slate-700 text-[11px] font-medium dark:fill-slate-300"
                >
                  {c.nameVi}
                </text>
                <text
                  x={lx}
                  y={ly + 12}
                  textAnchor={textAnchor}
                  dominantBaseline="central"
                  className="fill-emerald-600 text-[10px] font-bold dark:fill-emerald-400"
                >
                  {c.score}%
                </text>
              </g>
            );
          })}
      </svg>
    </div>
  );
};
