import { setRequestLocale } from "next-intl/server";

import { CandidateChatLayout } from "@/features/candidate/components/chat/candidate-chat-layout";

type CandidateMessagesPageProps = Readonly<{
  params: Promise<{ locale: string }>;
}>;

export default async function CandidateMessagesPage({ params }: CandidateMessagesPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Tin nhắn</h1>
        <p className="mt-1 text-slate-500">Trao đổi trực tiếp với Nhà tuyển dụng.</p>
      </div>
      <CandidateChatLayout />
    </div>
  );
}
