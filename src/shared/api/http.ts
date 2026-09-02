import { env } from "@/shared/lib/env";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly payload: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export type AuthRefreshHandler = (path: string, headers: Headers) => Promise<string | null>;
let authRefreshHandler: AuthRefreshHandler | null = null;

export function setAuthRefreshHandler(handler: AuthRefreshHandler | null) {
  authRefreshHandler = handler;
}

function isAuthBypassPath(path: string) {
  return (
    path.includes("/auth/login") ||
    path.includes("/auth/refresh") ||
    path.includes("/auth/register") ||
    path.includes("/email-verification") ||
    path.includes("/password-reset")
  );
}

export function createApiUrl(path: string) {
  if (/^https?:\/\//u.test(path)) {
    return path;
  }

  const baseUrl = env.NEXT_PUBLIC_API_BASE_URL.endsWith("/")
    ? env.NEXT_PUBLIC_API_BASE_URL
    : `${env.NEXT_PUBLIC_API_BASE_URL}/`;
  const normalizedPath = path.replace(/^\/+/u, "");

  if (baseUrl.startsWith("/")) {
    return `${baseUrl}${normalizedPath}`;
  }

  return new URL(normalizedPath, baseUrl).toString();
}

export async function apiRequest<TResponse>(
  path: string,
  init: RequestInit = {},
): Promise<TResponse> {
  const headers = new Headers(init.headers);
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  const url = createApiUrl(path);
  let response = await fetch(url, {
    ...init,
    headers,
  });

  if (response.status === 401 && authRefreshHandler && !isAuthBypassPath(path)) {
    try {
      const refreshedToken = await authRefreshHandler(path, headers);
      if (refreshedToken) {
        headers.set("Authorization", `Bearer ${refreshedToken}`);
        response = await fetch(url, {
          ...init,
          headers,
        });
      }
    } catch {
      // Keep going to response status handling if refresh fails
    }
  }

  if (!response.ok) {
    const payload = await readResponsePayload(response);
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "message" in payload &&
      typeof payload.message === "string"
        ? payload.message
        : `Request failed with status ${response.status}`;

    throw new ApiError(response.status, message, payload);
  }

  if (response.status === 204 || response.status === 205 || response.status === 304) {
    return undefined as TResponse;
  }

  // Some endpoints answer 200 with no body at all (a NestJS handler that returns void). Calling
  // `response.json()` on that throws a SyntaxError, which every caller then reports as a lost
  // connection — the request had in fact succeeded.
  const body = await response.text();
  if (body.trim() === "") {
    return undefined as TResponse;
  }

  try {
    return JSON.parse(body) as TResponse;
  } catch {
    throw new ApiError(
      response.status,
      "Phản hồi từ hệ thống không đúng định dạng. Vui lòng thử lại.",
      body,
    );
  }
}

async function readResponsePayload(response: Response) {
  try {
    const text = await response.text();
    if (!text || text.trim() === "") {
      return null;
    }
    return JSON.parse(text);
  } catch {
    return null;
  }
}
