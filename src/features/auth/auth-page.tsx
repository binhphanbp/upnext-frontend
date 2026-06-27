"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowRight,
  Briefcase,
  EnvelopeSimple,
  Eye,
  EyeSlash,
  GithubLogo,
  LockKey,
  User,
} from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { upnextLogo } from "@/features/public/home/brand";
import { useRouter } from "@/i18n/navigation";

import "./auth-page.css";
import { loginCandidate, registerCandidate } from "../candidate/api/auth";
import { saveCandidateSession } from "../candidate/session";
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

const showcaseCards = [
  { title: "Frontend Engineer", meta: "React · TypeScript", tone: "mint" },
  { title: "Senior Backend", meta: "Go · PostgreSQL", tone: "indigo" },
  { title: "Product Designer", meta: "Design System", tone: "sky" },
  { title: "AI Engineer", meta: "LLM · MLOps", tone: "dark" },
  { title: "DevOps Lead", meta: "Kubernetes", tone: "amber" },
  { title: "Data Analyst", meta: "SQL · BI", tone: "rose" },
  { title: "Mobile Developer", meta: "React Native", tone: "violet" },
  { title: "QA Automation", meta: "Playwright", tone: "slate" },
  { title: "Cloud Engineer", meta: "AWS · Terraform", tone: "green" },
];

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
      const session = await loginCandidate(values);
      saveCandidateSession(session);
      rememberCandidateSession();
      router.push("/candidate/profile");
    } catch {
      form.setError("root", {
        message: "Không thể đăng nhập. Vui lòng kiểm tra email hoặc mật khẩu.",
      });
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
          <FieldError message={form.formState.errors.root?.message} />
        </form>

        <p className="login-signup">
          {t("login.signupPrompt")}{" "}
          <button type="button" onClick={() => router.push("/register")}>
            {t("login.signupLink")}
          </button>
        </p>

        <EmployerButton />
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
      const session = await registerCandidate({
        email: values.email,
        fullName: values.fullName,
        password: values.password,
      });
      saveCandidateSession(session);
      rememberCandidateSession();
      router.push("/candidate/profile");
    } catch {
      form.setError("root", {
        message: "Không thể đăng ký. Email có thể đã tồn tại hoặc dữ liệu chưa hợp lệ.",
      });
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
          <FieldError message={form.formState.errors.root?.message} />
        </form>

        <p className="login-signup">
          {t("register.loginPrompt")}{" "}
          <button type="button" onClick={() => router.push("/login")}>
            {t("register.loginLink")}
          </button>
        </p>

        <EmployerButton />
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
        <div className="login-showcase-copy">
          <span>UpNext workspace</span>
          <strong>Curated IT opportunities, shaped for every career move.</strong>
        </div>
        <div className="login-gallery">
          {[0, 1, 2].map((column) => (
            <div className="login-gallery-column" key={column}>
              {showcaseCards
                .filter((_, index) => index % 3 === column)
                .map((card, index) => (
                  <article className={`login-gallery-card is-${card.tone}`} key={card.title}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <h2>{card.title}</h2>
                    <p>{card.meta}</p>
                  </article>
                ))}
            </div>
          ))}
        </div>
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

function EmployerButton() {
  const router = useRouter();
  const t = useTranslations("Auth");

  return (
    <button type="button" className="login-employer" onClick={() => router.push("/register")}>
      <Briefcase size={17} />
      <span>{t("common.employerCta")}</span>
      <ArrowRight size={16} />
    </button>
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
        fill="#fff"
        d="M21.6 12.23c0-.78-.07-1.53-.2-2.23H12v4.22h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.52Z"
      />
      <path
        fill="#fff"
        d="M12 22c2.7 0 4.96-.9 6.62-2.44l-3.24-2.51c-.9.6-2.04.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H3.06v2.59A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#fff"
        d="M6.41 13.89A6 6 0 0 1 6.1 12c0-.65.11-1.29.31-1.89V7.52H3.06A10 10 0 0 0 2 12c0 1.61.39 3.14 1.06 4.48l3.35-2.59Z"
      />
      <path
        fill="#fff"
        d="M12 5.99c1.47 0 2.79.51 3.83 1.5l2.86-2.86C16.95 3.01 14.69 2 12 2a10 10 0 0 0-8.94 5.52l3.35 2.59C7.2 7.75 9.4 5.99 12 5.99Z"
      />
    </svg>
  );
}
