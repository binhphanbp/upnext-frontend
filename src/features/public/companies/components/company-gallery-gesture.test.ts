import { describe, expect, it } from "vitest";

import { getSlideReleaseDirection } from "./company-gallery-gesture";

describe("getSlideReleaseDirection", () => {
  it("moves to the next image after a deliberate left drag", () => {
    expect(
      getSlideReleaseDirection({
        horizontalTravel: -120,
        verticalTravel: 8,
        releaseVelocity: -0.2,
        stageWidth: 1200,
      }),
    ).toBe(1);
  });

  it("moves to the previous image after a deliberate right drag", () => {
    expect(
      getSlideReleaseDirection({
        horizontalTravel: 110,
        verticalTravel: 4,
        releaseVelocity: 0.2,
        stageWidth: 1200,
      }),
    ).toBe(-1);
  });

  it("accepts a short, fast flick", () => {
    expect(
      getSlideReleaseDirection({
        horizontalTravel: -40,
        verticalTravel: 3,
        releaseVelocity: -0.8,
        stageWidth: 1200,
      }),
    ).toBe(1);
  });

  it("snaps back after a short, slow drag", () => {
    expect(
      getSlideReleaseDirection({
        horizontalTravel: -40,
        verticalTravel: 3,
        releaseVelocity: -0.2,
        stageWidth: 1200,
      }),
    ).toBe(0);
  });

  it("ignores a gesture whose vertical movement dominates", () => {
    expect(
      getSlideReleaseDirection({
        horizontalTravel: -120,
        verticalTravel: 140,
        releaseVelocity: -1,
        stageWidth: 390,
      }),
    ).toBe(0);
  });
});
