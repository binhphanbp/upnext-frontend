"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CaretLeft, CaretRight, Eye, EyeSlash } from "@phosphor-icons/react";
import { useTranslations, useLocale } from "next-intl";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useState, useEffect, type FocusEvent } from "react";
import { useForm, type FieldErrors, type UseFormRegisterReturn } from "react-hook-form";
import Swal, { type SweetAlertIcon } from "sweetalert2";
import { z } from "zod";

import { createLoginSchema, type LoginValues } from "@/features/auth/schemas/auth-schema";
import {
  confirmRecruiterPasswordReset,
  loginRecruiter,
  registerRecruiter,
  requestRecruiterPasswordReset,
} from "@/features/recruiter/api/auth";
import {
  clearRecruiterEmailVerificationPending,
  clearRecruiterSession,
  isRecruiterEmailVerificationPending,
  markRecruiterEmailVerificationPending,
} from "@/features/recruiter/session";
import { useRouter, usePathname } from "@/i18n/navigation";
import { ApiError } from "@/shared/api/http";
import { env } from "@/shared/lib/env";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Checkbox } from "@/shared/ui/checkbox";
import { FormInput } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Separator } from "@/shared/ui/separator";

import "./login-page.css";

type RecruiterRegisterValues = {
  email: string;
  password: string;
  confirm: string;
};

type ForgotPasswordValues = {
  email: string;
};

type ResetPasswordValues = {
  password: string;
  confirm: string;
};

const authInputClassName =
  "recruiter-auth-input h-11 rounded-lg border-slate-200 bg-white text-sm shadow-none placeholder:text-slate-400";

const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3200,
  timerProgressBar: true,
});

const COMPANY_ONBOARDING_SKIP_KEY_PREFIX = "skippedRecruiterCompanyOnboarding";

function showToast(icon: SweetAlertIcon, title: string) {
  void Toast.fire({ icon, title });
}

function isRecruiterAuthEmailUnverified(response: unknown) {
  const user = (response as { user?: Record<string, unknown> })?.user;
  const emailVerified = user?.emailVerified ?? user?.email_verified;
  const status = typeof user?.status === "string" ? user.status.toUpperCase() : "";

  return (
    emailVerified === false ||
    status.includes("UNVERIFIED") ||
    status.includes("PENDING_EMAIL") ||
    status.includes("EMAIL_VERIFICATION")
  );
}

function getAuthErrorMessage(
  error: unknown,
  context: "login" | "register" | "forgot-password" | "reset-password",
  t: any,
) {
  if (!(error instanceof ApiError)) {
    return t("errors.default");
  }

  if (error.status === 400) {
    return t("errors.invalidData");
  }

  if (error.status === 401) {
    return context === "reset-password"
      ? t("errors.resetTokenInvalid")
      : t("errors.invalidCredentials");
  }

  if (error.status === 403) {
    return error.message || t("errors.emailNotVerified");
  }

  if (error.status === 409) {
    return t("errors.emailAlreadyRegistered");
  }

  if (error.status >= 500) {
    return t("errors.systemError");
  }

  return t("errors.processFailed");
}

function getFirstErrorMessage(errors: FieldErrors, t: any): string {
  for (const error of Object.values(errors)) {
    if (!error) continue;

    if ("message" in error && typeof error.message === "string") {
      return error.message;
    }

    if (typeof error === "object") {
      const nested: string = getFirstErrorMessage(error as FieldErrors, t);

      if (nested) return nested;
    }
  }

  return t("errors.invalidForm");
}

function setAuthInputFocusStyle(event: FocusEvent<HTMLInputElement>) {
  event.currentTarget.style.setProperty("border-color", "#10a778", "important");
}

function resetAuthInputFocusStyle(
  event: FocusEvent<HTMLInputElement>,
  register: UseFormRegisterReturn,
) {
  event.currentTarget.style.removeProperty("border-color");
  void register.onBlur(event);
}

