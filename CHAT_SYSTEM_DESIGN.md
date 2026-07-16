# Tài liệu thiết kế hệ thống Chat Realtime (UpNext Platform) - Tiêu chuẩn Production V2

Tài liệu này chi tiết hóa kiến trúc hệ thống Chat Realtime sử dụng **WebSocket** trên nền tảng UpNext, giải quyết triệt để các rủi ro bảo mật (Authorization), lỗi logic phòng (Room Logic), và nâng cấp trải nghiệm người dùng tối ưu (Optimistic UI, Connection states).

---

## 1. Luồng nghiệp vụ & Hoạt động chính (Applied-First Flow)

Hệ thống Chat của UpNext được thiết kế theo mô hình **Hybrid (Lai)** bảo mật, ngăn ngừa spam tối đa:

- **Ứng viên nhắn cho Nhà tuyển dụng (Candidate -> Recruiter)**: Chỉ được phép nhắn tin **sau khi đã ứng tuyển** (`Application`) vào một Job Post cụ thể của công ty.
  - Khi ứng tuyển thành công, hệ thống tự động tạo phòng chat (`ChatRoom`) gắn liền với `applicationId`.
  - Hệ thống tự động gửi một tin nhắn hệ thống chào mừng (System Message) để mở đầu hội thoại.
- **Nhà tuyển dụng nhắn cho Ứng viên (Recruiter -> Candidate)**: Có quyền chủ động mở phòng chat với bất cứ Ứng viên nào nằm trong danh sách ứng tuyển hoặc thuộc kho dữ liệu hồ sơ (Candidate Pool) mà công ty có quyền tiếp cận.
- **Quyền tham gia phòng chat (Authorization check)**: Mỗi tin nhắn gửi đi hoặc yêu cầu kết nối phòng chat đều được xác thực quyền tham gia của User (phòng của Candidate nào và Company nào).

---

## 2. Thiết kế Cơ sở dữ liệu nâng cấp (Database Schema)

Dưới đây là schema Prisma được tối ưu hóa: lược bỏ các unique constraint dư thừa, giới hạn độ dài tin nhắn tránh spam phình to dung lượng ổ đĩa, thiết lập ràng buộc ngoại constraint đầy đủ, hỗ trợ nhiều recruiter chung công ty, đính kèm file, trạng thái tin nhắn chi tiết, và cơ chế Block/Report:

```prisma
// Trạng thái thành viên trong phòng chat
enum ChatParticipantType {
  CANDIDATE
  RECRUITER
}

// Trạng thái truyền tải của tin nhắn
enum MessageStatus {
  SENT       // Đã gửi lên server thành công
  DELIVERED  // Đã phân phối tới thiết bị người nhận
  READ       // Người nhận đã đọc
}

// Phòng chat giữa Candidate và Company gắn liền với một Hồ sơ ứng tuyển
model ChatRoom {
  id            String             @id @default(uuid()) @db.Uuid
  applicationId String             @unique @map("application_id") @db.Uuid
  candidateId   String             @map("candidate_id") @db.Uuid
  companyId     String             @map("company_id") @db.Uuid
  createdAt     DateTime           @default(now()) @map("created_at")
  updatedAt     DateTime           @updatedAt @map("updated_at")

  // Quan hệ liên kết
  application   Application        @relation(fields: [applicationId], references: [id], onDelete: Cascade)
  candidate     Candidate          @relation(fields: [candidateId], references: [id], onDelete: Cascade)
  company       Company            @relation(fields: [companyId], references: [id], onDelete: Cascade)
  messages      ChatMessage[]
  readReceipts  ChatReadReceipt[]

  @@map("chat_rooms")
}

// Tin nhắn trong phòng chat
model ChatMessage {
  id             String              @id @default(uuid()) @db.Uuid
  roomId         String              @map("room_id") @db.Uuid
  senderId       String              @map("sender_id") @db.Uuid // ID của Candidate hoặc Recruiter
  senderType     ChatParticipantType @map("sender_type")
  content        String              @db.VarChar(4000) // Giới hạn 4000 kí tự chống tin nhắn vô hạn
  status         MessageStatus       @default(SENT)

  // Đính kèm file (CV, Portfolio, Hình ảnh)
  attachmentUrl  String?             @map("attachment_url") @db.VarChar(500)
  attachmentType String?             @map("attachment_type") @db.VarChar(50)

  createdAt      DateTime            @default(now()) @map("created_at")

  // Quan hệ liên kết
  room           ChatRoom            @relation(fields: [roomId], references: [id], onDelete: Cascade)
  readReceipts   ChatReadReceipt[]

  @@index([roomId])
  @@index([senderId])
  @@map("chat_messages")
}

// Chứng thực đã đọc (Dành cho Company có nhiều Recruiter truy cập chung phòng chat)
model ChatReadReceipt {
  id        String   @id @default(uuid()) @db.Uuid
  roomId    String   @map("room_id") @db.Uuid
  userId    String   @map("user_id") @db.Uuid // ID của Recruiter hoặc Candidate cụ thể
  messageId String   @map("message_id") @db.Uuid
  readAt    DateTime @default(now()) @map("read_at")

  // Quan hệ liên kết
  room      ChatRoom    @relation(fields: [roomId], references: [id], onDelete: Cascade)
  message   ChatMessage @relation(fields: [messageId], references: [id], onDelete: Cascade)

  @@unique([userId, messageId])
  @@index([messageId])
  @@map("chat_read_receipts")
}

// Cơ chế Block/Report để bảo đảm an toàn hệ thống
model ChatBlock {
  id           String   @id @default(uuid()) @db.Uuid
  blockedById  String   @map("blocked_by_id") @db.Uuid // Người thực hiện block
  blockedId    String   @map("blocked_id") @db.Uuid    // Đối tượng bị block
  reason       String?  @db.Text
  createdAt    DateTime @default(now()) @map("created_at")

  @@unique([blockedById, blockedId])
  @@index([blockedId])
  @@map("chat_blocks")
}
```

