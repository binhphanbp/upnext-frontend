"use client";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { saveCandidateSession } from "@/features/candidate/session";
import { Link, useRouter } from "@/i18n/navigation";

type CandidateTokenPayload = Readonly<{
  sub?: string;
  email?: string;
  role?: string;
}>;

const demoAuthStorageKey = "upnext.demo.auth";
const demoAuthChangeEvent = "upnext-demo-auth-change";

export function CandidateOAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("Auth.oauth");
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const token = searchParams.get("token");
    const payload = token ? decodeCandidateToken(token) : null;

    if (!token || !payload?.sub || !payload.email || payload.role !== "CANDIDATE") {
      setHasError(true);
      return;
    }

    saveCandidateSession({
      accessToken: token,
      tokenType: "Bearer",
      user: { id: payload.sub, email: payload.email, role: "CANDIDATE" },
    });
    window.localStorage.setItem(demoAuthStorageKey, "candidate");
    window.dispatchEvent(new Event(demoAuthChangeEvent));
    router.replace("/candidate/profile");
  }, [router, searchParams]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 text-slate-950">
      <div className="w-full max-w-sm text-center">
        <div
          className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent motion-reduce:animate-none"
          aria-hidden="true"
        />
        <h1 className="mt-5 text-xl font-bold tracking-tight">
          {hasError ? t("failedTitle") : t("processingTitle")}
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {hasError ? t("failedDescription") : t("processingDescription")}
        </p>
        {hasError ? (
          <Link
            href="/login"
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-emerald-600 px-4 text-sm font-bold text-white transition-colors hover:bg-emerald-700 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-emerald-400"
          >
            {t("returnToLogin")}
          </Link>
        ) : null}
      </div>
    </main>
  );
}

function decodeCandidateToken(token: string): CandidateTokenPayload | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;

    const paddedPayload = `${payload.replace(/-/g, "+").replace(/_/g, "/")}${"=".repeat(
      (4 - (payload.length % 4)) % 4,
    )}`;
    const decoded = JSON.parse(window.atob(paddedPayload)) as CandidateTokenPayload;

    return decoded;
  } catch {
    return null;
  }
}
