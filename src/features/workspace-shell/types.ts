import type { Icon } from "@phosphor-icons/react";

export type WorkspaceRole = "recruiter" | "admin" | "candidate";

export type WorkspaceNavItem = Readonly<{
  label: string;
  href: string;
  icon: Icon;
  badge?: string;
}>;

export type WorkspaceNavGroup = Readonly<{
  label: string;
  items: WorkspaceNavItem[];
}>;

export type WorkspaceIdentity = Readonly<{
  name: string;
  roleLabel: string;
  initials: string;
}>;
