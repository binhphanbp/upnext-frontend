import { beforeEach, describe, expect, it, vi } from "vitest";

import { recruiterApiRequest } from "./client";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("recruiterApiRequest", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("refreshes an expired access token and retries the request once", async () => {
    localStorage.setItem("upnext.recruiter.accessToken", "expired-token");
    localStorage.setItem("upnext.recruiter.refreshToken", "refresh-token");
    localStorage.setItem("upnext.recruiter.user", JSON.stringify({ id: "recruiter-id" }));

    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse({ message: "Unauthorized" }, 401))
      .mockResolvedValueOnce(
        jsonResponse({
          accessToken: "fresh-token",
          refreshToken: "rotated-refresh-token",
          tokenType: "Bearer",
          user: { id: "recruiter-id" },
        }),
      )
      .mockResolvedValueOnce(jsonResponse({ applicationId: "application-id" }));

    await expect(
      recruiterApiRequest<{ applicationId: string }>(
        "/recruiter/applications/application-id/ai-score",
        "expired-token",
      ),
    ).resolves.toEqual({ applicationId: "application-id" });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1]?.[0]).toBe("/api/v1/recruiter/auth/refresh");
    expect(new Headers(fetchMock.mock.calls[2]?.[1]?.headers).get("Authorization")).toBe(
      "Bearer fresh-token",
    );
    expect(localStorage.getItem("upnext.recruiter.accessToken")).toBe("fresh-token");
    expect(localStorage.getItem("upnext.recruiter.refreshToken")).toBe("rotated-refresh-token");
  });

  it("preserves the original 401 when the refresh token is unavailable", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      jsonResponse({ message: "Unauthorized" }, 401),
    );

    await expect(recruiterApiRequest("/protected", "expired-token")).rejects.toMatchObject({
      status: 401,
    });
  });

  it("shares one refresh request across concurrent expired layout requests", async () => {
    localStorage.setItem("upnext.recruiter.accessToken", "expired-token");
    localStorage.setItem("upnext.recruiter.refreshToken", "refresh-token");
    localStorage.setItem("upnext.recruiter.user", JSON.stringify({ id: "recruiter-id" }));

    let refreshCalls = 0;
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      const url = String(input);
      if (url.endsWith("/recruiter/auth/refresh")) {
        refreshCalls += 1;
        return jsonResponse({
          accessToken: "fresh-token",
          refreshToken: "rotated-refresh-token",
          tokenType: "Bearer",
          user: { id: "recruiter-id" },
        });
      }

      const authorization = new Headers(init?.headers).get("Authorization");
      return authorization === "Bearer fresh-token"
        ? jsonResponse({ ok: true, url })
        : jsonResponse({ message: "Unauthorized" }, 401);
    });

    await expect(
      Promise.all([
        recruiterApiRequest("/recruiter-accounts/recruiter-id", "expired-token"),
        recruiterApiRequest("/auth/me", "expired-token"),
        recruiterApiRequest("/recruiter-accounts/recruiter-id/dashboard-stats", "expired-token"),
      ]),
    ).resolves.toHaveLength(3);

    expect(refreshCalls).toBe(1);
    expect(fetchMock).toHaveBeenCalledTimes(7);
  });
});
