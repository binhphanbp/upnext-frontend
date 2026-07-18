import { setRequestLocale } from "next-intl/server";

import { ChatLayout } from "@/features/recruiter/components/chat/chat-layout";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function MessagesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ChatLayout />;
}
