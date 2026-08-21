import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiRequest } from "@/shared/api/http";

import { confirmCandidatePasswordReset, requestCandidatePasswordReset } from "./auth";

vi.mock("@/shared/api/http", () => ({
  apiRequest: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
}));

describe("candidate password reset API", () => {
  beforeEach(() => {
    vi.mocked(apiRequest).mockReset();
  });

  it("requests a reset link with the candidate endpoint and selected locale", async () => {
    vi.mocked(apiRequest).mockResolvedValue({ message: "Email sent" });

    await requestCandidatePasswordReset("candidate@example.com", "en");

    expect(apiRequest).toHaveBeenCalledWith("/candidate-accounts/password-reset/request", {
      body: JSON.stringify({ email: "candidate@example.com" }),
      headers: {
        "Content-Type": "application/json",
        "x-locale": "en",
      },
      method: "POST",
    });
  });

  it("confirms a reset with the token and new password", async () => {
    vi.mocked(apiRequest).mockResolvedValue({ message: "Password reset" });

    await confirmCandidatePasswordReset({ token: "reset-token", password: "new-password" });

    expect(apiRequest).toHaveBeenCalledWith("/candidate-accounts/password-reset/confirm", {
      body: JSON.stringify({ token: "reset-token", password: "new-password" }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
  });
});
