"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { clearAdminSession, getAdminSession } from "@/features/admin/session";
import { ChatSocketProvider } from "@/features/chat";
import { getCurrentIdentity } from "@/features/chat/api/conversations";
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
  const [permissions, setPermissions] = useState<string[]>([]);

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
      void getCurrentIdentity(session.accessToken)
        .then((response) => setPermissions(response.data.permissions))
        .catch(() => {
          clearAdminSession();
          router.push("/portal-access");
        });
    } else {
      router.push("/portal-access");
    }
  }, [router]);

  const translatedNavGroups = adminNavGroups
    .map((group) => ({
      ...group,
      label: tNav(group.label as any),
      items: group.items
        .filter(
          (item) =>
            item.href !== "/admin/content/support" ||
            permissions.some((permission) => permission.startsWith("support:")),
        )
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
      <AdminShell navGroups={translatedNavGroups} identity={identity} onLogout={handleLogout}>
        {children}
      </AdminShell>
    </ChatSocketProvider>
  );
}
