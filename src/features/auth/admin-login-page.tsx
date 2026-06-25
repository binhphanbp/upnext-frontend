"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { EnvelopeSimple, Eye, EyeSlash, LockKey } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { upnextLogo } from "@/features/public/home/brand";
import { useRouter } from "@/i18n/navigation";

import "./admin-login-page.css";
import { createAdminLoginSchema, type AdminLoginValues } from "./schemas/admin-auth-schema";

const demoAuthStorageKey = "upnext.demo.auth";
const demoAuthChangeEvent = "upnext-demo-auth-change";

function rememberAdminSession() {
  window.localStorage.setItem(demoAuthStorageKey, "admin");
  window.dispatchEvent(new Event(demoAuthChangeEvent));
}

export function AdminLoginPage() {
  const router = useRouter();
  const t = useTranslations("AdminAuth");
  const tAuth = useTranslations("Auth");
  const [showPassword, setShowPassword] = useState(false);

  const validationMessages = {
    invalidEmail: tAuth("validation.invalidEmail"),
    passwordRequired: tAuth("validation.passwordRequired"),
  };

  const form = useForm<AdminLoginValues>({
    resolver: zodResolver(createAdminLoginSchema(validationMessages)),
    defaultValues: { email: "", password: "" },
  });

  function submit() {
    rememberAdminSession();
    router.push("/admin");
  }

  return (
    <main className="admin-login-page">
      <section className="admin-login-card" aria-label={t("title")}>
        <div className="admin-login-header">
          <button
            type="button"
            className="admin-login-logo"
            onClick={() => router.push("/")}
            aria-label={tAuth("common.homeLabel")}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            <Image
              src={upnextLogo.wordmark}
              alt="UpNext"
              width={143}
              height={34}
              priority
              style={{ height: "auto", width: "auto" }}
            />
          </button>
          <h1 className="admin-login-title">{t("title")}</h1>
          <p className="admin-login-subtitle">{t("subtitle")}</p>
        </div>

        <form className="admin-login-form" onSubmit={form.handleSubmit(submit)}>
          <div className="admin-login-field">
            <label className="admin-login-label" htmlFor="admin-email">
              {tAuth("fields.email")}
            </label>
            <div className="admin-login-input-wrapper">
              <EnvelopeSimple size={18} />
              <input
                id="admin-email"
                {...form.register("email")}
                type="email"
                className="admin-login-input"
                placeholder={t("emailPlaceholder")}
                autoComplete="email"
              />
            </div>
            {form.formState.errors.email && (
              <span className="admin-login-error">{form.formState.errors.email.message}</span>
            )}
          </div>

          <div className="admin-login-field">
            <label className="admin-login-label" htmlFor="admin-password">
              {tAuth("fields.password")}
            </label>
            <div className="admin-login-input-wrapper">
              <LockKey size={18} />
              <input
                id="admin-password"
                {...form.register("password")}
                type={showPassword ? "text" : "password"}
                className="admin-login-input"
                placeholder={t("passwordPlaceholder")}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="admin-login-eye"
                aria-label={
                  showPassword ? tAuth("common.hidePassword") : tAuth("common.showPassword")
                }
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {form.formState.errors.password && (
              <span className="admin-login-error">{form.formState.errors.password.message}</span>
            )}
          </div>

          <button type="submit" className="admin-login-submit">
            {t("submit")}
          </button>
        </form>

        <div className="admin-login-footer">
          <p className="admin-login-contact">{t("footerLine2")}</p>
          <p className="admin-login-contact" style={{ marginTop: 8 }}>
            {t("footerLine3")}
          </p>
        </div>
      </section>
    </main>
  );
}
