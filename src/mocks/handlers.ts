import { http, HttpResponse } from "msw";

import { env } from "@/shared/lib/env";

export const handlers = [
  http.get(`${env.NEXT_PUBLIC_API_BASE_URL}/health`, () => {
    return HttpResponse.json({
      service: "upnext-api",
      status: "ok",
    });
  }),
  http.post(`${env.NEXT_PUBLIC_API_BASE_URL}/admin/auth/login`, async ({ request }) => {
    const body = (await request.json()) as any;
    if (
      body.email === "admin.super@upnext.dev" ||
      body.email === "admin.moderator@upnext.dev" ||
      body.email === "admin.compliance@upnext.dev" ||
      body.email === "admin.finance@upnext.dev" ||
      body.email === "admin.support@upnext.dev"
    ) {
      return HttpResponse.json({
        accessToken: "mock-admin-token-123",
        tokenType: "Bearer",
        user: { id: "admin-1", email: body.email, role: "ADMIN" },
      });
    }
    return HttpResponse.json(
      { message: "Invalid credentials", error: "Unauthorized", statusCode: 401 },
      { status: 401 },
    );
  }),
];
