"use client";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import { getRecruiterAccount } from "@/features/recruiter/api/onboarding";
import { getCompanyMembers, getRecruiterRoles } from "@/features/recruiter/api/team";
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
  "/recruiter/job-posts": ["jobs_manage"],
  "/recruiter/candidates": ["applications_manage", "applications_review_assigned"],
  "/recruiter/pipeline": ["applications_manage", "applications_review_assigned"],
  "/recruiter/interviews": ["interviews_manage", "interviews_review_assigned"],
  "/recruiter/company-profile": ["company_manage"],
  "/recruiter/company-addresses": ["company_manage"],
  "/recruiter/team": ["members_manage"],
  "/recruiter/team/members": ["members_manage"],
  "/recruiter/team/roles": ["members_manage"],
  "/recruiter/analytics": ["jobs_manage", "company_manage"],
  "/recruiter/billing": ["billing_manage"],
};

function isOwnerRole(role: { code?: string | null; name?: string | null } | null | undefined) {
  const code = role?.code?.trim().toUpperCase();
  const name = role?.name?.trim().toUpperCase();
  return code === "OWNER" || name === "OWNER";
}

function hasPermissionForHref(href: string, userPermissions: string[], isOwner: boolean): boolean {
  if (isOwner) return true;
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
  const [isOwner, setIsOwner] = useState(true);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const t = useTranslations("Recruiter");

  const translatedNavGroups = useMemo(() => {
    const checkItem = (item: any): any | null => {
      if (!hasPermissionForHref(item.href, userPermissions, isOwner)) {
        return null;
      }

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
        const filteredChildren = item.children
          .map((child: any) => {
            if (!hasPermissionForHref(child.href, userPermissions, isOwner)) {
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
  }, [t, userPermissions, isOwner]);

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

      const loadRecruiterData = async () => {
        try {
          const account = await getRecruiterAccount(parsedUser.id, accessToken);

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

          if (account.company?.id) {
            const companyId = account.company.id;
            const [members, roles] = await Promise.all([
              getCompanyMembers(companyId, accessToken),
              getRecruiterRoles(accessToken),
            ]);

            const currentMember = members.find(
              (m) =>
                (m.recruiterAccount?.id && m.recruiterAccount.id === parsedUser.id) ||
                (m.recruiterAccount?.email &&
                  m.recruiterAccount.email.toLowerCase() === account.email.toLowerCase()) ||
                (m.invitedEmail && m.invitedEmail.toLowerCase() === account.email.toLowerCase()),
            );

            const owner = isOwnerRole(currentMember?.role) || !currentMember?.role;
            setIsOwner(owner);

            if (!owner && currentMember.role) {
              const roleDetails = roles.find((r) => r.id === currentMember.role?.id);
              if (roleDetails?.rolePermissions) {
                const permCodes = roleDetails.rolePermissions.map(
                  (rp) => rp.recruiterPermission.code,
                );
                setUserPermissions(permCodes);
              }
            }
          } else {
            setIsOwner(true);
          }
        } catch (error) {
          console.error("loadRecruiterData error in layout:", error);
          if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
            localStorage.removeItem("upnext.recruiter.accessToken");
            localStorage.removeItem("upnext.recruiter.tokenType");
            localStorage.removeItem("upnext.recruiter.user");
            router.replace("/recruiter/login");
          }
        } finally {
          setLoading(false);
        }
      };

      void loadRecruiterData();
    } catch (e) {
      console.error("Error in recruiter layout try-catch:", e);
      localStorage.removeItem("upnext.recruiter.accessToken");
      localStorage.removeItem("upnext.recruiter.tokenType");
      localStorage.removeItem("upnext.recruiter.user");
      router.replace("/recruiter/login");
      setLoading(false);
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
