import { useQuery } from "@tanstack/react-query";

import { getAdminDashboard, type AdminDashboardParams } from "../../api/dashboard";
import { getAdminSession } from "../../session";

export function useAdminDashboard(params?: AdminDashboardParams) {
  return useQuery({
    queryKey: ["admin", "dashboard", params],
    queryFn: async () => {
      const session = getAdminSession();
      if (!session) {
        throw new Error("No admin session found");
      }

      return getAdminDashboard(session.accessToken, params);
    },
  });
}
