import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z.url().default("http://localhost:3001/api/v1"),
  NEXT_PUBLIC_API_MOCKING: z.enum(["enabled", "disabled"]).default("disabled"),
  NEXT_PUBLIC_RECRUITER_COMPANY_ID: z
    .string()
    .uuid()
    .default("76445328-62fc-4f74-b4e8-9398a8ad7a3a"),
});

export const env = envSchema.parse({
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  NEXT_PUBLIC_API_MOCKING: process.env.NEXT_PUBLIC_API_MOCKING,
  NEXT_PUBLIC_RECRUITER_COMPANY_ID: process.env.NEXT_PUBLIC_RECRUITER_COMPANY_ID,
});
