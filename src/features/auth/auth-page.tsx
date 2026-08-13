"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { EnvelopeSimple, Eye, EyeSlash, GithubLogo, LockKey, User } from "@phosphor-icons/react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import {
  confirmCandidatePasswordReset,
  loginCandidate,
  registerCandidate,
  requestCandidatePasswordReset,
} from "@/features/candidate/api/auth";
import { saveCandidateSession } from "@/features/candidate/session";
import { upnextLogo } from "@/features/public/home/brand";
import { Link, useRouter } from "@/i18n/navigation";
import { ApiError, createApiUrl } from "@/shared/api/http";
import { toast } from "@/shared/ui/toast";

import "./auth-page.css";
import {
  createForgotPasswordSchema,
  createLoginSchema,
  createRegisterSchema,
  createResetPasswordSchema,
  type ForgotPasswordValues,
  type LoginValues,
  type RegisterValues,
  type ResetPasswordValues,
} from "./schemas/auth-schema";

type AuthPageProps = Readonly<{
  mode: "login" | "register" | "forgot-password" | "reset-password";
}>;

const demoAuthStorageKey = "upnext.demo.auth";
const demoAuthChangeEvent = "upnext-demo-auth-change";

function rememberCandidateSession() {
  window.localStorage.setItem(demoAuthStorageKey, "candidate");
  window.dispatchEvent(new Event(demoAuthChangeEvent));
}

export function AuthPage({ mode }: AuthPageProps) {
  return (
    <Suspense fallback={null}>
      {mode === "login" ? (
        <LoginPage />
      ) : mode === "register" ? (
        <RegisterPage />
      ) : mode === "forgot-password" ? (
        <ForgotPasswordPage />
      ) : (
        <ResetPasswordPage />
      )}
    </Suspense>
  );
}

function useAuthValidationMessages() {
  const t = useTranslations("Auth");

  return {
    emailRequired: t("validation.emailRequired"),
    invalidEmail: t("validation.invalidEmail"),
    emailMax: t("validation.emailMax"),
    passwordRequired: t("validation.passwordRequired"),
    fullNameMin: t("validation.fullNameMin"),
    fullNameMax: t("validation.fullNameMax"),
    passwordMin: t("validation.passwordMin"),
    passwordMax: t("validation.passwordMax"),
    confirmRequired: t("validation.confirmRequired"),
    passwordMismatch: t("validation.passwordMismatch"),
  };
}

