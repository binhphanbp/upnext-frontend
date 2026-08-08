"use client";

import { Star } from "@phosphor-icons/react";

export function StarRatingInput({
  value,
  onChange,
  label,
  size = 22,
  readOnly = false,
}: {
  value: number;
  onChange?: (value: number) => void;
  label: string;
  size?: number;
  readOnly?: boolean;
}) {
  return (
    <div
      className="flex items-center gap-1"
      role={readOnly ? "img" : "radiogroup"}
      aria-label={label}
    >
      {[1, 2, 3, 4, 5].map((star) =>
        readOnly ? (
          <span key={star} className="p-0.5 text-amber-400">
            <Star size={size} weight={star <= value ? "fill" : "regular"} />
          </span>
        ) : (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={`${star} sao`}
            onClick={() => onChange?.(star)}
            className="rounded p-0.5 text-amber-400 transition-transform hover:scale-110"
          >
            <Star size={size} weight={star <= value ? "fill" : "regular"} />
          </button>
        ),
      )}
    </div>
  );
}
