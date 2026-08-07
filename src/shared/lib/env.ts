import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z.union([z.url(), z.string().regex(/^\/[^/]/u)]).default("/api/v1"),
  NEXT_PUBLIC_SOCKET_URL: z.string().optional().default(""),
  NEXT_PUBLIC_API_MOCKING: z.enum(["enabled", "disabled"]).default("disabled"),
  /**
   * Nguồn dữ liệu của AI Copilot. `mock` chạy kịch bản mẫu trong trình duyệt và
   * không cần backend — dùng cho demo và cho việc phát triển UI. `api` gọi
   * endpoint SSE thật.
   *
   * Mặc định `api`: một biến môi trường thiếu không được âm thầm biến sản phẩm
   * thành bản trình diễn. Muốn dữ liệu giả thì phải bật có ý thức.
   */
  NEXT_PUBLIC_AI_COPILOT_SOURCE: z.enum(["api", "mock"]).default("api"),
  NEXT_PUBLIC_RECRUITER_COMPANY_ID: z
    .string()
    .uuid()
    .default("76445328-62fc-4f74-b4e8-9398a8ad7a3a"),
});

export const env = envSchema.parse({
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL,
  NEXT_PUBLIC_API_MOCKING: process.env.NEXT_PUBLIC_API_MOCKING,
  NEXT_PUBLIC_AI_COPILOT_SOURCE: process.env.NEXT_PUBLIC_AI_COPILOT_SOURCE,
  NEXT_PUBLIC_RECRUITER_COMPANY_ID: process.env.NEXT_PUBLIC_RECRUITER_COMPANY_ID,
});