---

## 3. Kiến trúc Backend Gateway (Sửa lỗi logic & Bảo mật hóa)

Dưới đây là phần code `ChatGateway` hoàn chỉnh của NestJS đã sửa lỗi **Typing Room Bug**, thêm **Authorization Check**, áp dụng `@UseGuards(WsJwtAuthGuard)`, tích hợp Redis Adapter và Rate Limiting.

### 3.1. DTOs Validations

Tạo file `src/modules/chat/dto/chat-events.dto.ts` để kiểm soát cấu trúc và độ dài payload runtime:

```typescript
import {
  IsString,
  IsUUID,
  IsOptional,
  IsUrl,
  MaxLength,
  IsArray,
  IsBoolean,
} from "class-validator";

export class SendMessageDto {
  @IsString()
  tempId: string;

  @IsUUID()
  roomId: string;

  @IsString()
  @MaxLength(4000)
  content: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  attachmentUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  attachmentType?: string;
}

@IsUUID()
export class JoinRoomDto {
  @IsUUID()
  roomId: string;
}

export class MarkAsReadDto {
  @IsUUID()
  roomId: string;

  @IsArray()
  @IsUUID("4", { each: true })
  messageIds: string[];
}

export class TypingDto {
  @IsUUID()
  roomId: string;

  @IsBoolean()
  isTyping: boolean;
}
```

### 3.2. Chat Gateway

Tạo file `chat.gateway.ts` với đầy đủ các handlers xác thực, quyền hạn và gán nhãn:

