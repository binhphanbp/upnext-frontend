import type { NextRequest } from "next/server";

const apiProxyOrigin = process.env.API_PROXY_ORIGIN ?? "http://localhost:3001";

type ProxyRouteContext = {
  params: Promise<{ proxy: string[] }>;
};

function createProxyUrl(path: string, search: string) {
  const origin = apiProxyOrigin.replace(/\/$/u, "");
  const normalizedPath = path.replace(/^\/+/u, "");

  return `${origin}/api/v1/${normalizedPath}${search}`;
}

async function proxyApiRequest(req: NextRequest, { params }: ProxyRouteContext) {
  const { proxy } = await params;
  const slug = proxy.join("/");
  const url = createProxyUrl(slug, req.nextUrl.search);

  const headers = new Headers();
  const contentType = req.headers.get("Content-Type");
  const authorization = req.headers.get("Authorization");

  if (contentType) {
    headers.set("Content-Type", contentType);
  }

  if (authorization) {
    headers.set("Authorization", authorization);
  }

  headers.set(
    "User-Agent",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  );
  headers.set("Accept", "application/json");

  try {
    const requestInit: RequestInit = {
      method: req.method,
      headers,
      redirect: "manual",
    };

    if (req.method !== "GET" && req.method !== "HEAD") {
      requestInit.body = await req.arrayBuffer();
    }

    const response = await fetch(url, requestInit);

    const responseBody = await response.text();
    const responseHeaders = new Headers();
    const location = response.headers.get("Location");

    responseHeaders.set("Content-Type", response.headers.get("Content-Type") || "application/json");

    if (location) {
      responseHeaders.set("Location", location);
    }

    return new Response(responseBody, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (err: unknown) {
    console.error("[Proxy Error]", err);
    const message = err instanceof Error ? err.message : "Unexpected proxy error";

    return new Response(JSON.stringify({ error: message, type: "PROXY_ERROR" }), { status: 500 });
  }
}

export const GET = proxyApiRequest;
export const POST = proxyApiRequest;
export const PUT = proxyApiRequest;
export const PATCH = proxyApiRequest;
export const DELETE = proxyApiRequest;
