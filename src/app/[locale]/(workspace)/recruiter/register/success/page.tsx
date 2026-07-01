"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import Swal from "sweetalert2";

import { requestRecruiterEmailVerification } from "@/features/recruiter/api/auth";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/shared/ui/card";

export default function RecruiterRegisterSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  async function handleResend() {
    if (!email) {
      void Swal.fire({
        icon: "error",
        title: "Thiếu thông tin email",
        text: "Vui lòng đăng ký lại hoặc quay lại trang đăng nhập.",
      });
      return;
    }

    setResending(true);
    try {
      await requestRecruiterEmailVerification(email);
      void Swal.fire({
        icon: "success",
        title: "Đã gửi lại email",
        text: `Hệ thống đã gửi lại liên kết kích hoạt đến email: ${email}`,
        timer: 3000,
        showConfirmButton: false,
      });
      setCountdown(60);
    } catch {
      void Swal.fire({
        icon: "error",
        title: "Lỗi gửi email",
        text: "Gửi lại email thất bại. Vui lòng thử lại sau.",
      });
    } finally {
      setResending(false);
    }
  }

  // Open Gmail/Email Client in new tab
  function handleOpenMail() {
    const domain = email.split("@")[1];
    if (domain === "gmail.com") {
      window.open("https://mail.google.com", "_blank");
    } else {
      window.open(`https://${domain}`, "_blank");
    }
  }

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[linear-gradient(180deg,#003b3b_0%,#006347_52%,#15915d_100%)] px-4 py-10 [font-family:var(--font-sans)]">
      {/* Exact Background Design from Login Page */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 h-[520px] w-[420px] -translate-x-24 bg-[linear-gradient(135deg,rgba(255,255,255,0.10),rgba(255,255,255,0)_58%)] [clip-path:polygon(0_0,55%_0,100%_38%,54%_75%,0_18%)]" />
        <div className="absolute top-[170px] left-10 h-[410px] w-[220px] border border-white/10 bg-white/5 [clip-path:polygon(0_0,64%_50%,0_100%,24%_100%,88%_50%,24%_0)]" />
        <div className="absolute right-0 bottom-8 h-[470px] w-[340px] translate-x-16 rotate-180 bg-[linear-gradient(135deg,rgba(255,255,255,0.10),rgba(255,255,255,0)_62%)] [clip-path:polygon(0_0,55%_0,100%_38%,54%_75%,0_18%)]" />
        <div className="absolute right-8 bottom-[210px] h-[360px] w-[190px] rotate-180 border border-white/10 bg-white/5 [clip-path:polygon(0_0,64%_50%,0_100%,24%_100%,88%_50%,24%_0)]" />
      </div>

      <Card className="relative z-10 w-full max-w-[480px] rounded-2xl border-0 bg-white p-8 text-center shadow-[0_28px_90px_rgba(0,28,22,0.35)] sm:p-12">
        <CardHeader className="gap-6 p-0 text-center">
          <div className="mx-auto">
            <Image
              alt="UpNext"
              src="/upnext-logo/wordmark-cropped.png"
              width={112}
              height={27}
              priority
              style={{ height: "auto", width: "auto" }}
            />
          </div>
          <div className="flex flex-col gap-2">
            <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
              Xác thực Email của bạn
            </CardTitle>
            <CardDescription className="text-sm leading-relaxed text-slate-500">
              Một liên kết kích hoạt đã được gửi tới địa chỉ email của bạn:
              <span className="mt-2 block rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm font-semibold break-all text-slate-900 select-all">
                {email || "contact@upnext.works"}
              </span>
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="mt-8 space-y-6 p-0">
          <p className="text-sm leading-relaxed text-slate-600">
            Vui lòng kiểm tra hộp thư đến và nhấn vào nút kích hoạt tài khoản trong email để hoàn
            tất đăng ký.
          </p>

          <Button
            type="button"
            className="h-11 w-full rounded-xl border-0 bg-[#10a778] text-sm font-bold text-white shadow-md shadow-emerald-600/10 transition-all hover:bg-[#0d966d]"
            onClick={handleOpenMail}
          >
            Mở hộp thư ngay
          </Button>

          <div className="text-sm text-slate-500">
            Chưa nhận được email?{" "}
            <button
              type="button"
              disabled={resending || countdown > 0}
              onClick={handleResend}
              className="font-bold text-slate-900 underline transition-colors hover:text-emerald-600 disabled:pointer-events-none disabled:opacity-50"
            >
              {resending ? "Đang gửi..." : countdown > 0 ? `Gửi lại sau ${countdown}s` : "Gửi lại"}
            </button>
          </div>
        </CardContent>

        <CardFooter className="mt-6 flex flex-col border-t border-slate-100 p-0 pt-6">
          <button
            type="button"
            onClick={() => router.push("/recruiter/login")}
            className="inline-flex w-full items-center justify-center gap-2 text-sm font-semibold text-slate-600 transition-colors hover:text-emerald-600"
          >
            ← Quay lại đăng nhập
          </button>
        </CardFooter>
      </Card>
    </main>
  );
}
