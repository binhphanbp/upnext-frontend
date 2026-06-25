import { z } from "zod";

export type AdminAuthValidationMessages = {
  invalidEmail: string;
  passwordRequired: string;
};

export type AdminLoginValues = {
  email: string;
  password: string;
};

export function createAdminLoginSchema(messages: AdminAuthValidationMessages) {
  return z.object({
    email: z.string().email(messages.invalidEmail),
    password: z.string().min(1, messages.passwordRequired),
  });
}
