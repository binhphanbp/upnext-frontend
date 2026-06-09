import { http, HttpResponse } from "msw";

import { env } from "@/shared/lib/env";

export const handlers = [
  http.get(`${env.NEXT_PUBLIC_API_BASE_URL}/health`, () => {
    return HttpResponse.json({
      service: "upnext-api",
      status: "ok",
    });
  }),
];
