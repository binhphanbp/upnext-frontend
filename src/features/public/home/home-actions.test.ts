import { describe, expect, it } from "vitest";

import type { HomeAction } from "./api";
import { selectPrimaryHomeAction } from "./home-actions";

describe("homepage candidate actions", () => {
  it("uses product priority instead of trusting the API array order", () => {
    const actions: HomeAction[] = [
      { type: "MISSING_CV" },
      { type: "MISSING_PREFERENCES" },
      { type: "APPLICATION_UPDATED", applicationId: "application-1" },
    ];

    expect(selectPrimaryHomeAction(actions)).toEqual({
      type: "APPLICATION_UPDATED",
      applicationId: "application-1",
    });
  });

  it("returns null when the candidate has no pending action", () => {
    expect(selectPrimaryHomeAction([])).toBeNull();
  });
});
