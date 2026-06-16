import { postingPerformance } from "@/features/recruiter/data/job-posts-data";

export function PostingPerformanceCard() {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_14px_36px_rgba(15,23,42,0.05)]">
      <h2 className="text-base font-extrabold text-slate-950">Hiệu quả đăng tin</h2>
      <div className="mt-4 space-y-5">
        {postingPerformance.map((item, index) => (
          <div className="grid grid-cols-[1fr_96px] items-end gap-3" key={item.label}>
            <div>
              <p className="text-xs font-bold text-slate-500">{item.label}</p>
              <div className="mt-1 flex items-end gap-3">
                <p className="text-xl leading-none font-extrabold text-slate-950">{item.value}</p>
                <p className="text-xs font-extrabold text-emerald-600">↑ {item.trend}</p>
              </div>
            </div>
            <MiniSparkline variant={index} />
          </div>
        ))}
      </div>
    </section>
  );
}

function MiniSparkline({ variant }: { variant: number }) {
  const paths = [
    "M2 32 C10 23 16 29 24 18 C32 7 40 28 48 19 C56 9 62 12 70 5 C78 0 84 10 94 8",
    "M2 31 C12 19 18 28 28 17 C38 5 43 20 52 10 C61 0 66 14 74 7 C82 0 86 8 94 2",
    "M2 30 C10 18 17 28 26 16 C35 6 42 23 50 12 C58 0 64 16 72 7 C80 0 86 9 94 2",
  ];

  return (
    <svg aria-hidden className="h-12 w-24" viewBox="0 0 96 40">
      <path
        d="M2 38H94V8C84 10 78 0 70 5C62 12 56 9 48 19C40 28 32 7 24 18C16 29 10 23 2 32V38Z"
        fill="#ecfdf5"
      />
      <path
        d={paths[variant] ?? paths[0]}
        fill="none"
        stroke="#10b981"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}
