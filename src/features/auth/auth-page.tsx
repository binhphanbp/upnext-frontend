"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { EnvelopeSimple, Eye, EyeSlash, GithubLogo, LockKey, User } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { upnextLogo } from "@/features/public/home/brand";
import { useRouter } from "@/i18n/navigation";
import { ApiError } from "@/shared/api/http";

import "./auth-page.css";
import { loginCandidate, registerCandidate } from "./api/candidate-auth";
import {
  createLoginSchema,
  createRegisterSchema,
  type LoginValues,
  type RegisterValues,
} from "./schemas/auth-schema";

type AuthPageProps = {
  mode: "login" | "register";
};

const demoAuthStorageKey = "upnext.demo.auth";
const demoAuthChangeEvent = "upnext-demo-auth-change";

function rememberCandidateSession() {
  window.localStorage.setItem(demoAuthStorageKey, "candidate");
  window.dispatchEvent(new Event(demoAuthChangeEvent));
}

export function AuthPage({ mode }: AuthPageProps) {
  return mode === "login" ? <LoginPage /> : <RegisterPage />;
}

function useAuthValidationMessages() {
  const t = useTranslations("Auth");

  return {
    invalidEmail: t("validation.invalidEmail"),
    passwordRequired: t("validation.passwordRequired"),
    fullNameMin: t("validation.fullNameMin"),
    passwordMin: t("validation.passwordMin"),
    confirmRequired: t("validation.confirmRequired"),
    passwordMismatch: t("validation.passwordMismatch"),
  };
}

function LoginPage() {
  const router = useRouter();
  const t = useTranslations("Auth");
  const validationMessages = useAuthValidationMessages();
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<LoginValues>({
    resolver: zodResolver(createLoginSchema(validationMessages)),
    defaultValues: { email: "", password: "" },
  });

  async function submit(values: LoginValues) {
    try {
      const response = await loginCandidate(values);
      localStorage.setItem("upnext.candidate.accessToken", response.accessToken);
      localStorage.setItem("upnext.candidate.tokenType", response.tokenType);
      localStorage.setItem("upnext.candidate.user", JSON.stringify(response.user));
      rememberCandidateSession();
      router.push("/candidate/profile");
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 401) {
          form.setError("password", { message: "Email hoặc mật khẩu không chính xác." });
        } else {
          form.setError("root", { message: error.message || "Đã xảy ra lỗi, vui lòng thử lại." });
        }
      } else {
        form.setError("root", { message: "Không thể kết nối đến máy chủ." });
      }
    }
  }

  return (
    <AuthShell label={t("login.ariaLabel")}>
      <div className="login-auth-inner">
        <h1 className="login-title">{t("login.title")}</h1>

        <SocialButtons
          onSuccess={() => {
            rememberCandidateSession();
            router.push("/candidate/profile");
          }}
        />

        <div className="login-divider">
          <span>{t("common.or")}</span>
        </div>

        <form className="login-form" onSubmit={form.handleSubmit(submit)}>
          {form.formState.errors.root && (
            <div
              className="login-field-error mb-4 text-center"
              style={{
                backgroundColor: "#fef2f2",
                border: "1px solid #fca5a5",
                padding: "10px",
                borderRadius: "8px",
              }}
            >
              {form.formState.errors.root.message}
            </div>
          )}
          <div className="login-field">
            <label className="login-field-label" htmlFor="login-email">
              {t("fields.email")}
            </label>
            <div className="login-input">
              <EnvelopeSimple size={18} />
              <input
                id="login-email"
                {...form.register("email")}
                type="email"
                placeholder={t("fields.emailPlaceholder")}
                autoComplete="email"
              />
            </div>
            <FieldError message={form.formState.errors.email?.message} />
          </div>

          <div className="login-field">
            <label className="login-field-label" htmlFor="login-password">
              {t("fields.password")}
            </label>
            <div className="login-input">
              <LockKey size={18} />
              <input
                id="login-password"
                {...form.register("password")}
                type={showPassword ? "text" : "password"}
                placeholder={t("fields.passwordPlaceholder")}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="login-eye"
                aria-label={showPassword ? t("common.hidePassword") : t("common.showPassword")}
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <FieldError message={form.formState.errors.password?.message} />
          </div>

          <button type="button" className="login-forgot" onClick={() => router.push("/login")}>
            {t("login.forgotPassword")}
          </button>

          <button type="submit" className="login-submit">
            {t("login.submit")}
          </button>
        </form>

        <p className="login-signup">
          {t("login.signupPrompt")}{" "}
          <button type="button" onClick={() => router.push("/register")}>
            {t("login.signupLink")}
          </button>
        </p>
      </div>
    </AuthShell>
  );
}

