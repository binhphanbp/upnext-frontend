import { PostDetailContent } from "@/features/posts/components/post-detail-content";

type PostDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({ params }: PostDetailPageProps) {
  const { slug } = await params;
  return {
    title: `${slug.replace(/-/gu, " ")} - UpNext Blog`,
    description: `Đọc chi tiết bài viết ${slug} trên UpNext IT Recruitment Platform.`,
  };
}

export default async function PostDetailPage({ params }: PostDetailPageProps) {
  const { slug } = await params;
  return <PostDetailContent slug={slug} />;
}
