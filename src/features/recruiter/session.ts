export type RecruiterSessionUser = Readonly<{
  id: string;
  email?: string;
  role?: string;
}>;

export type RecruiterSession = Readonly<{
  accessToken: string;
  user: RecruiterSessionUser;
}>;

const RECRUITER_PENDING_EMAIL_VERIFICATION_KEY = "upnext.recruiter.pendingEmailVerification";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function getRecruiterSession(): RecruiterSession | null {
  const accessToken = localStorage.getItem("upnext.recruiter.accessToken");
  const rawUser = localStorage.getItem("upnext.recruiter.user");

  if (!accessToken || !rawUser) {
    return null;
  }

  try {
    const user = JSON.parse(rawUser) as RecruiterSessionUser;

    if (!user.id) {
      clearRecruiterSession();
      return null;
    }

    return { accessToken, user };
  } catch {
    clearRecruiterSession();
    return null;
  }
}

export function clearRecruiterSession() {
  localStorage.removeItem("upnext.recruiter.accessToken");
  localStorage.removeItem("upnext.recruiter.refreshToken");
  localStorage.removeItem("upnext.recruiter.tokenType");
  localStorage.removeItem("upnext.recruiter.user");
}

export function markRecruiterEmailVerificationPending(email: string) {
  localStorage.setItem(RECRUITER_PENDING_EMAIL_VERIFICATION_KEY, normalizeEmail(email));
}

export function clearRecruiterEmailVerificationPending(email?: string) {
  const pendingEmail = localStorage.getItem(RECRUITER_PENDING_EMAIL_VERIFICATION_KEY);

  if (!email || pendingEmail === normalizeEmail(email)) {
    localStorage.removeItem(RECRUITER_PENDING_EMAIL_VERIFICATION_KEY);
  }
}

export function isRecruiterEmailVerificationPending(email?: string | null) {
  if (!email) return false;

  return localStorage.getItem(RECRUITER_PENDING_EMAIL_VERIFICATION_KEY) === normalizeEmail(email);
}
