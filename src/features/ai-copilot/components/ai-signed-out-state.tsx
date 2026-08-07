"use client";

import { ShieldCheck, SignIn, Sparkle } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";

/**
 * Trạng thái chưa đăng nhập của Copilot.
 *
 * Trước đây trang `/candidate/ai` vẫn dựng đầy đủ ô nhập và các nút gợi ý cho
 * khách vãng lai. Gõ câu hỏi rồi Enter thì không có gì xảy ra — lời gọi tạo hội
 * thoại ném lỗi thiếu phiên đăng nhập và lỗi đó chết lặng ở console. Giao diện
 * hứa một việc mà nó không làm được, đó mới là lỗi thật; việc lời hứa đó thất
 * bại im lặng chỉ là hệ quả.
 *
 * Nên màn hình này thay thế *chính ô nhập*, chứ không phải hiện thêm cảnh báo
 * bên cạnh nó. Và nó nói rõ lý do: Copilot đọc CV, hồ sơ và đơn ứng tuyển của
 * riêng người dùng, nên không có tài khoản thì không có gì để đọc — khác hẳn một
 * chatbot công khai mà ai cũng hỏi được.
 */
export function AiSignedOutState({ className }: { className?: string }) {
  const t = useTranslations("AiCopilot");

  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col items-center justify-center px-6 py-10 text-center",
        className,
      )}
    >
      <span
        aria-hidden
        className="grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm"
      >
        <Sparkle weight="fill" className="size-7" />
      </span>

      <h2 className="mt-4 text-lg font-bold text-balance text-slate-950">{t("signedOut.title")}</h2>
      <p className="mt-2 max-w-md text-[14.5px] leading-relaxed text-pretty text-slate-600">
        {t("signedOut.description")}
      </p>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
        <Button asChild className="rounded-xl">
          <Link href="/login">
            <SignIn weight="bold" />
            {t("signedOut.signIn")}
          </Link>
        </Button>
        <Button asChild variant="outline" className="rounded-xl">
          <Link href="/register">{t("signedOut.register")}</Link>
        </Button>
      </div>

      <p className="mt-6 inline-flex max-w-md items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-left text-[13px] leading-relaxed text-slate-600">
        <ShieldCheck weight="fill" aria-hidden className="mt-px size-4 shrink-0 text-slate-400" />
        {t("signedOut.privacy")}
      </p>
    </div>
  );
}
