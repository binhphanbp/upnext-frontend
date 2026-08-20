/**
 * Khóa idempotency cho các lời gọi AI tốn phí, ổn định theo *ý định* của người dùng.
 *
 * Backend nhận `clientRequestId` và dùng nó để không trừ lượt hai lần cũng như không
 * gọi model hai lần. Nhưng khóa chỉ có tác dụng nếu nó **ổn định qua các lần thử lại
 * của cùng một ý định**: sinh UUID mới ngay trong hàm gọi API thì y hệt như để server
 * tự sinh, tức không bảo vệ được gì.
 *
 * Nên khóa được neo theo nội dung đầu vào:
 *
 * - Bấm hai lần cùng một form → cùng chữ ký → cùng khóa → lần thứ hai không tốn tiền.
 * - Thử lại sau khi lỗi → vẫn cùng khóa → backend biết đây là cùng một thao tác.
 * - **Sau khi thành công thì nhả khóa** — xem `releaseRequestKey`. Đây là chỗ dễ sai
 *   nhất: nếu giữ khóa, người dùng bấm "tạo lại" với cùng đầu vào sẽ nhận đúng bản
 *   nháp cũ từ cache và tưởng tính năng bị hỏng. Tạo lại để lấy một bản khác là nhu
 *   cầu thật của người dùng AI, không phải một lần bấm nhầm cần chống.
 */
const keysBySignature = new Map<string, string>();

/**
 * Giữ Map nhỏ. Một recruiter chỉ có vài ý định đang mở cùng lúc; số này chỉ để một
 * tab sống lâu không tích lũy khóa vô hạn.
 */
const MAX_TRACKED_KEYS = 20;

function newKey(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

/** Khóa cho ý định này, tạo mới nếu chưa có. */
export function stableRequestKey(signature: string): string {
  const existing = keysBySignature.get(signature);
  if (existing) return existing;

  if (keysBySignature.size >= MAX_TRACKED_KEYS) {
    const oldest = keysBySignature.keys().next();
    if (!oldest.done) keysBySignature.delete(oldest.value);
  }

  const key = newKey();
  keysBySignature.set(signature, key);
  return key;
}

/**
 * Nhả khóa sau khi thao tác đã thành công, để lần bấm sau với cùng đầu vào được coi
 * là một ý định mới và thực sự gọi lại model.
 */
export function releaseRequestKey(signature: string): void {
  keysBySignature.delete(signature);
}

/** Chữ ký cho một payload JSON. Cùng đầu vào thì cùng chữ ký. */
export function payloadSignature(scope: string, payload: unknown): string {
  return `${scope}:${JSON.stringify(payload)}`;
}

/**
 * Chữ ký cho một file. Không đọc nội dung file -- tên, cỡ và thời điểm sửa là đủ để
 * phân biệt hai lần chọn file khác nhau, và đọc cả file chỉ để tính chữ ký thì đắt
 * hơn chính lời gọi ta đang muốn tiết kiệm.
 */
export function fileSignature(scope: string, file: File): string {
  return `${scope}:${file.name}:${file.size}:${file.lastModified}`;
}

/** Chỉ dùng trong test. */
export function resetRequestKeys(): void {
  keysBySignature.clear();
}
