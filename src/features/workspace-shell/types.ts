import type { Icon } from "@phosphor-icons/react";

export type WorkspaceRole = "recruiter" | "admin" | "candidate";

export type WorkspaceNavItem = Readonly<{
  label: string;
  href: string;
  icon: Icon;
  badge?: string;
  badgeTone?: "brand" | "premium" | "success" | "warning" | "info" | "neutral" | "error";
  children?: ReadonlyArray<{
    label: string;
    href: string;
  }>;
}>;

export type WorkspaceNavGroup = Readonly<{
  label: string;
  icon?: Icon;
  items: WorkspaceNavItem[];
  href?: string;
}>;

export type WorkspaceIdentity = Readonly<{
  name: string;
  roleLabel: string;
  initials: string;
  email?: string | undefined;
  avatarUrl?: string | undefined;
}>;
