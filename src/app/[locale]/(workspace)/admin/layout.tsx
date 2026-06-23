"use client";

import { adminIdentity, adminNavGroups, WorkspaceShell } from "@/features/workspace-shell";

type AdminLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <WorkspaceShell workspaceRole="admin" navGroups={adminNavGroups} identity={adminIdentity}>
      {children}
    </WorkspaceShell>
  );
}
