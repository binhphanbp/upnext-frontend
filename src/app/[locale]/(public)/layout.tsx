import { BackToTop } from "@/shared/ui/back-to-top";

type PublicLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

/**
 * Áp dụng cho toàn bộ `(public)` (home, jobs, companies, posts, pricing) vì
 * component tự cuộn theo `window` — đúng cho mọi trang ở đây — và tự ẩn cho
 * tới khi cuộn quá 400px nên không thêm gì cho các trang ngắn.
 */
export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <>
      {children}
      <BackToTop />
    </>
  );
}
