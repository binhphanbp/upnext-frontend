# Nối thật tab "Thông báo" (Recruiter Settings) + thay SMS bằng Zalo bot

> Trạng thái: **CHƯA LÀM** — kế hoạch được chốt ngày 2026-07-24, lưu lại để implement sau.

## Context

Tab "Thông báo" trong `recruiter-settings-page.tsx` hiện là giao diện mẫu 100%: 10 state
cục bộ không load/lưu gì cả, nút "Lưu" chỉ hiện toast giả (`Swal.fire` không gọi API). Đối
chiếu với backend cho thấy: một số loại thông báo (ứng tuyển mới, nhắc lịch phỏng vấn, đổi/huỷ
lịch phỏng vấn) **đã thực sự được tạo và gửi** qua `NotificationsService`/`EmailService`/
`ZaloBotService`, nhưng không hề có khái niệm "preference" nào ở backend để tắt/bật theo ý
người dùng. Một số mục khác (AI Daily Matcher tự động, Weekly Digest, Cảnh báo bảo mật IP lạ)
hoàn toàn không tồn tại ở backend — mô tả trên UI (vd "mỗi 8:00 sáng") là bịa.

Riêng kênh "SMS quan trọng": hạ tầng Zalo bot đã có sẵn gần như đầy đủ ở backend
(`RecruiterAccount.zaloChatId`/`zaloLinkCode`, `ZaloBotController`: `GET /zalo-bot/status`,
`POST /zalo-bot/link-code`, `DELETE /zalo-bot/link`, webhook nhận link code, và
`ZaloBotService.sendMessage()` đã chạy thật cho nhắc lịch phỏng vấn) nhưng **frontend chưa có
bất kỳ UI nào** dùng tới — cần xây UI liên kết Zalo và thay thế card SMS bằng nó.

**Đã chốt với user:**

- 3 mục không có backend thật (AI Matcher, Weekly Digest, Security Alert): giữ UI nhưng khoá
  toggle (disabled) + badge "Sắp ra mắt", bỏ các chi tiết mô tả bịa đặt. Không xây backend cho
  3 mục này ở lần này.
- Badge "Email + Web" của "Ứng tuyển mới": sửa lại thành "Web" cho đúng thực tế (không xây thêm
  template email mới cho sự kiện này).
- "SMS quan trọng" → thay bằng "Nhắc qua Zalo", dùng nguyên hạ tầng Zalo bot đã có.

## Data model (`prisma/schema.prisma`, repo `upnext-backend`)

Model mới `RecruiterNotificationPreference`, 1-1 với `RecruiterAccount`, khởi tạo kiểu
lazy-upsert-on-first-access (giống pattern `ensureOwnerRole` trong `companies.service.ts`) —
không cần migration backfill hay sửa hook đăng ký:

```prisma
model RecruiterNotificationPreference {
  id                     String   @id @default(uuid()) @db.Uuid
  recruiterAccountId     String   @unique @map("recruiter_account_id") @db.Uuid
  notifyNewApplication   Boolean  @default(true) @map("notify_new_application")
  notifyInterviewReminder Boolean @default(true) @map("notify_interview_reminder")
  notifyInterviewUpdates Boolean  @default(true) @map("notify_interview_updates")
  channelPush            Boolean  @default(true) @map("channel_push")
  channelEmail           Boolean  @default(true) @map("channel_email")
  channelZalo            Boolean  @default(true) @map("channel_zalo")
  quietHoursEnabled      Boolean  @default(false) @map("quiet_hours_enabled")
  createdAt              DateTime @default(now()) @map("created_at")
  updatedAt              DateTime @updatedAt @map("updated_at")

  recruiterAccount RecruiterAccount @relation(fields: [recruiterAccountId], references: [id], onDelete: Cascade)

  @@map("recruiter_notification_preferences")
}
```

Thêm quan hệ ngược `notificationPreference RecruiterNotificationPreference?` vào
`RecruiterAccount`. Phạm vi chỉ cho recruiter (không làm cho candidate lần này).

## Backend changes

**1. `notifications` module — thêm preferences (mở rộng, không tạo module mới)**

