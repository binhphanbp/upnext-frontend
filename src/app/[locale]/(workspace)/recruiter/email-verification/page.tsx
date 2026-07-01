"use client";

import { XCircle, Spinner } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import Swal from "sweetalert2";

import {
  verifyRecruiterEmail,
  requestRecruiterEmailVerification,
} from "@/features/recruiter/api/auth";
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
import { FormInput } from "@/shared/ui/input";

export default function RecruiterEmailVerificationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const t = useTranslations("RecruiterAuth.emailVerification");

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setSuccess(false);
      setErrorMsg(t("tokenMissingError"));
      return;
    }

    async function verify() {
      try {
        await verifyRecruiterEmail(token);
        setSuccess(true);
      } catch (error) {
        setSuccess(false);
        setErrorMsg(t("tokenExpiredError"));
      } finally {
        setLoading(false);
      }
    }

    void verify();
  }, [token, t]);

  async function handleRequestNewLink(e: React.FormEvent) {
    e.preventDefault();
    if (!emailInput.trim()) {
      void Swal.fire({
        icon: "warning",
        title: t("missingEmailTitle"),
        text: t("missingEmailText"),
      });
      return;
    }

    setResending(true);
    try {
      await requestRecruiterEmailVerification(emailInput.trim());
      void Swal.fire({
        icon: "success",
        title: t("sendSuccessTitle"),
        text: t("sendSuccessText", { email: emailInput }),
        timer: 3000,
        showConfirmButton: false,
      });
      setCountdown(60);
    } catch {
      void Swal.fire({
        icon: "error",
        title: t("sendErrorTitle"),
        text: t("sendErrorText"),
      });
    } finally {
      setResending(false);
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
              width={105}
              height={25}
              priority
              style={{ height: "auto", width: "auto" }}
            />
          </div>
          <div className="flex flex-col gap-2">
            <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
              {loading ? t("loadingTitle") : success ? t("successTitle") : t("errorTitle")}
            </CardTitle>
            <CardDescription className="mt-2 text-sm text-slate-500">
              {loading ? t("loadingDesc") : success ? t("successDesc") : t("errorDesc")}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="mt-8 space-y-6 p-0">
          {loading && (
            <div className="my-6 flex animate-spin justify-center text-emerald-600">
              <Spinner size={48} weight="bold" />
            </div>
          )}

          {!loading && success && (
            <>
              <div className="my-6 flex justify-center py-2">
                <div className="inline-block -rotate-[8deg] rounded-lg border-[3px] border-[#10a778] px-6 py-2 text-2xl font-black tracking-widest text-[#10a778] uppercase">
                  {t("verifiedStamp")}
                </div>
              </div>
              <p className="text-sm leading-6 text-slate-600">{t("successMsg")}</p>
            </>
          )}

          {!loading && !success && (
            <>
              <div className="my-4 flex justify-center text-rose-500">
                <XCircle size={64} weight="duotone" />
              </div>
              <p className="text-sm leading-6 text-slate-600">{errorMsg}</p>

              <form
                onSubmit={handleRequestNewLink}
                className="w-full space-y-4 border-t border-slate-100 pt-4 text-left"
              >
                <div className="space-y-2">
                  <label htmlFor="resend-email" className="text-xs font-semibold text-slate-700">
                    {t("resendLabel")}
                  </label>
                  <FormInput
                    id="resend-email"
                    type="email"
                    placeholder="name@company.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="h-11 rounded-lg border-slate-200"
                  />
                </div>

                <Button
                  type="submit"
                  className="h-11 w-full rounded-xl border-0 bg-[#10a778] text-sm font-bold text-white shadow-md shadow-emerald-600/10 transition-all hover:bg-[#0d966d]"
                  disabled={resending || countdown > 0}
                >
                  {resending
                    ? t("sendingButton")
                    : countdown > 0
                      ? t("countdownButton", { countdown })
                      : t("sendButton")}
                </Button>
              </form>
            </>
          )}
        </CardContent>

        <CardFooter className="mt-6 flex flex-col border-t border-slate-100 p-0 pt-6">
          {!loading && success && (
            <Button
              className="mb-4 h-11 w-full rounded-xl border-0 bg-[#10a778] text-sm font-bold text-white shadow-md shadow-emerald-600/10 transition-all hover:bg-[#0d966d]"
              onClick={() => router.push("/recruiter/login")}
            >
              {t("loginButton")}
            </Button>
          )}

          <button
            type="button"
            onClick={() => router.push("/recruiter/login")}
            className="inline-flex w-full items-center justify-center gap-2 text-sm font-semibold text-slate-600 transition-colors hover:text-emerald-600"
          >
            {t("backToLogin")}
          </button>
        </CardFooter>
      </Card>
    </main>
  );
}
