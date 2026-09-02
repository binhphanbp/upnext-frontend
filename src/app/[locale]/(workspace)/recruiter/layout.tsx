"use client";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";

import { ChatSocketProvider } from "@/features/chat";
import {
  requestAndRegisterFcmToken,
  listenForegroundMessages,
} from "@/features/notifications/lib/firebase-fcm";
import { recruiterApiRequest } from "@/features/recruiter/api/client";
import type { RecruiterAccountDetail } from "@/features/recruiter/api/onboarding";
import { clearRecruiterSession, getRecruiterSession } from "@/features/recruiter/session";
import {
  recruiterNavGroups,
  WorkspaceShell,
  type WorkspaceIdentity,
} from "@/features/workspace-shell";
import { usePathname, useRouter } from "@/i18n/navigation";
import { ApiError } from "@/shared/api/http";

type RecruiterLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

const routePermissionMap: Record<string, string[]> = {
  "/recruiter/job-posts": ["jobs:manage"],
  "/recruiter/candidates": ["applications:manage", "applications:review_assigned"],
  // Bắt buộc phải có dòng này: `hasPermissionForHref` trả `true` cho mọi href
  // **không** có row ở đây, nên thiếu nó thì cả reviewer cũng thấy mục này.
  "/recruiter/talent-pool": ["applications:manage", "applications:review_assigned"],
  "/recruiter/interviews": ["interviews:manage", "interviews:review_assigned"],
  "/recruiter/messages": ["applications:manage", "applications:review_assigned"],
  "/recruiter/company-profile": ["company:manage"],
  "/recruiter/company-addresses": ["company:manage"],
  "/recruiter/team": ["members:manage"],
  "/recruiter/team/members": ["members:manage"],
  "/recruiter/team/roles": ["members:manage"],
  "/recruiter/analytics": ["jobs:manage", "company:manage"],
  "/recruiter/billing": ["billing:manage"],
};

function hasPermissionForHref(href: string, userPermissions: string[]): boolean {
  if (href === "/recruiter") return true;
  const required = routePermissionMap[href];
  if (!required) return true;
  return required.some((p) => userPermissions.includes(p));
}

// Cấp độ hoàn tất hồ sơ công ty: 0 = chưa thêm công ty, 1 = có công ty nhưng
// chưa được xác minh, 2 = công ty đã verified. Khác với routePermissionMap
// (phân quyền theo vai trò trong 1 công ty), tier này chỉ áp dụng cho chủ tài
// khoản (OWNER) đang trong quá trình onboarding — thành viên được mời luôn gia
// nhập một công ty đã verified sẵn nên không bao giờ rơi vào tier 0/1.
type CompanyTier = 0 | 1 | 2;

const routeTierMap: Record<string, CompanyTier> = {
  "/recruiter/job-posts": 2,
  "/recruiter/job-posts/create": 2,
  "/recruiter/job-posts/create/ai": 2,
  "/recruiter/job-posts/create/import": 2,
  "/recruiter/candidates": 2,
  "/recruiter/talent-pool": 2,
  "/recruiter/interviews": 2,
  "/recruiter/messages": 1,
  "/recruiter/team": 2,
  "/recruiter/team/members": 2,
  "/recruiter/team/roles": 2,
  "/recruiter/analytics": 2,
};

function getRequiredCompanyTier(pathname: string): CompanyTier | undefined {
  return Object.entries(routeTierMap)
    .filter(([route]) => pathname === route || pathname.startsWith(`${route}/`))
    .reduce<CompanyTier | undefined>(
      (highestTier, [, tier]) =>
        highestTier === undefined || tier > highestTier ? tier : highestTier,
      undefined,
    );
}

function getCompanyTier(account: RecruiterAccountDetail | null): CompanyTier {
  if (!account?.company?.id) return 0;
  if (account.company.verificationStatus !== "VERIFIED") return 1;
  return 2;
}

// Restricted Mode (kích hoạt khi có khiếu nại): chỉ cho phép xem Dashboard, lịch sử ứng tuyển
// và lịch sử phỏng vấn — mọi mục khác bị khoá bất kể tier, cho tới khi kháng cáo được duyệt.
const RESTRICTED_MODE_ALLOWED_HREFS = new Set<string>([
  "/recruiter",
  "/recruiter/candidates",
  "/recruiter/interviews",
]);