export function RecruiterLoginPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tAuth = useTranslations("Auth");
  const t = useTranslations("RecruiterAuth");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const errorParam = searchParams.get("error");
    const verifiedParam = searchParams.get("verified");
    if (errorParam || verifiedParam) {
      showToast(errorParam ? "error" : "success", errorParam || t("login.emailVerified"));
      const params = new URLSearchParams(window.location.search);
      params.delete("error");
      params.delete("verified");
      const newSearch = params.toString();
      // `useRouter` expects a locale-free pathname. Passing
      // `window.location.pathname` here includes `/vi` (or `/en`), so
      // next-intl prepends the locale a second time: `/vi/vi/recruiter/login`.
      router.replace(newSearch ? `${pathname}?${newSearch}` : pathname);
    }
  }, [pathname, searchParams, router]);

  const form = useForm<LoginValues>({
    resolver: zodResolver(
      createLoginSchema({
        invalidEmail: tAuth("validation.invalidEmail"),
        passwordRequired: tAuth("validation.passwordRequired"),
        fullNameMin: tAuth("validation.fullNameMin"),
        passwordMin: tAuth("validation.passwordMin"),
        confirmRequired: tAuth("validation.confirmRequired"),
        passwordMismatch: tAuth("validation.passwordMismatch"),
      }),
    ),
    defaultValues: { email: "", password: "" },
  });

  async function submit(values: LoginValues) {
    try {
      const response = await loginRecruiter(values);

      if (
        isRecruiterEmailVerificationPending(values.email) ||
        isRecruiterAuthEmailUnverified(response)
      ) {
        clearRecruiterSession();
        showToast("warning", t("login.emailVerificationRequired"));
        router.push(`/recruiter/register/success?email=${encodeURIComponent(values.email)}`);
        return;
      }

      clearRecruiterEmailVerificationPending(values.email);
      localStorage.removeItem(`${COMPANY_ONBOARDING_SKIP_KEY_PREFIX}_${response.user.id}`);
      localStorage.setItem("upnext.recruiter.accessToken", response.accessToken);
      localStorage.setItem("upnext.recruiter.refreshToken", response.refreshToken);
      localStorage.setItem("upnext.recruiter.tokenType", response.tokenType);
      localStorage.setItem("upnext.recruiter.user", JSON.stringify(response.user));
      showToast("success", t("login.success"));
      router.push(searchParams.get("redirect") || "/recruiter");
    } catch (error) {
      if (error instanceof ApiError && error.status === 403) {
        showToast("warning", t("login.emailVerificationRequired"));
        router.push(`/recruiter/register/success?email=${encodeURIComponent(values.email)}`);
        return;
      }
      showToast("error", getAuthErrorMessage(error, "login", t));
    }
  }

  return (
    <RecruiterAuthShell>
      <AuthHeader title={t("login.title")} />
      <SocialButtons mode="login" />
      <AuthDivider label={t("login.orDivider")} />

      <form
        className="mt-8 space-y-5"
        onSubmit={form.handleSubmit(submit, (errors) =>
          showToast("error", getFirstErrorMessage(errors, t)),
        )}
        noValidate
      >
        <EmailField inputId="recruiter-email" register={form.register("email")} />

        <PasswordField
          autoComplete="current-password"
          inputId="recruiter-password"
          label={t("login.passwordLabel")}
          placeholder={t("login.passwordPlaceholder")}
          setVisible={setShowPassword}
          visible={showPassword}
          register={form.register("password")}
          action={
            <button
              type="button"
              className="upnext-focus rounded text-xs font-bold text-emerald-700 hover:text-emerald-800"
              onClick={() => router.push("/recruiter/forgot-password")}
            >
              {t("login.forgotPassword")}
            </button>
          }
        />

        <div className="flex items-center gap-2">
          <Checkbox
            id="remember-recruiter"
            defaultChecked
            className="size-5 rounded-[5px] border-emerald-600 data-[state=checked]:bg-emerald-600"
          />
          <Label
            htmlFor="remember-recruiter"
            className="cursor-pointer text-sm font-medium text-slate-600"
          >
            {t("login.rememberMe")}
          </Label>
        </div>

        <SubmitButton pending={form.formState.isSubmitting} pendingLabel={t("login.submitting")}>
          {t("login.submit")}
        </SubmitButton>
      </form>

      <p className="mt-6 text-sm text-slate-600">
        {t("login.signupPrompt")}{" "}
        <button
          type="button"
          className="upnext-focus ml-1 rounded font-extrabold text-emerald-700 hover:text-emerald-800"
          onClick={() => router.push("/recruiter/register")}
        >
          {t("login.signupLink")}
        </button>
      </p>
    </RecruiterAuthShell>
  );
}