function RegisterPage() {
  const router = useRouter();
  const t = useTranslations("Auth");
  const validationMessages = useAuthValidationMessages();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const form = useForm<RegisterValues>({
    resolver: zodResolver(createRegisterSchema(validationMessages)),
    defaultValues: { fullName: "", email: "", password: "", confirm: "" },
  });

  async function submit(values: RegisterValues) {
    try {
      const response = await registerCandidate(values);
      localStorage.setItem("upnext.candidate.accessToken", response.accessToken);
      localStorage.setItem("upnext.candidate.tokenType", response.tokenType);
      localStorage.setItem("upnext.candidate.user", JSON.stringify(response.user));
      rememberCandidateSession();
      router.push("/candidate/profile");
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 409) {
          form.setError("email", { message: "Email này đã được sử dụng." });
        } else {
          form.setError("root", { message: error.message || "Đã xảy ra lỗi, vui lòng thử lại." });
        }
      } else {
        form.setError("root", { message: "Không thể kết nối đến máy chủ." });
      }
    }
  }

  return (
    <AuthShell label={t("register.ariaLabel")}>
      <div className="login-auth-inner">
        <h1 className="login-title">{t("register.title")}</h1>

        <SocialButtons
          onSuccess={() => {
            rememberCandidateSession();
            router.push("/candidate/profile");
          }}
        />

        <div className="login-divider">
          <span>{t("common.or")}</span>
        </div>

        <form className="login-form" onSubmit={form.handleSubmit(submit)}>
          {form.formState.errors.root && (
            <div
              className="login-field-error mb-4 text-center"
              style={{
                backgroundColor: "#fef2f2",
                border: "1px solid #fca5a5",
                padding: "10px",
                borderRadius: "8px",
              }}
            >
              {form.formState.errors.root.message}
            </div>
          )}
          <div className="login-field">
            <label className="login-field-label" htmlFor="register-full-name">
              {t("fields.fullName")}
            </label>
            <div className="login-input">
              <User size={18} />
              <input
                id="register-full-name"
                {...form.register("fullName")}
                type="text"
                placeholder={t("fields.fullNamePlaceholder")}
                autoComplete="name"
              />
            </div>
            <FieldError message={form.formState.errors.fullName?.message} />
          </div>

          <div className="login-field">
            <label className="login-field-label" htmlFor="register-email">
              {t("fields.email")}
            </label>
            <div className="login-input">
              <EnvelopeSimple size={18} />
              <input
                id="register-email"
                {...form.register("email")}
                type="email"
                placeholder={t("fields.emailPlaceholder")}
                autoComplete="email"
              />
            </div>
            <FieldError message={form.formState.errors.email?.message} />
          </div>

          <div className="login-field">
            <label className="login-field-label" htmlFor="register-password">
              {t("fields.password")}
            </label>
            <div className="login-input">
              <LockKey size={18} />
              <input
                id="register-password"
                {...form.register("password")}
                type={showPassword ? "text" : "password"}
                placeholder={t("fields.createPasswordPlaceholder")}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="login-eye"
                aria-label={showPassword ? t("common.hidePassword") : t("common.showPassword")}
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <FieldError message={form.formState.errors.password?.message} />
          </div>

          <div className="login-field">
            <label className="login-field-label" htmlFor="register-confirm">
              {t("fields.confirmPassword")}
            </label>
            <div className="login-input">
              <LockKey size={18} />
              <input
                id="register-confirm"
                {...form.register("confirm")}
                type={showConfirm ? "text" : "password"}
                placeholder={t("fields.confirmPasswordPlaceholder")}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="login-eye"
                aria-label={showConfirm ? t("common.hidePassword") : t("common.showPassword")}
                onClick={() => setShowConfirm((value) => !value)}
              >
                {showConfirm ? <EyeSlash size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <FieldError message={form.formState.errors.confirm?.message} />
          </div>

          <button type="submit" className="login-submit">
            {t("register.submit")}
          </button>
        </form>

        <p className="login-signup">
          {t("register.loginPrompt")}{" "}
          <button type="button" onClick={() => router.push("/login")}>
            {t("register.loginLink")}
          </button>
        </p>
      </div>
    </AuthShell>
  );
}

function AuthShell({ label, children }: { label: string; children: React.ReactNode }) {
  const router = useRouter();
  const t = useTranslations("Auth");

  return (
    <main className="login-page">
      <section className="login-auth" aria-label={label}>
        <button
          type="button"
          className="login-logo"
          onClick={() => router.push("/")}
          aria-label={t("common.homeLabel")}
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

        {children}
      </section>

      <section className="login-showcase" aria-hidden="true">
        <Image src="/anh.png" alt="UpNext Showcase" fill priority className="object-cover" />
      </section>
    </main>
  );
}

function SocialButtons({ onSuccess }: { onSuccess: () => void }) {
  const t = useTranslations("Auth");

  return (
    <div className="login-oauth">
      <button type="button" className="login-oauth-btn login-oauth-google" onClick={onSuccess}>
        <GoogleMark />
        <span>{t("social.google")}</span>
      </button>
      <button type="button" className="login-oauth-btn login-oauth-github" onClick={onSuccess}>
        <GithubLogo size={19} weight="bold" />
        <span>{t("social.github")}</span>
      </button>
    </div>
  );
}

function FieldError({ message }: { message: string | undefined }) {
  if (!message) return null;
  return <span className="login-field-error">{message}</span>;
}

function GoogleMark() {
  return (
    <svg className="login-google-mark" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