function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect");
  const oauthError = searchParams.get("error");
  const t = useTranslations("Auth");
  const validationMessages = useAuthValidationMessages();
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<LoginValues>({
    resolver: zodResolver(createLoginSchema(validationMessages)),
    defaultValues: { email: "", password: "" },
    mode: "onBlur",
    reValidateMode: "onChange",
  });
  const emailError = form.formState.errors.email?.message;
  const passwordError = form.formState.errors.password?.message;
  const isSubmitting = form.formState.isSubmitting;

  useEffect(() => {
    if (!oauthError) return;

    toast.error(t("oauth.failedTitle"), {
      description: t("oauth.failedDescription"),
      id: "candidate-oauth-error",
    });
  }, [oauthError, t]);

  async function submit(values: LoginValues) {
    try {
      const session = await loginCandidate(values);
      saveCandidateSession(session);
      rememberCandidateSession();
      toast.success(t("login.successTitle"), {
        description: t("login.successDescription"),
        id: "candidate-login-success",
      });
      const cleanRedirect = redirectTarget
        ? redirectTarget.replace(/^\/(?:vi|en)(?=\/|$)/, "")
        : "";
      router.replace(cleanRedirect || "/candidate/profile");
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        form.setError("password", { message: t("errors.invalidCredentials") });
        return;
      }

      form.setError("root", {
        message:
          error instanceof ApiError ? t("errors.requestFailed") : t("errors.connectionFailed"),
      });
    }
  }

  return (
    <AuthShell label={t("login.ariaLabel")}>
      <div className="login-auth-inner">
        <h1 className="login-title">{t("login.title")}</h1>
        <p className="login-subtitle">{t("login.subtitle")}</p>

        <SocialAuthOptions
          dividerLabel={t("login.emailDivider")}
          googleLabel={t("login.google")}
          githubLabel={t("login.github")}
          githubUnavailableLabel={t("social.githubUnavailable")}
        />

        <form
          className="login-form"
          method="post"
          noValidate
          aria-busy={isSubmitting}
          onSubmit={form.handleSubmit(submit)}
        >
          <FormAlert message={form.formState.errors.root?.message} />

          <div className="login-field">
            <label className="login-field-label" htmlFor="login-email">
              {t("fields.email")}
            </label>
            <div className="login-input">
              <EnvelopeSimple size={18} aria-hidden="true" />
              <input
                id="login-email"
                {...form.register("email")}
                type="email"
                placeholder={t("fields.emailPlaceholder")}
                autoComplete="email"
                maxLength={255}
                spellCheck={false}
                aria-invalid={Boolean(emailError) || undefined}
                aria-describedby={emailError ? "login-email-error" : undefined}
              />
            </div>
            <FieldError id="login-email-error" message={emailError} />
          </div>

          <div className="login-field">
            <label className="login-field-label" htmlFor="login-password">
              {t("fields.password")}
            </label>
            <div className="login-input">
              <LockKey size={18} aria-hidden="true" />
              <input
                id="login-password"
                {...form.register("password")}
                type={showPassword ? "text" : "password"}
                placeholder={t("fields.passwordPlaceholder")}
                autoComplete="current-password"
                maxLength={72}
                aria-invalid={Boolean(passwordError) || undefined}
                aria-describedby={passwordError ? "login-password-error" : undefined}
              />
              <button
                type="button"
                className="login-eye"
                aria-label={showPassword ? t("common.hidePassword") : t("common.showPassword")}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? (
                  <Eye size={18} aria-hidden="true" />
                ) : (
                  <EyeSlash size={18} aria-hidden="true" />
                )}
              </button>
            </div>
            <FieldError id="login-password-error" message={passwordError} />
          </div>

          <div className="login-password-action">
            <Link href="/candidate/forgot-password">{t("login.forgotPassword")}</Link>
          </div>

          <button type="submit" className="login-submit" disabled={isSubmitting}>
            {isSubmitting ? t("login.submitting") : t("login.submit")}
          </button>
        </form>

        <p className="login-switch">
          {t("login.signupPrompt")} <Link href="/register">{t("login.signupLink")}</Link>
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
    mode: "onBlur",
    reValidateMode: "onChange",
  });
  const fullNameError = form.formState.errors.fullName?.message;
  const emailError = form.formState.errors.email?.message;
  const passwordError = form.formState.errors.password?.message;
  const confirmError = form.formState.errors.confirm?.message;
  const isSubmitting = form.formState.isSubmitting;
  const passwordField = form.register("password");

  async function submit(values: RegisterValues) {
    try {
      const session = await registerCandidate({
        email: values.email,
        fullName: values.fullName,
        password: values.password,
      });
      saveCandidateSession(session);
      rememberCandidateSession();
      toast.success(t("register.successTitle"), {
        description: t("register.successDescription"),
        id: "candidate-register-success",
      });
      router.replace("/candidate/profile");
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        form.setError("email", { message: t("errors.emailInUse") });
        return;
      }

      form.setError("root", {
        message:
          error instanceof ApiError ? t("errors.requestFailed") : t("errors.connectionFailed"),
      });
    }
  }

  return (
    <AuthShell label={t("register.ariaLabel")}>
      <div className="login-auth-inner">
        <h1 className="login-title">{t("register.title")}</h1>
        <p className="login-subtitle">{t("register.subtitle")}</p>

        <SocialAuthOptions
          dividerLabel={t("register.emailDivider")}
          googleLabel={t("register.google")}
          githubLabel={t("register.github")}
          githubUnavailableLabel={t("social.githubUnavailable")}
        />

        <form
          className="login-form"
          method="post"
          noValidate
          aria-busy={isSubmitting}
          onSubmit={form.handleSubmit(submit)}
        >
          <FormAlert message={form.formState.errors.root?.message} />

          <div className="login-field">
            <label className="login-field-label" htmlFor="register-full-name">
              {t("fields.fullName")}
            </label>
            <div className="login-input">
              <User size={18} aria-hidden="true" />
              <input
                id="register-full-name"
                {...form.register("fullName")}
                type="text"
                placeholder={t("fields.fullNamePlaceholder")}
                autoComplete="name"
                maxLength={150}
                aria-invalid={Boolean(fullNameError) || undefined}
                aria-describedby={fullNameError ? "register-full-name-error" : undefined}
              />
            </div>
            <FieldError id="register-full-name-error" message={fullNameError} />
          </div>

          <div className="login-field">
            <label className="login-field-label" htmlFor="register-email">
              {t("fields.email")}
            </label>
            <div className="login-input">
              <EnvelopeSimple size={18} aria-hidden="true" />
              <input
                id="register-email"
                {...form.register("email")}
                type="email"
                placeholder={t("fields.emailPlaceholder")}
                autoComplete="email"
                maxLength={255}
                spellCheck={false}
                aria-invalid={Boolean(emailError) || undefined}
                aria-describedby={emailError ? "register-email-error" : undefined}
              />
            </div>
            <FieldError id="register-email-error" message={emailError} />
          </div>

          <div className="login-password-grid">
            <div className="login-field">
              <label className="login-field-label" htmlFor="register-password">
                {t("fields.password")}
              </label>
              <div className="login-input">
                <LockKey size={18} aria-hidden="true" />
                <input
                  id="register-password"
                  {...passwordField}
                  type={showPassword ? "text" : "password"}
                  placeholder={t("fields.createPasswordPlaceholder")}
                  autoComplete="new-password"
                  maxLength={72}
                  aria-invalid={Boolean(passwordError) || undefined}
                  aria-describedby={passwordError ? "register-password-error" : undefined}
                  onChange={(event) => {
                    passwordField.onChange(event);

                    if (form.getFieldState("confirm").isTouched) {
                      void form.trigger("confirm");
                    }
                  }}
                />
                <button
                  type="button"
                  className="login-eye"
                  aria-label={showPassword ? t("common.hidePassword") : t("common.showPassword")}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((value) => !value)}
                >
                  {showPassword ? (
                    <Eye size={18} aria-hidden="true" />
                  ) : (
                    <EyeSlash size={18} aria-hidden="true" />
                  )}
                </button>
              </div>
              <FieldError id="register-password-error" message={passwordError} />
            </div>

            <div className="login-field">
              <label className="login-field-label" htmlFor="register-confirm">
                {t("fields.confirmPassword")}
              </label>
              <div className="login-input">
                <LockKey size={18} aria-hidden="true" />
                <input
                  id="register-confirm"
                  {...form.register("confirm")}
                  type={showConfirm ? "text" : "password"}
                  placeholder={t("fields.confirmPasswordPlaceholder")}
                  autoComplete="new-password"
                  maxLength={72}
                  aria-invalid={Boolean(confirmError) || undefined}
                  aria-describedby={confirmError ? "register-confirm-error" : undefined}
                />
                <button
                  type="button"
                  className="login-eye"
                  aria-label={showConfirm ? t("common.hidePassword") : t("common.showPassword")}
                  aria-pressed={showConfirm}
                  onClick={() => setShowConfirm((value) => !value)}
                >
                  {showConfirm ? (
                    <Eye size={18} aria-hidden="true" />
                  ) : (
                    <EyeSlash size={18} aria-hidden="true" />
                  )}
                </button>
              </div>
              <FieldError id="register-confirm-error" message={confirmError} />
            </div>
          </div>

          <button type="submit" className="login-submit" disabled={isSubmitting}>
            {isSubmitting ? t("register.submitting") : t("register.submit")}
          </button>
        </form>

        <p className="login-switch">
          {t("register.loginPrompt")} <Link href="/login">{t("register.loginLink")}</Link>
        </p>
      </div>
    </AuthShell>
  );
}

function ForgotPasswordPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("Auth");
  const validationMessages = useAuthValidationMessages();
  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(createForgotPasswordSchema(validationMessages)),
    defaultValues: { email: "" },
    mode: "onBlur",
    reValidateMode: "onChange",
  });
  const emailError = form.formState.errors.email?.message;
  const isSubmitting = form.formState.isSubmitting;

  async function submit(values: ForgotPasswordValues) {
    try {
      await requestCandidatePasswordReset(values.email, locale);
      toast.success(t("forgotPassword.successTitle"), {
        description: t("forgotPassword.successDescription"),
        id: "candidate-password-reset-request-success",
      });
      router.replace("/login");
    } catch (error) {
      form.setError("root", {
        message:
          error instanceof ApiError ? t("errors.requestFailed") : t("errors.connectionFailed"),
      });
    }
  }

  return (
    <AuthShell label={t("forgotPassword.ariaLabel")}>
      <div className="login-auth-inner">
        <h1 className="login-title">{t("forgotPassword.title")}</h1>
        <p className="login-subtitle">{t("forgotPassword.subtitle")}</p>

        <form
          className="login-form"
          method="post"
          noValidate
          aria-busy={isSubmitting}
          onSubmit={form.handleSubmit(submit)}
        >
          <FormAlert message={form.formState.errors.root?.message} />

          <div className="login-field">
            <label className="login-field-label" htmlFor="forgot-password-email">
              {t("fields.email")}
            </label>
            <div className="login-input">
              <EnvelopeSimple size={18} aria-hidden="true" />
              <input
                id="forgot-password-email"
                {...form.register("email")}
                type="email"
                placeholder={t("fields.emailPlaceholder")}
                autoComplete="email"
                maxLength={255}
                spellCheck={false}
                aria-invalid={Boolean(emailError) || undefined}
                aria-describedby={emailError ? "forgot-password-email-error" : undefined}
              />
            </div>
            <FieldError id="forgot-password-email-error" message={emailError} />
          </div>

          <button type="submit" className="login-submit" disabled={isSubmitting}>
            {isSubmitting ? t("forgotPassword.submitting") : t("forgotPassword.submit")}
          </button>
        </form>

        <p className="login-switch">
          {t("forgotPassword.loginPrompt")} <Link href="/login">{t("register.loginLink")}</Link>
        </p>
      </div>
    </AuthShell>
  );
}

