"use client";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import { ChatSocketProvider } from "@/features/chat";
import { recruiterApiRequest } from "@/features/recruiter/api/client";
import type { RecruiterAccountDetail } from "@/features/recruiter/api/onboarding";
import { clearRecruiterSession } from "@/features/recruiter/session";
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
  "/recruiter/pipeline": ["applications:manage", "applications:review_assigned"],
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

export default function RecruiterLayout({ children }: RecruiterLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [identity, setIdentity] = useState<WorkspaceIdentity | null>(null);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [stats, setStats] = useState<{ totalJobPosts: number; totalCandidates: number } | null>(
    null,
  );
  const t = useTranslations("Recruiter");

  const translatedNavGroups = useMemo(() => {
    const checkItem = (item: any): any | null => {
      if (!hasPermissionForHref(item.href, userPermissions)) {
        return null;
      }

      let itemLabel = item.label;
      let badge = item.badge;

      if (item.label === "Báo cáo tuyển dụng") itemLabel = t("nav.report");
      else if (item.label === "Tin tuyển dụng") {
        itemLabel = t("nav.jobPosts");
        if (stats) badge = String(stats.totalJobPosts);
      } else if (item.label === "Ứng viên") {
        itemLabel = t("nav.candidates");
        if (stats) badge = String(stats.totalCandidates);
      } else if (item.label === "Pipeline") {
        itemLabel = t("nav.pipeline");
        badge = undefined;
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

      const resultItem: any = {
        ...item,
        label: itemLabel,
        badge,
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
            else if (child.label === "Mời người dùng") childLabel = t("nav.inviteUsers");
            else if (child.label === "Vai trò") childLabel = t("nav.rolesSub");

            return { ...child, label: childLabel };
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

        const filteredItems = group.items.map(checkItem).filter(Boolean);

        if (filteredItems.length === 0) {
          return null;
        }

        return {
          ...group,
          label: groupLabel,
          items: filteredItems,
        };
      })
      .filter(Boolean) as any[];
  }, [t, userPermissions, stats]);

  const isAuthPage =
    pathname.includes("/login") ||
    pathname.includes("/register") ||
    pathname.includes("/forgot-password") ||
    pathname.includes("/reset-password") ||
    pathname.includes("/email-verification") ||
    pathname.includes("/auth/callback") ||
    pathname.includes("/company-invitations");

  useEffect(() => {
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
          if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
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

      void recruiterApiRequest<{ totalJobPosts: number; totalCandidates: number }>(
        `/recruiter-accounts/${parsedUser.id}/dashboard-stats`,
        accessToken,
      )
        .then((statsData) => {
          setStats(statsData);
        })
        .catch((err) => {
          if (err instanceof ApiError && (err.status === 401 || err.status === 403)) return;
          console.error("getRecruiterStats error in layout:", err);
        });
    } catch (e) {
      console.error("Error in recruiter layout try-catch:", e);
      clearRecruiterSession();
      router.replace("/recruiter/login");
      setLoading(false);
    }
  }, [isAuthPage, router]);

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