- `NotificationPreferencesService` (file mới cùng thư mục `notifications/`):
  `getOrCreate(recruiterAccountId)` (lazy upsert, trả default nếu chưa có row),
  `update(recruiterAccountId, dto)`.
- Thêm 2 route vào `NotificationsController` hiện có: `GET /notifications/preferences`,
  `PATCH /notifications/preferences` (Roles RECRUITER, theo đúng pattern guard đang dùng).
- DTO `UpdateNotificationPreferencesDto` (7 field boolean optional).

**2. Trung tâm gate — mở rộng `NotificationsService.createNotification()`**
(`src/modules/notifications/notifications.service.ts:17`)

- Thêm param optional `category?: 'NEW_APPLICATION' | 'INTERVIEW_UPDATE'` vào params.
- Khi có `category` và `recipientType === RECRUITER`: lazy-load preference qua
  `NotificationPreferencesService.getOrCreate`. Nếu toggle tương ứng = false →
  **return sớm, không tạo Notification row** (tắt loại thông báo nghĩa là tắt hẳn, kể cả in-app).
- Khi tạo Notification row thành công: chỉ gọi `fcmService.sendNotificationToUser` (push) nếu
  `channelPush = true`; thêm nhánh mới gọi `zaloBotService.sendMessage` nếu `channelZalo = true`
  VÀ recruiter đã có `zaloChatId` VÀ không trong khung giờ yên tĩnh (nếu `quietHoursEnabled`).
  Cần inject `ZaloBotService` vào `NotificationsService` (thêm `ZaloBotModule` vào imports của
  `NotificationsModule`, hoặc export `ZaloBotService` — kiểm tra tránh import vòng vì
  `interview-reminders.module.ts` đã import cả hai).
- Thêm helper `isWithinQuietHours(date: Date): boolean` (giờ VN, 19:00-07:30 hằng ngày + trọn
  Thứ 7/CN, khớp mô tả UI hiện tại) trong `notification-preferences.util.ts` — chỉ áp dụng cho
  push/zalo, không áp dụng cho in-app hay email.

**3. Gate 3 điểm gọi cụ thể**

- `applications.service.ts` (payload outbox, dòng tạo application mới): thêm
  `category: 'NEW_APPLICATION'` vào payload; `NotificationPayload` type + xử lý trong
  `outbox-processor.service.ts` truyền tiếp field này vào `createNotification`.
- `interviews.service.ts` (2 chỗ: reschedule + cancel): thêm `category: 'INTERVIEW_UPDATE'`
  vào lời gọi `createNotification` cho recipient RECRUITER (giữ nguyên cho CANDIDATE).
- `interview-reminders.service.ts` (`sendReminderFor`): trước khi build mảng
  `Promise.allSettled`, load preference qua `NotificationPreferencesService.getOrCreate` cho
  `recruiterAccount.id`. Nếu `notifyInterviewReminder = false` → bỏ hẳn 3 phần tử liên quan tới
  recruiter (notification/email/zalo) khỏi mảng, giữ nguyên phần candidate. Nếu bật nhưng
  `channelEmail = false` → bỏ riêng email-recruiter; nếu `channelZalo = false` hoặc đang trong
  khung giờ yên tĩnh → bỏ riêng zalo-recruiter. (`createNotification` recruiter entry tự gate
  qua mục 2 nên không cần sửa thêm ở đây.)
- `job-posts.service.ts` (approved/rejected): **không gate** — coi là thông báo hệ thống/kết quả
  kiểm duyệt bắt buộc, giữ nguyên hành vi hiện tại.
- Các notification khác qua outbox (support-cases, talent-outreach): **không gate** lần này —
  ngoài phạm vi 3 category đang có trên UI.

## Frontend changes (repo `upnext-frontend`)

**1. API clients mới**

- `src/features/recruiter/api/notification-preferences.ts`: type
  `NotificationPreferences` (7 field), `getNotificationPreferences(token)`,
  `updateNotificationPreferences(token, patch)`.
- `src/features/recruiter/api/zalo-bot.ts`: `getZaloStatus(token)` (`{enabled, linked}`),
  `createZaloLinkCode(token)` (`{code}`), `unlinkZalo(token)`.

