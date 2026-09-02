"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { getCurrentAdminProfile } from "@/features/admin/api/auth";
import { AdminPermissionProvider } from "@/features/admin/hooks/use-admin-permission";
import { clearAdminSession, getAdminSession } from "@/features/admin/session";
import { ChatSocketProvider } from "@/features/chat";
import { adminIdentity, adminNavGroups, AdminShell } from "@/features/workspace-shell";
import type { WorkspaceIdentity } from "@/features/workspace-shell/types";
import { useRouter } from "@/i18n/navigation";

type AdminLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

const ROUTE_PERMISSIONS: Record<string, string | string[]> = {
  "/admin/users/employers": "companies:view",
  "/admin/content/jobs": "jobs:view",
  "/admin/content/articles": "posts:manage",
  "/admin/reports": ["reports:handle", "appeals:handle"],
  "/admin/finance/plans": "billing:plans",
  "/admin/finance/payment-config": "billing:plans",
  "/admin/finance/transactions": "billing:invoices",
  "/admin/system/roles": ["roles:read", "admins:read"],
  "/admin/system/audit-log": "system:audit",
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  const tNav = useTranslations("AdminNav");
  const router = useRouter();
  const [identity, setIdentity] = useState<WorkspaceIdentity>(adminIdentity);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    const session = getAdminSession();
    if (session?.accessToken) {
      getCurrentAdminProfile(session.accessToken)
        .then((res) => {
          const profile = res.data;
          const roleCode = profile.role?.roleCode || "";
          const isSuper = roleCode === "SUPER_ADMIN";
          setIsSuperAdmin(isSuper);
          setPermissions(profile.permissions || []);

          const name = profile.fullName || profile.email.split("@")[0] || "Admin";
          const initials = profile.fullName
            ? profile.fullName
                .split(" ")
                .map((w) => w[0])
                .slice(-2)
                .join("")
                .toUpperCase()
            : "AD";

          setIdentity({
            name,
            email: profile.email,
            roleLabel: profile.role?.roleName || "Quản trị viên",
            initials,
          });
        })
        .catch(() => {
          clearAdminSession();
          router.push("/portal-access");
        });
    } else {
      router.push("/portal-access");
    }
  }, [router]);

  const hasItemAccess = (href: string) => {
    if (isSuperAdmin) return true;
    if (href === "/admin/content/support") {
      return permissions.some((p) => p.startsWith("support:"));
    }
    const required = ROUTE_PERMISSIONS[href];
    if (!required) return true;
    if (Array.isArray(required)) {
      return required.some((p) => permissions.includes(p));
    }
    return permissions.includes(required);
  };

  const translatedNavGroups = adminNavGroups
    .map((group) => ({
      ...group,
      label: tNav(group.label as any),
      items: group.items
        .filter((item) => hasItemAccess(item.href))
        .map((item) => ({
          ...item,
          label: tNav(item.label as any),
        })),
    }))
    .filter((group) => group.items.length > 0);

  const handleLogout = () => {
    clearAdminSession();
    router.push("/portal-access");
  };

  return (
    <ChatSocketProvider actor="ADMIN">
      <AdminPermissionProvider permissions={permissions} isSuperAdmin={isSuperAdmin}>
        <AdminShell navGroups={translatedNavGroups} identity={identity} onLogout={handleLogout}>
          {children}
        </AdminShell>
      </AdminPermissionProvider>
    </ChatSocketProvider>
  );
}
