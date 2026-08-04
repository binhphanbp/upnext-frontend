import { describe, expect, it } from "vitest";

import { createLoginSchema, createRegisterSchema } from "./auth-schema";

const messages = {
  emailRequired: "Email is required",
  invalidEmail: "Enter a valid email",
  emailMax: "Email is too long",
  passwordRequired: "Password is required",
  fullNameMin: "Enter your full name",
  fullNameMax: "Full name is too long",
  passwordMin: "Password is too short",
  passwordMax: "Password is too long",
  confirmRequired: "Confirm your password",
  passwordMismatch: "Passwords do not match",
};

describe("candidate auth schemas", () => {
  it("trims values and accepts the same registration limits as the API", () => {
    const result = createRegisterSchema(messages).safeParse({
      fullName: "  Ada Lovelace  ",
      email: "  ada@example.com ",
      password: "password",
      confirm: "password",
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.fullName).toBe("Ada Lovelace");
      expect(result.data.email).toBe("ada@example.com");
    }
  });

  it("rejects whitespace-only names, short passwords, mismatched confirmation, and API-overlong values", () => {
    const schema = createRegisterSchema(messages);

    expect(
      schema.safeParse({
        fullName: "  ",
        email: "candidate@example.com",
        password: "short",
        confirm: "different",
      }).success,
    ).toBe(false);
    expect(
      schema.safeParse({
        fullName: "A".repeat(151),
        email: "candidate@example.com",
        password: "p".repeat(73),
        confirm: "p".repeat(73),
      }).success,
    ).toBe(false);
  });

  it("enforces the candidate login password constraints before an API request", () => {
    const schema = createLoginSchema(messages);

    expect(schema.safeParse({ email: "candidate@example.com", password: "short" }).success).toBe(
      false,
    );
    expect(schema.safeParse({ email: "candidate@example.com", password: "password" }).success).toBe(
      true,
    );
  });
});