```typescript
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { UseGuards, UseFilters, UsePipes, ValidationPipe } from "@nestjs/common";
import { WsJwtAuthGuard } from "./guards/ws-jwt.guard";
import { WsExceptionFilter } from "./filters/ws-exception.filter";
import { ChatService } from "./chat.service";
import { WsRateLimitGuard } from "./guards/ws-rate-limit.guard";
import { SendMessageDto, JoinRoomDto, MarkAsReadDto, TypingDto } from "./dto/chat-events.dto";

@WebSocketGateway({
  namespace: "chat",
  cors: {
    origin:
      process.env.NODE_ENV === "production"
        ? ["https://upnext.works", "https://recruiter.upnext.works"]
        : "*",
    credentials: true,
  },
})
@UseGuards(WsJwtAuthGuard, WsRateLimitGuard)
@UseFilters(new WsExceptionFilter())
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly chatService: ChatService) {}

  // 1. Xác thực handshake ban đầu
  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.headers.authorization?.split(" ")[1] ||
        (client.handshake.query.token as string);

      if (!token) {
        client.disconnect(true);
        return;
      }

      const user = await this.chatService.authenticateToken(token);
      client.data.user = user;

      // Join phòng cá nhân của user để phục vụ push notifications realtime ngoài phòng chat
      client.join(`user_${user.id}`);
      console.log(`Socket connected: ${client.id} (User: ${user.id})`);
    } catch (err) {
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Socket disconnected: ${client.id}`);
  }

  // 2. Event Join/Leave Room có kiểm soát quyền truy cập
  @SubscribeMessage("join_room")
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async handleJoinRoom(@ConnectedSocket() client: Socket, @MessageBody() payload: JoinRoomDto) {
    const user = client.data.user;

    // KIỂM TRA QUYỀN TRUY CẬP (Authorization Check)
    const hasAccess = await this.chatService.verifyRoomAccess(payload.roomId, user.id, user.type);
    if (!hasAccess) {
      client.emit("error", { message: "Forbidden: Bạn không có quyền tham gia phòng này." });
      return;
    }

    client.join(payload.roomId);
    console.log(`User ${user.id} joined room ${payload.roomId}`);
  }

  @SubscribeMessage("leave_room")
  @UsePipes(new ValidationPipe({ whitelist: true }))
  handleLeaveRoom(@ConnectedSocket() client: Socket, @MessageBody() payload: JoinRoomDto) {
    client.leave(payload.roomId);
    console.log(`User ${client.data.user.id} left room ${payload.roomId}`);
  }

  // 3. Xử lý gửi tin nhắn có bảo mật và Ack phản hồi
  @SubscribeMessage("send_message")
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SendMessageDto,
  ) {
    const sender = client.data.user;

    // KIỂM TRA QUYỀN TRUY CẬP (Authorization Check)
    const hasAccess = await this.chatService.verifyRoomAccess(
      payload.roomId,
      sender.id,
      sender.type,
    );
    if (!hasAccess) {
      client.emit("error", { message: "Forbidden: Bạn không thuộc phòng chat này." });
      return;
    }

    // Kiểm tra Block
    const isBlocked = await this.chatService.checkBlockStatus(payload.roomId, sender.id);
    if (isBlocked) {
      client.emit("error", { message: "Không thể gửi tin nhắn do đối phương đã chặn bạn." });
      return;
    }

    try {
      // Lưu tin nhắn vào cơ sở dữ liệu
      const savedMessage = await this.chatService.saveMessage({
        roomId: payload.roomId,
        senderId: sender.id,
        senderType: sender.type,
        content: payload.content,
        attachmentUrl: payload.attachmentUrl,
        attachmentType: payload.attachmentType,
      });

      // Gửi phản hồi ACK thành công lại cho người gửi để reconcile trạng thái Optimistic UI
      client.emit("message_ack", { tempId: payload.tempId, message: savedMessage });

      // Phát realtime đến tất cả client đang trong phòng chat (roomId room)
      this.server.to(payload.roomId).emit("new_message", savedMessage);
    } catch (error) {
      client.emit("message_failed", { tempId: payload.tempId, error: "Không thể lưu tin nhắn." });
    }
  }

  // 4. ĐỒNG BỘ ĐÃ ĐỌC (IMPLEMENTED)
  @SubscribeMessage("mark_as_read")
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async handleMarkAsRead(@ConnectedSocket() client: Socket, @MessageBody() payload: MarkAsReadDto) {
    const user = client.data.user;

    // KIỂM TRA QUYỀN TRUY CẬP (Authorization Check)
    const hasAccess = await this.chatService.verifyRoomAccess(payload.roomId, user.id, user.type);
    if (!hasAccess) {
      client.emit("error", { message: "Forbidden: Bạn không có quyền truy cập." });
      return;
    }

    try {
      // Ghi nhận trạng thái đã đọc vào CSDL
      await this.chatService.markMessagesAsRead(payload.roomId, user.id, payload.messageIds);

      // Phát sự kiện broadcast thông báo trạng thái cập nhật
      this.server.to(payload.roomId).emit("messages_read", {
        roomId: payload.roomId,
        userId: user.id,
        messageIds: payload.messageIds,
        readAt: new Date().toISOString(),
      });
    } catch (error) {
      client.emit("error", { message: "Lỗi đồng bộ trạng thái đã đọc." });
    }
  }

  // 5. Đồng bộ hóa đang gõ chữ (Typing Indicator) - Có kiểm soát bảo mật
  @SubscribeMessage("typing")
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async handleTyping(@ConnectedSocket() client: Socket, @MessageBody() payload: TypingDto) {
    const sender = client.data.user;

    // KIỂM TRA QUYỀN TRUY CẬP (Authorization Check)
    const hasAccess = await this.chatService.verifyRoomAccess(
      payload.roomId,
      sender.id,
      sender.type,
    );
    if (!hasAccess) return;

    // Broadcast tin nhắn tới tất cả mọi người trong phòng chat (ngoại trừ chính client gửi)
    client.broadcast.to(payload.roomId).emit("user_typing", {
      roomId: payload.roomId,
      userId: sender.id,
      isTyping: payload.isTyping,
    });
  }
}
```

### 3.3. Cấu hình Redis Adapter (Production Code)

Để phục vụ việc scale ngang backend qua nhiều instance/pod, ta kế thừa và hiện thực hóa Adapter Class như sau:

```typescript
import { IoAdapter } from "@nestjs/platform-socket.io";
import { ServerOptions } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { Redis } from "ioredis";

