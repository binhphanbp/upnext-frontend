import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/shared/api/http";

import { runCvScreening } from "../api/cv-screening-api";
import { useCvScreening } from "./use-cv-screening";

vi.mock("../api/cv-screening-api", () => ({
  runCvScreening: vi.fn(),
  getCvScreeningRun: vi.fn(),
  getCvScreeningResults: vi.fn(),
}));

describe("useCvScreening", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it("ends the run and reports an expired recruiter session once", async () => {
    const onUnauthorized = vi.fn();
    vi.mocked(runCvScreening).mockRejectedValue(
      new ApiError(401, "Unauthorized", { message: "Unauthorized" }),
    );
    const { result } = renderHook(() => useCvScreening("expired-token", onUnauthorized));

    act(() => result.current.setSelectedJobId("job-post-id"));
    await act(() => result.current.startScreening());

    expect(onUnauthorized).toHaveBeenCalledTimes(1);
    expect(result.current.isRunning).toBe(false);
    expect(result.current.runStatus).toBeNull();
    expect(result.current.error).toBeNull();
  });
});
