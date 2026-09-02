export const DEFAULT_API_BASE_URL =
  process.env.NEXT_PUBLIC_AI_INTERVIEW_BACKEND_URL || "http://100.85.145.47:5000";

const STORAGE_KEY = "ai_interview_backend_url";

export function getApiBaseUrl(): string {
  if (typeof window === "undefined") return DEFAULT_API_BASE_URL;
  return localStorage.getItem(STORAGE_KEY) || DEFAULT_API_BASE_URL;
}

export function setApiBaseUrl(url: string): void {
  if (typeof window === "undefined") return;
  const cleanUrl = url.trim().replace(/\/+$/, "");
  localStorage.setItem(STORAGE_KEY, cleanUrl);
}

export interface BackendHealthStatus {
  online: boolean;
  message?: string;
  uptime?: number;
  timestamp?: string;
}

export async function checkBackendHealth(customUrl?: string): Promise<BackendHealthStatus> {
  const baseUrl = customUrl || getApiBaseUrl();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(`${baseUrl}/api/health`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      return {
        online: true,
        message: data.message,
        uptime: data.uptime,
        timestamp: data.timestamp,
      };
    }
    return { online: false, message: `Server error: HTTP ${response.status}` };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Không thể kết nối đến Backend";
    return {
      online: false,
      message: errorMsg,
    };
  }
}
