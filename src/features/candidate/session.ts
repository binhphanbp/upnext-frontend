export type StoredCandidateUser = Readonly<{
  id: string;
  email: string;
  role: "CANDIDATE";
}>;

export type CandidateSession = Readonly<{
  accessToken: string;
  tokenType: "Bearer";
  user: StoredCandidateUser;
}>;

const accessTokenKey = "upnext.candidate.accessToken";
const tokenTypeKey = "upnext.candidate.tokenType";
const userKey = "upnext.candidate.user";

export function getCandidateSession(): CandidateSession | null {
  if (typeof window === "undefined") return null;

  const accessToken = localStorage.getItem(accessTokenKey);
  const rawUser = localStorage.getItem(userKey);

  if (!accessToken || !rawUser) return null;

  try {
    const user = JSON.parse(rawUser) as StoredCandidateUser;

    return {
      accessToken,
      tokenType: "Bearer",
      user,
    };
  } catch {
    clearCandidateSession();
    return null;
  }
}

export function saveCandidateSession(session: CandidateSession) {
  localStorage.setItem(accessTokenKey, session.accessToken);
  localStorage.setItem(tokenTypeKey, session.tokenType);
  localStorage.setItem(userKey, JSON.stringify(session.user));
}

export function clearCandidateSession() {
  localStorage.removeItem(accessTokenKey);
  localStorage.removeItem(tokenTypeKey);
  localStorage.removeItem(userKey);
}
