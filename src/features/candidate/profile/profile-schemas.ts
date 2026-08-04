import { z } from "zod";

import { isValidPhoneNumber } from "@/shared/lib/phone";

export type ProfileValidationMessages = Readonly<{
  dateRange: string;
  gpaRange: string;
  invalidDate: string;
  invalidNumber: string;
  invalidPhone: string;
  invalidUrl: string;
  maxLength: (maximum: number) => string;
  noticePeriodRange: string;
  required: string;
  salaryRange: string;
}>;

const optionalText = (maximum: number, messages: ProfileValidationMessages) =>
  z.string().trim().max(maximum, messages.maxLength(maximum));

const requiredText = (maximum: number, messages: ProfileValidationMessages) =>
  optionalText(maximum, messages).min(1, messages.required);

const optionalUrl = (messages: ProfileValidationMessages) =>
  optionalText(500, messages).refine((value) => value.length === 0 || isHttpUrl(value), {
    message: messages.invalidUrl,
  });

const optionalNonNegativeNumber = (messages: ProfileValidationMessages) =>
  z
    .string()
    .trim()
    .refine(
      (value) => value.length === 0 || (Number.isFinite(Number(value)) && Number(value) >= 0),
      {
        message: messages.invalidNumber,
      },
    );

export function createProfileBasicsSchema(messages: ProfileValidationMessages) {
  return z.object({
    address: optionalText(255, messages),
    birthdate: z.string().refine((value) => !value || isPastOrToday(value), {
      message: messages.invalidDate,
    }),
    description: optionalText(5_000, messages),
    gender: z.enum(["", "MALE", "FEMALE"]),
    phoneNumber: optionalText(30, messages).refine(
      (value) => value.length === 0 || isValidPhoneNumber(value),
      { message: messages.invalidPhone },
    ),
  });
}

export function createExperienceSchema(messages: ProfileValidationMessages) {
  return z
    .object({
      companyName: requiredText(200, messages),
      description: optionalText(5_000, messages),
      employmentType: optionalText(80, messages),
      endDate: z.string(),
      isCurrent: z.boolean(),
      positionTitle: requiredText(150, messages),
      startDate: z.string(),
      technologies: optionalText(1_000, messages),
    })
    .superRefine((values, context) => {
      if (
        !values.isCurrent &&
        values.startDate &&
        values.endDate &&
        values.endDate < values.startDate
      ) {
        context.addIssue({
          code: "custom",
          message: messages.dateRange,
          path: ["endDate"],
        });
      }
    });
}

export function createProjectSchema(messages: ProfileValidationMessages) {
  return z
    .object({
      deployUrl: optionalUrl(messages),
      description: optionalText(5_000, messages),
      endDate: z.string(),
      name: requiredText(200, messages),
      projectUrl: optionalUrl(messages),
      role: optionalText(150, messages),
      startDate: z.string(),
      technologies: optionalText(1_000, messages),
    })
    .superRefine((values, context) => {
      if (values.startDate && values.endDate && values.endDate < values.startDate) {
        context.addIssue({
          code: "custom",
          message: messages.dateRange,
          path: ["endDate"],
        });
      }
    });
}

export function createEducationSchema(messages: ProfileValidationMessages) {
  return z
    .object({
      degree: optionalText(150, messages),
      description: optionalText(5_000, messages),
      endDate: z.string(),
      gpa: optionalNonNegativeNumber(messages).refine(
        (value) => value.length === 0 || Number(value) <= 10,
        { message: messages.gpaRange },
      ),
      isCurrent: z.boolean(),
      major: optionalText(150, messages),
      schoolName: requiredText(200, messages),
      startDate: z.string(),
    })
    .superRefine((values, context) => {
      if (
        !values.isCurrent &&
        values.startDate &&
        values.endDate &&
        values.endDate < values.startDate
      ) {
        context.addIssue({
          code: "custom",
          message: messages.dateRange,
          path: ["endDate"],
        });
      }
    });
}

export function createCertificationSchema(messages: ProfileValidationMessages) {
  return z
    .object({
      credentialUrl: optionalUrl(messages),
      expiredDate: z.string(),
      issuedDate: z.string(),
      name: requiredText(200, messages),
      organization: optionalText(200, messages),
    })
    .superRefine((values, context) => {
      if (values.issuedDate && values.expiredDate && values.expiredDate < values.issuedDate) {
        context.addIssue({
          code: "custom",
          message: messages.dateRange,
          path: ["expiredDate"],
        });
      }
    });
}

export function createSkillSchema(messages: ProfileValidationMessages) {
  return z.object({
    proficiencyLevel: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"]),
    skillId: requiredText(100, messages),
    skillName: requiredText(200, messages),
    yearsOfExperience: optionalNonNegativeNumber(messages).refine(
      (value) => value.length === 0 || Number(value) <= 50,
      { message: messages.invalidNumber },
    ),
  });
}

export function createLanguageSchema(messages: ProfileValidationMessages) {
  return z.object({
    language: requiredText(80, messages),
    proficiency: requiredText(80, messages),
  });
}

export function createLinkSchema(messages: ProfileValidationMessages) {
  return z.object({
    type: requiredText(50, messages),
    url: optionalUrl(messages).refine((value) => value.length > 0, {
      message: messages.required,
    }),
  });
}

export function createPreferencesSchema(messages: ProfileValidationMessages) {
  return z
    .object({
      desiredPosition: optionalText(150, messages),
      desiredSalaryMax: optionalNonNegativeNumber(messages),
      desiredSalaryMin: optionalNonNegativeNumber(messages),
      isRelocate: z.boolean(),
      noticePeriodDays: optionalNonNegativeNumber(messages).refine(
        (value) => value.length === 0 || (Number.isInteger(Number(value)) && Number(value) <= 365),
        { message: messages.noticePeriodRange },
      ),
      salaryCurrency: requiredText(10, messages),
      workingModel: z.enum(["", "ONSITE", "REMOTE", "HYBRID"]),
    })
    .superRefine((values, context) => {
      if (
        values.desiredSalaryMin &&
        values.desiredSalaryMax &&
        Number(values.desiredSalaryMin) > Number(values.desiredSalaryMax)
      ) {
        context.addIssue({
          code: "custom",
          message: messages.salaryRange,
          path: ["desiredSalaryMax"],
        });
      }
    });
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isPastOrToday(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return false;

  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return date <= today;
}
