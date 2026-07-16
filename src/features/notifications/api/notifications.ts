import { apiRequest } from "@/shared/api/http";

export type NotificationActorType = "CANDIDATE" | "RECRUITER";

export type Notification = Readonly<{
  id: string;
  recipientId: string;
  recipientType: NotificationActorType;
  title: string;
  body: string;
  read: boolean;
  targetId: string | null;
  targetType: string | null;
  createdAt: string;
}>;

export type GetNotificationsResponse = Readonly<{
  items: Notification[];
  unreadCount: number;
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}>;

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
  };
}

export function getNotifications(token: string, page = 1, limit = 10) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  return apiRequest<GetNotificationsResponse>(`/notifications?${params.toString()}`, {
    headers: authHeaders(token),
  });
}

export function markAllNotificationsAsRead(token: string) {
  return apiRequest<{ success: boolean; message: string }>("/notifications/read-all", {
    method: "PATCH",
    headers: authHeaders(token),
  });
}

export function markNotificationAsRead(token: string, id: string) {
  return apiRequest<Notification>(`/notifications/${id}/read`, {
    method: "PATCH",
    headers: authHeaders(token),
  });
}

export function deleteNotification(token: string, id: string) {
  return apiRequest<{ success: boolean }>(`/notifications/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
}

export function registerFcmToken(token: string, fcmToken: string, deviceType = "web") {
  return apiRequest<any>("/notifications/tokens/register", {
    method: "POST",
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token: fcmToken, deviceType }),
  });
}

export function unregisterFcmToken(token: string, fcmToken: string) {
  return apiRequest<{ message: string }>("/notifications/tokens/unregister", {
    method: "POST",
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token: fcmToken }),
  });
}
