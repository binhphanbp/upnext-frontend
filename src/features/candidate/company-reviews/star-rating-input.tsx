"use client";

import { Star } from "@phosphor-icons/react";

export function StarRatingInput({
  value,
  onChange,
  label,
  size = 22,
}: {
  value: number;
  onChange: (value: number) => void;
  label: string;
  size?: number;
}) {
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label={label}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} sao`}
          onClick={() => onChange(star)}
          className="rounded p-0.5 text-amber-400 transition-transform hover:scale-110"
        >
          <Star size={size} weight={star <= value ? "fill" : "regular"} />
        </button>
      ))}
    </div>
  );
}