export function RecruiterRegisterPage() {
  const router = useRouter();
  const tAuth = useTranslations("Auth");
  const t = useTranslations("RecruiterAuth");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const form = useForm<RecruiterRegisterValues>({
    resolver: zodResolver(
      z
        .object({
          email: z.string().email(tAuth("validation.invalidEmail")),
          password: z.string().min(8, tAuth("validation.passwordMin")),
          confirm: z.string().min(1, tAuth("validation.confirmRequired")),
        })
        .refine((values) => values.password === values.confirm, {
          message: tAuth("validation.passwordMismatch"),
          path: ["confirm"],
        }),
    ),
    defaultValues: { email: "", password: "", confirm: "" },
  });

  async function submit(values: RecruiterRegisterValues) {
    try {
      await registerRecruiter({
        email: values.email,
        password: values.password,
      });
      markRecruiterEmailVerificationPending(values.email);

      showToast("success", t("register.success"));
      router.push(`/recruiter/register/success?email=${encodeURIComponent(values.email)}`);
    } catch (error) {
      showToast("error", getAuthErrorMessage(error, "register", t));
    }
  }

  return (
    <RecruiterAuthShell>
      <AuthHeader title={t("register.title")} />
      <SocialButtons mode="register" />
      <AuthDivider label={t("register.orDivider")} />

      <form
        className="mt-8 space-y-5"
        onSubmit={form.handleSubmit(submit, (errors) =>
          showToast("error", getFirstErrorMessage(errors, t)),
        )}
        noValidate
      >
        <EmailField inputId="recruiter-register-email" register={form.register("email")} />

        <PasswordField
          autoComplete="new-password"
          inputId="recruiter-register-password"
          label={t("register.passwordLabel")}
          placeholder={t("register.passwordPlaceholder")}
          setVisible={setShowPassword}
          visible={showPassword}
          register={form.register("password")}
        />

        <PasswordField
          autoComplete="new-password"
          inputId="recruiter-register-confirm"
          label={t("register.confirmLabel")}
          placeholder={t("register.confirmPlaceholder")}
          setVisible={setShowConfirm}
          visible={showConfirm}
          register={form.register("confirm")}
        />

        <SubmitButton pending={form.formState.isSubmitting} pendingLabel={t("register.submitting")}>
          {t("register.submit")}
        </SubmitButton>
      </form>

      <p className="mt-6 text-sm text-slate-600">
        {tAuth("register.loginPrompt")}{" "}
        <button
          type="button"
          className="upnext-focus ml-1 rounded font-extrabold text-emerald-700 hover:text-emerald-800"
          onClick={() => router.push("/recruiter/login")}
        >
          {tAuth("register.loginLink")}
        </button>
      </p>
    </RecruiterAuthShell>
  );
}

