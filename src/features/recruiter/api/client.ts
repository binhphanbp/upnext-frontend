import { ApiError, apiRequest, setAuthRefreshHandler } from "@/shared/api/http";

const RECRUITER_ACCESS_TOKEN_KEY = "upnext.recruiter.accessToken";
const RECRUITER_REFRESH_TOKEN_KEY = "upnext.recruiter.refreshToken";
const RECRUITER_TOKEN_TYPE_KEY = "upnext.recruiter.tokenType";
const RECRUITER_USER_KEY = "upnext.recruiter.user";

export const RECRUITER_SESSION_REFRESHED_EVENT = "upnext:recruiter-session-refreshed";

type RecruiterRefreshResponse = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  user: unknown;
};

let refreshRequest: Promise<string> | null = null;

setAuthRefreshHandler(async (_path, headers) => {
  if (typeof window === "undefined") return null;
  const refreshToken = localStorage.getItem(RECRUITER_REFRESH_TOKEN_KEY);
  if (!refreshToken) return null;

  const authHeader = headers.get("Authorization");
  if (authHeader && !authHeader.startsWith("Bearer ")) return null;

  return await refreshRecruiterAccessToken();
});

export function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
  };
}

export function jsonAuthHeaders(token: string) {
  return {
    ...authHeaders(token),
    "Content-Type": "application/json",
  };
}

export async function recruiterApiRequest<TResponse>(
  path: string,
  token: string,
  init: RequestInit = {},
): Promise<TResponse> {
  const accessToken = getStoredAccessToken() ?? token;

  try {
    return await apiRequest<TResponse>(path, withBearerToken(init, accessToken));
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) {
      throw error;
    }

    try {
      const refreshedAccessToken = await refreshRecruiterAccessToken();
      return await apiRequest<TResponse>(path, withBearerToken(init, refreshedAccessToken));
    } catch {
      // Keep the original 401 so the page can clear the invalid session and redirect.
      throw error;
    }
  }
}

function withBearerToken(init: RequestInit, token: string): RequestInit {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  return { ...init, headers };
}

function getStoredAccessToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(RECRUITER_ACCESS_TOKEN_KEY);
}

function refreshRecruiterAccessToken() {
  if (refreshRequest) return refreshRequest;

  refreshRequest = performRecruiterTokenRefresh().finally(() => {
    refreshRequest = null;
  });
  return refreshRequest;
}

async function performRecruiterTokenRefresh() {
  if (typeof window === "undefined") {
    throw new Error("Recruiter session refresh is only available in the browser");
  }

  const refreshToken = localStorage.getItem(RECRUITER_REFRESH_TOKEN_KEY);
  if (!refreshToken) {
    throw new Error("Recruiter refresh token is missing");
  }

  const session = await apiRequest<RecruiterRefreshResponse>("/recruiter/auth/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  localStorage.setItem(RECRUITER_ACCESS_TOKEN_KEY, session.accessToken);
  localStorage.setItem(RECRUITER_REFRESH_TOKEN_KEY, session.refreshToken);
  localStorage.setItem(RECRUITER_TOKEN_TYPE_KEY, session.tokenType);
  localStorage.setItem(RECRUITER_USER_KEY, JSON.stringify(session.user));
  window.dispatchEvent(
    new CustomEvent(RECRUITER_SESSION_REFRESHED_EVENT, {
      detail: { accessToken: session.accessToken },
    }),
  );

  return session.accessToken;
}

export function removeEmptyFields<T extends Record<string, unknown>>(payload: T) {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined && value !== ""),
  ) as Partial<T>;
}
