"use client";

import type { KeywordTrendPoint } from "@/features/admin/api/search-keywords";

const WIDTH = 720;
const HEIGHT = 160;
const PAD = { top: 12, right: 12, bottom: 22, left: 34 };

function formatDay(day: string) {
  const date = new Date(day);
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Lượt tìm theo ngày.
 *
 * Vẽ tay bằng SVG thay vì thêm thư viện chart: một đường và một vùng tô thì không đáng
 * kéo cả recharts vào bundle của trang admin.
 *
 * Thang đo luôn bắt đầu từ 0 và trần là giá trị lớn nhất (tối thiểu 1) — nếu để trần
 * chạy theo dữ liệu thì hai ngày 1 và 2 lượt sẽ trông như cách nhau cả biểu đồ.
 */
export function KeywordTrendChart({ points }: { points: KeywordTrendPoint[] }) {
  if (points.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-slate-500">
        Chưa có lượt tìm nào trong khoảng thời gian này.
      </p>
    );
  }

  const max = Math.max(1, ...points.map((point) => point.searchCount));
  const innerWidth = WIDTH - PAD.left - PAD.right;
  const innerHeight = HEIGHT - PAD.top - PAD.bottom;

  const x = (index: number) =>
    PAD.left + (points.length === 1 ? innerWidth / 2 : (index / (points.length - 1)) * innerWidth);
  const y = (value: number) => PAD.top + innerHeight - (value / max) * innerHeight;

  const line = points.map((point, index) => `${x(index)},${y(point.searchCount)}`).join(" ");
  const area = `${PAD.left},${PAD.top + innerHeight} ${line} ${x(points.length - 1)},${PAD.top + innerHeight}`;

  // Chỉ ghi nhãn ngày đầu, giữa và cuối: 30 nhãn cạnh nhau sẽ chồng lên nhau.
  const labelIndexes = [...new Set([0, Math.floor((points.length - 1) / 2), points.length - 1])];
  const peak = points.reduce(
    (best, point, index) => (point.searchCount > points[best]!.searchCount ? index : best),
    0,
  );

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-40 w-full min-w-[560px]"
        aria-labelledby="keyword-trend-title"
      >
        <title id="keyword-trend-title">
          Lượt tìm theo ngày, cao nhất {max} lượt vào {formatDay(points[peak]!.day)}
        </title>
        {[0, max / 2, max].map((value) => (
          <g key={value}>
            <line
              x1={PAD.left}
              x2={WIDTH - PAD.right}
              y1={y(value)}
              y2={y(value)}
              className="stroke-slate-200"
              strokeWidth="1"
            />
            <text
              x={PAD.left - 6}
              y={y(value) + 4}
              textAnchor="end"
              className="fill-slate-400 text-[10px] tabular-nums"
            >
              {Math.round(value)}
            </text>
          </g>
        ))}

        <polygon points={area} className="fill-emerald-500/12" />
        <polyline
          points={line}
          fill="none"
          className="stroke-emerald-600"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Đỉnh được nhấn để đọc được ngay ngày cao nhất mà không phải rà chuột. */}
        <circle
          cx={x(peak)}
          cy={y(points[peak]!.searchCount)}
          r="3.5"
          className="fill-emerald-600"
        />

        {labelIndexes.map((index) => (
          <text
            key={index}
            x={x(index)}
            y={HEIGHT - 6}
            textAnchor={index === 0 ? "start" : index === points.length - 1 ? "end" : "middle"}
            className="fill-slate-400 text-[10px]"
          >
            {formatDay(points[index]!.day)}
          </text>
        ))}
      </svg>
    </div>
  );
}