export function RecruiterForgotPasswordPage() {
  const router = useRouter();
  const locale = useLocale();
  const tAuth = useTranslations("Auth");
  const t = useTranslations("RecruiterAuth");
  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(
      z.object({
        email: z.string().email(tAuth("validation.invalidEmail")),
      }),
    ),
    defaultValues: { email: "" },
  });

  async function submit(values: ForgotPasswordValues) {
    try {
      const response = await requestRecruiterPasswordReset(values.email, locale);

      showToast("success", response.message);
      router.push("/recruiter/login");
    } catch (error) {
      showToast("error", getAuthErrorMessage(error, "forgot-password", t));
    }
  }

  return (
    <RecruiterAuthShell basic>
      <AuthHeader title={t("forgotPassword.title")} />
      <p className="mt-2 text-sm leading-6 text-slate-500">{t("forgotPassword.description")}</p>
      <AuthDivider label={t("forgotPassword.orDivider")} />

      <form
        className="mt-8 space-y-5"
        onSubmit={form.handleSubmit(submit, (errors) =>
          showToast("error", getFirstErrorMessage(errors, t)),
        )}
        noValidate
      >
        <EmailField inputId="recruiter-forgot-email" register={form.register("email")} />

        <SubmitButton
          pending={form.formState.isSubmitting}
          pendingLabel={t("forgotPassword.submitting")}
        >
          {t("forgotPassword.submit")}
        </SubmitButton>
      </form>

      <p className="mt-6 text-sm text-slate-600">
        {tAuth("register.loginPrompt")}{" "}
        <button
          type="button"
          className="upnext-focus ml-1 rounded font-extrabold text-emerald-700 hover:text-emerald-800"
          onClick={() => router.push("/recruiter/login")}
        >
          {tAuth("register.loginLink")}
        </button>
      </p>
    </RecruiterAuthShell>
  );
}

export function RecruiterResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const tAuth = useTranslations("Auth");
  const t = useTranslations("RecruiterAuth");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(
      z
        .object({
          password: z.string().min(8, tAuth("validation.passwordMin")),
          confirm: z.string().min(1, tAuth("validation.confirmRequired")),
        })
        .refine((values) => values.password === values.confirm, {
          message: tAuth("validation.passwordMismatch"),
          path: ["confirm"],
        }),
    ),
    defaultValues: { password: "", confirm: "" },
  });

  async function submit(values: ResetPasswordValues) {
    if (!token) {
      showToast("error", t("errors.resetTokenInvalid"));
      return;
    }

    try {
      const response = await confirmRecruiterPasswordReset({
        token,
        password: values.password,
      });

      showToast("success", response.message);
      router.push("/recruiter/login");
    } catch (error) {
      showToast("error", getAuthErrorMessage(error, "reset-password", t));
    }
  }

  return (
    <RecruiterAuthShell basic>
      <AuthHeader title={t("resetPassword.title")} />
      <p className="mt-4 text-sm leading-6 text-slate-500">{t("resetPassword.description")}</p>
      <AuthDivider label={t("resetPassword.orDivider")} />

      <form
        className="mt-8 space-y-5"
        onSubmit={form.handleSubmit(submit, (errors) =>
          showToast("error", getFirstErrorMessage(errors, t)),
        )}
        noValidate
      >
        <PasswordField
          autoComplete="new-password"
          inputId="recruiter-reset-password"
          label={t("resetPassword.passwordLabel")}
          placeholder={t("resetPassword.passwordPlaceholder")}
          setVisible={setShowPassword}
          visible={showPassword}
          register={form.register("password")}
        />

        <PasswordField
          autoComplete="new-password"
          inputId="recruiter-reset-confirm"
          label={t("resetPassword.confirmLabel")}
          placeholder={t("resetPassword.confirmPlaceholder")}
          setVisible={setShowConfirm}
          visible={showConfirm}
          register={form.register("confirm")}
        />

        <SubmitButton
          pending={form.formState.isSubmitting}
          pendingLabel={t("resetPassword.submitting")}
        >
          {t("resetPassword.submit")}
        </SubmitButton>
      </form>

      <p className="mt-6 text-sm text-slate-600">
        {tAuth("register.loginPrompt")}{" "}
        <button
          type="button"
          className="upnext-focus ml-1 rounded font-extrabold text-emerald-700 hover:text-emerald-800"
          onClick={() => router.push("/recruiter/login")}
        >
          {tAuth("register.loginLink")}
        </button>
      </p>
    </RecruiterAuthShell>
  );
}

