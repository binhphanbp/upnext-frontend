import { describe, expect, it } from "vitest";

import { createExperienceSchema, createPreferencesSchema } from "./profile-schemas";

const messages = {
  dateRange: "date range",
  gpaRange: "gpa range",
  invalidDate: "invalid date",
  invalidNumber: "invalid number",
  invalidPhone: "invalid phone",
  invalidUrl: "invalid url",
  maxLength: (maximum: number) => `maximum ${maximum}`,
  noticePeriodRange: "notice period range",
  required: "required",
  salaryRange: "salary range",
};

describe("candidate profile schemas", () => {
  it("rejects an end date before the start date", () => {
    const result = createExperienceSchema(messages).safeParse({
      companyName: "UpNext",
      description: "",
      employmentType: "Full-time",
      endDate: "2024-01-01",
      isCurrent: false,
      positionTitle: "Engineer",
      startDate: "2025-01-01",
      technologies: "",
    });

    expect(result.success).toBe(false);
  });

  it("keeps a valid saved salary range and rejects an inverted range", () => {
    const schema = createPreferencesSchema(messages);
    const validValues = {
      desiredPosition: "Frontend Engineer",
      desiredSalaryMax: "40000000",
      desiredSalaryMin: "30000000",
      isRelocate: false,
      noticePeriodDays: "14",
      salaryCurrency: "VND",
      workingModel: "HYBRID" as const,
    };

    expect(schema.safeParse(validValues).success).toBe(true);
    expect(schema.safeParse({ ...validValues, desiredSalaryMax: "20000000" }).success).toBe(false);
  });
});
