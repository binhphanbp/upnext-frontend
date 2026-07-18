"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";
import Swal from "sweetalert2";

import { useRouter } from "@/i18n/navigation";

const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3200,
  timerProgressBar: true,
});

function decodeJwt(token: string) {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const pad = base64Url.length % 4;
    const padding = pad ? "=".repeat(4 - pad) : "";
    const base64 = (base64Url + padding).replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export default function RecruiterAuthCallbackPage() {
  const router = useRouter();
  const t = useTranslations("RecruiterAuth");

  useEffect(() => {
    const credentials = new URLSearchParams(window.location.hash.replace(/^#/u, ""));
    const token = credentials.get("token");
    const refreshToken = credentials.get("refreshToken");
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    if (token) {
      const decoded = decodeJwt(token);
      if (decoded && decoded.role === "RECRUITER") {
        localStorage.setItem("upnext.recruiter.accessToken", token);
        if (refreshToken) localStorage.setItem("upnext.recruiter.refreshToken", refreshToken);
        localStorage.setItem("upnext.recruiter.tokenType", "Bearer");
        localStorage.setItem(
          "upnext.recruiter.user",
          JSON.stringify({
            id: decoded.sub,
            email: decoded.email,
            role: decoded.role,
          }),
        );

        window.localStorage.setItem("upnext.demo.auth", "recruiter");
        window.dispatchEvent(new Event("upnext-demo-auth-change"));

        void Toast.fire({
          icon: "success",
          title: t("login.success"),
        });

        router.push("/recruiter");
        return;
      }
    }

    router.push("/recruiter/login");
  }, [router, t]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
        <p className="mt-4 text-sm font-semibold text-slate-600">Đang đăng nhập, vui lòng đợi...</p>
      </div>
    </div>
  );
}