export function RecruiterAuthShell({
  children,
  basic = false,
}: {
  children: React.ReactNode;
  basic?: boolean;
}) {
  if (basic) {
    return (
      <main className="text-foreground relative grid min-h-screen place-items-center overflow-hidden bg-[linear-gradient(180deg,#003b3b_0%,#006347_52%,#15915d_100%)] px-4 py-10 [font-family:var(--font-sans)]">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-0 h-[520px] w-[420px] -translate-x-24 bg-[linear-gradient(135deg,rgba(255,255,255,0.10),rgba(255,255,255,0)_58%)] [clip-path:polygon(0_0,55%_0,100%_38%,54%_75%,0_18%)]" />
          <div className="absolute top-[170px] left-10 h-[410px] w-[220px] border border-white/10 bg-white/5 [clip-path:polygon(0_0,64%_50%,0_100%,24%_100%,88%_50%,24%_0)]" />
          <div className="absolute right-0 bottom-8 h-[470px] w-[340px] translate-x-16 rotate-180 bg-[linear-gradient(135deg,rgba(255,255,255,0.10),rgba(255,255,255,0)_62%)] [clip-path:polygon(0_0,55%_0,100%_38%,54%_75%,0_18%)]" />
          <div className="absolute right-8 bottom-[210px] h-[360px] w-[190px] rotate-180 border border-white/10 bg-white/5 [clip-path:polygon(0_0,64%_50%,0_100%,24%_100%,88%_50%,24%_0)]" />
        </div>

        <Card className="relative z-10 w-full max-w-[480px] overflow-hidden rounded-xl border-0 bg-white px-6 py-8 shadow-[0_28px_90px_rgba(0,28,22,0.28)] sm:px-10 sm:py-10">
          {children}
        </Card>
      </main>
    );
  }

  return (
    <main className="text-foreground relative grid min-h-screen place-items-center overflow-hidden bg-[linear-gradient(180deg,#003b3b_0%,#006347_52%,#15915d_100%)] px-4 py-10 [font-family:var(--font-sans)]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 h-[520px] w-[420px] -translate-x-24 bg-[linear-gradient(135deg,rgba(255,255,255,0.10),rgba(255,255,255,0)_58%)] [clip-path:polygon(0_0,55%_0,100%_38%,54%_75%,0_18%)]" />
        <div className="absolute top-[170px] left-10 h-[410px] w-[220px] border border-white/10 bg-white/5 [clip-path:polygon(0_0,64%_50%,0_100%,24%_100%,88%_50%,24%_0)]" />
        <div className="absolute right-0 bottom-8 h-[470px] w-[340px] translate-x-16 rotate-180 bg-[linear-gradient(135deg,rgba(255,255,255,0.10),rgba(255,255,255,0)_62%)] [clip-path:polygon(0_0,55%_0,100%_38%,54%_75%,0_18%)]" />
        <div className="absolute right-8 bottom-[210px] h-[360px] w-[190px] rotate-180 border border-white/10 bg-white/5 [clip-path:polygon(0_0,64%_50%,0_100%,24%_100%,88%_50%,24%_0)]" />
      </div>

      <Card className="relative z-10 grid w-full max-w-[1152px] overflow-hidden rounded-xl border-0 bg-white shadow-[0_28px_90px_rgba(0,28,22,0.28)] lg:grid-cols-2">
        <section className="px-6 py-8 sm:px-12 sm:py-12">{children}</section>
        <ShowcasePanel />
      </Card>
    </main>
  );
}

