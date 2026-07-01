"use client";

import { useTranslations } from "next-intl";

import { clearAdminSession } from "@/features/admin/session";
import { adminIdentity, adminNavGroups, WorkspaceShell } from "@/features/workspace-shell";
import { useRouter } from "@/i18n/navigation";

type AdminLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function AdminLayout({ children }: AdminLayoutProps) {
  const tNav = useTranslations("AdminNav");
  const router = useRouter();

  const translatedNavGroups = adminNavGroups.map((group) => ({
    ...group,
    label: tNav(group.label as any),
    items: group.items.map((item) => ({
      ...item,
      label: tNav(item.label as any),
    })),
  }));

  const handleLogout = () => {
    clearAdminSession();
    router.push("/portal-access");
  };

  return (
    <WorkspaceShell
      workspaceRole="admin"
      navGroups={translatedNavGroups}
      identity={adminIdentity}
      onLogout={handleLogout}
    >
      {children}
    </WorkspaceShell>
  );
}
