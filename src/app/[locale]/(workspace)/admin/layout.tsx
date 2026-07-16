"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { clearAdminSession, getAdminSession } from "@/features/admin/session";
import { adminIdentity, adminNavGroups, AdminShell } from "@/features/workspace-shell";
import type { WorkspaceIdentity } from "@/features/workspace-shell/types";
import { useRouter } from "@/i18n/navigation";

type AdminLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function AdminLayout({ children }: AdminLayoutProps) {
  const tNav = useTranslations("AdminNav");
  const router = useRouter();
  const [identity, setIdentity] = useState<WorkspaceIdentity>(adminIdentity);

  useEffect(() => {
    const session = getAdminSession();
    if (session?.user?.email) {
      const email = session.user.email;
      const emailNamePart = email.split("@")[0] || "";
      const name = emailNamePart || "Admin User";
      const initials = emailNamePart.substring(0, 2).toUpperCase() || "AD";
      setIdentity({
        name,
        email,
        roleLabel: "Quản trị viên",
        initials,
      });
    }
  }, []);

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
    <AdminShell navGroups={translatedNavGroups} identity={identity} onLogout={handleLogout}>
      {children}
    </AdminShell>
  );
}
