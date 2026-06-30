import type { NextRequest } from "next/server";

import { createApiUrl } from "@/shared/api/http";

export async function POST(req: NextRequest, { params }: { params: Promise<{ proxy: string[] }> }) {
  const { proxy } = await params;
  const slug = proxy.join("/");
  const url = createApiUrl(`/${slug}`);

  // Clone the request body
  const body = await req.text();

  // We explicitly set a User-Agent to prevent Cloudflare/WAF from dropping the request (ECONNRESET)
  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  headers.set(
    "User-Agent",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  );
  headers.set("Accept", "application/json");

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: body || null,
    });

    const responseBody = await response.text();

    return new Response(responseBody, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "application/json",
      },
    });
  } catch (err: unknown) {
    console.error("[Proxy Error]", err);
    const message = err instanceof Error ? err.message : "Unexpected proxy error";

    return new Response(JSON.stringify({ error: message, type: "PROXY_ERROR" }), { status: 500 });
  }
}
