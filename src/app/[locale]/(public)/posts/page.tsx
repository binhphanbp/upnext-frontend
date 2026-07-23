import { Suspense } from "react";

import { PostsPageContent } from "@/features/posts/components/posts-page-content";

export const metadata = {
  title: "Blog & Bài Viết IT - UpNext Recruitment",
  description:
    "Cập nhật xu hướng công nghệ, cẩm nang phỏng vấn, dải lương IT và bài viết chuyên môn hàng đầu.",
};

export default function PostsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f8fafc]" />}>
      <PostsPageContent />
    </Suspense>
  );
}