function FlagIcon({ code }: { code: "VI" | "EN" }) {
  return (
    <span className="inline-flex h-3.5 w-5 overflow-hidden rounded-[2px]">
      {code === "VI" ? (
        <svg aria-hidden="true" viewBox="0 0 22 16" className="h-full w-full">
          <rect width="22" height="16" fill="#DA251D" />
          <path
            fill="#FFDE00"
            d="m11 3.2 1.13 3.48h3.66l-2.96 2.15 1.13 3.47L11 10.15 8.04 12.3l1.13-3.47-2.96-2.15h3.66L11 3.2Z"
          />
        </svg>
      ) : (
        <svg aria-hidden="true" viewBox="0 0 22 16" className="h-full w-full">
          <rect width="22" height="16" fill="#012169" />
          <path stroke="#fff" strokeWidth="3.2" d="m0 0 22 16M22 0 0 16" />
          <path stroke="#C8102E" strokeWidth="1.8" d="m0 0 22 16M22 0 0 16" />
          <path stroke="#fff" strokeWidth="5.2" d="M11 0v16M0 8h22" />
          <path stroke="#C8102E" strokeWidth="3.2" d="M11 0v16M0 8h22" />
        </svg>
      )}
    </span>
  );
}

export function AuthHeader({ title }: { title: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("Auth");

  const toggleLocale = () => {
    const nextLocale = locale === "vi" ? "en" : "vi";
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <button
          type="button"
          className="upnext-focus inline-flex rounded-md"
          onClick={() => router.push("/")}
          aria-label={t("common.homeLabel")}
        >
          <Image
            alt="UpNext"
            src="/upnext-logo/wordmark-cropped.png"
            width={105}
            height={25}
            priority
            style={{ height: "auto", width: "auto" }}
          />
        </button>

        <button
          type="button"
          onClick={toggleLocale}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-950"
          aria-label="Đổi ngôn ngữ / Change language"
        >
          {locale === "vi" ? (
            <>
              <FlagIcon code="VI" />
              <span>VI</span>
            </>
          ) : (
            <>
              <FlagIcon code="EN" />
              <span>EN</span>
            </>
          )}
        </button>
      </div>

      <h1 className="mt-6 text-xl font-bold tracking-tight sm:mt-8 sm:text-2xl">{title}</h1>
    </>
  );
}

function SocialButtons({ mode }: { mode: "login" | "register" }) {
  const t = useTranslations("RecruiterAuth");
  const locale = useLocale();
  const label = mode === "login" ? t("login.google") : t("register.google");

  function handleGoogleLogin() {
    window.location.href = `${env.NEXT_PUBLIC_API_BASE_URL}/recruiter/auth/google?locale=${locale}&mode=${mode}`;
  }

  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-1">
      <Button
        variant="outline"
        className="h-12 rounded-lg border-slate-200 text-slate-700 shadow-none hover:border-slate-300 hover:text-slate-950"
        onClick={handleGoogleLogin}
      >
        <Image src="/assets/google.png" alt="" width={22} height={22} />
        {label}
      </Button>
    </div>
  );
}

function AuthDivider({ label }: { label: string }) {
  return (
    <div className="mt-8 flex items-center gap-3">
      <Separator className="flex-1 bg-slate-200" />
      <span className="text-xs font-medium text-slate-400">{label}</span>
      <Separator className="flex-1 bg-slate-200" />
    </div>
  );
}

function EmailField({ inputId, register }: { inputId: string; register: UseFormRegisterReturn }) {
  const t = useTranslations("RecruiterAuth");
  return (
    <FormInput
      id={inputId}
      label={t("login.emailLabel")}
      className={authInputClassName}
      type="email"
      placeholder={t("login.emailPlaceholder")}
      autoComplete="email"
      {...register}
      onBlur={(event) => resetAuthInputFocusStyle(event, register)}
      onFocus={setAuthInputFocusStyle}
    />
  );
}

