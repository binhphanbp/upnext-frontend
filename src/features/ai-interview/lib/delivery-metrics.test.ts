import { describe, expect, it } from "vitest";

import type { DeliverySample } from "../types";
import {
  computeDelivery,
  countFillers,
  countWords,
  paceBand,
  WPM_TARGET,
} from "./delivery-metrics";

function samples(levels: number[], stepMs = 50): DeliverySample[] {
  return levels.map((level, index) => ({ atMs: index * stepMs, wpm: 0, level }));
}

describe("countFillers", () => {
  it("finds Vietnamese and English hesitation markers", () => {
    const result = countFillers("Ừm, cái này kiểu như là basically mình sẽ làm, à, thế thôi");
    expect(result.total).toBeGreaterThanOrEqual(3);
    expect(result.breakdown.map((entry) => entry.word)).toContain("kiểu như");
  });

  it("returns nothing for clean speech", () => {
    expect(countFillers("Tôi dùng transaction để đảm bảo tính nhất quán.").total).toBe(0);
  });

  it("does not match filler substrings inside real words", () => {
    // "à" must not fire on every word containing the character.
    expect(countFillers("Chàng trai này làm bàn giao rất tốt").total).toBe(0);
  });
});

describe("countWords", () => {
  it("ignores surrounding and repeated whitespace", () => {
    expect(countWords("  một   hai ba  ")).toBe(3);
    expect(countWords("   ")).toBe(0);
  });
});

describe("paceBand", () => {
  it("treats the documented target window as ideal, inclusive", () => {
    expect(paceBand(WPM_TARGET.min)).toBe("ideal");
    expect(paceBand(WPM_TARGET.max)).toBe("ideal");
    expect(paceBand(WPM_TARGET.min - 1)).toBe("slow");
    expect(paceBand(WPM_TARGET.max + 1)).toBe("fast");
  });
});

describe("computeDelivery", () => {
  it("derives words per minute from transcript length and elapsed time", () => {
    // 60 words over 30 seconds is 120 wpm.
    const transcript = Array.from({ length: 60 }, () => "từ").join(" ");
    expect(computeDelivery(transcript, [], 30_000).wpm).toBe(120);
  });

  it("reports the longest silent run only when it exceeds the pause threshold", () => {
    // 10 quiet samples at 50ms is 500ms — a beat, not a stall.
    const shortGap = computeDelivery("a b c", samples([...Array(10).fill(0.01), 0.6]), 2_000);
    expect(shortGap.longestPauseMs).toBe(0);

    // 40 quiet samples is ~2s and should surface.
    const longGap = computeDelivery("a b c", samples([...Array(40).fill(0.01), 0.6]), 4_000);
    expect(longGap.longestPauseMs).toBeGreaterThan(1_200);
  });

  it("scores a steady voice as more stable than a fluctuating one", () => {
    const steady = computeDelivery("a b", samples(Array(40).fill(0.5)), 2_000);
    const erratic = computeDelivery(
      "a b",
      samples(Array.from({ length: 40 }, (_, index) => (index % 2 ? 0.9 : 0.15))),
      2_000,
    );
    expect(steady.volumeStability).toBeGreaterThan(erratic.volumeStability);
  });

  it("survives an empty answer without dividing by zero", () => {
    const result = computeDelivery("", [], 0);
    expect(result.wpm).toBe(0);
    expect(result.silenceRatio).toBe(0);
    expect(Number.isFinite(result.volumeStability)).toBe(true);
  });
});
