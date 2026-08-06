import type { Metadata } from "next";
import { Suspense } from "react";

import { PostsPageContent } from "@/features/posts/components/posts-page-content";
import { getPostLocale, postCopy } from "@/features/posts/post-localization";

type PostsPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export async function generateMetadata({ params }: PostsPageProps): Promise<Metadata> {
  const { locale: requestedLocale } = await params;
  const metadata = postCopy[getPostLocale(requestedLocale)].metadata;

  return {
    title: metadata.listTitle,
    description: metadata.listDescription,
  };
}

export default function PostsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f8fafc]" />}>
      <PostsPageContent />
    </Suspense>
  );
}
