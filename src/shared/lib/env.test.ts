import { describe, expect, it } from "vitest";

import { env } from "./env";

describe("env", () => {
  it("exposes the default API base URL and disabled mocking mode", () => {
    expect(env.NEXT_PUBLIC_API_BASE_URL).toBe("http://localhost:3001");
    expect(env.NEXT_PUBLIC_API_MOCKING).toBe("disabled");
  });
});
