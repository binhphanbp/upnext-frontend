"use client";

import { useTranslations } from "next-intl";

import { adminIdentity, adminNavGroups, WorkspaceShell } from "@/features/workspace-shell";

type AdminLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function AdminLayout({ children }: AdminLayoutProps) {
  const tNav = useTranslations("AdminNav");

  const translatedNavGroups = adminNavGroups.map((group) => ({
    ...group,
    label: tNav(group.label as any), // Type assertion might be needed if group.label is string but TS expects something else
    items: group.items.map((item) => ({
      ...item,
      label: tNav(item.label as any),
    })),
  }));

  return (
    <WorkspaceShell workspaceRole="admin" navGroups={translatedNavGroups} identity={adminIdentity}>
      {children}
    </WorkspaceShell>
  );
}