function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const t = useTranslations("Auth");
  const validationMessages = useAuthValidationMessages();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(createResetPasswordSchema(validationMessages)),
    defaultValues: { password: "", confirm: "" },
    mode: "onBlur",
    reValidateMode: "onChange",
  });
  const passwordError = form.formState.errors.password?.message;
  const confirmError = form.formState.errors.confirm?.message;
  const isSubmitting = form.formState.isSubmitting;
  const passwordField = form.register("password");
  const resetError = token ? form.formState.errors.root?.message : t("errors.resetTokenInvalid");

  async function submit(values: ResetPasswordValues) {
    if (!token) return;

    try {
      await confirmCandidatePasswordReset({ token, password: values.password });
      toast.success(t("resetPassword.successTitle"), {
        description: t("resetPassword.successDescription"),
        id: "candidate-password-reset-success",
      });
      router.replace("/login");
    } catch (error) {
      const isInvalidToken =
        error instanceof ApiError && (error.status === 400 || error.status === 401);

      form.setError("root", {
        message: isInvalidToken
          ? t("errors.resetTokenInvalid")
          : error instanceof ApiError
            ? t("errors.requestFailed")
            : t("errors.connectionFailed"),
      });
    }
  }

  return (
    <AuthShell label={t("resetPassword.ariaLabel")}>
      <div className="login-auth-inner">
        <h1 className="login-title">{t("resetPassword.title")}</h1>
        <p className="login-subtitle">{t("resetPassword.subtitle")}</p>

        <form
          className="login-form"
          method="post"
          noValidate
          aria-busy={isSubmitting}
          onSubmit={form.handleSubmit(submit)}
        >
          <FormAlert message={resetError} />

          <div className="login-password-grid">
            <div className="login-field">
              <label className="login-field-label" htmlFor="reset-password-password">
                {t("resetPassword.passwordLabel")}
              </label>
              <div className="login-input">
                <LockKey size={18} aria-hidden="true" />
                <input
                  id="reset-password-password"
                  {...passwordField}
                  type={showPassword ? "text" : "password"}
                  placeholder={t("fields.createPasswordPlaceholder")}
                  autoComplete="new-password"
                  maxLength={72}
                  aria-invalid={Boolean(passwordError) || undefined}
                  aria-describedby={passwordError ? "reset-password-password-error" : undefined}
                  onChange={(event) => {
                    passwordField.onChange(event);

                    if (form.getFieldState("confirm").isTouched) {
                      void form.trigger("confirm");
                    }
                  }}
                />
                <button
                  type="button"
                  className="login-eye"
                  aria-label={showPassword ? t("common.hidePassword") : t("common.showPassword")}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((value) => !value)}
                >
                  {showPassword ? (
                    <Eye size={18} aria-hidden="true" />
                  ) : (
                    <EyeSlash size={18} aria-hidden="true" />
                  )}
                </button>
              </div>
              <FieldError id="reset-password-password-error" message={passwordError} />
            </div>

            <div className="login-field">
              <label className="login-field-label" htmlFor="reset-password-confirm">
                {t("fields.confirmPassword")}
              </label>
              <div className="login-input">
                <LockKey size={18} aria-hidden="true" />
                <input
                  id="reset-password-confirm"
                  {...form.register("confirm")}
                  type={showConfirm ? "text" : "password"}
                  placeholder={t("fields.confirmPasswordPlaceholder")}
                  autoComplete="new-password"
                  maxLength={72}
                  aria-invalid={Boolean(confirmError) || undefined}
                  aria-describedby={confirmError ? "reset-password-confirm-error" : undefined}
                />
                <button
                  type="button"
                  className="login-eye"
                  aria-label={showConfirm ? t("common.hidePassword") : t("common.showPassword")}
                  aria-pressed={showConfirm}
                  onClick={() => setShowConfirm((value) => !value)}
                >
                  {showConfirm ? (
                    <Eye size={18} aria-hidden="true" />
                  ) : (
                    <EyeSlash size={18} aria-hidden="true" />
                  )}
                </button>
              </div>
              <FieldError id="reset-password-confirm-error" message={confirmError} />
            </div>
          </div>

          <button type="submit" className="login-submit" disabled={!token || isSubmitting}>
            {isSubmitting ? t("resetPassword.submitting") : t("resetPassword.submit")}
          </button>
        </form>

        <p className="login-switch">
          {t("resetPassword.loginPrompt")} <Link href="/login">{t("register.loginLink")}</Link>
        </p>
      </div>
    </AuthShell>
  );
}

