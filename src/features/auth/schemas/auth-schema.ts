import { z } from "zod";

export type AuthValidationMessages = {
  invalidEmail: string;
  passwordRequired: string;
  fullNameMin: string;
  passwordMin: string;
  confirmRequired: string;
  passwordMismatch: string;
};

export type LoginValues = {
  email: string;
  password: string;
};

export type RegisterValues = {
  fullName: string;
  email: string;
  password: string;
  confirm: string;
};

export function createLoginSchema(messages: AuthValidationMessages) {
  return z.object({
    email: z.email(messages.invalidEmail),
    password: z.string().min(1, messages.passwordRequired),
  });
}

export function createRegisterSchema(messages: AuthValidationMessages) {
  return z
    .object({
      fullName: z.string().min(2, messages.fullNameMin),
      email: z.email(messages.invalidEmail),
      password: z.string().min(8, messages.passwordMin),
      confirm: z.string().min(1, messages.confirmRequired),
    })
    .refine((values) => values.password === values.confirm, {
      message: messages.passwordMismatch,
      path: ["confirm"],
    });
}