function PasswordField({
  action,
  autoComplete,
  inputId,
  label,
  placeholder,
  register,
  setVisible,
  visible,
}: {
  action?: React.ReactNode;
  autoComplete: "current-password" | "new-password";
  inputId: string;
  label: string;
  placeholder: string;
  register: UseFormRegisterReturn;
  setVisible: React.Dispatch<React.SetStateAction<boolean>>;
  visible: boolean;
}) {
  const t = useTranslations("Auth");

  return (
    <FormInput
      id={inputId}
      label={label}
      action={action}
      className={`${authInputClassName} pr-10`}
      type={visible ? "text" : "password"}
      placeholder={placeholder}
      autoComplete={autoComplete}
      {...register}
      onBlur={(event) => resetAuthInputFocusStyle(event, register)}
      onFocus={setAuthInputFocusStyle}
      suffix={
        <button
          type="button"
          className="upnext-focus rounded text-slate-400 hover:text-slate-700"
          aria-label={visible ? t("common.hidePassword") : t("common.showPassword")}
          onClick={() => setVisible((value) => !value)}
        >
          {visible ? <EyeSlash size={18} /> : <Eye size={18} />}
        </button>
      }
    />
  );
}

function SubmitButton({
  children,
  pending,
  pendingLabel,
}: {
  children: React.ReactNode;
  pending: boolean;
  pendingLabel: string;
}) {
  return (
    <Button
      type="submit"
      disabled={pending}
      className="h-11 w-full rounded-lg bg-[#11a77a] text-sm font-semibold hover:bg-[#0d966d]"
    >
      {pending ? pendingLabel : children}
    </Button>
  );
}

function ShowcasePanel() {
  const [activeSlide, setActiveSlide] = useState(0);
  const t = useTranslations("RecruiterAuth");

  const slides = [
    {
      image: "/login/recruiter-login.svg",
      title: t("showcase.slide1Title"),
      description: t("showcase.slide1Description"),
    },
    {
      image: "/login/recuiter-login-2.svg",
      title: t("showcase.slide2Title"),
      description: t("showcase.slide2Description"),
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  const handlePrev = () => {
    setActiveSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  return (
    <section className="hidden bg-white px-10 py-12 lg:flex lg:flex-col lg:items-center lg:justify-center">
      {/* Sliding Images Container */}
      <div className="relative mb-2 h-[380px] w-full max-w-[480px] overflow-hidden">
        <div
          className="flex h-full w-full transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${activeSlide * 100}%)` }}
        >
          {slides.map((slide, index) => (
            <div key={index} className="relative h-full w-full flex-shrink-0">
              <Image
                src={slide.image}
                alt={slide.title}
                fill
                className="object-contain"
                sizes="480px"
                priority={index === 0}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Controller & Sliding Texts Container */}
      <div className="grid w-full grid-cols-[42px_1fr_42px] items-center gap-5">
        <Button
          variant="outline"
          size="icon"
          className="size-9 rounded-full border-slate-200 bg-white text-slate-700 shadow-none hover:bg-slate-50"
          aria-label={t("showcase.prev")}
          onClick={handlePrev}
        >
          <CaretLeft size={17} />
        </Button>
        <div className="relative min-h-[120px] w-full overflow-hidden text-center">
          <div
            className="flex w-full transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${activeSlide * 100}%)` }}
          >
            {slides.map((slide, index) => (
              <div key={index} className="w-full flex-shrink-0 px-2">
                <h2 className="text-xl font-bold text-slate-950">{slide.title}</h2>
                <p className="mt-4 text-sm leading-6 text-slate-500">{slide.description}</p>
              </div>
            ))}
          </div>
        </div>
        <Button
          variant="outline"
          size="icon"
          className="size-9 rounded-full border-slate-200 bg-white text-slate-700 shadow-none hover:bg-slate-50"
          aria-label={t("showcase.next")}
          onClick={handleNext}
        >
          <CaretRight size={17} />
        </Button>
      </div>

      {/* Slide Indicators */}
      <div className="mt-4 flex gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            type="button"
            className={`h-2 rounded-full transition-all duration-300 ${
              index === activeSlide ? "w-6 bg-emerald-600" : "w-2 bg-slate-300"
            }`}
            onClick={() => setActiveSlide(index)}
            aria-label={`Đi tới slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