export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor: ReturnType<typeof createAdapter>;

  async connectToRedis(): Promise<void> {
    const pubClient = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
      maxRetriesPerRequest: null,
    });
    const subClient = pubClient.duplicate();

    // Đợi kết nối Redis sẵn sàng trước khi cấu hình adapter
    await Promise.all([
      new Promise((resolve) => pubClient.once("ready", resolve)),
      new Promise((resolve) => subClient.once("ready", resolve)),
    ]);

    this.adapterConstructor = createAdapter(pubClient, subClient);
  }

  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, options);
    server.adapter(this.adapterConstructor);
    return server;
  }
}
```

---

## 4. Kiến trúc Frontend Store (Zustand) & Giải quyết Mâu thuẫn Đồng bộ

### 4.1. Zustand Chat Store với Optimistic UI & Reconnect State & Cleanup

Tạo store tại `src/features/messages/store/use-chat-store.ts`:

```typescript
import { create } from "zustand";
import { io, Socket } from "socket.io-client";

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderType: "CANDIDATE" | "RECRUITER";
  content: string;
  attachmentUrl?: string | null;
  attachmentType?: string | null;
  status: "sending" | "failed" | "SENT" | "DELIVERED" | "READ";
  createdAt: string;
}

interface ChatState {
  socket: Socket | null;
  connectionStatus: "connected" | "reconnecting" | "disconnected";
  activeRoomId: string | null;
  typingUsers: Record<string, boolean>; // userId -> isTyping
  realtimeMessages: Record<string, ChatMessage[]>; // roomId -> messages[]
  lastError: string | null;

  connect: (token: string) => void;
  disconnect: () => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  sendRealtimeMessage: (content: string, attachmentUrl?: string, attachmentType?: string) => void;
  markAsRead: (messageIds: string[]) => void;
  clearError: () => void;
}

let typingTimeout: NodeJS.Timeout;

