"use client";

import {
  CheckCircle,
  Copy,
  Eye,
  EyeSlash,
  Flask,
  Info,
  Play,
  Sparkle,
  Spinner,
  WarningCircle,
} from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useEffect, useState, type FormEvent } from "react";
import Swal from "sweetalert2";

import {
  getAdminPaymentConfig,
  simulateSepayPayment,
  testSepayConnection,
  updateAdminPaymentConfig,
  type TestSepayConnectionResponse,
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
  contentPrefix: string;
  webhookSecret: string;
  apiToken: string;
};

const emptyForm: FormState = {
  isEnabled: false,
  bankName: "",
  bankBin: "",
  accountNumber: "",
  accountName: "",
  contentPrefix: "",
  webhookSecret: "",
  apiToken: "",
};

export function SepayConfigForm() {
  const t = useTranslations("Admin.finance.paymentConfig.sepay");
  const router = useRouter();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showApiToken, setShowApiToken] = useState(false);

  // Safe translation helper: guarantees clean Vietnamese even if next-intl returns raw key
  const txt = (key: string, fallback: string): string => {
    try {
      const val = t(key);
      if (!val || val.startsWith("Admin.") || val.includes("paymentConfig")) {
        return fallback;
      }
      return val;
    } catch {
      return fallback;
    }
  };

  // API Connection Test state
  const [isTestingApi, setIsTestingApi] = useState(false);
  const [testApiResult, setTestApiResult] = useState<TestSepayConnectionResponse | null>(null);

  // Simulation state
  const [simInvoiceCode, setSimInvoiceCode] = useState("");
  const [simAmount, setSimAmount] = useState("");

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

  // Re-seed the form whenever the loaded config changes
  useEffect(() => {
    if (!config) return;
    setForm({
      isEnabled: config.isEnabled,
      bankName: config.bankName ?? "",
      bankBin: config.bankBin ?? "",
      accountNumber: config.accountNumber ?? "",
      accountName: config.accountName ?? "",
      contentPrefix: config.contentPrefix ?? "",
      webhookSecret: "",
      apiToken: "",
    });
  }, [config]);

  const handleTestApiConnection = async () => {
    try {
      const session = getAdminSession();
      if (!session) throw new Error("No session");
      setIsTestingApi(true);
      setTestApiResult(null);

      const result = await testSepayConnection(
        session.accessToken,
        form.apiToken.trim() || undefined,
      );
      setTestApiResult(result);
      if (result.success) {
        void toast.fire({
          icon: "success",
          title: result.message,
        });
      } else {
        void toast.fire({
          icon: "warning",
          title: result.message,
        });
      }
    } catch (err) {
      if (handleAuthError(err)) return;
      const msg = err instanceof Error ? err.message : "Lỗi kiểm tra kết nối SePay";
      setTestApiResult({
        success: false,
        isSandbox: false,
        message: msg,
      });
      void toast.fire({ icon: "error", title: msg });
    } finally {
      setIsTestingApi(false);
    }
  };

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
          contentPrefix: form.contentPrefix.trim(),
          webhookSecret: form.webhookSecret.trim() || undefined,
          apiToken: form.apiToken.trim() || undefined,
        },
        session.accessToken,
      );
    },
    onSuccess: () => {
      void toast.fire({
        icon: "success",
        title: txt("toasts.saveSuccess", "Đã lưu cấu hình SePay thành công."),
      });
      setForm((prev) => ({ ...prev, webhookSecret: "", apiToken: "" }));
      void queryClient.invalidateQueries({ queryKey: ["adminPaymentConfig", "SEPAY"] });
    },
    onError: (error: unknown) => {
      if (handleAuthError(error)) return;
      const message =
        error instanceof ApiError
          ? error.message
          : txt("toasts.saveError", "Không lưu được cấu hình, vui lòng thử lại.");
      void toast.fire({ icon: "error", title: message });
    },
  });

  const { mutate: runSimulation, isPending: isSimulating } = useMutation({
    mutationFn: async () => {
      const session = getAdminSession();
      if (!session) throw new Error("No session");
      if (!simInvoiceCode.trim()) throw new Error("Vui lòng nhập mã hóa đơn cần mô phỏng.");
      const amt = simAmount ? Number(simAmount) : undefined;
      return simulateSepayPayment(
        {
          invoiceCode: simInvoiceCode.trim(),
          amount: amt,
        },
        session.accessToken,
      );
    },
    onSuccess: () => {
      void Swal.fire({
        icon: "success",
        title: txt("testMode.simulateSuccess", "Mô phỏng thanh toán thành công!"),
        text: `Hóa đơn ${simInvoiceCode} đã được hệ thống ghi nhận thanh toán PAID và kích hoạt gói thành công!`,
        confirmButtonColor: "#10a778",
      });
      setSimInvoiceCode("");
      setSimAmount("");
      void queryClient.invalidateQueries({ queryKey: ["adminPaymentConfig", "SEPAY"] });
    },
    onError: (error: unknown) => {
      if (handleAuthError(error)) return;
      const message =
        error instanceof Error
          ? error.message
          : txt(
              "testMode.simulateError",
              "Mô phỏng thanh toán thất bại. Vui lòng kiểm tra mã hóa đơn.",
            );
      void Swal.fire({
        icon: "error",
        title: "Mô phỏng thất bại",
        text: message,
      });
    },
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    submit();
  };

  const handleCopyWebhookUrl = () => {
    if (!config?.webhookUrl) return;
    void navigator.clipboard.writeText(config.webhookUrl);
    void toast.fire({
      icon: "success",
      title: txt("toasts.copied", "Đã sao chép Webhook URL"),
    });
  };

  const handleLoadSandboxPreset = () => {
    setForm((prev) => ({
      ...prev,
      isEnabled: true,
      bankName: "TPBank (Test Mode)",
      bankBin: "970423",
      accountNumber: "10001291241",
      accountName: "PHAN QUOC DUY",
      contentPrefix: "",
      apiToken: "VUGF1QUHQ9G2QSDVYIBEIGZKATC73B2MW5O4CBLEV43VOFA0DWTENNYO6L8LYAOS",
      webhookSecret: "VUGF1QUHQ9G2QSDVYIBEIGZKATC73B2MW5O4CBLEV43VOFA0DWTENNYO6L8LYAOS",
    }));
    void toast.fire({
      icon: "info",
      title: txt("toasts.presetLoaded", "Đã nạp thông tin Test Mode SePay mẫu vào form."),
    });
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
    <div className="flex max-w-3xl flex-col gap-8 pb-12">
      {/* Test Mode / Sandbox Indicator Banner */}
      <div className="rounded-2xl border border-amber-200/90 bg-gradient-to-r from-amber-50/90 via-orange-50/70 to-amber-50/90 p-5 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3.5">
            <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-xs">
              <Flask size={20} weight="bold" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-sm font-bold text-amber-950">
                  {txt(
                    "testMode.bannerTitle",
                    "Cổng SePay đang kết nối Chế độ Thử nghiệm (Sandbox)",
                  )}
                </h4>
                <span className="rounded-full border border-amber-300 bg-amber-200/90 px-2.5 py-0.5 text-[10px] font-extrabold tracking-wide text-amber-900 uppercase">
                  Sandbox
                </span>
              </div>
              <p className="text-xs leading-relaxed text-amber-900/80">
                {txt(
                  "testMode.bannerDesc",
                  "Tài khoản và giao dịch mang tính chất thử nghiệm, không ảnh hưởng tài khoản thật. Nhà tuyển dụng quét mã hoặc dùng công cụ mô phỏng để kích hoạt gói dịch vụ tức thì mà không trừ tiền thật.",
                )}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleLoadSandboxPreset}
            className="h-9 shrink-0 border-amber-300 bg-white px-3.5 text-xs font-bold text-amber-900 shadow-xs transition-colors hover:bg-amber-100"
          >
            <Sparkle size={14} weight="bold" className="mr-1.5 text-amber-600" />
            {txt("buttons.loadTestPreset", "Nạp cấu hình Test Mode mẫu")}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6" autoComplete="off">
        <p className="text-xs leading-relaxed text-slate-500">
          {txt(
            "description",
            "SePay theo dõi biến động số dư tài khoản ngân hàng và tự động xác nhận thanh toán qua VietQR -- không cần ai bấm xác nhận thủ công.",
          )}
        </p>

        {/* Toggle Enable Gateway */}
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4 transition-colors hover:bg-slate-50">
          <Checkbox
            id="sepayIsEnabled"
            checked={form.isEnabled}
            onCheckedChange={(checked) =>
              setForm((prev) => ({ ...prev, isEnabled: checked === true }))
            }
            className="size-5 rounded-md border-slate-300 data-[state=checked]:border-emerald-600 data-[state=checked]:bg-emerald-600"
          />
          <Label
            htmlFor="sepayIsEnabled"
            className="cursor-pointer text-sm font-bold text-slate-800"
          >
            {txt("fields.isEnabled", "Bật cổng thanh toán qua SePay")}
          </Label>
          <span
            className={`ml-auto rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
              form.isEnabled ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"
            }`}
          >
            {form.isEnabled ? "Đang bật" : "Đang tắt"}
          </span>
        </div>

        {/* Bank Information Grid */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <h3 className="mb-4 text-xs font-bold tracking-wider text-slate-400 uppercase">
            Thông tin tài khoản nhận tiền
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormInput
              label={txt("fields.bankName", "Tên ngân hàng")}
              placeholder={txt("fields.bankNamePlaceholder", "VD: TPBank, Vietcombank, MBBank")}
              value={form.bankName}
              onChange={(event) => setForm((prev) => ({ ...prev, bankName: event.target.value }))}
            />

            <FormInput
              label={txt("fields.bankBin", "Mã BIN ngân hàng")}
              placeholder={txt("fields.bankBinPlaceholder", "VD: 970423 (TPBank), 970436 (VCB)")}
              value={form.bankBin}
              onChange={(event) => setForm((prev) => ({ ...prev, bankBin: event.target.value }))}
            />

            <FormInput
              label={txt("fields.accountNumber", "Số tài khoản ngân hàng")}
              placeholder="VD: 10001291241"
              value={form.accountNumber}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, accountNumber: event.target.value }))
              }
            />

            <FormInput
              label={txt("fields.accountName", "Tên chủ tài khoản (In hoa không dấu)")}
              placeholder={txt("fields.accountNamePlaceholder", "VD: PHAN QUOC DUY")}
              value={form.accountName}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, accountName: event.target.value }))
              }
            />
          </div>
          <p className="mt-3 flex items-center gap-1 text-[11px] text-slate-400">
            <Info size={13} />
            {txt(
              "fields.bankBinHint",
              "Tra mã BIN theo chuẩn Napas/VietQR của ngân hàng bạn dùng (Ví dụ: TPBank là 970423, MBBank là 970422).",
            )}
          </p>
        </div>

        {/* Virtual Account Prefix (With anti-autofill to prevent email injection) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <h3 className="mb-1 text-xs font-bold tracking-wider text-slate-400 uppercase">
            Cấu hình nội dung chuyển khoản
          </h3>
          <div className="mt-3 flex flex-col gap-1.5">
            <FormInput
              label={txt("fields.contentPrefix", "Tiền tố nội dung chuyển khoản (VA)")}
              placeholder={txt(
                "fields.contentPrefixPlaceholder",
                "VD: UPNEXT -- để trống nếu không dùng Virtual Account",
              )}
              value={form.contentPrefix}
              autoComplete="new-password"
              data-1p-ignore="true"
              data-lpignore="true"
              onChange={(event) =>
                setForm((prev) => ({ ...prev, contentPrefix: event.target.value }))
              }
            />
            <p className="text-[11px] text-slate-400">
              {txt(
                "fields.contentPrefixHint",
                'Chỉ cần điền nếu tài khoản ngân hàng có bật Virtual Account (VA) trên SePay -- lấy đúng chuỗi ở mục "Phải có từ" khi xem chi tiết VA.',
              )}
            </p>
          </div>
        </div>

        {/* SePay API Token for Polling (No Webhook Required) */}
        <div className="rounded-2xl border border-sky-200 bg-gradient-to-b from-sky-50/60 to-sky-50/20 p-5 shadow-xs">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <Label className="text-sm font-bold text-sky-950">
                  {txt(
                    "fields.apiToken",
                    "SePay API Token (Dùng quét API Polling - Không cần Webhook)",
                  )}
                </Label>
                <p className="mt-0.5 text-[11px] text-sky-800/80">
                  Hệ thống dùng token này để chủ động quét giao dịch chuyển khoản từ SePay. Hoạt
                  động trên localhost mà không cần mở port hay Webhook.
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 shrink-0 border-sky-300 bg-white text-xs font-bold text-sky-700 shadow-2xs hover:bg-sky-100"
                disabled={isTestingApi}
                onClick={handleTestApiConnection}
              >
                {isTestingApi ? (
                  <>
                    <Spinner size={14} className="mr-1.5 animate-spin text-sky-600" />
                    {txt("buttons.testingApi", "Đang kiểm tra...")}
                  </>
                ) : (
                  <>
                    <CheckCircle size={14} weight="bold" className="mr-1.5 text-sky-600" />
                    {txt("buttons.testApi", "Kiểm tra kết nối API")}
                  </>
                )}
              </Button>
            </div>

            <div className="mt-1">
              <FormInput
                type={showApiToken ? "text" : "password"}
                placeholder={txt(
                  "fields.apiTokenPlaceholder",
                  "Dán API Token lấy từ SePay -> API Access",
                )}
                value={form.apiToken}
                autoComplete="new-password"
                onChange={(event) => setForm((prev) => ({ ...prev, apiToken: event.target.value }))}
                suffix={
                  <button
                    type="button"
                    onClick={() => setShowApiToken((prev) => !prev)}
                    className="text-slate-400 hover:text-slate-600"
                    aria-label={showApiToken ? "Ẩn token" : "Hiện token"}
                  >
                    {showApiToken ? <EyeSlash size={18} /> : <Eye size={18} />}
                  </button>
                }
              />
            </div>

            <div className="flex flex-col gap-1 text-xs">
              <p className="text-slate-500">
                {config?.apiTokenMasked
                  ? `Token hiện tại: ${config.apiTokenMasked}`
                  : txt("fields.apiTokenEmptyHint", "Chưa cấu hình API Token.")}
              </p>

              {testApiResult && (
                <div
                  className={`mt-2 flex items-start gap-2.5 rounded-xl p-3.5 text-xs ${
                    testApiResult.success
                      ? "border border-emerald-200 bg-emerald-50/90 text-emerald-900"
                      : "border border-amber-200 bg-amber-50/90 text-amber-900"
                  }`}
                >
                  {testApiResult.success ? (
                    <CheckCircle
                      size={18}
                      weight="fill"
                      className="mt-0.5 shrink-0 text-emerald-600"
                    />
                  ) : (
                    <WarningCircle
                      size={18}
                      weight="fill"
                      className="mt-0.5 shrink-0 text-amber-600"
                    />
                  )}
                  <div>
                    <span className="font-bold">{testApiResult.message}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Webhook Secret Key & Webhook URL (Secondary / Optional) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <h3 className="mb-4 text-xs font-bold tracking-wider text-slate-400 uppercase">
            Cấu hình Webhook SePay (Dành cho môi trường Production / Live có tên miền công khai)
          </h3>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <FormInput
                label={txt("fields.webhookSecret", "Secret Key (HMAC-SHA256)")}
                type={showApiKey ? "text" : "password"}
                placeholder={txt(
                  "fields.webhookSecretPlaceholder",
                  "Để trống nếu không muốn đổi secret hiện tại",
                )}
                value={form.webhookSecret}
                autoComplete="new-password"
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, webhookSecret: event.target.value }))
                }
                suffix={
                  <button
                    type="button"
                    onClick={() => setShowApiKey((prev) => !prev)}
                    className="text-slate-400 hover:text-slate-600"
                    aria-label={showApiKey ? "Ẩn secret" : "Hiện secret"}
                  >
                    {showApiKey ? <EyeSlash size={18} /> : <Eye size={18} />}
                  </button>
                }
              />
              <p className="text-[11px] text-slate-400">
                {config?.webhookSecretMasked
                  ? `Secret hiện tại: ${config.webhookSecretMasked}`
                  : txt("fields.webhookSecretEmptyHint", "Chưa cấu hình secret nào.")}
              </p>
            </div>

            <div className="flex flex-col gap-1.5 border-t border-slate-100 pt-2">
              <Label className="text-xs font-bold text-slate-700">
                {txt("fields.webhookUrl", "Webhook URL")}
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={config?.webhookUrl ?? ""}
                  className="bg-slate-50 font-mono text-xs text-slate-600"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyWebhookUrl}
                  className="shrink-0 text-xs font-bold text-slate-600"
                >
                  <Copy size={14} className="mr-1.5" />
                  {txt("buttons.copy", "Sao chép")}
                </Button>
              </div>
              <p className="text-[11px] text-slate-400">
                {txt(
                  "fields.webhookUrlHint",
                  "Dán URL này vào phần cấu hình Webhook trên trang quản trị SePay (nếu có sử dụng Webhook).",
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            className="h-11 cursor-pointer rounded-xl bg-emerald-600 px-6 text-sm font-bold text-white shadow-sm transition-all hover:bg-emerald-700 disabled:opacity-70"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Spinner size={16} className="mr-2 animate-spin" />
                {txt("buttons.saving", "Đang lưu cấu hình...")}
              </>
            ) : (
              txt("buttons.save", "Lưu cấu hình")
            )}
          </Button>
        </div>
      </form>

      {/* SePay Simulation Section for Test Mode */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
            <Play size={16} weight="fill" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              {txt("testMode.simulateTitle", "Mô phỏng thanh toán SePay (Sandbox Simulation)")}
            </h3>
            <p className="text-xs text-slate-500">
              {txt(
                "testMode.simulateDesc",
                "Nhập mã hóa đơn cần thanh toán để giả lập webhook gửi tiền vào hệ thống và kích hoạt gói tức thì.",
              )}
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-bold text-slate-700">
              {txt("testMode.invoiceCodeLabel", "Mã hóa đơn cần thanh toán")}
            </Label>
            <Input
              value={simInvoiceCode}
              onChange={(e) => setSimInvoiceCode(e.target.value)}
              placeholder={txt("testMode.invoiceCodePlaceholder", "VD: INV-20260903-XXXX")}
              className="font-mono text-xs"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-bold text-slate-700">
              {txt("testMode.amountLabel", "Số tiền chuyển khoản (VNĐ)")}
            </Label>
            <Input
              type="number"
              value={simAmount}
              onChange={(e) => setSimAmount(e.target.value)}
              placeholder={txt(
                "testMode.amountPlaceholder",
                "Để trống để lấy đúng số tiền hóa đơn",
              )}
              className="font-mono text-xs"
            />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <WarningCircle size={15} />
            <span>Mô phỏng webhook chuyển khoản vào khớp mã hóa đơn.</span>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={() => runSimulation()}
            disabled={isSimulating || !simInvoiceCode.trim()}
            className="h-9 cursor-pointer rounded-lg bg-emerald-600 px-4 text-xs font-bold text-white shadow-2xs transition-colors hover:bg-emerald-700 disabled:opacity-50"
          >
            {isSimulating ? (
              <>
                <Spinner size={13} className="mr-1.5 animate-spin" />
                {txt("buttons.sendingSimulation", "Đang gửi...")}
              </>
            ) : (
              <>
                <Play size={13} weight="fill" className="mr-1.5" />
                {txt("buttons.sendSimulation", "Gửi thanh toán thử")}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
