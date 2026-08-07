import { describe, expect, it } from "vitest";

import { getMissingSignalsDescription } from "./home-action-copy";

describe("homepage candidate action copy", () => {
  it("uses the actual missing profile signals from the home API", () => {
    expect(getMissingSignalsDescription(["SKILLS", "POSITION"], "fallback", "vi")).toBe(
      "Thêm kỹ năng và vị trí mong muốn để UpNext gợi ý cơ hội sát với mục tiêu của bạn hơn.",
    );
  });

  it("keeps the translated fallback when the API does not provide a recognised signal", () => {
    expect(getMissingSignalsDescription(["UNKNOWN"], "Complete your profile.", "en")).toBe(
      "Complete your profile.",
    );
  });
});
