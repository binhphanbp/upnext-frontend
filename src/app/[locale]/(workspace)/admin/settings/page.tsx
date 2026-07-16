import { getTranslations } from "next-intl/server";

import { AdminSettingsPage } from "@/features/admin/components/settings/admin-settings-page";

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: "Admin" });
  return {
    title: t("settings.title", { fallback: "Cài đặt tài khoản" }),
  };
}

export default function Page() {
  return <AdminSettingsPage />;
}
