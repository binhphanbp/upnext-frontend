"use client";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import { getRecruiterAccount } from "@/features/recruiter/api/onboarding";
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

export default function RecruiterLayout({ children }: RecruiterLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [identity, setIdentity] = useState<WorkspaceIdentity | null>(null);
  const t = useTranslations("Recruiter");

  const translatedNavGroups = useMemo(() => {
    return recruiterNavGroups.map((group) => {
      let groupLabel = group.label;
      if (group.label === "Tuyển dụng") groupLabel = t("nav.recruitment");
      else if (group.label === "Công ty") groupLabel = t("nav.company");

      return {
        ...group,
        label: groupLabel,
        items: group.items.map((item) => {
          let itemLabel = item.label;
          if (item.label === "Báo cáo tuyển dụng") itemLabel = t("nav.report");
          else if (item.label === "Tin tuyển dụng") itemLabel = t("nav.jobPosts");
          else if (item.label === "Ứng viên") itemLabel = t("nav.candidates");
          else if (item.label === "Pipeline") itemLabel = t("nav.pipeline");
          else if (item.label === "Phỏng vấn") itemLabel = t("nav.interviews");
          else if (item.label === "Hồ sơ công ty") itemLabel = t("nav.companyProfile");
          else if (item.label === "Đội ngũ & quyền") itemLabel = t("nav.team");
          else if (item.label === "Phân tích") itemLabel = t("nav.analytics");
          else if (item.label === "Thanh toán") itemLabel = t("nav.billing");

          const resultItem: any = {
            ...item,
            label: itemLabel,
          };
          if (item.children) {
            resultItem.children = item.children.map((child) => {
              let childLabel = child.label;
              if (child.label === "Thông tin chung") childLabel = t("nav.generalInfo");
              else if (child.label === "Địa chỉ làm việc") childLabel = t("nav.companyAddresses");
              else if (child.label === "Mời người dùng") childLabel = t("nav.inviteUsers");
              else if (child.label === "Vai trò") childLabel = t("nav.rolesSub");

              return { ...child, label: childLabel };
            });
          }
          return resultItem;
        }),
      };
    });
  }, [t]);

  const isAuthPage =
    pathname.includes("/login") ||
    pathname.includes("/register") ||
    pathname.includes("/forgot-password") ||
    pathname.includes("/reset-password") ||
    pathname.includes("/email-verification") ||
    pathname.includes("/auth/callback");

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
      setLoading(false);

      void getRecruiterAccount(parsedUser.id, accessToken)
        .then((account) => {
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
        })
        .catch((error) => {
          console.error("getRecruiterAccount error in layout:", error);
          if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
            localStorage.removeItem("upnext.recruiter.accessToken");
            localStorage.removeItem("upnext.recruiter.tokenType");
            localStorage.removeItem("upnext.recruiter.user");
            router.replace("/recruiter/login");
          }
        });
    } catch (e) {
      console.error("Error in recruiter layout try-catch:", e);
      localStorage.removeItem("upnext.recruiter.accessToken");
      localStorage.removeItem("upnext.recruiter.tokenType");
      localStorage.removeItem("upnext.recruiter.user");
      router.replace("/recruiter/login");
    }
  }, [pathname, isAuthPage, router]);

  function handleLogout() {
    localStorage.removeItem("upnext.recruiter.accessToken");
    localStorage.removeItem("upnext.recruiter.tokenType");
    localStorage.removeItem("upnext.recruiter.user");
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
    <WorkspaceShell
      workspaceRole="recruiter"
      navGroups={translatedNavGroups}
      identity={identity || { name: t("nav.recruitment"), roleLabel: "Recruiter", initials: "RE" }}
      onLogout={handleLogout}
    >
      {children}
    </WorkspaceShell>
  );
}
