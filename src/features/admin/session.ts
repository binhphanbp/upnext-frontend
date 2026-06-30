import type { AdminAuthUser } from "./api/auth";

export type AdminSession = Readonly<{
  accessToken: string;
  tokenType: string;
  user: AdminAuthUser;
}>;

export function getAdminSession(): AdminSession | null {
  if (typeof window === "undefined") return null;

  const accessToken = window.localStorage.getItem("upnext.admin.accessToken");
  const tokenType = window.localStorage.getItem("upnext.admin.tokenType");
  const userJson = window.localStorage.getItem("upnext.admin.user");

  if (!accessToken || !tokenType || !userJson) {
    return null;
  }

  try {
    const user = JSON.stringify(JSON.parse(userJson)) !== "{}" ? JSON.parse(userJson) : null;
    if (!user) return null;

    return {
      accessToken,
      tokenType,
      user,
    };
  } catch {
    return null;
  }
}

export function clearAdminSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem("upnext.admin.accessToken");
  window.localStorage.removeItem("upnext.admin.tokenType");
  window.localStorage.removeItem("upnext.admin.user");
}