function AuthShell({ label, children }: Readonly<{ label: string; children: React.ReactNode }>) {
  const t = useTranslations("Auth");

  return (
    <main className="login-page">
      <aside className="login-showcase" aria-hidden="true">
        <Image
          src="/login/topography.png"
          alt=""
          fill
          priority
          sizes="(min-width: 841px) 47vw, 0px"
          className="login-showcase-pattern"
        />
        <div className="login-showcase-content">
          <p className="login-showcase-heading">{t("showcase.title")}</p>
          <p className="login-showcase-description">{t("showcase.description")}</p>
          <div className="login-showcase-brand">
            <Image
              src={upnextLogo.whiteWordmark}
              alt=""
              width={300}
              height={300}
              className="login-showcase-wordmark"
            />
          </div>
        </div>
      </aside>

      <section className="login-auth" aria-label={label}>
        <Link href="/" className="login-logo" aria-label={t("common.homeLabel")}>
          <Image src={upnextLogo.wordmark} alt="UpNext" width={143} height={34} priority />
        </Link>
        {children}
      </section>
    </main>
  );
}

function SocialAuthOptions({
  dividerLabel,
  googleLabel,
  githubLabel,
  githubUnavailableLabel,
}: Readonly<{
  dividerLabel: string;
  googleLabel: string;
  githubLabel: string;
  githubUnavailableLabel: string;
}>) {
  const locale = useLocale();
  const t = useTranslations("Auth");

  return (
    <>
      <div className="login-social-actions">
        <button
          type="button"
          className="login-social-button login-social-button-google"
          onClick={() =>
            window.location.assign(createApiUrl(`candidate/auth/google?locale=${locale}`))
          }
        >
          <span className="login-social-provider-icon" aria-hidden="true">
            <Image src="/assets/google.png" alt="" width={18} height={18} />
          </span>
          <span>{googleLabel}</span>
        </button>
        <button
          type="button"
          className="login-social-button login-social-button-github"
          disabled
          aria-label={`${githubLabel} — ${githubUnavailableLabel}`}
          title={githubUnavailableLabel}
        >
          <span className="login-social-provider-icon" aria-hidden="true">
            <GithubLogo size={19} weight="fill" />
          </span>
          <span>{githubLabel}</span>
          <span className="login-social-badge">{t("social.githubSoon")}</span>
        </button>
      </div>
      <div className="login-email-divider" aria-hidden="true">
        <span />
        <p>{dividerLabel}</p>
        <span />
      </div>
    </>
  );
}

function FormAlert({ message }: Readonly<{ message: string | undefined }>) {
  if (!message) return null;

  return (
    <div className="login-form-alert" aria-live="polite">
      {message}
    </div>
  );
}

function FieldError({ id, message }: Readonly<{ id: string; message: string | undefined }>) {
  if (!message) return null;

  return (
    <span id={id} className="login-field-error" aria-live="polite">
      {message}
    </span>
  );
}
