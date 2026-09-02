"use client";

import * as React from "react";

type AdminPermissionContextType = {
  permissions: string[];
  isSuperAdmin: boolean;
  hasPermission: (permission: string | string[], mode?: "all" | "any") => boolean;
};

const AdminPermissionContext = React.createContext<AdminPermissionContextType>({
  permissions: [],
  isSuperAdmin: false,
  hasPermission: () => false,
});

export function AdminPermissionProvider({
  permissions,
  isSuperAdmin = false,
  children,
}: {
  permissions: string[];
  isSuperAdmin?: boolean;
  children: React.ReactNode;
}) {
  const hasPermission = React.useCallback(
    (permission: string | string[], mode: "all" | "any" = "any"): boolean => {
      if (isSuperAdmin) return true;
      if (!permissions || permissions.length === 0) return false;

      const permList = Array.isArray(permission) ? permission : [permission];
      if (permList.length === 0) return true;

      if (mode === "all") {
        return permList.every((p) => permissions.includes(p));
      }
      return permList.some((p) => permissions.includes(p));
    },
    [permissions, isSuperAdmin],
  );

  const value = React.useMemo(
    () => ({
      permissions,
      isSuperAdmin,
      hasPermission,
    }),
    [permissions, isSuperAdmin, hasPermission],
  );

  return (
    <AdminPermissionContext.Provider value={value}>{children}</AdminPermissionContext.Provider>
  );
}

export function useAdminPermission() {
  return React.useContext(AdminPermissionContext);
}

export function AdminPermissionGate({
  permission,
  mode = "any",
  fallback = null,
  children,
}: {
  permission: string | string[];
  mode?: "all" | "any";
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { hasPermission } = useAdminPermission();
  if (!hasPermission(permission, mode)) {
    return <>{fallback}</>;
  }
  return <>{children}</>;
}
