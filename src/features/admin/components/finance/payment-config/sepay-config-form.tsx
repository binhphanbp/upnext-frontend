"use client";

import { Copy, Eye, EyeSlash } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useEffect, useState, type FormEvent } from "react";
import Swal from "sweetalert2";

import {
  getAdminPaymentConfig,
  updateAdminPaymentConfig,
} from "@/features/admin/api/payment-config";
import { clearAdminSession, getAdminSession } from "@/features/admin/session";
import { useRouter } from "@/i18n/navigation";
import { ApiError } from "@/shared/api/http";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import { Input } from "@/shared/ui/input";
import { FormInput } from "@/shared/ui/input/form-input";
import { Label } from "@/shared/ui/label";
import { Skeleton } from "@/shared/ui/skeleton";

const toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
});

type FormState = {
  isEnabled: boolean;
  bankName: string;
  bankBin: string;
  accountNumber: string;
  accountName: string;
  webhookApiKey: string;
};

const emptyForm: FormState = {
  isEnabled: false,
  bankName: "",
  bankBin: "",
  accountNumber: "",
  accountName: "",
  webhookApiKey: "",
};

export function SepayConfigForm() {
  const t = useTranslations("Admin.finance.paymentConfig.sepay");
  const router = useRouter();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [showApiKey, setShowApiKey] = useState(false);

  const handleAuthError = (error: unknown): boolean => {
    if (error instanceof Error && error.message === "No session") {
      router.replace("/admin/login");
      return true;
    }
    if (error instanceof ApiError && error.status === 401) {
      clearAdminSession();
      router.replace("/admin/login");
      return true;
    }
    return false;
  };

  const { data: config, isLoading } = useQuery({
    queryKey: ["adminPaymentConfig", "SEPAY"],
    queryFn: async () => {
      const session = getAdminSession();
      if (!session) throw new Error("No session");
      return getAdminPaymentConfig("SEPAY", session.accessToken);
    },
  });

  // Re-seed the form whenever the loaded config changes -- never pre-fill
  // webhookApiKey, it stays blank ("keep current key") until the admin
  // deliberately types a new one.
  useEffect(() => {
    if (!config) return;
    setForm({
      isEnabled: config.isEnabled,
      bankName: config.bankName ?? "",
      bankBin: config.bankBin ?? "",
      accountNumber: config.accountNumber ?? "",
      accountName: config.accountName ?? "",
      webhookApiKey: "",
    });
  }, [config]);

  const { mutate: submit, isPending } = useMutation({
    mutationFn: async () => {
      const session = getAdminSession();
      if (!session) throw new Error("No session");
      return updateAdminPaymentConfig(
        "SEPAY",
        {
          isEnabled: form.isEnabled,
          bankName: form.bankName.trim(),
          bankBin: form.bankBin.trim(),
          accountNumber: form.accountNumber.trim(),
          accountName: form.accountName.trim(),
          webhookApiKey: form.webhookApiKey.trim() || undefined,
        },
        session.accessToken,
      );
    },
    onSuccess: () => {
      void toast.fire({ icon: "success", title: t("toasts.saveSuccess") });
      setForm((prev) => ({ ...prev, webhookApiKey: "" }));
      void queryClient.invalidateQueries({ queryKey: ["adminPaymentConfig", "SEPAY"] });
    },
    onError: (error: unknown) => {
      if (handleAuthError(error)) return;
      const message = error instanceof ApiError ? error.message : t("toasts.saveError");
      void toast.fire({ icon: "error", title: message });
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submit();
  };

  const handleCopyWebhookUrl = () => {
    if (!config?.webhookUrl) return;
    void navigator.clipboard.writeText(config.webhookUrl);
    void toast.fire({ icon: "success", title: t("toasts.copied") });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-2xl flex-col gap-6">
      <p className="text-muted-foreground text-sm">{t("description")}</p>

      <div className="flex items-center gap-2">
        <Checkbox
          id="sepayIsEnabled"
          checked={form.isEnabled}
          onCheckedChange={(checked) =>
            setForm((prev) => ({ ...prev, isEnabled: checked === true }))
          }
        />
        <Label htmlFor="sepayIsEnabled" className="cursor-pointer text-sm font-semibold">
          {t("fields.isEnabled")}
        </Label>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <FormInput
          label={t("fields.bankName")}
          placeholder={t("fields.bankNamePlaceholder")}
          value={form.bankName}
          onChange={(event) => setForm((prev) => ({ ...prev, bankName: event.target.value }))}
        />

        <FormInput
          label={t("fields.bankBin")}
          placeholder={t("fields.bankBinPlaceholder")}
          value={form.bankBin}
          onChange={(event) => setForm((prev) => ({ ...prev, bankBin: event.target.value }))}
        />

        <FormInput
          label={t("fields.accountNumber")}
          value={form.accountNumber}
          onChange={(event) => setForm((prev) => ({ ...prev, accountNumber: event.target.value }))}
        />

        <FormInput
          label={t("fields.accountName")}
          placeholder={t("fields.accountNamePlaceholder")}
          value={form.accountName}
          onChange={(event) => setForm((prev) => ({ ...prev, accountName: event.target.value }))}
        />
      </div>
      <p className="text-muted-foreground -mt-3 text-xs">{t("fields.bankBinHint")}</p>

      <div className="flex flex-col gap-1.5">
        <FormInput
          label={t("fields.webhookApiKey")}
          type={showApiKey ? "text" : "password"}
          placeholder={t("fields.webhookApiKeyPlaceholder")}
          value={form.webhookApiKey}
          onChange={(event) => setForm((prev) => ({ ...prev, webhookApiKey: event.target.value }))}
          suffix={
            <button
              type="button"
              onClick={() => setShowApiKey((prev) => !prev)}
              className="text-slate-400 hover:text-slate-600"
              aria-label={showApiKey ? "Hide" : "Show"}
            >
              {showApiKey ? <EyeSlash size={18} /> : <Eye size={18} />}
            </button>
          }
        />
        <p className="text-muted-foreground text-xs">
          {config?.webhookApiKeyMasked
            ? t("fields.webhookApiKeyCurrentHint", { masked: config.webhookApiKeyMasked })
            : t("fields.webhookApiKeyEmptyHint")}
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-sm font-semibold">{t("fields.webhookUrl")}</Label>
        <div className="flex items-center gap-2">
          <Input
            readOnly
            value={config?.webhookUrl ?? ""}
            className="bg-muted/40 flex-1 font-mono text-xs"
          />
          <Button type="button" variant="outline" size="sm" onClick={handleCopyWebhookUrl}>
            <Copy size={14} className="mr-1.5" />
            {t("buttons.copy")}
          </Button>
        </div>
        <p className="text-muted-foreground text-xs">{t("fields.webhookUrlHint")}</p>
      </div>

      <div className="flex justify-end">
        <Button type="submit" variant="primary" disabled={isPending}>
          {isPending ? t("buttons.saving") : t("buttons.save")}
        </Button>
      </div>
    </form>
  );
}