export const useChatStore = create<ChatState>((set, get) => ({
  socket: null,
  connectionStatus: "disconnected",
  activeRoomId: null,
  typingUsers: {},
  realtimeMessages: {},
  lastError: null,

  connect: (token: string) => {
    if (get().socket?.connected) return;

    set({ connectionStatus: "reconnecting" });

    const socket = io(`${process.env.NEXT_PUBLIC_API_URL}/chat`, {
      auth: { token },
      transports: ["websocket"],
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socket.on("connect", () => {
      set({ connectionStatus: "connected", lastError: null });
      const currentRoom = get().activeRoomId;
      if (currentRoom) {
        socket.emit("join_room", { roomId: currentRoom });
      }
    });

    socket.on("disconnect", () => {
      set({ connectionStatus: "disconnected" });
    });

    socket.on("connect_error", () => {
      set({ connectionStatus: "reconnecting" });
    });

    // Lắng nghe lỗi nghiệp vụ/bảo mật từ Gateway
    socket.on("error", (err: { message: string }) => {
      set({ lastError: err.message });
    });

    // Lắng nghe nhận tin nhắn realtime mới & Deduplication
    socket.on("new_message", (message: ChatMessage) => {
      set((state) => {
        const roomMessages = state.realtimeMessages[message.roomId] || [];

        // Deduplicate: Lọc trùng theo cả ID thực và TempID
        const isDuplicate = roomMessages.some(
          (m) => m.id === message.id || (m.id.startsWith("temp_") && m.content === message.content),
        );
        if (isDuplicate) return state;

        return {
          realtimeMessages: {
            ...state.realtimeMessages,
            [message.roomId]: [...roomMessages, { ...message, status: "SENT" }],
          },
        };
      });
    });

    // Nhận sự kiện có thiết bị đang gõ chữ
    socket.on("user_typing", (payload: { roomId: string; userId: string; isTyping: boolean }) => {
      if (payload.roomId === get().activeRoomId) {
        set((state) => ({
          typingUsers: {
            ...state.typingUsers,
            [payload.userId]: payload.isTyping,
          },
        }));

        // Tránh treo trạng thái typing nếu thiết bị kia mất mạng
        if (payload.isTyping) {
          clearTimeout(typingTimeout);
          typingTimeout = setTimeout(() => {
            set((state) => ({
              typingUsers: { ...state.typingUsers, [payload.userId]: false },
            }));
          }, 5000);
        }
      }
    });

    // Lắng nghe trạng thái cập nhật đã đọc
    socket.on(
      "messages_read",
      (payload: { roomId: string; userId: string; messageIds: string[]; readAt: string }) => {
        set((state) => {
          const roomMessages = state.realtimeMessages[payload.roomId] || [];
          const updated = roomMessages.map((m) =>
            payload.messageIds.includes(m.id) ? { ...m, status: "READ" as const } : m,
          );
          return {
            realtimeMessages: { ...state.realtimeMessages, [payload.roomId]: updated },
          };
        });
      },
    );

    // Phản hồi ACK tin nhắn lưu DB thành công
    socket.on("message_ack", (payload: { tempId: string; message: ChatMessage }) => {
      const { roomId } = payload.message;
      set((state) => {
        const roomMessages = state.realtimeMessages[roomId] || [];
        const updated = roomMessages.map((m) =>
          m.id === payload.tempId ? { ...payload.message, status: "SENT" } : m,
        );
        return {
          realtimeMessages: { ...state.realtimeMessages, [roomId]: updated },
        };
      });
    });

    // Báo lỗi tin nhắn gửi thất bại
    socket.on("message_failed", (payload: { tempId: string; error: string }) => {
      set((state) => {
        const allRooms = { ...state.realtimeMessages };
        for (const rId in allRooms) {
          allRooms[rId] = allRooms[rId].map((m) =>
            m.id === payload.tempId ? { ...m, status: "failed" as const } : m,
          );
        }
        return { realtimeMessages: allRooms, lastError: payload.error };
      });
    });

    set({ socket });
  },

  disconnect: () => {
    get().socket?.disconnect();
    set({ socket: null, connectionStatus: "disconnected" });
  },

  joinRoom: (roomId: string) => {
    const { socket, activeRoomId } = get();
    if (activeRoomId) {
      get().leaveRoom(activeRoomId);
    }

    set({ activeRoomId: roomId, typingUsers: {} });
    if (socket) {
      socket.emit("join_room", { roomId });
    }
  },

  // Giải quyết rò rỉ bộ nhớ: Xoá buffer phòng cũ khi rời đi
  leaveRoom: (roomId: string) => {
    const { socket } = get();
    if (socket) {
      socket.emit("leave_room", { roomId });
    }
    set((state) => {
      const updatedMessages = { ...state.realtimeMessages };
      delete updatedMessages[roomId]; // Clean up memory
      return {
        activeRoomId: null,
        realtimeMessages: updatedMessages,
        typingUsers: {},
      };
    });
  },

  // Gửi tin nhắn Optimistic UI
  sendRealtimeMessage: (content: string, attachmentUrl?: string, attachmentType?: string) => {
    const { socket, activeRoomId } = get();
    if (!socket || !activeRoomId) return;

    const tempId = `temp_${Date.now()}`;
    const optimisticMessage: ChatMessage = {
      id: tempId,
      roomId: activeRoomId,
      senderId: "ME",
      senderType: "CANDIDATE",
      content,
      attachmentUrl,
      attachmentType,
      status: "sending",
      createdAt: new Date().toISOString(),
    };

    set((state) => {
      const roomMsgs = state.realtimeMessages[activeRoomId] || [];
      return {
        realtimeMessages: {
          ...state.realtimeMessages,
          [activeRoomId]: [...roomMsgs, optimisticMessage],
        },
      };
    });

    socket.emit("send_message", {
      tempId,
      roomId: activeRoomId,
      content,
      attachmentUrl,
      attachmentType,
    });
  },

  markAsRead: (messageIds: string[]) => {
    const { socket, activeRoomId } = get();
    if (socket && activeRoomId && messageIds.length > 0) {
      socket.emit("mark_as_read", { roomId: activeRoomId, messageIds });
    }
  },

  clearError: () => set({ lastError: null }),
}));
```
