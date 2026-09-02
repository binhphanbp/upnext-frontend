const STORAGE_KEY = "upnext.search.sessionId";

/**
 * Mã phiên cho việc thống kê tìm kiếm.
 *
 * Backend đếm người tìm bằng `COALESCE(user_id, session_id)`. Không có mã này thì mọi
 * lượt tìm của khách chưa đăng nhập rơi vào NULL, và `COUNT(DISTINCT ...)` bỏ qua NULL —
 * tức là hàng nghìn lượt tìm ẩn danh đếm thành 0 người.
 *
 * Dùng `sessionStorage` chứ không phải `localStorage`: chỉ cần gộp các lượt tìm trong
 * cùng một phiên làm việc, không cần theo dõi người dùng qua nhiều ngày. Mã này là số
 * ngẫu nhiên, không chứa thông tin gì về người dùng.
 */
export function getSearchSessionId(): string | undefined {
  if (typeof window === "undefined") return undefined;

  try {
    const existing = window.sessionStorage.getItem(STORAGE_KEY);
    if (existing) return existing;

    const created = crypto.randomUUID();
    window.sessionStorage.setItem(STORAGE_KEY, created);
    return created;
  } catch {
    // Chặn cookie/storage thì bỏ qua: thống kê thiếu một dòng còn hơn vỡ ô tìm kiếm.
    return undefined;
  }
}
