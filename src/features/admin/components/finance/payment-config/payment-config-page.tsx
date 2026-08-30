"use client";

import { useTranslations } from "next-intl";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";

import { SepayConfigForm } from "./sepay-config-form";

/**
 * Single "Cấu hình thanh toán" page, tabbed by provider. Only SePay is wired
 * up today -- `PaymentMethod` already anticipates STRIPE/MOMO/PAYPAL, so a
 * future provider is a new tab + form here, not a new page.
 */
export function PaymentConfigPage() {
  const t = useTranslations("Admin.finance.paymentConfig");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{t("subtitle")}</p>
      </div>

      <Tabs defaultValue="sepay" className="w-full">
        <TabsList className="mb-2 grid w-full max-w-[240px] grid-cols-1">
          <TabsTrigger value="sepay">{t("tabs.sepay")}</TabsTrigger>
        </TabsList>

        <TabsContent value="sepay" className="mt-4 outline-none">
          <SepayConfigForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}
