import { z } from "zod";

export type AuthValidationMessages = {
  emailRequired: string;
  invalidEmail: string;
  emailMax: string;
  passwordRequired: string;
  fullNameMin: string;
  fullNameMax: string;
  passwordMin: string;
  passwordMax: string;
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

const emailMaxLength = 255;
const fullNameMaxLength = 150;
const passwordMaxLength = 72;
const passwordMinLength = 8;

function createEmailSchema(messages: AuthValidationMessages) {
  return z
    .string()
    .trim()
    .min(1, messages.emailRequired)
    .email(messages.invalidEmail)
    .max(emailMaxLength, messages.emailMax);
}

function createPasswordSchema(messages: AuthValidationMessages) {
  return z
    .string()
    .min(1, messages.passwordRequired)
    .min(passwordMinLength, messages.passwordMin)
    .max(passwordMaxLength, messages.passwordMax);
}

export function createLoginSchema(messages: AuthValidationMessages) {
  return z.object({
    email: createEmailSchema(messages),
    password: createPasswordSchema(messages),
  });
}

export function createRegisterSchema(messages: AuthValidationMessages) {
  return z
    .object({
      fullName: z
        .string()
        .trim()
        .min(2, messages.fullNameMin)
        .max(fullNameMaxLength, messages.fullNameMax),
      email: createEmailSchema(messages),
      password: createPasswordSchema(messages),
      confirm: z.string().min(1, messages.confirmRequired),
    })
    .refine((values) => values.password === values.confirm, {
      message: messages.passwordMismatch,
      path: ["confirm"],
    });
}
