import type { DeliverySample, DeliverySignals } from "../types";

/**
 * Speech-delivery analysis.
 *
 * READ THIS BEFORE EXTENDING. Everything here answers "how was this answer
 * delivered?" — pace, pauses, filler words, loudness consistency. Nothing here
 * infers what the candidate feels, who they are, or where they are from.
 *
 * The boundary is not stylistic:
 *   - EU AI Act Art. 5(1)(f) prohibits emotion-inference systems in the
 *     workplace and in education.
 *   - Illinois 820 ILCS 42 and Maryland HB 1202 require explicit consent for
 *     face analysis in interviews; NYC Local Law 144 requires a bias audit for
 *     automated employment decision tools.
 *   - Barrett et al. (2019) found facial movements do not reliably map to
 *     emotional states, so such a score would be unsound even where it is legal.
 *   - The project plan §3.3 lists appearance/emotion scoring as out of scope.
 *
 * Consequently these signals are COACHING ONLY: they are shown to the candidate
 * who produced them, they never enter `QuestionScore.score`, and no recruiter
 * surface renders them.
 */
export const DELIVERY_IS_COACHING_ONLY = true;

/**
 * `\b` is useless here: JavaScript defines a word character as `[A-Za-z0-9_]`,
 * so every Vietnamese diacritic reads as a non-word character. `\bà\b` therefore
 * *misses* "kiểu như" (no boundary after `ư`) while *matching* the à inside
 * "Chàng" and "bàn". Both directions are wrong, and the second is worse — it
 * would report filler words to a candidate who used none.
 *
 * Unicode-aware guards instead: a filler must be preceded by a non-letter (or
 * the start of the string) and not followed by a letter. Lookahead only, no
 * lookbehind, so the regexes still parse on older Safari.
 */
const LETTER = String.raw`\p{L}`;

function fillerPattern(body: string): RegExp {
  return new RegExp(`(?:^|[^${LETTER}])(?:${body})(?![${LETTER}])`, "giu");
}

/** Vietnamese and English hesitation markers common in IT interviews. */
const FILLER_PATTERNS: { word: string; pattern: RegExp }[] = [
  { word: "ừm", pattern: fillerPattern("ừm+|ưm+|um+") },
  { word: "à", pattern: fillerPattern("à+") },
  { word: "kiểu như", pattern: fillerPattern("kiểu như") },
  { word: "thì là", pattern: fillerPattern("thì là") },
  { word: "cái này", pattern: fillerPattern("cái (?:này|đó) là") },
  { word: "like", pattern: fillerPattern("like") },
  { word: "you know", pattern: fillerPattern("you know") },
  { word: "basically", pattern: fillerPattern("basically") },
];

export function countFillers(text: string): {
  total: number;
  breakdown: { word: string; count: number }[];
} {
  const breakdown = FILLER_PATTERNS.map(({ word, pattern }) => ({
    word,
    count: text.match(pattern)?.length ?? 0,
  })).filter((entry) => entry.count > 0);

  return { total: breakdown.reduce((sum, entry) => sum + entry.count, 0), breakdown };
}

export function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

/**
 * Comfortable Vietnamese technical-interview delivery sits around 110–150 wpm.
 * Outside that band the UI nudges rather than penalises — there is no "correct"
 * speaking speed, only one that is easier to follow.
 */
export const WPM_TARGET = { min: 110, max: 150 } as const;

export type PaceBand = "slow" | "ideal" | "fast";

export function paceBand(wpm: number): PaceBand {
  if (wpm < WPM_TARGET.min) return "slow";
  if (wpm > WPM_TARGET.max) return "fast";
  return "ideal";
}

/** Silence below this counts as a natural beat, not a stall. */
const PAUSE_THRESHOLD_MS = 1_200;
const SILENT_LEVEL = 0.06;

export function computeDelivery(
  transcript: string,
  samples: DeliverySample[],
  elapsedMs: number,
): DeliverySignals {
  const words = countWords(transcript);
  const fillers = countFillers(transcript);
  const minutes = Math.max(elapsedMs / 60_000, 1 / 60);

  const silentSamples = samples.filter((sample) => sample.level < SILENT_LEVEL);
  const silenceRatio = samples.length ? silentSamples.length / samples.length : 0;

  let longestPauseMs = 0;
  let runStartMs: number | null = null;
  for (const sample of samples) {
    if (sample.level < SILENT_LEVEL) {
      runStartMs ??= sample.atMs;
      longestPauseMs = Math.max(longestPauseMs, sample.atMs - runStartMs);
    } else {
      runStartMs = null;
    }
  }

  const audible = samples.filter((sample) => sample.level >= SILENT_LEVEL).map((s) => s.level);
  const mean = audible.length ? audible.reduce((sum, value) => sum + value, 0) / audible.length : 0;
  const variance = audible.length
    ? audible.reduce((sum, value) => sum + (value - mean) ** 2, 0) / audible.length
    : 0;
  // Map standard deviation onto 0–1 where a steady voice scores high. The 0.28
  // divisor is the spread of a normally-modulated speaking voice at 60fps.
  const volumeStability = audible.length
    ? Math.max(0, Math.min(1, 1 - Math.sqrt(variance) / 0.28))
    : 0;

  return {
    wpm: Math.round(words / minutes),
    fillerCount: fillers.total,
    fillerBreakdown: fillers.breakdown,
    silenceRatio: Number(silenceRatio.toFixed(2)),
    longestPauseMs: longestPauseMs >= PAUSE_THRESHOLD_MS ? Math.round(longestPauseMs) : 0,
    spokenMs: elapsedMs,
    volumeStability: Number(volumeStability.toFixed(2)),
  };
}

export function emptyDelivery(): DeliverySignals {
  return {
    wpm: 0,
    fillerCount: 0,
    fillerBreakdown: [],
    silenceRatio: 0,
    longestPauseMs: 0,
    spokenMs: 0,
    volumeStability: 0,
  };
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