const RESTRICTED_MODE_LOCKED_REASON =
  "Công ty của bạn đang bị hạn chế do có khiếu nại. Vui lòng gửi kháng cáo ở trang Dashboard.";

export default function RecruiterLayout({ children }: RecruiterLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [identity, setIdentity] = useState<WorkspaceIdentity | null>(null);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [accountDetail, setAccountDetail] = useState<RecruiterAccountDetail | null>(null);
  const t = useTranslations("Recruiter");

  const companyTier = useMemo(() => getCompanyTier(accountDetail), [accountDetail]);
  const isRestricted = accountDetail?.company?.status === "RESTRICTED";
  const requiredTier = getRequiredCompanyTier(pathname);
  const tierBlocked = requiredTier !== undefined && companyTier < requiredTier;
  const restrictedBlocked = isRestricted && !RESTRICTED_MODE_ALLOWED_HREFS.has(pathname);
  const routeBlocked = tierBlocked || restrictedBlocked;

  useEffect(() => {
    const session = getRecruiterSession();
    if (session?.accessToken && typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        void requestAndRegisterFcmToken(session.accessToken);
      } else if (Notification.permission === "default") {
        const hasPrompted = sessionStorage.getItem("upnext_recruiter_notif_prompted");
        if (!hasPrompted) {
          sessionStorage.setItem("upnext_recruiter_notif_prompted", "true");
          setTimeout(() => {
            void Swal.fire({
              title: "Bật thông báo ứng tuyển?",
              text: "Bạn có muốn nhận thông báo tức thì trên thiết bị khi có ứng viên mới nộp hồ sơ không?",
              icon: "info",
              showCancelButton: true,
              confirmButtonText: "Bật thông báo ngay 🔔",
              cancelButtonText: "Để sau",
              confirmButtonColor: "#059669",
            }).then(async (result) => {
              if (result.isConfirmed) {
                const token = await requestAndRegisterFcmToken(session.accessToken);
                if (token) {
                  void Swal.fire(
                    "Thành công!",
                    "Bạn sẽ nhận được thông báo khi có ứng viên mới.",
                    "success",
                  );
                }
              }
            });
          }, 500);
        }
      }
    }
  }, []);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    void listenForegroundMessages((payload) => {
      console.log("[FCM] Recruiter foreground push message received:", payload);
      const title =
        payload?.notification?.title || payload?.data?.title || "Có hồ sơ ứng tuyển mới";
      const body = payload?.notification?.body || payload?.data?.body || "";
      const notificationId = payload?.data?.notificationId || payload?.data?.targetId || title;
      if (
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        new Notification(title, {
          body,
          icon: "/upnext-logo/icon-cropped.png",
          tag: notificationId,
        });
      }
    }).then((unsub) => {
      if (unsub) unsubscribe = unsub;
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const translatedNavGroups = useMemo(() => {
    const checkItem = (item: any): any | null => {
      if (!hasPermissionForHref(item.href, userPermissions)) {
        return null;
      }

      const requiredTier = routeTierMap[item.href];
      const tierLocked = requiredTier !== undefined && companyTier < requiredTier;
      const restrictedLocked = isRestricted && !RESTRICTED_MODE_ALLOWED_HREFS.has(item.href);
      const locked = tierLocked || restrictedLocked;

      let itemLabel = item.label;
      let badge = item.badge;

      if (item.label === "Báo cáo tuyển dụng" || item.label === "Dashboard tuyển dụng")
        itemLabel = t("nav.report");
      else if (item.label === "Tin tuyển dụng") {
        itemLabel = t("nav.jobPosts");
      } else if (item.label === "Ứng viên") {
        itemLabel = t("nav.candidates");
      } else if (item.label === "Kho CV" || item.label === "Tìm ứng viên") {
        itemLabel = t("nav.talentPool");
      } else if (item.label === "Phỏng vấn") {
        itemLabel = t("nav.interviews");
        badge = undefined;
      } else if (item.label === "Tin nhắn") {
        itemLabel = t("nav.messages");
        badge = undefined;
      } else if (item.label === "Hồ sơ công ty") itemLabel = t("nav.companyProfile");
      else if (item.label === "Đội ngũ & quyền") itemLabel = t("nav.team");
      else if (item.label === "Phân tích") itemLabel = t("nav.analytics");
      else if (item.label === "Thanh toán") itemLabel = t("nav.billing");

      if (locked) badge = undefined;

      const resultItem: any = {
        ...item,
        label: itemLabel,
        badge,
        locked,
        lockedReason: locked
          ? restrictedLocked
            ? RESTRICTED_MODE_LOCKED_REASON
            : t("nav.companyVerificationRequired")
          : undefined,
      };

      if (item.children) {
        const filteredChildren = item.children
          .map((child: any) => {
            if (!hasPermissionForHref(child.href, userPermissions)) {
              return null;
            }
            let childLabel = child.label;
            if (child.label === "Thông tin chung") childLabel = t("nav.generalInfo");
            else if (child.label === "Địa chỉ làm việc") childLabel = t("nav.companyAddresses");
            else if (child.label === "Quản lý đánh giá") childLabel = t("nav.companyReviews");
            else if (child.label === "Điểm uy tín") childLabel = t("nav.companyReputation");
            else if (child.label === "Mời người dùng") childLabel = t("nav.inviteUsers");
            else if (child.label === "Vai trò") childLabel = t("nav.rolesSub");
            else if (child.label === "Danh sách ứng tuyển") childLabel = t("nav.applicationsTab");
            else if (child.label === "AI lọc CV") childLabel = t("nav.aiCvScreeningTab");
            else if (child.label === "Ứng viên tiềm năng")
              childLabel = t("nav.potentialCandidatesTab");

            const childRequiredTier = routeTierMap[child.href];
            const childTierLocked =
              childRequiredTier !== undefined && companyTier < childRequiredTier;
            const childRestrictedLocked =
              isRestricted && !RESTRICTED_MODE_ALLOWED_HREFS.has(child.href);
            const childLocked = childTierLocked || childRestrictedLocked;

            return {
              ...child,
              label: childLabel,
              locked: childLocked,
              lockedReason: childLocked
                ? childRestrictedLocked
                  ? RESTRICTED_MODE_LOCKED_REASON
                  : t("nav.companyVerificationRequired")
                : undefined,
            };
          })
          .filter(Boolean);

        if (filteredChildren.length === 0) {
          return null;
        }
        resultItem.children = filteredChildren;
      }

      return resultItem;
    };

    return recruiterNavGroups
      .map((group) => {
        let groupLabel = group.label;
        if (group.label === "Tuyển dụng") groupLabel = t("nav.recruitment");
        else if (group.label === "Công ty") groupLabel = t("nav.company");
        else if (group.label === "Tin nhắn") groupLabel = t("nav.messages");

        // If the group itself has an href, check permission for it.
        if (group.href && !hasPermissionForHref(group.href, userPermissions)) {
          return null;
        }

        const filteredItems = group.items.map(checkItem).filter(Boolean);

        if (filteredItems.length === 0 && !group.href) {
          return null;
        }

        return {
          ...group,
          label: groupLabel,
          items: filteredItems,
        };
      })
      .filter(Boolean) as any[];
  }, [t, userPermissions, companyTier, isRestricted]);

  const isAuthPage =
    pathname.includes("/login") ||
    pathname.includes("/register") ||
    pathname.includes("/forgot-password") ||
    pathname.includes("/reset-password") ||
    pathname.includes("/email-verification") ||
    pathname.includes("/auth/callback") ||
    pathname.includes("/company-invitations") ||
    // Chặng trung gian cho link trong email: phải render trần. Nằm trong shell thì nó
    // kéo cả sidebar, header và khởi tạo FCM (kèm hộp thoại xin quyền thông báo) chỉ để
    // chuyển hướng đi ngay — đó là lý do bấm link từ email vào rất lâu.
    pathname.includes("/recruiter/continue");

  // Chỉ chặn ngược lại /login và /register — các trang auth khác (quên mật khẩu,
  // xác thực email, lời mời công ty...) vẫn phải xem được kể cả khi đã đăng nhập.
  const isLoginOrRegisterPage =
    pathname === "/recruiter/login" || pathname === "/recruiter/register";

  useEffect(() => {
    if (isLoginOrRegisterPage) {
      const accessToken = localStorage.getItem("upnext.recruiter.accessToken");
      const rawUser = localStorage.getItem("upnext.recruiter.user");
      if (accessToken && rawUser) {
        router.replace("/recruiter");
        return;
      }
    }

    if (isAuthPage) {
      setLoading(false);
      return;
    }

    const accessToken = localStorage.getItem("upnext.recruiter.accessToken");
    const rawUser = localStorage.getItem("upnext.recruiter.user");

    if (!accessToken || !rawUser) {
      router.replace("/recruiter/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(rawUser) as { id: string; name?: string; email: string };
      const name = parsedUser.name || parsedUser.email.split("@")[0] || "Nhà tuyển dụng";
      const initials = name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

      const baseIdentity = {
        name,
        roleLabel: "Nhà tuyển dụng",
        initials,
        email: parsedUser.email,
      };

      setIdentity(baseIdentity);

      const loadRecruiterData = async () => {
        try {
          const [account, currentIdentity] = await Promise.all([
            recruiterApiRequest<RecruiterAccountDetail>(
              `/recruiter-accounts/${parsedUser.id}`,
              accessToken,
            ),
            recruiterApiRequest<{ data: { permissions: string[] } }>("/auth/me", accessToken),
          ]);
          setUserPermissions(currentIdentity.data.permissions);
          setAccountDetail(account);

          if (account && account.profile) {
            const profileName = account.profile.fullName || name;
            const profileInitials = profileName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();

            setIdentity({
              name: profileName,
              roleLabel: "Nhà tuyển dụng",
              initials: profileInitials,
              email: account.email,
              avatarUrl: account.profile.avatarUrl ?? undefined,
            });
          }
        } catch (error) {
          if (error instanceof ApiError && error.status === 401) {
            clearRecruiterSession();
            router.replace("/recruiter/login");
            return;
          }
          console.error("loadRecruiterData error in layout:", error);
        } finally {
          setLoading(false);
        }
      };

      void loadRecruiterData();
    } catch (e) {
      console.error("Error in recruiter layout try-catch:", e);
      clearRecruiterSession();
      router.replace("/recruiter/login");
      setLoading(false);
    }
  }, [isAuthPage, isLoginOrRegisterPage, router]);

  // Chặn truy cập trực tiếp bằng URL vào các route yêu cầu tier cao hơn hiện tại
  // (phòng trường hợp gõ thẳng URL thay vì bấm mục đã bị khoá trên sidebar).
  useEffect(() => {
    if (loading || isAuthPage) return;

    if (routeBlocked) {
      router.replace(tierBlocked ? "/recruiter/company-profile" : "/recruiter");
    }
  }, [loading, isAuthPage, routeBlocked, tierBlocked, router]);

  useEffect(() => {
    document.body.classList.add("recruiter-workspace");
    return () => {
      document.body.classList.remove("recruiter-workspace");
    };
  }, []);

  function handleLogout() {
    clearRecruiterSession();
    router.replace("/recruiter/login");
  }

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 text-sm font-semibold text-slate-600">
        {t("shell.loading")}
      </main>
    );
  }

  // Do not mount protected page content for even one render while its redirect is pending.
  if (!isAuthPage && routeBlocked) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 text-sm font-semibold text-slate-600">
        {t("shell.loading")}
      </main>
    );
  }

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <ChatSocketProvider actor="RECRUITER">
      <WorkspaceShell
        workspaceRole="recruiter"
        navGroups={translatedNavGroups}
        identity={
          identity || { name: t("nav.recruitment"), roleLabel: "Recruiter", initials: "RE" }
        }
        onLogout={handleLogout}
      >
        {children}
      </WorkspaceShell>
    </ChatSocketProvider>
  );
}
