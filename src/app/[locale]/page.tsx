import { getTranslations, setRequestLocale } from "next-intl/server";

type HomePageProps = Readonly<{
  params: Promise<{
    locale: string;
  }>;
}>;

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;

  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "HomePage" });

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-16 text-zinc-50">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <p className="text-sm font-medium tracking-widest text-emerald-300 uppercase">
          {t("eyebrow")}
        </p>
        <h1 className="text-4xl font-semibold tracking-normal text-balance sm:text-5xl">
          {t("title")}
        </h1>
        <p className="max-w-2xl text-base leading-7 text-zinc-300">{t("description")}</p>
      </div>
    </main>
  );
}
