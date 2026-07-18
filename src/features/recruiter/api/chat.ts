export type ChatUser = {
  id: string;
  name: string;
  avatarUrl?: string;
  isOnline: boolean;
  role: "candidate" | "admin" | "recruiter";
};

export type Message = {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  isRead: boolean;
};

export type ChatThread = {
  id: string;
  type: "candidate" | "support_ticket";
  participants: ChatUser[];
  lastMessage?: Message;
  unreadCount: number;
  // For support tickets
  ticketSubject?: string;
  ticketCategory?: string;
  ticketStatus?: "open" | "resolved" | "closed";
  assigneeId?: string;
};

// Mock Users
export const adminUser: ChatUser = {
  id: "admin-1",
  name: "UpNext Support",
  isOnline: true,
  role: "admin",
  avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=UpNext",
};

export const subAdminBilling: ChatUser = {
  id: "admin-billing",
  name: "Hỗ trợ Kế toán",
  isOnline: true,
  role: "admin",
  avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=Billing",
};

export const subAdminTech: ChatUser = {
  id: "admin-tech",
  name: "Hỗ trợ Kỹ thuật",
  isOnline: false,
  role: "admin",
  avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=Tech",
};

export const mockAdmins = [adminUser, subAdminBilling, subAdminTech];

const candidate1: ChatUser = {
  id: "can-1",
  name: "Nguyễn Văn A",
  isOnline: true,
  role: "candidate",
  avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
};

export const recruiterUser: ChatUser = {
  id: "recruiter-1",
  name: "HR Công ty Tech",
  isOnline: true,
  role: "recruiter",
  avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=HRTech",
};

const candidate2: ChatUser = {
  id: "can-2",
  name: "Trần Thị B",
  isOnline: false,
  role: "candidate",
  avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka",
};

// Mock Threads
export const mockCandidateThreads: ChatThread[] = [
  {
    id: "thread-1",
    type: "candidate",
    participants: [candidate1, recruiterUser],
    unreadCount: 2,
    lastMessage: {
      id: "msg-1",
      senderId: "can-1",
      content: "Dạ em chào anh/chị, em muốn hỏi thêm về vị trí Frontend Developer ạ.",
      timestamp: new Date().toISOString(),
      isRead: false,
    },
  },
  {
    id: "thread-2",
    type: "candidate",
    participants: [candidate2, recruiterUser],
    unreadCount: 0,
    lastMessage: {
      id: "msg-2",
      senderId: "recruiter-1",
      content: "Cảm ơn bạn đã tham gia phỏng vấn.",
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      isRead: true,
    },
  },
];

export const mockSupportThreads: ChatThread[] = [
  {
    id: "ticket-1",
    type: "support_ticket",
    ticketSubject: "Lỗi không mua được gói Premium",
    ticketCategory: "Thanh toán & Dịch vụ",
    ticketStatus: "open",
    assigneeId: "admin-billing",
    participants: [adminUser],
    unreadCount: 1,
    lastMessage: {
      id: "msg-3",
      senderId: "admin-1",
      content: "Chào bạn, mình đã nhận được yêu cầu. Đội kỹ thuật đang kiểm tra nhé.",
      timestamp: new Date().toISOString(),
      isRead: false,
    },
  },
  {
    id: "ticket-2",
    type: "support_ticket",
    ticketSubject: "Xin cấp lại mật khẩu cho tài khoản phụ",
    ticketCategory: "Tài khoản & Bảo mật",
    ticketStatus: "resolved",
    participants: [adminUser],
    unreadCount: 0,
    lastMessage: {
      id: "msg-4",
      senderId: "admin-1",
      content: "Mật khẩu đã được reset và gửi vào email của bạn.",
      timestamp: new Date(Date.now() - 172800000).toISOString(),
      isRead: true,
    },
  },
];

export const mockMessages: Record<string, Message[]> = {
  "thread-1": [
    {
      id: "m1",
      senderId: "recruiter-1",
      content: "Chào bạn, hồ sơ của bạn khá phù hợp. Bạn có thắc mắc gì không?",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      isRead: true,
    },
    {
      id: "m2",
      senderId: "can-1",
      content: "Dạ em chào anh/chị, em muốn hỏi thêm về vị trí Frontend Developer ạ.",
      timestamp: new Date().toISOString(),
      isRead: false,
    },
  ],
  "ticket-1": [
    {
      id: "m3",
      senderId: "recruiter-1",
      content:
        "Chào admin, tài khoản công ty mình mua gói Premium báo lỗi thanh toán nhưng đã trừ tiền trong thẻ.",
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      isRead: true,
    },
    {
      id: "m4",
      senderId: "admin-1",
      content: "Chào bạn, mình đã nhận được yêu cầu. Đội kỹ thuật đang kiểm tra nhé.",
      timestamp: new Date().toISOString(),
      isRead: false,
    },
  ],
};
