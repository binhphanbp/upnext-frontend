import { apiRequest } from "@/shared/api/http";

export type AdminAppeal = {
  id: string;
  targetType: string;
  targetId: string;
  content: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  updatedAt: string;
  recruiterAccount?: {
    id: string;
    email: string;
    company?: { name: string } | null;
  };
};

export async function getAdminAppeals(token: string, status?: "PENDING" | "APPROVED" | "REJECTED") {
  const query = status ? `?status=${status}` : "";
  return apiRequest<AdminAppeal[]>(`/admin/appeals${query}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function resolveAdminAppeal(
  token: string,
  id: string,
  status: "APPROVED" | "REJECTED",
) {
  return apiRequest(`/admin/appeals/${id}/status`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });
}
