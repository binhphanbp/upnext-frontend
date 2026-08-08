import { AiCopilotDrawer } from "@/features/ai-copilot";

type JobsLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

/**
 * Riêng cho `/jobs` và `/jobs/[slug]`, không phải toàn bộ `(public)` — trang
 * chủ, blog, bảng giá không có ngữ cảnh nào để Copilot dùng, mount ở đó chỉ
 * thêm nhiễu. `resolvePageContext` đã có sẵn pattern `/jobs/([^/]+)` từ trước
 * nhưng nút nổi trước đây chỉ mount trong `CandidateShell` (`/candidate/*`) —
 * nghĩa là tình huống giá trị nhất, "so sánh CV với đúng tin đang xem", không
 * thể thực hiện được khi duyệt tin theo đường bình thường. `AiCopilotDrawer`
 * tự ẩn khi chưa đăng nhập ứng viên nên không tốn gì với khách vãng lai hay
 * recruiter đang xem trang này.
 */
export default function PublicJobsLayout({ children }: JobsLayoutProps) {
  return (
    <>
      {children}
      <AiCopilotDrawer />
    </>
  );
}
