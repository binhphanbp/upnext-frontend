import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError, apiRequest, setAuthRefreshHandler } from "./http";

function mockFetch(response: Response) {
  vi.stubGlobal(
    "fetch",
    vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(
      async () => response,
    ),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("apiRequest", () => {
  it("parses a JSON body", async () => {
    mockFetch(new Response(JSON.stringify({ id: "job-1" }), { status: 201 }));

    await expect(apiRequest<{ id: string }>("/job-posts")).resolves.toEqual({ id: "job-1" });
  });

  it("accepts a 200 with an empty body instead of reporting a failure", async () => {
    // NestJS handlers that return void answer exactly like this; treating it as a broken response
    // made a successful save look like a lost connection.
    mockFetch(new Response("", { status: 200 }));

    await expect(apiRequest("/job-posts/job-1/skills")).resolves.toBeUndefined();
  });

  it("accepts a 204 with no content", async () => {
    mockFetch(new Response(null, { status: 204 }));

    await expect(apiRequest("/job-posts/job-1")).resolves.toBeUndefined();
  });

  it("reports a malformed success body as an API error, not a transport failure", async () => {
    mockFetch(new Response("<html>oops</html>", { status: 200 }));

    await expect(apiRequest("/job-posts")).rejects.toBeInstanceOf(ApiError);
  });

  it("keeps the server message for error responses", async () => {
    mockFetch(
      new Response(JSON.stringify({ message: "Company must be verified", statusCode: 403 }), {
        status: 403,
        headers: { "content-type": "application/json" },
      }),
    );

    await expect(apiRequest("/job-posts/job-1/publish")).rejects.toMatchObject({
      status: 403,
      message: "Company must be verified",
    });
  });

  it("automatically refreshes token and retries on 401 when refresh handler is set", async () => {
    const refreshHandler = vi.fn().mockResolvedValue("new-refreshed-token");
    setAuthRefreshHandler(refreshHandler);

    let callCount = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
        callCount++;
        if (callCount === 1) {
          return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
        }
        const auth = new Headers(init?.headers).get("Authorization");
        return new Response(JSON.stringify({ ok: true, auth }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }),
    );

    const result = await apiRequest<{ ok: boolean; auth: string }>("/job-posts", {
      headers: { Authorization: "Bearer expired-token" },
    });

    expect(result).toEqual({ ok: true, auth: "Bearer new-refreshed-token" });
    expect(refreshHandler).toHaveBeenCalledTimes(1);

    setAuthRefreshHandler(null);
  });

  it("does not call refresh handler for bypass auth paths", async () => {
    const refreshHandler = vi.fn().mockResolvedValue("new-token");
    setAuthRefreshHandler(refreshHandler);

    mockFetch(new Response(JSON.stringify({ message: "Invalid credentials" }), { status: 401 }));

    await expect(apiRequest("/recruiter/auth/login")).rejects.toBeInstanceOf(ApiError);
    expect(refreshHandler).not.toHaveBeenCalled();

    setAuthRefreshHandler(null);
  });
});
