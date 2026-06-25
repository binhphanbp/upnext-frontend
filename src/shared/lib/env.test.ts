import { describe, expect, it } from "vitest";

import { env } from "./env";

describe("env", () => {
  it("exposes the default API base URL and disabled mocking mode", () => {
    expect(env.NEXT_PUBLIC_API_BASE_URL).toBe("http://localhost:3636/api/v1");
    expect(env.NEXT_PUBLIC_API_MOCKING).toBe("disabled");
    expect(env.NEXT_PUBLIC_RECRUITER_COMPANY_ID).toBe("76445328-62fc-4f74-b4e8-9398a8ad7a3a");
  });
});
