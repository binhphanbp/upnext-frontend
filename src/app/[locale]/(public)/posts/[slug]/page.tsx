import type { Metadata } from "next";

import { PostDetailContent } from "@/features/posts/components/post-detail-content";
import { getPostLocale, postCopy } from "@/features/posts/post-localization";

type PostDetailPageProps = {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
};

export async function generateMetadata({ params }: PostDetailPageProps): Promise<Metadata> {
  const { locale: requestedLocale } = await params;
  const metadata = postCopy[getPostLocale(requestedLocale)].metadata;

  return {
    title: metadata.detailTitle,
    description: metadata.detailDescription,
  };
}

export default async function PostDetailPage({ params }: PostDetailPageProps) {
  const { slug } = await params;
  return <PostDetailContent slug={slug} />;
}
