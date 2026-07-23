import { refreshRecruiter } from "@/features/recruiter/api/auth";

import type { ActorRole } from "../types/contracts";

const tokenKeys: Record<ActorRole, string> = {
  CANDIDATE: "upnext.candidate.accessToken",
  RECRUITER: "upnext.recruiter.accessToken",
  ADMIN: "upnext.admin.accessToken",
};

export function getChatAccessToken(actor: ActorRole): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(tokenKeys[actor]);
}

export function clearChatSession(actor: ActorRole) {
  if (typeof window === "undefined") return;
  const prefix = `upnext.${actor.toLowerCase()}`;
  window.localStorage.removeItem(`${prefix}.accessToken`);
  window.localStorage.removeItem(`${prefix}.tokenType`);
  window.localStorage.removeItem(`${prefix}.user`);
  window.localStorage.removeItem(`${prefix}.refreshToken`);
  window.dispatchEvent(new CustomEvent("upnext:auth-changed", { detail: { actor } }));
}

let recruiterRefresh: Promise<string | null> | null = null;

export function refreshChatAccessToken(actor: ActorRole): Promise<string | null> {
  if (actor !== "RECRUITER" || typeof window === "undefined") return Promise.resolve(null);
  if (recruiterRefresh) return recruiterRefresh;
  const refreshToken = window.localStorage.getItem("upnext.recruiter.refreshToken");
  if (!refreshToken) return Promise.resolve(null);
  recruiterRefresh = refreshRecruiter(refreshToken)
    .then((response) => {
      window.localStorage.setItem("upnext.recruiter.accessToken", response.accessToken);
      window.localStorage.setItem("upnext.recruiter.refreshToken", response.refreshToken);
      window.localStorage.setItem("upnext.recruiter.tokenType", response.tokenType);
      window.localStorage.setItem("upnext.recruiter.user", JSON.stringify(response.user));
      return response.accessToken;
    })
    .catch(() => null)
    .finally(() => {
      recruiterRefresh = null;
    });
  return recruiterRefresh;
}