**2. `recruiter-settings-page.tsx` — Tab Notification**

- Thay 9 `useState` boolean hiện tại bằng 1 `useQuery` load `getNotificationPreferences` khi
  vào tab (hoặc khi mount), hydrate state từ response; giữ state cục bộ để user chỉnh trước khi
  bấm Lưu (không auto-save từng toggle, giữ đúng UX hiện tại là bấm nút Lưu).
- `useQuery` riêng `getZaloStatus`, `refetchInterval` ngắn (3s) chỉ khi đang mở flow liên kết.
- Nút "Lưu thiết lập thông báo": đổi thành `useMutation` gọi `updateNotificationPreferences`,
  Swal hiện theo kết quả thật (success/error), không còn hiện cứng.
- Card "Tin nhắn SMS quan trọng" (dòng ~869-881) thay bằng card Zalo:
  - Chưa liên kết: nút "Kết nối Zalo" → `createZaloLinkCode` → hiện mã 6 ký tự + hướng dẫn gửi
    mã cho Bot UpNext trên Zalo, tự poll `getZaloStatus` tới khi `linked=true` rồi đóng.
  - Đã liên kết: hiện "Đã kết nối" + `ToggleSwitch` cho `channelZalo` + nút "Huỷ liên kết" gọi
    `unlinkZalo`.
- 3 card fictional (Đề xuất AI, Weekly Digest, Cảnh báo bảo mật): thêm badge "Sắp ra mắt",
  `ToggleSwitch` truyền `disabled` (component đã hỗ trợ sẵn, xem
  `recruiter-settings-page.tsx:145-150`), sửa lại mô tả bỏ chi tiết bịa ("mỗi 8:00 sáng",
  "IP lạ"...) bằng câu trung thực kiểu "Tính năng đang được phát triển".
- Sửa badge "Ứng tuyển mới": "Email + Web" → "Web".
- Sửa mô tả "Nhắc lịch phỏng vấn trước 30 phút" → không cam kết con số cứng (thực tế cửa sổ
  nhắc là 60 phút, xem `interview-reminders.service.ts:9`), đổi thành "trước giờ hẹn phỏng vấn".
- 2 nút "Bật tất cả"/"Tắt tất cả" ở banner: bỏ 3 toggle fictional ra khỏi danh sách set (vì đã
  disable, không nên nằm trong bulk actions).

## Ngoài phạm vi (không làm lần này)

- Không xây AI Daily Matcher cron, Weekly Digest cron/email, phát hiện đăng nhập IP lạ.
- Không thêm preference cho candidate.
- Không gate notification của support-cases/talent-outreach.
- Không đổi cơ chế nhắc lịch phỏng vấn cửa sổ 60 phút thành 30 phút (chỉ sửa copy cho khớp).

## Verification

1. Backend: migrate dev, `tsc --noEmit`, chạy lại test suite hiện có (đặc biệt
   `interview-reminders`, `applications`, `interviews` nếu có spec).
2. Gọi `GET /notifications/preferences` lần đầu cho 1 recruiter mới → xác nhận tự tạo row mặc
   định tất cả `true`/`quietHoursEnabled=false`.
3. Tắt `notifyNewApplication` → tạo application mới cho job của recruiter đó → xác nhận KHÔNG
   có `Notification` row mới nào được tạo (kiểm tra DB trực tiếp).
4. Bật lại, tắt `channelPush` → lặp lại → xác nhận có `Notification` row nhưng không gọi FCM
   (kiểm tra log "FCM push skipped" hoặc mock service trong test).
5. Liên kết Zalo qua UI thật (cần bot token cấu hình ở dev), xác nhận `zaloChatId` được set;
   tắt `channelZalo` → trigger nhắc lịch phỏng vấn → xác nhận không có lời gọi
   `zaloBotService.sendMessage` cho recruiter đó (candidate vẫn nhận bình thường).
6. Frontend: `tsc --noEmit`, `oxlint`, mở tab Thông báo → xác nhận toggle hiển thị đúng giá trị
   đã lưu sau khi reload trang (không còn reset về mặc định).
