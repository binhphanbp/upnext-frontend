import { beforeEach, describe, expect, it, vi } from "vitest";

import { getRecruiterAnalytics } from "./analytics";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("getRecruiterAnalytics", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("always includes windowDays and sets the Authorization header", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse({ ok: true }));

    await getRecruiterAnalytics("token-123", { windowDays: 30 });

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toContain("/recruiter/analytics?windowDays=30");
    expect(String(url)).not.toContain("jobPostId");
    expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer token-123");
  });

  it("appends jobPostId only when provided", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse({ ok: true }));

    await getRecruiterAnalytics("token-123", { windowDays: 7, jobPostId: "job-1" });

    const [url] = fetchMock.mock.calls[0]!;
    expect(String(url)).toContain("windowDays=7");
    expect(String(url)).toContain("jobPostId=job-1");
  });

  it("passes the parsed response through unmodified", async () => {
    const payload = { kpis: { totalViews: 42 } };
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(jsonResponse(payload));

    const result = await getRecruiterAnalytics("token-123", { windowDays: 90 });

    expect(result).toEqual(payload);
  });
});
