import { setRequestLocale } from "next-intl/server";

import { MarketingHomePage } from "@/features/public/home";

type HomePageProps = Readonly<{
  params: Promise<{
    locale: string;
  }>;
}>;

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;

  setRequestLocale(locale);

  return <MarketingHomePage />;
}
