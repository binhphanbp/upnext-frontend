"use client";

import { recruiterIdentity, recruiterNavGroups, WorkspaceShell } from "@/features/workspace-shell";

type RecruiterLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function RecruiterLayout({ children }: RecruiterLayoutProps) {
  return (
    <WorkspaceShell
      workspaceRole="recruiter"
      navGroups={recruiterNavGroups}
      identity={recruiterIdentity}
    >
      {children}
    </WorkspaceShell>
  );
}
