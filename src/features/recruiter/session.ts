import {
  syncFcmTokenIfPermitted,
  unregisterCurrentFcmToken,
} from "@/features/notifications/lib/firebase-fcm";

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
const RECRUITER_COMPANY_ONBOARDING_SKIP_PREFIX = "upnext.recruiter.skippedCompanyOnboarding";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function companyOnboardingSkipKey(userId: string) {
  return `${RECRUITER_COMPANY_ONBOARDING_SKIP_PREFIX}.${userId}`;
}

// sessionStorage (không phải localStorage): "bỏ qua" chỉ có hiệu lực trong phiên
// trình duyệt hiện tại — tải lại trang vẫn giữ trạng thái đã bỏ qua, nhưng đăng
// xuất (clearRecruiterSession) hoặc đóng tab sẽ xoá, để lần đăng nhập sau onboarding
// tự hiện lại nếu công ty vẫn chưa hoàn tất/verify.
export function getRecruiterCompanyOnboardingSkip(userId: string): boolean {
  return sessionStorage.getItem(companyOnboardingSkipKey(userId)) === "true";
}

export function setRecruiterCompanyOnboardingSkip(userId: string) {
  sessionStorage.setItem(companyOnboardingSkipKey(userId), "true");
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
  const currentToken = localStorage.getItem("upnext.recruiter.accessToken");
  if (currentToken) {
    void unregisterCurrentFcmToken(currentToken);
  }

  const rawUser = localStorage.getItem("upnext.recruiter.user");
  if (rawUser) {
    try {
      const user = JSON.parse(rawUser) as RecruiterSessionUser;
      if (user.id) {
        sessionStorage.removeItem(companyOnboardingSkipKey(user.id));
      }
    } catch {
      // Ignore malformed cached user; nothing to clean up for it.
    }
  }

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
